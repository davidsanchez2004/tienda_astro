import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../../lib/supabase';
import { isAdminAuthenticated } from '../../../../lib/admin-auth';

export const prerender = false;

/**
 * GET - Descargar PDF de una factura por su ID
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
  const { id } = params;

  if (!id) {
    return new Response('ID de factura no proporcionado', { status: 400 });
  }

  try {
    // Verificar autenticación admin
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response('No autorizado', { status: 401 });
    }

    // Obtener la factura
    const { data: invoice, error } = await supabaseAdminClient
      .from('invoices')
      .select('invoice_number, type, pdf_data')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return new Response('Factura no encontrada', { status: 404 });
    }

    if (!invoice.pdf_data) {
      return new Response('PDF no disponible para esta factura', { status: 404 });
    }

    // Decodificar base64 a bytes
    const pdfBytes = Buffer.from(invoice.pdf_data, 'base64');

    const filename = `${invoice.invoice_number}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    return new Response('Error al descargar factura', { status: 500 });
  }
};
