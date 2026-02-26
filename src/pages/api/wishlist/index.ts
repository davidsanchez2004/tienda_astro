import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../../lib/supabase';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://orhtsdwenpgoofnpsouw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaHRzZHdlbnBnb29mbnBzb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjQzNjAsImV4cCI6MjA4NDU0MDM2MH0.79kiLMekVj2gq8EyGN0LVMMmmeq91jhnNQCHthf3AXQ';

function getAuthUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '');
}

async function verifyToken(token: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET: obtener wishlist del usuario
export const GET: APIRoute = async ({ request }) => {
  try {
    const token = getAuthUser(request);
    if (!token) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await verifyToken(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: wishlistItems, error } = await supabaseAdminClient
      .from('wishlist_items')
      .select('*, product:product_id(*)')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Wishlist fetch error:', error);
      return new Response(JSON.stringify({ error: 'Error al obtener favoritos' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ items: wishlistItems || [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Wishlist GET error:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: añadir producto a wishlist
export const POST: APIRoute = async ({ request }) => {
  try {
    const token = getAuthUser(request);
    if (!token) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await verifyToken(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { product_id } = await request.json();
    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id requerido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el producto existe
    const { data: product } = await supabaseAdminClient
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single();

    if (!product) {
      return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Upsert (ignorar si ya existe por UNIQUE constraint)
    const { data, error } = await supabaseAdminClient
      .from('wishlist_items')
      .upsert(
        { user_id: user.id, product_id },
        { onConflict: 'user_id,product_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Wishlist add error:', error);
      return new Response(JSON.stringify({ error: 'Error al añadir a favoritos' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, item: data, message: 'Añadido a favoritos' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Wishlist POST error:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: eliminar producto de wishlist
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const token = getAuthUser(request);
    if (!token) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await verifyToken(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { product_id } = await request.json();
    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id requerido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabaseAdminClient
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id);

    if (error) {
      console.error('Wishlist delete error:', error);
      return new Response(JSON.stringify({ error: 'Error al eliminar de favoritos' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Eliminado de favoritos' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Wishlist DELETE error:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
