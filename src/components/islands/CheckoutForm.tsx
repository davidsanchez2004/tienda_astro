import React, { useState, useEffect } from 'react';
import { useCart } from '../../stores/useCart';
import { supabaseClient } from '../../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

interface User {
  id: string;
  email?: string;
}

export default function CheckoutForm() {
  const { items: cart, total: subtotal, clearCart } = useCart();
  const [user, setUser] = useState<User | null>(null);
  
  // Calculate shipping cost based on option
  const shippingCost = 0; // Will be calculated based on shippingOption

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUser(session?.user || null);
    }
    init();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);
  
  const [shippingOption, setShippingOption] = useState<'pickup' | 'home'>('pickup');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [address, setAddress] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    street: '',
    number: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Spain',
  });

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('Debes iniciar sesión');
      if (cart.length === 0) throw new Error('Tu carrito está vacío');

      // Call create-session API
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          shippingOption,
          shippingAddress: address,
          couponCode: couponCode || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">Debes iniciar sesión para continuar</p>
        <a href="/login" className="text-arena font-semibold hover:text-arena-light">
          Inicia sesión aquí
        </a>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">Tu carrito está vacío</p>
        <a href="/catalogo" className="text-arena font-semibold hover:text-arena-light">
          Volver a comprar
        </a>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-12">
      {/* Form */}
      <form onSubmit={handleCheckout} className="lg:col-span-2 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Shipping Option */}
        <div className="bg-white rounded-lg border border-arena-light p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Opción de Envío</h3>
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-arena-light rounded-lg cursor-pointer hover:bg-arena-pale transition-colors">
              <input
                type="radio"
                name="shipping"
                value="pickup"
                checked={shippingOption === 'pickup'}
                onChange={(e) => setShippingOption(e.target.value as 'pickup' | 'home')}
                className="w-4 h-4"
              />
              <span className="ml-3">
                <strong>Recoger en punto de recogida</strong>
                <p className="text-sm text-gray-600">Gratis</p>
              </span>
            </label>

            <label className="flex items-center p-3 border border-arena-light rounded-lg cursor-pointer hover:bg-arena-pale transition-colors">
              <input
                type="radio"
                name="shipping"
                value="home"
                checked={shippingOption === 'home'}
                onChange={(e) => setShippingOption(e.target.value as 'pickup' | 'home')}
                className="w-4 h-4"
              />
              <span className="ml-3">
                <strong>Envío a domicilio</strong>
                <p className="text-sm text-gray-600">€2.00</p>
              </span>
            </label>
          </div>
        </div>

        {/* Shipping Address */}
        {shippingOption === 'home' && (
          <div className="bg-white rounded-lg border border-arena-light p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dirección de Envío</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Nombre completo"
                value={address.name}
                onChange={handleAddressChange}
                required
                disabled={loading}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={address.email}
                onChange={handleAddressChange}
                required
                disabled={loading}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Teléfono"
                value={address.phone}
                onChange={handleAddressChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="street"
                placeholder="Calle"
                value={address.street}
                onChange={handleAddressChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="number"
                placeholder="Número"
                value={address.number}
                onChange={handleAddressChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="apartment"
                placeholder="Apartamento (opcional)"
                value={address.apartment}
                onChange={handleAddressChange}
                disabled={loading}
              />
              <input
                type="text"
                name="city"
                placeholder="Ciudad"
                value={address.city}
                onChange={handleAddressChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="state"
                placeholder="Provincia"
                value={address.state}
                onChange={handleAddressChange}
                required
                disabled={loading}
              />
              <input
                type="text"
                name="postal_code"
                placeholder="Código Postal"
                value={address.postal_code}
                onChange={handleAddressChange}
                required
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Coupon */}
        <div className="bg-white rounded-lg border border-arena-light p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cupón de Descuento</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ingresa tu código"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <button
              type="button"
              disabled={loading}
              className="px-6 py-3 border border-arena text-arena font-semibold rounded-lg hover:bg-arena-pale transition-colors disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-arena text-white font-bold rounded-lg text-lg hover:bg-arena-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : 'Ir a Pago Seguro'}
        </button>
      </form>

      {/* Order Summary */}
      <aside className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-arena-light p-6 sticky top-20">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen de Compra</h3>

          <div className="space-y-4 mb-6 pb-6 border-b border-arena-light">
            <div className="flex justify-between">
              <span className="text-gray-600">Productos ({cart.length})</span>
              <span className="font-semibold">€{subtotal.toFixed(2)}</span>
            </div>
            {shippingOption === 'home' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Envío a domicilio</span>
                <span className="font-semibold">€{shippingCost.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-lg mb-6">
            <span className="font-serif font-bold">Total</span>
            <span className="text-arena font-bold">€{(subtotal + (shippingOption === 'home' ? shippingCost : 0)).toFixed(2)}</span>
          </div>

          <p className="text-sm text-gray-500 text-center">
            Pago seguro con Stripe
          </p>
        </div>
      </aside>
    </div>
  );
}
