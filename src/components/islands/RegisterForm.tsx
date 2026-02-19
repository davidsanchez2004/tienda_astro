import React, { useState } from 'react';
import { supabaseClient } from '../../lib/supabase';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, sign up the user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabaseClient
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email,
              full_name: fullName,
              role: 'customer',
            },
          ]);

        if (profileError) {
          setError(profileError.message);
        } else {
          // Vincular pedidos anteriores como invitado a la nueva cuenta
          try {
            const claimRes = await fetch('/api/orders/claim-guest-orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: authData.user.id,
                email,
              }),
            });
            const claimData = await claimRes.json();
            if (claimData.claimedOrders > 0) {
              console.log(`Se vincularon ${claimData.claimedOrders} pedido(s) de invitado a la nueva cuenta`);
            }
          } catch (claimErr) {
            console.error('Error claiming guest orders:', claimErr);
            // No fallamos si no se pueden vincular
          }

          // Enviar email de bienvenida
          try {
            await fetch('/api/email/send-branded', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                template: 'welcome',
                to: email,
                data: {
                  name: fullName.split(' ')[0] // Primer nombre
                }
              })
            });
          } catch (emailErr) {
            console.error('Error sending welcome email:', emailErr);
            // No fallamos si el email no se envía
          }
          
          setSuccess(true);
          setEmail('');
          setPassword('');
          setFullName('');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-arena-light shadow-sm">
      <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">
        Crear Cuenta
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">¡Te has registrado correctamente!</h3>
          <p className="text-green-600 text-sm mb-4">Revisa tu correo electrónico para confirmar tu cuenta.</p>
          <a 
            href="/login" 
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Ir a Iniciar Sesión
          </a>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre"
            required
            disabled={loading}
            className="w-full"
          />
        </div>

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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-arena hover:bg-arena-light text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="text-arena font-semibold hover:text-arena-light">
          Inicia sesión aquí
        </a>
      </p>
    </div>
  );
}
