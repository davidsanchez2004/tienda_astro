import React, { useState, useEffect } from 'react';

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

// Componente de tarjeta individual con manejo de error de imagen
function CategoryCard({ category, onEdit, onDelete }: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !category.image_url || imgError;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-4">
        {!showFallback ? (
          <img
            src={category.image_url!}
            alt={category.name}
            className="w-16 h-16 object-cover rounded-lg bg-gray-100 flex-shrink-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-gray-400">{category.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500">/{category.slug}</p>
          {category.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{category.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(category)}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: ''
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/categories', {
        credentials: 'include',
        headers: { 'x-admin-key': adminKey }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: ''
    });
    setEditingCategory(null);
    setIsCreating(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || ''
    });
    setEditingCategory(category);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const adminKey = getCookie('admin_token') || '';
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/admin/categories?id=${editingCategory.id}` : '/api/admin/categories';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: editingCategory ? 'Categoría actualizada' : 'Categoría creada' });
        resetForm();
        fetchCategories();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Error al guardar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return;

    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-admin-key': adminKey }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Categoría eliminada' });
        fetchCategories();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Error al eliminar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arena"></div>
      </div>
    );
  }

  // Formulario de edición/creación
  if (isCreating || editingCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button
            onClick={resetForm}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Volver
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="Ej: Collares"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              required
              placeholder="collares"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /catalogo?categoria={formData.slug}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Descripción de la categoría..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
            />
            {formData.image_url && (
              <img 
                src={formData.image_url} 
                alt="Preview" 
                className="mt-2 w-20 h-20 object-cover rounded-lg"
              />
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-arena text-white font-semibold rounded-lg hover:bg-arena-light disabled:opacity-50"
            >
              {saving ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear Categoría')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Lista de categorías
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Categorías ({categories.length})</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-arena text-white rounded-lg hover:bg-arena-light"
        >
          + Nueva Categoría
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No hay categorías todavía</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-arena hover:underline"
          >
            Crear la primera
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
