/**
 * /api/terrain-logout — Invalidation de session
 * POST uniquement. Efface le cookie _ssh_ops.
 */

import type { APIRoute } from 'astro';
import { clearSessionCookieHeader } from '../../lib/adminAuth';

export const POST: APIRoute = () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookieHeader(),
    },
  });
};

export const GET: APIRoute = () => new Response(null, { status: 405 });
