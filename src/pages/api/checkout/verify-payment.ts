import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || '');

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const sessionId = url.searchParams.get('session_id');
    const orderId = url.searchParams.get('order_id');

    if (!sessionId) {
      return new Response('Session ID requerido', { status: 400 });
    }

    // Obtener sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Actualizar orden como pagada
      if (orderId) {
        await supabaseAdminClient
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', orderId);
      }

      return new Response(
        JSON.stringify({ success: true, orderId }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Pago no completado' }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error' }),
      { status: 500 }
    );
  }
};
