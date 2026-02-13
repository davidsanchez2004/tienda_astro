import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import type { Order, Address } from '../../lib/types';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

const emptyAddress = {
  name: '',
  phone: '',
  street: '',
  number: '',
  apartment: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'España',
  is_default: false,
};

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'direcciones' | 'datos'>('pedidos');

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

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
      // Obtener el token de sesión para autenticar la petición
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (session?.access_token) {
        // Usar el API endpoint que bypasa RLS
        const response = await fetch('/api/orders/my-orders', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
          console.log('UserProfile - Orders loaded:', data.orders?.length || 0);
        } else {
          console.error('Error loading orders from API');
          setOrders([]);
        }
      } else {
        console.log('UserProfile - No access token, cannot load orders');
        setOrders([]);
      }

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

  const getToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  };

  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
    setAddressError(null);
    setShowAddressForm(true);
  };

  const openEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      name: address.name || '',
      phone: address.phone || '',
      street: address.street || '',
      number: address.number || '',
      apartment: address.apartment || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country || 'España',
      is_default: address.is_default || false,
    });
    setAddressError(null);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    setAddressError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('No autorizado');

      if (editingAddressId) {
        // Update via supabase client
        const { error } = await supabaseClient
          .from('addresses')
          .update({
            name: addressForm.name,
            phone: addressForm.phone,
            street: addressForm.street,
            number: addressForm.number,
            apartment: addressForm.apartment,
            city: addressForm.city,
            state: addressForm.state,
            postal_code: addressForm.postal_code,
            country: addressForm.country,
            is_default: addressForm.is_default,
          })
          .eq('id', editingAddressId);
        if (error) throw error;
      } else {
        // Create via API
        const res = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(addressForm),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al guardar');
        }
      }

      // Reload addresses
      if (user) {
        const { data } = await supabaseClient.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
        setAddresses(data || []);
      }
      setShowAddressForm(false);
    } catch (err: any) {
      setAddressError(err.message || 'Error al guardar dirección');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('¿Eliminar esta dirección?')) return;
    try {
      const token = await getToken();
      if (!token) throw new Error('No autorizado');

      const res = await fetch('/api/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ address_id: addressId }),
      });
      if (!res.ok) throw new Error('Error al eliminar');

      setAddresses(prev => prev.filter(a => a.id !== addressId));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar dirección');
    }
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
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'delivered' && 'Entregado'}
                        {order.status === 'shipped' && 'Enviado'}
                        {order.status === 'paid' && 'Pagado'}
                        {order.status === 'pending' && 'Pendiente'}
                        {order.status === 'cancelled' && 'Cancelado'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      <p>Fecha: {new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                      {order.tracking_number && (
                        <p>Tracking: {order.tracking_number}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/pedido/${order.id}`}
                        className="px-4 py-2 text-arena font-semibold hover:bg-arena-pale rounded transition-colors border border-arena"
                      >
                        Ver Detalles
                      </a>
                      <a
                        href={`/factura/${order.id}`}
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

        {/* Direcciones */}
        {activeTab === 'direcciones' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-gray-900">Mis Direcciones</h3>
              <button
                onClick={openNewAddress}
                className="px-4 py-2 bg-arena text-white rounded-lg hover:bg-arena-light transition-colors font-semibold"
              >
                Agregar Dirección
              </button>
            </div>

            {/* Address Form Modal */}
            {showAddressForm && (
              <div className="bg-white rounded-lg border-2 border-arena p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingAddressId ? 'Editar Dirección' : 'Nueva Dirección'}
                </h4>
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input type="text" value={addressForm.name} onChange={e => setAddressForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-arena focus:border-arena" placeholder="Casa, Oficina..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input type="tel" value={addressForm.phone} onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-arena focus:border-arena" placeholder="+34 612 345 678" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Calle *</label>
                      <input type="text" required value={addressForm.street} onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-arena focus:border-arena" placeholder="Calle Mayor" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                      <input type="text" value={addressForm.number} onChange={e => setAddressForm(f => ({ ...f, number: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-arena focus:border-arena" placeholder="15" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Piso / Puerta</label>
                    <input type="text" value={addressForm.apartment} onChange={e => setAddressForm(f => ({ ...f, apartment: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-arena focus:border-arena" placeholder="2º B" />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                      <input type="text" required value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-arena focus:border-arena" placeholder="Madrid" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                      <input type="text" value={addressForm.state} onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-arena focus:border-arena" placeholder="Madrid" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
                      <input type="text" required value={addressForm.postal_code} onChange={e => setAddressForm(f => ({ ...f, postal_code: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-arena focus:border-arena" placeholder="28001" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_default" checked={addressForm.is_default} onChange={e => setAddressForm(f => ({ ...f, is_default: e.target.checked }))}
                      className="rounded border-gray-300 text-arena focus:ring-arena" />
                    <label htmlFor="is_default" className="text-sm text-gray-700">Dirección predeterminada</label>
                  </div>
                  {addressError && <p className="text-red-600 text-sm">{addressError}</p>}
                  <div className="flex gap-3">
                    <button type="submit" disabled={addressSaving}
                      className="px-6 py-2 bg-arena text-white rounded-lg hover:bg-arena-light transition-colors font-semibold disabled:opacity-50">
                      {addressSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={() => setShowAddressForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

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
                      <button
                        onClick={() => openEditAddress(address)}
                        className="flex-1 px-3 py-2 text-sm border border-arena text-arena rounded hover:bg-arena-pale transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !showAddressForm ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">No tienes direcciones guardadas</p>
              </div>
            ) : null}
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
