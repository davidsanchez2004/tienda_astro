import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  try {
    const categoryId = url.searchParams.get('categoria');
    const featured = url.searchParams.get('destacados');
    const limit = parseInt(url.searchParams.get('limite') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabaseAdminClient
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (categoryId) {
      // Usar contiene (contains) para arrays UUID
      query = query.contains('category_ids', [categoryId]);
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    const onOffer = url.searchParams.get('oferta');
    if (onOffer === 'true') {
      query = query.eq('on_offer', true);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        products: data || [],
        total: count,
        limit,
        offset,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
