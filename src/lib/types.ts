// WordPress API Types
export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: Record<string, any>;
  categories: number[];
  tags: number[];
  _links: Record<string, any>;
}

export interface WordPressPage {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: Record<string, any>;
  parent: number;
  menu_order: number;
  _links: Record<string, any>;
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: Record<string, any>;
  _links: Record<string, any>;
}

export interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  meta: Record<string, any>;
  _links: Record<string, any>;
}

export interface WordPressMedia {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: Record<string, any>;
  description: {
    rendered: string;
  };
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: Record<string, {
      file: string;
      width: number;
      height: number;
      mime_type: string;
      source_url: string;
    }>;
    image_meta: Record<string, any>;
  };
  source_url: string;
  _links: Record<string, any>;
}

export interface WordPressAuthor {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: Record<string, string>;
  meta: Record<string, any>;
  _links: Record<string, any>;
}

// Application Types
export interface PostParams {
  page?: number;
  per_page?: number;
  search?: string;
  author?: number;
  categories?: number[];
  tags?: number[];
  slug?: string;
  status?: string;
  orderby?: string;
  order?: 'asc' | 'desc';
  before?: string;
  after?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  sticky?: boolean;
}

export interface PageParams {
  page?: number;
  per_page?: number;
  search?: string;
  author?: number;
  slug?: string;
  status?: string;
  orderby?: string;
  order?: 'asc' | 'desc';
  parent?: number;
  exclude?: number[];
  include?: number[];
  menu_order?: number;
  offset?: number;
}

export interface WordPressConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  cacheTimeout: number;
}

export interface SEOData {
  title: string;
  description: string;
  image?: string;
  article?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  canonicalUrl?: string;
}

export interface SiteConfig {
  title: string;
  description: string;
  url: string;
  author: string;
  twitter?: string;
  image?: string;
}

export interface NavigationItem {
  title: string;
  href: string;
  external?: boolean;
  children?: NavigationItem[];
}

export interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
  honeypot?: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  defaultTheme: Theme;
  enableSystemTheme: boolean;
  enableToggle: boolean;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  data?: any;
}

export interface WordPressAPIResponse<T> {
  data?: T;
  error?: APIError;
  headers?: Record<string, string>;
}