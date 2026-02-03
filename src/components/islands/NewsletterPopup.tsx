import React, { useState, useEffect } from 'react';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar si ya se mostró el popup o si ya está suscrito
    const hasSeenPopup = localStorage.getItem('by_arena_newsletter_popup');
    const isSubscribed = localStorage.getItem('by_arena_newsletter_subscribed');
    
    if (!hasSeenPopup && !isSubscribed) {
      // Mostrar popup después de 3 segundos
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Marcar que ya vio el popup (expira en 7 días)
    localStorage.setItem('by_arena_newsletter_popup', Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, introduce un email válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          source: 'popup',
          discountCode: 'BIENVENIDO10' // Código fijo para nuevos suscriptores
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        localStorage.setItem('by_arena_newsletter_subscribed', 'true');
        // Cerrar después de 5 segundos
        setTimeout(() => {
          setIsOpen(false);
        }, 5000);
      } else {
        setError(data.error || 'Error al suscribirse');
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Imagen header */}
        <div className="h-40 bg-gradient-to-br from-arena to-arena-light flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-6xl font-serif font-bold">10%</p>
            <p className="text-lg font-medium">DE DESCUENTO</p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Bienvenida a BY ARENA!</h3>
              <p className="text-gray-600 mb-4">
                Revisa tu email para confirmar tu suscripción y recibir tu código de descuento.
              </p>
              <div className="bg-arena-pale rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Tu código de descuento:</p>
                <p className="text-2xl font-bold text-arena font-mono">BIENVENIDO10</p>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2 text-center">
                ¡Únete a nuestra familia!
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Suscríbete a nuestra newsletter y obtén un <strong>10% de descuento</strong> en tu primera compra.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arena focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-arena text-white font-semibold rounded-lg hover:bg-arena-light transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Obtener mi 10% de descuento'}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                Al suscribirte, aceptas recibir emails de BY ARENA. Puedes darte de baja en cualquier momento.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
