import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const productIds = items.map((item: any) => item.product_id);

    // Get current stock for all requested products
    const { data: products, error } = await supabaseAdminClient
      .from('products')
      .select('id, name, stock, active, price')
      .in('id', productIds);

    if (error) throw error;

    const results = items.map((item: any) => {
      const product = products?.find((p: any) => p.id === item.product_id);
      
      if (!product) {
        return {
          product_id: item.product_id,
          name: 'Producto no encontrado',
          requested: item.quantity,
          available: false,
          stock: 0,
        };
      }

      if (!product.active) {
        return {
          product_id: item.product_id,
          name: product.name,
          requested: item.quantity,
          available: false,
          stock: 0,
          reason: 'Producto no disponible',
        };
      }

      return {
        product_id: item.product_id,
        name: product.name,
        requested: item.quantity,
        available: product.stock >= item.quantity,
        stock: product.stock,
        price: product.price,
      };
    });

    const allValid = results.every((r: any) => r.available);

    return new Response(
      JSON.stringify({
        valid: allValid,
        items: results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Stock validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
