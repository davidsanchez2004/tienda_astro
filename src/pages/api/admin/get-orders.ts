import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verify admin authentication
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== import.meta.env.ADMIN_SECRET_KEY) {
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
