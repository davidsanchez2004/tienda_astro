import React, { useEffect, useState } from 'react';

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

interface WebhookLog {
  id: string;
  event_id: string;
  event_type: string;
  status: 'processed' | 'pending' | 'failed';
  error_message?: string;
  created_at: string;
}

interface PaymentOrder {
  id: string;
  order_number: string;
  customer_email: string;
  guest_email?: string;
  total_amount: number;
  payment_status: string;
  refund_status: string;
  refund_amount?: number;
  created_at: string;
  updated_at: string;
}

export default function WebhookMonitor() {
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'webhooks' | 'orders'>('webhooks');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetchWebhooks();
    fetchPaymentOrders();
    
    // Refresh cada 30 segundos
    const interval = setInterval(() => {
      if (activeTab === 'webhooks') fetchWebhooks();
      else fetchPaymentOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  async function fetchWebhooks() {
    try {
      setLoading(true);
      setError(undefined);
      
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/get-webhooks', {
        credentials: 'include',
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch webhooks');

      const data = await response.json();
      setWebhookLogs(data.webhooks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching webhooks');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPaymentOrders() {
    try {
      setLoading(true);
      setError(undefined);
      
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/get-payment-orders', {
        credentials: 'include',
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch payment orders');

      const data = await response.json();
      setPaymentOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'processed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('es-ES');
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'webhooks'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          Webhooks ({webhookLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'orders'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
          Ordenes ({paymentOrders.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-arena"></div> Cargando...
        </div>
      )}

      {activeTab === 'webhooks' && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Eventos de Webhook</h3>
            <button
              onClick={fetchWebhooks}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refrescar
            </button>
          </div>

          {webhookLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay eventos de webhook aún
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">ID Evento</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-left">Estado</th>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">
                        {log.event_id.substring(0, 20)}...
                      </td>
                      <td className="px-4 py-2 font-medium">{log.event_type}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-2 text-xs text-red-600">
                        {log.error_message ? log.error_message.substring(0, 50) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Órdenes (Estado de Pago)</h3>
            <button
              onClick={fetchPaymentOrders}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refrescar
            </button>
          </div>

          {paymentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay órdenes aún
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Orden</th>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-left">Monto</th>
                    <th className="px-4 py-2 text-left">Pago</th>
                    <th className="px-4 py-2 text-left">Reembolso</th>
                    <th className="px-4 py-2 text-left">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-semibold">{order.order_number}</td>
                      <td className="px-4 py-2 text-xs">
                        {order.customer_email || order.guest_email}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.refund_status)}`}>
                          {order.refund_status}
                          {order.refund_amount && ` ($${order.refund_amount.toFixed(2)})`}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
