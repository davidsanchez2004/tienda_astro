import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  category_ids?: string[];
  on_offer?: boolean;
  offer_price?: number;
  offer_percentage?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Función de similitud fuzzy (distancia de Levenshtein simplificada)
function similarity(a: string, b: string): number {
  a = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  b = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  
  const len = Math.max(a.length, b.length);
  if (len === 0) return 1;
  
  // Distancia de Levenshtein
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return 1 - matrix[a.length][b.length] / len;
}

// Buscar si alguna palabra del query es similar a alguna palabra del texto
function fuzzyMatch(query: string, text: string): number {
  const queryWords = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(w => w.length > 1);
  const textWords = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(w => w.length > 1);
  
  if (queryWords.length === 0 || textWords.length === 0) return 0;
  
  let totalScore = 0;
  for (const qw of queryWords) {
    let bestMatch = 0;
    for (const tw of textWords) {
      const sim = similarity(qw, tw);
      if (sim > bestMatch) bestMatch = sim;
    }
    totalScore += bestMatch;
  }
  return totalScore / queryWords.length;
}

export default function SearchProducts() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Cargar todos los productos y categorías al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabaseClient
            .from('products')
            .select('id, name, price, image_url, description, category_ids, on_offer, offer_price, offer_percentage')
            .eq('active', true)
            .order('featured', { ascending: false }),
          supabaseClient
            .from('categories')
            .select('id, name, slug')
        ]);
        setAllProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const term = searchQuery.trim();
      const THRESHOLD = 0.45; // Umbral de similitud mínima

      // Buscar categorías que coincidan con el término
      const matchingCategoryIds = categories
        .filter(c => fuzzyMatch(term, c.name) >= THRESHOLD)
        .map(c => c.id);

      // Puntuar cada producto
      const scored = allProducts.map(product => {
        // Similitud con nombre (peso alto)
        const nameScore = fuzzyMatch(term, product.name) * 2;
        
        // Similitud con descripción (peso medio)
        const descScore = product.description ? fuzzyMatch(term, product.description) * 0.8 : 0;
        
        // Coincidencia por categoría (peso medio)
        const catScore = product.category_ids?.some(cid => matchingCategoryIds.includes(cid)) ? 1.2 : 0;

        // Búsqueda exacta con ilike (contiene el texto)
        const nameContains = product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .includes(term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ? 3 : 0;
        
        const totalScore = nameScore + descScore + catScore + nameContains;
        
        return { product, score: totalScore };
      });

      // Filtrar por umbral y ordenar por puntuación
      const results = scored
        .filter(s => s.score >= THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(s => s.product);

      setProducts(results);
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
    }, 200);

    return () => clearTimeout(debounce);
  }, [query, allProducts, categories]);

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
          <p className="text-gray-500 mt-2">Prueba con palabras similares o más cortas</p>
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
                  <h3 className="font-semibold text-gray-900 group-hover:text-arena transition-colors">
                    {product.name}
                  </h3>
                  {product.on_offer && (product.offer_price || product.offer_percentage) ? (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-arena font-bold">
                        €{(product.offer_price || (product.price * (1 - (product.offer_percentage || 0) / 100))).toFixed(2)}
                      </p>
                      <p className="text-gray-400 line-through text-sm">€{product.price.toFixed(2)}</p>
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
