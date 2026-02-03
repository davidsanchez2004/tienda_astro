import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../../lib/supabase';
import { isAdminAuthenticated } from '../../../../lib/admin-auth';

// PATCH - Actualizar estado de orden y enviar emails
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Verificar autenticación usando el helper
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { 
      status, 
      tracking_number, 
      carrier, 
      sendEmail = true 
    } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID de orden requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener orden actual
    const { data: order, error: fetchError } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return new Response(
        JSON.stringify({ error: 'Orden no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (carrier) updateData.carrier = carrier;
    
    if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    }

    // Actualizar orden
    const { data: updatedOrder, error: updateError } = await supabaseAdminClient
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Obtener items del pedido para emails
    const { data: orderItems } = await supabaseAdminClient
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', id);

    const items = (orderItems || []).map((item: any) => ({
      name: item.products?.name || 'Producto',
      quantity: item.quantity,
      price: item.price,
    }));

    // Preparar datos para email
    const customerEmail = order.guest_email || order.customer_email;
    const customerName = order.guest_first_name 
      ? `${order.guest_first_name} ${order.guest_last_name || ''}`.trim()
      : 'Cliente';
    const orderNumber = order.id.slice(0, 8).toUpperCase();
    
    const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
    
    const orderData = {
      orderId: order.id,
      orderNumber,
      customerName,
      customerEmail,
      items,
      subtotal: order.subtotal || order.total,
      shippingCost: order.shipping_cost || 0,
      discount: order.discount_amount || 0,
      total: order.total,
      shippingAddress: order.shipping_address || {},
      shippingMethod: (order.shipping_option || 'home') as 'home' | 'pickup',
      trackingNumber: tracking_number || order.tracking_number,
      carrier: carrier || order.carrier,
    };

    // Enviar emails según el nuevo estado
    if (sendEmail && customerEmail) {
      try {
        if (status === 'shipped') {
          // Email de envío al cliente
          await fetch(`${baseUrl}/api/email/send-branded`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              template: 'shipping_notification_customer',
              to: customerEmail,
              data: orderData,
            }),
          });
          console.log('Shipping notification sent to:', customerEmail);
        } else if (status === 'delivered') {
          // Email de entrega al cliente
          await fetch(`${baseUrl}/api/email/send-branded`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              template: 'delivery_confirmation_customer',
              to: customerEmail,
              data: orderData,
            }),
          });
          
          // Notificar al admin también
          await fetch(`${baseUrl}/api/email/send-branded`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              template: 'delivery_notification_admin',
              to: import.meta.env.ADMIN_EMAIL || 'admin@byarena.com',
              data: orderData,
            }),
          });
          console.log('Delivery notifications sent');
        }
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
        // No fallar si el email no se envía
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: updatedOrder,
        emailSent: sendEmail,
        message: `Orden actualizada a estado: ${status}`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error updating order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
