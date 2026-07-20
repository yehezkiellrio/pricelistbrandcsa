const CACHE_NAME = 'csa-master-pricelist-v1';
const CORE_ROUTES = ['/', '/master-harga', '/kalkulator', '/manifest.webmanifest', '/csa-logo.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ROUTES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

const sameOriginAssets = (html, baseUrl) => {
  const urls = new Set();
  const matches = html.matchAll(/(?:src|href)=["']([^"']+)["']/g);
  for (const match of matches) {
    try {
      const url = new URL(match[1], baseUrl);
      if (url.origin === self.location.origin) urls.add(url.pathname + url.search);
    } catch {}
  }
  return [...urls];
};

const cacheOne = async (cache, path) => {
  const request = new Request(path, { credentials: 'same-origin', cache: 'reload' });
  const response = await fetch(request);
  if (!response.ok) throw new Error(`Gagal mengunduh ${path}`);
  await cache.put(path, response.clone());
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await response.text();
    const assets = sameOriginAssets(html, new URL(path, self.location.origin));
    await Promise.all(assets.map(async (asset) => {
      try {
        const assetResponse = await fetch(asset, { credentials: 'same-origin' });
        if (assetResponse.ok) await cache.put(asset, assetResponse);
      } catch {}
    }));
  }
};

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'DOWNLOAD_OFFLINE') return;
  const routes = [...new Set([...CORE_ROUTES, ...(event.data.routes || [])])];
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const batchSize = 6;
      let completed = 0;
      for (let index = 0; index < routes.length; index += batchSize) {
        const batch = routes.slice(index, index + batchSize);
        await Promise.all(batch.map((route) => cacheOne(cache, route)));
        completed += batch.length;
        event.source?.postMessage({ type: 'OFFLINE_PROGRESS', progress: Math.round((completed / routes.length) * 100) });
      }
      event.source?.postMessage({ type: 'OFFLINE_READY' });
    } catch (error) {
      event.source?.postMessage({ type: 'OFFLINE_ERROR', message: error instanceof Error ? error.message : 'Gagal mengaktifkan mode offline' });
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) (await caches.open(CACHE_NAME)).put(url.pathname, response.clone());
      return response;
    }).catch(async () => (await caches.match(url.pathname)) || (await caches.match('/'))));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.json')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then(async (response) => {
      if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
      return response;
    })));
  }
});
