import { defineMiddleware } from 'astro:middleware';
import { randomBytes } from 'crypto';
import { verifyToken, ADMIN_COOKIE } from './lib/adminAuth';
import { isRateLimited, bumpTraffic } from './lib/trafficStats';
import { logSecurityEvent } from './lib/securityLog';

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
// Le nonce par requête remplace 'unsafe-inline' sur script-src : seuls les
// <script nonce="..."> émis par nos pages s'exécutent. Un payload XSS injecté
// dans le DOM ne porte pas le nonce courant (régénéré à chaque requête) et est
// donc refusé par le navigateur — c'est la fermeture du vecteur XSS exécutable.
//
// NOTE : style-src conserve 'unsafe-inline'. Un nonce ne couvre PAS les attributs
// style="..." (nombreux dans le site), seulement les balises <style>. Le style
// inline n'exécute pas de code : risque résiduel (exfiltration CSS / défaçage),
// pas une exécution JS. Le retirer imposerait de migrer tous les style= en classes.

// SpotCheck (/terrain/spotcheck) est un HTML brut externe (87 Ko) qui s'appuie
// sur ~35 handlers d'événements inline (onclick=, onchange=, oninput=) et un gros
// <script> inline. Un nonce ne peut PAS couvrir des handlers inline : il faudrait
// 'unsafe-inline'. Comme 'nonce-...' et 'unsafe-inline' sont mutuellement exclusifs
// (dès qu'un nonce est présent, les navigateurs ignorent 'unsafe-inline'), cette
// route reçoit un script-src SANS nonce et AVEC 'unsafe-inline'.
//
// Arbitrage de sécurité assumé : on rouvre le vecteur XSS inline UNIQUEMENT sur
// cette page, qui est (1) derrière l'authentification admin, (2) un outil interne
// non public, (3) du contenu statique que nous maîtrisons (pas d'entrée utilisateur
// réfléchie dans le DOM). Le reste du site et de /terrain garde le nonce strict.
function buildCsp(nonce: string, terrain: boolean, spotcheck = false): string {
  const styleSrc = terrain
    ? "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com"
    : "style-src 'self' 'unsafe-inline' https://unpkg.com";

  const imgSrc = terrain
    ? "img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://*.tile.opentopomap.org"
    : "img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com";

  const fontSrc = terrain
    ? "font-src 'self' https://fonts.gstatic.com"
    : "font-src 'self'";

  // Exception SpotCheck : 'unsafe-inline' au lieu du nonce (cf. note ci-dessus).
  const scriptSrc = spotcheck
    ? "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com"
    : `script-src 'self' 'nonce-${nonce}' https://unpkg.com https://cdnjs.cloudflare.com`;

  const base = [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    fontSrc,
    imgSrc,
    "connect-src 'self' https://overpass-api.de https://overpass.kumi.systems https://api.open-elevation.com",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  if (!terrain) base.push("upgrade-insecure-requests");
  return base.join('; ');
}

// ─── Détermination de l'IP cliente ────────────────────────────────────────────
function clientIp(context: { clientAddress?: string }, request: Request): string {
  // Priorité à context.clientAddress (IP réelle injectée par le runtime Astro/Node
  // depuis la connexion TCP — non falsifiable par le client).
  // X-Forwarded-For n'est lu qu'en l'absence de clientAddress car ce header
  // peut être forgé par n'importe quel client HTTP (bypass de rate limit).
  try {
    if (context.clientAddress) return context.clientAddress;
  } catch {
    // clientAddress peut jeter si l'adapter ne l'expose pas — on retombe sur XFF.
  }
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export const onRequest = defineMiddleware(async (context, next) => {
  bumpTraffic('totalRequests');

  // ── Nonce CSP : 128 bits aléatoires, régénéré à CHAQUE requête ──────────────
  // Exposé aux pages via Astro.locals.cspNonce pour être posé sur les <script>.
  const nonce = randomBytes(16).toString('base64');
  (context.locals as { cspNonce?: string }).cspNonce = nonce;

  const ip = clientIp(context, context.request);

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
    logSecurityEvent('bad_request', ip, context.url.pathname, 'URI malformee');
    return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
  }
  const isTerrainRoute = pathname.startsWith(TERRAIN_PREFIX);

  // ── Protection zone opérationnelle /terrain/* ───────────────────────────────
  if (isTerrainRoute) {
    bumpTraffic('terrainHits');
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
        // Accès à une route interne sans session valide → on journalise (un balayage
        // d'URL obfusquées par un scanner apparaîtra ici) puis on redirige vers login.
        logSecurityEvent('terrain_denied', ip, pathname);
        const dest = encodeURIComponent(pathname);
        return Response.redirect(
          new URL(`${TERRAIN_AUTH_PATH}?r=${dest}`, context.url),
          302
        );
      }
    }

    const response = await next();

    // SpotCheck a besoin de 'unsafe-inline' (handlers onclick=, gros script inline).
    // Exception ciblée, cf. buildCsp(). Toutes les autres routes /terrain gardent le nonce.
    const isSpotcheck = pathname === '/terrain/spotcheck' || pathname === '/terrain/spotcheck/';
    response.headers.set('Content-Security-Policy', buildCsp(nonce, true, isSpotcheck));
    response.headers.set('X-Frame-Options',         'DENY');
    response.headers.set('X-Content-Type-Options',  'nosniff');
    response.headers.set('Referrer-Policy',         'no-referrer');
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
  const isPublicFeed = pathname === '/api/news.json';

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
    bumpTraffic('apiPosts');
    const origin = context.request.headers.get('origin');
    if (origin !== ORIGIN) {
      bumpTraffic('blockedCsrf');
      logSecurityEvent('csrf_reject', ip, pathname, `origin=${origin ?? 'absent'}`);
      return new Response(
        JSON.stringify({ ok: false, error: 'Origine non autorisée.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isRateLimited(ip)) {
      bumpTraffic('blockedRate');
      logSecurityEvent('rate_limit', ip, pathname);
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
  response.headers.set('Content-Security-Policy',   buildCsp(nonce, false));
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
