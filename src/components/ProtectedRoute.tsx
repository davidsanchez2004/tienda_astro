import React, { ReactNode, useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase-client';

interface User {
  id: string;
  email?: string;
}

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    }
    init();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">
          <svg className="w-12 h-12 text-arena" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      fallback || (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Necesitas iniciar sesión para acceder a esta página</p>
          <a href="/login" className="inline-block px-6 py-3 bg-arena text-white rounded-lg hover:bg-arena-light transition-colors font-medium">
            Ir a Iniciar Sesión
          </a>
        </div>
      )
    );
  }

  return <>{children}</>;
}
