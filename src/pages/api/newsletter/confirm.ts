import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

const DISCOUNT_CODE = 'BIENVENIDO10';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token no proporcionado' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Llamar a la función de confirmación
    const { data, error } = await supabaseAdminClient
      .rpc('confirm_newsletter_subscription', { p_token: token });

    if (error) {
      console.error('Error confirming subscription:', error);
      throw error;
    }

    const result = data?.[0];

    if (result?.success) {
      // Enviar email con código de descuento
      const baseUrl = new URL(request.url).origin;
      try {
        await fetch(`${baseUrl}/api/email/send-branded`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: result.email,
            type: 'newsletter_confirmed',
            data: {
              discountCode: DISCOUNT_CODE
            }
          })
        });
      } catch (emailError) {
        console.error('Error sending discount email:', emailError);
        // No fallamos si el email no se envía, la suscripción ya está confirmada
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: result.message,
        email: result.email,
        discountCode: DISCOUNT_CODE
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: result?.message || 'Error al confirmar suscripción'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error confirming newsletter subscription:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error al confirmar la suscripción' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
