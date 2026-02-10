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

    let dbQuery = supabaseAdminClient
      .from('products')
      .select('*', { count: 'exact' })
      .eq('active', true);

    // Text search
    if (query) {
      dbQuery = dbQuery.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`
      );
    }

    // Category filter
    if (categoryId) {
      dbQuery = dbQuery.contains('category_ids', [categoryId]);
    }

    // Price range
    if (minPrice) {
      dbQuery = dbQuery.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      dbQuery = dbQuery.lte('price', parseFloat(maxPrice));
    }

    // Offer filter
    if (onOffer === 'true') {
      dbQuery = dbQuery.eq('on_offer', true);
    }

    // Sorting
    const validSort = ['price', 'name', 'created_at'].includes(sortBy) ? sortBy : 'created_at';
    dbQuery = dbQuery.order(validSort, { ascending: sortDir === 'asc' });

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
        query,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
