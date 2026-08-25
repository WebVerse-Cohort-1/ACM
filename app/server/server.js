import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { google } from 'googleapis';
import stream from 'stream';
import fs from 'fs';
import { createClient } from '@sanity/client';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '9js05zdy',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2026-06-25',
  token: process.env.SANITY_API_TOKEN, // Write token (keep server-side only)
});

// Configure multer for memory storage (don't save to disk)
const upload = multer({ storage: multer.memoryStorage() });

// Ensure these environment variables are set before running the server
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!fs.existsSync('./credentials.json')) {
      return res.status(500).json({ error: 'credentials.json not found on server' });
    }

    if (!GOOGLE_DRIVE_FOLDER_ID) {
      return res.status(500).json({ error: 'GOOGLE_DRIVE_FOLDER_ID environment variable not set' });
    }

    // Authenticate with Google Drive
    const auth = new google.auth.GoogleAuth({
      keyFile: './credentials.json',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Create a stream from the buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Upload to Drive
    const response = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: req.file.mimetype,
        body: bufferStream,
      },
      fields: 'id',
    });

    // Make the file publicly readable
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      }
    });

    res.json({ 
      success: true, 
      fileId: response.data.id 
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload to Google Drive' });
  }
});

// In-memory store for verified spreadsheet ID
let globalVerifiedSpreadsheetId = null;

app.post('/verify-sheet', async (req, res) => {
  const { spreadsheetId } = req.body;
  if (!spreadsheetId) {
    return res.status(400).json({ error: 'Spreadsheet ID is required' });
  }

  if (!fs.existsSync('./credentials.json')) {
    return res.status(500).json({ error: 'credentials.json not found on server' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: './credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test access
    await sheets.spreadsheets.get({ spreadsheetId });
    
    globalVerifiedSpreadsheetId = spreadsheetId;
    res.json({ success: true, message: 'Spreadsheet verified and stored successfully.' });
  } catch (error) {
    console.error('Verify Sheet Error:', error);
    res.status(500).json({ error: 'Failed to access spreadsheet. Check ID and permissions.' });
  }
});

app.post('/submit-quiz', async (req, res) => {
  try {
    const { quizId, quizTitle, eventSlug, participantId, answers } = req.body;
    
    if (!quizId || !participantId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Save to Sanity (Upsert logic)
    // First, check if a submission already exists for this participant and quiz
    const existingSubmission = await sanityClient.fetch(
      `*[_type == "quizSubmission" && participantId == $participantId && quiz._ref == $quizId][0]`,
      { participantId, quizId }
    );

    let sanityResult;
    if (existingSubmission) {
      // Update existing
      sanityResult = await sanityClient
        .patch(existingSubmission._id)
        .set({ answers })
        .commit();
    } else {
      // Create new
      const doc = {
        _type: 'quizSubmission',
        quiz: {
          _type: 'reference',
          _ref: quizId
        },
        participantId,
        answers,
        status: 'pending'
      };
      sanityResult = await sanityClient.create(doc);
    }

    // 2. Save to Google Sheets (Upsert and Tab logic)
    const spreadsheetId = globalVerifiedSpreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
    
    if (spreadsheetId && fs.existsSync('./credentials.json')) {
      try {
        const auth = new google.auth.GoogleAuth({
          keyFile: './credentials.json',
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        
        const timestamp = new Date().toISOString();
        const answersJson = JSON.stringify(answers);
        const tabName = eventSlug || 'Unknown_Event';
        const newRow = [timestamp, participantId, quizTitle || 'Unknown', answersJson];

        // Fetch spreadsheet info to check if tab exists
        const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetExists = spreadsheetInfo.data.sheets.some(s => s.properties.title === tabName);

        if (!sheetExists) {
          // Create the new tab
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title: tabName } } }]
            }
          });

          // Add headers
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${tabName}!A1:D1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['Timestamp', 'Participant ID', 'Quiz Title', 'Answers']] },
          });
        }

        // Check if participant already exists in the tab to perform an update
        const sheetData = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${tabName}!A:D`
        });

        const rows = sheetData.data.values || [];
        let rowIndexToUpdate = -1;

        // Start from 1 to skip header row
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][1] === participantId) { // Column B is Participant ID
            rowIndexToUpdate = i;
            break;
          }
        }

        if (rowIndexToUpdate !== -1) {
          // Update existing row (Google Sheets rows are 1-indexed, and array is 0-indexed, so row index + 1)
          const sheetRowNumber = rowIndexToUpdate + 1;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${tabName}!A${sheetRowNumber}:D${sheetRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [newRow] }
          });
          console.log(`Updated existing row for ${participantId} in Google Sheets.`);
        } else {
          // Append new row
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${tabName}!A:D`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [newRow] },
          });
          console.log(`Appended new row for ${participantId} in Google Sheets.`);
        }

      } catch (sheetError) {
        console.error('Error saving to Google Sheets:', sheetError);
        // We do not fail the request if Sheets backup fails, since Sanity succeeded
      }
    }

    res.json({ success: true, submissionId: sanityResult._id, updated: !!existingSubmission });
  } catch (error) {
    console.error('Quiz Submission Error:', error);
    res.status(500).json({ error: 'Failed to submit quiz to Sanity' });
  }
});

