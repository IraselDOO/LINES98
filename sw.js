const CACHE_NAME = 'lines98-v1.8.1';
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

  // Always try network first for document navigations to avoid stale UI on mobile.
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', responseClone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For same-origin static files use cache-first with network fallback.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(event.request)
        .then((cached) => cached || fetch(event.request))
    );
  }
});
