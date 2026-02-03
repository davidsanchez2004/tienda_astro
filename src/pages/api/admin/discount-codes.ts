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
      const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
      const customerName = body.customerName || 'Cliente';
      
      try {
        await fetch(`${baseUrl}/api/email/send-branded`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: 'discount_code',
            to: targetEmail,
            data: {
              customerName,
              customerEmail: targetEmail,
              code: code.toUpperCase(),
              discountType,
              discountValue,
              minPurchase: minPurchase || 0,
              expirationDate: validUntil 
                ? new Date(validUntil).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
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
          .eq('id', newCode.id);

      } catch (emailError) {
        console.error('Error sending discount email:', emailError);
      }
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
