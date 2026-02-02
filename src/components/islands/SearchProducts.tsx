import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  slug: string;
  description: string;
}

export default function SearchProducts() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data } = await supabaseClient
        .from('products')
        .select('id, name, price, image_url, slug, description')
        .eq('active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(20);

      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-12">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar collares, pulseras, bolsos..."
          className="w-full px-6 py-4 text-lg border-2 border-arena-light rounded-xl focus:outline-none focus:border-arena"
        />
        <svg
          className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-arena border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Buscando...</p>
        </div>
      )}

      {/* Results */}
      {!loading && searched && products.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg text-gray-600">No se encontraron productos para "{query}"</p>
          <p className="text-gray-500 mt-2">Prueba con otras palabras clave</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div>
          <p className="text-gray-600 mb-6">{products.length} resultado{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <a
                key={product.id}
                href={`/producto/${product.slug}`}
                className="group bg-white rounded-xl border border-arena-light overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-arena-pale">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-arena transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-arena font-bold mt-2">€{product.price.toFixed(2)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="text-center py-12">
          <svg className="w-20 h-20 mx-auto text-arena-light mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg text-gray-600">Escribe para buscar productos</p>
          <p className="text-gray-500 mt-2">Collares, pulseras, bolsos y más...</p>
        </div>
      )}
    </div>
  );
}
