import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

interface UpdateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  category_ids: string[];
  image_url: string;
  featured: boolean;
  active: boolean;
  on_offer?: boolean;
  offer_price?: number | null;
  offer_percentage?: number | null;
}

export const PUT: APIRoute = async ({ request, url, cookies }) => {
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

    const body: UpdateProductRequest = await request.json();

    // Validaciones básicas
    if (!body.name || !body.price || body.stock === undefined || !body.category_ids || body.category_ids.length === 0 || !body.image_url) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos' }),
        { status: 400 }
      );
    }

    // Actualizar producto en Supabase
    const { data, error } = await supabaseAdminClient
      .from('products')
      .update({
        name: body.name,
        description: body.description,
        price: body.price,
        stock: body.stock,
        category_ids: body.category_ids,
        image_url: body.image_url,
        featured: body.featured,
        active: body.active,
        on_offer: body.on_offer || false,
        offer_price: body.offer_price || null,
        offer_percentage: body.offer_percentage || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('[update-product] DB error:', error);
      return new Response(
        JSON.stringify({ error: `Error en BD: ${error.message}`, code: error.code }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        product: data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: `Error: ${error.message}` }),
      { status: 500 }
    );
  }
};
