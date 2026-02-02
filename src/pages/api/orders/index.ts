import type { APIRoute } from 'astro';
import { supabaseClient, supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: orders } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return new Response(JSON.stringify(orders || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
