import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

// GET - Obtener todos los códigos de descuento
export const GET: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(request, cookies)) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { data: codes, error } = await supabaseAdminClient
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, codes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Crear nuevo código de descuento
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(request, cookies)) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxUses,
      perUserLimit,
      validFrom,
      validUntil,
      targetEmail,
      personalMessage,
      sendEmail,
    } = body;

    // Validar campos requeridos
    if (!code || !discountType || !discountValue) {
      return new Response(
        JSON.stringify({ error: 'Código, tipo y valor de descuento son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear código
    const { data: newCode, error } = await supabaseAdminClient
      .from('discount_codes')
      .insert({
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        min_purchase: minPurchase || 0,
        max_uses: maxUses || null,
        per_user_limit: perUserLimit || 1,
        valid_from: validFrom || new Date().toISOString(),
        valid_until: validUntil || null,
        target_email: targetEmail || null,
        personal_message: personalMessage || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'Ya existe un código con ese nombre' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Enviar email si se solicita y hay email de destino
    if (sendEmail && targetEmail) {
      await sendDiscountEmail(newCode, targetEmail, body.customerName, personalMessage, validUntil);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        code: newCode,
        emailSent: sendEmail && targetEmail ? true : false
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating discount code:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Reenviar email de código existente
export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(request, cookies)) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { id, targetEmail, customerName, personalMessage } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID de código requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el código
    const { data: code, error: fetchError } = await supabaseAdminClient
      .from('discount_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !code) {
      return new Response(
        JSON.stringify({ error: 'Código no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailTo = targetEmail || code.target_email;
    if (!emailTo) {
      return new Response(
        JSON.stringify({ error: 'No hay email de destino para este código' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Si se proporciona un nuevo targetEmail, actualizar el código
    if (targetEmail && targetEmail !== code.target_email) {
      await supabaseAdminClient
        .from('discount_codes')
        .update({ target_email: targetEmail })
        .eq('id', id);
    }

    await sendDiscountEmail(
      code,
      emailTo,
      customerName || 'Cliente',
      personalMessage || code.personal_message,
      code.valid_until
    );

    return new Response(
      JSON.stringify({ success: true, message: `Email reenviado a ${emailTo}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error resending discount email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Función reutilizable para enviar email de descuento
async function sendDiscountEmail(
  code: any,
  targetEmail: string,
  customerName: string,
  personalMessage: string | null,
  validUntil: string | null
) {
  const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

  try {
    await fetch(`${baseUrl}/api/email/send-branded`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'discount_code',
        to: targetEmail,
        data: {
          customerName: customerName || 'Cliente',
          customerEmail: targetEmail,
          code: code.code,
          discountType: code.discount_type,
          discountValue: code.discount_value,
          minPurchase: code.min_purchase || 0,
          expirationDate: validUntil
            ? new Date(validUntil).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : null,
          personalMessage,
        },
      }),
    });

    // Actualizar fecha de envío
    await supabaseAdminClient
      .from('discount_codes')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', code.id);
  } catch (emailError) {
    console.error('Error sending discount email:', emailError);
    throw emailError;
  }
}

// DELETE - Eliminar/Desactivar código
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
        JSON.stringify({ error: 'ID de código requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Desactivar en lugar de eliminar
    const { error } = await supabaseAdminClient
      .from('discount_codes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: 'Código desactivado' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
