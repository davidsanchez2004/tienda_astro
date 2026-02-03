import React, { useState } from 'react';

export default function AdminLoginForm() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      // Login exitoso - guardar credenciales y redirigir
      console.log('[Admin Login] Login exitoso, guardando en sessionStorage...');
      try {
        sessionStorage.setItem('adminKey', adminKey);
        sessionStorage.setItem('adminEmail', adminEmail);
        
        // Verificar que se guardó
        const savedKey = sessionStorage.getItem('adminKey');
        console.log('[Admin Login] Clave guardada:', savedKey ? 'Sí' : 'No');
        
        if (savedKey) {
          // Pequeño delay para asegurar que sessionStorage se sincronice
          setTimeout(() => {
            window.location.href = '/admin/dashboard';
          }, 100);
        } else {
          setError('Error guardando la sesión. Intenta de nuevo.');
          setLoading(false);
        }
      } catch (storageError) {
        console.error('[Admin Login] Error guardando en sessionStorage:', storageError);
        setError('Error de almacenamiento. Verifica que las cookies están habilitadas.');
        setLoading(false);
      }
    } catch (err) {
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
