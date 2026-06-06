// api/report.js — Vercel Serverless Function
//
// Reçoit un signalement depuis le formulaire de la carte et le pousse dans
// Airtable avec Statut = "En attente". Vercel mappe ce fichier sur /api/report.
//
// Variables d'environnement à définir dans Vercel (Project Settings → Environment Variables) :
//   AIRTABLE_WRITE_TOKEN  -> Personal Access Token scope data.records:write
//   AIRTABLE_BASE_ID      -> appSeV1IXQl0LFlkm

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON invalide' }); }
  }
  body = body || {};

  const { lieu, date, type, description, source, bilan } = body;

  if (!lieu?.trim() || !date?.trim() || !type?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Champs requis manquants : lieu, date, type, description' });
  }

  const TOKEN = process.env.AIRTABLE_WRITE_TOKEN;
  const BASE = process.env.AIRTABLE_BASE_ID;

  if (!TOKEN || !BASE) {
    console.error('Variables d\'environnement manquantes : AIRTABLE_WRITE_TOKEN ou AIRTABLE_BASE_ID');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const fields = {
    Titre: `[Signalement] ${lieu}`,
    Lieu: lieu.trim(),
    Date: date.trim(),
    Type: type.trim(),
    Description: description.trim(),
    Statut: 'En attente',
  };
  if (source?.trim()) fields.Source = source.trim();
  if (bilan?.trim()) fields.Bilan = bilan.trim();

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/Incidents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
    if (!r.ok) {
      console.error('Erreur Airtable :', await r.text());
      return res.status(502).json({ error: 'Erreur lors de l\'envoi à Airtable' });
    }
  } catch {
    return res.status(502).json({ error: 'Airtable injoignable' });
  }

  return res.status(200).json({ ok: true, message: 'Signalement reçu. En attente de validation par les modérateurs.' });
}
