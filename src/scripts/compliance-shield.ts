/**
 * Compliance-Shield — Générateur de dossier de sécurité et de bonne foi
 * SoundSystemHardening.fr
 *
 * Principe directeur : PREUVE POSITIVE UNIQUEMENT.
 * Le PDF ne mentionne jamais ce qui n'a pas été fait. Il documente
 * exclusivement les mesures effectives. Aucune donnée ne quitte le navigateur.
 *
 * - Logique conditionnelle : statut foncier, seuil 500 (R211-2 CSI),
 *   déclaration, dialogue autorités, phase pré/post événement.
 * - Import du rapport SoundCheck (.md) avec redaction GPS optionnelle.
 * - Photos avant/après ré-encodées via canvas (zéro métadonnée EXIF/GPS).
 * - Persistance : autosave localStorage (champs texte) + export/import JSON complet.
 */

declare global {
  interface Window { jspdf: any }
}

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface PhotoItem {
  name: string;
  dataUrl: string;   // JPEG ré-encodé canvas, métadonnées épurées
  w: number;
  h: number;
}

interface SoundCheckData {
  raw: Record<string, string>;  // clé → valeur extraites du rapport
  importedAt: string;
}

interface CSStateShape {
  version: 1;
  fields: Record<string, string | boolean>;
  photosAvant: PhotoItem[];
  photosApres: PhotoItem[];
  pieceFoncier: PhotoItem[];   // accord proprio scanné
  pieceRecepisse: PhotoItem[]; // récépissé déclaration
  soundcheck: SoundCheckData | null;
}

const LS_KEY = 'cs-draft-v1';
const MAX_PHOTOS = 12;
const MAX_PIECES = 4;
const PHOTO_MAX_DIM = 1400;
const PHOTO_QUALITY = 0.72;

const state: CSStateShape = {
  version: 1,
  fields: {},
  photosAvant: [],
  photosApres: [],
  pieceFoncier: [],
  pieceRecepisse: [],
  soundcheck: null,
};

// ─────────────────────────────────────────────────────────────────
// Helpers DOM
// ─────────────────────────────────────────────────────────────────

function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}
function val(id: string): string {
  const e = el<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(id);
  return e ? String((e as any).value || '').trim() : '';
}
function checked(id: string): boolean {
  const e = el<HTMLInputElement>(id);
  return !!(e && e.checked);
}
function radio(name: string): string {
  const r = document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  return r ? r.value : '';
}
function show(id: string, on: boolean): void {
  const e = el(id);
  if (e) e.style.display = on ? '' : 'none';
}

function genId(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `CS-${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}-${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}-${hex}`;
}

function fmtDateFr(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────
// Photos : ré-encodage canvas (épuration EXIF/GPS) + compression
// ─────────────────────────────────────────────────────────────────

function processImage(file: File): Promise<PhotoItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width: w, height: h } = img;
        if (Math.max(w, h) > PHOTO_MAX_DIM) {
          const k = PHOTO_MAX_DIM / Math.max(w, h);
          w = Math.round(w * k);
          h = Math.round(h * k);
        }
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        if (!ctx) { reject(new Error('canvas')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        // toDataURL ré-encode les pixels : EXIF, XMP, GPS sont détruits.
        const dataUrl = cv.toDataURL('image/jpeg', PHOTO_QUALITY);
        URL.revokeObjectURL(url);
        resolve({ name: file.name.replace(/\.[^.]+$/, '') + '.jpg', dataUrl, w, h });
      } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')); };
    img.src = url;
  });
}

function bindPhotoInput(inputId: string, zoneId: string, previewId: string, bucket: PhotoItem[], max: number): void {
  const input = el<HTMLInputElement>(inputId);
  const zone = el(zoneId);
  if (!input || !zone) return;

  zone.addEventListener('click', (e) => {
    if (e.target !== input) input.click();
  });

  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    for (const f of files) {
      if (bucket.length >= max) break;
      if (!f.type.startsWith('image/')) continue;
      try { bucket.push(await processImage(f)); } catch { /* image illisible : ignorée */ }
    }
    input.value = '';
    renderPhotoPreview(previewId, bucket);
    refreshProgress();
  });
}

function renderPhotoPreview(previewId: string, bucket: PhotoItem[]): void {
  const box = el(previewId);
  if (!box) return;
  box.innerHTML = '';
  box.style.display = bucket.length ? 'grid' : 'none';
  bucket.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'photo-thumb';
    const img = document.createElement('img');
    img.src = p.dataUrl;
    img.alt = p.name;
    const span = document.createElement('span');
    span.textContent = p.name;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'photo-del';
    btn.textContent = '✕';
    btn.setAttribute('aria-label', 'Retirer la photo');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      bucket.splice(i, 1);
      renderPhotoPreview(previewId, bucket);
      refreshProgress();
    });
    div.appendChild(img); div.appendChild(span); div.appendChild(btn);
    box.appendChild(div);
  });
}

// ─────────────────────────────────────────────────────────────────
// Import SoundCheck (.md)
// ─────────────────────────────────────────────────────────────────

const SC_KEYS = [
  'Horodatage', 'Point source', 'Altitude source', 'Configuration sonore',
  'Hauteur du mur de son', 'Niveau de puissance du rig Lw', 'Mode de calcul',
  'Empreinte audible (>= 45 dB)', 'Empreinte résiduelle (>= 30 dB)',
  'Masque topographique', 'Azimuts occultés', 'Direction la plus défavorable',
  'Référence plate 45 dB', 'Référence plate 30 dB',
];

function parseSoundCheck(md: string): SoundCheckData | null {
  if (!/SOUNDCHECK/i.test(md)) return null;
  const raw: Record<string, string> = {};
  const rows = md.match(/^\|[^\n]+\|[^\n]*$/gm) || [];
  for (const row of rows) {
    const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const key = cells[0];
    const value = cells.slice(1).join(' · ');
    for (const k of SC_KEYS) {
      if (key.startsWith(k.split(' (')[0]) && !raw[k]) {
        raw[k] = value;
        break;
      }
    }
  }
  if (Object.keys(raw).length < 3) return null;
  return { raw, importedAt: new Date().toLocaleString('fr-FR') };
}

function applySoundCheckImport(text: string): void {
  const status = el('sc-import-status');
  const parsed = parseSoundCheck(text);
  if (!parsed) {
    if (status) {
      status.textContent = '✕ Format non reconnu. Colle le rapport .md exporté depuis SoundCheck.';
      status.className = 'cs-import-status err';
    }
    return;
  }
  state.soundcheck = parsed;
  if (status) {
    status.textContent = `✓ Rapport SoundCheck importé (${Object.keys(parsed.raw).length} indicateurs) le ${parsed.importedAt}`;
    status.className = 'cs-import-status ok';
  }
  refreshProgress();
  scheduleAutosave();
}

