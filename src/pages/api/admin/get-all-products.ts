import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación admin
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== import.meta.env.ADMIN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdminClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Products error details:', error);
      throw new Error(`Error al cargar productos: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        products: data || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
};
