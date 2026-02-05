const CACHE_NAME = 'lines98-v1.7';
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
  self.skipWaiting(); // Force update
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
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
