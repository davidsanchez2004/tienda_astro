import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';
import { generatePurchaseInvoice, generateReturnInvoice } from '../../../lib/invoice-service';

export const prerender = false;

/**
 * GET - Listar todas las facturas (con filtros opcionales)
 */
export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const type = url.searchParams.get('type'); // 'purchase' | 'return' | null (all)
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    let query = supabaseAdminClient
      .from('invoices')
      .select('id, order_id, return_id, invoice_number, type, amount, customer_name, customer_email, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type === 'purchase' || type === 'return') {
      query = query.eq('type', type);
    }

    const { data: invoices, error, count } = await query;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        invoices: invoices || [],
        total: count || 0,
        page,
        limit,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error al obtener facturas' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST - Generar factura manualmente
 * Body: { orderId: string, type: 'purchase' } | { returnId: string, type: 'return' }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { type, orderId, returnId } = body;

    if (type === 'purchase' && orderId) {
      const result = await generatePurchaseInvoice(orderId);
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, invoiceId: result.invoiceId }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'return' && returnId) {
      const result = await generateReturnInvoice(returnId);
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, invoiceId: result.invoiceId }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Parámetros inválidos. Envía { type: "purchase", orderId } o { type: "return", returnId }' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error al generar factura' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
