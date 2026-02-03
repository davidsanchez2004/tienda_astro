import React, { useState } from 'react';

// Helper para establecer cookies de forma robusta
function setCookie(name: string, value: string, days: number = 1) {
  const maxAge = days * 24 * 60 * 60; // en segundos
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  // Sin Secure flag para evitar problemas con proxy HTTP/HTTPS
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; expires=${expires}; SameSite=Lax`;
}

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Validar si un token es válido
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token));
    return payload.exp && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export default function AdminLoginForm() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si ya está autenticado al cargar
  React.useEffect(() => {
    const existingToken = getCookie('admin_token');
    if (existingToken && isTokenValid(existingToken)) {
      console.log('[Admin Login] Already authenticated, redirecting...');
      window.location.href = '/admin/dashboard';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar email
    if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      setError('Introduce un email válido');
      return;
    }

    setLoading(true);

    try {
      // Validar la clave antes de guardarla
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include', // Importante para recibir cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminKey,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || 'Error al verificar credenciales');
        setLoading(false);
        return;
      }

      // Login exitoso - SIEMPRE guardar cookies del lado del cliente
      // Esto es necesario porque el servidor detrás de proxy puede tener problemas
      if (data.token && data.email) {
        console.log('[Admin Login] Setting cookies from client side...');
        setCookie('admin_token', data.token, 1);
        setCookie('admin_email', data.email, 1);
        
        // Verificar que se guardaron
        await new Promise(resolve => setTimeout(resolve, 50));
        const savedToken = getCookie('admin_token');
        console.log('[Admin Login] Token saved:', savedToken ? 'YES' : 'NO');
        
        if (!savedToken) {
          console.error('[Admin Login] FAILED to save cookie!');
          setError('Error al guardar sesión. Verifica que las cookies están habilitadas.');
          setLoading(false);
          return;
        }
      } else {
        setError('Respuesta del servidor incompleta');
        setLoading(false);
        return;
      }
      
      console.log('[Admin Login] Success! Redirecting...');
      window.location.href = '/admin/dashboard';
    } catch (err) {
      console.error('[Admin Login] Error:', err);
      setError('Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Email de Administrador
        </label>
        <input
          id="adminEmail"
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="admin@byarena.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4C5B9] focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <input
          id="adminKey"
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="Ingresa tu contraseña"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4C5B9] focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#D4C5B9] text-white py-3 rounded-lg hover:bg-[#8B7355] transition-colors font-medium disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Verificando...
          </span>
        ) : (
          'Acceder al Panel'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Las notificaciones de pedidos se enviarán a tu email
      </p>
    </form>
  );
}
