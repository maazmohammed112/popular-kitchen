import { useEffect } from 'react';

/**
 * SEO Component for dynamic metadata management.
 * Updates the document title and meta description tag.
 */
export const SEO = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  schema // Optional custom schema object
}) => {
  const siteName = 'Primkart Kitchenware';
  const fullTitle = title ? `${title} | ${siteName}` : 'Primkart Kitchenware – Premium Kitchenware Store';
  const defaultDesc = 'Shop premium kitchenware, cookware and accessories at Primkart Kitchenware. Leading kitchenware distributor in Bangalore.';
  const defaultImage = 'https://primkart.app/logo.png';
  const canonicalUrl = url || window.location.href;

  useEffect(() => {
    // 1. Update Document Title
    document.title = fullTitle;

    // 2. Update Basic Meta Tags
    const updateMeta = (selector, attr, content) => {
      let el = document.querySelector(selector);
      if (el) el.setAttribute(attr, content);
    };

    updateMeta('meta[name="description"]', 'content', description || defaultDesc);

    // 3. Update OpenGraph Tags (Facebook/AI)
    updateMeta('meta[property="og:title"]', 'content', fullTitle);
    updateMeta('meta[property="og:description"]', 'content', description || defaultDesc);
    updateMeta('meta[property="og:image"]', 'content', image || defaultImage);
    updateMeta('meta[property="og:url"]', 'content', canonicalUrl);
    updateMeta('meta[property="og:type"]', 'content', type);

    // 4. Update Twitter Card Tags (AI/Twitter)
    updateMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMeta('meta[name="twitter:title"]', 'content', fullTitle);
    updateMeta('meta[name="twitter:description"]', 'content', description || defaultDesc);
    updateMeta('meta[name="twitter:image"]', 'content', image || defaultImage);

    // 5. Inject JSON-LD Schema (Google Search/Images)
    const oldSchema = document.getElementById('json-ld-schema');
    if (oldSchema) oldSchema.remove();

    const script = document.createElement('script');
    script.id = 'json-ld-schema';
    script.type = 'application/ld+json';

    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": siteName,
      "url": "https://primkart.app",
      "logo": defaultImage,
      "sameAs": [
        "https://www.facebook.com/primkart",
        "https://www.instagram.com/primkart"
      ]
    };

    script.text = JSON.stringify(schema || defaultSchema);
    document.head.appendChild(script);

  }, [title, description, image, url, type, fullTitle, defaultDesc, schema, canonicalUrl]);

  return null;
};
