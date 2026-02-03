import React, { useState, useEffect } from 'react';
import { getCart, getCartTotal, clearCart, type CartItem } from '../../stores/useCart';
import { supabaseClient } from '../../lib/supabase';

// Get shipping method from localStorage
function getShippingMethod(): 'delivery' | 'pickup' {
  if (typeof window === 'undefined') return 'delivery';
  return (localStorage.getItem('by_arena_shipping') as 'delivery' | 'pickup') || 'delivery';
}

// Save shipping method to localStorage
function saveShippingMethod(method: 'delivery' | 'pickup') {
  if (typeof window === 'undefined') return;
  localStorage.setItem('by_arena_shipping', method);
}

export default function CheckoutMode() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<'summary' | 'form'>('summary');
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingCost = shippingMethod === 'delivery' ? 2 : 0;
  const finalTotal = total + shippingCost;

  useEffect(() => {
    setIsClient(true);
    setCart(getCart());
    setTotal(getCartTotal());
    setShippingMethod(getShippingMethod());
    
    // Cargar datos del usuario logueado
    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
          const phone = user.user_metadata?.phone || '';
          
          setFormData(prev => ({
            ...prev,
            name: fullName,
            email: user.email || '',
            phone: phone,
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Escuchar cambios en el carrito (por cambio de sesión)
  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setCart(customEvent.detail);
        setTotal(customEvent.detail.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0));
      } else {
        setCart(getCart());
        setTotal(getCartTotal());
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);

  // Save shipping method when it changes
  useEffect(() => {
    if (isClient) {
      saveShippingMethod(shippingMethod);
    }
  }, [shippingMethod, isClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validations
      if (!formData.name || !formData.email) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      if (shippingMethod === 'delivery' && (!formData.address || !formData.city || !formData.postalCode)) {
        throw new Error('Por favor completa la dirección de envío');
      }

      // Create Stripe checkout session
      const orderData = {
        items: cart,
        customer: formData,
        shipping_method: shippingMethod,
        shipping_cost: shippingCost,
        subtotal: total,
        total: finalTotal
      };

      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      // Redirigir a Stripe Checkout
      // NOTA: NO vaciar carrito aquí - se vacía en checkout-exitoso.astro después de verificar pago
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se pudo obtener la URL de pago');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-arena"></div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-6">Añade productos antes de continuar con el pago</p>
        <a href="/catalogo" className="px-6 py-3 bg-arena text-white rounded-lg font-semibold hover:bg-arena-light transition-colors">
          Ver catálogo
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <a href="/carrito" className="inline-flex items-center text-arena hover:text-arena-light mb-6">
          ← Volver al carrito
        </a>

        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Finalizar compra</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Información de contacto</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: 612 345 678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Método de envío</h2>
                <div className="space-y-3">
                  <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${shippingMethod === 'delivery' ? 'border-arena bg-arena-pale' : 'border-gray-200 hover:border-arena-light'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === 'delivery'}
                        onChange={() => setShippingMethod('delivery')}
                        className="w-4 h-4 text-arena"
                      />
                      <div>
                        <span className="font-medium">Envío a domicilio</span>
                        <p className="text-sm text-gray-500">2-4 días laborables</p>
                      </div>
                    </div>
                    <span className="font-semibold">€2,00</span>
                  </label>
                  
                  <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${shippingMethod === 'pickup' ? 'border-arena bg-arena-pale' : 'border-gray-200 hover:border-arena-light'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === 'pickup'}
                        onChange={() => setShippingMethod('pickup')}
                        className="w-4 h-4 text-arena"
                      />
                      <div>
                        <span className="font-medium">Recogida en punto</span>
                        <p className="text-sm text-gray-500">Disponible en 24h</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </label>
                </div>
              </div>

              {/* Shipping Address - Only if delivery */}
              {shippingMethod === 'delivery' && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Dirección de envío</h2>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="Calle, número, piso..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Código Postal *
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Notas del pedido (opcional)</h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Instrucciones especiales para tu pedido..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-arena text-white font-semibold rounded-lg hover:bg-arena-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Procesando...' : `Confirmar pedido - €${finalTotal.toFixed(2)}`}
              </button>

              <p className="text-sm text-gray-500 text-center">
                Al confirmar, aceptas nuestros <a href="/terminos" className="text-arena hover:underline">términos y condiciones</a>
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                      <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                      <p className="text-sm font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className={shippingMethod === 'pickup' ? 'text-green-600' : ''}>
                    {shippingMethod === 'pickup' ? 'Gratis' : `€${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-arena">€{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
