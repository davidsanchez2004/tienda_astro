import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface AnalyticsData {
  monthlySales: number;
  monthlyOrderCount: number;
  pendingOrders: number;
  topProduct: {
    name: string;
    quantity: number;
    image_url: string;
  };
  chartData: {
    day: string;
    date: string;
    total: number;
  }[];
  totalCustomers: number;
}

// Helpers para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// SVG Icons como componentes inline
const EuroIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 7.629A3 3 0 0 0 9.017 9.43c-.023.212-.002.425.028.636l.506 3.428a4.5 4.5 0 0 0 8.399 2.058M14.121 7.629l-.375 2.558M9.017 9.43l.375-2.558m0 0A3 3 0 0 1 14.121 7.63M9.392 6.872l4.73.757" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A3.375 3.375 0 0 0 13.125 11h-.75a.375.375 0 0 1-.375-.375V7.875c0-1.036.84-1.875 1.875-1.875h.375A3.375 3.375 0 0 0 17.625 2.625v-.75a.375.375 0 0 0-.375-.375h-10.5a.375.375 0 0 0-.375.375v.75A3.375 3.375 0 0 0 9.75 6h.375c1.036 0 1.875.84 1.875 1.875v2.75a.375.375 0 0 1-.375.375h-.75A3.375 3.375 0 0 0 7.5 14.25v4.5" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

// Tooltip personalizado para el gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-[#8B7355] font-semibold">
          {payload[0].value.toFixed(2)} &euro;
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getCookie('admin_token');

      const res = await fetch('/api/admin/analytics', {
        credentials: 'include',
        headers: {
          'x-admin-key': token || '',
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) throw new Error('Error al cargar analíticas');

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl h-32 shadow-sm" />
          ))}
        </div>
        <div className="bg-white rounded-xl h-80 shadow-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-3 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const monthName = new Date().toLocaleString('es-ES', { month: 'long' });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas del mes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Ventas de {monthName}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {data.monthlySales.toFixed(2)}&euro;
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {data.monthlyOrderCount} pedidos pagados
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <EuroIcon />
            </div>
          </div>
        </div>

        {/* Pedidos pendientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Pedidos pendientes
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {data.pendingOrders}
              </p>
              <p className="text-sm text-gray-400 mt-1">Requieren atención</p>
            </div>
            <div className={`p-3 rounded-xl ${data.pendingOrders > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
              <ClockIcon />
            </div>
          </div>
        </div>

        {/* Producto más vendido */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Más vendido
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2 truncate" title={data.topProduct.name}>
                {data.topProduct.name}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {data.topProduct.quantity} unidades vendidas
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600 ml-3">
              <TrophyIcon />
            </div>
          </div>
        </div>

        {/* Clientes registrados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Clientes registrados
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {data.totalCustomers}
              </p>
              <p className="text-sm text-gray-400 mt-1">Total de la tienda</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <UsersIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de ventas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FAF8F5] rounded-lg text-[#8B7355]">
              <ChartIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ventas - Últimos 7 días</h3>
              <p className="text-sm text-gray-400">Ingresos diarios de pedidos pagados</p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Actualizar datos"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {data.chartData.every((d) => d.total === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShoppingBagIcon />
            <p className="mt-3 text-sm">No hay ventas en los últimos 7 días</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4C5B9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4C5B9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 13, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 13, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#8B7355"
                strokeWidth={2.5}
                fill="url(#salesGradient)"
                dot={{ fill: '#8B7355', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#D4C5B9', stroke: '#8B7355', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
