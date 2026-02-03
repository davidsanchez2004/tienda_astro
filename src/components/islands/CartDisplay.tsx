import React, { useEffect, useState } from 'react';
import { getCart, saveCart, type CartItem } from '../../stores/useCart';

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

export default function CartDisplay() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');
  
  const shippingCost = shippingMethod === 'delivery' ? 2 : 0;

  // Mark as client-side and load cart + shipping method
  useEffect(() => {
    setIsClient(true);
    const loadedCart = getCart();
    setCart(loadedCart);
    setShippingMethod(getShippingMethod());
  }, []);

  // Save shipping method when it changes
  useEffect(() => {
    if (isClient) {
      saveShippingMethod(shippingMethod);
    }
  }, [shippingMethod, isClient]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setCart(customEvent.detail);
      } else {
        setCart(getCart());
      }
    };

    const handleStorageUpdate = () => {
      setCart(getCart());
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setCart(newCart);
    saveCart(newCart);
  };

  const removeFromCart = (itemId: string) => {
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    saveCart(newCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + (cart.length > 0 ? shippingCost : 0);

  // Server-side or initial render: show loading
  if (!isClient) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-arena mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando carrito...</p>
      </div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-6">¡Explora nuestro catálogo y encuentra algo que te encante!</p>
        <a 
          href="/catalogo" 
          className="inline-block px-6 py-3 bg-arena text-white font-semibold rounded-lg hover:bg-arena-light transition-colors"
        >
          Ver catálogo
        </a>
      </div>
    );
  }

  // Cart with items
  return (
    <div className="space-y-6">
      {/* Items */}
      <div className="space-y-4">
        {cart.map(item => (
          <div key={item.id} className="flex gap-4 p-4 bg-white border border-arena-light rounded-lg">
            <a href={`/producto/${item.product_id}`}>
              <img
                src={item.image_url}
                alt={item.name}
                className="w-24 h-24 object-cover rounded hover:opacity-80 transition-opacity"
              />
            </a>
            <div className="flex-1">
              <a href={`/producto/${item.product_id}`} className="hover:text-arena transition-colors">
                <h4 className="font-serif font-semibold text-gray-900">
                  {item.name}
                </h4>
              </a>
              <p className="text-sm text-gray-600 mb-2">
                €{item.price.toFixed(2)} c/u
              </p>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="px-3 py-1 border border-arena-light rounded hover:bg-arena-pale transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-3 py-1 border border-arena-light rounded hover:bg-arena-pale transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                Subtotal: €{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-600 hover:text-red-700 font-semibold self-start text-xl"
              aria-label="Eliminar"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Shipping Options */}
      <div className="bg-white border border-arena-light rounded-lg p-6">
        <h3 className="font-serif font-semibold text-gray-900 mb-4">Método de envío</h3>
        <div className="space-y-3">
          <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${shippingMethod === 'delivery' ? 'border-arena bg-arena-pale' : 'border-gray-200 hover:border-arena-light'}`}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                value="delivery"
                checked={shippingMethod === 'delivery'}
                onChange={() => setShippingMethod('delivery')}
                className="w-4 h-4 text-arena"
              />
              <div>
                <span className="font-medium text-gray-900">Envío a domicilio</span>
                <p className="text-sm text-gray-500">Recibe tu pedido en casa en 2-4 días</p>
              </div>
            </div>
            <span className="font-semibold text-gray-900">€2,00</span>
          </label>
          
          <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${shippingMethod === 'pickup' ? 'border-arena bg-arena-pale' : 'border-gray-200 hover:border-arena-light'}`}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                value="pickup"
                checked={shippingMethod === 'pickup'}
                onChange={() => setShippingMethod('pickup')}
                className="w-4 h-4 text-arena"
              />
              <div>
                <span className="font-medium text-gray-900">Recogida en punto</span>
                <p className="text-sm text-gray-500">Recoge gratis en nuestro punto de entrega</p>
              </div>
            </div>
            <span className="font-semibold text-green-600">Gratis</span>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-arena-pale rounded-lg p-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-700">Subtotal</span>
          <span className="font-semibold">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">
            {shippingMethod === 'delivery' ? 'Envío a domicilio' : 'Recogida en punto'}
          </span>
          <span className={`font-semibold ${shippingMethod === 'pickup' ? 'text-green-600' : ''}`}>
            {shippingMethod === 'pickup' ? 'Gratis' : `€${shippingCost.toFixed(2)}`}
          </span>
        </div>
        <div className="border-t border-arena pt-3 flex justify-between text-lg">
          <span className="font-serif font-bold">Total</span>
          <span className="font-bold text-arena">€{total.toFixed(2)}</span>
        </div>
      </div>

      <a
        href="/checkout"
        className="block w-full py-3 px-4 bg-arena text-white font-semibold rounded-lg text-center hover:bg-arena-light transition-colors"
      >
        Proceder al pago
      </a>

      <a
        href="/catalogo"
        className="block text-center text-arena hover:text-arena-light font-medium"
      >
        ← Continuar comprando
      </a>
    </div>
  );
}
