/**
 * /api/terrain-auth — Endpoint d'authentification opérationnel
 * POST uniquement. Vérifie les credentials, émet un cookie de session signé.
 */

import type { APIRoute } from 'astro';
import { checkCredentials, makeSessionCookieHeader } from '../../lib/adminAuth';

// Délai anti-brute-force constant (masque le timing d'une recherche en DB)
const AUTH_DELAY_MS = 400;

export const POST: APIRoute = async ({ request }) => {
  const start = Date.now();

  // Assure un délai minimum pour résister aux timing attacks
  const enforceDelay = async () => {
    const elapsed = Date.now() - start;
    if (elapsed < AUTH_DELAY_MS) await new Promise(r => setTimeout(r, AUTH_DELAY_MS - elapsed));
  };

  const fail = async (status = 401) => {
    await enforceDelay();
    return new Response(JSON.stringify({ ok: false }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    let email: string, password: string;

    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      email    = String(body.email    || '').trim().toLowerCase();
      password = String(body.password || '');
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      const body = await request.formData();
      email    = String(body.get('email')    || '').trim().toLowerCase();
      password = String(body.get('password') || '');
    } else {
      return fail(400);
    }

    if (!email || !password) return fail(400);
    if (email.length > 254 || password.length > 256) return fail(400);

    const result = checkCredentials(email, password);
    if (!result.valid || !result.role) return fail(401);

    const secret = process.env.ADMIN_SECRET!;
    const cookieHeader = makeSessionCookieHeader(email, result.role as 'admin' | 'moderator', secret);

    await enforceDelay();
    return new Response(JSON.stringify({ ok: true, role: result.role }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader,
      },
    });
  } catch (err) {
    console.error('[terrain-auth] Erreur inattendue:', err);
    return fail(500);
  }
};

// Refuser GET/HEAD/etc. explicitement
export const GET: APIRoute = () => new Response(null, { status: 405 });
