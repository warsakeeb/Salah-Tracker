const CACHE_NAME = 'war-sakeeb-hub-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Adhan.mp3',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Inter:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Fault Tolerant Shell Loading
      for (let asset of CORE_ASSETS) {
        try { await cache.add(asset); } catch (err) { }
      }
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // DO NOT DELETE the 8MB Quran Vault or the Prayer Time database!
        if (key !== CACHE_NAME && key !== 'quran-master-vault-v1' && !key.startsWith('salah_db')) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;

  // Let React handle all API requests and massive DB downloads securely.
  if (e.request.url.includes('api.aladhan.com') || 
      e.request.url.includes('bigdatacloud') || 
      e.request.url.includes('api.alquran.cloud')) {
     return;
  }

  // Network First, Cache Fallback for the Shell
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


