// src/lib/sanity.js
// Sanity client configured for ACM TSEC (gx7rj7pk / production)
// This app uses Vite — use VITE_ prefix for client-safe env vars.
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'gx7rj7pk',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2026-06-25',
  useCdn: true, // serve from edge cache for public reads
});

// Client for mutations (requires a token with write access)
// IMPORTANT: Only use this server-side or if you are safely passing the token
export const writeClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'gx7rj7pk',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2026-06-25',
  token: import.meta.env.VITE_SANITY_API_TOKEN, // Set this in your .env file
  useCdn: false, // mutations shouldn't be cached
});

// Image URL builder
const builder = imageUrlBuilder(client);

/**
 * Get a Sanity image URL helper.
 * Usage: sanityImage(source).width(800).url()
 */
export function sanityImage(source) {
  return builder.image(source);
}

/**
 * Convenience fetch that returns null on error instead of throwing.
 */
export async function sanityFetch(query, params = {}) {
  try {
    return await client.fetch(query, params);
  } catch (err) {
    console.error('[sanity] fetch error:', err);
    return null;
  }
}

/**
 * Helper to create a new document in Sanity
 * @param {Object} documentData - The document data to create
 */
export async function createDocument(documentData) {
  try {
    const result = await writeClient.create(documentData)
    console.log('Document created:', result)
    return result
  } catch (error) {
    console.error('Error creating document:', error)
    throw error
  }
}

/**
 * Uploads a file to the custom Google Drive API backend, gets the Drive File ID,
 * and saves the final document data to Sanity.
 * 
 * @param {File} file - The file to upload (from an <input type="file" />)
 * @param {Object} documentData - The document to create in Sanity
 * @param {string} driveIdFieldName - The field name in Sanity to store the Drive ID (e.g. 'driveProfilePictureId')
 */
export async function uploadToDriveAndSaveToSanity(file, documentData, driveIdFieldName) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // 1. Upload to our local Node.js Express server
    // Note: Adjust the URL if your API runs on a different port/host in production
    const uploadRes = await fetch('http://localhost:3001/upload', {
      method: 'POST',
      body: formData
    })

    if (!uploadRes.ok) {
      throw new Error(`Upload API failed with status ${uploadRes.status}`)
    }

    const uploadData = await uploadRes.json()
    const fileId = uploadData.fileId

    if (!fileId) {
      throw new Error('No fileId returned from Google Drive upload API')
    }

    // 2. Attach the Drive File ID to the document data
    const finalDocumentData = {
      ...documentData,
      [driveIdFieldName]: fileId
    }

    // 3. Save to Sanity
    return await createDocument(finalDocumentData)
    
  } catch (error) {
    console.error('Error uploading to drive and saving to sanity:', error)
    throw error
  }
}