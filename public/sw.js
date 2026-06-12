// sw.js — Service Worker SoundSystemHardening
// Précache les pages critiques terrain (URGENCE + DÉCISION) pour usage offline.
// Stratégie : cache-first sur les routes précachées, network-first sur le reste.

const CACHE_NAME = 'ssh-v1';

// Pages précachées au install → disponibles sans réseau
const PRECACHE_ROUTES = [
  '/urgence',
  '/decision',
];

// ── Install : précache des routes critiques ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ROUTES.map((url) =>
          cache.add(new Request(url, { credentials: 'same-origin' }))
            .catch((err) => console.warn('[SW] Précache échoué pour', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate : nettoyage des anciens caches ──────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : cache-first pour routes précachées, réseau sinon ─────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes non-GET et les requêtes API
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  const isPrecached = PRECACHE_ROUTES.some(
    (route) => url.pathname === route || url.pathname === route + '/'
  );

  if (isPrecached) {
    // Cache-first : renvoie le cache si disponible, sinon réseau + mise en cache
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
  // Toutes les autres requêtes : réseau normal (pas d'interférence SW)
});
