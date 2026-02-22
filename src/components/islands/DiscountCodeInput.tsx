import { useState } from 'react';

interface DiscountResult {
  valid: boolean;
  code?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  calculatedDiscount?: number;
  message?: string;
  error?: string;
}

interface DiscountCodeInputProps {
  cartTotal: number;
  userEmail?: string;
  userId?: string;
  onDiscountApplied: (discount: DiscountResult) => void;
  appliedDiscount?: DiscountResult | null;
  onRemoveDiscount?: () => void;
}

export default function DiscountCodeInput({
  cartTotal,
  userEmail,
  userId,
  onDiscountApplied,
  appliedDiscount,
  onRemoveDiscount,
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError('Introduce un código');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          email: userEmail,
          userId,
          cartTotal,
        }),
      });

      const result: DiscountResult = await response.json();

      if (result.valid) {
        onDiscountApplied(result);
        setCode('');
      } else {
        setError(result.error || 'Código no válido');
      }
    } catch (err) {
      setError('Error al validar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    if (onRemoveDiscount) {
      onRemoveDiscount();
    }
  };

  // Si ya hay un descuento aplicado, mostrar resumen
  if (appliedDiscount?.valid) {
    return (
      <div className="bg-gradient-to-r from-[#C4A35A]/10 to-[#D4C5B9]/10 rounded-xl p-4 border border-[#C4A35A]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <p className="font-semibold text-[#8B7355]">
                Código aplicado: <span className="font-mono">{appliedDiscount.code}</span>
              </p>
              <p className="text-sm text-green-600">
                {appliedDiscount.discountType === 'percentage'
                  ? `${appliedDiscount.discountValue}% de descuento`
                  : `€${appliedDiscount.discountValue?.toFixed(2)} de descuento`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold text-green-600">
              -€{appliedDiscount.calculatedDiscount?.toFixed(2)}
            </span>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Eliminar código"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        ¿Tienes un código de descuento?
      </label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyCode();
              }
            }}
            placeholder="CODIGO10"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#D4C5B9] focus:border-transparent font-mono uppercase tracking-wider ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            disabled={loading}
          />
          {code && (
            <button
              onClick={() => setCode('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          onClick={handleApplyCode}
          disabled={loading || !code.trim()}
          className="px-6 py-3 bg-[#D4C5B9] text-white rounded-lg hover:bg-[#8B7355] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Validando...
            </>
          ) : (
            'Aplicar'
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      <p className="text-xs text-gray-500">
        Introduce el código promocional que has recibido por email
      </p>
    </div>
  );
}
