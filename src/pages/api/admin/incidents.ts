/**
 * /api/admin/incidents — CRUD des incidents de la carte (admin/modérateur)
 *
 * POST { action:'create', data }
 * POST { action:'update', id, data }
 * POST { action:'delete', id }
 *
 * Écrit src/data/incidents.json (le même fichier que consomme la carte publique).
 */
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '../../../lib/adminAuth';
import { createIncident, updateIncident, deleteIncident } from '../../../lib/adminStore';

const ORIGIN = 'https://soundsystemhardening.fr';
export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = checkAdminAuth(cookies);
  if (!auth.valid || !auth.email) return json({ ok: false, error: 'Non autorisé.' }, 401);

  const origin = request.headers.get('origin');
  if (origin && origin !== ORIGIN && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return json({ ok: false, error: 'Origine non autorisée.' }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'JSON invalide.' }, 400); }

  const action = String(body.action || '');
  const data = (body.data && typeof body.data === 'object' ? body.data : {}) as Record<string, unknown>;

  if (action === 'create') {
    const res = createIncident(data, auth.email);
    return res.ok ? json({ ok: true, id: res.id }) : json({ ok: false, error: res.error }, 400);
  }
  if (action === 'update') {
    const res = updateIncident(String(body.id || ''), data, auth.email);
    return res.ok ? json({ ok: true, id: res.id }) : json({ ok: false, error: res.error }, 400);
  }
  if (action === 'delete') {
    const res = deleteIncident(String(body.id || ''), auth.email);
    return res.ok ? json({ ok: true }) : json({ ok: false, error: res.error }, 400);
  }
  return json({ ok: false, error: 'Action inconnue.' }, 400);
};

export const GET: APIRoute = () => new Response(null, { status: 405 });
