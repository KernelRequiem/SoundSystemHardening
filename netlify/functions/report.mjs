// netlify/functions/report.mjs
// Reçoit un signalement depuis le formulaire de la carte.
// Pousse l'enregistrement dans Airtable avec Statut = "En attente".
// Variables d'environnement Netlify requises :
//   AIRTABLE_WRITE_TOKEN  -> Personal Access Token scope data.records:write
//   AIRTABLE_BASE_ID      -> appSeV1IXQl0LFlkm

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function handler(event) {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  const { lieu, date, type, description, source, bilan } = body;

  // Validation des champs requis
  if (!lieu?.trim() || !date?.trim() || !type?.trim() || !description?.trim()) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Champs requis manquants : lieu, date, type, description' }),
    };
  }

  const TOKEN = process.env.AIRTABLE_WRITE_TOKEN;
  const BASE  = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE) {
    console.error('Variables d\'environnement manquantes : AIRTABLE_WRITE_TOKEN ou AIRTABLE_BASE_ID');
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Configuration serveur manquante' }) };
  }

  // Construction des champs Airtable
  // Note : Latitude et Longitude sont laissées vides.
  // Le modérateur les renseigne dans Airtable avant de passer le cas en "Valide".
  const fields = {
    Titre:       `[Signalement] ${lieu}`,
    Lieu:        lieu.trim(),
    Date:        date.trim(),
    Type:        type.trim(),
    Description: description.trim(),
    Statut:      'En attente',
  };
  if (source?.trim()) fields.Source = source.trim();
  if (bilan?.trim())  fields.Bilan  = bilan.trim();

  // POST vers Airtable
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/Incidents`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Erreur Airtable :', err);
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Erreur lors de l\'envoi à Airtable' }) };
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ ok: true, message: 'Signalement reçu. En attente de validation par les modérateurs.' }),
  };
}
