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

    // Fetch all orders with their items
    const { data: orders, error: ordersError } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Orders error details:', ordersError);
      throw new Error(`Error al obtener órdenes: ${ordersError.message}`);
    }

    // Get items for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabaseAdminClient
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        return {
          ...order,
          items: items || [],
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        orders: ordersWithItems,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in get-orders:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Error desconocido',
      }),
      { status: 500 }
    );
  }
};
