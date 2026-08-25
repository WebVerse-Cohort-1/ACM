import { useEffect } from 'react';

/**
 * Sets page metadata (title, description, OG tags, canonical URL, JSON-LD).
 * Returns null — no DOM rendered.
 */
const SEO = ({
  title,
  description,
  keywords,
  url,
  type = 'website',
  image = '/logo.png',
  structuredData,
}) => {
  useEffect(() => {
    if (title) document.title = title;

    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLinkTag = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords || 'ACM, TSEC, Technology, Engineering, Students, Hackathons, Workshops');
    setLinkTag('canonical', url || window.location.href);

    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:url', url || window.location.href);
    setMetaTag('property', 'og:type', type);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    if (structuredData) {
      let scriptEl = document.querySelector('script[id="seo-structured-data"]');
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = 'seo-structured-data';
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.text = JSON.stringify(structuredData);
    }

    return () => {
      const scriptEl = document.querySelector('script[id="seo-structured-data"]');
      if (scriptEl) document.head.removeChild(scriptEl);
    };
  }, [title, description, image, url, type, keywords, structuredData]);

  return null;
};

export default SEO;
