import { useState, useEffect } from 'react';
import { sanityFetch } from '../lib/sanity';

/**
 * Hook for loading content live from Sanity Studio only.
 */
export function useSanityData(query, params = {}, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    sanityFetch(query, params)
      .then((res) => {
        if (isMounted) {
          setData(res !== null ? res : initialData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query, JSON.stringify(params)]);

  return { data, loading, error };
}
