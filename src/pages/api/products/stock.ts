import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

// GET - Check stock for specific product
export const GET: APIRoute = async ({ url }) => {
  try {
    const productId = url.searchParams.get('product_id');

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'product_id requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseAdminClient
      .from('products')
      .select('id, name, stock, active')
      .eq('id', productId)
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Producto no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        product_id: data.id,
        name: data.name,
        stock: data.stock,
        available: data.active && data.stock > 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Check stock for multiple products (cart validation)
export const POST: APIRoute = async ({ request }) => {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'items array requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const productIds = items.map((item: any) => item.product_id);

    const { data: products, error } = await supabaseAdminClient
      .from('products')
      .select('id, name, stock, active, price, on_offer, offer_price')
      .in('id', productIds);

    if (error) throw error;

    const validation = items.map((item: any) => {
      const product = products?.find(p => p.id === item.product_id);

      if (!product) {
        return { product_id: item.product_id, available: false, reason: 'not_found' };
      }
      if (!product.active) {
        return { product_id: item.product_id, name: product.name, available: false, reason: 'inactive' };
      }
      if (product.stock <= 0) {
        return { product_id: item.product_id, name: product.name, available: false, reason: 'out_of_stock' };
      }
      if (product.stock < item.quantity) {
        return {
          product_id: item.product_id,
          name: product.name,
          available: false,
          reason: 'insufficient_stock',
          stock: product.stock,
          requested: item.quantity,
        };
      }

      const currentPrice = product.on_offer && product.offer_price
        ? product.offer_price
        : product.price;

      return {
        product_id: item.product_id,
        name: product.name,
        available: true,
        stock: product.stock,
        current_price: currentPrice,
      };
    });

    const allAvailable = validation.every((v: any) => v.available);

    return new Response(
      JSON.stringify({ valid: allAvailable, items: validation }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
