const CACHE_NAME = 'business-manager-pwa-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192.png',
  '/pwa-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Continue install even if optional assets fail
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Ignore chrome-extension or external analytics
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin.includes('firestore.googleapis.com') || url.origin.includes('identitytoolkit.googleapis.com')) {
    // Let Firestore JS SDK handle its own offline persistence via IndexedDB
    return;
  }

  const isNavigation =
    event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // Network-first for the HTML shell: every deploy changes the hashed
    // asset filenames it references, so a stale cached HTML page can point
    // at JS/CSS files that no longer exist. Always prefer a fresh copy when
    // online; only fall back to whatever was last cached when truly offline.
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
              cache.put('/index.html', responseToCache.clone ? responseToCache.clone() : responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html') || caches.match('/')))
    );
    return;
  }

  // Hashed build assets (JS/CSS with content hashes in the filename) are
  // safe to serve cache-first and refresh in the background: a changed
  // file gets a new filename, so a stale cache entry never masks new code.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
