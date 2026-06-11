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
