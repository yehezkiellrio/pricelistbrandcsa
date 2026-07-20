'use client';

import { useEffect, useState } from 'react';

type State = 'idle' | 'downloading' | 'ready' | 'error';

export default function OfflineManager({ routes }: { routes: string[] }) {
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    if (localStorage.getItem('csa-offline-ready') === 'true') setState('ready');

    const updateConnection = () => setOnline(navigator.onLine);
    const receiveMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OFFLINE_PROGRESS') setProgress(event.data.progress ?? 0);
      if (event.data?.type === 'OFFLINE_READY') {
        localStorage.setItem('csa-offline-ready', 'true');
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
  }, []);

  const download = async () => {
    if (!online || !('serviceWorker' in navigator)) {
      setState('error');
      return;
    }
    setState('downloading');
    setProgress(0);
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'DOWNLOAD_OFFLINE', routes });
    } catch {
      setState('error');
    }
  };

  const label = !online ? 'Sedang offline' : state === 'downloading' ? `Mengunduh ${progress}%` : state === 'ready' ? 'Perbarui offline' : state === 'error' ? 'Coba lagi' : 'Aktifkan offline';

  return <button className={`button offline-button ${state}`} type="button" onClick={download} disabled={state === 'downloading'} aria-live="polite"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14"/></svg><span>{label}</span>{state === 'downloading' && <i style={{ width: `${progress}%` }}/>}</button>;
}
