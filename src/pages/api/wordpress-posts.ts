import type { APIRoute } from 'astro';
import { wp } from '../../lib/wordpress';
import type { WordPressPost } from '../../lib/types';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const categoryId = searchParams.get('category');

    // Build WordPress API query
    let query: any = {
      per_page: 100,
      status: 'publish'
    };

    if (categoryId && categoryId !== '') {
      query.categories = parseInt(categoryId);
    }

    // Fetch posts from WordPress
    const postsResponse = await wp.getPosts(query);
    const allPosts: WordPressPost[] = postsResponse.data || [];

    // Sort by date in descending order (newest first)
    allPosts.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const paginatedPosts = allPosts.slice(offset, offset + limit);

    // Transform posts for frontend
    const transformedPosts = paginatedPosts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      categories: post.categories || [],
      tags: post.tags || [],
      featured_media: post.featured_media
    }));

    return new Response(JSON.stringify({
      posts: transformedPosts,
      total: allPosts.length,
      offset: offset,
      limit: limit,
      hasMore: offset + limit < allPosts.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch posts',
      posts: [],
      total: 0,
      hasMore: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};