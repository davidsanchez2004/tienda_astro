import React, { useState } from 'react';

interface OrderItemForReturn {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  quantity: number;
  price: number;
  alreadyReturned: number;
}

interface ReturnFormProps {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  customerEmail: string;
  orderItems?: OrderItemForReturn[];
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

interface SelectedItem {
  orderItemId: string;
  quantity: number;
  reason: string;
}

export default function ReturnForm({ orderId, orderNumber, orderTotal, customerEmail, orderItems = [] }: ReturnFormProps) {
  const [step, setStep] = useState<'items' | 'details' | 'confirmation'>('items');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [generalReason, setGeneralReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const exists = prev.find(s => s.orderItemId === itemId);
      if (exists) {
        return prev.filter(s => s.orderItemId !== itemId);
      }
      const orderItem = orderItems.find(i => i.id === itemId);
      if (!orderItem) return prev;
      const maxReturnableQty = orderItem.quantity - orderItem.alreadyReturned;
      return [...prev, { orderItemId: itemId, quantity: maxReturnableQty, reason: '' }];
    });
  };

  // Update quantity for a selected item
  const updateItemQuantity = (itemId: string, qty: number) => {
    const orderItem = orderItems.find(i => i.id === itemId);
    if (!orderItem) return;
    const maxQty = orderItem.quantity - orderItem.alreadyReturned;
    const clampedQty = Math.max(1, Math.min(qty, maxQty));
    
    setSelectedItems(prev =>
      prev.map(s => s.orderItemId === itemId ? { ...s, quantity: clampedQty } : s)
    );
  };

  // Update individual reason
  const updateItemReason = (itemId: string, reason: string) => {
    setSelectedItems(prev =>
      prev.map(s => s.orderItemId === itemId ? { ...s, reason } : s)
    );
  };

  // Calculate refund amount based on selected items
  const calculateRefundAmount = (): number => {
    return selectedItems.reduce((total, sel) => {
      const item = orderItems.find(i => i.id === sel.orderItemId);
      if (!item) return total;
      return total + (item.price * sel.quantity);
    }, 0);
  };

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
          reason: generalReason,
          description,
          guestEmail: customerEmail,
          items: selectedItems.map(sel => {
            const item = orderItems.find(i => i.id === sel.orderItemId);
            return {
              orderItemId: sel.orderItemId,
              productId: item?.product_id || '',
              productName: item?.name || '',
              quantity: sel.quantity,
              price: item?.price || 0,
              reason: sel.reason || generalReason,
            };
          }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear solicitud de devolución');
      }

      setStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // === STEP 3: Confirmation ===
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
          Hemos recibido tu solicitud de devolución para {selectedItems.length} artículo{selectedItems.length > 1 ? 's' : ''}.
          Te enviaremos un email con las instrucciones y etiqueta de envío.
        </p>
        <p className="text-sm text-green-600 mb-4">
          Reembolso estimado: €{calculateRefundAmount().toFixed(2)}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.href = '/mis-pedidos'}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Mis Pedidos
          </button>
          <button
            onClick={() => window.location.href = '/catalogo'}
            className="px-6 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium"
          >
            Seguir Comprando
          </button>
        </div>
      </div>
    );
  }

  // === STEP 1: Select items ===
  if (step === 'items') {
    return (
      <div className="space-y-6">
        {/* Order Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pedido</p>
          <p className="font-semibold text-gray-900">{orderNumber}</p>
        </div>

        {/* Item selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Selecciona los artículos a devolver
          </h3>
          <div className="space-y-3">
            {orderItems.map(item => {
              const maxReturnable = item.quantity - item.alreadyReturned;
              const isFullyReturned = maxReturnable <= 0;
              const isSelected = selectedItems.some(s => s.orderItemId === item.id);
              const selectedQty = selectedItems.find(s => s.orderItemId === item.id)?.quantity || 0;

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isFullyReturned
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : isSelected
                        ? 'border-arena bg-arena-pale'
                        : 'border-gray-200 hover:border-arena-light cursor-pointer'
                  }`}
                  onClick={() => !isFullyReturned && toggleItem(item.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isFullyReturned}
                        onChange={() => !isFullyReturned && toggleItem(item.id)}
                        className="w-5 h-5 text-arena rounded border-gray-300 focus:ring-arena"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Image */}
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        €{item.price.toFixed(2)} × {item.quantity}
                      </p>
                      {item.alreadyReturned > 0 && (
                        <p className="text-xs text-amber-600">
                          {item.alreadyReturned} ya devuelto{item.alreadyReturned > 1 ? 's' : ''}
                        </p>
                      )}
                      {isFullyReturned && (
                        <p className="text-xs text-red-600 font-medium">Totalmente devuelto</p>
                      )}
                    </div>

                    {/* Quantity selector (when selected) */}
                    {isSelected && maxReturnable > 1 && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-gray-500">Cant:</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, selectedQty - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{selectedQty}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, selectedQty + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-100"
                          disabled={selectedQty >= maxReturnable}
                        >
                          +
                        </button>
                        <span className="text-xs text-gray-400">/{maxReturnable}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {selectedItems.length > 0 && (
          <div className="bg-arena-pale p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                {selectedItems.length} artículo{selectedItems.length > 1 ? 's' : ''} seleccionado{selectedItems.length > 1 ? 's' : ''}
              </span>
              <span className="font-semibold text-arena">
                Reembolso est.: €{calculateRefundAmount().toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          type="button"
          onClick={() => setStep('details')}
          disabled={selectedItems.length === 0}
          className="w-full bg-arena text-white py-3 rounded-lg hover:bg-arena-light transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar ({selectedItems.length} artículo{selectedItems.length > 1 ? 's' : ''})
        </button>

        <a href="/devoluciones" className="block text-center text-gray-500 hover:text-gray-700 text-sm">
          ← Volver a política de devoluciones
        </a>
      </div>
    );
  }

  // === STEP 2: Details form ===
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Back button */}
      <button
        type="button"
        onClick={() => setStep('items')}
        className="text-arena hover:text-arena-light text-sm font-medium"
      >
        ← Volver a seleccionar artículos
      </button>

      {/* Selected items summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-3">Artículos a devolver:</p>
        <div className="space-y-2">
          {selectedItems.map(sel => {
            const item = orderItems.find(i => i.id === sel.orderItemId);
            if (!item) return null;
            return (
              <div key={sel.orderItemId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded" />
                  )}
                  <span className="text-gray-900">{item.name}</span>
                  <span className="text-gray-500">× {sel.quantity}</span>
                </div>
                <span className="font-medium">€{(item.price * sel.quantity).toFixed(2)}</span>
              </div>
            );
          })}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total reembolso</span>
            <span className="text-arena">€{calculateRefundAmount().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* General Return Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Razón principal de la Devolución *
        </label>
        <div className="relative">
          <select
            value={generalReason}
            onChange={(e) => setGeneralReason(e.target.value)}
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

      {/* Per-item reason (optional, if multiple items) */}
      {selectedItems.length > 1 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Razón por artículo (opcional)
          </p>
          <div className="space-y-2">
            {selectedItems.map(sel => {
              const item = orderItems.find(i => i.id === sel.orderItemId);
              if (!item) return null;
              return (
                <div key={sel.orderItemId} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 truncate flex-shrink-0 w-32">{item.name}</span>
                  <select
                    value={sel.reason}
                    onChange={(e) => updateItemReason(sel.orderItemId, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">Misma razón general</option>
                    {RETURN_REASONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Próximos Pasos:</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg> Recibirás un email con tu número de devolución</li>
          <li className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg> Descarga la etiqueta de envío pre-pagada</li>
          <li className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg> Empaca el artículo y envía</li>
          <li className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg> Recibimos y procesamos tu reembolso (3-5 días)</li>
        </ul>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3">
        <input type="checkbox" id="terms" className="mt-1" required />
        <label htmlFor="terms" className="text-sm text-gray-600">
          Entiendo que el reembolso se procesará después de recibir e inspeccionar los artículos.
          Los gastos de envío original no son reembolsables.
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !generalReason || !description}
        className="w-full bg-arena text-white py-3 rounded-lg hover:bg-arena-light transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : `Solicitar Devolución (€${calculateRefundAmount().toFixed(2)})`}
      </button>
    </form>
  );
}
