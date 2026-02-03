import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';
import { onUserLogin, onUserLogout } from '../stores/useCart';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session on mount
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      // Sincronizar carrito con la sesión inicial
      if (currentUser?.id) {
        onUserLogin(currentUser.id);
      }
      // Si no hay usuario, no hacemos nada (ya está en modo guest)
      
      setLoading(false);
    });

    // Listen for auth changes (login/logout)
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      console.log('[Auth] State change:', event, currentUser?.id);
      
      // Manejar el carrito según el evento
      if (event === 'SIGNED_IN' && currentUser?.id) {
        onUserLogin(currentUser.id);
      } else if (event === 'SIGNED_OUT') {
        onUserLogout();
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const logout = async () => {
    // Primero limpiar el carrito del usuario
    onUserLogout();
    // Luego cerrar sesión en Supabase
    await supabaseClient.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth called outside AuthProvider, returning empty auth');
    return {
      user: null,
      loading: false,
      logout: async () => {},
    } as AuthContextType;
  }
  return context;
}
