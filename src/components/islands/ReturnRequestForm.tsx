import React, { useState } from 'react';

const RETURN_REASONS = [
  { value: 'damaged', label: 'Producto dañado' },
  { value: 'defective', label: 'Defecto de fábrica' },
  { value: 'wrong_item', label: 'Artículo incorrecto' },
  { value: 'not_as_described', label: 'No como se describe' },
  { value: 'size_issue', label: 'Problema de talla/tamaño' },
  { value: 'color_issue', label: 'Color diferente' },
  { value: 'changed_mind', label: 'Cambié de opinión' },
  { value: 'other', label: 'Otro' },
];

export default function ReturnRequestForm() {
  const [step, setStep] = useState<'search' | 'form' | 'confirmation'>('search');
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/orders/find-by-number?orderNumber=${orderNumber}&email=${email}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Pedido no encontrado');
      }

      const data = await response.json();
      setOrder(data.order);
      setStep('form');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/returns/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          description,
          itemsCount: 1,
          guestEmail: email,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear solicitud de devolución');
      }

      setStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirmation') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">¡Solicitud Recibida!</h3>
        <p className="text-green-700 mb-4">
          Hemos recibido tu solicitud de devolución. Te enviaremos un email a <strong>{email}</strong> con las instrucciones y etiqueta de envío.
        </p>
        <p className="text-sm text-green-600 mb-6">
          Tiempo de procesamiento: 24-48 horas
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Volver al Inicio
        </a>
      </div>
    );
  }

  if (step === 'form' && order) {
    return (
      <form onSubmit={handleSubmitReturn} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Order Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pedido encontrado</p>
          <p className="font-semibold text-gray-900">{order.orderNumber || order.id}</p>
          <p className="text-sm text-gray-600 mt-2">Total: {order.total?.toFixed(2)}€</p>
          <p className="text-sm text-gray-600">Estado: {order.status}</p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo de la devolución *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
          >
            <option value="">Selecciona un motivo</option>
            {RETURN_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del problema *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe el problema con el producto..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStep('search')}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Atrás
          </button>
          <button
            type="submit"
            disabled={loading || !reason || !description}
            className="flex-1 py-3 bg-arena text-white rounded-lg hover:bg-arena-light transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>
    );
  }

  // Search step
  return (
    <form onSubmit={handleSearchOrder} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Ingresa el número de tu pedido y el email con el que realizaste la compra para iniciar una devolución.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de Pedido *
        </label>
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Ej: ORD-123456"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email de la compra *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !orderNumber || !email}
        className="w-full py-3 bg-arena text-white rounded-lg hover:bg-arena-light transition-colors font-medium disabled:opacity-50"
      >
        {loading ? 'Buscando...' : 'Buscar Pedido'}
      </button>
    </form>
  );
}
