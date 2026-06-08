// scripts/sync-airtable.mjs
// Recupere les incidents valides depuis Airtable et ecrit src/data/incidents.json.
// Lance par GitHub Action toutes les heures. Aucune dependance externe (fetch natif Node 18+).
//
// Variables d'environnement attendues (injectees par GitHub Secrets) :
//   AIRTABLE_TOKEN    -> Personal Access Token Airtable (scope data.records:read)
//   AIRTABLE_BASE_ID  -> identifiant de la base (commence par "app...")
//   AIRTABLE_TABLE    -> nom de la table (defaut: "Incidents")

import { readFile, writeFile } from 'node:fs/promises';

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE  = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE || 'Incidents';
const OUT   = 'src/data/incidents.json';

if (!TOKEN || !BASE) {
  console.error('ERREUR : AIRTABLE_TOKEN et AIRTABLE_BASE_ID sont requis.');
  process.exit(1);
}

const TYPE_MAP = {
  'Charge / intervention':  'charge',
  'Blessure / mutilation':  'blessure',
  'Saisie de materiel':     'saisie',
  'Saisie de matériel':     'saisie',
  'GAV / interpellation':   'gav',
  'Interdiction prefectorale':  'interdiction',
  'Interdiction préfectorale':  'interdiction',
  'Autre': 'autre',
};

function normType(v) {
  if (!v) return 'autre';
  return TYPE_MAP[v] || String(v).toLowerCase().trim();
}

function str(v)  { return v ? String(v).trim() : ''; }
function num(v)  { const n = parseFloat(v); return Number.isNaN(n) ? null : n; }
function int(v)  { const n = parseInt(v, 10); return Number.isNaN(n) ? null : n; }

async function fetchAll() {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`);
    url.searchParams.set('filterByFormula', "{Statut}='Valide'");
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) {
      console.error(`ERREUR Airtable ${res.status}: ${await res.text()}`);
      process.exit(1);
    }
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

function mapRecord(r) {
  const f   = r.fields;
  const lat = parseFloat(f.Latitude);
  const lng = parseFloat(f.Longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return {
    // ── Champs de base ──────────────────────────────────────────────────────
    id:    r.id,
    lieu:  str(f.Lieu),
    lat,
    lng,
    date:  str(f.Date),
    type:  normType(f.Type),
    titre: str(f.Titre),
    desc:  str(f.Description),
    bilan: str(f.Bilan),
    source: str(f.Source),
    wiki:   str(f.Lien_Wiki),

    // ── Géographie & Administration ─────────────────────────────────────────
    departement: str(f.Departement),
    prefecture:  str(f.Prefecture),

    // ── Cadre légal ─────────────────────────────────────────────────────────
    ref_arrete:       str(f.Reference_Arrete),
    url_arrete:       str(f.URL_Arrete),
    type_operation:   str(f.Type_Operation),
    statut_juridique: str(f.Statut_Juridique),
    recours:          str(f.Recours_Engages),

    // ── Moyens déployés ─────────────────────────────────────────────────────
    effectifs:  int(f.Effectifs_Deployes),
    unites:     str(f.Unites),
    duree_h:    num(f.Duree_Intervention_h),
    helicopteres: int(f.Helicopteres) || 0,
    drones:       int(f.Drones) || 0,

    // ── Coût estimé ─────────────────────────────────────────────────────────
    cout_eur:     int(f.Cout_Estime_EUR),
    cout_methodo: str(f.Cout_Methodologie),
    source_cout:  str(f.Source_Cout),

    // ── Analyse juridique ───────────────────────────────────────────────────
    jurisprudence:   str(f.Jurisprudence),
    failles:         str(f.Failles_Identifiees),
    contre_mesures:  str(f.Contre_Mesures),
    arguments:       str(f.Arguments_Defense),
  };
}

// ── Lecture des incidents existants ─────────────────────────────────────────
// Les incidents dont l'ID ne commence pas par "rec" sont des entrées manuelles
// (ajoutées directement dans le JSON, pas via Airtable).
// Le sync ne doit jamais les écraser.
const AIRTABLE_ID = /^rec[A-Za-z0-9]{14,}$/;

const existingRaw = await readFile(OUT, 'utf8').catch(() => '[]');
const existing    = JSON.parse(existingRaw);
const manuals     = existing.filter(i => !AIRTABLE_ID.test(i.id));

// ── Récupération Airtable ────────────────────────────────────────────────────
const raw            = await fetchAll();
const fromAirtable   = raw.map(mapRecord).filter(Boolean);

// ── Fusion : Airtable en premier, puis manuels non-dupliqués ─────────────────
// Un manuel est considéré dupliqué si un enregistrement Airtable a le même
// couple (lieu normalisé + date). Cela permet d'éviter les doublons si un
// incident manuel est un jour ajouté dans Airtable.
const airtableKeys = new Set(
  fromAirtable.map(i => `${String(i.lieu).toLowerCase().trim()}|${i.date}`)
);
const dedupedManuals = manuals.filter(
  i => !airtableKeys.has(`${String(i.lieu).toLowerCase().trim()}|${i.date}`)
);

const incidents = [...fromAirtable, ...dedupedManuals]
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));

await writeFile(OUT, JSON.stringify(incidents, null, 2) + '\n', 'utf8');
console.log(
  `OK : ${fromAirtable.length} depuis Airtable + ${dedupedManuals.length} manuels = ${incidents.length} total`
);
