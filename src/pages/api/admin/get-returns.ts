import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verify admin authentication
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== import.meta.env.ADMIN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    // Fetch all returns
    const { data: returns, error } = await supabaseAdminClient
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Error al obtener devoluciones');
    }

    return new Response(
      JSON.stringify({
        success: true,
        returns: returns || [],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in get-returns:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Error desconocido',
      }),
      { status: 500 }
    );
  }
};
