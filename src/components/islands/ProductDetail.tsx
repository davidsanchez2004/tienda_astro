import React, { useState } from 'react';
import type { Product } from '../../lib/types';
import { getCart, saveCart } from '../../stores/useCart';

interface ProductDetailProps {
  product: Product;
  categoryNames: string[];
}

// Generate unique ID for cart items
function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function ProductDetail({ product, categoryNames }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  // Combine main image with additional images
  const allImages = [product.image_url, ...(product.images_urls || [])].filter(Boolean);
  
  const inStock = product.stock > 0;

  // Calculate final price
  const price = product.on_offer && product.offer_price 
    ? product.offer_price 
    : product.on_offer && product.offer_percentage 
      ? product.price * (1 - product.offer_percentage / 100)
      : product.price;

  const handleAddToCart = async () => {
    // Evitar doble click
    if (loading || added) return;
    
    // Validar stock
    if (!inStock) {
      console.warn('Producto sin stock');
      return;
    }
    
    setLoading(true);
    try {
      const cart = getCart();
      const existingIndex = cart.findIndex((item: any) => item.product_id === product.id);
      
      // Validar que no exceda stock disponible
      const currentQtyInCart = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
      if (currentQtyInCart + quantity > product.stock) {
        console.warn('Stock insuficiente');
        setLoading(false);
        return;
      }
      
      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          id: generateId(),
          product_id: product.id,
          name: product.name,
          image_url: product.image_url,
          quantity,
          price
        });
      }
      
      saveCart(cart);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate display price for UI
  let finalPrice = product.price;
  let hasDiscount = false;
  
  if (product.on_offer) {
    if (product.offer_price) {
      finalPrice = product.offer_price;
      hasDiscount = true;
    } else if (product.offer_percentage) {
      finalPrice = product.price * (1 - product.offer_percentage / 100);
      hasDiscount = true;
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Image Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-arena-pale">
          <img
            src={allImages[selectedImage]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                  selectedImage === idx ? 'border-arena' : 'border-transparent'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} - ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Categories */}
        {categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categoryNames.map((cat) => (
              <span
                key={cat}
                className="text-xs px-3 py-1 bg-arena-pale text-arena rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
          {product.name}
        </h1>

        {/* Price */}
        <div className="flex items-center gap-4">
          {hasDiscount ? (
            <>
              <span className="text-3xl font-bold text-red-600">
                €{finalPrice.toFixed(2)}
              </span>
              <span className="text-xl text-gray-400 line-through">
                €{product.price.toFixed(2)}
              </span>
              {product.offer_percentage && (
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  -{product.offer_percentage}%
                </span>
              )}
            </>
          ) : (
            <span className="text-3xl font-bold text-arena">
              €{product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className={inStock ? 'text-green-700' : 'text-red-700'}>
            {inStock ? `${product.stock} en stock` : 'Agotado'}
          </span>
        </div>

        {/* Description */}
        {product.description && (
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Add to Cart */}
        {inStock && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">Cantidad:</span>
              <div className="flex items-center border border-arena-light rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-arena-pale transition-colors text-lg font-medium"
                  disabled={loading}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center py-2 border-x border-arena-light text-lg"
                  min="1"
                  max={product.stock}
                  disabled={loading}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2 hover:bg-arena-pale transition-colors text-lg font-medium"
                  disabled={loading}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-arena text-white hover:bg-arena-light'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Agregando...' : added ? '¡Agregado al carrito!' : 'Agregar al carrito'}
            </button>

            {/* Continue Shopping */}
            <a
              href="/catalogo"
              className="block text-center text-arena hover:text-arena-light font-medium"
            >
              ← Continuar comprando
            </a>
          </div>
        )}

        {!inStock && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <button className="w-full py-4 px-6 rounded-lg font-semibold text-lg bg-gray-200 text-gray-600 cursor-not-allowed">
              Producto agotado
            </button>
            <a
              href="/catalogo"
              className="block text-center text-arena hover:text-arena-light font-medium"
            >
              ← Ver otros productos
            </a>
          </div>
        )}

        {/* SKU */}
        {product.sku && (
          <p className="text-sm text-gray-500">
            SKU: {product.sku}
          </p>
        )}
      </div>
    </div>
  );
}
