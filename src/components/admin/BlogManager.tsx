import React, { useState, useEffect } from 'react';

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  author: string;
  read_time: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

const CATEGORIES = ['Tendencias', 'Consejos', 'Estilo', 'Cultura', 'Guías', 'Sostenibilidad'];

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image_url: '',
    category: 'Tendencias',
    author: 'BY ARENA',
    read_time: '5 min',
    published: false
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/blog', {
        credentials: 'include',
        headers: { 'x-admin-key': adminKey }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      image_url: '',
      category: 'Tendencias',
      author: 'BY ARENA',
      read_time: '5 min',
      published: false
    });
    setEditingPost(null);
    setIsCreating(false);
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      image_url: post.image_url || '',
      category: post.category || 'Tendencias',
      author: post.author || 'BY ARENA',
      read_time: post.read_time || '5 min',
      published: post.published
    });
    setEditingPost(post);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const adminKey = getCookie('admin_token') || '';
      const method = editingPost ? 'PUT' : 'POST';
      const url = editingPost ? `/api/admin/blog?id=${editingPost.id}` : '/api/admin/blog';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          ...formData,
          published_at: formData.published ? new Date().toISOString() : null
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: editingPost ? 'Artículo actualizado' : 'Artículo creado' });
        resetForm();
        fetchPosts();
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
    if (!confirm('¿Seguro que quieres eliminar este artículo?')) return;

    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch(`/api/admin/blog?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-admin-key': adminKey }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Artículo eliminado' });
        fetchPosts();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar' });
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch(`/api/admin/blog?id=${post.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          ...post,
          published: !post.published,
          published_at: !post.published ? new Date().toISOString() : null
        })
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
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
  if (isCreating || editingPost) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {editingPost ? 'Editar Artículo' : 'Nuevo Artículo'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extracto
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
              placeholder="Breve descripción del artículo..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido * (HTML)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent font-mono text-sm"
              placeholder="<h2>Título</h2><p>Contenido...</p>"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autor
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de lectura
              </label>
              <input
                type="text"
                value={formData.read_time}
                onChange={(e) => setFormData(prev => ({ ...prev, read_time: e.target.value }))}
                placeholder="5 min"
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
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                className="w-4 h-4 text-arena rounded focus:ring-arena"
              />
              <span className="text-sm font-medium text-gray-700">Publicar ahora</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-arena text-white font-semibold rounded-lg hover:bg-arena-light disabled:opacity-50"
            >
              {saving ? 'Guardando...' : (editingPost ? 'Actualizar' : 'Crear Artículo')}
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

  // Lista de artículos
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Artículos del Blog ({posts.length})</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-arena text-white rounded-lg hover:bg-arena-light"
        >
          + Nuevo Artículo
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No hay artículos todavía</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-arena hover:underline"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900">{post.title}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    post.published 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {post.published ? 'Publicado' : 'Borrador'}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {post.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
                <p className="text-xs text-gray-400 mt-1">
                  /blog/{post.slug} • {post.read_time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePublish(post)}
                  className={`px-3 py-1 text-sm rounded ${
                    post.published 
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {post.published ? 'Despublicar' : 'Publicar'}
                </button>
                <button
                  onClick={() => handleEdit(post)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
