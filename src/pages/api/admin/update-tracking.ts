import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

interface UpdateTrackingRequest {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  adminKey?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
    }

    const body: UpdateTrackingRequest = await request.json();
    const { orderId, trackingNumber, carrier } = body;

    // Validar campos requeridos
    if (!orderId || !trackingNumber || !carrier) {
      return new Response(
        JSON.stringify({ error: 'Parámetros incompletos' }),
        { status: 400 }
      );
    }

    // Verificar que sea un admin
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    // Actualizar orden
    const { data: order, error: updateError } = await supabaseAdminClient
      .from('orders')
      .update({
        tracking_number: trackingNumber,
        carrier: carrier,
        status: 'shipped',
        shipped_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError || !order) {
      return new Response(
        JSON.stringify({ error: 'Error al actualizar la orden' }),
        { status: 500 }
      );
    }

    // Obtener email del cliente
    const email = order.checkout_type === 'guest' ? order.guest_email : order.user_id;
    const customerName = order.checkout_type === 'guest'
      ? `${order.guest_first_name} ${order.guest_last_name}`
      : 'Cliente';

    // Enviar email de notificación
    await fetch(`${import.meta.env.SITE_URL}/api/email/send-transactional`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'shipping',
        email: email,
        customerName: customerName,
        orderId: orderId,
        trackingNumber: trackingNumber,
        carrier: carrier,
      }),
    }).catch(err => console.error('Error sending email:', err));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Orden actualizada con éxito',
        order,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Update tracking error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error al actualizar seguimiento',
      }),
      { status: 500 }
    );
  }
};
