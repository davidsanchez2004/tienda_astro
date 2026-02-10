import React, { useState, useEffect } from 'react';

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

interface ReturnItem {
  id: string;
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  reason?: string;
}

interface Return {
  id: string;
  order_id: string;
  return_number: string;
  status: string;
  reason: string;
  description?: string;
  refund_amount: number;
  created_at: string;
  guest_email: string;
  items_count?: number;
  admin_notes?: string;
  return_items?: ReturnItem[];
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

const reasonLabels: Record<string, string> = {
  damaged: 'Producto dañado',
  defective: 'Defecto de fábrica',
  wrong_item: 'Artículo incorrecto',
  not_as_described: 'No como se describe',
  size_issue: 'Problema de talla/tamaño',
  color_issue: 'Color diferente',
  changed_mind: 'Cambió de opinión',
  other: 'Otro',
};

export default function AdminReturnsManager() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/get-returns', {
        credentials: 'include',
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

  const updateReturnStatus = async (returnId: string, newStatus: string) => {
    try {
      setUpdating(true);
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/update-return', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnId,
          status: newStatus,
          adminNotes: adminNotes || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Actualizar lista local
        setReturns(prev => prev.map(r => 
          r.id === returnId ? { ...r, status: newStatus, admin_notes: adminNotes } : r
        ));
        setSelectedReturn(null);
        setAdminNotes('');
        alert(`Devolución actualizada a: ${returnStatusLabels[newStatus]}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Error updating return:', err);
      alert('Error al actualizar devolución');
    } finally {
      setUpdating(false);
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
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded border text-xs font-medium ${returnStatusColors[ret.status]}`}>
                    {returnStatusLabels[ret.status]}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReturn(ret);
                      setAdminNotes(ret.admin_notes || '');
                    }}
                    className="p-1.5 text-gray-400 hover:text-arena hover:bg-gray-100 rounded transition-colors"
                    title="Ver detalles y gestionar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500">
                  Razón: {reasonLabels[ret.reason] || ret.reason} | Monto: ${ret.refund_amount.toFixed(2)}
                </p>
                <p className="text-gray-500">
                  {new Date(ret.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
              
              {/* Quick Actions */}
              {ret.status === 'pending' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => updateReturnStatus(ret.id, 'approved')}
                    disabled={updating}
                    className="flex-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => updateReturnStatus(ret.id, 'rejected')}
                    disabled={updating}
                    className="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    ✕ Rechazar
                  </button>
                </div>
              )}
              {ret.status === 'approved' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => updateReturnStatus(ret.id, 'received')}
                    disabled={updating}
                    className="flex-1 px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                  >
                    📦 Marcar Recibido
                  </button>
                </div>
              )}
              {ret.status === 'received' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => updateReturnStatus(ret.id, 'completed')}
                    disabled={updating}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    💰 Procesar Reembolso
                  </button>
                </div>
              )}
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

      {/* Modal de Detalle */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Detalle de Devolución</h3>
                <button
                  onClick={() => {
                    setSelectedReturn(null);
                    setAdminNotes('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Número</p>
                  <p className="font-semibold">{selectedReturn.return_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Estado</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${returnStatusColors[selectedReturn.status]}`}>
                    {returnStatusLabels[selectedReturn.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email Cliente</p>
                  <p className="font-medium text-sm">{selectedReturn.guest_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Monto a Reembolsar</p>
                  <p className="font-bold text-green-600">${selectedReturn.refund_amount.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase">Razón</p>
                  <p className="font-medium">{reasonLabels[selectedReturn.reason] || selectedReturn.reason}</p>
                </div>
                {selectedReturn.description && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase">Descripción del Cliente</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">{selectedReturn.description}</p>
                  </div>
                )}
              </div>

              {/* Return Items Detail */}
              {selectedReturn.return_items && selectedReturn.return_items.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Artículos a Devolver</p>
                  <div className="space-y-2">
                    {selectedReturn.return_items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-xs text-gray-500">
                            Cant: {item.quantity} × €{item.price.toFixed(2)}
                            {item.reason && ` | ${reasonLabels[item.reason] || item.reason}`}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-700">€{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Notas del Admin</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Añade notas internas sobre esta devolución..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-arena focus:border-transparent h-24 resize-none"
                />
              </div>

              {/* Acciones según estado */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-3">Cambiar Estado</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedReturn.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateReturnStatus(selectedReturn.id, 'approved')}
                        disabled={updating}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        ✓ Aprobar
                      </button>
                      <button
                        onClick={() => updateReturnStatus(selectedReturn.id, 'rejected')}
                        disabled={updating}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        ✕ Rechazar
                      </button>
                    </>
                  )}
                  {selectedReturn.status === 'approved' && (
                    <button
                      onClick={() => updateReturnStatus(selectedReturn.id, 'received')}
                      disabled={updating}
                      className="col-span-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      📦 Marcar como Recibido
                    </button>
                  )}
                  {selectedReturn.status === 'received' && (
                    <button
                      onClick={() => updateReturnStatus(selectedReturn.id, 'completed')}
                      disabled={updating}
                      className="col-span-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      💰 Procesar Reembolso y Completar
                    </button>
                  )}
                  {selectedReturn.status === 'completed' && (
                    <p className="col-span-2 text-center text-green-600 font-medium py-2">
                      ✓ Devolución completada
                    </p>
                  )}
                  {selectedReturn.status === 'rejected' && (
                    <p className="col-span-2 text-center text-red-600 font-medium py-2">
                      ✕ Devolución rechazada
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
