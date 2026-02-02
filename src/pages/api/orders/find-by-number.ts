import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const orderNumber = url.searchParams.get('orderNumber');
    const email = url.searchParams.get('email');

    if (!orderNumber || !email) {
      return new Response(
        JSON.stringify({ error: 'Número de pedido y email son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar el pedido por número de orden o ID
    const { data: order, error: orderError } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .or(`id.eq.${orderNumber},orderNumber.eq.${orderNumber}`)
      .eq('guest_email', email.toLowerCase())
      .single();

    if (orderError || !order) {
      // Intentar buscar solo por ID si el número de orden no coincide
      const { data: orderById, error: orderByIdError } = await supabaseAdminClient
        .from('orders')
        .select('*')
        .eq('id', orderNumber)
        .single();

      if (orderByIdError || !orderById) {
        return new Response(
          JSON.stringify({ error: 'Pedido no encontrado. Verifica el número de pedido y el email.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verificar email
      if (orderById.guest_email?.toLowerCase() !== email.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: 'El email no coincide con el pedido' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, order: orderById }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, order }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error finding order:', err);
    return new Response(
      JSON.stringify({ error: 'Error al buscar el pedido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
