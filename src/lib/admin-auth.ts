// Helper para validar autenticación de admin

const ADMIN_SECRET_KEY = import.meta.env.ADMIN_SECRET_KEY || 'AdminByArena2026!';

// Función para validar el token de admin
export function validateAdminToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    // Verificar que no ha expirado
    if (payload.exp && payload.exp > Date.now()) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Función principal para verificar si una request es de admin autenticado
export function isAdminAuthenticated(request: Request, cookies?: any): boolean {
  // 1. Intentar con cookie
  if (cookies) {
    const tokenFromCookie = cookies.get('admin_token')?.value;
    if (tokenFromCookie && validateAdminToken(tokenFromCookie)) {
      return true;
    }
  }
  
  // 2. Intentar con header x-admin-key (clave secreta directa)
  const keyFromHeader = request.headers.get('x-admin-key');
  if (keyFromHeader === ADMIN_SECRET_KEY) {
    return true;
  }
  
  // 3. Intentar con header x-admin-key (token)
  if (keyFromHeader && validateAdminToken(keyFromHeader)) {
    return true;
  }
  
  // 4. Intentar con Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (validateAdminToken(token)) {
      return true;
    }
  }
  
  return false;
}
