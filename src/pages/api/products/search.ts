import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get('q') || '';
    const categoryId = url.searchParams.get('categoria');
    const minPrice = url.searchParams.get('precio_min');
    const maxPrice = url.searchParams.get('precio_max');
    const onOffer = url.searchParams.get('oferta');
    const sortBy = url.searchParams.get('ordenar') || 'created_at';
    const sortDir = url.searchParams.get('direccion') || 'desc';
    const limit = parseInt(url.searchParams.get('limite') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ products: [], total: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let dbQuery = supabaseAdminClient
      .from('products')
      .select('*', { count: 'exact' })
      .eq('active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (categoryId) {
      dbQuery = dbQuery.contains('category_ids', [categoryId]);
    }

    if (minPrice) {
      dbQuery = dbQuery.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      dbQuery = dbQuery.lte('price', parseFloat(maxPrice));
    }

    if (onOffer === 'true') {
      dbQuery = dbQuery.eq('on_offer', true);
    }

    // Sort
    const validSortFields = ['created_at', 'price', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortDir === 'asc';
    dbQuery = dbQuery.order(sortField, { ascending });

    // Pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        products: data || [],
        total: count || 0,
        limit,
        offset,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
