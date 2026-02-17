import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

interface CreateProductRequest {
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

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verificar autenticación admin
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    const body: CreateProductRequest = await request.json();
    console.log('[create-product] Received body:', JSON.stringify({ ...body, image_url: body.image_url ? 'SET' : 'MISSING' }));

    // Validaciones básicas
    if (!body.name || !body.price || body.stock === undefined || !body.category_ids || body.category_ids.length === 0 || !body.image_url) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos', details: { name: !!body.name, price: !!body.price, stock: body.stock !== undefined, category_ids: body.category_ids?.length, image_url: !!body.image_url } }),
        { status: 400 }
      );
    }

    // Generar SKU desde el nombre
    const sku = body.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36);

    // Insertar producto en Supabase
    const { data, error } = await supabaseAdminClient
      .from('products')
      .insert([
        {
          name: body.name,
          description: body.description,
          price: body.price,
          stock: body.stock,
          category_ids: body.category_ids,
          image_url: body.image_url,
          featured: body.featured,
          active: body.active,
          sku: sku,
          on_offer: body.on_offer || false,
          offer_price: body.offer_price || null,
          offer_percentage: body.offer_percentage || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[create-product] DB error:', error);
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
        status: 201,
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
