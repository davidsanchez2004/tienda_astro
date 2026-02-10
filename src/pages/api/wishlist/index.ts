import type { APIRoute } from 'astro';
import { supabaseClient, supabaseAdminClient } from '../../../lib/supabase';

// GET - Obtener wishlist del usuario
export const GET: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get wishlist items with product data
    const { data: wishlistItems, error } = await supabaseAdminClient
      .from('wishlist_items')
      .select('id, product_id, added_at')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) throw error;

    // Get product details for wishlist items
    const productIds = (wishlistItems || []).map(item => item.product_id);
    let products: any[] = [];

    if (productIds.length > 0) {
      const { data: productData } = await supabaseAdminClient
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('active', true);
      products = productData || [];
    }

    // Merge wishlist with product data
    const items = (wishlistItems || []).map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        id: item.id,
        product_id: item.product_id,
        added_at: item.added_at,
        product: product || null,
      };
    }).filter(item => item.product !== null);

    return new Response(JSON.stringify({ items }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST - Añadir a wishlist
export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
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

    // Check if already in wishlist
    const { data: existing } = await supabaseAdminClient
      .from('wishlist_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ message: 'Ya está en favoritos', id: existing.id }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdminClient
      .from('wishlist_items')
      .insert({ user_id: user.id, product_id })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, item: data }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Quitar de wishlist
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
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

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
