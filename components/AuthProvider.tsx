'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase';

type AuthStatus = 'loading' | 'guest' | 'admin';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  username: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const usernameFromEmail = (email?: string | null) => email?.split('@')[0] ?? null;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const client = createBrowserSupabaseClient();

  const applyUser = useCallback(async (nextUser: User | null) => {
    if (!client || !nextUser) {
      setUser(null);
      setStatus('guest');
      return false;
    }

    const { data, error } = await client
      .from('profiles')
      .select('role')
      .eq('user_id', nextUser.id)
      .maybeSingle();

    if (error || data?.role !== 'admin') {
      await client.auth.signOut();
      setUser(null);
      setStatus('guest');
      return false;
    }

    setUser(nextUser);
    setStatus('admin');
    return true;
  }, [client]);

  useEffect(() => {
    if (!client) {
      setStatus('guest');
      return;
    }

    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (active) void applyUser(data.session?.user ?? null);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (active) void applyUser(session?.user ?? null);
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [applyUser, client]);

  const signIn = useCallback(async (rawUsername: string, password: string) => {
    if (!client) throw new Error('supabase belum terhubung');
    const username = rawUsername.trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,40}$/.test(username)) throw new Error('username tidak valid');

    setStatus('loading');
    const { data, error } = await client.auth.signInWithPassword({
      email: `${username}@admin.csa.local`,
      password,
    });
    if (error || !data.user) {
      setStatus('guest');
      throw new Error('username atau password salah');
    }

    const isAdmin = await applyUser(data.user);
    if (!isAdmin) throw new Error('akun ini tidak memiliki akses admin');
  }, [applyUser, client]);

  const signOut = useCallback(async () => {
    if (client) await client.auth.signOut();
    setUser(null);
    setStatus('guest');
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    username: usernameFromEmail(user?.email),
    signIn,
    signOut,
  }), [signIn, signOut, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAdminAuth harus digunakan di dalam AuthProvider');
  return context;
}
