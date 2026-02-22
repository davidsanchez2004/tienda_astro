import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase-client';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  stock: number;
  on_offer?: boolean;
  offer_price?: number;
  offer_percentage?: number;
  category_ids?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function SearchProducts() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Cargar categorías una vez al montar
  useEffect(() => {
    supabaseClient
      .from('categories')
      .select('id, name, slug')
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const words = searchQuery.trim().toLowerCase().split(/\s+/).filter(w => w.length > 1);

      // 1) Buscar categorías cuyos nombres coincidan con alguna palabra
      const matchedCategoryIds = categories
        .filter(cat => words.some(w => cat.name.toLowerCase().includes(w) || cat.slug.toLowerCase().includes(w)))
        .map(cat => cat.id);

      // 2) Buscar productos por nombre/descripción
      const orFilters = words
        .map(w => `name.ilike.%${w}%,description.ilike.%${w}%`)
        .join(',');

      const { data: textResults, error: textError } = await supabaseClient
        .from('products')
        .select('id, name, price, image_url, description, stock, on_offer, offer_price, offer_percentage, category_ids')
        .eq('active', true)
        .or(orFilters)
        .limit(30);
      if (textError) console.error('Search text error:', textError);

      // 3) Si hay categorías coincidentes, buscar productos de esas categorías
      let categoryResults: Product[] = [];
      if (matchedCategoryIds.length > 0) {
        const { data: catProducts, error: catError } = await supabaseClient
          .from('products')
          .select('id, name, price, image_url, description, stock, on_offer, offer_price, offer_percentage, category_ids')
          .eq('active', true)
          .overlaps('category_ids', matchedCategoryIds)
          .limit(30);
        if (catError) console.error('Search category error:', catError);
        categoryResults = catProducts || [];
      }

      // 4) Combinar resultados eliminando duplicados
      const allResults = [...(textResults || [])];
      const existingIds = new Set(allResults.map(p => p.id));
      for (const p of categoryResults) {
        if (!existingIds.has(p.id)) {
          allResults.push(p);
          existingIds.add(p.id);
        }
      }

      // 5) Ordenar por relevancia
      const sorted = allResults.sort((a, b) => {
        let scoreA = 0, scoreB = 0;

        // Puntos por coincidencia de texto en nombre/descripción
        for (const w of words) {
          if (a.name.toLowerCase().includes(w)) scoreA += 3;
          if ((a.description || '').toLowerCase().includes(w)) scoreA += 1;
          if (b.name.toLowerCase().includes(w)) scoreB += 3;
          if ((b.description || '').toLowerCase().includes(w)) scoreB += 1;
        }

        // Puntos por pertenecer a una categoría coincidente
        if (matchedCategoryIds.length > 0) {
          const aCatIds = a.category_ids || [];
          const bCatIds = b.category_ids || [];
          if (aCatIds.some(id => matchedCategoryIds.includes(id))) scoreA += 2;
          if (bCatIds.some(id => matchedCategoryIds.includes(id))) scoreB += 2;
        }

        return scoreB - scoreA;
      });

      setProducts(sorted.slice(0, 30));
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
                href={`/producto/${product.id}`}
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
                  {/* Categoría */}
                  {product.category_ids && product.category_ids.length > 0 && (
                    <p className="text-xs text-gray-400 mb-1">
                      {product.category_ids
                        .map(id => categories.find(c => c.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  <h3 className="font-semibold text-gray-900 group-hover:text-arena transition-colors">
                    {product.name}
                  </h3>
                  {product.on_offer && product.offer_price ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-arena font-bold">€{product.offer_price.toFixed(2)}</span>
                      <span className="text-sm text-gray-400 line-through">€{product.price.toFixed(2)}</span>
                    </div>
                  ) : product.on_offer && product.offer_percentage ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-arena font-bold">€{(product.price * (1 - product.offer_percentage / 100)).toFixed(2)}</span>
                      <span className="text-sm text-gray-400 line-through">€{product.price.toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-arena font-bold mt-2">€{product.price.toFixed(2)}</p>
                  )}
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
