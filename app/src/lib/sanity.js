// src/lib/sanity.js
// READ-ONLY Sanity client for ACM TSEC frontend.
// All write operations go through api/server.js (which holds the write token securely).
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || '9js05zdy',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: true,
});

// Image URL builder (for Sanity-native images, if used)
const builder = imageUrlBuilder(client);
export function sanityImage(source) {
  return builder.image(source);
}

/**
 * Convenience fetch — returns null on error instead of throwing.
 */
export async function sanityFetch(query, params = {}) {
  try {
    return await client.fetch(query, params);
  } catch (err) {
    console.error('[sanity] fetch error:', err);
    return null;
  }
}

// --- GROQ QUERY CONSTANTS ---
export const QUERIES = {
  ABOUT: `*[_type == "about"][0] {
    whatIsAcm, vision, mission, benefits, eventsConducted,
    homeHeading1, homeHeading2, homeHeading3, homeDesc,
    stats[] { label, value },
    legacyLogs[] { year, title, desc }
  }`,

  EVENTS: `*[_type == "event"] | order(_createdAt desc) {
    title,
    "slug": slug.current,
    category,
    dateText,
    desc,
    images,
    prizePool,
    maxTeamSize,
    eventDate,
    registrationStatus,
    customStatusText
  }`,

  EVENT_BY_SLUG: `*[_type == "event" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    category,
    dateText,
    eventDate,
    desc,
    images,
    prizePool,
    maxTeamSize,
    registrationStatus,
    customStatusText,
    tracks[] { name, desc },
    speakers[] { name, role, image, linkedin, type, link },
    faqs[] { q, a }
  }`,

  GALLERY_BY_SLUG: `*[_type == "gallery" && eventSlug == $slug] {
    src, caption
  }`,

  ALL_GALLERY: `*[_type == "gallery"] { src, caption, eventSlug }`,

  MEMBERS: `*[_type == "member"] | order(category asc, name asc) {
    _id, name, role, category, desc, linkedin,
    "image": driveProfilePictureId
  }`,

  QUIZ_BY_SLUG: `*[_type == "quiz" && eventSlug == $slug][0] {
    _id, title, durationMinutes, marksPerQuestion, negativeMarks,
    driveCoverImageId,
    questions[] { _key, text, type, options, explanation }
  }`,
};