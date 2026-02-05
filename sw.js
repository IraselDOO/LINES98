const CACHE_NAME = 'lines98-static';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/game.css',
  './css/animations.css',
  './js/main.js',
  './js/Grid.js',
  './js/Game.js',
  './js/Renderer.js',
  './js/SoundManager.js',
  './js/Utils.js',
  './manifest.json',
  './assets/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all([
        ...keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
        self.clients.claim() // Take control immediately
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigation = event.request.mode === 'navigate';
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isCriticalAsset = ['script', 'style', 'worker', 'manifest'].includes(event.request.destination);

  // Always try network first for document navigations to avoid stale UI on mobile.
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', responseClone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For critical assets prefer network first to avoid running old code/styles.
  if (isSameOrigin && isCriticalAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other same-origin static files use stale-while-revalidate:
  // return cache fast, update in background from network.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
