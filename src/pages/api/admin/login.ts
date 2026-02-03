import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

const ADMIN_SECRET_KEY = import.meta.env.ADMIN_SECRET_KEY || 'AdminByArena2026!';

// Crear un token simple (en producción usarías JWT)
function createAdminToken(email: string): string {
  const payload = { email, exp: Date.now() + (24 * 60 * 60 * 1000) }; // 24 horas
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validar campos
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar contraseña
    if (password !== ADMIN_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Credenciales incorrectas' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Guardar o actualizar el email del admin en la base de datos
    const { data: existingAdmin, error: fetchError } = await supabaseAdminClient
      .from('admin_settings')
      .select('*')
      .eq('key', 'admin_email')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching admin settings:', fetchError);
    }

    if (existingAdmin) {
      // Actualizar email existente
      await supabaseAdminClient
        .from('admin_settings')
        .update({ value: email, updated_at: new Date().toISOString() })
        .eq('key', 'admin_email');
    } else {
      // Crear registro de email
      await supabaseAdminClient
        .from('admin_settings')
        .insert({ key: 'admin_email', value: email });
    }

    // Crear token
    const token = createAdminToken(email);
    
    console.log('[Admin Login] Token created for:', email);
    console.log('[Admin Login] Token:', token.substring(0, 30) + '...');
    
    // Crear cookies manualmente - SIN secure para evitar problemas con proxy
    // El maxAge es en segundos: 86400 = 24 horas
    const maxAge = 86400;
    const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
    
    // Construir Set-Cookie headers manualmente
    const tokenCookie = `admin_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; Expires=${expires}; SameSite=Lax`;
    const emailCookie = `admin_email=${encodeURIComponent(email)}; Path=/; Max-Age=${maxAge}; Expires=${expires}; SameSite=Lax`;
    
    console.log('[Admin Login] Setting cookies via headers');
    
    // Crear response con múltiples Set-Cookie headers
    const response = new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Login exitoso',
        email: email,
        token: token
      }),
      { 
        status: 200, 
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    // Añadir ambas cookies
    response.headers.append('Set-Cookie', tokenCookie);
    response.headers.append('Set-Cookie', emailCookie);
    
    return response;

  } catch (error: any) {
    console.error('Admin login error:', error);
    return new Response(
      JSON.stringify({ error: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
