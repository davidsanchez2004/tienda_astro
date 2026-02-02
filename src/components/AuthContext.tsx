import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';

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
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const logout = async () => {
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
