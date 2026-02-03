import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [canResetPassword, setCanResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verificar si el usuario viene del enlace del email
  useEffect(() => {
    const checkSession = async () => {
      // Verificar si hay un token en la URL (viene del email)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (accessToken && type === 'recovery') {
        // El usuario viene del enlace de recuperación
        setCanResetPassword(true);
      }
    };
    
    checkSession();
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-contraseña`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setEmailSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-arena-light shadow-sm p-8">
      <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">
        Recuperar Contraseña
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          ¡Contraseña actualizada! Redirigiendo a login...
        </div>
      )}

      {/* Paso 1: Solicitar email de recuperación */}
      {!canResetPassword && !emailSent && (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <p className="text-gray-600 text-sm mb-4">
            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Asociado
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-arena-light focus:outline-none focus:ring-2 focus:ring-arena"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-arena hover:bg-arena-light text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>
      )}

      {/* Paso 2: Email enviado - esperando que el usuario haga clic */}
      {!canResetPassword && emailSent && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">¡Revisa tu correo!</h3>
          <p className="text-gray-600 text-sm">
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
          </p>
          <p className="text-gray-500 text-xs">
            Si no lo encuentras, revisa la carpeta de spam.
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="text-arena hover:text-arena-light text-sm font-medium"
          >
            ¿No recibiste el email? Intentar de nuevo
          </button>
        </div>
      )}

      {/* Paso 3: Usuario viene del email - puede cambiar contraseña */}
      {canResetPassword && !success && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-gray-600 text-sm mb-4">
            Introduce tu nueva contraseña.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-arena-light focus:outline-none focus:ring-2 focus:ring-arena"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-arena-light focus:outline-none focus:ring-2 focus:ring-arena"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-arena hover:bg-arena-light text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-600 mt-6">
        ¿Recordaste tu contraseña?{' '}
        <a href="/login" className="text-arena font-semibold hover:text-arena-light">
          Inicia sesión aquí
        </a>
      </p>
    </div>
  );
}
