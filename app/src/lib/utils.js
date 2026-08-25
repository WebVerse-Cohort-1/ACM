// src/lib/utils.js
// Shared utility functions for the ACM TSEC frontend

/**
 * Converts a Google Drive URL (any format) into a cacheable thumbnail URL.
 * Also handles the custom pipe-encoded crop format: "url|x|y|scale"
 */
export const getDirectDriveUrl = (url) => {
  if (!url) return '';
  const cleanUrl = url.split('|')[0];
  if (cleanUrl.includes('drive.google.com')) {
    const match =
      cleanUrl.match(/\/(?:file\/d|d|e)\/([a-zA-Z0-9_-]+)/) ||
      cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
  }
  return cleanUrl;
};

/**
 * Returns inline style for an image with optional crop info.
 * Format: "url|xPercent|yPercent|scale"
 */
export const getImageStyle = (imageStr) => {
  if (!imageStr || !imageStr.includes('|')) return { objectFit: 'cover' };
  const parts = imageStr.split('|');
  if (parts.length < 4) return { objectFit: 'cover' };
  const [, x, y, scale] = parts;
  return {
    objectFit: 'cover',
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${scale})`,
    transformOrigin: `${x}% ${y}%`,
  };
};

/**
 * Format a number with commas (e.g. 50000 → "50,000")
 */
export const formatNumber = (n) => Number(n).toLocaleString();

/**
 * The API server base URL. Change this to your production URL when deploying.
 */
export const API_BASE_URL = 'http://localhost:3001';
