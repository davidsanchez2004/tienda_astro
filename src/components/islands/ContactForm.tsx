import React, { useState } from 'react';
import { supabaseClient } from '../../lib/supabase';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Insert into support tickets
      const { error: dbError } = await supabaseClient
        .from('support_tickets')
        .insert([
          {
            subject,
            message: `De: ${name} (${email})\n\n${message}`,
            status: 'open',
          },
        ]);

      if (dbError) throw dbError;

      // Enviar notificación por email al admin
      try {
        await fetch('/api/email/send-branded', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'contact_notification',
            data: {
              name,
              email,
              subject,
              message
            }
          })
        });
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr);
        // No fallamos si el email no se envía
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-arena-light p-8 space-y-6">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          ¡Mensaje enviado! Nos pondremos en contacto pronto.
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          required
          disabled={loading}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
          disabled={loading}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Asunto
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="¿En qué podemos ayudarte?"
          required
          disabled={loading}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntanos más..."
          required
          disabled={loading}
          rows={6}
          className="w-full"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-arena text-white font-semibold rounded-lg hover:bg-arena-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
    </form>
  );
}
