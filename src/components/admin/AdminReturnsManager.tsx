import React, { useState, useEffect } from 'react';

interface Return {
  id: string;
  order_id: string;
  return_number: string;
  status: string;
  reason: string;
  refund_amount: number;
  created_at: string;
  guest_email: string;
}

interface Props {
  adminKey: string;
}

const returnStatusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  received: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
};

const returnStatusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  shipped: 'Enviada',
  received: 'Recibida',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export default function AdminReturnsManager({ adminKey }: Props) {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/get-returns', {
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReturns(data.returns || []);
      }
    } catch (err) {
      console.error('Error fetching returns:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = returns.filter(ret => {
    const matchesFilter = filter === 'all' || ret.status === filter;
    const matchesSearch =
      ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.guest_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return <div className="text-center py-8">Cargando devoluciones...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Gestión de Devoluciones</h2>
          <button
            onClick={fetchReturns}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Buscar por número de devolución o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
          />
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'completed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-arena text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Todas' : returnStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Returns List */}
      <div className="divide-y divide-gray-200">
        {filteredReturns.length > 0 ? (
          filteredReturns.map(ret => (
            <div key={ret.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{ret.return_number}</p>
                  <p className="text-sm text-gray-600">{ret.guest_email}</p>
                </div>
                <div className={`px-3 py-1 rounded border text-xs font-medium ${returnStatusColors[ret.status]}`}>
                  {returnStatusLabels[ret.status]}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500">
                  Razón: {ret.reason} | Monto: ${ret.refund_amount.toFixed(2)}
                </p>
                <p className="text-gray-500">
                  {new Date(ret.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-600">
            No hay devoluciones que coincidan con los filtros
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-600 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">
            {returns.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Aprobadas</p>
          <p className="text-2xl font-bold text-blue-600">
            {returns.filter(r => r.status === 'approved').length}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">En Tránsito</p>
          <p className="text-2xl font-bold text-purple-600">
            {returns.filter(r => r.status === 'shipped').length}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Completadas</p>
          <p className="text-2xl font-bold text-green-600">
            {returns.filter(r => r.status === 'completed').length}
          </p>
        </div>
      </div>
    </div>
  );
}
