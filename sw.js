const CACHE_NAME = 'salat-tracker-v9';

// Core files needed to open the app offline
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  './Adhan.mp3'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // FAULT TOLERANT CACHING: It loads files one by one. 
      // If Adhan.mp3 is missing, it won't crash the whole app anymore!
      for (let asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn('Could not cache:', asset, error);
        }
      }
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // Delete all old cache versions except our actual saved prayer times
        if (key !== CACHE_NAME && !key.startsWith('salah_db')) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;

  // Never cache live API requests in the service worker
  if (e.request.url.includes('api.aladhan.com') || e.request.url.includes('bigdatacloud')) {
     return;
  }

  // Smart Network-First, Cache-Fallback
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Return instantly from offline vault
      }
      return fetch(e.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // App is offline and file is not cached. Fail silently.
      });
    })
  );
});