// ─────────────────────────────────────────────────────────────────
// Persistance : autosave localStorage + export/import JSON
// ─────────────────────────────────────────────────────────────────

const FORM_SELECTOR = '#csForm input[id], #csForm textarea[id], #csForm select[id]';

function serializeFields(): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  document.querySelectorAll<HTMLInputElement>(FORM_SELECTOR).forEach((e) => {
    if (e.type === 'file') return;
    if (e.type === 'checkbox') out[e.id] = e.checked;
    else out[e.id] = e.value;
  });
  document.querySelectorAll<HTMLInputElement>('#csForm input[type="radio"]:checked').forEach((r) => {
    out['radio:' + r.name] = r.value;
  });
  return out;
}

function restoreFields(fields: Record<string, string | boolean>): void {
  for (const [k, v] of Object.entries(fields)) {
    if (k.startsWith('radio:')) {
      const name = k.slice(6);
      const r = document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${String(v)}"]`);
      if (r) r.checked = true;
      continue;
    }
    const e = el<HTMLInputElement>(k);
    if (!e) continue;
    if (e.type === 'checkbox') e.checked = !!v;
    else e.value = String(v);
  }
}

let autosaveTimer: number | undefined;
function scheduleAutosave(): void {
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    try {
      // localStorage : champs + soundcheck uniquement (pas les photos : quota)
      const light = { version: 1, fields: serializeFields(), soundcheck: state.soundcheck };
      localStorage.setItem(LS_KEY, JSON.stringify(light));
      const s = el('autosaveStatus');
      if (s) s.textContent = '⊙ brouillon sauvegardé ' + new Date().toLocaleTimeString('fr-FR');
    } catch { /* quota plein : silencieux */ }
  }, 600);
}

function restoreAutosave(): void {
  try {
    const rawLs = localStorage.getItem(LS_KEY);
    if (!rawLs) return;
    const data = JSON.parse(rawLs);
    if (data && data.fields) {
      restoreFields(data.fields);
      if (data.soundcheck) {
        state.soundcheck = data.soundcheck;
        const status = el('sc-import-status');
        if (status) {
          status.textContent = `✓ Rapport SoundCheck restauré (importé le ${data.soundcheck.importedAt})`;
          status.className = 'cs-import-status ok';
        }
      }
      const s = el('autosaveStatus');
      if (s) s.textContent = '⊙ brouillon restauré (photos non incluses : utilise l\'import JSON)';
    }
  } catch { /* brouillon corrompu : ignoré */ }
}

