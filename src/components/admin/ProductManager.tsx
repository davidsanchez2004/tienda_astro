import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string;
  category_ids: string[];
  featured: boolean;
  active: boolean;
  on_offer?: boolean;
  offer_price?: number;
  offer_percentage?: number;
}

interface ProductManagerProps {
  adminKey: string;
}

export default function ProductManager({ adminKey: initialAdminKey }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminKey, setAdminKey] = useState(initialAdminKey || '');

  useEffect(() => {
    // Obtener adminKey del sessionStorage si no se proporcionó
    if (!adminKey) {
      const key = sessionStorage.getItem('adminKey');
      if (!key) {
        window.location.href = '/admin/login';
        return;
      }
      setAdminKey(key);
    }
  }, [adminKey]);

  useEffect(() => {
    if (!showForm && !editingProduct && adminKey) {
      fetchProducts();
    }
  }, [showForm, editingProduct]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/get-all-products', {
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (response.status === 401) {
        sessionStorage.removeItem('adminKey');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/delete-product?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (response.status === 401) {
        sessionStorage.removeItem('adminKey');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Error al eliminar producto');
      }

      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm || editingProduct) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </h2>
        <ProductForm
          adminKey={adminKey}
          initialProduct={editingProduct || undefined}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onProductSaved={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-arena text-white px-6 py-2 rounded-lg hover:bg-arena-light transition-colors font-medium whitespace-nowrap"
        >
          + Nuevo Producto
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {products.length === 0 ? 'No hay productos aún' : 'No se encontraron productos'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="text-arena font-semibold hover:text-arena-light"
            >
              Crear el primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                  {product.on_offer && product.offer_price ? (
                    <div className="flex items-center gap-2">
                      <p className="text-red-600 font-bold">€{product.offer_price.toFixed(2)}</p>
                      <p className="text-gray-400 line-through text-sm">€{product.price.toFixed(2)}</p>
                    </div>
                  ) : product.on_offer && product.offer_percentage ? (
                    <div className="flex items-center gap-2">
                      <p className="text-red-600 font-bold">€{(product.price * (1 - product.offer_percentage / 100)).toFixed(2)}</p>
                      <p className="text-gray-400 line-through text-sm">€{product.price.toFixed(2)}</p>
                    </div>
                  ) : (
                    <p className="text-arena font-bold">€{product.price.toFixed(2)}</p>
                  )}
                </div>

                {/* Info */}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Stock: <span className="font-semibold">{product.stock}</span></p>
                  <div className="flex gap-2 flex-wrap">
                    {product.on_offer && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        🏷️ En Oferta
                      </span>
                    )}
                    {product.featured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        ⭐ Destacado
                      </span>
                    )}
                    {!product.active && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {products.length > 0 && (
        <div className="text-center text-sm text-gray-600 pt-6 border-t border-gray-200">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      )}
    </div>
  );
}
