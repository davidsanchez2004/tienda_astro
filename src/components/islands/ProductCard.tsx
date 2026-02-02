import React, { useState } from 'react';
import type { Product } from '../../lib/types';

interface ProductCardProps {
  product: Product;
}

// Generate unique ID for cart items
function generateId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get cart from localStorage
function getCart() {
  if (typeof window === 'undefined') return [];
  try {
    const cart = localStorage.getItem('by_arena_cart');
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

// Save cart to localStorage
function saveCart(cart: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('by_arena_cart', JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  // Calculate final price
  const finalPrice = product.on_offer && product.offer_price 
    ? product.offer_price 
    : product.on_offer && product.offer_percentage 
      ? product.price * (1 - product.offer_percentage / 100)
      : product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    
    try {
      const cart = getCart();
      const existingIndex = cart.findIndex((item: any) => item.product_id === product.id);
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          id: generateId(),
          product_id: product.id,
          name: product.name,
          image_url: product.image_url,
          quantity,
          price: finalPrice
        });
      }
      
      saveCart(cart);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= product.stock) {
      setQuantity(newQty);
    }
  };

  const inStock = product.stock > 0;

  return (
    <div className="bg-white rounded-lg border border-arena-light overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      {/* Clickable Image Area */}
      <a href={`/producto/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-arena-pale">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {/* Badges */}
          {product.on_offer && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
              {product.offer_percentage ? `-${product.offer_percentage}%` : 'OFERTA'}
            </div>
          )}
          {product.featured && !product.on_offer && (
            <div className="absolute top-3 right-3 bg-gold text-white px-2 py-1 rounded text-xs font-semibold">
              Destacado
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Agotado</span>
            </div>
          )}
        </div>
      </a>

      {/* Content - flex-grow to push button to bottom */}
      <div className="p-4 flex flex-col flex-grow">
        <a href={`/producto/${product.id}`} className="block mb-2">
          <h3 className="text-lg font-serif font-semibold text-gray-900 line-clamp-2 hover:text-arena transition-colors">
            {product.name}
          </h3>
        </a>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-grow">
          {product.description}
        </p>

        {/* Price */}
        <div className="mb-4">
          {product.on_offer ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-red-600">
                €{finalPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                €{product.price.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-arena">
              €{product.price.toFixed(2)}
            </span>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {inStock ? `${product.stock} disponibles` : 'Sin stock'}
          </p>
        </div>

        {/* Add to cart - always at bottom */}
        {inStock ? (
          <div className="space-y-2 mt-auto">
            {/* Quantity selector */}
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={(e) => handleQuantityChange(e, -1)}
                className="w-10 h-10 flex items-center justify-center border border-arena-light rounded hover:bg-arena-pale transition-colors text-lg"
                disabled={loading || quantity <= 1}
              >
                −
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={(e) => handleQuantityChange(e, 1)}
                className="w-10 h-10 flex items-center justify-center border border-arena-light rounded hover:bg-arena-pale transition-colors text-lg"
                disabled={loading || quantity >= product.stock}
              >
                +
              </button>
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-arena text-white hover:bg-arena-light'
              } disabled:opacity-50`}
            >
              {loading ? 'Agregando...' : added ? '¡Agregado!' : 'Añadir al carrito'}
            </button>
          </div>
        ) : (
          <button 
            disabled 
            className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed mt-auto"
          >
            Sin stock
          </button>
        )}
      </div>
    </div>
  );
}
