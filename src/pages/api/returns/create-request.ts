import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

interface ReturnItemInput {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  reason: string;
}

interface CreateReturnRequest {
  orderId: string;
  reason: string;
  description: string;
  itemsCount?: number; // legacy compat
  guestEmail?: string;
  items?: ReturnItemInput[];
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
    }

    const body: CreateReturnRequest = await request.json();
    const { orderId, reason, description, guestEmail, items } = body;
    const itemsCount = items?.length || body.itemsCount || 1;

    // Validar campos
    if (!orderId || !reason || !description) {
      return new Response(
        JSON.stringify({ error: 'Parámetros incompletos' }),
        { status: 400 }
      );
    }

    // Obtener información de la orden
    const { data: order, error: orderError } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Orden no encontrada' }),
        { status: 404 }
      );
    }

    // Validar que el email coincida para órdenes guest
    if (order.checkout_type === 'guest' && guestEmail !== order.guest_email) {
      return new Response(
        JSON.stringify({ error: 'Email no coincide con la orden' }),
        { status: 403 }
      );
    }

    // Generar número de devolución único
    const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calcular monto de reembolso (basado en items seleccionados o total del pedido)
    let refundAmount = order.total;
    if (items && items.length > 0) {
      refundAmount = items.reduce((sum: number, item: ReturnItemInput) => sum + (item.price * item.quantity), 0);
    }

    // Crear solicitud de devolución
    const { data: returnRequest, error: returnError } = await supabaseAdminClient
      .from('returns')
      .insert({
        order_id: orderId,
        guest_email: guestEmail || order.guest_email,
        status: 'pending',
        reason,
        description,
        return_number: returnNumber,
        items_count: itemsCount,
        refund_amount: refundAmount,
        refund_status: 'pending',
      })
      .select()
      .single();

    if (returnError || !returnRequest) {
      throw new Error('Error al crear solicitud de devolución');
    }

    // Insertar items individuales de devolución
    if (items && items.length > 0) {
      const returnItemsData = items.map((item: ReturnItemInput) => ({
        return_id: returnRequest.id,
        order_item_id: item.orderItemId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        reason: item.reason || reason,
      }));

      const { error: returnItemsError } = await supabaseAdminClient
        .from('return_items')
        .insert(returnItemsData);

      if (returnItemsError) {
        console.error('Error inserting return items:', returnItemsError);
        // Don't fail - the return itself was created successfully
      }
    }

    // Preparar datos para emails
    const customerEmail = guestEmail || order.guest_email;
    const customerName = order.guest_first_name 
      ? `${order.guest_first_name} ${order.guest_last_name || ''}`.trim()
      : 'Cliente';
    const orderNumber = order.id.slice(0, 8).toUpperCase();
    
    const returnEmailData = {
      returnNumber,
      orderId: order.id,
      orderNumber,
      customerName,
      customerEmail,
      reason,
      description,
      itemsCount,
      refundAmount,
    };

    // Enviar email de confirmación al cliente
    try {
      const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
      
      await fetch(`${baseUrl}/api/email/send-branded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'return_confirmation_customer',
          to: customerEmail,
          data: returnEmailData,
        }),
      });
      
      // Enviar notificación al admin
      await fetch(`${baseUrl}/api/email/send-branded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'return_request_admin',
          to: import.meta.env.ADMIN_EMAIL || 'davidsanchezacosta0@gmail.com',
          data: returnEmailData,
        }),
      });
      
      console.log('Return request emails sent');
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // No fallar si el email no se envía
    }

    return new Response(
      JSON.stringify({
        success: true,
        return: returnRequest,
        message: 'Solicitud de devolución creada exitosamente',
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error('Error in create-return:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Error desconocido',
      }),
      { status: 500 }
    );
  }
};
