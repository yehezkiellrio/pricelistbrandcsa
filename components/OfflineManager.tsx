'use client';

import { useEffect, useState } from 'react';
import { useCatalog } from '@/components/CatalogProvider';

type State = 'idle' | 'downloading' | 'ready' | 'error';

export default function OfflineManager() {
  const { products, version } = useCatalog();
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    if (localStorage.getItem('csa-offline-version-v4') === String(version)) setState('ready');
    else setState('idle');

    const updateConnection = () => setOnline(navigator.onLine);
    const receiveMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OFFLINE_PROGRESS') setProgress(event.data.progress ?? 0);
      if (event.data?.type === 'OFFLINE_READY') {
        localStorage.setItem('csa-offline-version-v4', String(event.data.version ?? version));
        localStorage.setItem('csa-offline-updated', new Date().toISOString());
        setProgress(100);
        setState('ready');
      }
      if (event.data?.type === 'OFFLINE_ERROR') setState('error');
    };

    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    navigator.serviceWorker?.addEventListener('message', receiveMessage);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      navigator.serviceWorker?.removeEventListener('message', receiveMessage);
    };
  }, [version]);

  const download = async () => {
    if (!online || !('serviceWorker' in navigator)) {
      setState('error');
      return;
    }
    setState('downloading');
    setProgress(0);
    try {
      const registration = await navigator.serviceWorker.ready;
      const routes = ['/', '/master-harga', '/kalkulator', ...products.map((product) => `/master-harga/${product.id}`)];
      const assets = products.flatMap((product) => product.image_paths ?? []);
      registration.active?.postMessage({ type: 'DOWNLOAD_OFFLINE', routes, assets, version });
    } catch {
      setState('error');
    }
  };

  const label = !online ? 'Sedang offline' : state === 'downloading' ? `Mengunduh ${progress}%` : state === 'ready' ? 'Perbarui offline' : state === 'error' ? 'Coba lagi' : 'Aktifkan offline';

  return <button className={`button offline-button ${state}`} type="button" onClick={download} disabled={state === 'downloading'} aria-live="polite"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14"/></svg><span>{label}</span>{state === 'downloading' && <i style={{ width: `${progress}%` }}/>}</button>;
}
