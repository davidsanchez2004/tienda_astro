import { useState, useEffect } from 'react';

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

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

interface AutoCouponRule {
  id: string;
  spend_threshold: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  valid_days: number;
  personal_message: string;
  is_active: boolean;
  created_at: string;
}

export default function DiscountCodeManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'codes' | 'auto'>('codes');
  
  // Auto-coupon rules state
  const [autoRules, setAutoRules] = useState<AutoCouponRule[]>([]);
  const [showAutoForm, setShowAutoForm] = useState(false);
  const [autoFormData, setAutoFormData] = useState({
    spendThreshold: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minPurchase: '',
    validDays: '30',
    personalMessage: '¡Gracias por confiar en BY ARENA! Como agradecimiento por tus compras, te regalamos este descuento exclusivo.',
  });

  // Resend dialog state
  const [resendDialog, setResendDialog] = useState<{
    open: boolean;
    code: DiscountCode | null;
    email: string;
    customerName: string;
    personalMessage: string;
  }>({ open: false, code: null, email: '', customerName: '', personalMessage: '' });
  
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
    fetchAutoRules();
  }, []);

  const fetchCodes = async () => {
    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/discount-codes', {
        credentials: 'include',
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

  const fetchAutoRules = async () => {
    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/auto-coupon-rules', {
        credentials: 'include',
        headers: { 'x-admin-key': adminKey },
      });
      const data = await response.json();
      if (data.success) {
        setAutoRules(data.rules);
      }
    } catch (err) {
      console.error('Error loading auto rules:', err);
    }
  };

  const handleResendEmail = async () => {
    if (!resendDialog.code || !resendDialog.email) return;
    setResendingId(resendDialog.code.id);
    setError('');
    setSuccess('');

    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/discount-codes', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          id: resendDialog.code.id,
          targetEmail: resendDialog.email,
          customerName: resendDialog.customerName,
          personalMessage: resendDialog.personalMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Email reenviado a ${resendDialog.email}`);
        setResendDialog({ open: false, code: null, email: '', customerName: '', personalMessage: '' });
        fetchCodes();
      } else {
        setError(data.error || 'Error al reenviar email');
      }
    } catch (err) {
      setError('Error de conexión al reenviar');
    } finally {
      setResendingId(null);
    }
  };

  const openResendDialog = (code: DiscountCode) => {
    setResendDialog({
      open: true,
      code,
      email: code.target_email || '',
      customerName: '',
      personalMessage: code.personal_message || '',
    });
  };

  const handleAutoRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/auto-coupon-rules', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          spendThreshold: parseFloat(autoFormData.spendThreshold),
          discountType: autoFormData.discountType,
          discountValue: parseFloat(autoFormData.discountValue),
          minPurchase: autoFormData.minPurchase ? parseFloat(autoFormData.minPurchase) : 0,
          validDays: parseInt(autoFormData.validDays) || 30,
          personalMessage: autoFormData.personalMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('¡Regla de cupón automático creada!');
        setAutoFormData({
          spendThreshold: '',
          discountType: 'percentage',
          discountValue: '',
          minPurchase: '',
          validDays: '30',
          personalMessage: '¡Gracias por confiar en BY ARENA! Como agradecimiento por tus compras, te regalamos este descuento exclusivo.',
        });
        setShowAutoForm(false);
        fetchAutoRules();
      } else {
        setError(data.error || 'Error al crear regla');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAutoRule = async (id: string, isActive: boolean) => {
    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/auto-coupon-rules', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ id, is_active: !isActive }),
      });

      const data = await response.json();
      if (data.success) {
        fetchAutoRules();
      }
    } catch (err) {
      setError('Error al cambiar estado de regla');
    }
  };

  const deleteAutoRule = async (id: string) => {
    if (!confirm('¿Eliminar esta regla de cupón automático?')) return;
    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/auto-coupon-rules', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Regla eliminada');
        fetchAutoRules();
      }
    } catch (err) {
      setError('Error al eliminar regla');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        credentials: 'include',
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
      const adminKey = getCookie('admin_token') || '';
      const response = await fetch('/api/admin/discount-codes', {
        method: 'DELETE',
        credentials: 'include',
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
          <p className="text-gray-600">Gestiona, envía y automatiza códigos promocionales</p>
        </div>
        {activeTab === 'codes' ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#D4C5B9] text-white rounded-lg hover:bg-[#8B7355] transition-colors flex items-center gap-2"
          >
            {showForm ? 'Cerrar' : '+ Nuevo Codigo'}
          </button>
        ) : (
          <button
            onClick={() => setShowAutoForm(!showAutoForm)}
            className="px-4 py-2 bg-[#D4C5B9] text-white rounded-lg hover:bg-[#8B7355] transition-colors flex items-center gap-2"
          >
            {showAutoForm ? 'Cerrar' : '+ Nueva Regla'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('codes')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'codes'
              ? 'border-[#D4C5B9] text-[#8B7355]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
          Códigos Manuales
        </button>
        <button
          onClick={() => setActiveTab('auto')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'auto'
              ? 'border-[#D4C5B9] text-[#8B7355]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
          Cupones Automáticos
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
      {activeTab === 'codes' && showForm && (
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
      {activeTab === 'codes' && (
        <>
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
                      <div className="flex items-center justify-end gap-2">
                        {code.is_active && (
                          <button
                            onClick={() => openResendDialog(code)}
                            disabled={resendingId === code.id}
                            className="text-[#8B7355] hover:text-[#D4C5B9] text-sm flex items-center gap-1 disabled:opacity-50"
                            title="Enviar/Reenviar por email"
                          >
                            {resendingId === code.id ? (
                              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#8B7355]"></span>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            )}
                            Enviar
                          </button>
                        )}
                        {code.is_active && (
                          <button
                            onClick={() => handleDeactivate(code.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Desactivar código"
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
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
        </>
      )}

      {/* Auto Coupon Rules Tab */}
      {activeTab === 'auto' && (
        <>
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <h4 className="font-medium text-blue-800">¿Cómo funcionan los cupones automáticos?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Cuando un cliente alcanza el umbral de gasto acumulado que configures, se le genera automáticamente
                  un código de descuento personal y se le envía por email. ¡Ideal para fidelizar clientes!
                </p>
              </div>
            </div>
          </div>

          {/* Auto Form */}
          {showAutoForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Nueva Regla de Cupón Automático</h3>
              <form onSubmit={handleAutoRuleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Umbral de Gasto (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={autoFormData.spendThreshold}
                      onChange={(e) => setAutoFormData({ ...autoFormData, spendThreshold: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                      placeholder="100"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Gasto acumulado total del cliente</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Descuento *
                    </label>
                    <select
                      value={autoFormData.discountType}
                      onChange={(e) => setAutoFormData({ ...autoFormData, discountType: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Cantidad Fija (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor del Descuento *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={autoFormData.discountValue}
                      onChange={(e) => setAutoFormData({ ...autoFormData, discountValue: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                      placeholder="10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compra Mínima para Usar (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={autoFormData.minPurchase}
                      onChange={(e) => setAutoFormData({ ...autoFormData, minPurchase: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días de Validez
                    </label>
                    <input
                      type="number"
                      value={autoFormData.validDays}
                      onChange={(e) => setAutoFormData({ ...autoFormData, validDays: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje Personalizado del Email
                  </label>
                  <textarea
                    value={autoFormData.personalMessage}
                    onChange={(e) => setAutoFormData({ ...autoFormData, personalMessage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-[#D4C5B9] text-white rounded-lg hover:bg-[#8B7355] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Creando...' : 'Crear Regla Automática'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAutoForm(false)}
                    className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Auto Rules List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Umbral Gasto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Descuento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Compra Mín.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Validez</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {autoRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No hay reglas de cupón automático. ¡Crea la primera para fidelizar a tus clientes!
                      </td>
                    </tr>
                  ) : (
                    autoRules.map((rule) => (
                      <tr key={rule.id} className={!rule.is_active ? 'bg-gray-50 opacity-60' : ''}>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-[#8B7355]">€{rule.spend_threshold.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-[#FAF8F5] text-[#8B7355]">
                            {rule.discount_type === 'percentage' ? `${rule.discount_value}%` : `€${rule.discount_value.toFixed(2)}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {rule.min_purchase > 0 ? `€${rule.min_purchase}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {rule.valid_days} días
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleAutoRule(rule.id, rule.is_active)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              rule.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {rule.is_active ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => deleteAutoRule(rule.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Resend Email Dialog */}
      {resendDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Enviar Código por Email
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Código: <span className="font-mono font-semibold text-[#8B7355]">{resendDialog.code?.code}</span>
              {' — '}
              {resendDialog.code?.discount_type === 'percentage'
                ? `${resendDialog.code?.discount_value}%`
                : `€${resendDialog.code?.discount_value.toFixed(2)}`}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del Destinatario *
                </label>
                <input
                  type="email"
                  value={resendDialog.email}
                  onChange={(e) => setResendDialog({ ...resendDialog, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                  placeholder="cliente@ejemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={resendDialog.customerName}
                  onChange={(e) => setResendDialog({ ...resendDialog, customerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                  placeholder="María García"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje Personalizado
                </label>
                <textarea
                  value={resendDialog.personalMessage}
                  onChange={(e) => setResendDialog({ ...resendDialog, personalMessage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4C5B9]"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleResendEmail}
                disabled={!resendDialog.email || resendingId !== null}
                className="flex-1 py-2 bg-[#D4C5B9] text-white rounded-lg hover:bg-[#8B7355] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resendingId ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Enviando...
                  </>
                ) : (
                  'Enviar Email'
                )}
              </button>
              <button
                onClick={() => setResendDialog({ open: false, code: null, email: '', customerName: '', personalMessage: '' })}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
