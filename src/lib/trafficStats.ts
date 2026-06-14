/**
 * trafficStats.ts — Statistiques de trafic en mémoire (lecture admin)
 *
 * État partagé entre le middleware (qui écrit) et la vue admin (qui lit).
 * Rate limiting applicatif + comptage de trafic agrégé. Portée par instance,
 * volatile. Fenêtre glissante simple.
 */

// ── Rate limiting ─────────────────────────────────────────────────────
export const RL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const RL_MAX = 8;                     // 8 POST /api par IP et par fenêtre

const rlBuckets = new Map<string, number[]>();

// ── Compteurs de trafic agrégés ───────────────────────────────────────
interface TrafficState {
  totalRequests:   number;   // toutes requêtes vues par le middleware
  apiPosts:        number;   // POST /api/*
  terrainHits:     number;   // accès /hardeningcore/* (authentifiés ou non)
  blockedCsrf:     number;   // POST rejetés (Origin invalide)
  blockedRate:     number;   // 429 émis
  bootTs:          number;
}

const traffic: TrafficState = {
  totalRequests: 0,
  apiPosts:      0,
  terrainHits:   0,
  blockedCsrf:   0,
  blockedRate:   0,
  bootTs:        Date.now(),
};

export function bumpTraffic(kind: keyof Omit<TrafficState, 'bootTs'>): void {
  traffic[kind] += 1;
}

export function getTrafficSnapshot() {
  // Compte des IP actuellement actives dans la fenêtre de rate-limit.
  const now = Date.now();
  let activeIps = 0;
  let throttledIps = 0;
  for (const hits of rlBuckets.values()) {
    const live = hits.filter((t) => now - t < RL_WINDOW_MS);
    if (live.length > 0) activeIps++;
    if (live.length > RL_MAX) throttledIps++;
  }
  return {
    ...traffic,
    uptimeMs:     now - traffic.bootTs,
    activeIps,        // IP distinctes ayant émis un POST /api dans la fenêtre
    throttledIps,     // IP actuellement au-dessus du seuil
  };
}

/**
 * Enregistre un hit pour une IP et indique si elle dépasse le seuil.
 * Logique extraite du middleware pour partager l'état avec la vue admin.
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rlBuckets.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  hits.push(now);
  rlBuckets.set(ip, hits);
  // Purge opportuniste pour borner la mémoire.
  if (rlBuckets.size > 5000) {
    for (const [k, v] of rlBuckets) {
      if (v.every((t) => now - t >= RL_WINDOW_MS)) rlBuckets.delete(k);
    }
  }
  return hits.length > RL_MAX;
}
