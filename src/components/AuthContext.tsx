import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';
import { handleSessionChange } from '../stores/useCart';

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
    // Check current session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      // Sincronizar carrito con el usuario actual
      handleSessionChange(currentUser?.id || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      // Sincronizar carrito cuando cambia la sesión (login/logout)
      handleSessionChange(currentUser?.id || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const logout = async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
    // Limpiar el usuario del carrito al cerrar sesión
    handleSessionChange(null);
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
    // Return a no-op auth object to prevent crashes in SSR
    console.warn('useAuth called outside AuthProvider, returning empty auth');
    return {
      user: null,
      loading: false,
      logout: async () => {},
    } as AuthContextType;
  }
  return context;
}
