/**
 * Centralized Site Configuration
 * 
 * All site-wide configuration values are read from environment variables
 * with sensible defaults for development.
 */

export interface SiteConfig {
  // Basic Info
  title: string;
  description: string;
  keywords: string;
  author: string;
  url: string;
  
  // Social
  twitterHandle: string;
  
  // SEO
  defaultOgImage: string;
  
  // Computed
  currentYear: number;
  copyrightText: string;
}

const currentYear = new Date().getFullYear();
const startYear = 2017;

export const siteConfig: SiteConfig = {
  // Basic Info - read from environment variables
  title: import.meta.env.SITE_TITLE || 'My Blog',
  description: import.meta.env.SITE_DESCRIPTION || 'A personal blog',
  keywords: import.meta.env.SITE_KEYWORDS || '',
  author: import.meta.env.SITE_AUTHOR || 'Anonymous',
  url: import.meta.env.SITE_URL || 'http://localhost:4321',
  
  // Social
  twitterHandle: import.meta.env.TWITTER_HANDLE || '',
  
  // SEO
  defaultOgImage: import.meta.env.DEFAULT_OG_IMAGE || '/images/og-default.jpg',
  
  // Computed values
  currentYear,
  copyrightText: currentYear > startYear 
    ? `${startYear}-${currentYear}` 
    : String(startYear),
};

// Export individual values for convenience
export const { 
  title, 
  description, 
  keywords, 
  author, 
  url, 
  twitterHandle, 
  defaultOgImage,
  currentYear: year,
  copyrightText,
} = siteConfig;
