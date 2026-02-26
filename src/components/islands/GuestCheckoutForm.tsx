import React, { useState } from 'react';
import { supabaseClient } from '../../lib/supabase-client';
import { useCart } from '../../stores/useCart';
import DiscountCodeInput from './DiscountCodeInput';

interface DiscountResult {
  valid: boolean;
  code?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  calculatedDiscount?: number;
  message?: string;
  error?: string;
}

interface GuestCheckoutData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export default function GuestCheckoutForm() {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountResult | null>(null);
  const [formData, setFormData] = useState<GuestCheckoutData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'España',
  });

  // Calcular total con descuento
  const discountAmount = appliedDiscount?.calculatedDiscount || 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.first_name || !formData.last_name) {
      setError('El nombre completo es requerido');
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email válido es requerido');
      return false;
    }
    if (!formData.phone) {
      setError('Teléfono es requerido');
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
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Crear orden como invitado
      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .insert([
          {
            checkout_type: 'guest',
            guest_first_name: formData.first_name,
            guest_last_name: formData.last_name,
            guest_email: formData.email,
            guest_phone: formData.phone,
            shipping_address: formData.address,
            shipping_city: formData.city,
            shipping_state: formData.state,
            shipping_zip: formData.zip_code,
            shipping_country: formData.country,
            subtotal: total,
            discount_amount: discountAmount,
            total: finalTotal,
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
          email: formData.email,
          amount: finalTotal,
          orderItems: items,
          checkoutType: 'guest',
          discountCode: appliedDiscount?.code || null,
          discountAmount: discountAmount,
        }),
      });

      const { url } = await response.json();

      // Enviar emails de confirmación (cliente y admin)
      await fetch('/api/email/send-branded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'order_confirmation_customer',
          to: formData.email,
          data: {
            orderId: orderData.id,
            orderNumber: orderData.id.slice(0, 8).toUpperCase(),
            customerName: `${formData.first_name} ${formData.last_name}`,
            customerEmail: formData.email,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: total,
            shippingCost: 0,
            discount: discountAmount,
            discountCode: appliedDiscount?.code || null,
            total: finalTotal,
            shippingAddress: {
              street: formData.address,
              city: formData.city,
              postalCode: formData.zip_code,
              country: formData.country,
            },
            shippingMethod: 'home',
          },
        }),
      }).catch(err => console.error('Error sending customer email:', err));

      // Notificar al admin
      await fetch('/api/email/send-branded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'order_notification_admin',
          to: 'davidsanchezacosta0@gmail.com',
          data: {
            orderId: orderData.id,
            orderNumber: orderData.id.slice(0, 8).toUpperCase(),
            customerName: `${formData.first_name} ${formData.last_name}`,
            customerEmail: formData.email,
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: total,
            shippingCost: 0,
            discount: discountAmount,
            discountCode: appliedDiscount?.code || null,
            total: finalTotal,
            shippingAddress: {
              street: formData.address,
              city: formData.city,
              postalCode: formData.zip_code,
              country: formData.country,
            },
            shippingMethod: 'home',
          },
        }),
      }).catch(err => console.error('Error sending admin email:', err));

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

  if (success) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-bold text-green-900 mb-2">¡Orden confirmada!</h2>
          <p className="text-green-700">Se envió un confirmación a {formData.email}</p>
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

      {/* Nombre */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            placeholder="Juan"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Apellido</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            placeholder="Pérez"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
            disabled={loading}
          />
        </div>
      </div>

      {/* Email y Teléfono */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="juan@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+52 55 1234 5678"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
            disabled={loading}
          />
        </div>
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
          <option>España</option>
          <option>Portugal</option>
          <option>Francia</option>
          <option>Italia</option>
          <option>Alemania</option>
          <option>Otro</option>
        </select>
      </div>

      {/* Resumen de compra */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Resumen de la compra</h3>
        <div className="space-y-2 text-sm">
          {items.map(item => (
            <div key={item.product_id} className="flex justify-between">
              <span>{item.name} x{item.quantity}</span>
              <span>€{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between">
            <span>Subtotal</span>
            <span>€{total.toFixed(2)}</span>
          </div>
          {appliedDiscount?.valid && (
            <div className="flex justify-between text-green-600">
              <span>Descuento ({appliedDiscount.code})</span>
              <span>-€{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>€{finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Código de descuento */}
      <div className="mb-6">
        <DiscountCodeInput
          cartTotal={total}
          userEmail={formData.email}
          onDiscountApplied={setAppliedDiscount}
          appliedDiscount={appliedDiscount}
          onRemoveDiscount={() => setAppliedDiscount(null)}
        />
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
