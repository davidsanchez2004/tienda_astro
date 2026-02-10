import type { APIRoute } from 'astro';
import { supabaseClient, supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get full profile from users table
    const { data: profile } = await supabaseAdminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || '',
          phone: profile?.phone || user.user_metadata?.phone || '',
          role: profile?.role || 'customer',
          created_at: user.created_at,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
