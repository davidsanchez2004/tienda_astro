import React, { useState } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { useCart } from '../../stores/useCart';

interface RegisteredCheckoutData {
  full_name?: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export default function RegisteredCheckoutForm() {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<RegisteredCheckoutData>({
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'España',
  });

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      setUser(user);
      if (user) {
        // Intentar obtener datos de user_metadata primero
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const phone = user.user_metadata?.phone || '';
        
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          full_name: fullName,
          phone: phone,
        }));
      }
    };
    getUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.full_name) {
      setError('El nombre completo es requerido');
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email válido es requerido');
      return false;
    }
    if (!formData.phone) {
      setError('El teléfono es requerido');
      return false;
    }
    if (!formData.address || !formData.city || !formData.state || !formData.zip_code) {
      setError('La dirección completa es requerida');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setLoading(true);
    setError('');

    try {
      // Crear orden
      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .insert([
          {
            user_id: user.id,
            checkout_type: 'registered',
            shipping_address: formData.address,
            shipping_city: formData.city,
            shipping_state: formData.state,
            shipping_zip: formData.zip_code,
            shipping_country: formData.country,
            total: total,
            status: 'pending_payment',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear items de la orden
      if (orderData && items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabaseClient
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Redirigir a Stripe checkout
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          email: user.email,
          amount: total,
          orderItems: items,
          checkoutType: 'registered',
        }),
      });

      const { url } = await response.json();

      // Enviar email de confirmación
      await fetch('/api/email/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          email: user.email,
          customerName: user.user_metadata?.full_name || user.email || 'Cliente',
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: total,
          shippingAddress: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip_code}`,
          checkoutType: 'registered',
        }),
      }).catch(err => console.error('Error sending email:', err));

      if (url) {
        window.location.href = url;
      } else {
        setSuccess(true);
        clearCart();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la orden');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Por favor inicia sesión para continuar</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-bold text-green-900 mb-2">¡Orden confirmada!</h2>
          <p className="text-green-700">Se envió una confirmación a {user.email}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Información de Envío</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Nombre (pre-rellenado) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Nombre Completo</label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name || ''}
          onChange={handleInputChange}
          placeholder="Tu nombre completo"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
          disabled={loading}
          required
        />
      </div>

      {/* Email (editable) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email || ''}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
          disabled={loading}
          required
        />
      </div>

      {/* Teléfono (pre-rellenado) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Teléfono</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone || ''}
          onChange={handleInputChange}
          placeholder="Tu número de teléfono"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
          disabled={loading}
          required
        />
      </div>

      {/* Dirección */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Dirección</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="Calle Principal 123"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
          disabled={loading}
        />
      </div>

      {/* Ciudad, Estado, CP */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="México"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="CDMX"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Código Postal</label>
          <input
            type="text"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleInputChange}
            placeholder="06600"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
            disabled={loading}
          />
        </div>
      </div>

      {/* País */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">País</label>
        <select
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
          disabled={loading}
        >
          <option>México</option>
          <option>Estados Unidos</option>
          <option>Canadá</option>
          <option>Colombia</option>
          <option>Argentina</option>
        </select>
      </div>

      {/* Resumen de compra */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Resumen de la compra</h3>
        <div className="space-y-2 text-sm">
          {items.map(item => (
            <div key={item.product_id} className="flex justify-between">
              <span>{item.name} x{item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-arena text-white py-3 rounded-lg hover:bg-arena/90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : 'Proceder al Pago'}
      </button>
    </form>
  );
}
