/**
 * securityLog.ts — Journal de sécurité en mémoire (defense-in-depth observable)
 *
 * Ring buffer borné + compteurs agrégés. Vit dans le process Node (SSR standalone).
 * Portée : par instance de conteneur. Volatile (perdu au redémarrage) — c'est
 * intentionnel : pas de PII persistée sur disque, pas de surface RGPD, pas de
 * fichier à exfiltrer. Pour de la rétention longue, brancher un sink externe
 * (Loki / syslog) en plus, jamais à la place.
 *
 * Les IP sont tronquées avant stockage (anonymisation : /24 IPv4, /48 IPv6)
 * pour observer un schéma d'abus sans constituer un fichier d'adresses complètes.
 */

// ── Types ─────────────────────────────────────────────────────────────
export type SecurityEventType =
  | 'login_success'    // authentification réussie sur /hardeningcore
  | 'login_failure'    // identifiants rejetés
  | 'logout'           // déconnexion explicite
  | 'csrf_reject'      // POST /api rejeté (Origin non autorisée)
  | 'rate_limit'       // 429 — seuil de requêtes dépassé
  | 'terrain_denied'   // accès /hardeningcore/* sans token valide → redirigé login
  | 'bad_request';     // URI malformée, payload invalide

export interface SecurityEvent {
  ts:    number;            // epoch ms
  type:  SecurityEventType;
  ip:    string;            // IP anonymisée (préfixe réseau)
  path?: string;            // route concernée
  meta?: string;            // détail libre, jamais de secret ni de mot de passe
}

// ── Configuration du buffer ───────────────────────────────────────────
const MAX_EVENTS = 500;     // borne mémoire dure du ring buffer

// État global du module (singleton par process)
const events: SecurityEvent[] = [];
const counters: Record<SecurityEventType, number> = {
  login_success:  0,
  login_failure:  0,
  logout:         0,
  csrf_reject:    0,
  rate_limit:     0,
  terrain_denied: 0,
  bad_request:    0,
};
const bootTs = Date.now();

// ── Anonymisation IP ──────────────────────────────────────────────────
/**
 * Tronque une IP à son préfixe réseau pour ne jamais stocker d'adresse complète.
 * IPv4 → /24 (x.x.x.0) · IPv6 → /48 (3 premiers groupes).
 * Une IP identifiante complète en clair dans un log mémoire serait une donnée
 * personnelle exploitable ; le préfixe suffit à repérer un schéma d'abus.
 */
export function anonymizeIp(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    return 'unknown';
  }
  if (ip.includes(':')) {
    const groups = ip.split(':').filter(Boolean);
    return `${groups.slice(0, 3).join(':')}::/48`;
  }
  return 'unknown';
}

// ── API d'enregistrement ──────────────────────────────────────────────
/**
 * Enregistre un événement de sécurité. Ne jette jamais : la journalisation
 * ne doit jamais casser le flux de la requête qu'elle observe.
 */
export function logSecurityEvent(
  type: SecurityEventType,
  rawIp: string,
  path?: string,
  meta?: string,
): void {
  try {
    const evt: SecurityEvent = {
      ts:   Date.now(),
      type,
      ip:   anonymizeIp(rawIp),
      path: path ? path.slice(0, 120) : undefined,
      meta: meta ? meta.slice(0, 200) : undefined,
    };
    events.push(evt);
    if (events.length > MAX_EVENTS) events.shift(); // ring buffer FIFO
    counters[type] = (counters[type] ?? 0) + 1;
  } catch {
    // silencieux par design
  }
}

// ── API de lecture (réservée à la vue admin) ─────────────────────────
export interface SecuritySnapshot {
  bootTs:     number;
  uptimeMs:   number;
  total:      number;
  counters:   Record<SecurityEventType, number>;
  recent:     SecurityEvent[];      // plus récents en premier
}

/** Retourne un instantané du journal. `limit` borne le nombre d'événements récents. */
export function getSecuritySnapshot(limit = 80): SecuritySnapshot {
  const now = Date.now();
  return {
    bootTs,
    uptimeMs: now - bootTs,
    total:    events.length,
    counters: { ...counters },
    recent:   events.slice(-limit).reverse(),
  };
}

/** Compte les événements d'un type donné survenus dans la dernière fenêtre (ms). */
export function countRecent(type: SecurityEventType, windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  return events.filter((e) => e.type === type && e.ts >= cutoff).length;
}
