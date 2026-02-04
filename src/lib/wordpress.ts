import type {
  WordPressPost,
  WordPressPage,
  WordPressCategory,
  WordPressTag,
  WordPressMedia,
  WordPressAuthor,
  WordPressConfig,
  PostParams,
  PageParams,
  WordPressAPIResponse,
  CacheEntry,
  CacheOptions,
} from './types';

// Constants
export const POSTS_PER_PAGE = 10;

class WordPressAPI {
  private config: WordPressConfig;
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor(config: WordPressConfig) {
    this.config = config;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.config.username && this.config.password) {
      const credentials = btoa(`${this.config.username}:${this.config.password}`);
      headers.Authorization = `Basic ${credentials}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  private getCacheKey(endpoint: string, params: any = {}): string {
    return `${endpoint}-${JSON.stringify(params)}`;
  }

  private isValidCache<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.config.cacheTimeout): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
    });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && this.isValidCache(entry)) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private buildUrl(endpoint: string, params: Record<string, any> = {}): string {
    const url = new URL(`${this.config.baseUrl}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else {
          url.searchParams.set(key, value.toString());
        }
      }
    });
    return url.toString();
  }

  async getPosts(params: PostParams = {}, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressPost[]>> {
    try {
      const cacheKey = this.getCacheKey('posts', params);
      const cached = this.getCache<WordPressPost[]>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl('posts', params);
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const posts = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, posts, ttl);
      
      return { 
        data: posts,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getPost(id: number | string, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressPost>> {
    try {
      const cacheKey = this.getCacheKey('post', { id });
      const cached = this.getCache<WordPressPost>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl(`posts/${id}`);
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const post = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, post, ttl);
      
      return { data: post };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getPostBySlug(slug: string, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressPost>> {
    try {
      const response = await this.getPosts({ slug, per_page: 1 }, cacheOptions);
      
      if (response.error) {
        return response as unknown as WordPressAPIResponse<WordPressPost>;
      }

      const posts = response.data;
      if (!posts || posts.length === 0) {
        return {
          error: {
            code: 'NOT_FOUND',
            message: `Post with slug "${slug}" not found`,
          },
        };
      }

      return { data: posts[0] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getPages(params: PageParams = {}, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressPage[]>> {
    try {
      const cacheKey = this.getCacheKey('pages', params);
      const cached = this.getCache<WordPressPage[]>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl('pages', params);
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const pages = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, pages, ttl);
      
      return { data: pages };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getPage(id: number | string, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressPage>> {
    try {
      const cacheKey = this.getCacheKey('page', { id });
      const cached = this.getCache<WordPressPage>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl(`pages/${id}`);
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const page = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, page, ttl);
      
      return { data: page };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getPageBySlug(slug: string, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressPage>> {
    try {
      const response = await this.getPages({ slug, per_page: 1 }, cacheOptions);
      
      if (response.error) {
        return response as unknown as WordPressAPIResponse<WordPressPage>;
      }

      const pages = response.data;
      if (!pages || pages.length === 0) {
        return {
          error: {
            code: 'NOT_FOUND',
            message: `Page with slug "${slug}" not found`,
          },
        };
      }

      return { data: pages[0] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getCategories(cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressCategory[]>> {
    try {
      const cacheKey = this.getCacheKey('categories');
      const cached = this.getCache<WordPressCategory[]>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl('categories', { per_page: 100 });
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const categories = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, categories, ttl);
      
      return { data: categories };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getTags(cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressTag[]>> {
    try {
      const cacheKey = this.getCacheKey('tags');
      const cached = this.getCache<WordPressTag[]>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl('tags', { per_page: 100 });
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tags = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, tags, ttl);
      
      return { data: tags };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getMedia(id: number, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressMedia>> {
    try {
      const cacheKey = this.getCacheKey('media', { id });
      const cached = this.getCache<WordPressMedia>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl(`media/${id}`);
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const media = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, media, ttl);
      
      return { data: media };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getAuthor(id: number, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<WordPressAuthor>> {
    try {
      const cacheKey = this.getCacheKey('author', { id });
      const cached = this.getCache<WordPressAuthor>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl(`users/${id}`);
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const author = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, author, ttl);
      
      return { data: author };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  async getCustomPostType(type: string, params: any = {}, cacheOptions: CacheOptions = {}): Promise<WordPressAPIResponse<any[]>> {
    try {
      const cacheKey = this.getCacheKey(type, params);
      const cached = this.getCache<any[]>(cacheKey);
      
      if (cached) {
        return { data: cached };
      }

      const url = this.buildUrl(type, params);
      const response = await this.fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const ttl = cacheOptions.ttl || this.config.cacheTimeout;
      this.setCache(cacheKey, data, ttl);
      
      return { data };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          data: error,
        },
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create and export a singleton instance
const wpConfig: WordPressConfig = {
  baseUrl: import.meta.env.WORDPRESS_API_URL || 'https://your-wordpress-site.com/wp-json/wp/v2',
  username: import.meta.env.WORDPRESS_USERNAME,
  password: import.meta.env.WORDPRESS_PASSWORD,
  cacheTimeout: parseInt(import.meta.env.CACHE_TIMEOUT || '900'),
};

export const wp = new WordPressAPI(wpConfig);
export { WordPressAPI };

// ============================================
// Helper Functions for Categories
// ============================================

// Cache for category map to avoid repeated API calls
let categoryMapCache: Map<number, WordPressCategory> | null = null;
let categoryMapCacheTime: number = 0;
const CATEGORY_CACHE_TTL = 300000; // 5 minutes

/**
 * Get categories as a map for quick lookup by ID
 */
export async function getCategoryMap(): Promise<Map<number, WordPressCategory>> {
  const now = Date.now();
  
  // Return cached map if still valid
  if (categoryMapCache && (now - categoryMapCacheTime) < CATEGORY_CACHE_TTL) {
    return categoryMapCache;
  }
  
  const response = await wp.getCategories();
  const categories = response.data || [];
  categoryMapCache = new Map(categories.map(cat => [cat.id, cat]));
  categoryMapCacheTime = now;
  
  return categoryMapCache;
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<WordPressCategory[]> {
  const response = await wp.getCategories();
  return response.data || [];
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<WordPressCategory | null> {
  const categories = await getAllCategories();
  return categories.find(cat => cat.slug === slug) || null;
}

/**
 * Get posts by category slug with pagination info
 */
export async function getPostsByCategorySlug(
  categorySlug: string,
  params: PostParams = {}
): Promise<{ posts: WordPressPost[], category: WordPressCategory | null, total: number }> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    return { posts: [], category: null, total: 0 };
  }
  
  const response = await wp.getPosts({
    ...params,
    categories: [category.id],
    status: 'publish'
  });
  
  return {
    posts: response.data || [],
    category,
    total: response.data?.length || 0
  };
}

/**
 * Get all posts with pagination
 */
export async function getAllPosts(params: PostParams = {}): Promise<WordPressPost[]> {
  const response = await wp.getPosts({
    per_page: 100,
    status: 'publish',
    ...params
  });
  return response.data || [];
}

/**
 * Resolve category IDs to category objects for a post
 */
export function resolvePostCategories(
  post: WordPressPost,
  categoryMap: Map<number, WordPressCategory>
): WordPressCategory[] {
  return post.categories
    .map(id => categoryMap.get(id))
    .filter((cat): cat is WordPressCategory => cat !== undefined);
}

/**
 * Create search index data from posts
 */
export async function createSearchIndex(posts: WordPressPost[]): Promise<Array<{
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  categories: string[];
}>> {
  const categoryMap = await getCategoryMap();
  
  return posts.map(post => ({
    id: post.id,
    slug: post.slug,
    title: post.title.rendered.replace(/<[^>]*>/g, ''),
    excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 200),
    date: post.date,
    categories: resolvePostCategories(post, categoryMap).map(cat => cat.name),
  }));
}

/**
 * Featured Image type for Open Graph
 */
export interface FeaturedImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

/**
 * Get featured image details for a post
 * Returns null if no featured image is set
 */
export async function getFeaturedImage(mediaId: number): Promise<FeaturedImage | null> {
  if (!mediaId || mediaId === 0) {
    return null;
  }
  
  try {
    const response = await wp.getMedia(mediaId);
    if (response.error || !response.data) {
      return null;
    }
    
    const media = response.data;
    return {
      url: media.source_url,
      alt: media.alt_text || media.title.rendered.replace(/<[^>]*>/g, ''),
      width: media.media_details?.width,
      height: media.media_details?.height,
      mimeType: media.mime_type,
    };
  } catch (error) {
    console.error('Error fetching featured image:', error);
    return null;
  }
}