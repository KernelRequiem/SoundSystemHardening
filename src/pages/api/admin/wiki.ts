/**
 * /api/admin/wiki — Mutations sur les pages wiki (admin/modérateur)
 *
 * POST { action: 'save'|'delete', slug, content? }
 *
 * Double barrière d'auth : le middleware protège déjà /api/admin/* (cf. middleware.ts),
 * mais on re-vérifie checkAdminAuth ici — un endpoint mutant ne doit JAMAIS dépendre
 * d'une seule couche. CSRF : l'Origin est vérifiée par le middleware pour tout POST
 * /api hors endpoints terrain-auth ; on revérifie quand même ci-dessous.
 */
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '../../../lib/adminAuth';
import { saveWikiPage, deleteWikiPage } from '../../../lib/adminStore';

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

  // Anti-CSRF complémentaire (le dev local sur localhost reste couvert par l'auth cookie).
  const origin = request.headers.get('origin');
  if (origin && origin !== ORIGIN && !/^https?:\/\/localhost(:\d+)?$/.test(origin) && !/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
    return json({ ok: false, error: 'Origine non autorisée.' }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'JSON invalide.' }, 400); }

  const action = String(body.action || '');
  const slug   = String(body.slug || '');

  if (action === 'save') {
    const res = saveWikiPage(slug, String(body.content ?? ''), auth.email);
    return res.ok ? json({ ok: true, created: res.created }) : json({ ok: false, error: res.error }, 400);
  }
  if (action === 'delete') {
    const res = deleteWikiPage(slug, auth.email);
    return res.ok ? json({ ok: true }) : json({ ok: false, error: res.error }, 400);
  }
  return json({ ok: false, error: 'Action inconnue.' }, 400);
};

export const GET: APIRoute = () => new Response(null, { status: 405 });
