import React, { useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  guest_email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'refunded';
  total: number;
  created_at: string;
  shipping_address?: string;
  tracking_number?: string;
  carrier?: string;
  shipped_at?: string;
}

interface Props {
  order: Order;
  adminKey: string;
  onOrderUpdated: (order: Order) => void;
}

export default function AdminOrderDetail({ order, adminKey, onOrderUpdated }: Props) {
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [carrier, setCarrier] = useState(order.carrier || 'Correos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateStatus = async (newStatus: string, sendEmail: boolean = true) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNumber,
          carrier: carrier,
          sendEmail,
        }),
      });

      if (response.status === 401) {
        setError('Sesión expirada. Por favor, vuelve a iniciar sesión.');
        sessionStorage.removeItem('adminKey');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
        return;
      }

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      const data = await response.json();
      onOrderUpdated({
        ...order,
        ...data.order,
      });
      
      const statusMessages: Record<string, string> = {
        shipped: 'Pedido marcado como enviado. Email enviado al cliente.',
        delivered: 'Pedido marcado como entregado. Email enviado al cliente.',
        processing: 'Pedido marcado como procesando.',
      };
      
      setSuccess(statusMessages[newStatus] || 'Estado actualizado correctamente.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpdateStatus('shipped', true);
  };

  const handleMarkDelivered = async () => {
    if (confirm('¿Marcar este pedido como entregado? Se enviará un email de confirmación al cliente.')) {
      await handleUpdateStatus('delivered', true);
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado',
    refunded: 'Reembolsado',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Order Info */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Detalles de Orden</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600">Número de Orden</p>
            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Email Cliente</p>
            <p className="font-semibold text-gray-900">{order.guest_email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Estado</p>
            <p className={`font-semibold px-3 py-1 rounded inline-block text-sm mt-1 ${
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {statusLabels[order.status]}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="font-semibold text-lg text-arena">€{order.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Fecha de Orden</p>
            <p className="font-semibold text-gray-900">
              {new Date(order.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Update Form */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Actualizar Rastreo</h3>
        <form onSubmit={handleUpdateTracking} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Rastreo
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="ej: 1Z999AA1XX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa de Envío
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent text-sm"
            >
              <option value="FedEx">FedEx</option>
              <option value="UPS">UPS</option>
              <option value="DHL">DHL</option>
              <option value="USPS">USPS</option>
              <option value="Correos">Correos</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !trackingNumber}
            className="w-full bg-arena text-white py-2 rounded-lg hover:bg-arena-light transition-colors font-medium disabled:opacity-50 text-sm"
          >
            {loading ? 'Actualizando...' : 'Actualizar Rastreo'}
          </button>
        </form>
      </div>

      {/* Current Tracking */}
      {order.tracking_number && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Información de Envío</h3>
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Número de Rastreo</p>
              <p className="font-semibold text-gray-900 break-all">{order.tracking_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Empresa</p>
              <p className="font-semibold text-gray-900">{order.carrier}</p>
            </div>
            {order.shipped_at && (
              <div>
                <p className="text-xs text-gray-600">Enviado el</p>
                <p className="font-semibold text-gray-900">
                  {new Date(order.shipped_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
          
          {/* Mark as Delivered button */}
          {order.status === 'shipped' && (
            <button
              onClick={handleMarkDelivered}
              disabled={loading}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  Marcar como Entregado
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Delivered confirmation */}
      {order.status === 'delivered' && (
        <div className="border-t border-gray-200 pt-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="font-semibold text-green-800 mt-2">Pedido Entregado</p>
            <p className="text-sm text-green-600">El cliente ha sido notificado</p>
          </div>
        </div>
      )}
    </div>
  );
}
