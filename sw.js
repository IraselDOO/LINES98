const CACHE_NAME = 'lines98-v2';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/game.css',
  './css/animations.css',
  './js/main.js',
  './manifest.json',
  './assets/icons/icon-512.svg'
  // Add other JS modules here as they are created
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
