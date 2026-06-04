const CACHE_NAME = 'ssh-v1';

// Ressources à mettre en cache immédiatement à l'installation
const PRECACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-192.png',
  '/favicon-512.png',
  '/SoundSystemHardening-logo.png',
  '/wiki/Urgence-imm%C3%A9diate',
  '/wiki/Strategie-contre-ripost',
  '/wiki/S%C3%A9curite-Numerique',
  '/wiki/Modus-Operandi',
];

// Installation : précache les ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activation : supprime les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : Network First avec fallback cache
self.addEventListener('fetch', (event) => {
  // Ignore les requêtes non-GET et les ressources externes
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mise en cache de la réponse fraîche
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Fallback : sert depuis le cache si hors-ligne
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Page offline de secours si rien en cache
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
