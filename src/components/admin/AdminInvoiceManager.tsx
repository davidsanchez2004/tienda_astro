import React, { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  order_id: string;
  return_id?: string;
  invoice_number: string;
  type: 'purchase' | 'return';
  amount: number;
  customer_name: string;
  customer_email: string;
  created_at: string;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function AdminInvoiceManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'purchase' | 'return'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateOrderId, setGenerateOrderId] = useState('');
  const [generateReturnId, setGenerateReturnId] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const adminKey = getCookie('admin_token') || '';
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);

      const response = await fetch(`/api/admin/invoices?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al cargar facturas');

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (!response.ok) throw new Error('Error al descargar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error al descargar el PDF: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  const generateInvoice = async (type: 'purchase' | 'return') => {
    const id = type === 'purchase' ? generateOrderId.trim() : generateReturnId.trim();
    if (!id) {
      alert(`Por favor ingresa un ID de ${type === 'purchase' ? 'pedido' : 'devolución'}`);
      return;
    }

    try {
      setGenerating(true);
      const adminKey = getCookie('admin_token') || '';
      const body = type === 'purchase'
        ? { type: 'purchase', orderId: id }
        : { type: 'return', returnId: id };

      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar factura');
      }

      setSuccessMsg(`Factura generada correctamente`);
      setGenerateOrderId('');
      setGenerateReturnId('');
      setShowGenerateModal(false);
      fetchInvoices();

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    const isNeg = amount < 0;
    return `${isNeg ? '-' : ''}€${Math.abs(amount).toFixed(2)}`;
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(term) ||
      (inv.customer_name || '').toLowerCase().includes(term) ||
      (inv.customer_email || '').toLowerCase().includes(term) ||
      inv.order_id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Gestión de Facturas</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-[#D4C5B9] text-white rounded-lg hover:bg-[#c4b5a9] transition-colors font-medium"
          >
            + Generar Factura
          </button>
          <button
            onClick={fetchInvoices}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <input
          type="text"
          placeholder="Buscar por número, nombre, email o ID de pedido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4C5B9] focus:border-transparent"
        />
        <div className="flex gap-2">
          {(['all', 'purchase', 'return'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === t
                  ? 'bg-[#D4C5B9] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'Todas' : t === 'purchase' ? 'Compra' : 'Devolución'}
            </button>
          ))}
        </div>

        {/* Resumen */}
        <div className="flex gap-6 text-sm text-gray-600">
          <span>
            Total facturas: <strong>{filteredInvoices.length}</strong>
          </span>
          <span>
            Compras: <strong>{filteredInvoices.filter((i) => i.type === 'purchase').length}</strong>
          </span>
          <span>
            Devoluciones: <strong className="text-red-600">{filteredInvoices.filter((i) => i.type === 'return').length}</strong>
          </span>
          <span>
            Balance:{' '}
            <strong
              className={
                filteredInvoices.reduce((s, i) => s + i.amount, 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }
            >
              {formatAmount(filteredInvoices.reduce((s, i) => s + i.amount, 0))}
            </strong>
          </span>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D4C5B9] mx-auto"></div>
          <p className="text-gray-500 mt-3">Cargando facturas...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No hay facturas que mostrar
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nº Factura
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Importe
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-gray-800">
                      {invoice.invoice_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.type === 'purchase'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.type === 'purchase' ? 'Compra' : 'Abono'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800">{invoice.customer_name || '-'}</div>
                    <div className="text-xs text-gray-500">{invoice.customer_email || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold ${
                        invoice.amount >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {formatAmount(invoice.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invoice.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => downloadPdf(invoice.id, invoice.invoice_number)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#D4C5B9] text-white rounded-md hover:bg-[#c4b5a9] transition-colors"
                      title="Descargar PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal generar factura */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Generar Factura Manual</h3>

            <div className="space-y-4">
              {/* Factura de compra */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-green-700">Factura de Compra</h4>
                <input
                  type="text"
                  placeholder="ID del pedido (UUID)"
                  value={generateOrderId}
                  onChange={(e) => setGenerateOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D4C5B9]"
                />
                <button
                  onClick={() => generateInvoice('purchase')}
                  disabled={generating || !generateOrderId.trim()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {generating ? 'Generando...' : 'Generar Factura de Compra'}
                </button>
              </div>

              {/* Factura de devolución */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-red-700">Nota de Crédito (Devolución)</h4>
                <input
                  type="text"
                  placeholder="ID de la devolución (UUID)"
                  value={generateReturnId}
                  onChange={(e) => setGenerateReturnId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D4C5B9]"
                />
                <button
                  onClick={() => generateInvoice('return')}
                  disabled={generating || !generateReturnId.trim()}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {generating ? 'Generando...' : 'Generar Nota de Crédito'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowGenerateModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
