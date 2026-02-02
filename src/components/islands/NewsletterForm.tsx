import React, { useState } from 'react';

interface NewsletterFormProps {
  source?: string;
  className?: string;
  buttonText?: string;
  placeholder?: string;
}

export default function NewsletterForm({ 
  source = 'website',
  className = '',
  buttonText = 'Suscribirse',
  placeholder = 'tu@email.com'
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Por favor, introduce un email válido' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al suscribirse' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold-soft transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enviando...
            </span>
          ) : buttonText}
        </button>
      </form>
      
      {message && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-100' 
            : 'bg-red-500/20 text-red-100'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
