import React, { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '../../lib/supabase';

interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cargar usuario al montar
  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    }
    loadUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  if (loading || !user) {
    return null;
  }

  const userEmail = user.email;
  const userName = user.user_metadata?.full_name || userEmail?.split('@')[0] || 'Usuario';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-arena-pale transition-colors group"
        aria-label="Menú de usuario"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-arena flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-xs text-gray-500">Hola,</span>
          <span className="text-sm font-medium text-gray-800 group-hover:text-arena transition-colors">
            {userName.split(' ')[0]}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden animate-fadeIn">
          {/* Header del menú */}
          <div className="px-4 py-4 bg-gradient-to-r from-arena to-arena-light">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{userName}</p>
                <p className="text-white/80 text-xs truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Opciones principales */}
          <div className="py-2">
            <a
              href="/cuenta"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-arena-pale transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Mi Perfil</span>
            </a>
            <a
              href="/mis-pedidos"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-arena-pale transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-sm font-medium">Mis Pedidos</span>
            </a>
            <a
              href="/devoluciones"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-arena-pale transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
              <span className="text-sm font-medium">Devoluciones</span>
            </a>
            <a
              href="/rastreo"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-arena-pale transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Rastrear Pedido</span>
            </a>
          </div>

          {/* Separador y logout */}
          <div className="border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
