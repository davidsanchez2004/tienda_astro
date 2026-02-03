import type { APIRoute } from 'astro';
import { stripe } from '../../../lib/stripe';
import { supabaseAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const body = await request.json();
    const { items, customer, shipping_method, shipping_cost, subtotal, total, discountCode, user_id } = body;

    console.log('Create-session - Received user_id:', user_id);
    console.log('Create-session - Customer email:', customer?.email);

    // Validate
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

    // ====== VALIDACIÓN DE STOCK ======
    const productIds = items.map((item: any) => item.product_id);
    const { data: products, error: stockError } = await supabaseAdminClient
      .from('products')
      .select('id, name, stock')
      .in('id', productIds);

    if (stockError) {
      console.error('Error checking stock:', stockError);
      return new Response(JSON.stringify({ error: 'Error al verificar disponibilidad' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar stock de cada producto
    const outOfStock: string[] = [];
    const insufficientStock: { name: string; available: number; requested: number }[] = [];

    for (const item of items) {
      const product = products?.find(p => p.id === item.product_id);
      
      if (!product) {
        outOfStock.push(item.name || item.product_id);
        continue;
      }
      
      if (product.stock <= 0) {
        outOfStock.push(product.name);
      } else if (product.stock < item.quantity) {
        insufficientStock.push({
          name: product.name,
          available: product.stock,
          requested: item.quantity
        });
      }
    }

    if (outOfStock.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Productos agotados',
        outOfStock,
        message: `Los siguientes productos ya no están disponibles: ${outOfStock.join(', ')}`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (insufficientStock.length > 0) {
      const messages = insufficientStock.map(p => 
        `${p.name}: solo quedan ${p.available} unidades (pediste ${p.requested})`
      );
      return new Response(JSON.stringify({ 
        error: 'Stock insuficiente',
        insufficientStock,
        message: `Stock insuficiente: ${messages.join('; ')}`
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // ====== FIN VALIDACIÓN DE STOCK ======

    // Split name
    const nameParts = customer.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build shipping address
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

    // Create order in pending status
    console.log('Create-session - Creating order with user_id:', user_id || null);
    
    const { data: order, error: orderError } = await supabaseAdminClient
      .from('orders')
      .insert({
        user_id: user_id || null, // Usar el user_id si está logueado
        status: 'pending',
        subtotal: subtotal,
        shipping_cost: shipping_cost,
        total: total,
        shipping_option: shipping_method === 'delivery' ? 'home' : 'pickup',
        shipping_address: shippingAddress,
        checkout_type: user_id ? 'registered' : 'guest',
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
      return new Response(JSON.stringify({ error: 'Error al crear el pedido' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Create-session - Order created:', order.id, 'with user_id:', order.user_id);

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }));

    await supabaseAdminClient.from('order_items').insert(orderItems);

    // Create Stripe line items
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (shipping_cost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Envío a domicilio',
            images: [],
          },
          unit_amount: Math.round(shipping_cost * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const baseUrl = url.origin;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout-exitoso?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/carrito?cancelled=true`,
      customer_email: customer.email,
      // Metadata para la sesión de checkout
      metadata: {
        order_id: order.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
      },
      // IMPORTANTE: También pasar metadata al payment_intent para el webhook
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
        },
      },
    });

    // Update order with Stripe session ID
    await supabaseAdminClient
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url,
      orderId: order.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error al procesar el pago' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
