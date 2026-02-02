import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

interface UpdateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  category_ids: string[];
  image_url: string;
  featured: boolean;
  active: boolean;
}

export const PUT: APIRoute = async ({ request, url }) => {
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

    const body: UpdateProductRequest = await request.json();

    // Validaciones básicas
    if (!body.name || !body.price || body.stock === undefined || !body.category_ids || body.category_ids.length === 0 || !body.image_url) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos' }),
        { status: 400 }
      );
    }

    // Generar slug desde el nombre
    const slug = body.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

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
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: `Error en BD: ${error.message}` }),
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
