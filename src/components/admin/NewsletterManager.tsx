import React, { useState, useEffect } from 'react';

// Newsletter subscriber management component
interface Subscriber {
  id: string;
  email: string;
  status: 'pending' | 'confirmed' | 'unsubscribed';
  source: string;
  confirmed_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
}

export default function NewsletterManager() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, pending: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'unsubscribed'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const adminKey = sessionStorage.getItem('adminSecretKey');
      const response = await fetch('/api/admin/newsletter', {
        headers: { 'x-admin-key': adminKey || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers || []);
        setStats(data.stats || { total: 0, confirmed: 0, pending: 0, unsubscribed: 0 });
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleExport = () => {
    const confirmedEmails = subscribers
      .filter(s => s.status === 'confirmed')
      .map(s => s.email)
      .join('\n');
    
    const blob = new Blob([confirmedEmails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-emails-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: `${subscribers.filter(s => s.status === 'confirmed').length} emails exportados` });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este suscriptor?')) return;

    try {
      const adminKey = sessionStorage.getItem('adminSecretKey');
      const response = await fetch(`/api/admin/newsletter?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey || '' }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Suscriptor eliminado' });
        fetchSubscribers();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar' });
    }
  };

  const filteredSubscribers = subscribers.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Confirmado</span>;
      case 'pending':
        return <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">Pendiente</span>;
      case 'unsubscribed':
        return <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Dado de baja</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arena"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Newsletter</h2>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-arena text-white rounded-lg hover:bg-arena-light"
        >
                    <svg className="w-5 h-5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Exportar emails
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total suscriptores</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          <p className="text-sm text-gray-500">Confirmados</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pendientes</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-gray-500">{stats.unsubscribed}</p>
          <p className="text-sm text-gray-500">Dados de baja</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'confirmed', 'pending', 'unsubscribed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-arena text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Todos' : 
             status === 'confirmed' ? 'Confirmados' :
             status === 'pending' ? 'Pendientes' : 'Dados de baja'}
          </button>
        ))}
      </div>

      {/* Subscribers List */}
      {filteredSubscribers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay suscriptores</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fuente</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{subscriber.email}</td>
                  <td className="px-4 py-3">{getStatusBadge(subscriber.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{subscriber.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(subscriber.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(subscriber.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
