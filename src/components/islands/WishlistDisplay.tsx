import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import type { Product } from '../../lib/types';

interface User {
  id: string;
  email?: string;
}

export default function WishlistDisplay() {
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        loadWishlist(session.user.id);
      } else {
        setLoading(false);
      }
    }
    init();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadWishlist(session.user.id);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const loadWishlist = async (userId: string) => {
    try {
      const { data: wishlistItems } = await supabaseClient
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', userId);

      if (wishlistItems) {
        const productIds = wishlistItems.map(item => item.product_id);
        if (productIds.length > 0) {
          const { data: products } = await supabaseClient
            .from('products')
            .select('*')
            .in('id', productIds);

          setWishlist(products || []);
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await supabaseClient
        .from('wishlist_items')
        .delete()
        .eq('user_id', user?.id)
        .eq('product_id', productId);

      setWishlist(wishlist.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">Debes iniciar sesión para ver tu lista de deseos</p>
        <a href="/login" className="text-arena font-semibold hover:text-arena-light">
          Inicia sesión aquí
        </a>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">Tu lista de deseos está vacía</p>
        <a href="/catalogo" className="text-arena font-semibold hover:text-arena-light">
          Explorar catálogo
        </a>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      {wishlist.map(product => (
        <div key={product.id} className="bg-white rounded-lg border border-arena-light overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full aspect-square object-cover"
          />
          <div className="p-4">
            <h3 className="font-serif font-semibold text-gray-900 line-clamp-2 mb-2">
              {product.name}
            </h3>
            <p className="text-2xl font-bold text-arena mb-4">
              €{product.price.toFixed(2)}
            </p>
            <button
              onClick={() => removeFromWishlist(product.id)}
              className="w-full px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors font-semibold"
            >
              Eliminar de favoritos
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
