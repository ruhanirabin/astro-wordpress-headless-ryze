/// <reference types="astro/client" />
/// <reference path="../../../.astro/types.d.ts" />

interface ImportMetaEnv {
  // WordPress Configuration
  readonly WORDPRESS_API_URL: string;
  readonly WORDPRESS_USERNAME?: string;
  readonly WORDPRESS_PASSWORD?: string;
  
  // Site Configuration
  readonly SITE_URL: string;
  readonly SITE_TITLE: string;
  readonly SITE_DESCRIPTION: string;
  readonly SITE_KEYWORDS: string;
  readonly SITE_AUTHOR: string;
  
  // Social Configuration
  readonly TWITTER_HANDLE: string;
  
  // SEO Configuration
  readonly DEFAULT_OG_IMAGE: string;
  
  // Performance Configuration
  readonly CACHE_TIMEOUT?: string;
  readonly ENABLE_CACHE?: string;
  
  // Analytics (Optional)
  readonly GOOGLE_ANALYTICS_ID?: string;
  readonly GOOGLE_TAG_MANAGER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
