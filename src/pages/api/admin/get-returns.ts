import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify admin authentication
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    // Fetch all returns with their items
    const { data: returns, error } = await supabaseAdminClient
      .from('returns')
      .select('*, return_items(id, order_item_id, product_id, product_name, quantity, price, reason)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Error al obtener devoluciones');
    }

    return new Response(
      JSON.stringify({
        success: true,
        returns: returns || [],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in get-returns:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Error desconocido',
      }),
      { status: 500 }
    );
  }
};
