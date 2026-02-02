import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

/**
 * API endpoint to run database migrations
 * Only accessible with admin key
 */
export const POST: APIRoute = async ({ request }) => {
  const adminKey = request.headers.get('x-admin-key');
  
  if (adminKey !== import.meta.env.ADMIN_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    // Test if on_offer column exists by selecting it
    const { data: testData, error: testError } = await supabaseAdminClient
      .from('products')
      .select('id, on_offer')
      .limit(1);

    if (testError && testError.message.includes('on_offer')) {
      // Column doesn't exist, we need to add it via Supabase Dashboard
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Please run the migration SQL in Supabase Dashboard',
        sql: `
ALTER TABLE products ADD COLUMN IF NOT EXISTS on_offer BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_percentage INTEGER;
        `
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Offer columns already exist',
      data: testData
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { status: 500 });
  }
};
