import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

/**
 * POST /api/orders/claim-guest-orders
 * Links all guest orders with a matching email to the authenticated user.
 * Called after registration to ensure guest orders are transferred.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'userId y email son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update guest orders to belong to the new user
    const { data: claimedOrders, error: ordersError } = await supabaseAdminClient
      .from('orders')
      .update({
        user_id: userId,
        checkout_type: 'registered',
        updated_at: new Date().toISOString(),
      })
      .eq('guest_email', email)
      .eq('checkout_type', 'guest')
      .is('user_id', null)
      .select('id');

    if (ordersError) {
      console.error('Error claiming guest orders:', ordersError);
      return new Response(
        JSON.stringify({ error: 'Error al vincular pedidos de invitado' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Also update guest returns
    const { error: returnsError } = await supabaseAdminClient
      .from('returns')
      .update({
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('guest_email', email)
      .is('user_id', null);

    if (returnsError) {
      console.error('Error claiming guest returns:', returnsError);
    }

    const claimedCount = claimedOrders?.length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        claimedOrders: claimedCount,
        message: claimedCount > 0
          ? `Se han vinculado ${claimedCount} pedido(s) anteriores a tu cuenta.`
          : 'No se encontraron pedidos anteriores como invitado.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in claim-guest-orders:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
