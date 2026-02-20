import React, { useState, useEffect } from 'react';
import AdminOrderList from './AdminOrderList';
import AdminOrderDetail from './AdminOrderDetail';
import AdminReturnsManager from './AdminReturnsManager';
import AdminInvoiceManager from './AdminInvoiceManager';
import ProductManager from './ProductManager';
import DiscountCodeManager from './DiscountCodeManager';
import BlogManager from './BlogManager';
import CategoryManager from './CategoryManager';
import NewsletterManager from './NewsletterManager';

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

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper para eliminar cookies
function deleteCookie(name: string) {
  document.cookie = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'returns' | 'invoices' | 'products' | 'categories' | 'discounts' | 'blog' | 'newsletter'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Efecto de autenticación inicial - solo una vez
  useEffect(() => {
    console.log('[AdminDashboard] Inicializando...');
    const token = getCookie('admin_token');
    const email = getCookie('admin_email');
    console.log('[AdminDashboard] Token:', token ? token.substring(0, 20) + '...' : 'NOT FOUND');
    console.log('[AdminDashboard] Email:', email);
    
    if (token) {
      setAdminKey(token);
      setAdminEmail(email || '');
      setIsAuthenticated(true);
    } else {
      // Si no hay token en el cliente pero llegamos aquí, el SSR debería haber redirigido
      // Esto es un respaldo
      console.log('[AdminDashboard] No token found, SSR should have redirected');
      window.location.href = '/admin/login';
    }
  }, []);

  // Efecto para cargar datos cuando cambia el tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'orders' && adminKey) {
      fetchOrders(adminKey);
    }
  }, [activeTab, isAuthenticated, adminKey]);

  const fetchOrders = async (key: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/get-orders', {
        method: 'GET',
        credentials: 'include', // Importante para enviar cookies
        headers: {
          'x-admin-key': key,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        deleteCookie('admin_token');
        deleteCookie('admin_email');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Error al cargar órdenes');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    deleteCookie('admin_token');
    deleteCookie('admin_email');
    window.location.href = '/admin/login';
  };

  const handleRefresh = () => {
    fetchOrders(adminKey);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrder(updatedOrder);
  };

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const searchLower = (searchTerm || '').toLowerCase();
    const orderNumber = (order.orderNumber || order.id || '').toLowerCase();
    const guestEmail = (order.guest_email || '').toLowerCase();
    const orderId = (order.id || '').toLowerCase();
    
    const matchesSearch = !searchTerm || 
      orderNumber.includes(searchLower) ||
      guestEmail.includes(searchLower) ||
      orderId.includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-arena mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#8B7355]">Panel de Administración</h1>
            <p className="text-gray-600 text-sm">Gestión de órdenes y devoluciones</p>
          </div>
          <div className="flex items-center gap-4">
            {adminEmail && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F5] rounded-lg">
                <svg className="w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span className="text-sm text-gray-600">{adminEmail}</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 border-t border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-[#D4C5B9] text-[#8B7355]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Órdenes
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'returns'
                  ? 'border-[#D4C5B9] text-[#8B7355]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Devoluciones
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'invoices'
                  ? 'border-[#D4C5B9] text-[#8B7355]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Facturas
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-[#D4C5B9] text-[#8B7355]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'discounts'
                  ? 'border-[#D4C5B9] text-[#8B7355]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Descuentos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-[#D4C5B9] text-[#8B7355]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Categorias
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'blog'
                  ? 'border-[#D4C5B9] text-[#8B7355]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Blog
            </button>
            <button
              onClick={() => setActiveTab('newsletter')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'newsletter'
                  ? 'border-[#D4C5B9] text-[#8B7355]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Newsletter
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'orders' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                {/* Filter and Search */}
                <div className="p-6 border-b border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Buscar por orden, email o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(['all', 'pending', 'processing', 'shipped', 'delivered'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => setFilter(status)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === status
                              ? 'bg-arena text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status === 'all' ? 'Todas' : 
                           status === 'pending' ? 'Pendiente' :
                           status === 'processing' ? 'Procesando' :
                           status === 'shipped' ? 'Enviado' :
                           status === 'delivered' ? 'Entregado' : status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length > 0 ? (
                  <AdminOrderList
                    orders={filteredOrders}
                    selectedOrder={selectedOrder}
                    onSelectOrder={setSelectedOrder}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-600">
                    No hay órdenes que coincidan con los filtros
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Order Detail */}
            <div className="lg:col-span-1">
              {selectedOrder ? (
                <AdminOrderDetail
                  order={selectedOrder}
                  onOrderUpdated={handleUpdateOrder}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
                  Selecciona una orden para ver detalles
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'returns' ? (
          <AdminReturnsManager />
        ) : activeTab === 'invoices' ? (
          <AdminInvoiceManager />
        ) : activeTab === 'discounts' ? (
          <DiscountCodeManager />
        ) : activeTab === 'categories' ? (
          <CategoryManager />
        ) : activeTab === 'blog' ? (
          <BlogManager />
        ) : activeTab === 'newsletter' ? (
          <NewsletterManager />
        ) : (
          <ProductManager />
        )}
      </div>
    </div>
  );
}