function exportJson(): void {
  state.fields = serializeFields();
  const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `compliance-shield-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file: File): void {
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(String(r.result));
      if (!data || data.version !== 1) throw new Error('version');
      restoreFields(data.fields || {});
      state.photosAvant = Array.isArray(data.photosAvant) ? data.photosAvant : [];
      state.photosApres = Array.isArray(data.photosApres) ? data.photosApres : [];
      state.pieceFoncier = Array.isArray(data.pieceFoncier) ? data.pieceFoncier : [];
      state.pieceRecepisse = Array.isArray(data.pieceRecepisse) ? data.pieceRecepisse : [];
      state.soundcheck = data.soundcheck || null;
      renderPhotoPreview('previewAvant', state.photosAvant);
      renderPhotoPreview('previewApres', state.photosApres);
      renderPhotoPreview('previewFoncier', state.pieceFoncier);
      renderPhotoPreview('previewRecepisse', state.pieceRecepisse);
      if (state.soundcheck) {
        const status = el('sc-import-status');
        if (status) {
          status.textContent = `✓ Rapport SoundCheck restauré (importé le ${state.soundcheck.importedAt})`;
          status.className = 'cs-import-status ok';
        }
      }
      syncConditionals();
      refreshProgress();
      scheduleAutosave();
      const s = el('autosaveStatus');
      if (s) s.textContent = '⊙ dossier JSON importé (photos incluses)';
    } catch {
      alert('Fichier JSON invalide ou version incompatible.');
    }
  };
  r.readAsText(file);
}

function purgeAll(): void {
  if (!confirm('Purger le brouillon local (localStorage) et réinitialiser le formulaire ?')) return;
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  (el('csForm') as HTMLFormElement | null)?.reset();
  state.photosAvant = []; state.photosApres = [];
  state.pieceFoncier = []; state.pieceRecepisse = [];
  state.soundcheck = null;
  ['previewAvant', 'previewApres', 'previewFoncier', 'previewRecepisse'].forEach((id) => {
    const b = el(id); if (b) { b.innerHTML = ''; b.style.display = 'none'; }
  });
  const status = el('sc-import-status');
  if (status) { status.textContent = ''; status.className = 'cs-import-status'; }
  syncConditionals();
  refreshProgress();
  const s = el('autosaveStatus');
  if (s) s.textContent = '⊙ brouillon purgé';
}

// ─────────────────────────────────────────────────────────────────
// Logique conditionnelle (l'inhérent à chaque free)
// ─────────────────────────────────────────────────────────────────

function syncConditionals(): void {
  // Phase pré / post événement
  const phase = radio('phase') || 'pre';
  show('sectionBilan', phase === 'post');

  // Statut foncier
  const foncier = radio('foncier');
  show('foncierEcritWrap', foncier === 'ecrit');
  show('foncierVerbalWrap', foncier === 'verbal');
  show('foncierDemarcheWrap', foncier === 'demarche');
  show('foncierWarn', foncier === 'aucun');

  // Seuil 500 : pilote le bloc déclaration
  const effectif = parseInt(val('f-effectif'), 10) || 0;
  const sousSeuil = effectif > 0 && effectif < 500;
  show('seuilInfo', sousSeuil);
  show('seuilCritical', effectif >= 500);

  // Déclaration préfecture
  const decl = radio('declaration');
  show('declFaiteWrap', decl === 'faite' || decl === 'encours');

  // Générateurs
  const gen = parseInt(val('f-gen-nb'), 10) || 0;
  show('genDetailWrap', gen > 0);
}

// ─────────────────────────────────────────────────────────────────
// Indicateur de complétude (UI uniquement, jamais imprimé)
// ─────────────────────────────────────────────────────────────────

interface CheckItem { label: string; ok: () => boolean }

const CHECKLIST: CheckItem[] = [
  { label: 'Fiche événement', ok: () => !!val('f-commune') && !!val('f-date-debut') && !!val('f-effectif') },
  { label: 'Statut foncier documenté', ok: () => ['ecrit', 'verbal', 'public', 'demarche'].includes(radio('foncier')) },
  { label: 'Sécurité incendie', ok: () => (parseInt(val('f-ext-nb'), 10) || 0) > 0 },
  { label: 'Accès secours', ok: () => checked('f-voie-acces') && !!val('f-point-rencontre') },
  { label: 'Dispositif sanitaire', ok: () => (parseInt(val('f-secouristes'), 10) || 0) > 0 || checked('f-poste-secours') },
  { label: 'Acoustique', ok: () => !!state.soundcheck || !!val('f-dist-habitation') },
  { label: 'Environnement', ok: () => checked('f-remise-etat') || checked('f-tri-dechets') },
  { label: 'État des lieux photo (avant)', ok: () => state.photosAvant.length > 0 },
  { label: 'Organisation interne', ok: () => !!val('f-referents') },
];

function refreshProgress(): void {
  const done = CHECKLIST.filter((c) => c.ok()).length;
  const total = CHECKLIST.length;
  const bar = el('csProgressBar');
  const label = el('csProgressLabel');
  if (bar) bar.style.width = `${Math.round((done / total) * 100)}%`;
  if (label) label.textContent = `${done}/${total} volets documentés`;
  const list = el('csProgressList');
  if (list) {
    list.innerHTML = '';
    CHECKLIST.forEach((c) => {
      const li = document.createElement('li');
      li.className = c.ok() ? 'ok' : '';
      li.textContent = (c.ok() ? '✓ ' : '· ') + c.label;
      list.appendChild(li);
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// Génération PDF
// ─────────────────────────────────────────────────────────────────

const PAGE_W = 210, PAGE_H = 297, MARGIN = 18;
const CONTENT = PAGE_W - MARGIN * 2;

const C_BLACK: [number, number, number] = [12, 12, 18];
const C_WHITE: [number, number, number] = [255, 255, 255];
const C_MUTED: [number, number, number] = [110, 110, 130];
const C_BORDER: [number, number, number] = [205, 205, 218];
const C_SECTION: [number, number, number] = [238, 238, 246];
const C_BOX: [number, number, number] = [250, 250, 253];

interface PdfCtx {
  doc: any;
  y: number;
  id: string;
  titleBand: string;
}

function newPdf(id: string, titleBand: string): PdfCtx {
  const jsPDF = window.jspdf.jsPDF;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  return { doc, y: MARGIN, id, titleBand };
}

function drawBand(c: PdfCtx, continuation: boolean): void {
  const { doc } = c;
  doc.setFillColor(...C_BLACK);
  doc.rect(0, 0, PAGE_W, 22, 'F');
  doc.setFont('Courier', 'bold'); doc.setFontSize(9); doc.setTextColor(...C_WHITE);
  doc.text('SOUNDSYSTEMHARDENING.FR', MARGIN, 10);
  doc.setFont('Courier', 'normal'); doc.setFontSize(7); doc.setTextColor(185, 185, 205);
  doc.text(continuation ? c.titleBand + ' - SUITE' : c.titleBand, PAGE_W / 2, 10, { align: 'center' });
  doc.text('ID : ' + c.id, PAGE_W - MARGIN, 10, { align: 'right' });
  doc.text('CC BY-SA 4.0', MARGIN, 17);
  doc.text('DOCUMENT GÉNÉRÉ LOCALEMENT - AUCUNE DONNÉE TRANSMISE', PAGE_W / 2, 17, { align: 'center' });
  doc.text('Page ' + doc.getCurrentPageInfo().pageNumber, PAGE_W - MARGIN, 17, { align: 'right' });
}

function checkPage(c: PdfCtx, needed: number): void {
  if (c.y + needed > PAGE_H - MARGIN) {
    c.doc.addPage();
    drawBand(c, true);
    c.y = 30;
  }
}

function sectionTitle(c: PdfCtx, title: string): void {
  checkPage(c, 16);
  c.doc.setFillColor(...C_SECTION);
  c.doc.rect(MARGIN, c.y, CONTENT, 8, 'F');
  c.doc.setDrawColor(...C_BORDER);
  c.doc.rect(MARGIN, c.y, CONTENT, 8, 'S');
  c.doc.setFont('Helvetica', 'bold'); c.doc.setFontSize(9); c.doc.setTextColor(...C_BLACK);
  c.doc.text(title.toUpperCase(), MARGIN + 4, c.y + 5.5);
  c.y += 12;
}

function row(c: PdfCtx, label: string, value: string): void {
  if (!value) return;
  const lines = c.doc.splitTextToSize(value, CONTENT - 62);
  const h = Math.max(7, lines.length * 4.6 + 2.4);
  checkPage(c, h + 1);
  c.doc.setFont('Helvetica', 'bold'); c.doc.setFontSize(7.5); c.doc.setTextColor(...C_MUTED);
  c.doc.text(label.toUpperCase(), MARGIN, c.y + 4);
  c.doc.setFont('Helvetica', 'normal'); c.doc.setFontSize(9.5); c.doc.setTextColor(...C_BLACK);
  lines.forEach((line: string, i: number) => c.doc.text(line, MARGIN + 60, c.y + 4 + i * 4.6));
  c.y += h;
}

function fieldBox(c: PdfCtx, label: string, value: string): void {
  if (!value) return;
  const lines = c.doc.splitTextToSize(value, CONTENT - 8);
  const h = Math.max(10, lines.length * 4.6 + 5);
  checkPage(c, h + 9);
  c.doc.setFont('Helvetica', 'bold'); c.doc.setFontSize(7.5); c.doc.setTextColor(...C_MUTED);
  c.doc.text(label.toUpperCase(), MARGIN, c.y + 4);
  c.y += 5;
  c.doc.setFillColor(...C_BOX); c.doc.setDrawColor(...C_BORDER);
  c.doc.rect(MARGIN, c.y, CONTENT, h, 'FD');
  c.doc.setFont('Helvetica', 'normal'); c.doc.setFontSize(9.5); c.doc.setTextColor(...C_BLACK);
  lines.forEach((line: string, i: number) => c.doc.text(line, MARGIN + 4, c.y + 5.5 + i * 4.6));
  c.y += h + 4;
}

function callout(c: PdfCtx, title: string, body: string): void {
  const lines = c.doc.splitTextToSize(body, CONTENT - 10);
  const h = lines.length * 4.4 + (title ? 12 : 7);
  checkPage(c, h + 4);
  c.doc.setFillColor(246, 246, 251);
  c.doc.setDrawColor(...C_BORDER);
  c.doc.setLineWidth(0.2);
  c.doc.rect(MARGIN, c.y, CONTENT, h, 'FD');
  c.doc.setFillColor(...C_BLACK);
  c.doc.rect(MARGIN, c.y, 1.4, h, 'F');
  let ty = c.y + 6;
  if (title) {
    c.doc.setFont('Helvetica', 'bold'); c.doc.setFontSize(8); c.doc.setTextColor(...C_BLACK);
    c.doc.text(title.toUpperCase(), MARGIN + 5, ty);
    ty += 5.5;
  }
  c.doc.setFont('Helvetica', 'normal'); c.doc.setFontSize(8.6); c.doc.setTextColor(60, 60, 75);
  lines.forEach((line: string, i: number) => c.doc.text(line, MARGIN + 5, ty + i * 4.4));
  c.y += h + 5;
}

function bulletList(c: PdfCtx, items: string[]): void {
  for (const item of items) {
    const lines = c.doc.splitTextToSize(item, CONTENT - 10);
    checkPage(c, lines.length * 4.6 + 2);
    c.doc.setFont('Helvetica', 'normal'); c.doc.setFontSize(9.2); c.doc.setTextColor(...C_BLACK);
    c.doc.text('•', MARGIN + 1.5, c.y + 4);
    lines.forEach((line: string, i: number) => c.doc.text(line, MARGIN + 6, c.y + 4 + i * 4.6));
    c.y += lines.length * 4.6 + 1.6;
  }
  c.y += 2;
}

function photoGrid(c: PdfCtx, photos: PhotoItem[], prefix: string): void {
  const cellW = (CONTENT - 6) / 2;
  for (let i = 0; i < photos.length; i += 2) {
    const pair = photos.slice(i, i + 2);
    const heights = pair.map((p) => Math.min(78, (cellW * p.h) / p.w));
    const rowH = Math.max(...heights) + 9;
    checkPage(c, rowH + 4);
    pair.forEach((p, j) => {
      const x = MARGIN + j * (cellW + 6);
      const imgH = Math.min(78, (cellW * p.h) / p.w);
      const imgW = Math.min(cellW, (imgH * p.w) / p.h);
      try {
        c.doc.addImage(p.dataUrl, 'JPEG', x, c.y, imgW, imgH);
        c.doc.setDrawColor(...C_BORDER);
        c.doc.rect(x, c.y, imgW, imgH, 'S');
      } catch { /* image corrompue : ignorée */ }
      c.doc.setFont('Courier', 'normal'); c.doc.setFontSize(6.5); c.doc.setTextColor(...C_MUTED);
      c.doc.text(`${prefix} ${i + j + 1} - ${p.name}`.slice(0, 64), x, c.y + imgH + 4);
    });
    c.y += rowH + 3;
  }
}

function signatureLine(c: PdfCtx, label: string): void {
  checkPage(c, 13);
  c.doc.setFont('Helvetica', 'bold'); c.doc.setFontSize(7.5); c.doc.setTextColor(...C_MUTED);
  c.doc.text(label.toUpperCase(), MARGIN, c.y + 4);
  c.doc.setDrawColor(120, 120, 140);
  c.doc.setLineDashPattern([1, 1], 0);
  c.doc.line(MARGIN + 60, c.y + 4, PAGE_W - MARGIN, c.y + 4);
  c.doc.setLineDashPattern([], 0);
  c.y += 10;
}

// ── Collecte des données ──────────────────────────────────────────

interface DossierData {
  id: string;
  generatedAt: string;
  phase: string;
  hideGps: boolean;
  [k: string]: any;
}

function collect(): DossierData {
  return {
    id: genId(),
    generatedAt: new Date().toLocaleString('fr-FR'),
    phase: radio('phase') || 'pre',
    hideGps: checked('f-opt-hide-gps'),
    // Fiche événement
    nom: val('f-nom'), commune: val('f-commune'), dept: val('f-dept'),
    dateDebut: val('f-date-debut'), dateFin: val('f-date-fin'),
    heureDebut: val('f-heure-debut'), heureFin: val('f-heure-fin'),
    effectif: val('f-effectif'),
    // Site
    lieuDit: val('f-lieu-dit'), gps: val('f-gps'), surface: val('f-surface'),
    terrain: val('f-terrain'), accesDesc: val('f-acces-desc'),
    // Foncier
    foncier: radio('foncier'),
    proprioNom: val('f-proprio-nom'), proprioDate: val('f-proprio-date'),
    proprioModalites: val('f-proprio-modalites'),
    demarcheDetail: val('f-demarche-detail'),
    // Démarches
    declaration: radio('declaration'),
    declDate: val('f-decl-date'), declPref: val('f-decl-pref'),
    ctMairie: checked('f-ct-mairie'), ctGendarmerie: checked('f-ct-gendarmerie'),
    ctSdis: checked('f-ct-sdis'), ctRiverains: checked('f-ct-riverains'),
    ctDetail: val('f-ct-detail'),
    // Incendie
    extNb: val('f-ext-nb'), extTypes: val('f-ext-types'), extEmplacements: val('f-ext-emplacements'),
    pointEau: val('f-point-eau'), zoneFumeur: checked('f-zone-fumeur'),
    interditFeux: checked('f-interdit-feux'), debroussaillage: checked('f-debroussaillage'),
    genNb: val('f-gen-nb'), genDistance: val('f-gen-distance'),
    genRetention: checked('f-gen-retention'), genExtincteur: checked('f-gen-extincteur'),
    // Accès secours
    voieAcces: checked('f-voie-acces'), pointRencontre: val('f-point-rencontre'),
    itineraire: val('f-itineraire'), pointRassemblement: val('f-point-rassemblement'),
    balisage: checked('f-balisage'), referentSecours: val('f-referent-secours'),
    // Sanitaire
    secouristes: val('f-secouristes'), formation: val('f-formation'),
    posteSecours: checked('f-poste-secours'), trousse: checked('f-trousse'),
    eauGratuite: checked('f-eau-gratuite'), bouchons: checked('f-bouchons'),
    assocRdr: val('f-assoc-rdr'), chillOut: checked('f-chill-out'),
    affichageUrgence: checked('f-affichage-urgence'),
    // Acoustique
    distHabitation: val('f-dist-habitation'), engagementHoraire: val('f-engagement-horaire'),
    orientationStack: val('f-orientation-stack'),
    // Environnement
    toilettes: val('f-toilettes'), triDechets: checked('f-tri-dechets'),
    sacs: checked('f-sacs'), remiseEtat: checked('f-remise-etat'),
    // Organisation
    referents: val('f-referents'), briefSecu: checked('f-brief-secu'),
    procedureIncident: val('f-procedure-incident'), parking: val('f-parking'),
    // Bilan (phase post)
    finEffective: val('f-fin-effective'), demontage: val('f-demontage'),
    dechetsEvacues: checked('f-dechets-evacues'), etatSortie: val('f-etat-sortie'),
    incidents: val('f-incidents'), restitution: checked('f-restitution'),
  };
}

// ── Construction du dossier ───────────────────────────────────────

function buildPdf(d: DossierData): void {
  const isPost = d.phase === 'post';
  const bandTitle = isPost ? 'DOSSIER DE SÉCURITÉ ET BILAN DE SITE' : 'DOSSIER DE SÉCURITÉ';
  const c = newPdf(d.id, bandTitle + ' - Compliance-Shield');
  const doc = c.doc;
  const effectif = parseInt(d.effectif, 10) || 0;

  // ════ PAGE DE COUVERTURE ════
  drawBand(c, false);
  c.y = 52;

  doc.setFont('Helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(...C_BLACK);
  doc.text('DOSSIER DE SÉCURITÉ', PAGE_W / 2, c.y, { align: 'center' });
  c.y += 10;
  doc.setFontSize(13); doc.setTextColor(...C_MUTED);
  doc.text(isPost ? 'RASSEMBLEMENT FESTIF - BILAN DE SITE' : 'RASSEMBLEMENT FESTIF À CARACTÈRE MUSICAL', PAGE_W / 2, c.y, { align: 'center' });
  c.y += 14;

  doc.setDrawColor(...C_BORDER);
  doc.line(MARGIN + 30, c.y, PAGE_W - MARGIN - 30, c.y);
  c.y += 12;

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...C_BLACK);
  if (d.nom) { doc.text(d.nom, PAGE_W / 2, c.y, { align: 'center' }); c.y += 7; }
  const lieuLine = [d.commune, d.dept].filter(Boolean).join(' - ');
  if (lieuLine) { doc.text(lieuLine, PAGE_W / 2, c.y, { align: 'center' }); c.y += 7; }
  const periode = [fmtDateFr(d.dateDebut), fmtDateFr(d.dateFin)].filter(Boolean).join(' au ');
  if (periode) { doc.text(periode, PAGE_W / 2, c.y, { align: 'center' }); c.y += 7; }
  c.y += 8;

  // Bloc identifiant
  doc.setFillColor(...C_BLACK);
  doc.rect(MARGIN + 25, c.y, CONTENT - 50, 16, 'F');
  doc.setFont('Courier', 'bold'); doc.setFontSize(8); doc.setTextColor(...C_WHITE);
  doc.text('IDENTIFIANT DOCUMENT', PAGE_W / 2, c.y + 6, { align: 'center' });
  doc.setFont('Courier', 'normal'); doc.setFontSize(11);
  doc.text(d.id, PAGE_W / 2, c.y + 12.5, { align: 'center' });
  c.y += 24;

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C_MUTED);
  doc.text('Généré le ' + d.generatedAt + ' - Outil Compliance-Shield (SoundSystemHardening.fr)', PAGE_W / 2, c.y, { align: 'center' });
  c.y += 12;

  // Objet du document
  callout(c, 'Objet du document',
    'Le présent dossier recense les mesures de sécurité, de prévention et de protection effectivement mises en place sur le site. ' +
    'Il est destiné à être porté à la connaissance de toute autorité administrative ou judiciaire intervenant sur les lieux, ' +
    'ainsi qu\'à documenter l\'état du site avant et après l\'événement. Il est établi sous la responsabilité de ses rédacteurs ' +
    'et a vocation à servir de pièce dans le cadre de tout échange ou recours ultérieur.');

  // Encadré conditionnel : régime déclaratif (preuve positive uniquement)
  if (effectif > 0 && effectif < 500) {
    callout(c, 'Régime applicable',
      `L'effectif attendu (${effectif} personnes) est inférieur au seuil fixé par l'article R211-2 du Code de la sécurité intérieure ` +
      '(500 personnes). Le rassemblement n\'entre pas dans le champ de l\'obligation de déclaration préalable prévue par l\'article L211-5 du même code.');
  } else if (d.declaration === 'faite' && d.declDate) {
    callout(c, 'Déclaration préalable',
      `Une déclaration préalable a été déposée le ${fmtDateFr(d.declDate)}` +
      (d.declPref ? ` auprès de la préfecture de ${d.declPref}` : '') +
      ' au titre de l\'article L211-5 du Code de la sécurité intérieure.' +
      (state.pieceRecepisse.length ? ' Récépissé joint en annexe.' : ''));
  } else if (d.declaration === 'encours' && d.declDate) {
    callout(c, 'Déclaration préalable',
      `Un dossier de déclaration a été transmis le ${fmtDateFr(d.declDate)}` +
      (d.declPref ? ` à la préfecture de ${d.declPref}` : '') + ' (en cours d\'instruction).');
  }

  // ════ SYNTHÈSE ════
  doc.addPage(); drawBand(c, true); c.y = 30;
  sectionTitle(c, 'Synthèse du dispositif de sécurité');

  doc.setFont('Helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C_BLACK);
  const synth: Array<[string, string]> = [];
  if (parseInt(d.extNb, 10) > 0) synth.push(['Lutte contre l\'incendie', `${d.extNb} extincteur(s)${d.extTypes ? ' (' + d.extTypes + ')' : ''} répartis sur site`]);
  if (d.voieAcces) synth.push(['Accès secours', 'Voie d\'accès maintenue dégagée pour les véhicules de secours (SDIS)']);
  if (d.pointRencontre) synth.push(['Point de rencontre secours', d.pointRencontre]);
  if (parseInt(d.secouristes, 10) > 0) synth.push(['Premiers secours', `${d.secouristes} personne(s) formée(s)${d.formation ? ' (' + d.formation + ')' : ''} présente(s)`]);
  if (d.posteSecours) synth.push(['Poste de secours', 'Point de premiers soins identifié et signalé']);
  if (d.assocRdr) synth.push(['Réduction des risques', d.assocRdr]);
  if (d.eauGratuite) synth.push(['Eau potable', 'Accès gratuit à l\'eau potable']);
  if (state.soundcheck || d.distHabitation) synth.push(['Acoustique', state.soundcheck ? 'Simulation prévisionnelle réalisée (rapport SoundCheck intégré)' : `Première habitation à ${d.distHabitation}`]);
  if (d.remiseEtat) synth.push(['Site', 'Engagement de remise en état et d\'évacuation des déchets']);
  if (state.photosAvant.length) synth.push(['État des lieux', `Documenté par ${state.photosAvant.length} photographie(s) horodatée(s) en annexe`]);
  if (isPost && d.restitution) synth.push(['Restitution du site', 'Site restitué nettoyé, état documenté en annexe']);

  if (synth.length) {
    for (const [k, v] of synth) row(c, k, v);
    c.y += 4;
  }

  // Analyse au regard de l'art. 223-1 CP
  callout(c, 'Cadre de sécurité - analyse',
    'Le délit de mise en danger d\'autrui (article 223-1 du Code pénal) suppose la violation manifestement délibérée d\'une obligation ' +
    'particulière de prudence ou de sécurité imposée par la loi ou le règlement, exposant directement autrui à un risque immédiat de mort ' +
    'ou de blessures graves. Les mesures recensées dans le présent dossier, vérifiables sur site, attestent au contraire d\'une démarche ' +
    'active de prévention des risques (incendie, secours, santé, nuisances sonores).');

  // ════ 01 - FICHE ÉVÉNEMENT ════
  sectionTitle(c, '01 - Fiche événement');
  row(c, 'Commune', d.commune);
  row(c, 'Département', d.dept);
  row(c, 'Lieu-dit / parcelle', d.lieuDit);
  if (d.gps && !d.hideGps) row(c, 'Coordonnées GPS', d.gps);
  row(c, 'Période', periode + (d.heureDebut ? ` (${d.heureDebut}${d.heureFin ? ' - ' + d.heureFin : ''})` : ''));
  row(c, 'Effectif attendu', d.effectif ? d.effectif + ' personnes' : '');
  row(c, 'Surface utilisée', d.surface);
  row(c, 'Nature du terrain', d.terrain);
  fieldBox(c, 'Description des accès', d.accesDesc);
  c.y += 2;

  // ════ 02 - STATUT FONCIER (conditionnel, preuve positive) ════
  const foncierLabel: Record<string, string> = {
    ecrit: 'Occupation consentie par accord écrit du propriétaire',
    verbal: 'Occupation consentie par accord verbal du propriétaire',
    public: 'Terrain relevant du domaine public ou espace ouvert au public',
    demarche: 'Démarches d\'identification et de contact du propriétaire engagées',
  };
  if (foncierLabel[d.foncier]) {
    sectionTitle(c, '02 - Statut d\'occupation du terrain');
    row(c, 'Statut', foncierLabel[d.foncier]);
    if (d.foncier === 'ecrit' || d.foncier === 'verbal') {
      row(c, 'Accord donné par', d.proprioNom);
      row(c, 'Date de l\'accord', fmtDateFr(d.proprioDate));
      fieldBox(c, 'Modalités convenues', d.proprioModalites);
      if (d.foncier === 'ecrit' && state.pieceFoncier.length) {
        row(c, 'Pièce', 'Accord écrit reproduit en annexe');
      }
      callout(c, '',
        'L\'occupation des lieux procède d\'un consentement du maître des lieux. L\'incrimination d\'introduction ou de maintien ' +
        'dans le domicile ou le terrain d\'autrui (article 226-4 du Code pénal) suppose l\'absence d\'un tel consentement.');
    }
    if (d.foncier === 'demarche') fieldBox(c, 'Démarches effectuées', d.demarcheDetail);
    c.y += 2;
  }

  // ════ 03 - DIALOGUE ET DÉMARCHES PRÉALABLES ════
  const contacts: string[] = [];
  if (d.ctMairie) contacts.push('Mairie de la commune d\'implantation');
  if (d.ctGendarmerie) contacts.push('Brigade de gendarmerie territorialement compétente');
  if (d.ctSdis) contacts.push('Service départemental d\'incendie et de secours (SDIS)');
  if (d.ctRiverains) contacts.push('Riverains et habitations les plus proches');
  if (contacts.length || d.ctDetail) {
    sectionTitle(c, '03 - Information et dialogue préalables');
    if (contacts.length) {
      c.doc.setFont('Helvetica', 'bold'); c.doc.setFontSize(7.5); c.doc.setTextColor(...C_MUTED);
      c.doc.text('INTERLOCUTEURS CONTACTÉS OU INFORMÉS', MARGIN, c.y + 4);
      c.y += 7;
      bulletList(c, contacts);
    }
    fieldBox(c, 'Détail des échanges (dates, interlocuteurs, canaux)', d.ctDetail);
    c.y += 2;
  }

  // ════ 04 - SÉCURITÉ INCENDIE ════
  const hasIncendie = parseInt(d.extNb, 10) > 0 || d.pointEau || d.interditFeux || d.debroussaillage || d.zoneFumeur;
  if (hasIncendie) {
    sectionTitle(c, '04 - Prévention et lutte contre l\'incendie');
    if (parseInt(d.extNb, 10) > 0) {
      row(c, 'Extincteurs', `${d.extNb} unité(s)` + (d.extTypes ? ` - types : ${d.extTypes}` : ''));
      fieldBox(c, 'Emplacements des extincteurs', d.extEmplacements);
    }
    row(c, 'Point d\'eau', d.pointEau);
    const mesuresFeu: string[] = [];
    if (d.interditFeux) mesuresFeu.push('Interdiction des feux ouverts sur l\'ensemble du site, consigne diffusée aux participants');
    if (d.zoneFumeur) mesuresFeu.push('Zone fumeur unique délimitée, équipée de récipients pour mégots');
    if (d.debroussaillage) mesuresFeu.push('Abords du dispositif technique dégagés de la végétation sèche');
    if (mesuresFeu.length) bulletList(c, mesuresFeu);
    if (parseInt(d.genNb, 10) > 0) {
      row(c, 'Groupes électrogènes', `${d.genNb} unité(s)` + (d.genDistance ? ` - distance public : ${d.genDistance}` : ''));
      const genMesures: string[] = [];
      if (d.genRetention) genMesures.push('Stockage carburant sur bac de rétention, à l\'écart du public');
      if (d.genExtincteur) genMesures.push('Extincteur dédié à proximité immédiate de chaque groupe électrogène');
      if (genMesures.length) bulletList(c, genMesures);
    }
    c.y += 2;
  }

  // ════ 05 - ACCÈS ET ÉVACUATION SECOURS ════
  const hasSecours = d.voieAcces || d.pointRencontre || d.pointRassemblement || d.referentSecours;
  if (hasSecours) {
    sectionTitle(c, '05 - Accès des secours et évacuation');
    const acc: string[] = [];
    if (d.voieAcces) acc.push('Voie d\'accès au site maintenue libre en permanence pour les véhicules de secours (largeur utile 3 m minimum, aucun stationnement)');
    if (d.balisage) acc.push('Itinéraire d\'accès secours balisé depuis la voie publique');
    if (acc.length) bulletList(c, acc);
    row(c, 'Point de rencontre secours', d.pointRencontre);
    fieldBox(c, 'Itinéraire d\'accès depuis la route', d.itineraire);
    row(c, 'Point de rassemblement', d.pointRassemblement);
    row(c, 'Référent secours joignable', d.referentSecours);
    c.y += 2;
  }

  // ════ 06 - DISPOSITIF SANITAIRE ET RÉDUCTION DES RISQUES ════
  const hasSanitaire = parseInt(d.secouristes, 10) > 0 || d.posteSecours || d.assocRdr || d.eauGratuite;
  if (hasSanitaire) {
    sectionTitle(c, '06 - Dispositif sanitaire et réduction des risques');
    if (parseInt(d.secouristes, 10) > 0) row(c, 'Secouristes présents', `${d.secouristes} personne(s)` + (d.formation ? ` - formation : ${d.formation}` : ''));
    const san: string[] = [];
    if (d.posteSecours) san.push('Poste de premiers soins identifié, signalé et accessible');
    if (d.trousse) san.push('Trousses de premiers secours disponibles sur site');
    if (d.eauGratuite) san.push('Eau potable en accès libre et gratuit');
    if (d.bouchons) san.push('Protections auditives (bouchons) mises à disposition');
    if (d.chillOut) san.push('Espace de repos au calme (chill-out) aménagé');
    if (d.affichageUrgence) san.push('Numéros d\'urgence (15 / 18 / 112) affichés aux points de passage');
    if (san.length) bulletList(c, san);
    row(c, 'Association de réduction des risques', d.assocRdr);
    c.y += 2;
  }

  // ════ 07 - MAÎTRISE DE L'IMPACT ACOUSTIQUE ════
  if (state.soundcheck || d.distHabitation || d.engagementHoraire) {
    sectionTitle(c, '07 - Maîtrise de l\'impact acoustique');
    row(c, 'Première habitation', d.distHabitation);
    row(c, 'Orientation du dispositif', d.orientationStack);
    fieldBox(c, 'Engagements de modération (horaires, niveaux)', d.engagementHoraire);
    if (state.soundcheck) {
      callout(c, 'Simulation acoustique prévisionnelle',
        'Une simulation de propagation sonore a été réalisée en amont avec l\'outil SoundCheck (norme ISO 9613-2, diffraction de Maekawa ' +
        'sur relief réel). Les indicateurs ci-dessous en sont extraits' + (state.soundcheck.importedAt ? ` (import du ${state.soundcheck.importedAt})` : '') + '.');
      for (const [k, v] of Object.entries(state.soundcheck.raw)) {
        if (d.hideGps && /point source/i.test(k)) continue;
        row(c, k.replace(/\s*\(.*\)\s*$/, ''), v);
      }
    }
    c.y += 2;
  }

  // ════ 08 - GESTION ENVIRONNEMENTALE ════
  const hasEnv = d.toilettes || d.triDechets || d.sacs || d.remiseEtat;
  if (hasEnv) {
    sectionTitle(c, '08 - Gestion environnementale du site');
    row(c, 'Sanitaires', d.toilettes);
    const env: string[] = [];
    if (d.sacs) env.push('Sacs poubelle distribués aux participants à l\'arrivée');
    if (d.triDechets) env.push('Points de collecte et de tri des déchets installés sur site');
    if (d.remiseEtat) env.push('Engagement de remise en état complète du terrain et d\'évacuation de l\'intégralité des déchets');
    if (env.length) bulletList(c, env);
    c.y += 2;
  }

  // ════ 09 - ORGANISATION INTERNE ════
  if (d.referents || d.procedureIncident || d.parking) {
    sectionTitle(c, '09 - Organisation et gestion du site');
    fieldBox(c, 'Référents et rôles', d.referents);
    if (d.briefSecu) bulletList(c, ['Briefing sécurité réalisé avec l\'ensemble des référents avant ouverture du site']);
    fieldBox(c, 'Procédure en cas d\'incident', d.procedureIncident);
    fieldBox(c, 'Stationnement et gestion des flux de véhicules', d.parking);
    c.y += 2;
  }

  // ════ 10 - BILAN DE SORTIE (phase post) ════
  if (isPost) {
    sectionTitle(c, '10 - Bilan et restitution du site');
    row(c, 'Fin effective de la diffusion sonore', d.finEffective);
    row(c, 'Démontage du dispositif', d.demontage);
    const bil: string[] = [];
    if (d.dechetsEvacues) bil.push('Intégralité des déchets collectés et évacués du site');
    if (d.restitution) bil.push('Site restitué nettoyé, état documenté par photographies en annexe');
    if (bil.length) bulletList(c, bil);
    fieldBox(c, 'État des lieux de sortie', d.etatSortie);
    fieldBox(c, 'Observations', d.incidents);
    c.y += 2;
  }

  // ════ PAGE DE REMISE ════
  if (checked('f-opt-remise')) {
    doc.addPage(); drawBand(c, true); c.y = 30;
    sectionTitle(c, 'Remise du présent dossier');
    callout(c, '',
      'Le présent dossier a été remis en main propre à l\'autorité identifiée ci-dessous, qui en a pris connaissance. ' +
      'Cette remise porte à la connaissance de l\'autorité les mesures de sécurité effectives sur le site à la date et l\'heure indiquées. ' +
      'En cas de refus de réception, mention en est portée ci-dessous en présence du témoin.');
    c.y += 2;
    signatureLine(c, 'Remis à (nom / matricule)');
    signatureLine(c, 'Qualité (OPJ, APJ, gendarme...)');
    signatureLine(c, 'Unité / service');
    signatureLine(c, 'Date et heure de remise');
    signatureLine(c, 'Lieu de remise');
    signatureLine(c, 'Témoin de la remise (nom)');
    signatureLine(c, 'Signature du remettant');
    signatureLine(c, 'Observations (refus de réception, etc.)');
    c.y += 4;
    callout(c, 'En cas de saisie de matériel',
      'Toute saisie opérée sur le fondement de l\'article L211-15 du Code de la sécurité intérieure donne lieu à l\'établissement d\'un état ' +
      'du matériel saisi. Il est recommandé de documenter immédiatement la saisie (outil TimeSeal, soundsystemhardening.fr/timeseal) et de ' +
      'conserver le présent dossier à l\'appui de tout recours (référé, article L521-2 du Code de justice administrative, recours indemnitaire).');
  }

  // ════ ANNEXES PHOTO ════
  if (state.photosAvant.length) {
    doc.addPage(); drawBand(c, true); c.y = 30;
    sectionTitle(c, 'Annexe A - État des lieux d\'entrée (photographies)');
    callout(c, '', 'Photographies prises avant installation du dispositif. Images ré-encodées localement, métadonnées supprimées. ' +
      'Elles documentent l\'état initial du terrain.');
    photoGrid(c, state.photosAvant, 'A');
  }
  if (isPost && state.photosApres.length) {
    doc.addPage(); drawBand(c, true); c.y = 30;
    sectionTitle(c, 'Annexe B - État des lieux de sortie (photographies)');
    callout(c, '', 'Photographies prises après démontage et nettoyage. Elles documentent l\'état du terrain à la restitution, ' +
      'à rapprocher de l\'annexe A.');
    photoGrid(c, state.photosApres, 'B');
  }
  if (state.pieceFoncier.length) {
    doc.addPage(); drawBand(c, true); c.y = 30;
    sectionTitle(c, 'Annexe C - Accord du propriétaire');
    photoGrid(c, state.pieceFoncier, 'C');
  }
  if (state.pieceRecepisse.length) {
    doc.addPage(); drawBand(c, true); c.y = 30;
    sectionTitle(c, 'Annexe D - Récépissé de déclaration');
    photoGrid(c, state.pieceRecepisse, 'D');
  }

  // ════ ANNEXE JURIDIQUE ════
  if (checked('f-opt-annexe-juridique')) {
    doc.addPage(); drawBand(c, true); c.y = 30;
    sectionTitle(c, 'Annexe - Références juridiques');
    const refs: Array<[string, string]> = [
      ['Art. L211-5 CSI', 'Régime de déclaration préalable des rassemblements festifs à caractère musical dépassant le seuil fixé par décret.'],
      ['Art. R211-2 CSI', 'Caractéristiques des rassemblements soumis à déclaration ; seuil actuellement fixé à 500 participants.'],
      ['Art. R211-27 CSI', 'Contravention de 5e classe en cas d\'organisation sans déclaration ; confiscation du matériel sur décision du tribunal.'],
      ['Art. L211-15 CSI', 'Saisie administrative du matériel utilisé, pour une durée maximale de six mois, en vue de sa confiscation éventuelle.'],
      ['Art. 223-1 Code pénal', 'Mise en danger d\'autrui : exige la violation manifestement délibérée d\'une obligation particulière de sécurité et l\'exposition directe à un risque immédiat de mort ou de blessures graves.'],
      ['Art. 226-4 Code pénal', 'Atteinte au domicile ou au terrain d\'autrui : suppose l\'absence de consentement du maître des lieux.'],
      ['Art. L521-2 CJA', 'Référé-liberté : le juge administratif peut ordonner toute mesure nécessaire à la sauvegarde d\'une liberté fondamentale sous 48 heures.'],
    ];
    for (const [k, v] of refs) row(c, k, v);
    c.y += 4;
    callout(c, 'Avertissement',
      'Le présent document est un outil de documentation établi par les organisateurs. Il ne constitue pas un conseil juridique ' +
      'et ne se substitue à aucune obligation légale. Les références ci-dessus sont reproduites à titre informatif (source : Légifrance).');
  }

  doc.save(d.id + '.pdf');
}

// ─────────────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────────────

function init(): void {
  const form = el<HTMLFormElement>('csForm');
  if (!form) return;

  // Photos
  bindPhotoInput('f-photos-avant', 'zoneAvant', 'previewAvant', state.photosAvant, MAX_PHOTOS);
  bindPhotoInput('f-photos-apres', 'zoneApres', 'previewApres', state.photosApres, MAX_PHOTOS);
  bindPhotoInput('f-piece-foncier', 'zoneFoncier', 'previewFoncier', state.pieceFoncier, MAX_PIECES);
  bindPhotoInput('f-piece-recepisse', 'zoneRecepisse', 'previewRecepisse', state.pieceRecepisse, MAX_PIECES);

  // Import SoundCheck : fichier ou collage
  el<HTMLInputElement>('sc-file')?.addEventListener('change', (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => applySoundCheckImport(String(r.result));
    r.readAsText(f);
    (e.target as HTMLInputElement).value = '';
  });
  el('sc-paste-btn')?.addEventListener('click', () => {
    const ta = el<HTMLTextAreaElement>('sc-paste');
    if (ta && ta.value.trim()) applySoundCheckImport(ta.value);
  });

  // Conditionnels + autosave + progression
  form.addEventListener('input', () => { syncConditionals(); refreshProgress(); scheduleAutosave(); });
  form.addEventListener('change', () => { syncConditionals(); refreshProgress(); scheduleAutosave(); });

  // Actions
  el('btnExportJson')?.addEventListener('click', exportJson);
  el<HTMLInputElement>('importJsonFile')?.addEventListener('change', (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) importJson(f);
    (e.target as HTMLInputElement).value = '';
  });
  el('btnImportJson')?.addEventListener('click', () => el<HTMLInputElement>('importJsonFile')?.click());
  el('btnPurge')?.addEventListener('click', purgeAll);

  // Génération
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const err: string[] = [];
    if (!val('f-commune')) err.push('Commune');
    if (!val('f-dept')) err.push('Département');
    if (!val('f-date-debut')) err.push('Date de début');
    if (!val('f-effectif')) err.push('Effectif attendu');
    const errEl = el('csError');
    if (err.length) {
      if (errEl) {
        errEl.textContent = 'Champs requis manquants : ' + err.join(', ') + '.';
        errEl.style.display = 'block';
        errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (errEl) errEl.style.display = 'none';
    if (!window.jspdf) {
      if (errEl) { errEl.textContent = 'Librairie PDF non chargée. Vérifie ta connexion puis recharge la page.'; errEl.style.display = 'block'; }
      return;
    }
    const btn = el<HTMLButtonElement>('btnGenerate');
    const lbl = el('btnLabel');
    if (btn) btn.disabled = true;
    if (lbl) lbl.textContent = 'Génération en cours...';
    try {
      buildPdf(collect());
    } finally {
      if (btn) btn.disabled = false;
      if (lbl) lbl.textContent = '⛨ GÉNÉRER LE DOSSIER PDF';
    }
  });

  restoreAutosave();
  syncConditionals();
  refreshProgress();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
