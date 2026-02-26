import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase-client';
import type { Order, Address } from '../../lib/types';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface Return {
  id: string;
  order_id: string;
  return_number: string;
  status: string;
  reason: string;
  refund_amount: number;
  created_at: string;
  updated_at: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'devoluciones' | 'direcciones' | 'datos'>('pedidos');

  useEffect(() => {
    // Cargar usuario al montar
    async function loadUser() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setLoading(false);
      }
    }
    loadUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadUserData(session.user);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const loadUserData = async (currentUser: User) => {
    try {
      // Load orders linked to user_id
      const { data: userOrders } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      // Also load any remaining guest orders with same email (fallback)
      let guestOrders: Order[] = [];
      if (currentUser.email) {
        const { data: guestData } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('guest_email', currentUser.email)
          .eq('checkout_type', 'guest')
          .is('user_id', null)
          .order('created_at', { ascending: false });
        guestOrders = guestData || [];
      }

      // Merge and deduplicate orders
      const allOrders = [...(userOrders || []), ...guestOrders];
      const uniqueOrders = allOrders.filter(
        (order, index, self) => index === self.findIndex(o => o.id === order.id)
      );
      uniqueOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(uniqueOrders);

      // Load returns
      const { data: userReturns } = await supabaseClient
        .from('returns')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      let guestReturns: Return[] = [];
      if (currentUser.email) {
        const { data: gData } = await supabaseClient
          .from('returns')
          .select('*')
          .eq('guest_email', currentUser.email)
          .is('user_id', null)
          .order('created_at', { ascending: false });
        guestReturns = gData || [];
      }

      const allReturns = [...(userReturns || []), ...guestReturns];
      const uniqueReturns = allReturns.filter(
        (r, i, self) => i === self.findIndex(x => x.id === r.id)
      );
      uniqueReturns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReturns(uniqueReturns);

      // Load addresses
      const { data: addressesData } = await supabaseClient
        .from('addresses')
        .select('*')
        .eq('user_id', currentUser.id);

      setAddresses(addressesData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">Debes iniciar sesión</p>
        <a href="/login" className="text-arena font-semibold hover:text-arena-light">
          Inicia sesión aquí
        </a>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Cargando tu cuenta...</div>;
  }

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Sidebar */}
      <aside className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-arena-light p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-arena mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">
              {user.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.user_metadata?.full_name || user.email}
            </h2>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>

          <div className="space-y-2 border-t border-arena-light pt-6">
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${
                activeTab === 'pedidos'
                  ? 'bg-arena text-white'
                  : 'text-gray-700 hover:bg-arena-pale'
              }`}
            >
              Mis Pedidos
            </button>
            <button
              onClick={() => setActiveTab('devoluciones')}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${
                activeTab === 'devoluciones'
                  ? 'bg-arena text-white'
                  : 'text-gray-700 hover:bg-arena-pale'
              }`}
            >
              Devoluciones {returns.length > 0 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{returns.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('direcciones')}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${
                activeTab === 'direcciones'
                  ? 'bg-arena text-white'
                  : 'text-gray-700 hover:bg-arena-pale'
              }`}
            >
              Direcciones
            </button>
            <button
              onClick={() => setActiveTab('datos')}
              className={`w-full text-left px-4 py-2 rounded transition-colors ${
                activeTab === 'datos'
                  ? 'bg-arena text-white'
                  : 'text-gray-700 hover:bg-arena-pale'
              }`}
            >
              Datos Personales
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:col-span-3">
        {/* Pedidos */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-gray-900">Mis Pedidos</h3>

            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-lg border border-arena-light p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-2xl font-bold text-arena">€{order.total.toFixed(2)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'paid' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'refunded' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'delivered' && 'Entregado'}
                        {order.status === 'shipped' && 'Enviado'}
                        {order.status === 'paid' && 'Pagado'}
                        {order.status === 'pending' && 'Pendiente'}
                        {order.status === 'cancelled' && 'Cancelado'}
                        {order.status === 'refunded' && 'Reembolsado'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      <p>Fecha: {new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                      {order.tracking_number && (
                        <p>Tracking: {order.tracking_number}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/pedido/${order.id}`}
                        className="px-4 py-2 text-arena font-semibold hover:bg-arena-pale rounded transition-colors border border-arena"
                      >
                        Ver Detalles
                      </a>
                      <a
                        href={`/api/invoice/${order.id}`}
                        target="_blank"
                        className="px-4 py-2 text-arena font-semibold hover:bg-arena-pale rounded transition-colors border border-arena"
                      >
                        Descargar Factura
                      </a>
                      {order.status === 'delivered' && (
                        <a
                          href={`/devolucion/${order.id}`}
                          className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded transition-colors border border-gray-300"
                        >
                          Solicitar Devolución
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">No tienes pedidos</p>
                <a href="/catalogo" className="text-arena font-semibold hover:text-arena-light">
                  Empezar a comprar
                </a>
              </div>
            )}
          </div>
        )}

        {/* Devoluciones */}
        {activeTab === 'devoluciones' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-gray-900">Mis Devoluciones</h3>

            {returns.length > 0 ? (
              <div className="space-y-4">
                {returns.map(ret => {
                  const statusLabels: Record<string, string> = {
                    pending: 'Pendiente',
                    approved: 'Aprobada',
                    rejected: 'Rechazada',
                    shipped: 'Enviado',
                    received: 'Recibido',
                    completed: 'Completada',
                    cancelled: 'Cancelada',
                  };
                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-100 text-yellow-700',
                    approved: 'bg-blue-100 text-blue-700',
                    rejected: 'bg-red-100 text-red-700',
                    shipped: 'bg-purple-100 text-purple-700',
                    received: 'bg-indigo-100 text-indigo-700',
                    completed: 'bg-green-100 text-green-700',
                    cancelled: 'bg-gray-100 text-gray-700',
                  };
                  const reasonLabels: Record<string, string> = {
                    defective: 'Producto defectuoso',
                    wrong_item: 'Producto incorrecto',
                    not_as_described: 'No es como se describía',
                    changed_mind: 'Cambio de opinión',
                    other: 'Otro motivo',
                  };

                  return (
                    <div key={ret.id} className="bg-white rounded-lg border border-arena-light p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Devolución #{ret.return_number}</p>
                          <p className="text-2xl font-bold text-red-600">-€{ret.refund_amount.toFixed(2)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[ret.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[ret.status] || ret.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-4">
                        <p>Razón: {reasonLabels[ret.reason] || ret.reason}</p>
                        <p>Fecha: {new Date(ret.created_at).toLocaleDateString('es-ES')}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/pedido/${ret.order_id}`}
                          className="px-4 py-2 text-arena font-semibold hover:bg-arena-pale rounded transition-colors border border-arena"
                        >
                          Ver Pedido Original
                        </a>
                        {ret.status === 'completed' && (
                          <a
                            href={`/api/invoice/${ret.id}?type=return`}
                            target="_blank"
                            className="px-4 py-2 text-red-600 font-semibold hover:bg-red-50 rounded transition-colors border border-red-300"
                          >
                            Descargar Factura de Devolución
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">No tienes devoluciones</p>
              </div>
            )}
          </div>
        )}

        {/* Direcciones */}
        {activeTab === 'direcciones' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-gray-900">Mis Direcciones</h3>
              <button className="px-4 py-2 bg-arena text-white rounded-lg hover:bg-arena-light transition-colors font-semibold">
                Agregar Dirección
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {addresses.map(address => (
                  <div key={address.id} className="bg-white rounded-lg border border-arena-light p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900">{address.name}</h4>
                      {address.is_default && (
                        <span className="text-xs bg-gold text-white px-2 py-1 rounded">
                          Predeterminada
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 space-y-1">
                      <span>{address.street} {address.number}</span>
                      {address.apartment && <span>, {address.apartment}</span>}
                      <br />
                      <span>{address.postal_code} {address.city}, {address.state}</span>
                      <br />
                      <span>{address.phone}</span>
                    </p>

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 text-sm border border-arena text-arena rounded hover:bg-arena-pale transition-colors">
                        Editar
                      </button>
                      <button className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors">
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">No tienes direcciones guardadas</p>
              </div>
            )}
          </div>
        )}

        {/* Datos Personales */}
        {activeTab === 'datos' && (
          <div className="bg-white rounded-lg border border-arena-light p-6 max-w-md">
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">Datos Personales</h3>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  defaultValue={user.user_metadata?.full_name || ''}
                  disabled
                  className="w-full opacity-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user.email}
                  disabled
                  className="w-full opacity-50 cursor-not-allowed"
                />
              </div>

              <p className="text-sm text-gray-600 italic">
                Contacta con soporte para cambiar tus datos personales
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
