import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY
);

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticación de admin
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener órdenes con estado de pago
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_email,
        guest_email,
        total_amount,
        payment_status,
        refund_status,
        refund_amount,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return new Response(JSON.stringify({ orders }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
