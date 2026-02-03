import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

const ADMIN_SECRET_KEY = import.meta.env.ADMIN_SECRET_KEY || 'AdminByArena2026!';

// Crear un token simple (en producción usarías JWT)
function createAdminToken(email: string): string {
  const payload = { email, exp: Date.now() + (24 * 60 * 60 * 1000) }; // 24 horas
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export const POST: APIRoute = async ({ request, cookies }) => {
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

    // Crear token y guardarlo en cookie
    const token = createAdminToken(email);
    
    // Detectar si estamos en producción (HTTPS)
    const isProduction = request.url.startsWith('https://') || 
                         request.headers.get('x-forwarded-proto') === 'https';
    
    console.log('[Admin Login] Setting cookies, isProduction:', isProduction);
    console.log('[Admin Login] Token:', token.substring(0, 20) + '...');
    
    // Establecer cookie con el token
    cookies.set('admin_token', token, {
      path: '/',
      httpOnly: false, // Necesitamos leerla desde JS
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 horas
    });

    cookies.set('admin_email', email, {
      path: '/',
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Login exitoso',
        email: email,
        token: token
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Admin login error:', error);
    return new Response(
      JSON.stringify({ error: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
