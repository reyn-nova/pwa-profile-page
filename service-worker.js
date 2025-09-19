const CACHE_NAME = 'pwa-profile-page-0.0.2';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/offline.html',
  '/assets/images/profile-photo.jpg',
];

async function precacheAssets() {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(PRECACHE_ASSETS);
}

async function cleanupOldCaches() {
  const keys = await caches.keys();
  return Promise.all(
    keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
  );
}

async function handleNavigationRequest(req) {
  try {
    const networkRes = await fetch(req);
    const copy = networkRes.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
    return networkRes;
  } catch {
    const match = await caches.match(req);
    return match || caches.match(OFFLINE_URL);
  }
}

async function handleAssetRequest(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const networkRes = await fetch(req);
    if (req.url.startsWith(self.location.origin)) {
      const copy = networkRes.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
    }
    return networkRes;
  } catch {
    return caches.match(OFFLINE_URL);
  }
}

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(precacheAssets());
});

self.addEventListener('activate', event => {
  event.waitUntil(cleanupOldCaches());
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(req));
  } else {
    event.respondWith(handleAssetRequest(req));
  }
});
