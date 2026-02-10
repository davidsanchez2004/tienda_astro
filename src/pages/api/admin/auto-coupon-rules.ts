import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

// GET - Obtener todas las reglas de cupón automático
export const GET: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(request, cookies)) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { data: rules, error } = await supabaseAdminClient
      .from('auto_coupon_rules')
      .select('*')
      .order('spend_threshold', { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, rules }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Crear nueva regla de cupón automático
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(request, cookies)) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { spendThreshold, discountType, discountValue, minPurchase, validDays, personalMessage } = body;

    if (!spendThreshold || !discountType || !discountValue) {
      return new Response(
        JSON.stringify({ error: 'Umbral de gasto, tipo y valor de descuento son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: rule, error } = await supabaseAdminClient
      .from('auto_coupon_rules')
      .insert({
        spend_threshold: spendThreshold,
        discount_type: discountType,
        discount_value: discountValue,
        min_purchase: minPurchase || 0,
        valid_days: validDays || 30,
        personal_message: personalMessage || '',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, rule }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Activar/desactivar regla
export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(request, cookies)) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id, is_active } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID de regla requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdminClient
      .from('auto_coupon_rules')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Eliminar regla
export const DELETE: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(request, cookies)) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID de regla requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdminClient
      .from('auto_coupon_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
