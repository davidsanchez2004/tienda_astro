import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY
);

export const GET: APIRoute = async (context) => {
  try {
    // Verificar admin key
    const adminKey = context.request.headers.get('x-admin-key');
    if (adminKey !== import.meta.env.ADMIN_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener últimos 100 webhook logs ordenados por fecha descending
    const { data: webhooks, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return new Response(JSON.stringify({ webhooks }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch webhooks',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
