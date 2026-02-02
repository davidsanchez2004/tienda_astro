import React, { useState } from 'react';
import { supabaseClient } from '../../lib/supabase';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        setSuccess(true);
        setStep('reset');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      {success && step === 'email' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          ¡Email enviado! Revisa tu correo para el enlace de recuperación.
        </div>
      )}

      {success && step === 'reset' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          ¡Contraseña actualizada! Redirigiendo a login...
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
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
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
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
