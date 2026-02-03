import React, { useState } from 'react';

interface ReturnFormProps {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  customerEmail: string;
}

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

export default function ReturnForm({ orderId, orderNumber, orderTotal, customerEmail }: ReturnFormProps) {
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [itemsCount, setItemsCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/returns/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          reason,
          description,
          itemsCount,
          guestEmail: customerEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear solicitud de devolución');
      }

      const data = await response.json();
      console.log('Return created:', data);
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
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">¡Solicitud Recibida!</h3>
        <p className="text-green-700 mb-4">
          Hemos recibido tu solicitud de devolución. Te enviaremos un email con las instrucciones
          y etiqueta de envío.
        </p>
        <p className="text-sm text-green-600 mb-4">
          Tiempo de procesamiento: 24-48 horas
        </p>
        <button
          onClick={() => window.location.href = '/mis-pedidos'}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Volver a Mis Pedidos
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Order Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Pedido</p>
        <p className="font-semibold text-gray-900">{orderNumber}</p>
        <p className="text-sm text-gray-600 mt-2">Monto original: ${orderTotal.toFixed(2)}</p>
      </div>

      {/* Return Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Razón de la Devolución *
        </label>
        <div className="relative">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 font-medium appearance-none cursor-pointer hover:border-arena/50 focus:border-arena focus:ring-4 focus:ring-arena/10 focus:outline-none transition-all duration-200"
            required
          >
            <option value="" className="text-gray-400">Selecciona una razón...</option>
            {RETURN_REASONS.map(r => (
              <option key={r.value} value={r.value} className="py-2">{r.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg className="w-5 h-5 text-arena" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción Detallada *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cuéntanos más sobre el motivo de tu devolución..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent h-32 resize-none"
          required
        />
      </div>

      {/* Items Count */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de Artículos a Devolver *
        </label>
        <input
          type="number"
          value={itemsCount}
          onChange={(e) => setItemsCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent"
          min="1"
          required
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Próximos Pasos:</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>Recibiras un email con tu numero de devolucion</li>
          <li>Descarga la etiqueta de envio pre-pagada</li>
          <li>Empaca el articulo y envia</li>
          <li>Recibimos y procesamos tu reembolso</li>
        </ul>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          className="mt-1"
          required
        />
        <label htmlFor="terms" className="text-sm text-gray-600">
          Entiendo que el reembolso se procesará después de recibir e inspeccionar el artículo.
          Los gastos de envío original no son reembolsables.
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !reason || !description}
        className="w-full bg-arena text-white py-2 rounded-lg hover:bg-arena-light transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : 'Solicitar Devolución'}
      </button>
    </form>
  );
}
