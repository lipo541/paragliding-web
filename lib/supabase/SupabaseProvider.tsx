"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from './client';
import type { Session, User } from '@supabase/supabase-js';

interface SupabaseContextValue {
  client: ReturnType<typeof createClient>;
  session: Session | null;
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const primeSession = useCallback(async () => {
    setLoading(true);
    const { data } = await client.auth.getSession();
    setSession(data.session ?? null);
    setLoading(false);
  }, [client]);

  const refresh = useCallback(async () => {
    const current = await client.auth.getSession();
    if (!current.data.session) {
      // No session to refresh
      return primeSession();
    }
    try {
      const { data, error } = await client.auth.refreshSession();
      if (!error) setSession(data.session);
    } catch (e) {
      console.warn('Session refresh failed:', e);
    }
  }, [client, primeSession]);

  useEffect(() => {
    primeSession();
    const { data: { subscription } } = client.auth.onAuthStateChange((event: string, newSession: Session | null) => {
      setSession(newSession);
    });
    // Visibility/focus triggers re-check
    const onVisible = () => {
      if (document.visibilityState === 'visible') primeSession();
    };
    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', primeSession);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', primeSession);
    };
  }, [client, primeSession]);

  return (
    <SupabaseContext.Provider value={{ client, session, user: session?.user ?? null, loading, refresh }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
}
