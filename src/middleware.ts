import { defineMiddleware } from 'astro:middleware';

// Rate limiting simple en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests por minuto

function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

// Helper para extraer token del header Cookie
function extractTokenFromHeader(cookieHeader: string): string | null {
  const match = cookieHeader.match(/admin_token=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const { request } = context;

  // Modo mantenimiento (verificar variable de entorno)
  const maintenanceMode = import.meta.env.MAINTENANCE_MODE === 'true';
  if (maintenanceMode && !pathname.startsWith('/mantenimiento') && !pathname.startsWith('/admin')) {
    return context.redirect('/mantenimiento');
  }

  // Rate limiting para APIs
  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request);
    const { allowed, remaining } = checkRateLimit(key);

    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        },
      });
    }

    // Añadir headers de rate limit a la respuesta
    const response = await next();
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }

  // Protección de rutas admin
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // Verificar token de admin en cookies
    const adminToken = context.cookies.get('admin_token');
    
    // También verificar el header Cookie directamente como respaldo
    const cookieHeader = request.headers.get('Cookie') || '';
    const hasTokenInHeader = cookieHeader.includes('admin_token=');
    
    console.log('[Middleware] Admin route:', pathname);
    console.log('[Middleware] Astro cookie:', adminToken?.value ? 'EXISTS' : 'NOT FOUND');
    console.log('[Middleware] Cookie header has token:', hasTokenInHeader);
    
    if (!adminToken?.value && !hasTokenInHeader) {
      console.log('[Middleware] No admin token, redirecting to login');
      return context.redirect('/admin/login');
    }
    
    // Validar que el token no ha expirado
    const tokenValue = adminToken?.value || extractTokenFromHeader(cookieHeader);
    if (tokenValue) {
      try {
        const payload = JSON.parse(Buffer.from(tokenValue, 'base64').toString());
        if (!payload.exp || payload.exp < Date.now()) {
          console.log('[Middleware] Token expired, redirecting to login');
          context.cookies.delete('admin_token', { path: '/' });
          context.cookies.delete('admin_email', { path: '/' });
          return context.redirect('/admin/login');
        }
        console.log('[Middleware] Token valid');
      } catch (e) {
        console.log('[Middleware] Invalid token format, redirecting to login');
        context.cookies.delete('admin_token', { path: '/' });
        context.cookies.delete('admin_email', { path: '/' });
        return context.redirect('/admin/login');
      }
    }
  }

  // Security headers
  const response = await next();
  
  // Añadir headers de seguridad
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
});
