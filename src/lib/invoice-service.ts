import { supabaseAdminClient } from './supabase';
import { generateInvoicePDF } from './invoice-generator';
import type { InvoiceData } from './types';

/**
 * Genera el número de factura secuencial
 */
async function generateInvoiceNumber(type: 'purchase' | 'return'): Promise<string> {
  const prefix = type === 'purchase' ? 'FAC' : 'ABN';
  const year = new Date().getFullYear();

  // Buscar el último número de factura de este tipo y año
  const { data } = await supabaseAdminClient
    .from('invoices')
    .select('invoice_number')
    .eq('type', type)
    .like('invoice_number', `${prefix}-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1);

  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].invoice_number;
    const parts = lastNumber.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}-${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Formatea fecha en español
 */
function formatDateES(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Genera y guarda una factura de COMPRA para un pedido
 */
export async function generatePurchaseInvoice(orderId: string): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    // Verificar si ya existe factura de compra para esta orden
    const { data: existing } = await supabaseAdminClient
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .eq('type', 'purchase')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[Invoice] Purchase invoice already exists for order ${orderId}`);
      return { success: true, invoiceId: existing[0].id };
    }

    // Obtener datos de la orden
    const { data: order, error: orderError } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Pedido no encontrado' };
    }

    // Obtener items
    const { data: orderItems } = await supabaseAdminClient
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', orderId);

    const items = (orderItems || []).map((item: any) => ({
      name: item.products?.name || item.product_name || 'Producto',
      quantity: item.quantity,
      price: Number(item.price),
      total: Number(item.price) * item.quantity,
    }));

    const invoiceNumber = await generateInvoiceNumber('purchase');
    const now = new Date();
    const subtotal = Number(order.subtotal) || Number(order.total);
    const shipping = Number(order.shipping_cost) || 0;
    const discount = Number(order.discount_amount) || 0;
    const total = Number(order.total);
    // IVA incluido en el precio (21%)
    const tax = total * 0.21 / 1.21;

    const customerName = order.guest_first_name
      ? `${order.guest_first_name} ${order.guest_last_name || ''}`.trim()
      : 'Cliente';

    const invoiceData: InvoiceData = {
      invoiceNumber,
      invoiceDate: formatDateES(now),
      dueDate: formatDateES(now),
      type: 'purchase',
      customer: {
        name: customerName,
        email: order.guest_email || '',
        phone: order.guest_phone || '',
        address: order.shipping_address || {
          street: '',
          number: '',
          apartment: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'España',
        },
      },
      items,
      subtotal,
      shipping,
      discount,
      tax: Math.round(tax * 100) / 100,
      total,
      notes: '',
    };

    // Generar PDF
    const pdfBytes = await generateInvoicePDF(invoiceData);
    // Convertir a base64 para almacenar en BD
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    // Guardar en BD
    const { data: invoice, error: insertError } = await supabaseAdminClient
      .from('invoices')
      .insert({
        order_id: orderId,
        invoice_number: invoiceNumber,
        type: 'purchase',
        amount: total,
        customer_name: customerName,
        customer_email: order.guest_email || '',
        pdf_data: pdfBase64,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Invoice] Error inserting purchase invoice:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`[Invoice] Purchase invoice ${invoiceNumber} generated for order ${orderId}`);
    return { success: true, invoiceId: invoice.id };
  } catch (err) {
    console.error('[Invoice] Error generating purchase invoice:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

/**
 * Genera y guarda una factura de DEVOLUCIÓN (nota de crédito) para una devolución
 */
export async function generateReturnInvoice(returnId: string): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    // Verificar si ya existe factura de devolución
    const { data: existing } = await supabaseAdminClient
      .from('invoices')
      .select('id')
      .eq('return_id', returnId)
      .eq('type', 'return')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[Invoice] Return invoice already exists for return ${returnId}`);
      return { success: true, invoiceId: existing[0].id };
    }

    // Obtener datos de la devolución
    const { data: returnData, error: returnError } = await supabaseAdminClient
      .from('returns')
      .select('*, orders(*)')
      .eq('id', returnId)
      .single();

    if (returnError || !returnData) {
      return { success: false, error: 'Devolución no encontrada' };
    }

    const order = returnData.orders;
    if (!order) {
      return { success: false, error: 'Pedido asociado no encontrado' };
    }

    // Obtener items de la devolución
    const { data: returnItems } = await supabaseAdminClient
      .from('return_items')
      .select('*')
      .eq('return_id', returnId);

    // Si hay return_items, usar esos; si no, usar items del pedido completo
    let items: { name: string; quantity: number; price: number; total: number }[];
    
    if (returnItems && returnItems.length > 0) {
      items = returnItems.map((item: any) => ({
        name: item.product_name || 'Producto',
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.price) * item.quantity,
      }));
    } else {
      // Fallback: usar items del pedido completo
      const { data: orderItems } = await supabaseAdminClient
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', order.id);

      items = (orderItems || []).map((item: any) => ({
        name: item.products?.name || 'Producto',
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.price) * item.quantity,
      }));
    }

    const invoiceNumber = await generateInvoiceNumber('return');
    const now = new Date();
    const refundAmount = Number(returnData.refund_amount);
    const tax = refundAmount * 0.21 / 1.21;

    const customerName = order.guest_first_name
      ? `${order.guest_first_name} ${order.guest_last_name || ''}`.trim()
      : 'Cliente';

    const invoiceData: InvoiceData = {
      invoiceNumber,
      invoiceDate: formatDateES(now),
      dueDate: formatDateES(now),
      type: 'return',
      returnNumber: returnData.return_number,
      customer: {
        name: customerName,
        email: returnData.guest_email || order.guest_email || '',
        phone: order.guest_phone || '',
        address: order.shipping_address || {
          street: '',
          number: '',
          apartment: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'España',
        },
      },
      items,
      subtotal: refundAmount,
      shipping: 0,
      tax: Math.round(tax * 100) / 100,
      total: refundAmount,
      notes: returnData.reason ? `Motivo: ${returnData.reason}` : '',
    };

    // Generar PDF
    const pdfBytes = await generateInvoicePDF(invoiceData);
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    // Guardar en BD
    const { data: invoice, error: insertError } = await supabaseAdminClient
      .from('invoices')
      .insert({
        order_id: order.id,
        return_id: returnId,
        invoice_number: invoiceNumber,
        type: 'return',
        amount: -refundAmount, // Negativo para devoluciones
        customer_name: customerName,
        customer_email: returnData.guest_email || order.guest_email || '',
        pdf_data: pdfBase64,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Invoice] Error inserting return invoice:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`[Invoice] Return invoice ${invoiceNumber} generated for return ${returnId}`);
    return { success: true, invoiceId: invoice.id };
  } catch (err) {
    console.error('[Invoice] Error generating return invoice:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}
