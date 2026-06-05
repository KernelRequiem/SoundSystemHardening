// scripts/sync-airtable.mjs
// Recupere les incidents valides depuis Airtable et ecrit src/data/incidents.json.
// Lance par GitHub Action toutes les heures. Aucune dependance externe (fetch natif Node 18+).
//
// Variables d'environnement attendues (injectees par GitHub Secrets) :
//   AIRTABLE_TOKEN    -> Personal Access Token Airtable (scope data.records:read)
//   AIRTABLE_BASE_ID  -> identifiant de la base (commence par "app...")
//   AIRTABLE_TABLE    -> nom de la table (defaut: "Incidents")

import { writeFile } from 'node:fs/promises';

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE || 'Incidents';
const OUT = 'src/data/incidents.json';

if (!TOKEN || !BASE) {
  console.error('ERREUR : AIRTABLE_TOKEN et AIRTABLE_BASE_ID sont requis.');
  process.exit(1);
}

// Normalise le libelle Airtable du Type vers une cle technique.
const TYPE_MAP = {
  'Charge / intervention': 'charge',
  'Blessure / mutilation': 'blessure',
  'Saisie de materiel': 'saisie',
  'Saisie de matériel': 'saisie',
  'GAV / interpellation': 'gav',
  'Interdiction prefectorale': 'interdiction',
  'Interdiction préfectorale': 'interdiction',
  'Autre': 'autre',
};

function normType(v) {
  if (!v) return 'autre';
  return TYPE_MAP[v] || String(v).toLowerCase().trim();
}

async function fetchAll() {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`);
    // Ne recupere que les cas valides par la moderation.
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
  const f = r.fields;
  const lat = parseFloat(f.Latitude);
  const lng = parseFloat(f.Longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null; // coord. invalides = ignore
  return {
    id: r.id,
    lieu: f.Lieu || '',
    lat,
    lng,
    date: f.Date || '',
    type: normType(f.Type),
    titre: f.Titre || '',
    desc: f.Description || '',
    bilan: f.Bilan || '',
    source: f.Source || '',
    wiki: f.Lien_Wiki || '',
  };
}

const raw = await fetchAll();
const incidents = raw
  .map(mapRecord)
  .filter(Boolean)
  .sort((a, b) => String(b.date).localeCompare(String(a.date))); // plus recent en premier

await writeFile(OUT, JSON.stringify(incidents, null, 2) + '\n', 'utf8');
console.log(`OK : ${incidents.length} incidents valides ecrits dans ${OUT}`);
