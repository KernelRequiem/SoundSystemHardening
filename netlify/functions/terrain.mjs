// netlify/functions/terrain.mjs
//
// Proxy d'évaluation de terrain. Le client envoie une coordonnée DÉJÀ arrondie
// (~1 km). Le serveur la re-arrondit (défense en profondeur), interroge Overpass,
// agrège, et ne renvoie QUE des agrégats  - jamais les coordonnées des bâtiments.
//
// Aucune variable d'environnement requise (Overpass est public).
//
// Garanties OpSec :
//  - POST uniquement : la coordonnée ne transite jamais en query string (pas de log URL)
//  - Re-arrondi serveur à 2 décimales (~1 km) même si le client envoie plus précis
//  - Bornage géographique (France + frontières) pour empêcher l'abus comme proxy global
//  - Réponse = agrégats seulement (distances arrondies, types de zone, comptes)
//  - Aucune coordonnée n'est jamais loggée (pas de console.log des lat/lng)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const OVERPASS = 'https://overpass-api.de/api/interpreter';

// Bornes larges France métropolitaine + frontières immédiates + Corse
const BOUNDS = { latMin: 41.0, latMax: 51.6, lngMin: -5.6, lngMax: 9.9 };

// Arrondi à 2 décimales (~1.1 km en latitude)
const round2 = (n) => Math.round(n * 100) / 100;

// Distance Haversine en mètres entre deux points
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Arrondi d'une distance au pas de 50 m (évite de divulguer une position fine)
const roundDist = (m) => Math.round(m / 50) * 50;

function buildQuery(lat, lng, radius) {
  // Une seule requête : bâtiments + landuse + natural + leisure dans le rayon.
  // 'out center tags' => centroïde + tags seulement (pas la géométrie complète).
  return `[out:json][timeout:25];
(
  way["building"](around:${radius},${lat},${lng});
  way["landuse"~"residential|military|industrial|farmland|farmyard|forest|commercial|retail"](around:${radius},${lat},${lng});
  way["natural"~"water|wood"](around:${radius},${lat},${lng});
  way["leisure"="nature_reserve"](around:${radius},${lat},${lng});
  way["boundary"="protected_area"](around:${radius},${lat},${lng});
);
out center tags;`;
}

// Traduit les tags en libellés de zone lisibles
function classifyZone(tags) {
  if (!tags) return null;
  const lu = tags.landuse;
  if (lu === 'residential') return 'résidentielle';
  if (lu === 'military') return 'militaire';
  if (lu === 'industrial') return 'industrielle';
  if (lu === 'commercial' || lu === 'retail') return 'commerciale';
  if (lu === 'farmland' || lu === 'farmyard') return 'agricole';
  if (lu === 'forest' || tags.natural === 'wood') return 'forêt';
  if (tags.natural === 'water') return 'plan d\'eau';
  if (tags.leisure === 'nature_reserve' || tags.boundary === 'protected_area') return 'zone protégée';
  return null;
}