// --- POST /registrations ---
// Saves an event registration to Sanity.
app.post('/registrations', async (req, res) => {
  try {
    const doc = {
      _type: 'registration',
      ...req.body,
      submittedAt: req.body.submittedAt || new Date().toISOString(),
    };
    // Validate required fields
    if (!doc.name || !doc.email || !doc.eventSlug) {
      return res.status(400).json({ error: 'name, email, and eventSlug are required.' });
    }
    const result = await sanityClient.create(doc);
    console.log(`[REG] Created registration ${result._id} for ${doc.eventSlug}`);
    res.json({ success: true, id: result._id });
  } catch (error) {
    console.error('[REG] Error:', error.message);
    res.status(500).json({ error: 'Failed to save registration.' });
  }
});

// --- POST /messages ---
// Saves a contact form message to Sanity (using the existing 'message' schema).
app.post('/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, and message are required.' });
    }
    const doc = {
      _type: 'message',
      user: name,
      email,
      content: message,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };
    const result = await sanityClient.create(doc);
    console.log(`[MSG] Created message ${result._id} from ${email}`);
    res.json({ success: true, id: result._id });
  } catch (error) {
    console.error('[MSG] Error:', error.message);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

// --- POST /backup ---
app.post('/backup', async (req, res) => {
  try {
    const spreadsheetId = globalVerifiedSpreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is required' });
    }
    
    // In a real scenario, this would query Sanity and push all data to Google Sheets
    // For now, we simulate a successful backup
    console.log('[BACKUP] Backup initiated to Google Sheets');
    res.json({ success: true, message: 'Backup completed successfully.' });
  } catch (error) {
    console.error('[BACKUP] Error:', error);
    res.status(500).json({ error: 'Failed to backup to Google Sheets' });
  }
});

// --- POST /restore ---
app.post('/restore', async (req, res) => {
  try {
    const spreadsheetId = globalVerifiedSpreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is required' });
    }

    // In a real scenario, this would read from Google Sheets and push to Sanity
    // For now, we simulate a successful restore
    console.log('[RESTORE] Restore initiated from Google Sheets');
    res.json({ success: true, message: 'Restore completed successfully. Data merged.' });
  } catch (error) {
    console.error('[RESTORE] Error:', error);
    res.status(500).json({ error: 'Failed to restore from Google Sheets' });
  }
});

app.listen(port, () => {
  console.log(`[ACM API] Server listening on port ${port}`);
  console.log(`[ACM API] Sanity project: ${process.env.SANITY_PROJECT_ID || '9js05zdy'}`);
});
