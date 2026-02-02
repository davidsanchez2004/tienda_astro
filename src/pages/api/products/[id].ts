import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  try {
    const { data: product } = await supabaseAdminClient
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (!product) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(product), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