function scoreTerrain({ nearestHab, habCount, zones, militaire, protegee }) {
  const facteurs = [];
  let niveau = 0; // 0 faible, 1 modéré, 2 élevé, 3 critique

  // Facteur 1 : distance à l'habitation la plus proche (risque de plainte / nuisance)
  if (nearestHab === null) {
    facteurs.push('Aucune habitation détectée dans le rayon analysé');
  } else if (nearestHab < 300) {
    niveau = Math.max(niveau, 3);
    facteurs.push(`Habitation la plus proche à ~${nearestHab} m  - risque de plainte très élevé`);
  } else if (nearestHab < 600) {
    niveau = Math.max(niveau, 2);
    facteurs.push(`Habitation la plus proche à ~${nearestHab} m  - risque de plainte élevé`);
  } else if (nearestHab < 1000) {
    niveau = Math.max(niveau, 1);
    facteurs.push(`Habitation la plus proche à ~${nearestHab} m  - risque modéré`);
  } else {
    facteurs.push(`Habitation la plus proche à plus de 1 km  - risque faible côté nuisance`);
  }

  // Facteur 2 : densité bâtie
  if (habCount > 10) {
    niveau = Math.max(niveau, 2);
    facteurs.push(`${habCount} bâtiments dans le rayon  - secteur habité`);
  } else if (habCount > 0) {
    facteurs.push(`${habCount} bâtiment(s) dans le rayon`);
  }

  // Facteur 3 : zone protégée (risque juridique environnemental)
  if (protegee) {
    niveau = Math.max(niveau, 2);
    facteurs.push('Zone naturelle protégée détectée  - risque juridique environnemental');
  }

  // Facteur 4 : zone militaire (cas particulier : peu d'habitations mais cadre légal spécifique)
  if (militaire) {
    niveau = Math.max(niveau, 1);
    facteurs.push('Zone militaire détectée  - terrain isolé mais cadre légal spécifique (cf. Teknival Cornusse 2026)');
  }

  // Facteur 5 : zone résidentielle dominante
  if (zones.includes('résidentielle')) {
    niveau = Math.max(niveau, 3);
    facteurs.push('Zone résidentielle dans le périmètre  - risque maximal');
  }

  const labels = ['faible', 'modéré', 'élevé', 'critique'];
  return { score: labels[niveau], facteurs };
}

export async function handler(event) {
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

  let { lat, lng, rayon } = body;
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  rayon = parseInt(rayon, 10);

  // Validation
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Coordonnées invalides' }) };
  }
  if (lat < BOUNDS.latMin || lat > BOUNDS.latMax || lng < BOUNDS.lngMin || lng > BOUNDS.lngMax) {
    return { statusCode: 422, headers: CORS, body: JSON.stringify({ error: 'Coordonnées hors zone couverte (France et frontières)' }) };
  }
  // Bornage du rayon : entre 200 m et 2000 m
  if (Number.isNaN(rayon)) rayon = 1000;
  rayon = Math.min(2000, Math.max(200, rayon));

  // DÉFENSE EN PROFONDEUR : on re-arrondit même si le client a déjà arrondi.
  // Le serveur ne travaille jamais avec une précision supérieure à ~1 km.
  const latR = round2(lat);
  const lngR = round2(lng);

  // Interrogation Overpass (timeout 18s pour rester sous la limite Netlify de 26s)
  let elements;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);
    let res;
    try {
      res = await fetch(OVERPASS, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'terrain-eval/1.0 (generic)',
        },
        body: 'data=' + encodeURIComponent(buildQuery(latR, lngR, rayon)),
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!res.ok) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: `Service cartographique indisponible (${res.status})` }) };
    }
    const data = await res.json();
    elements = data.elements || [];
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Service cartographique trop lent (timeout 18s)' : 'Service cartographique injoignable';
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: msg }) };
  }

  // Agrégation  - on ne conserve JAMAIS les coordonnées individuelles
  let nearestHabRaw = null;
  let habCount = 0;
  const zonesSet = new Set();
  let militaire = false;
  let protegee = false;

  for (const el of elements) {
    const tags = el.tags || {};
    const c = el.center || {};
    const isBuilding = !!tags.building;

    if (isBuilding && c.lat != null && c.lon != null) {
      habCount++;
      const d = haversine(latR, lngR, c.lat, c.lon);
      if (nearestHabRaw === null || d < nearestHabRaw) nearestHabRaw = d;
    }

    const zone = classifyZone(tags);
    if (zone) zonesSet.add(zone);
    if (tags.landuse === 'military') militaire = true;
    if (tags.leisure === 'nature_reserve' || tags.boundary === 'protected_area') protegee = true;
  }

  const zones = [...zonesSet];
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
        habitation_proche_m: nearestHab,
        batiments_dans_rayon: habCount,
        zones_detectees: zones,
        zone_militaire: militaire,
        zone_protegee: protegee,
        rayon_analyse_m: rayon,
        precision_note: 'Analyse basée sur une zone d\'environ 1 km, pas sur un point précis. La validation finale du terrain se fait en reconnaissance physique, hors réseau.',
      },
    }),
  };
}
