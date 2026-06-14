/**
 * adminStore.ts — Couche de persistance unique de la zone admin HardeningCore
 *
 * Toute écriture/lecture de données admin passe par ce module : pages wiki (.md),
 * incidents de la carte (incidents.json), file de modération, validation légale,
 * et journal historique (JSONL). Aucune route publique ne touche ces helpers en
 * écriture sans avoir d'abord passé checkAdminAuth côté page/endpoint.
 *
 * Principes de sécurité appliqués ici :
 *  - Anti-traversée de répertoire : tout slug/identifiant est passé par une
 *    allowlist stricte, jamais concaténé brut dans un chemin.
 *  - Écriture atomique : on écrit dans un fichier temporaire puis rename() —
 *    pas de fichier à moitié écrit visible par un lecteur concurrent.
 *  - Journalisation systématique : chaque mutation appelle appendHistory() pour
 *    la traçabilité (qui / quoi / quand).
 *  - Aucune donnée sensible (secret, mot de passe) n'est jamais persistée.
 */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync,
  renameSync, statSync, appendFileSync, unlinkSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

// ── Emplacements ──────────────────────────────────────────────────────
// Le contenu wiki vit dans la collection Astro (src/content/wiki).
// Les données mutables d'exploitation (modération, validation, historique)
// vivent dans data/admin — répertoire prévu pour être monté sur un volume
// persistant en production conteneurisée (sinon perdu au redémarrage).
const ROOT          = process.cwd();
export const WIKI_DIR     = join(ROOT, 'src/content/wiki');
export const INCIDENTS    = join(ROOT, 'src/data/incidents.json');
const ADMIN_DATA_DIR      = join(ROOT, 'data/admin');
const MODERATION_FILE     = join(ADMIN_DATA_DIR, 'moderation.json');
const LEGAL_REVIEW_FILE   = join(ADMIN_DATA_DIR, 'legal-review.json');
const HISTORY_FILE        = join(ADMIN_DATA_DIR, 'history.jsonl');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** Écriture atomique : fichier temporaire + rename (pas de lecture partielle). */
function atomicWrite(path: string, content: string): void {
  ensureDir(dirname(path));
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, content, 'utf-8');
  renameSync(tmp, path);
}

function readJson<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────
//  SLUGS WIKI — validation anti-traversée
// ─────────────────────────────────────────────────────────────────────
// Même allowlist que la page publique /wiki/[slug] : lettres (accents),
// chiffres, tiret, underscore, apostrophe, esperluette. Tout séparateur
// de chemin (/ \ .) et la séquence ".." sont exclus de fait.
const SLUG_RE = /^[\p{L}\p{N}_'&-]+$/u;

export function isSafeSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 120 && SLUG_RE.test(slug);
}

export interface WikiPageMeta {
  slug:     string;
  title:    string;
  size:     number;   // octets
  modified: string;   // ISO
  excerpt:  string;
}

