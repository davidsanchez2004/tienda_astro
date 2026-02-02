import React, { useState } from 'react';

interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface Order {
  id: string;
  checkout_type: string;
  guest_email: string;
  guest_first_name: string;
  guest_last_name: string;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  carrier?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country?: string;
  items: OrderItem[];
  customerName: string;
}

export default function OrderTracking() {
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: { [key: string]: string } = {
      'pending_payment': 'Pendiente de Pago',
      'paid': 'Pagado',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending_payment':
        return '⏳';
      case 'paid':
        return '✓';
      case 'processing':
        return '◆';
      case 'shipped':
        return '→';
      case 'delivered':
        return '✓';
      case 'cancelled':
        return '✗';
      default:
        return '•';
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !orderId) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch('/api/tracking/search-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al buscar la orden');
        setOrder(null);
        return;
      }

      setOrder(data.order);
    } catch (err) {
      setError('Error de conexión. Por favor intenta de nuevo.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-arena/5 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Rastrear tu Orden</h1>
          <p className="text-gray-600">
            Ingresa tu email y número de orden para ver el estado de tu compra
          </p>
        </div>

        {/* Search Form */}
        {!order && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 max-w-xl mx-auto border border-gray-200">
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Orden
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value.toUpperCase())}
                  placeholder="ej: ord_1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-arena"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-arena text-white py-3 rounded-lg hover:bg-arena/90 transition font-semibold disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Rastrear Orden'}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-6">
              🔒 Tu información es privada y segura. Solo necesitamos tu email y número de orden.
            </p>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            {/* Header con estado */}
            <div className="bg-gradient-to-r from-arena to-arena/80 text-white p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold">Orden #{order.id}</h2>
                <span
                  className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(order.status)}`}
                >
                  {getStatusIcon(order.status)} {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-arena-light">
                Colocada el {new Date(order.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-gray-900">Estado del Envío</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        ['pending_payment', 'paid', 'processing', 'shipped', 'delivered'].includes(order.status)
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        ✓
                      </div>
                      <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Pago Confirmado</p>
                      <p className="text-sm text-gray-600">
                        {order.status === 'pending_payment'
                          ? 'Pendiente de confirmación'
                          : new Date(order.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        ['processing', 'shipped', 'delivered'].includes(order.status)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        ◆
                      </div>
                      <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Procesando</p>
                      <p className="text-sm text-gray-600">
                        Preparando tu paquete para envío
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        ['shipped', 'delivered'].includes(order.status)
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        🚚
                      </div>
                      <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Enviado</p>
                      {order.tracking_number ? (
                        <div className="text-sm text-gray-600">
                          <p>
                            Seguimiento:{' '}
                            <span className="font-mono font-semibold text-arena">
                              {order.tracking_number}
                            </span>
                          </p>
                          {order.carrier && (
                            <p>
                              Transportista: <span className="font-semibold">{order.carrier}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">En preparación</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        ✅
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Entregado</p>
                      <p className="text-sm text-gray-600">
                        {order.status === 'delivered'
                          ? `Entregado el ${new Date(order.updated_at).toLocaleDateString('es-MX')}`
                          : 'En proceso'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Products */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Artículos Ordenados</h3>
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Totals and Address */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Resumen</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>${(order.total - 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío:</span>
                      <span>$100.00</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="text-arena">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Dirección de Envío</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p>{order.shipping_address}</p>
                    <p>
                      {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                    </p>
                    <p>{order.shipping_country}</p>
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <button
                onClick={() => {
                  setOrder(null);
                  setEmail('');
                  setOrderId('');
                }}
                className="w-full mt-8 px-6 py-3 border-2 border-arena text-arena rounded-lg hover:bg-arena/5 transition font-semibold"
              >
                ← Buscar Otra Orden
              </button>
            </div>
          </div>
        )}

        {/* No results message */}
        {searched && !order && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center border border-gray-200">
            <p className="text-gray-600 mb-4">No se encontró ninguna orden con esos datos.</p>
            <button
              onClick={() => {
                setSearched(false);
                setEmail('');
                setOrderId('');
                setError('');
              }}
              className="px-6 py-2 bg-arena text-white rounded-lg hover:bg-arena/90 transition"
            >
              ← Intentar de Nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
