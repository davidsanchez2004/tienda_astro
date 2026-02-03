// Helper para validar autenticación de admin

const ADMIN_SECRET_KEY = import.meta.env.ADMIN_SECRET_KEY || 'AdminByArena2026!';

// Función para validar el token de admin
export function validateAdminToken(token: string): boolean {
  if (!token || token.length < 10) {
    console.log('[AdminAuth] Token too short or empty');
    return false;
  }
  
  try {
    // Limpiar el token de posibles caracteres problemáticos
    const cleanToken = token.trim();
    
    // Decodificar base64
    let decoded: string;
    try {
      decoded = Buffer.from(cleanToken, 'base64').toString('utf-8');
    } catch {
      // Intentar con atob si Buffer falla (aunque no debería en Node)
      decoded = atob(cleanToken);
    }
    
    const payload = JSON.parse(decoded);
    
    // Verificar que tiene los campos esperados
    if (!payload.email || !payload.exp) {
      console.log('[AdminAuth] Token missing required fields');
      return false;
    }
    
    // Verificar que no ha expirado
    if (payload.exp > Date.now()) {
      console.log('[AdminAuth] Token valid for:', payload.email);
      return true;
    }
    
    console.log('[AdminAuth] Token expired at:', new Date(payload.exp).toISOString());
    return false;
  } catch (e) {
    console.log('[AdminAuth] Invalid token format:', e instanceof Error ? e.message : 'unknown error');
    return false;
  }
}

// Helper para parsear cookies del header Cookie
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  return cookies;
}

// Función principal para verificar si una request es de admin autenticado
export function isAdminAuthenticated(request: Request, cookies?: any): boolean {
  console.log('[AdminAuth] Checking authentication...');
  
  // 1. Intentar con cookie de Astro
  if (cookies) {
    const tokenFromCookie = cookies.get('admin_token')?.value;
    console.log('[AdminAuth] Astro cookie admin_token:', tokenFromCookie ? 'EXISTS' : 'NOT FOUND');
    if (tokenFromCookie && validateAdminToken(tokenFromCookie)) {
      console.log('[AdminAuth] Authenticated via Astro cookie');
      return true;
    }
  }
  
  // 2. Intentar con header Cookie directamente (respaldo)
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const parsedCookies = parseCookies(cookieHeader);
    const tokenFromHeader = parsedCookies['admin_token'];
    console.log('[AdminAuth] Cookie header admin_token:', tokenFromHeader ? 'EXISTS' : 'NOT FOUND');
    if (tokenFromHeader && validateAdminToken(tokenFromHeader)) {
      console.log('[AdminAuth] Authenticated via Cookie header');
      return true;
    }
  }
  
  // 3. Intentar con header x-admin-key (clave secreta directa)
  const keyFromHeader = request.headers.get('x-admin-key');
  if (keyFromHeader === ADMIN_SECRET_KEY) {
    console.log('[AdminAuth] Authenticated via ADMIN_SECRET_KEY');
    return true;
  }
  
  // 4. Intentar con header x-admin-key (token)
  if (keyFromHeader && validateAdminToken(keyFromHeader)) {
    console.log('[AdminAuth] Authenticated via x-admin-key token');
    return true;
  }
  
  // 5. Intentar con Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (validateAdminToken(token)) {
      console.log('[AdminAuth] Authenticated via Authorization Bearer');
      return true;
    }
  }
  
  console.log('[AdminAuth] Authentication FAILED');
  return false;
}
