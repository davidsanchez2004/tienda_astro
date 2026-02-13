import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

// Verificar si un string tiene formato UUID válido
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, orderId } = body;

    if (!email || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Email y número de orden son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Limpiar inputs
    const cleanOrderId = orderId.replace(/^#/, '').replace(/\s/g, '');
    const cleanEmail = email.trim().toLowerCase();
    
    console.log(`[Tracking] Buscando orden: prefix="${cleanOrderId}", email="${cleanEmail}"`);
    
    let order: any = null;
    
    // 1) Si parece un UUID completo, intentar búsqueda exacta
    if (isValidUUID(cleanOrderId)) {
      const { data } = await supabaseAdminClient
        .from('orders')
        .select('id, user_id, checkout_type, guest_email, guest_first_name, guest_last_name, guest_phone, subtotal, shipping_cost, total, status, payment_status, created_at, updated_at, shipping_option, shipping_address, tracking_number, carrier')
        .eq('id', cleanOrderId)
        .single();
      
      if (data) {
        order = data;
        console.log(`[Tracking] Encontrado por UUID exacto: ${order.id}`);
      }
    }
    
    // 2) Si no se encontró, buscar por email y luego filtrar por prefijo de ID
    if (!order) {
      const { data: emailOrders, error: emailError } = await supabaseAdminClient
        .from('orders')
        .select('id, user_id, checkout_type, guest_email, guest_first_name, guest_last_name, guest_phone, subtotal, shipping_cost, total, status, payment_status, created_at, updated_at, shipping_option, shipping_address, tracking_number, carrier')
        .ilike('guest_email', cleanEmail);
      
      if (emailError) {
        console.error(`[Tracking] Error buscando por email:`, emailError);
        return new Response(
          JSON.stringify({ error: 'Error interno al buscar la orden.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[Tracking] Órdenes encontradas para "${cleanEmail}": ${emailOrders?.length || 0}`);
      
      if (emailOrders && emailOrders.length > 0) {
        // Buscar la orden cuyo ID empiece con el prefijo (el cliente ve los primeros 8 chars del UUID)
        const prefixLower = cleanOrderId.toLowerCase();
        order = emailOrders.find((o: any) => o.id.toLowerCase().startsWith(prefixLower)) || null;
        
        if (order) {
          console.log(`[Tracking] Encontrado por email + prefijo ID: ${order.id}`);
        } else {
          // Debug: mostrar qué IDs hay para este email
          console.log(`[Tracking] Ningún ID empieza con "${cleanOrderId}". IDs existentes:`, 
            emailOrders.map((o: any) => o.id.substring(0, 8).toUpperCase()).join(', '));
        }
      }
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Orden no encontrada. Verifica el número de orden y email.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el email coincida
    if (order.guest_email?.toLowerCase() !== cleanEmail) {
      return new Response(
        JSON.stringify({ error: 'El email no coincide con la orden.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener items de la orden
    const { data: items } = await supabaseAdminClient
      .from('order_items')
      .select('id, product_id, quantity, price, products(name, image_url)')
      .eq('order_id', order.id);

    // Extraer dirección del campo JSONB shipping_address
    const addr = (typeof order.shipping_address === 'object' && order.shipping_address) ? order.shipping_address : {};

    // Formatear respuesta
    const formattedOrder = {
      id: order.id,
      checkout_type: order.checkout_type,
      guest_email: order.guest_email,
      guest_first_name: order.guest_first_name,
      guest_last_name: order.guest_last_name,
      total: order.total,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      tracking_number: order.tracking_number,
      carrier: order.carrier,
      shipping_option: order.shipping_option,
      // Mapear campos de dirección desde el JSONB
      shipping_address: addr.street || addr.address || '',
      shipping_city: addr.city || '',
      shipping_state: addr.state || addr.province || '',
      shipping_zip: addr.postal_code || addr.zip || '',
      shipping_country: addr.country || 'España',
      items: (items || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.products?.name || 'Producto desconocido',
        image_url: item.products?.image_url || null,
      })),
      customerName: order.guest_first_name 
        ? `${order.guest_first_name} ${order.guest_last_name || ''}`.trim()
        : 'Cliente',
    };

    return new Response(
      JSON.stringify({ success: true, order: formattedOrder }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Tracking] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al buscar orden. Por favor intenta de nuevo.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
