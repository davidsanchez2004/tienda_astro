import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

// GET - Public blog posts (published only)
export const GET: APIRoute = async ({ url }) => {
  try {
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabaseAdminClient
      .from('blog_posts')
      .select('id, title, slug, excerpt, image_url, category, author, read_time, published_at, created_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({ posts: posts || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Blog list error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
