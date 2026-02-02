import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
    }

    const { email, orderId } = await request.json();

    if (!email || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Email y número de orden son requeridos' }),
        { status: 400 }
      );
    }

    // Buscar orden
    const { data: order, error: orderError } = await supabaseAdminClient
      .from('orders')
      .select(`
        id,
        checkout_type,
        guest_email,
        guest_first_name,
        guest_last_name,
        guest_phone,
        total,
        status,
        created_at,
        updated_at,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
        tracking_number,
        carrier
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Orden no encontrada' }),
        { status: 404 }
      );
    }

    // Verificar que el email coincida (para invitados)
    if (order.checkout_type === 'guest') {
      if (order.guest_email?.toLowerCase() !== email.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: 'Email no coincide con la orden' }),
          { status: 401 }
        );
      }
    }

    // Obtener items de la orden
    const { data: items, error: itemsError } = await supabaseAdminClient
      .from('order_items')
      .select(`
        id,
        product_id,
        quantity,
        price,
        products(name, image_url)
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
    }

    // Formatear respuesta
    const formattedOrder = {
      ...order,
      items: items?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.products?.name || 'Producto desconocido',
        image_url: item.products?.image_url || null,
      })) || [],
      customerName: order.guest_first_name 
        ? `${order.guest_first_name} ${order.guest_last_name}`
        : 'Cliente',
    };

    return new Response(
      JSON.stringify({ success: true, order: formattedOrder }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Tracking error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error al buscar orden',
      }),
      { status: 500 }
    );
  }
};
