const CACHE_NAME = 'salat-titanium-vault-v11';

// Core files needed to open the app offline
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Adhan.mp3',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Safe loop: Downloads files one by one. If one fails, it doesn't break the whole app!
      for (let asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn('Could not cache asset:', asset, error);
        }
      }
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;

  // Do not cache live API requests here. The React App handles that.
  if (e.request.url.includes('api.aladhan.com') || e.request.url.includes('bigdatacloud')) {
     return;
  }

  // Network First, Cache Fallback strategy
  e.respondWith(
    fetch(e.request).then((networkResponse) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(e.request, networkResponse.clone());
        return networkResponse;
      });
    }).catch(() => {
      return caches.match(e.request);
    })
  );
});


