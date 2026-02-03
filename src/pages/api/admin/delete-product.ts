import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

export const DELETE: APIRoute = async ({ request, url, cookies }) => {
  try {
    // Verificar autenticación admin
    if (!isAdminAuthenticated(request, cookies)) {
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
