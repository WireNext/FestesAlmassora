const CACHE_NAME = 'almassora-2026-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/icon-512.png',
  '/programa.html',
  '/bus.html',
  '/privacitat.html',
  '/script.js',
  '/style.css',
  '/avisos.json',
  '/programacion.json',
  '/script_bus.js'
  // Añade aquí tus archivos CSS o JS principales
];

// Instalación: Guardar archivos básicos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Estrategia: Cache First, falling back to Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});