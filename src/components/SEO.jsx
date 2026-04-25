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
  type = 'website' 
}) => {
  const siteName = 'Primkart Kitchenware';
  const fullTitle = title ? `${title} | ${siteName}` : 'Primkart Kitchenware – Premium Kitchenware Store';
  const defaultDesc = 'Shop premium kitchenware, cookware and accessories at Primkart Kitchenware. Leading kitchenware distributor in Bangalore.';

  useEffect(() => {
    // Update Document Title
    document.title = fullTitle;

    // Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || defaultDesc);
    }

    // Update OpenGraph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description || defaultDesc);

    if (image) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) ogImg.setAttribute('content', image);
    }

    if (url) {
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', url);
    }

    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute('content', type);

  }, [title, description, image, url, type, fullTitle, defaultDesc]);

  return null; // Side-effect only component
};
