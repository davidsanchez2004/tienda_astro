import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

const ADMIN_SECRET_KEY = import.meta.env.ADMIN_SECRET_KEY || 'AdminByArena2026!';

function isAuthorized(request: Request): boolean {
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === ADMIN_SECRET_KEY;
}

// GET - Obtener todas las categorías
export const GET: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { data: categories, error } = await supabaseAdminClient
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ categories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST - Crear nueva categoría
export const POST: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { name, slug, description, image_url } = body;

    if (!name || !slug) {
      return new Response(JSON.stringify({ error: 'Nombre y slug son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: category, error } = await supabaseAdminClient
      .from('categories')
      .insert({
        name,
        slug,
        description: description || '',
        image_url: image_url || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'Ya existe una categoría con ese slug' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }

    return new Response(JSON.stringify({ category }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT - Actualizar categoría
export const PUT: APIRoute = async ({ request, url }) => {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, slug, description, image_url } = body;

    const { data: category, error } = await supabaseAdminClient
      .from('categories')
      .update({
        name,
        slug,
        description,
        image_url
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ category }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE - Eliminar categoría
export const DELETE: APIRoute = async ({ request, url }) => {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Primero eliminar las relaciones product_categories
    await supabaseAdminClient
      .from('product_categories')
      .delete()
      .eq('category_id', id);

    // Luego eliminar la categoría
    const { error } = await supabaseAdminClient
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
