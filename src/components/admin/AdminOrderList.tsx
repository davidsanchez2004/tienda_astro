import React from 'react';

interface Order {
  id: string;
  orderNumber: string;
  guest_email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'refunded';
  total: number;
  created_at: string;
}

interface Props {
  orders: Order[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  refunded: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  refunded: 'Reembolsado',
};

export default function AdminOrderList({ orders, selectedOrder, onSelectOrder }: Props) {
  return (
    <div className="divide-y divide-gray-200">
      {orders.map(order => (
        <button
          key={order.id}
          onClick={() => onSelectOrder(order)}
          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${
            selectedOrder?.id === order.id
              ? 'border-l-arena bg-arena-pale'
              : 'border-l-transparent'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-900">{order.orderNumber}</p>
              <p className="text-sm text-gray-600">{order.guest_email}</p>
            </div>
            <div className={`px-3 py-1 rounded border text-xs font-medium ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="font-semibold text-arena">${order.total.toFixed(2)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
