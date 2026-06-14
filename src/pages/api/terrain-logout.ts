/**
 * /api/terrain-logout — Invalidation de session
 * POST uniquement. Efface le cookie _ssh_ops.
 */

import type { APIRoute } from 'astro';
import { clearSessionCookieHeader } from '../../lib/adminAuth';
import { logSecurityEvent } from '../../lib/securityLog';

export const POST: APIRoute = ({ request, clientAddress }) => {
  const ip = clientAddress
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || 'unknown';
  logSecurityEvent('logout', ip, '/api/terrain-logout');
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookieHeader(),
    },
  });
};

export const GET: APIRoute = () => new Response(null, { status: 405 });
