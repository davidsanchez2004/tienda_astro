import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    // Verificar autenticación admin
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== import.meta.env.ADMIN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    const productId = url.searchParams.get('id');
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'ID de producto requerido' }),
        { status: 400 }
      );
    }

    // Eliminar producto
    const { error } = await supabaseAdminClient
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
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
