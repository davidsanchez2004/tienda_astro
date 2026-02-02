import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseAdminClient
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        categories: data || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
};
