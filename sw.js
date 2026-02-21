const CACHE_NAME = 'app-permanent-vault-v10';

// These are the core React scripts that MUST be locked in permanently
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// 1. INSTALL PHASE: Lock the core files in immediately
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 2. ACTIVATE PHASE: Clean up any old, corrupted caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. THE MAGIC FIX: "Stale-While-Revalidate"
self.addEventListener('fetch', (e) => {
  // Only intercept normal GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      
      // Background Network Fetch
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        // If the internet is ON, fetch the newest version and update the permanent vault
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // If the internet is OFF, ignore the error silently
      });

      // INSTANT OFFLINE LOAD: 
      // If we have it in the permanent vault, return it instantly.
      // If not, wait for the network.
      return cachedResponse || fetchPromise;
    })
  );
});


