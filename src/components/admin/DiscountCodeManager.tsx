import { useState, useEffect } from 'react';

interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string | null;
  target_email: string | null;
  personal_message: string | null;
  sent_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface DiscountManagerProps {
  adminKey: string;
}

export default function DiscountCodeManager({ adminKey }: DiscountManagerProps) {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minPurchase: '',
    maxUses: '',
    perUserLimit: '1',
    validUntil: '',
    targetEmail: '',
    customerName: '',
    personalMessage: '',
    sendEmail: false,
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/discount-codes', {
        headers: { 'x-admin-key': adminKey },
      });
      const data = await response.json();
      if (data.success) {
        setCodes(data.codes);
      }
    } catch (err) {
      setError('Error al cargar códigos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          code: formData.code,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          perUserLimit: parseInt(formData.perUserLimit) || 1,
          validUntil: formData.validUntil || null,
          targetEmail: formData.targetEmail || null,
          customerName: formData.customerName || null,
          personalMessage: formData.personalMessage || null,
          sendEmail: formData.sendEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          formData.sendEmail && formData.targetEmail
            ? `¡Código creado y email enviado a ${formData.targetEmail}!`
            : '¡Código de descuento creado correctamente!'
        );
        setFormData({
          code: '',
          discountType: 'percentage',
          discountValue: '',
          minPurchase: '',
          maxUses: '',
          perUserLimit: '1',
          validUntil: '',
          targetEmail: '',
          customerName: '',
          personalMessage: '',
          sendEmail: false,
        });
        setShowForm(false);
        fetchCodes();
      } else {
        setError(data.error || 'Error al crear código');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar este código de descuento?')) return;

    try {
      const response = await fetch('/api/admin/discount-codes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Código desactivado');
        fetchCodes();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error al desactivar código');
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BA';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4C5B9] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Códigos de Descuento</h2>
          <p className="text-gray-600">Gestiona y envía códigos promocionales a tus clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#D4C5B9] text-white rounded-lg hover:bg-[#8B7355] transition-colors flex items-center gap-2"
        >
          {showForm ? 'Cerrar' : '+ Nuevo Codigo'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Código</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Código y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9] focus:border-transparent"
                    placeholder="CODIGO10"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    title="Generar codigo aleatorio"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Descuento *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Cantidad Fija (€)</option>
                </select>
              </div>
            </div>

            {/* Valor y Mínimo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor del Descuento *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                    placeholder={formData.discountType === 'percentage' ? '10' : '5.00'}
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    {formData.discountType === 'percentage' ? '%' : '€'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compra Mínima
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Expiración
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                />
              </div>
            </div>

            {/* Límites */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Usos (total)
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                  placeholder="Ilimitado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usos por Usuario
                </label>
                <input
                  type="number"
                  value={formData.perUserLimit}
                  onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                  placeholder="1"
                />
              </div>
            </div>

            {/* Personalización */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> Enviar por Email (opcional)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email del Cliente
                  </label>
                  <input
                    type="email"
                    value={formData.targetEmail}
                    onChange={(e) => setFormData({ ...formData, targetEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                    placeholder="cliente@ejemplo.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si se especifica, solo este email podrá usar el código
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                    placeholder="María García"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje Personalizado
                </label>
                <textarea
                  value={formData.personalMessage}
                  onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                  rows={2}
                  placeholder="¡Gracias por ser parte de BY ARENA! Este descuento es un regalo especial para ti..."
                />
              </div>

              {formData.targetEmail && (
                <label className="flex items-center gap-3 mt-4 p-3 bg-[#FAF8F5] rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    className="w-5 h-5 text-[#D4C5B9] rounded focus:ring-[#D4C5B9]"
                  />
                  <div>
                    <span className="font-medium text-gray-700">Enviar email con el código</span>
                    <p className="text-sm text-gray-500">
                      Se enviará un email personalizado con el código de descuento
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-[#D4C5B9] text-white rounded-lg hover:bg-[#8B7355] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Creando...
                  </>
                ) : (
                  <>
                    {formData.sendEmail && formData.targetEmail ? 'Crear y Enviar' : 'Crear Codigo'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Codes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descuento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mín.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Válido hasta</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No hay códigos de descuento. ¡Crea el primero!
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.id} className={!code.is_active ? 'bg-gray-50 opacity-60' : ''}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-[#8B7355]">{code.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-[#FAF8F5] text-[#8B7355]">
                        {code.discount_type === 'percentage' 
                          ? `${code.discount_value}%` 
                          : `€${code.discount_value.toFixed(2)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {code.min_purchase > 0 ? `€${code.min_purchase}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {code.current_uses} / {code.max_uses || '∞'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {code.valid_until 
                        ? new Date(code.valid_until).toLocaleDateString('es-ES')
                        : 'Sin límite'}
                    </td>
                    <td className="px-4 py-3">
                      {code.target_email ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600 truncate max-w-[120px]" title={code.target_email}>
                            {code.target_email}
                          </span>
                          {code.sent_at && (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Público</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {code.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {code.is_active && (
                        <button
                          onClick={() => handleDeactivate(code.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          title="Desactivar código"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Códigos</p>
          <p className="text-2xl font-semibold text-[#8B7355]">{codes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-2xl font-semibold text-green-600">
            {codes.filter(c => c.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Usos Totales</p>
          <p className="text-2xl font-semibold text-[#8B7355]">
            {codes.reduce((sum, c) => sum + c.current_uses, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Personalizados</p>
          <p className="text-2xl font-semibold text-[#C4A35A]">
            {codes.filter(c => c.target_email).length}
          </p>
        </div>
      </div>
    </div>
  );
}
