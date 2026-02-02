import type { APIRoute } from 'astro';
import { supabaseClient, supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Verify ownership
    const { data: order } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    // Get order items
    const { data: items } = await supabaseAdminClient
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    return new Response(
      JSON.stringify({
        ...order,
        items,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { status } = await request.json();

    // Verify ownership and admin
    const { data: order } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    const { data: updated } = await supabaseAdminClient
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
