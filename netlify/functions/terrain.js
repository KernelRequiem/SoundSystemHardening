// netlify/functions/terrain.js
// CommonJS — zero dependency — fonctionne Node 14/16/18/20
// Utilise https natif Node au lieu de fetch() pour éviter les problèmes de runtime.

'use strict';

const https = require('https');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const OVERPASS_HOST = 'overpass-api.de';
const OVERPASS_PATH = '/api/interpreter';
const BOUNDS = { latMin: 41.0, latMax: 51.6, lngMin: -5.6, lngMax: 9.9 };

const round2    = (n) => Math.round(n * 100) / 100;
const roundDist = (m) => Math.round(m / 50) * 50;

function haversine(lat1, lng1, lat2, lng2) {
  const R     = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLng  = toRad(lng2 - lng1);
  const a     = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function buildQuery(lat, lng, radius) {
  return `[out:json][timeout:20];
(
  way["building"](around:${radius},${lat},${lng});
  way["landuse"~"residential|military|industrial|farmland|farmyard|forest|commercial|retail"](around:${radius},${lat},${lng});
  way["natural"~"water|wood"](around:${radius},${lat},${lng});
  way["leisure"="nature_reserve"](around:${radius},${lat},${lng});
  way["boundary"="protected_area"](around:${radius},${lat},${lng});
);
out center tags;`;
}

function classifyZone(tags) {
  if (!tags) return null;
  const lu = tags.landuse;
  if (lu === 'residential') return 'résidentielle';
  if (lu === 'military')    return 'militaire';
  if (lu === 'industrial')  return 'industrielle';
  if (lu === 'commercial' || lu === 'retail')     return 'commerciale';
  if (lu === 'farmland'   || lu === 'farmyard')   return 'agricole';
  if (lu === 'forest'     || tags.natural === 'wood') return 'forêt';
  if (tags.natural === 'water') return "plan d'eau";
  if (tags.leisure === 'nature_reserve' || tags.boundary === 'protected_area') return 'zone protégée';
  return null;
}

function scoreTerrain({ nearestHab, habCount, zones, militaire, protegee }) {
  const facteurs = [];
  let niveau = 0;

  if (nearestHab === null) {
    facteurs.push('Aucune habitation détectée dans le rayon analysé');
  } else if (nearestHab < 300) {
    niveau = Math.max(niveau, 3);
    facteurs.push(`Habitation la plus proche à ~${nearestHab} m - risque de plainte très élevé`);
  } else if (nearestHab < 600) {
    niveau = Math.max(niveau, 2);
    facteurs.push(`Habitation la plus proche à ~${nearestHab} m - risque de plainte élevé`);
  } else if (nearestHab < 1000) {
    niveau = Math.max(niveau, 1);
    facteurs.push(`Habitation la plus proche à ~${nearestHab} m - risque modéré`);
  } else {
    facteurs.push('Habitation la plus proche à plus de 1 km - risque faible');
  }

  if (habCount > 10) {
    niveau = Math.max(niveau, 2);
    facteurs.push(`${habCount} bâtiments dans le rayon - secteur habité`);
  } else if (habCount > 0) {
    facteurs.push(`${habCount} bâtiment(s) dans le rayon`);
  }

  if (protegee) {
    niveau = Math.max(niveau, 2);
    facteurs.push('Zone naturelle protégée détectée - risque juridique environnemental');
  }

  if (militaire) {
    niveau = Math.max(niveau, 1);
    facteurs.push('Zone militaire détectée - cadre légal spécifique');
  }

  if (zones.includes('résidentielle')) {
    niveau = Math.max(niveau, 3);
    facteurs.push('Zone résidentielle dans le périmètre - risque maximal');
  }

  const labels = ['faible', 'modéré', 'élevé', 'critique'];
  return { score: labels[niveau], facteurs };
}

// Wrapper https.request → Promise avec timeout 18s
function postOverpass(query) {
  return new Promise((resolve, reject) => {
    const postData = 'data=' + encodeURIComponent(query);

    const req = https.request({
      hostname: OVERPASS_HOST,
      path: OVERPASS_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'terrain-eval/1.0 (soundsystemhardening.fr)',
      },
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(Object.assign(new Error(`Overpass status ${res.statusCode}`), { httpStatus: res.statusCode }));
        }
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error('Réponse Overpass non-JSON'));
        }
      });
    });

    const timer = setTimeout(() => {
      req.destroy(Object.assign(new Error('timeout'), { name: 'AbortError' }));
    }, 18000);

    req.on('error', (err) => { clearTimeout(timer); reject(err); });
    req.on('close', () => clearTimeout(timer));

    req.write(postData);
    req.end();
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  let lat   = parseFloat(body.lat);
  let lng   = parseFloat(body.lng);
  let rayon = parseInt(body.rayon, 10);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Coordonnées invalides' }) };
  }
  if (lat < BOUNDS.latMin || lat > BOUNDS.latMax || lng < BOUNDS.lngMin || lng > BOUNDS.lngMax) {
    return { statusCode: 422, headers: CORS, body: JSON.stringify({ error: 'Coordonnées hors zone couverte (France et frontières)' }) };
  }
  if (Number.isNaN(rayon)) rayon = 1000;
  rayon = Math.min(2000, Math.max(200, rayon));

  const latR = round2(lat);
  const lngR = round2(lng);

  let data;
  try {
    data = await postOverpass(buildQuery(latR, lngR, rayon));
  } catch (err) {
    const msg = (err.name === 'AbortError' || err.message === 'timeout')
      ? 'Service cartographique trop lent - réessayez dans quelques instants'
      : 'Service cartographique injoignable';
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: msg }) };
  }

  const elements = data.elements || [];
  let nearestHabRaw = null;
  let habCount      = 0;
  const zonesSet    = new Set();
  let militaire     = false;
  let protegee      = false;

  for (const el of elements) {
    const tags = el.tags  || {};
    const c    = el.center || {};
    if (tags.building && c.lat != null && c.lon != null) {
      habCount++;
      const d = haversine(latR, lngR, c.lat, c.lon);
      if (nearestHabRaw === null || d < nearestHabRaw) nearestHabRaw = d;
    }
    const zone = classifyZone(tags);
    if (zone) zonesSet.add(zone);
    if (tags.landuse === 'military') militaire = true;
    if (tags.leisure === 'nature_reserve' || tags.boundary === 'protected_area') protegee = true;
  }

  const zones      = [...zonesSet];
  const nearestHab = nearestHabRaw === null ? null : roundDist(nearestHabRaw);
  const { score, facteurs } = scoreTerrain({ nearestHab, habCount, zones, militaire, protegee });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      ok: true,
      rapport: {
        score,
        facteurs,
        habitation_proche_m:  nearestHab,
        batiments_dans_rayon: habCount,
        zones_detectees:      zones,
        zone_militaire:       militaire,
        zone_protegee:        protegee,
        rayon_analyse_m:      rayon,
        precision_note: "Analyse basée sur une zone d'environ 1 km. Validation finale en reconnaissance physique, hors réseau.",
      },
    }),
  };
};
