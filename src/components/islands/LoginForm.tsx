import React, { useState } from 'react';
import { supabaseClient } from '../../lib/supabase-client';
import { onUserLogin } from '../../stores/useCart';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, authError });

      if (authError) {
        // Traducir mensajes de error comunes
        let errorMessage = authError.message;
        if (authError.message === 'Invalid login credentials') {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (authError.message === 'Email not confirmed') {
          errorMessage = 'Por favor, confirma tu email antes de iniciar sesión';
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // SINCRONIZAR CARRITO AL HACER LOGIN
      if (data.user?.id) {
        console.log('[LoginForm] Login success, syncing cart for user:', data.user.id);
        onUserLogin(data.user.id);
      }

      // Si llegamos aquí, el login fue exitoso
      setSuccess(true);
      setLoading(false);
      
      // Redirigir inmediatamente a la página de inicio
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-arena-light shadow-sm">
      <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">
        Inicia Sesión
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">¡Bienvenido/a!</h3>
          <p className="text-green-600 text-sm">Redirigiendo a la tienda...</p>
          <div className="mt-3">
            <div className="animate-spin inline-block w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      )}

      {!success && (
        <>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full"
              />
              <a href="/recuperar-contraseña" className="text-xs text-arena hover:text-arena-light mt-2 inline-block">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-arena hover:bg-arena-light text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              )}
              {loading ? 'Conectando...' : 'Inicia Sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            ¿No tienes cuenta?{' '}
            <a href="/registro" className="text-arena font-semibold hover:text-arena-light">
              Regístrate aquí
            </a>
          </p>
        </>
      )}
    </div>
  );
}
