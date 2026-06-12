// src/pages/api/report.ts
// Endpoint SSR - reçoit un signalement d'incident depuis le formulaire de la carte
// et l'écrit dans Airtable avec Statut = "En attente" (validation manuelle par un modérateur).
// Remplace l'ancienne fonction Netlify /.netlify/functions/report.
//
// Variables d'environnement (injectées par Coolify sur le container) :
//   AIRTABLE_WRITE_TOKEN  -> Personal Access Token, scope data.records:write uniquement
//   AIRTABLE_BASE_ID      -> identifiant de la base Airtable

import type { APIRoute } from 'astro';

export const prerender = false;

const ALLOWED_ORIGIN = 'https://soundsystemhardening.fr';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: corsHeaders });

export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: corsHeaders });

export const POST: APIRoute = async ({ request }) => {
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, string> = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      new URLSearchParams(text).forEach((v, k) => { body[k] = v; });
    }
  } catch {
    return json(400, { ok: false, error: 'JSON invalide' });
  }

  // ── Honeypot anti-bot ───────────────────────────────────────────────────────
  if (body['bot-field']) {
    return json(200, { ok: true });
  }

  const { lieu, date, type, description, source, bilan } = body;

  // ── Validation côté serveur ─────────────────────────────────────────────────
  if (!lieu?.trim() || !date?.trim() || !type?.trim() || !description?.trim()) {
    return json(400, { ok: false, error: 'Champs requis manquants : lieu, date, type, description' });
  }

  // ── Limites de taille (anti-DoS, anti-pollution de la base Airtable) ─────────
  if (
    lieu.length > 200 ||
    date.length > 50 ||
    type.length > 100 ||
    description.length > 5000 ||
    (source?.length ?? 0) > 500 ||
    (bilan?.length ?? 0) > 1000
  ) {
    return json(400, { ok: false, error: 'Champs trop longs.' });
  }

  const TOKEN = process.env.AIRTABLE_WRITE_TOKEN || import.meta.env.AIRTABLE_WRITE_TOKEN;
  const BASE  = process.env.AIRTABLE_BASE_ID || import.meta.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE) {
    console.error('[API /report] AIRTABLE_WRITE_TOKEN ou AIRTABLE_BASE_ID manquant.');
    return json(500, { ok: false, error: 'Configuration serveur manquante' });
  }

  // ── Champs Airtable ──────────────────────────────────────────────────────────
  // Latitude / Longitude laissées vides : le modérateur les renseigne avant de
  // passer le cas en "Valide" pour qu'il apparaisse sur la carte.
  const fields: Record<string, string> = {
    Titre:       `[Signalement] ${lieu.trim()}`,
    Lieu:        lieu.trim(),
    Date:        date.trim(),
    Type:        type.trim(),
    Description: description.trim(),
    Statut:      'En attente',
  };
  if (source?.trim()) fields.Source = source.trim();
  if (bilan?.trim())  fields.Bilan  = bilan.trim();

  // ── Envoi vers Airtable ───────────────────────────────────────────────────────
  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE}/Incidents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      console.error('[API /report] Erreur Airtable :', await res.text());
      return json(502, { ok: false, error: 'Erreur lors de l\'envoi à Airtable' });
    }
  } catch {
    return json(502, { ok: false, error: 'Airtable injoignable' });
  }

  return json(200, { ok: true, message: 'Signalement reçu. En attente de validation par les modérateurs.' });
};
