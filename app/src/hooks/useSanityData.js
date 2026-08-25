import { useState, useEffect } from 'react';
import sanityData from '../lib/sanityData.json';

/**
 * Resolves query data locally and instantly from the pre-built JSON file.
 */
function resolveLocalData(query, params) {
  if (!query) return null;

  try {
    if (query.includes('_type == "event"')) {
      if (params.slug) {
        return (sanityData.events || []).find(e => e.slug === params.slug) || null;
      }
      return sanityData.events || [];
    }

    if (query.includes('_type == "member"')) {
      return sanityData.members || [];
    }

    if (query.includes('_type == "about"')) {
      return sanityData.about || null;
    }

    if (query.includes('_type == "gallery"')) {
      if (params.slug) {
        return (sanityData.gallery || []).filter(g => g.eventSlug === params.slug);
      }
      return sanityData.gallery || [];
    }
  } catch (e) {
    console.error('[sanityData] Error resolving local data:', e);
  }

  return null;
}

/**
 * Hook for loading static content instantly from the locally bundled sanityData.json file,
 * providing zero-latency loading and excellent scalability.
 */
export function useSanityData(query, params = {}, initialData = null) {
  const [data, setData] = useState(() => {
    return resolveLocalData(query, params) || initialData;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(resolveLocalData(query, params) || initialData);
  }, [query, JSON.stringify(params), initialData]);

  return { data, loading, error };
}

