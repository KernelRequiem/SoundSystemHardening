import { defineMiddleware } from 'astro:middleware';

// ─── Origine canonique du site ────────────────────────────────────────────────
const ORIGIN = 'https://soundsystemhardening.fr';

// ─── Content Security Policy ──────────────────────────────────────────────────
// TODO : retirer https://unpkg.com et https://cdnjs.cloudflare.com une fois
//        Leaflet, jsPDF et jszip bundlés localement (npm + build).
//        Retirer https://*.basemaps.cartocdn.com si les tuiles passent sur OSM.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
  "font-src 'self'",
  "connect-src 'self' https://overpass-api.de https://overpass.kumi.systems",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

// ─── Rate limiting applicatif (defense en profondeur) ─────────────────────────
// Le rate limiting principal doit vivre au reverse proxy (Traefik), mais tant
// qu'il n'est pas en place ce garde-fou en memoire limite l'abus des endpoints
// POST (/api/contact, /api/signalement, /api/report) : relais de spam SMTP,
// inondation de la base Airtable, deni de service applicatif.
// Portee : par instance de conteneur. Fenetre glissante simple.
const RL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RL_MAX = 8;                    // 8 POST /api par IP et par fenetre
const rlBuckets = new Map<string, number[]>();

function clientIp(context: { clientAddress?: string }, request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return context.clientAddress || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rlBuckets.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  hits.push(now);
  rlBuckets.set(ip, hits);
  // Purge opportuniste pour borner la memoire.
  if (rlBuckets.size > 5000) {
    for (const [k, v] of rlBuckets) {
      if (v.every((t) => now - t >= RL_WINDOW_MS)) rlBuckets.delete(k);
    }
  }
  return hits.length > RL_MAX;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // ── Mode maintenance ────────────────────────────────────────────────────────
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  // Flux publics en lecture seule : syndication ouverte (CORS *) et accessibles
  // meme en maintenance, pour ne pas casser les bots/sites allies qui les consomment.
  const isPublicFeed =
    pathname === '/api/news.json';

  const isAllowed =
    pathname === '/maintenance' ||
    isPublicFeed ||
    pathname.startsWith('/_astro') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/);

  if (isMaintenance && !isAllowed) {
    return Response.redirect(new URL('/maintenance', context.url), 302);
  }

  // ── OPTIONS preflight CORS pour /api/* ──────────────────────────────────────
  if (context.request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin':  ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age':       '86400',
      },
    });
  }

  // ── Durcissement des POST /api/* (CSRF + abus) ──────────────────────────────
  // Le CORS n'est applique que par le navigateur : il n'empeche ni un POST
  // cross-site en formulaire simple, ni un appel direct (curl, bot). On verifie
  // donc l'Origin cote serveur (anti-CSRF) et on applique le rate limit.
  if (context.request.method === 'POST' && pathname.startsWith('/api/')) {
    const origin = context.request.headers.get('origin');
    if (origin !== ORIGIN) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Origine non autorisée.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isRateLimited(clientIp(context, context.request))) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Trop de requêtes. Réessayez plus tard.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '600',
            'Access-Control-Allow-Origin': ORIGIN,
          },
        }
      );
    }
  }

  // ── Réponse normale ─────────────────────────────────────────────────────────
  const response = await next();

  // Security headers — appliqués sur toutes les réponses
  response.headers.set('Content-Security-Policy',   CSP);
  response.headers.set('X-Frame-Options',            'DENY');
  response.headers.set('X-Content-Type-Options',     'nosniff');
  response.headers.set('Referrer-Policy',            'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy',         'geolocation=(), microphone=(), camera=()');

  // HSTS uniquement en production (évite de polluer le cache navigateur en dev local)
  if (import.meta.env.PROD) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Flux public de syndication : CORS ouvert en lecture seule.
  if (isPublicFeed) {
    response.headers.set('Access-Control-Allow-Origin',  '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Vary', 'Origin');
    return response;
  }

  // CORS restreint aux routes API
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin',  ORIGIN);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Vary', 'Origin');
  }

  return response;
});
