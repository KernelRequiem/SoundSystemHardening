/**
 * /api/contribuer — Réception des contributions publiques (file de modération)
 *
 * Endpoint PUBLIC (pas d'auth). Protégé par : vérification d'Origin + rate limit
 * (middleware), honeypot, validation/limites de taille (adminStore.addContribution).
 * Les contributions atterrissent en statut 'pending' et n'apparaissent nulle part
 * en public : seules les pages /hardeningcore/moderation (authentifiées) les voient.
 */
import type { APIRoute } from 'astro';
import { addContribution } from '../../lib/adminStore';

const ORIGIN = 'https://soundsystemhardening.fr';
const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const ct = request.headers.get('content-type') || '';
  let data: Record<string, string> = {};
  try {
    if (ct.includes('application/json')) data = await request.json();
    else new URLSearchParams(await request.text()).forEach((v, k) => { data[k] = v; });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Corps invalide.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
  }

  // Honeypot : un bot remplit ce champ caché → on répond OK sans rien stocker.
  if (data['bot-field']) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
  }

  const res = addContribution({
    type: data.type, title: data.title, body: data.body, page: data.page, author: data.author,
  });

  return new Response(JSON.stringify(res), {
    status: res.ok ? 200 : 400,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: cors });
