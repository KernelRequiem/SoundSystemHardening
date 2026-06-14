/**
 * /api/admin/legal — Workflow de validation juridique (admin uniquement)
 *
 * POST { action:'set', ref, label, kind:'wiki'|'legal-doc', status, validator?, note? }
 *
 * status ∈ draft | review | validated | flagged
 * Réservé au rôle admin : la validation juridique engage la qualité légale du site.
 */
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '../../../lib/adminAuth';
import { setLegalStatus, type LegalStatus } from '../../../lib/adminStore';

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
  // Cloisonnement par rôle : seul l'admin pilote la validation juridique.
  if (auth.role !== 'admin') return json({ ok: false, error: 'Réservé au rôle admin.' }, 403);

  const origin = request.headers.get('origin');
  if (origin && origin !== ORIGIN && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return json({ ok: false, error: 'Origine non autorisée.' }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'JSON invalide.' }, 400); }

  if (String(body.action) !== 'set') return json({ ok: false, error: 'Action inconnue.' }, 400);

  const res = setLegalStatus({
    ref: String(body.ref || ''),
    label: String(body.label || ''),
    kind: body.kind === 'legal-doc' ? 'legal-doc' : 'wiki',
    status: String(body.status || '') as LegalStatus,
    actor: auth.email,
    validator: body.validator ? String(body.validator) : undefined,
    note: body.note != null ? String(body.note) : undefined,
  });
  return res.ok ? json({ ok: true }) : json({ ok: false, error: res.error }, 400);
};

export const GET: APIRoute = () => new Response(null, { status: 405 });