/** Liste toutes les pages wiki avec métadonnées (titre H1, taille, date). */
export function listWikiPages(): WikiPageMeta[] {
  if (!existsSync(WIKI_DIR)) return [];
  return readdirSync(WIKI_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('.') && !f.startsWith('_'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const full = join(WIKI_DIR, f);
      const raw  = readFileSync(full, 'utf-8');
      const st   = statSync(full);
      const h1   = raw.match(/^#\s+(.+)$/m);
      const title = h1
        ? h1[1].replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}◆◇▸]/gu, '').trim()
        : slug.replace(/-/g, ' ');
      const body = raw.replace(/^#\s+.+$/m, '').replace(/^>.*$/gm, '').trim();
      return {
        slug,
        title,
        size: st.size,
        modified: st.mtime.toISOString(),
        excerpt: body.slice(0, 160).replace(/\s+/g, ' ').trim(),
      };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

/** Lit le Markdown brut d'une page. Retourne null si slug invalide/absent. */
export function readWikiPage(slug: string): string | null {
  if (!isSafeSlug(slug)) return null;
  const full = join(WIKI_DIR, `${slug}.md`);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf-8');
}

export interface SaveWikiResult { ok: boolean; created?: boolean; error?: string; }

/** Crée ou met à jour une page wiki. Journalise la mutation. */
export function saveWikiPage(
  slug: string, content: string, actor: string,
): SaveWikiResult {
  if (!isSafeSlug(slug)) return { ok: false, error: 'Slug invalide.' };
  if (typeof content !== 'string') return { ok: false, error: 'Contenu invalide.' };
  if (content.length > 500_000)    return { ok: false, error: 'Contenu trop volumineux (> 500 Ko).' };

  const full    = join(WIKI_DIR, `${slug}.md`);
  const created = !existsSync(full);
  // Normalise les fins de ligne, garantit un \n final.
  const normalized = content.replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n';
  atomicWrite(full, normalized);

  appendHistory({
    actor, action: created ? 'wiki.create' : 'wiki.update',
    target: `wiki/${slug}`,
    meta: `${normalized.length} octets`,
  });
  return { ok: true, created };
}

/** Supprime une page wiki (soft : on déplace vers .trash). Journalise. */
export function deleteWikiPage(slug: string, actor: string): SaveWikiResult {
  if (!isSafeSlug(slug)) return { ok: false, error: 'Slug invalide.' };
  const full = join(WIKI_DIR, `${slug}.md`);
  if (!existsSync(full)) return { ok: false, error: 'Page introuvable.' };
  const trash = join(WIKI_DIR, '.trash');
  ensureDir(trash);
  renameSync(full, join(trash, `${slug}.${Date.now()}.md`));
  appendHistory({ actor, action: 'wiki.delete', target: `wiki/${slug}` });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
//  INCIDENTS — carte des alertes
// ─────────────────────────────────────────────────────────────────────
export interface Incident {
  id: string;
  lieu: string;
  lat: number;
  lng: number;
  date: string;
  type: string;
  titre: string;
  desc: string;
  bilan?: string;
  source?: string;
  wiki?: string;
  departement?: string;
  prefecture?: string;
  type_operation?: string;
  statut_juridique?: string;
  recours?: string;
  effectifs?: number | null;
  helicopteres?: number;
  drones?: number;
  cout_eur?: number | null;
  arguments?: string;
  [k: string]: unknown;
}

export function listIncidents(): Incident[] {
  return readJson<Incident[]>(INCIDENTS, []);
}

const ID_RE = /^[a-z0-9-]{1,80}$/;

function slugifyId(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || `incident-${Date.now()}`;
}

export interface IncidentResult { ok: boolean; id?: string; error?: string; }

function validateIncident(inc: Partial<Incident>): string | null {
  if (!inc.titre || String(inc.titre).trim().length < 3) return 'Titre requis (≥ 3 caractères).';
  if (!inc.lieu  || String(inc.lieu).trim().length < 2)  return 'Lieu requis.';
  const lat = Number(inc.lat), lng = Number(inc.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90)   return 'Latitude hors bornes (-90..90).';
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return 'Longitude hors bornes (-180..180).';
  if (!inc.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(inc.date))) return 'Date au format AAAA-MM-JJ requise.';
  return null;
}

/** Crée un incident. Génère un id depuis le titre si absent. Journalise. */
export function createIncident(data: Partial<Incident>, actor: string): IncidentResult {
  const err = validateIncident(data);
  if (err) return { ok: false, error: err };

  const list = listIncidents();
  let id = data.id && ID_RE.test(String(data.id)) ? String(data.id) : slugifyId(String(data.titre));
  // Unicité de l'id.
  let n = 1; const base = id;
  while (list.some((i) => i.id === id)) id = `${base}-${++n}`;

  const inc: Incident = {
    id,
    lieu: String(data.lieu).trim(),
    lat: Number(data.lat),
    lng: Number(data.lng),
    date: String(data.date),
    type: String(data.type || 'autre'),
    titre: String(data.titre).trim(),
    desc: String(data.desc || '').trim(),
    bilan: data.bilan ? String(data.bilan).trim() : undefined,
    source: data.source ? String(data.source).trim() : undefined,
    wiki: data.wiki ? String(data.wiki).trim() : undefined,
    departement: data.departement ? String(data.departement).trim() : undefined,
    prefecture: data.prefecture ? String(data.prefecture).trim() : undefined,
    type_operation: data.type_operation ? String(data.type_operation).trim() : undefined,
    statut_juridique: data.statut_juridique ? String(data.statut_juridique).trim() : undefined,
    recours: data.recours ? String(data.recours).trim() : undefined,
    effectifs: data.effectifs != null && data.effectifs !== '' as unknown ? Number(data.effectifs) : null,
    helicopteres: data.helicopteres ? Number(data.helicopteres) : 0,
    drones: data.drones ? Number(data.drones) : 0,
    cout_eur: data.cout_eur != null && data.cout_eur !== '' as unknown ? Number(data.cout_eur) : null,
    arguments: data.arguments ? String(data.arguments).trim() : undefined,
  };
  list.unshift(inc);
  atomicWrite(INCIDENTS, JSON.stringify(list, null, 2) + '\n');
  appendHistory({ actor, action: 'incident.create', target: `incident/${id}`, meta: inc.lieu });
  return { ok: true, id };
}

/** Met à jour un incident existant. Journalise. */
export function updateIncident(id: string, data: Partial<Incident>, actor: string): IncidentResult {
  if (!ID_RE.test(String(id))) return { ok: false, error: 'Identifiant invalide.' };
  const list = listIncidents();
  const idx = list.findIndex((i) => i.id === id);
  if (idx < 0) return { ok: false, error: 'Incident introuvable.' };

  const merged = { ...list[idx], ...data, id } as Incident;
  const err = validateIncident(merged);
  if (err) return { ok: false, error: err };
  merged.lat = Number(merged.lat); merged.lng = Number(merged.lng);

  list[idx] = merged;
  atomicWrite(INCIDENTS, JSON.stringify(list, null, 2) + '\n');
  appendHistory({ actor, action: 'incident.update', target: `incident/${id}`, meta: merged.lieu });
  return { ok: true, id };
}

/** Supprime un incident. Journalise. */
export function deleteIncident(id: string, actor: string): IncidentResult {
  if (!ID_RE.test(String(id))) return { ok: false, error: 'Identifiant invalide.' };
  const list = listIncidents();
  const next = list.filter((i) => i.id !== id);
  if (next.length === list.length) return { ok: false, error: 'Incident introuvable.' };
  atomicWrite(INCIDENTS, JSON.stringify(next, null, 2) + '\n');
  appendHistory({ actor, action: 'incident.delete', target: `incident/${id}` });
  return { ok: true, id };
}

// ─────────────────────────────────────────────────────────────────────
//  MODÉRATION — file de contributions (formulaire interne + import Issues)
// ─────────────────────────────────────────────────────────────────────
export type ContribStatus = 'pending' | 'approved' | 'rejected';
export type ContribSource = 'form' | 'github';

export interface Contribution {
  id: string;
  source: ContribSource;
  type: string;          // ex : 'wiki', 'incident', 'correction', 'autre'
  title: string;
  body: string;
  page?: string;         // page wiki concernée le cas échéant
  author?: string;       // pseudo libre déclaré
  url?: string;          // lien GitHub si source github
  status: ContribStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  note?: string;         // note de modération
}

export function listContributions(): Contribution[] {
  return readJson<Contribution[]>(MODERATION_FILE, []);
}

function writeContributions(list: Contribution[]): void {
  atomicWrite(MODERATION_FILE, JSON.stringify(list, null, 2) + '\n');
}

// Borne dure de la file en attente (anti-DoS disque). Le formulaire public est
// rate-limité côté middleware, mais une borne explicite garantit que moderation.json
// ne grossit pas indéfiniment même sous abus distribué (IP tournantes). Au-delà,
// on refuse les nouvelles soumissions du formulaire jusqu'à ce que la file soit
// traitée — les entrées déjà validées/rejetées ne comptent pas dans la borne.
const MAX_PENDING_CONTRIB = 200;

/** Ajoute une contribution issue du formulaire public. Pas d'auth requise côté
 *  appelant (c'est public), mais validation/limites strictes ici. */
export function addContribution(data: {
  type?: string; title?: string; body?: string; page?: string; author?: string;
}): { ok: boolean; id?: string; error?: string } {
  const title = String(data.title || '').trim();
  const body  = String(data.body  || '').trim();
  if (title.length < 3)   return { ok: false, error: 'Titre trop court.' };
  if (body.length < 10)   return { ok: false, error: 'Description trop courte.' };
  if (title.length > 200 || body.length > 8000) return { ok: false, error: 'Contenu trop long.' };

  const list = listContributions();
  // Garde-fou volume : on borne uniquement la file EN ATTENTE issue du formulaire.
  const pendingForm = list.filter((c) => c.status === 'pending' && c.source === 'form').length;
  if (pendingForm >= MAX_PENDING_CONTRIB) {
    return { ok: false, error: 'File de modération saturée. Réessaie plus tard ou ouvre une issue GitHub.' };
  }

  const contrib: Contribution = {
    id: randomUUID(),
    source: 'form',
    type: String(data.type || 'autre').slice(0, 40),
    title, body,
    page: data.page ? String(data.page).slice(0, 200) : undefined,
    author: data.author ? String(data.author).slice(0, 80) : undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  list.unshift(contrib);
  writeContributions(list);
  return { ok: true, id: contrib.id };
}

/** Importe une liste d'Issues GitHub dans la file (dédupliquée par url). */
export function importGithubContributions(items: Array<{
  title: string; body: string; url: string; author?: string;
}>): number {
  const list = listContributions();
  const seen = new Set(list.filter((c) => c.source === 'github').map((c) => c.url));
  let added = 0;
  for (const it of items) {
    if (!it.url || seen.has(it.url)) continue;
    list.unshift({
      id: randomUUID(),
      source: 'github',
      type: 'github-issue',
      title: String(it.title || '(sans titre)').slice(0, 200),
      body: String(it.body || '').slice(0, 8000),
      url: it.url,
      author: it.author ? String(it.author).slice(0, 80) : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    seen.add(it.url);
    added++;
  }
  if (added) writeContributions(list);
  return added;
}

export function reviewContribution(
  id: string, decision: 'approved' | 'rejected', actor: string, note?: string,
): { ok: boolean; error?: string } {
  const list = listContributions();
  const c = list.find((x) => x.id === id);
  if (!c) return { ok: false, error: 'Contribution introuvable.' };
  c.status = decision;
  c.reviewedAt = new Date().toISOString();
  c.reviewedBy = actor;
  if (note) c.note = String(note).slice(0, 1000);
  writeContributions(list);
  appendHistory({
    actor, action: `moderation.${decision}`,
    target: `contrib/${id}`, meta: c.title.slice(0, 80),
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
//  VALIDATION LÉGALE — workflow de relecture des contenus juridiques
// ─────────────────────────────────────────────────────────────────────
export type LegalStatus = 'draft' | 'review' | 'validated' | 'flagged';

export interface LegalReview {
  ref: string;          // identifiant du contenu (slug wiki ou clé legal-doc)
  label: string;
  kind: 'wiki' | 'legal-doc';
  status: LegalStatus;
  updatedAt: string;
  updatedBy: string;
  validator?: string;   // qui a validé juridiquement
  note?: string;
}

export function listLegalReviews(): LegalReview[] {
  return readJson<LegalReview[]>(LEGAL_REVIEW_FILE, []);
}

function writeLegalReviews(list: LegalReview[]): void {
  atomicWrite(LEGAL_REVIEW_FILE, JSON.stringify(list, null, 2) + '\n');
}

export function setLegalStatus(data: {
  ref: string; label: string; kind: 'wiki' | 'legal-doc';
  status: LegalStatus; actor: string; validator?: string; note?: string;
}): { ok: boolean; error?: string } {
  const valid: LegalStatus[] = ['draft', 'review', 'validated', 'flagged'];
  if (!valid.includes(data.status)) return { ok: false, error: 'Statut invalide.' };
  if (!data.ref) return { ok: false, error: 'Référence manquante.' };

  const list = listLegalReviews();
  const now = new Date().toISOString();
  const existing = list.find((r) => r.ref === data.ref && r.kind === data.kind);
  if (existing) {
    existing.status = data.status;
    existing.updatedAt = now;
    existing.updatedBy = data.actor;
    if (data.validator) existing.validator = data.validator;
    if (data.note != null) existing.note = String(data.note).slice(0, 1000);
    existing.label = data.label || existing.label;
  } else {
    list.unshift({
      ref: data.ref, label: data.label, kind: data.kind,
      status: data.status, updatedAt: now, updatedBy: data.actor,
      validator: data.validator, note: data.note ? String(data.note).slice(0, 1000) : undefined,
    });
  }
  writeLegalReviews(list);
  appendHistory({
    actor: data.actor, action: `legal.${data.status}`,
    target: `${data.kind}/${data.ref}`, meta: data.label.slice(0, 80),
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
//  HISTORIQUE — journal append-only des mutations (JSONL)
// ─────────────────────────────────────────────────────────────────────
export interface HistoryEntry {
  ts: string;       // ISO
  actor: string;    // email admin/modérateur
  action: string;   // ex : wiki.update, incident.delete, legal.validated
  target: string;   // ressource concernée
  meta?: string;    // détail libre (jamais de secret)
}

/** Ajoute une entrée au journal append-only. Tolérant aux pannes (best-effort). */
export function appendHistory(e: Omit<HistoryEntry, 'ts'>): void {
  try {
    ensureDir(ADMIN_DATA_DIR);
    const line = JSON.stringify({ ts: new Date().toISOString(), ...e }) + '\n';
    appendFileSync(HISTORY_FILE, line, 'utf-8');
  } catch (err) {
    console.error('[adminStore] échec écriture historique:', err);
  }
}

/** Lit le journal (dernières entrées en premier). limit borne le volume rendu. */
export function readHistory(limit = 300): HistoryEntry[] {
  try {
    if (!existsSync(HISTORY_FILE)) return [];
    const lines = readFileSync(HISTORY_FILE, 'utf-8').trim().split('\n').filter(Boolean);
    const parsed: HistoryEntry[] = [];
    for (const l of lines) {
      try { parsed.push(JSON.parse(l)); } catch { /* ligne corrompue ignorée */ }
    }
    return parsed.reverse().slice(0, limit);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────
//  STATS — agrégat léger pour le dashboard
// ─────────────────────────────────────────────────────────────────────
export interface AdminStats {
  wikiPages: number;
  incidents: number;
  pendingContrib: number;
  legalToReview: number;
  lastChange?: HistoryEntry;
}

export function getAdminStats(): AdminStats {
  const contribs = listContributions();
  const legal = listLegalReviews();
  const hist = readHistory(1);
  return {
    wikiPages: listWikiPages().length,
    incidents: listIncidents().length,
    pendingContrib: contribs.filter((c) => c.status === 'pending').length,
    legalToReview: legal.filter((r) => r.status === 'review' || r.status === 'flagged').length,
    lastChange: hist[0],
  };
}
