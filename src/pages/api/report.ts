// src/pages/api/report.ts
// Endpoint SSR - reçoit un signalement d'incident depuis le formulaire de la carte.
// Écrit le signalement dans private/reports-pending.json (validation manuelle avant
// ajout dans src/data/incidents.json).
//
// Zéro dépendance externe : aucun appel à Airtable, aucun SaaS tiers.
// Le fichier private/reports-pending.json est gitignored et persisté sur le VPS.

import type { APIRoute } from 'astro';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

// Chemin du fichier de file d'attente (gitignored via private/)
const PENDING_FILE = join(process.cwd(), 'private', 'reports-pending.json');

function appendReport(report: Record<string, string>): void {
  const dir = join(process.cwd(), 'private');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let existing: Record<string, string>[] = [];
  if (existsSync(PENDING_FILE)) {
    try {
      existing = JSON.parse(readFileSync(PENDING_FILE, 'utf-8'));
    } catch {
      existing = [];
    }
  }
  existing.push(report);
  writeFileSync(PENDING_FILE, JSON.stringify(existing, null, 2), 'utf-8');
}

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

  // ── Limites de taille (anti-DoS) ─────────────────────────────────────────────
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

  // ── Enregistrement local ──────────────────────────────────────────────────────
  // Latitude / Longitude laissées vides : le modérateur les renseigne avant
  // d'ajouter l'entrée dans src/data/incidents.json (workflow manuel).
  const report: Record<string, string> = {
    titre:       `[Signalement] ${lieu.trim()}`,
    lieu:        lieu.trim(),
    date:        date.trim(),
    type:        type.trim(),
    description: description.trim(),
    statut:      'en_attente',
    recu_le:     new Date().toISOString(),
  };
  if (source?.trim()) report.source = source.trim();
  if (bilan?.trim())  report.bilan  = bilan.trim();

  try {
    appendReport(report);
  } catch (err) {
    console.error('[API /report] Erreur écriture fichier :', err);
    return json(500, { ok: false, error: 'Erreur serveur lors de l\'enregistrement' });
  }

  return json(200, { ok: true, message: 'Signalement reçu. En attente de validation par les modérateurs.' });
};
