import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

// POST - Validar código de descuento
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { code, email, userId, cartTotal } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Código requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar el código
    const { data: discountCode, error: fetchError } = await supabaseAdminClient
      .from('discount_codes')
      .select('*')
      .ilike('code', code)
      .eq('is_active', true)
      .single();

    if (fetchError || !discountCode) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Código no válido o expirado' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar fechas de validez
    const now = new Date();
    const validFrom = new Date(discountCode.valid_from);
    
    if (validFrom > now) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Este código aún no está activo' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (discountCode.valid_until) {
      const validUntil = new Date(discountCode.valid_until);
      if (validUntil < now) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Este código ha expirado' 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar límite de usos global
    if (discountCode.max_uses !== null && discountCode.current_uses >= discountCode.max_uses) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Este código ha alcanzado su límite de usos' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si es código personal
    if (discountCode.target_email && email) {
      if (discountCode.target_email.toLowerCase() !== email.toLowerCase()) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Este código no es válido para tu cuenta' 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar compra mínima
    const cartAmount = parseFloat(cartTotal) || 0;
    if (discountCode.min_purchase > 0 && cartAmount < discountCode.min_purchase) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Compra mínima de €${discountCode.min_purchase.toFixed(2)} requerida` 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar uso por usuario/email
    if (email || userId) {
      const { data: usageRecords } = await supabaseAdminClient
        .from('discount_code_usage')
        .select('id')
        .eq('code_id', discountCode.id)
        .or(
          userId 
            ? `user_id.eq.${userId},guest_email.ilike.${email || ''}`
            : `guest_email.ilike.${email}`
        );

      const usageCount = usageRecords?.length || 0;
      if (usageCount >= discountCode.per_user_limit) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Ya has usado este código el número máximo de veces' 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calcular descuento
    let calculatedDiscount = 0;
    if (discountCode.discount_type === 'percentage') {
      calculatedDiscount = Math.round((cartAmount * discountCode.discount_value / 100) * 100) / 100;
    } else {
      calculatedDiscount = Math.min(discountCode.discount_value, cartAmount);
    }

    // Código válido
    return new Response(
      JSON.stringify({ 
        valid: true,
        code: discountCode.code,
        discountType: discountCode.discount_type,
        discountValue: discountCode.discount_value,
        calculatedDiscount,
        minPurchase: discountCode.min_purchase,
        message: discountCode.discount_type === 'percentage'
          ? `¡${discountCode.discount_value}% de descuento aplicado!`
          : `¡€${discountCode.discount_value.toFixed(2)} de descuento aplicado!`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error validating discount code:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Error al validar el código' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
