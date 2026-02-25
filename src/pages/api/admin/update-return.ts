import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';
import { generateReturnInvoice } from '../../../lib/invoice-service';

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

    // --- REPONER STOCK al completar la devolución ---
    if (status === 'completed') {
      try {
        // Obtener los items devueltos
        const { data: returnItems, error: riError } = await supabaseAdminClient
          .from('return_items')
          .select('product_id, quantity')
          .eq('return_id', returnId);

        if (riError) {
          console.error('[Return] Error fetching return items for stock:', riError.message);
        } else if (returnItems && returnItems.length > 0) {
          for (const item of returnItems) {
            // Obtener stock actual
            const { data: product, error: productError } = await supabaseAdminClient
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();

            if (productError || !product) {
              console.error(`[Return] Product ${item.product_id} not found for stock replenish`);
              continue;
            }

            const newStock = (product.stock || 0) + (item.quantity || 1);
            const { error: stockError } = await supabaseAdminClient
              .from('products')
              .update({ stock: newStock, updated_at: new Date().toISOString() })
              .eq('id', item.product_id);

            if (stockError) {
              console.error(`[Return] Error replenishing stock for ${item.product_id}:`, stockError.message);
            } else {
              console.log(`[Return] Stock replenished for product ${item.product_id}: +${item.quantity} → ${newStock}`);
            }
          }
        }
      } catch (stockErr) {
        console.error('[Return] Error in stock replenishment:', stockErr);
        // No falla la operación principal, el stock se puede corregir manualmente
      }
    }

    // --- Actualizar status del pedido si la devolución se completa ---
    if (status === 'completed' && returnData.order_id) {
      try {
        await supabaseAdminClient
          .from('orders')
          .update({
            status: 'refunded',
            refund_status: 'refunded',
            refund_amount: returnData.refund_amount || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', returnData.order_id);
        console.log(`[Return] Order ${returnData.order_id} marked as refunded`);
      } catch (orderErr) {
        console.error('[Return] Error updating order status:', orderErr);
      }
    }

    // Generar factura de devolución (nota de crédito) al completarse
    if (status === 'completed') {
      try {
        const invoiceResult = await generateReturnInvoice(returnId);
        if (invoiceResult.success) {
          console.log(`[Return] Return invoice generated for return ${returnId}`);
        } else {
          console.error(`[Return] Failed to generate return invoice: ${invoiceResult.error}`);
        }
      } catch (invoiceErr) {
        console.error('[Return] Error generating return invoice:', invoiceErr);
      }
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
                returnId: returnId,
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
