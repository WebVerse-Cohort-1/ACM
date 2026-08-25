# ACM TSEC API Reference

The backend server is built with Express and is located in the `api/` package. It runs on port `3001` by default.

## Endpoints

### 1. `POST /registrations`
Saves an event registration securely into Sanity without exposing the write token to the browser.
- **Body Params**: `name`, `email`, `eventSlug`, `phone`, `college`, `branch`, `year`, `team`, `members`, `message`
- **Response**: `{ success: true, id: <Sanity Document ID> }`

### 2. `POST /messages`
Saves a contact form message securely to Sanity.
- **Body Params**: `name`, `email`, `message`
- **Response**: `{ success: true, id: <Sanity Document ID> }`

### 3. `POST /upload`
Uploads a multipart form file directly into Google Drive and makes it publicly readable.
- **Body**: `multipart/form-data` containing `file`
- **Response**: `{ success: true, fileId: <Google Drive File ID> }`
- **Note**: Requires `GOOGLE_DRIVE_FOLDER_ID` and `credentials.json`.

### 4. `POST /submit-quiz`
Saves a user's quiz submission to Sanity and backs it up as a row in Google Sheets.
- **Body Params**: `quizId`, `quizTitle`, `eventSlug`, `participantId`, `answers` (JSON array)
- **Response**: `{ success: true, submissionId: <Sanity Document ID> }`
- **Note**: Will dynamically create a new tab in Google Sheets named after the `eventSlug` if it doesn't exist.

### 5. `POST /verify-sheet`
Verifies that the Google Service Account has access to the provided Spreadsheet ID.
- **Body Params**: `spreadsheetId`
- **Response**: `{ success: true, message: "..." }`

### 6. `POST /backup`
Triggered by the Backup & Restore tool in Sanity Studio. Synchronizes Sanity data to Google Sheets tabs.
- **Body Params**: None
- **Response**: `{ success: true, message: "Backup completed successfully." }`

### 7. `POST /restore`
Triggered by the Backup & Restore tool in Sanity Studio. Merges data from Google Sheets into the Sanity dataset.
- **Body Params**: None
- **Response**: `{ success: true, message: "Restore completed successfully." }`
