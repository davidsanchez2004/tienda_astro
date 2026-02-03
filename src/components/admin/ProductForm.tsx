import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  adminKey?: string;
  onProductSaved?: (product: any) => void;
  onCancel?: () => void;
  initialProduct?: any;
}

export default function ProductForm({ adminKey: propAdminKey, onProductSaved, onCancel, initialProduct }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price || '',
    stock: initialProduct?.stock || '',
    category_ids: initialProduct?.category_ids || [],
    image_url: initialProduct?.image_url || '',
    featured: initialProduct?.featured || false,
    active: initialProduct?.active !== false,
    // Offer fields
    on_offer: initialProduct?.on_offer || false,
    offer_price: initialProduct?.offer_price || '',
    offer_percentage: initialProduct?.offer_percentage || '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    setSuccess('Imagen subida correctamente');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'category_ids') {
      // Manejar select múltiple
      const select = e.target as HTMLSelectElement;
      const selected = Array.from(select.selectedOptions, (option) => option.value);
      setFormData(prev => ({ ...prev, category_ids: selected }));
    } else {
      const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validaciones
      if (!formData.name.trim()) {
        throw new Error('El nombre del producto es requerido');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }
      if (!formData.stock || parseInt(formData.stock) < 0) {
        throw new Error('El stock no puede ser negativo');
      }
      if (!formData.category_ids || formData.category_ids.length === 0) {
        throw new Error('Debes seleccionar al menos una categoría');
      }
      if (!formData.image_url) {
        throw new Error('Debes subir una imagen del producto');
      }

      const endpoint = initialProduct?.id
        ? `/api/admin/update-product?id=${initialProduct.id}`
        : '/api/admin/create-product';

      const adminKey = propAdminKey || getCookie('admin_token') || '';
      const response = await fetch(endpoint, {
        method: initialProduct?.id ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          category_ids: formData.category_ids,
          image_url: formData.image_url,
          featured: formData.featured,
          active: formData.active,
          // Offer fields
          on_offer: formData.on_offer,
          offer_price: formData.offer_price ? parseFloat(formData.offer_price) : null,
          offer_percentage: formData.offer_percentage ? parseInt(formData.offer_percentage) : null,
        }),
      });

      if (response.status === 401) {
        throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar producto');
      }

      const data = await response.json();
      setSuccess(initialProduct?.id ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      
      // Resetear formulario si es nuevo
      if (!initialProduct?.id) {
        setFormData({
          name: '',
          description: '',
          price: '',
          stock: '',
          category_ids: [],
          image_url: '',
          featured: false,
          active: true,
          on_offer: false,
          offer_price: '',
          offer_percentage: '',
        });
        // Mantener el formulario abierto para crear otro producto
        if (onProductSaved) {
          onProductSaved(data.product);
        }
      } else {
        // Si es actualización, cerrar después de mostrar éxito
        if (onProductSaved) {
          onProductSaved(data.product);
        }
        setTimeout(() => {
          if (onCancel) onCancel();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Producto *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ej: Pulsera de Oro Elegante"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
            required
          />
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe el producto... Puedes copiar y pegar aquí"
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent font-sans resize-vertical"
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length} caracteres</p>
        </div>

        {/* Precio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio (€) *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
            required
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock *
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            placeholder="0"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
            required
          />
        </div>

        {/* Categorías */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorías * (Selecciona una o más)
          </label>
          <select
            name="category_ids"
            multiple
            value={formData.category_ids}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
            required
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.category_ids.length > 0 
              ? `${formData.category_ids.length} categoría${formData.category_ids.length !== 1 ? 's' : ''} seleccionada${formData.category_ids.length !== 1 ? 's' : ''}`
              : 'Mantén Ctrl/Cmd presionado para seleccionar múltiples'}
          </p>
        </div>

        {/* Imagen */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Imagen del Producto *
          </label>
          <ImageUpload
            onImageUpload={handleImageUpload}
            adminKey={adminKey}
            label="Subir Imagen"
          />
          {formData.image_url && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Imagen actual:</p>
              <img
                src={formData.image_url}
                alt="Producto"
                className="w-full max-w-sm h-auto rounded-lg border border-arena-light"
              />
            </div>
          )}
        </div>

        {/* Destacado */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-300 text-arena focus:ring-arena"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Destacado
            </span>
          </label>
        </div>

        {/* Activo */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-300 text-arena focus:ring-arena"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Producto Activo
            </span>
          </label>
        </div>

        {/* Sección de Ofertas */}
        <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            Configuracion de Oferta
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* En Oferta */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="on_offer"
                  checked={formData.on_offer}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Producto en Oferta
                </span>
              </label>
            </div>

            {/* Precio de Oferta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Oferta (€)
              </label>
              <input
                type="number"
                name="offer_price"
                value={formData.offer_price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={!formData.on_offer}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Porcentaje de Descuento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O Descuento (%)
              </label>
              <input
                type="number"
                name="offer_percentage"
                value={formData.offer_percentage}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                max="100"
                disabled={!formData.on_offer}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {formData.on_offer && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {formData.offer_price ? (
                  <>Precio de oferta: <strong>€{parseFloat(formData.offer_price).toFixed(2)}</strong> (Original: €{formData.price || '0.00'})</>
                ) : formData.offer_percentage ? (
                  <>Descuento del <strong>{formData.offer_percentage}%</strong> = €{(parseFloat(formData.price || '0') * (1 - parseInt(formData.offer_percentage) / 100)).toFixed(2)}</>
                ) : (
                  <>Ingresa un precio de oferta o un porcentaje de descuento</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-arena text-white py-2 px-4 rounded-lg hover:bg-arena-light transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : initialProduct?.id ? 'Actualizar Producto' : 'Crear Producto'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
