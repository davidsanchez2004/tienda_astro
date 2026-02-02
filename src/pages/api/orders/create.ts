import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { items, customer, shipping_method, shipping_cost, subtotal, total } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'El carrito está vacío' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return new Response(JSON.stringify({ error: 'Faltan datos del cliente' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Split name into first and last name
    const nameParts = customer.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build shipping address JSON
    const shippingAddress = shipping_method === 'delivery' 
      ? {
          street: customer.address || '',
          city: customer.city || '',
          postal_code: customer.postalCode || '',
          country: 'Spain'
        }
      : {
          type: 'pickup',
          location: 'Punto de recogida BY ARENA'
        };

    // Create order
    const { data: order, error: orderError } = await supabaseAdminClient
      .from('orders')
      .insert({
        user_id: null, // Guest order
        status: 'pending',
        subtotal: subtotal,
        shipping_cost: shipping_cost,
        total: total,
        shipping_option: shipping_method === 'delivery' ? 'home' : 'pickup',
        shipping_address: shippingAddress,
        checkout_type: 'guest',
        guest_email: customer.email,
        guest_phone: customer.phone,
        guest_first_name: firstName,
        guest_last_name: lastName,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(JSON.stringify({ error: 'Error al crear el pedido: ' + orderError.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }));

    const { error: itemsError } = await supabaseAdminClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      message: 'Pedido creado correctamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error del servidor' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
