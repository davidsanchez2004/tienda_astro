import { createClient } from '@supabase/supabase-js';

// Variables de entorno para Supabase (hardcodeadas temporalmente para Coolify)
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://orhtsdwenpgoofnpsouw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaHRzZHdlbnBnb29mbnBzb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjQzNjAsImV4cCI6MjA4NDU0MDM2MH0.79kiLMekVj2gq8EyGN0LVMMmmeq91jhnNQCHthf3AXQ';
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaHRzZHdlbnBnb29mbnBzb3V3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk2NDM2MCwiZXhwIjoyMDg0NTQwMzYwfQ.Zx0SPWTIbyfsfpTUretpxnLHUel4cOIy75a5oReDP-U';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper functions for database operations
export async function getUserById(userId: string) {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getProductById(productId: string) {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getProducts(filters?: {
  category_id?: string;
  featured?: boolean;
  active?: boolean;
}) {
  let query = supabaseClient.from('products').select('*');
  
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }
  if (filters?.active !== undefined) {
    query = query.eq('active', filters.active);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserOrders(userId: string) {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function validateCoupon(code: string) {
  const { data, error } = await supabaseClient
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('active', true)
    .single();
  
  if (error) return null;
  return data;
}
