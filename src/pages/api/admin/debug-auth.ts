import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies }) => {
  // Debug: mostrar todas las cookies y headers
  const allCookies: Record<string, string> = {};
  
  // Leer cookies del objeto cookies de Astro
  const adminToken = cookies.get('admin_token');
  const adminEmail = cookies.get('admin_email');
  
  // Leer Cookie header directamente
  const cookieHeader = request.headers.get('Cookie') || '';
  
  // Leer todos los headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      astroCookies: {
        admin_token: adminToken ? { value: adminToken.value, exists: true } : { exists: false },
        admin_email: adminEmail ? { value: adminEmail.value, exists: true } : { exists: false },
      },
      cookieHeader: cookieHeader,
      allHeaders: headers,
      xAdminKey: request.headers.get('x-admin-key') || 'NOT SET',
    }, null, 2),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
