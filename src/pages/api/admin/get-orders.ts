import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

// Función para validar el token de admin
function validateAdminToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    // Verificar que no ha expirado
    if (payload.exp && payload.exp > Date.now()) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify admin authentication - primero intentar con cookie, luego header
    const tokenFromCookie = cookies.get('admin_token')?.value;
    const tokenFromHeader = request.headers.get('x-admin-key');
    
    let isValid = false;
    
    // Validar token de cookie
    if (tokenFromCookie && validateAdminToken(tokenFromCookie)) {
      isValid = true;
    }
    // Fallback: validar con la clave secreta directa (para compatibilidad)
    else if (tokenFromHeader === import.meta.env.ADMIN_SECRET_KEY) {
      isValid = true;
    }
    // Fallback: validar token desde header
    else if (tokenFromHeader && validateAdminToken(tokenFromHeader)) {
      isValid = true;
    }
    
    if (!isValid) {
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
