'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import bundledProducts from '@/data/products.json';
import { fetchCatalogSnapshot, fetchCatalogVersion } from '@/lib/catalog';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import type { CatalogSnapshot, CatalogSource, Product } from '@/lib/types';

const CACHE_KEY = 'csa-catalog-snapshot-v1';

type SyncStatus = 'bundled' | 'checking' | 'syncing' | 'ready' | 'offline' | 'error';

type CatalogContextValue = {
  products: Product[];
  brands: string[];
  categories: string[];
  version: number;
  updatedAt: string | null;
  source: CatalogSource;
  status: SyncStatus;
  configured: boolean;
  refresh: () => Promise<void>;
};

const fallbackSnapshot: CatalogSnapshot = {
  version: 0,
  updatedAt: null,
  products: bundledProducts as Product[],
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

function readCachedSnapshot(): CatalogSnapshot | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as CatalogSnapshot | null;
    if (!parsed || !Array.isArray(parsed.products) || typeof parsed.version !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<CatalogSnapshot>(fallbackSnapshot);
  const [source, setSource] = useState<CatalogSource>('bundled');
  const [status, setStatus] = useState<SyncStatus>('bundled');
  const snapshotRef = useRef(snapshot);
  const sourceRef = useRef<CatalogSource>(source);
  const syncingRef = useRef(false);
  const client = createBrowserSupabaseClient();
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );

  const applySnapshot = useCallback((next: CatalogSnapshot, nextSource: CatalogSource) => {
    snapshotRef.current = next;
    sourceRef.current = nextSource;
    setSnapshot(next);
    setSource(nextSource);
  }, []);

  const sync = useCallback(async (force = false) => {
    if (!client || syncingRef.current) return;
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    syncingRef.current = true;
    setStatus(force ? 'syncing' : 'checking');
    try {
      const remoteVersion = await fetchCatalogVersion(client);
      const current = snapshotRef.current;
      if (!force && sourceRef.current !== 'bundled' && current.version === remoteVersion.version) {
        if (current.updatedAt !== remoteVersion.updatedAt) {
          applySnapshot({ ...current, updatedAt: remoteVersion.updatedAt }, sourceRef.current);
        }
        setStatus('ready');
        return;
      }

      setStatus('syncing');
      const remoteSnapshot = await fetchCatalogSnapshot(client, remoteVersion);
      localStorage.setItem(CACHE_KEY, JSON.stringify(remoteSnapshot));
      applySnapshot(remoteSnapshot, 'supabase');
      setStatus('ready');
    } catch (error) {
      console.error('gagal menyinkronkan katalog', error);
      setStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      syncingRef.current = false;
    }
  }, [applySnapshot, client]);

  useEffect(() => {
    const cached = readCachedSnapshot();
    if (cached) {
      applySnapshot(cached, 'cache');
      setStatus(navigator.onLine ? 'checking' : 'offline');
    }
    void sync();

    const handleOnline = () => void sync();
    const handleOffline = () => setStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [applySnapshot, sync]);

  const brands = useMemo(() => Array.from(new Set(
    snapshot.products.map((product) => product.brand).filter(Boolean) as string[],
  )).sort((a, b) => a.localeCompare(b, 'id')), [snapshot.products]);

  const categories = useMemo(() => Array.from(new Set(
    snapshot.products.map((product) => product.category).filter(Boolean) as string[],
  )).sort((a, b) => a.localeCompare(b, 'id')), [snapshot.products]);

  const value = useMemo<CatalogContextValue>(() => ({
    products: snapshot.products,
    brands,
    categories,
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
    source,
    status,
    configured,
    refresh: () => sync(true),
  }), [brands, categories, configured, snapshot, source, status, sync]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog harus digunakan di dalam CatalogProvider');
  return context;
}
