import { defineMiddleware } from 'astro:middleware';
import { verifyToken, ADMIN_COOKIE } from './lib/adminAuth';

// ─── Origine canonique du site ────────────────────────────────────────────────
const ORIGIN = 'https://soundsystemhardening.fr';

// ─── Routes opérationnelles internes (obfusquées) ─────────────────────────────
// Ne pas modifier sans mettre à jour les pages correspondantes.
// Ne JAMAIS lier ces routes depuis une page publique.
const TERRAIN_PREFIX    = '/terrain';
const TERRAIN_AUTH_PATH = '/terrain/auth';
const TERRAIN_AUTH_API  = '/api/terrain-auth';
const TERRAIN_LOGOUT    = '/api/terrain-logout';

// ─── Content Security Policy ──────────────────────────────────────────────────
// NOTE sécurité : 'unsafe-inline' dans script-src est un vecteur XSS résiduel.
// À remplacer par des nonces Astro lors de la migration vers Astro 6+.
// Voir : https://docs.astro.build/en/reference/configuration-reference/

// CSP élargie pour /terrain/* — SpotCheck a besoin de polices Google + tuiles satellite
const CSP_TERRAIN = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com",
  // SpotCheck charge Inter + JetBrains Mono depuis fonts.googleapis.com
  "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
  // Polices woff2 depuis fonts.gstatic.com
  "font-src 'self' https://fonts.gstatic.com",
  // Tuiles CartoDB (dark) + OSM + ArcGIS (satellite) + SpotCheck markers data:
  "img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://*.tile.opentopomap.org",
  // Overpass API pour l'analyse OSM depuis SpotCheck
  "connect-src 'self' https://overpass-api.de https://overpass.kumi.systems https://api.open-elevation.com",
  "worker-src 'self'",
  // Terrain : frame-ancestors 'none' conservé
  "frame-ancestors 'none'",
].join('; ');

// CSP du site public
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
  "font-src 'self'",
  // api.open-elevation.com : profils topographiques de l'outil SoundCheck
  "connect-src 'self' https://overpass-api.de https://overpass.kumi.systems https://api.open-elevation.com",
  // Web Worker local (acousticWorker.js de SoundCheck)
  "worker-src 'self'",
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
  // Priorité à context.clientAddress (IP réelle injectée par le runtime Astro/Node
  // depuis la connexion TCP — non falsifiable par le client).
  // X-Forwarded-For n'est lu qu'en l'absence de clientAddress car ce header
  // peut être forgé par n'importe quel client HTTP (bypass de rate limit).
  if (context.clientAddress) return context.clientAddress;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
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
  // ── Normalisation du pathname (anti-bypass URL encoding) ───────────────────────
  // CVE GHSA-ggxq-hp9w-j794 / GHSA-whqg-ppgf-wp8c : Astro 4.x peut passer un
  // pathname non-décodé au middleware. Un attaquant envoie /%74errain/spotcheck
  // (ou /%2Fterrain) pour contourner les vérifications startsWith('/terrain').
  // On normalise ici pour que toutes les comparaisons portent sur le chemin réel.
  let pathname: string;
  try {
    pathname = decodeURIComponent(context.url.pathname);
  } catch {
    // URI malformée (ex. %80) → refus 400
    return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
  }
  const isTerrainRoute = pathname.startsWith(TERRAIN_PREFIX);

  // ── Protection zone opérationnelle /terrain/* ───────────────────────────────
  // Toutes les routes /terrain/* nécessitent un token de session valide,
  // sauf /terrain/auth (page de login) et les endpoints d'authentification.
  if (isTerrainRoute) {
    const isAuthPage    = pathname === TERRAIN_AUTH_PATH || pathname === TERRAIN_AUTH_PATH + '/';
    const isAuthApi     = pathname === TERRAIN_AUTH_API;
    const isLogoutApi   = pathname === TERRAIN_LOGOUT;

    // Ces routes sont accessibles sans token (sinon boucle infinie)
    if (!isAuthPage && !isAuthApi && !isLogoutApi) {
      const secret = process.env.ADMIN_SECRET;
      const rawCookie = context.request.headers.get('cookie') || '';
      const tokenMatch = rawCookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
      const token = tokenMatch?.[1];

      let isAuthed = false;
      if (token && secret) {
        const result = verifyToken(token, secret);
        isAuthed = result.valid;
      }

      if (!isAuthed) {
        // Pas de token ou token invalide → redirection vers la page de login
        // On encode la destination pour revenir après auth
        const dest = encodeURIComponent(pathname);
        return Response.redirect(
          new URL(`${TERRAIN_AUTH_PATH}?r=${dest}`, context.url),
          302
        );
      }
    }

    // Traitement de la requête terrain, puis headers sécurité spécifiques
    const response = await next();

    // CSP élargie pour /terrain (Google Fonts, ArcGIS satellite, etc.)
    response.headers.set('Content-Security-Policy', CSP_TERRAIN);
    response.headers.set('X-Frame-Options',         'DENY');
    response.headers.set('X-Content-Type-Options',  'nosniff');
    response.headers.set('Referrer-Policy',         'no-referrer');  // Plus strict sur zone interne
    response.headers.set('X-Robots-Tag',            'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control',           'no-store, no-cache, must-revalidate');
    if (import.meta.env.PROD) {
      response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    return response;
  }

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
  //
  // Exemption : /api/terrain-auth et /api/terrain-logout ont leur propre
  // sécurité (PBKDF2 + HMAC token). Le check CSRF sur ces endpoints bloquerait
  // le login en développement local (origin = http://localhost:4321 ≠ ORIGIN).
  const isTerrainAuthEndpoint = pathname === TERRAIN_AUTH_API || pathname === TERRAIN_LOGOUT;

  if (context.request.method === 'POST' && pathname.startsWith('/api/') && !isTerrainAuthEndpoint) {
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
