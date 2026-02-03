import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

interface UpdateReturnRequest {
  returnId: string;
  status: string;
  adminNotes?: string;
  refundStatus?: string;
}

export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticación admin
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: UpdateReturnRequest = await request.json();
    const { returnId, status, adminNotes, refundStatus } = body;

    if (!returnId || !status) {
      return new Response(
        JSON.stringify({ error: 'ID de devolución y estado son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener la devolución actual
    const { data: returnData, error: fetchError } = await supabaseAdminClient
      .from('returns')
      .select('*, orders(guest_email, guest_first_name, guest_last_name)')
      .eq('id', returnId)
      .single();

    if (fetchError || !returnData) {
      return new Response(
        JSON.stringify({ error: 'Devolución no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (adminNotes) updateData.admin_notes = adminNotes;
    if (refundStatus) updateData.refund_status = refundStatus;

    // Si se aprueba, marcar fecha de aprobación
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    }

    // Si se completa, marcar fecha de completado y reembolso
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.refund_status = 'completed';
    }

    // Actualizar devolución
    const { data: updatedReturn, error: updateError } = await supabaseAdminClient
      .from('returns')
      .update(updateData)
      .eq('id', returnId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Enviar email de notificación al cliente
    const customerEmail = returnData.guest_email || returnData.orders?.guest_email;
    const customerName = returnData.orders?.guest_first_name 
      ? `${returnData.orders.guest_first_name} ${returnData.orders.guest_last_name || ''}`.trim()
      : 'Cliente';

    if (customerEmail) {
      const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
      
      // Enviar email según el nuevo estado
      const statusMessages: Record<string, string> = {
        approved: 'Tu solicitud de devolución ha sido aprobada. Por favor, envía el producto siguiendo las instrucciones.',
        rejected: 'Lamentamos informarte que tu solicitud de devolución no ha sido aprobada.',
        received: 'Hemos recibido tu paquete y estamos procesando tu devolución.',
        completed: '¡Tu reembolso ha sido procesado exitosamente!',
      };

      if (statusMessages[status]) {
        try {
          await fetch(`${baseUrl}/api/email/send-branded`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              template: 'return_status_update',
              to: customerEmail,
              data: {
                customerName,
                returnNumber: returnData.return_number,
                status,
                statusMessage: statusMessages[status],
                refundAmount: returnData.refund_amount,
              },
            }),
          });
        } catch (emailErr) {
          console.error('Error sending return status email:', emailErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        return: updatedReturn,
        message: `Devolución actualizada a: ${status}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating return:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error al actualizar devolución',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
