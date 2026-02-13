import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

// Columnas que existen en la tabla orders
const ORDER_COLUMNS = `
  id,
  user_id,
  checkout_type,
  guest_email,
  guest_first_name,
  guest_last_name,
  guest_phone,
  subtotal,
  shipping_cost,
  total,
  status,
  payment_status,
  created_at,
  updated_at,
  shipping_option,
  shipping_address,
  tracking_number,
  carrier
`;

// Verificar si un string tiene formato UUID válido
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

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

    // Limpiar orderId - quitar # y espacios
    const cleanOrderId = orderId.replace(/^#/, '').trim();
    const cleanEmail = email.trim().toLowerCase();
    
    console.log(`[Tracking] Searching for order prefix: "${cleanOrderId}", email: "${cleanEmail}"`);
    
    let order = null;
    
    // 1) Si es un UUID completo válido, buscar por ID exacto
    if (isValidUUID(cleanOrderId)) {
      const { data: exactOrder, error: exactError } = await supabaseAdminClient
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('id', cleanOrderId)
        .single();
      
      if (exactOrder) {
        order = exactOrder;
        console.log(`[Tracking] Found by exact UUID: ${order.id}`);
      } else {
        console.log(`[Tracking] Exact UUID match failed:`, exactError?.message);
      }
    }
    
    // 2) Si no encontró por UUID exacto, buscar por email + prefijo del ID
    if (!order) {
      // Buscar todas las órdenes de este email
      const { data: emailOrders, error: emailError } = await supabaseAdminClient
        .from('orders')
        .select(ORDER_COLUMNS)
        .ilike('guest_email', cleanEmail);
      
      console.log(`[Tracking] Orders found by email "${cleanEmail}": ${emailOrders?.length || 0}`);
      
      if (emailOrders && emailOrders.length > 0) {
        // Buscar la orden cuyo ID empiece con el prefijo proporcionado (case-insensitive)
        const prefixLower = cleanOrderId.toLowerCase();
        order = emailOrders.find(o => 
          o.id.toLowerCase().startsWith(prefixLower)
        ) || null;
        
        if (order) {
          console.log(`[Tracking] Found by email + ID prefix: ${order.id}`);
        } else {
          console.log(`[Tracking] No order ID starts with "${cleanOrderId}" for this email. Order IDs:`, 
            emailOrders.map(o => o.id.slice(0, 8)).join(', '));
        }
      } else if (emailError) {
        console.error(`[Tracking] Email search error:`, emailError);
      }
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Orden no encontrada. Verifica el número de orden y email.' }),
        { status: 404 }
      );
    }

    // Verificar que el email coincida
    if (order.guest_email?.toLowerCase() !== cleanEmail) {
      return new Response(
        JSON.stringify({ error: 'El email no coincide con la orden.' }),
        { status: 401 }
      );
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
      .eq('order_id', order.id);

    if (itemsError) {
      console.error('[Tracking] Error fetching items:', itemsError);
    }

    // Extraer dirección del campo JSONB shipping_address
    const addr = order.shipping_address || {};

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
      items: items?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.products?.name || 'Producto desconocido',
        image_url: item.products?.image_url || null,
      })) || [],
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
        error: error instanceof Error ? error.message : 'Error al buscar orden',
      }),
      { status: 500 }
    );
  }
};
