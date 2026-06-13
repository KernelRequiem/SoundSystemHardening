/**
 * soundcheck-logic.js — SOUNDCHECK v2 / Soundsystem Hardening
 * ------------------------------------------------------------
 * Thread principal : saisie source (coordonnées directes ou carte),
 * carte Leaflet à la demande, fetch topo, pont Worker, radar polaire,
 * rapport détaillé exportable (.md / impression PDF).
 *
 * OPSEC :
 *  - Aucune requête vers un backend propriétaire.
 *  - La carte (tuiles OSM) n'est JAMAIS chargée sans action explicite :
 *    la saisie directe lat/lng permet un repérage sans aucune tuile.
 *  - Mode HORS-LIGNE STRICT : zéro requête topo, calcul plat ISO 9613-2.
 *  - Aucune coordonnée stockée (RAM uniquement).
 *  - Calcul matriciel déporté dans /workers/acousticWorker.js.
 */

'use strict';

/* == CONFIGURATION ======================================================== */

const ELEVATION_API   = 'https://api.open-elevation.com/api/v1/lookup';
const ELEVATION_CHUNK = 200;
const FETCH_TIMEOUT   = 10000;
const RAY_COUNT       = 48;
const PROFILE_STEPS   = 16;
const RANGE_MIN       = 4000;    // portée plancher de simulation (m)
const RANGE_CAP       = 25000;   // portée plafond — config teknival (m)
const EARTH_M_PER_DEG = 111320;

const COMPASS_8  = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const COMPASS_16 = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];

/**
 * Environnements d'émission. tl = isolement de l'enveloppe aux basses
 * fréquences (dB) — volontairement inférieur aux Rw constructeurs, car un mur
 * de son est dominé par le bas du spectre, là où les parois isolent le moins.
 */
const VENUES = {
  openair:  { label: 'PLEIN AIR',         tl: 0,  indoor: false, hint: 'Émission directe du stack, directivité cardioïde pleine (-12 dB à l\'arrière).' },
  canvas:   { label: 'CHAPITEAU / TOILE', tl: 4,  indoor: true,  hint: 'Une toile n\'isole quasiment pas les basses fréquences : à traiter comme du plein air côté riverains.' },
  metal:    { label: 'HANGAR MÉTAL',      tl: 12, indoor: true,  hint: 'Bardage acier simple peau : isolement modeste aux basses, le bâtiment vibre et rayonne.' },
  masonry:  { label: 'BÂTIMENT DUR',      tl: 25, indoor: true,  hint: 'Maçonnerie/béton : bon isolement, mais les ouvertures deviennent le maillon faible.' },
  basement: { label: 'SOUS-SOL / CAVE',   tl: 40, indoor: true,  hint: 'Enterré : isolement maximal, les fuites (soupiraux, accès) dominent ce qui sort.' },
};

/** État des ouvertures : fraction de surface équivalente ouverte vers l'extérieur. */
const OPENINGS = {
  closed:  { label: 'FERMÉES',     f: 0.005, hint: 'fuites résiduelles uniquement' },
  partial: { label: 'PARTIELLES',  f: 0.05,  hint: 'accès entrouverts, ventilation' },
  open:    { label: 'OUVERTES',    f: 0.20,  hint: 'portes/quais ouverts en grand' },
};

/** Loi des parois composites — miroir exact de la formule du worker. */
function compositeTL(tlEnv, openFrac) {
  if (tlEnv <= 0) return 0;
  const tau = (1 - openFrac) * Math.pow(10, -tlEnv / 10) + openFrac;
  return -10 * Math.log10(tau);
}

/**
 * PORTÉE ADAPTATIVE — miroir des formules de propagation du worker.
 * Estime la distance du contour 30 dB en terrain plat pour dimensionner la
 * grille : un rig de 5 kW est simulé serré (meilleure résolution topo), une
 * config teknival multi-stacks est simulée jusqu'à 25 km.
 */
function estimateSimRange(powerKw, stackCount, wallHeight, tlEff) {
  const lw = 10 * Math.log10((powerKw * 1000 * 0.02) / 1e-12) - 6
           + 10 * Math.log10(Math.max(1, stackCount)) - tlEff;
  const hm = Math.max(0.5, (wallHeight + 1.5) / 2);
  let dist = RANGE_MIN;
  for (let d = 50; d <= RANGE_CAP; d += 50) {
    const agr = Math.max(0, 4.8 - (2 * hm / d) * (17 + 300 / d));
    const lp = lw - (20 * Math.log10(d) + 11) - 0.0035 * d - agr;
    if (lp >= 30) dist = d;
  }
  return Math.min(RANGE_CAP, Math.max(RANGE_MIN, Math.round(dist * 1.15)));
}

const C = {
  green:  '#00ff9f',
  amber:  '#ffb000',
  red:    '#ff4444',
  orange: '#ff5c33',
  muted:  'rgba(122,122,138,0.8)',
  grid:   'rgba(42,42,58,0.9)',
};

/* == ETAT (mémoire volatile uniquement) =================================== */

const state = {
  map: null,
  mapLoaded: false,
  marker: null,
  source: null,          // {lat, lng} — jamais persisté
  worker: null,
  layers: [],
  running: false,
  lastResult: null,
  lastMeta: null,        // {date, mode, sourceElev}
  venue: 'openair',
  openings: 'closed',
};

/* == BOOT ================================================================= */

document.addEventListener('DOMContentLoaded', init);

function init() {
  initControls();
  initWorker();
  logLine('SOUNDCHECK v2.0 — système initialisé.');
  logLine('Saisis les coordonnées (mode discret) ou charge la carte.');
}

/* == CONTROLES ============================================================ */

function initControls() {
  bindSlider('sc-power', 'sc-power-val', (v) => `${v} kW / stack`, updateTotalPower);
  bindSlider('sc-count', 'sc-count-val', (v) => `${v} stack${Number(v) > 1 ? 's' : ''}`, () => { updateTotalPower(); updateVenueUI(); });
  bindSlider('sc-height', 'sc-height-val', (v) => `${v} m`);
  bindSlider('sc-orient', 'sc-orient-val', (v) => `${v}° ${compass16(Number(v))}`, drawCompass);

  el('sc-fix-btn').addEventListener('click', setSourceFromInputs);
  el('sc-loadmap-btn').addEventListener('click', loadMap);
  el('sc-scan-btn').addEventListener('click', runScan);
  el('sc-export-md').addEventListener('click', exportMarkdown);
  el('sc-export-print').addEventListener('click', exportPrint);

  // Entrée clavier : Enter dans les champs coords = fixer
  for (const id of ['sc-lat', 'sc-lng']) {
    el(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') setSourceFromInputs();
    });
  }

  // Sélecteur d'environnement + ouvertures
  for (const btn of document.querySelectorAll('[data-venue]')) {
    btn.addEventListener('click', () => { state.venue = btn.dataset.venue; updateVenueUI(); });
  }
  for (const btn of document.querySelectorAll('[data-open]')) {
    btn.addEventListener('click', () => { state.openings = btn.dataset.open; updateVenueUI(); });
  }
  updateVenueUI();

  drawCompass();
}

/* == ENVIRONNEMENT D'EMISSION ============================================= */

function stackCount() {
  const node = el('sc-count');
  return node ? Math.max(1, Number(node.value)) : 1;
}

function updateTotalPower() {
  const p = Number(el('sc-power').value);
  const n = stackCount();
  const total = p * n;
  el('sc-total-val').textContent = n > 1
    ? `${n} × ${p} kW = ${total >= 1000 ? (total / 1000).toFixed(1) + ' MW' : total + ' kW'} cumulés (+${(10 * Math.log10(n)).toFixed(1)} dB)`
    : `${p} kW — stack unique`;
}

function venueParams() {
  const v = VENUES[state.venue];
  const o = OPENINGS[state.openings];
  const n = stackCount();
  const openFrac = v.indoor ? o.f : 0;
  const tlEff = compositeTL(v.tl, openFrac);
  // Directivité : plein air = cardioïde pleine (12 dB) ; intérieur fermé =
  // omni (l'enveloppe rayonne partout) ; intérieur ouvert = lobe doux (4 dB).
  // Multi-stacks : les systèmes pointent dans des directions variées →
  // 2-3 stacks = lobe doux (4 dB), 4 et plus = omnidirectionnel.
  let dirFloorDb = !v.indoor ? 12 : (state.openings === 'closed' ? 0 : 4);
  if (n >= 4) dirFloorDb = 0;
  else if (n >= 2) dirFloorDb = Math.min(dirFloorDb, 4);
  return { tlEnv: v.tl, openFrac, indoor: v.indoor, dirFloorDb, tlEff, venueKey: state.venue, stackCount: n };
}

function updateVenueUI() {
  const v = VENUES[state.venue];
  const o = OPENINGS[state.openings];
  const p = venueParams();

  for (const btn of document.querySelectorAll('[data-venue]')) {
    btn.classList.toggle('active', btn.dataset.venue === state.venue);
  }
  for (const btn of document.querySelectorAll('[data-open]')) {
    btn.classList.toggle('active', btn.dataset.open === state.openings);
  }

  el('sc-openings-row').classList.toggle('hidden', !v.indoor);

  // Le slider orientation change de sens selon l'environnement et le nombre de stacks
  const p2 = venueParams();
  el('sc-orient-label').textContent = v.indoor
    ? 'Orientation des ouvertures'
    : 'Orientation du stack';
  el('sc-orient-hint').textContent = p2.dirFloorDb === 0
    ? (v.indoor && state.openings === 'closed'
        ? '(sans effet : rayonnement omnidirectionnel)'
        : '(sans effet : multi-stacks ≈ omnidirectionnel)')
    : (v.indoor ? '(direction des portes/accès)'
        : (p2.stackCount >= 2 ? '(axe moyen des stacks)' : '(face avant)'));

  el('sc-venue-hint').textContent = v.indoor
    ? `${v.hint} Isolement effectif estimé : ${p.tlEff.toFixed(1)} dB (paroi ${v.tl} dB, ouvertures ${o.label.toLowerCase()} — ${o.hint}).`
    : v.hint;

  drawCompass();
}

function bindSlider(sliderId, labelId, fmt, extra) {
  const slider = el(sliderId);
  const label = el(labelId);
  const update = () => {
    label.textContent = fmt(slider.value);
    if (extra) extra();
  };
  slider.addEventListener('input', update);
  update();
}

/* == SOURCE : SAISIE DIRECTE OU CARTE ===================================== */

function setSourceFromInputs() {
  const lat = parseFloat(el('sc-lat').value);
  const lng = parseFloat(el('sc-lng').value);

  if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    logLine('Coordonnées invalides. Format décimal attendu (ex: 46.60000 / 2.40000).', 'err');
    return;
  }
  setSource({ lat, lng }, 'manuel');
}

function setSource(latlng, origin) {
  state.source = { lat: latlng.lat, lng: latlng.lng };

  el('sc-lat').value = latlng.lat.toFixed(5);
  el('sc-lng').value = latlng.lng.toFixed(5);
  el('sc-coords').textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
  el('sc-scan-btn').disabled = false;

  if (state.mapLoaded) {
    if (state.marker) state.map.removeLayer(state.marker);
    state.marker = L.marker([latlng.lat, latlng.lng], {
      icon: L.divIcon({
        className: 'sc-source-icon',
        html: '<div class="sc-crosshair">◎</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    }).addTo(state.map);
    if (origin === 'manuel') state.map.setView([latlng.lat, latlng.lng], 13);
  }

  logLine(`Source fixée (${origin}). [${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}] — RAM uniquement.`);
}

/* == CARTE (LAZY — aucune tuile sans action explicite) ==================== */

function loadMap() {
  if (state.mapLoaded) return;
  if (typeof L === 'undefined') {
    logLine('ERREUR: Leaflet non chargé. Vérifier le CDN.', 'err');
    return;
  }

  el('sc-map-placeholder').classList.add('hidden');
  el('sc-map-wrap').classList.remove('hidden');

  const center = state.source ? [state.source.lat, state.source.lng] : [46.6, 2.4];
  const zoom = state.source ? 13 : 6;

  state.map = L.map('sc-map', { center, zoom, zoomControl: true });

  // URL avec sous-domaine {s} : requis par la CSP (img-src *.tile.openstreetmap.org)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; OpenStreetMap',
    className: 'sc-tiles',
  }).addTo(state.map);

  state.map.on('click', (e) => {
    if (!state.running) setSource(e.latlng, 'carte');
  });

  state.mapLoaded = true;
  if (state.source) setSource(state.source, 'manuel');
  if (state.lastResult) drawMapResult(state.lastResult);
  logLine('Carte chargée. Les tuiles OSM révèlent la zone consultée à l\'opérateur de tuiles.', 'warn');
}

/* == WORKER =============================================================== */

function initWorker() {
  state.worker = new Worker('/workers/acousticWorker.js');

  state.worker.onmessage = (event) => {
    const { cmd, payload, value, message } = event.data;
    if (cmd === 'PROGRESS') setProgress(0.3 + value * 0.7);
    if (cmd === 'RESULT') onResult(payload);
    if (cmd === 'ERROR') { logLine(`ERREUR WORKER: ${message}`, 'err'); endScan(); }
  };
  state.worker.onerror = (err) => {
    logLine(`ERREUR WORKER: ${err.message || 'crash'}`, 'err');
    endScan();
  };
}

/* == PIPELINE DE SCAN ===================================================== */

async function runScan() {
  if (!state.source || state.running) return;
  state.running = true;

  const btn = el('sc-scan-btn');
  btn.disabled = true;
  btn.classList.add('sc-scanning');
  btn.textContent = '[ SCAN EN COURS... ]';
  clearLayers();
  setProgress(0.02);

  const powerKw = Number(el('sc-power').value);
  const nStacks = stackCount();
  const wallHeight = Number(el('sc-height').value);
  const orientation = Number(el('sc-orient').value);
  const offlineStrict = el('sc-offline').checked;
  const venue = venueParams();
  const simRange = estimateSimRange(powerKw, nStacks, wallHeight, venue.tlEff);

  logLine(`Scan lancé. ${nStacks} × ${powerKw} kW · H=${wallHeight} m · orientation=${orientation}° ${compass16(orientation)} · site=${VENUES[state.venue].label}.`);
  if (nStacks > 1) {
    logLine(`Cumul multi-stacks : +${(10 * Math.log10(nStacks)).toFixed(1)} dB (sources co-localisées, borne haute).`);
  }
  if (venue.indoor) {
    logLine(`Enveloppe bâtiment : isolement effectif ${venue.tlEff.toFixed(1)} dB (ouvertures ${OPENINGS[state.openings].label.toLowerCase()}).`);
  }
  logLine(`Portée de simulation adaptative : ${fmtKm(simRange)} (résolution topo ${fmtKm(simRange / PROFILE_STEPS)}/échantillon).`);

  const rays = buildRayGrid(state.source, simRange);

  let flatMode = false;
  let sourceElev = 0;

  if (offlineStrict) {
    flatMode = true;
    logLine('HORS-LIGNE STRICT actif : zéro requête réseau, propagation plate ISO 9613-2.', 'warn');
  } else {
    logLine('Requête topographique (Open-Elevation, sans cookie ni referrer)...');
    try {
      const elevations = await fetchElevations(rays);
      sourceElev = elevations.sourceElev;
      attachProfiles(rays, elevations.grid);
      logLine(`Topo OK. ${elevations.count} points. Altitude source: ${Math.round(sourceElev)} m.`);
    } catch (err) {
      flatMode = true;
      logLine(`Topo indisponible (${err.message}). FALLBACK: propagation plate ISO 9613-2.`, 'warn');
    }
  }

  state.lastMeta = {
    date: new Date(),
    offlineStrict,
    sourceElev,
    lat: state.source.lat,
    lng: state.source.lng,
  };

  state.worker.postMessage({
    cmd: 'COMPUTE',
    payload: {
      powerKw, stackCount: nStacks, maxRange: simRange,
      wallHeight, orientation, sourceElev, flatMode,
      venue: {
        tlEnv: venue.tlEnv,
        openFrac: venue.openFrac,
        indoor: venue.indoor,
        dirFloorDb: venue.dirFloorDb,
      },
      rays: rays.map((r) => ({ azimuth: r.azimuth, profile: r.profile || null })),
    },
  });
}

/* == GRILLE POLAIRE ======================================================= */

function buildRayGrid(source, simRange) {
  const rays = [];
  const stepDist = simRange / PROFILE_STEPS;
  for (let i = 0; i < RAY_COUNT; i++) {
    const azimuth = (360 / RAY_COUNT) * i;
    const samples = [];
    for (let s = 1; s <= PROFILE_STEPS; s++) {
      const d = s * stepDist;
      samples.push({ dist: d, ...offsetLatLng(source, azimuth, d) });
    }
    rays.push({ azimuth, samples, profile: null });
  }
  return rays;
}

function offsetLatLng(origin, azimuthDeg, distM) {
  const theta = (azimuthDeg * Math.PI) / 180;
  const dLat = (distM * Math.cos(theta)) / EARTH_M_PER_DEG;
  const dLng = (distM * Math.sin(theta)) /
    (EARTH_M_PER_DEG * Math.cos((origin.lat * Math.PI) / 180));
  return { lat: origin.lat + dLat, lng: origin.lng + dLng };
}

/* == FETCH TOPO =========================================================== */

async function fetchElevations(rays) {
  const points = [{ latitude: state.source.lat, longitude: state.source.lng }];
  for (const ray of rays) {
    for (const s of ray.samples) points.push({ latitude: s.lat, longitude: s.lng });
  }

  const elevations = [];
  for (let i = 0; i < points.length; i += ELEVATION_CHUNK) {
    const chunk = points.slice(i, i + ELEVATION_CHUNK);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const res = await fetch(ELEVATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: chunk }),
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      for (const r of data.results) elevations.push(r.elevation ?? 0);
    } finally {
      clearTimeout(timer);
    }
    setProgress((i + chunk.length) / points.length * 0.3);
  }

  if (elevations.length !== points.length) throw new Error('réponse incomplète');
  return { sourceElev: elevations[0], grid: elevations.slice(1), count: elevations.length };
}

function attachProfiles(rays, grid) {
  let idx = 0;
  for (const ray of rays) {
    ray.profile = ray.samples.map((s) => ({ dist: s.dist, elev: grid[idx++] ?? 0 }));
  }
}

/* == RESULTAT ============================================================= */

function onResult(r) {
  state.lastResult = r;

  if (state.mapLoaded) drawMapResult(r);
  drawRadar(r);
  renderReadouts(r);
  renderReport(r);

  el('sc-radar-wrap').classList.remove('hidden');
  el('sc-report-wrap').classList.remove('hidden');

  const maskPct = Math.round(r.maskFactor * 100);
  logLine(`RESULTAT — Lw: ${r.lw} dB · empreinte 45 dB: ${r.area45Km2.toFixed(2)} km² · masque: ${maskPct}%.`,
    maskPct >= 40 ? 'ok' : undefined);
  logLine(`Direction la plus défavorable: ${r.worstAzimuth}° ${compass16(r.worstAzimuth)} → audible à ${fmtKm(r.worstDist45)}.`);

  endScan();
}

function renderReadouts(r) {
  const maskPct = Math.round(r.maskFactor * 100);
  setReadout('sc-out-area', `${r.area45Km2.toFixed(2)} km²`);
  setReadout('sc-out-mask', `${maskPct} %`, maskPct >= 40 ? 'good' : maskPct >= 15 ? 'mid' : 'bad');
  setReadout('sc-out-flat', fmtKm(r.flat45));
  setReadout('sc-out-mode', r.mode === 'TOPO_RAYCAST' ? 'TOPO' : 'PLAT',
    r.mode === 'TOPO_RAYCAST' ? 'good' : 'mid');
  setGauge('sc-gauge-mask', maskPct, maskPct >= 40 ? C.green : maskPct >= 15 ? C.amber : C.red);
}

/* == RENDU CARTE ========================================================== */

function drawMapResult(r) {
  clearLayers();

  const toLatLng = (pt) => {
    const { lat, lng } = offsetLatLng(state.source, pt.azimuth, pt.dist);
    return [lat, lng];
  };

  // Contour 30 dB (inaudible au-delà) — vert, fin
  const poly30 = L.polygon(r.contour30.map(toLatLng), {
    color: C.green, weight: 1, dashArray: '4 6', fillColor: C.green, fillOpacity: 0.05,
  }).addTo(state.map);

  // Contour 45 dB (audible) — orange, plein
  const poly45 = L.polygon(r.contour45.map(toLatLng), {
    color: C.orange, weight: 2, fillColor: C.orange, fillOpacity: 0.18,
  }).addTo(state.map);

  // Référence plate 45 dB — ambre pointillé
  const refCircle = L.circle([state.source.lat, state.source.lng], {
    radius: r.flat45, color: C.amber, weight: 1, dashArray: '6 8', fill: false,
  }).addTo(state.map);

  // Flèche d'orientation du stack
  const tip = offsetLatLng(state.source, r.params.orientation, r.flat45 * 0.35);
  const axis = L.polyline([[state.source.lat, state.source.lng], [tip.lat, tip.lng]], {
    color: C.green, weight: 2, dashArray: '2 6',
  }).addTo(state.map);

  state.layers.push(poly30, poly45, refCircle, axis);
  state.map.fitBounds(refCircle.getBounds(), { padding: [24, 24] });
}

function clearLayers() {
  if (!state.mapLoaded) { state.layers = []; return; }
  for (const layer of state.layers) state.map.removeLayer(layer);
  state.layers = [];
}

/* == RADAR POLAIRE (canvas — fonctionne sans carte) ======================= */

function drawRadar(r) {
  const canvas = el('sc-radar');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 360;
  const cssH = Math.max(300, Math.min(cssW, 420));
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const cx = cssW / 2;
  const cy = cssH / 2;
  const margin = 34;
  const radius = Math.min(cssW, cssH) / 2 - margin;
  const maxDist = Math.max(r.flat45, ...r.contour30.map((p) => p.dist)) * 1.08;
  const scale = radius / maxDist;

  const toXY = (azimuth, dist) => {
    const a = ((azimuth - 90) * Math.PI) / 180; // 0° = Nord en haut
    return [cx + Math.cos(a) * dist * scale, cy + Math.sin(a) * dist * scale];
  };

  // ── Grille : anneaux + axes ──
  ctx.font = '9px "JetBrains Mono", monospace';
  const ringStep = niceRingStep(maxDist);
  for (let d = ringStep; d <= maxDist; d += ringStep) {
    ctx.beginPath();
    ctx.arc(cx, cy, d * scale, 0, Math.PI * 2);
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.fillText(fmtKm(d), cx + 4, cy - d * scale - 3);
  }
  for (let a = 0; a < 360; a += 45) {
    const [x, y] = toXY(a, maxDist);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(42,42,58,0.5)';
    ctx.stroke();
    const [lx, ly] = toXY(a, maxDist * 1.12);
    ctx.fillStyle = a === 0 ? C.green : C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(COMPASS_8[a / 45], lx, ly);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  // ── Référence plate 45 dB (ambre pointillé) ──
  ctx.beginPath();
  ctx.setLineDash([5, 6]);
  ctx.arc(cx, cy, r.flat45 * scale, 0, Math.PI * 2);
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Contour 30 dB (vert fin) ──
  tracePolar(ctx, r.contour30, toXY);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,255,159,0.05)';
  ctx.fill();

  // ── Contour 45 dB (orange, rempli, glow) ──
  tracePolar(ctx, r.contour45, toXY);
  ctx.shadowColor = 'rgba(255,92,51,0.55)';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,92,51,0.16)';
  ctx.fill();

  // ── Axe du stack / des ouvertures (omis si rayonnement omnidirectionnel) ──
  if (r.dirFloorDb > 0) {
    const [ox, oy] = toXY(r.params.orientation, maxDist * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ox, oy);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.fill();
  }

  // ── Source ──
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = C.green;
  ctx.shadowColor = C.green;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function tracePolar(ctx, contour, toXY) {
  ctx.beginPath();
  contour.forEach((pt, i) => {
    const [x, y] = toXY(pt.azimuth, pt.dist);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function niceRingStep(maxDist) {
  for (const s of [500, 1000, 2000, 2500, 5000, 10000]) {
    if (maxDist / s <= 5) return s;
  }
  return 10000;
}

/* == BOUSSOLE (mini canvas du slider orientation) ========================= */

function drawCompass() {
  const canvas = el('sc-compass');
  if (!canvas) return;
  const orientation = Number(el('sc-orient').value);
  const dpr = window.devicePixelRatio || 1;
  const size = 64;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const c = size / 2;
  const rad = c - 6;
  const omni = venueParams().dirFloorDb === 0;

  ctx.beginPath();
  ctx.arc(c, c, rad, 0, Math.PI * 2);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '7px "JetBrains Mono", monospace';
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', c, c - rad + 6);

  const a0 = ((orientation - 90) * Math.PI) / 180;

  if (omni) {
    // Rayonnement omnidirectionnel : disque uniforme, pas d'aiguille
    ctx.beginPath();
    ctx.arc(c, c, rad * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,159,0.14)';
    ctx.fill();
  } else {
    // Lobe avant (cardioïde stylisée)
    ctx.beginPath();
    ctx.moveTo(c, c);
    for (let t = -90; t <= 90; t += 10) {
      const a = a0 + (t * Math.PI) / 180;
      const k = (1 + Math.cos((t * Math.PI) / 180)) / 2;
      ctx.lineTo(c + Math.cos(a) * rad * 0.85 * k, c + Math.sin(a) * rad * 0.85 * k);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,255,159,0.18)';
    ctx.fill();

    // Aiguille
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.cos(a0) * rad * 0.9, c + Math.sin(a0) * rad * 0.9);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(c, c, 2, 0, Math.PI * 2);
  ctx.fillStyle = C.green;
  ctx.fill();
}

/* == RAPPORT DETAILLE ===================================================== */

function buildReportData(r) {
  const m = state.lastMeta;
  const maskPct = Math.round(r.maskFactor * 100);
  const orient = r.params.orientation;
  const rear = (orient + 180) % 360;
  const dateStr = m.date.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
  const venue = r.params.venue || { tlEnv: 0, openFrac: 0, indoor: false };
  const venueDef = VENUES[state.venue] || VENUES.openair;
  const openDef = OPENINGS[state.openings] || OPENINGS.closed;

  const nStacks = r.params.stackCount || 1;
  const totalKw = r.params.totalKw || r.params.powerKw;

  return {
    nStacks,
    totalKw,
    totalTxt: nStacks > 1
      ? `${nStacks} stacks × ${r.params.powerKw} kW = ${totalKw >= 1000 ? (totalKw / 1000).toFixed(1) + ' MW' : totalKw + ' kW'} (+${(10 * Math.log10(nStacks)).toFixed(1)} dB)`
      : `${r.params.powerKw} kW (stack unique)`,
    simRange: r.maxRange ? fmtKm(r.maxRange) : null,
    indoor: venue.indoor,
    omni: r.dirFloorDb === 0,
    venueLabel: venueDef.label,
    openLabel: openDef.label,
    tlEnv: venue.tlEnv,
    tlEff: r.tlEff,
    lwSource: r.lwSource,
    dateStr,
    stamp: m.date.toISOString(),
    lat: m.lat.toFixed(5),
    lng: m.lng.toFixed(5),
    sourceElev: Math.round(m.sourceElev),
    mode: r.mode === 'TOPO_RAYCAST'
      ? 'Raycasting topographique (relief réel, données SRTM via Open-Elevation)'
      : 'Propagation plate ISO 9613-2 (sans relief — mode hors-ligne ou topo indisponible)',
    powerKw: r.params.powerKw,
    wallHeight: r.params.wallHeight,
    orient,
    orientTxt: `${orient}° ${compass16(orient)}`,
    rearTxt: `${rear}° ${compass16(rear)}`,
    lw: r.lw,
    area45: r.area45Km2.toFixed(2),
    area30: r.area30Km2.toFixed(2),
    flatArea45: r.flatArea45Km2.toFixed(2),
    flat45: fmtKm(r.flat45),
    flat30: fmtKm(r.flat30),
    maskPct,
    blockedRays: r.blockedRays,
    rayCount: r.rayCount,
    worstAz: `${r.worstAzimuth}° ${compass16(r.worstAzimuth)}`,
    worstDist: fmtKm(r.worstDist45),
    worstDistM: Math.round(r.worstDist45),
    sectors: r.sectors,
    isTopo: r.mode === 'TOPO_RAYCAST',
  };
}

function renderReport(r) {
  const d = buildReportData(r);

  const sectorRows = d.sectors.map((s) => `
    <tr>
      <td class="sc-rp-mono">${s.name} <span class="sc-rp-dim">(${s.az}°)</span></td>
      <td>${fmtKm(s.dist45)}</td>
      <td>${fmtKm(s.dist30)}</td>
      <td>${s.abarMax.toFixed(1)} dB</td>
      <td>${s.masked
        ? '<span class="sc-rp-ok">▮ MASQUÉ</span>'
        : '<span class="sc-rp-warn">▯ DÉGAGÉ</span>'}</td>
    </tr>`).join('');

  el('sc-report').innerHTML = `
    <div class="sc-rp-block">
      <div class="sc-rp-title">01 · PARAMÈTRES DE SIMULATION</div>
      <div class="sc-rp-grid">
        <div><span class="sc-rp-k">Horodatage</span><span>${d.dateStr}</span></div>
        <div><span class="sc-rp-k">Point source</span><span class="sc-rp-mono">${d.lat}, ${d.lng}</span></div>
        <div><span class="sc-rp-k">Altitude source</span><span>${d.sourceElev} m</span></div>
        <div><span class="sc-rp-k">Configuration sonore</span><span${d.nStacks > 1 ? ' class="sc-rp-hl"' : ''}>${d.totalTxt}</span></div>
        <div><span class="sc-rp-k">Hauteur du mur</span><span>${d.wallHeight} m</span></div>
        ${d.simRange ? `<div><span class="sc-rp-k">Portée de simulation</span><span>${d.simRange} (adaptative)</span></div>` : ''}
        <div><span class="sc-rp-k">Environnement d'émission</span><span>${d.venueLabel}${d.indoor ? ` · ouvertures ${d.openLabel}` : ''}</span></div>
        ${d.indoor ? `<div><span class="sc-rp-k">Isolement enveloppe (basses fréq.)</span><span>paroi ${d.tlEnv} dB → effectif <span class="sc-rp-hl">${d.tlEff.toFixed(1)} dB</span></span></div>` : ''}
        <div><span class="sc-rp-k">${d.indoor ? 'Orientation des ouvertures' : 'Orientation stack'}</span><span>${d.omni ? 'sans objet (rayonnement omnidirectionnel)' : d.orientTxt}</span></div>
        <div><span class="sc-rp-k">Niveau de puissance du rig Lw</span><span>${d.lwSource} dB re 1 pW</span></div>
        ${d.indoor ? `<div><span class="sc-rp-k">Lw effectif rayonné vers l'extérieur</span><span class="sc-rp-hl">${d.lw} dB re 1 pW</span></div>` : ''}
        <div><span class="sc-rp-k">Mode de calcul</span><span>${d.mode}</span></div>
      </div>
    </div>

    <div class="sc-rp-block">
      <div class="sc-rp-title">02 · RÉSULTATS GLOBAUX</div>
      <div class="sc-rp-grid">
        <div><span class="sc-rp-k">Empreinte audible (≥ 45 dB)</span><span class="sc-rp-hl">${d.area45} km²</span></div>
        <div><span class="sc-rp-k">Empreinte résiduelle (≥ 30 dB)</span><span>${d.area30} km²</span></div>
        <div><span class="sc-rp-k">Référence plate 45 dB</span><span>${d.flat45} de rayon (${d.flatArea45} km²)</span></div>
        <div><span class="sc-rp-k">Référence plate 30 dB</span><span>${d.flat30} de rayon</span></div>
        <div><span class="sc-rp-k">Masque topographique</span><span class="sc-rp-hl">${d.maskPct} %</span></div>
        <div><span class="sc-rp-k">Azimuts occultés</span><span>${d.blockedRays} / ${d.rayCount}</span></div>
        <div><span class="sc-rp-k">Direction la plus défavorable</span><span>${d.worstAz} — audible à ${d.worstDist}</span></div>
      </div>
    </div>

    <div class="sc-rp-block">
      <div class="sc-rp-title">03 · ANALYSE PAR SECTEUR</div>
      <table class="sc-rp-table">
        <thead><tr>
          <th>Secteur</th><th>Portée 45 dB</th><th>Portée 30 dB</th><th>Atténuation relief</th><th>Statut</th>
        </tr></thead>
        <tbody>${sectorRows}</tbody>
      </table>
    </div>

    <div class="sc-rp-block">
      <div class="sc-rp-title">04 · ARGUMENTAIRE JURIDIQUE — ZONE SCANNÉE</div>
      <div class="sc-rp-law">
        <div class="sc-rp-law-cadre">
          <strong>Cadre applicable :</strong> Code de la santé publique art. R. 1336-5 (principe général des bruits
          de voisinage) et R. 1336-7 (émergence maximale : 5 dB(A) le jour, 3 dB(A) la nuit, 22h–7h) ·
          Code pénal art. R. 623-2 (tapage nocturne) · Décret n° 2002-887 du 3 mai 2002 (rassemblements
          festifs à caractère musical) · Norme NF S 31-010 (méthodologie de mesure des bruits de voisinage).${d.indoor ? `
          <br /><strong>Spécifique aux lieux clos :</strong> décret n° 2017-1244 du 7 août 2017 et art. R. 1336-1
          CSP (lieux clos ou ouverts au public diffusant de la musique amplifiée : 102 dB(A) sur 15 min et
          118 dB(C) sur 15 min à l'intérieur, protection du public) — applicable si le lieu reçoit du public,
          indépendamment des nuisances de voisinage traitées ci-dessous.` : ''}
        </div>
        <ol class="sc-rp-args">
          <li><strong>ARG-01 — Portée limitée.</strong> Dans la direction la plus défavorable (${d.worstAz}),
          le niveau calculé passe sous 45 dB(A) au-delà de ${d.worstDistM} m, soit un niveau comparable au fond
          sonore d'une zone rurale. Au-delà du contour 30 dB (rayon max ${d.flat30} en terrain plat), le son est
          noyé dans le bruit résiduel nocturne : l'émergence au sens de l'art. R. 1336-7 CSP ne peut être
          caractérisée chez un riverain situé hors de ce contour.</li>
          ${d.isTopo ? `<li><strong>ARG-02 — Masque topographique.</strong> Le relief absorbe ${d.maskPct} % de
          l'empreinte théorique en terrain plat; ${d.blockedRays} azimuts sur ${d.rayCount} sont occultés par la
          topographie (atténuation par diffraction jusqu'à 20 dB, ISO 9613-2). Le choix de ce site constitue une
          démarche proactive et documentée de limitation des nuisances sonores, élément d'appréciation pertinent
          en cas de contestation pour trouble anormal du voisinage.</li>` : `<li><strong>ARG-02 — Calcul
          conservateur.</strong> La simulation a été effectuée en mode terrain plat (pire cas) : tout relief réel
          autour du site ne peut que réduire l'empreinte sonore présentée ici. Les valeurs constituent une borne
          haute opposable.</li>`}
          ${d.indoor ? `<li><strong>ARG-03 — Confinement du dispositif.</strong> Le système de sonorisation est
          installé en ${d.venueLabel.toLowerCase()} : l'enveloppe du bâtiment procure un isolement effectif estimé
          à ${d.tlEff.toFixed(1)} dB aux basses fréquences (paroi ${d.tlEnv} dB, loi des parois composites avec
          ouvertures ${d.openLabel.toLowerCase()}). Le niveau de puissance rayonné vers l'extérieur est ainsi
          ramené de ${d.lwSource} à ${d.lw} dB. Le confinement en lieu clos constitue la mesure de réduction à la
          source la plus efficace et la plus vérifiable.${d.omni ? '' : ` Les ouvertures principales sont orientées
          ${d.orientTxt}, à l'opposé des zones sensibles identifiées.`}</li>`
          : `<li><strong>ARG-03 — Orientation maîtrisée du dispositif.</strong> Le mur de son est orienté ${d.orientTxt} :
          l'émission vers l'arrière (secteur ${d.rearTxt}) est atténuée d'environ 12 dB par la directivité du
          dispositif, réduisant d'autant l'exposition des zones situées dos au stack. Ce paramétrage démontre une
          configuration réfléchie du dispositif de sonorisation.</li>`}
          <li><strong>ARG-04 — Méthode reproductible et vérifiable.</strong> La présente simulation applique la
          norme ISO 9613-2 (atténuation du son en propagation extérieure) complétée par le modèle de diffraction
          de Maekawa. Paramètres intégralement documentés en section 01 : le calcul est reproductible et
          vérifiable contradictoirement par mesurage NF S 31-010 au point récepteur concerné.</li>
        </ol>
        <div class="sc-rp-check">
          <strong>Checklist avant événement :</strong> vérifier l'absence d'habitations dans le contour 45 dB ·
          relever le fond sonore résiduel du site (sonomètre, 10 min) · conserver ce rapport horodaté avec les
          paramètres · prévoir un référent joignable et un protocole de réduction de volume.${d.indoor ? `
          <br /><strong>Spécifique intérieur :</strong> maintenir fermées les ouvertures côté habitations
          (chaque porte ouverte court-circuite l'isolement) · contrôler le niveau réel à l'extérieur du bâtiment
          en début d'événement · si public accueilli : afficher les niveaux et respecter 102 dB(A)/15 min à
          l'intérieur (R. 1336-1 CSP) · vérifier la ventilation (un lieu clos plein ne se ferme pas
          hermétiquement sans risque).` : ''}
        </div>
      </div>
    </div>

    <div class="sc-rp-block sc-rp-reserves">
      <div class="sc-rp-title">05 · RÉSERVES MÉTHODOLOGIQUES</div>
      <p>Document d'aide à la décision généré localement par l'outil SoundCheck (calcul 100 % client-side,
      aucune donnée transmise). Il ne constitue ni un avis juridique, ni un mesurage acoustique réglementaire
      au sens de la norme NF S 31-010. Le modèle ne tient pas compte du vent, des inversions thermiques
      nocturnes (propagation accrue), de la végétation ni des réflexions. En configuration multi-stacks, les
      systèmes sont modélisés co-localisés au point source (cumul énergétique +10·log10(N)) : c'est une borne
      haute au centre du site, l'étalement réel des stacks sur le terrain disperse légèrement l'empreinte.
      Rendement électroacoustique supposé :
      2 % · facteur de programme : -6 dB · fréquence dominante modélisée : 200 Hz. En intérieur, l'isolement
      d'enveloppe est une estimation basse fréquence par typologie constructive (loi des parois composites) :
      l'isolement réel du bâtiment doit être vérifié sur site.</p>
    </div>
  `;
}

/* == EXPORTS ============================================================== */

function exportMarkdown() {
  if (!state.lastResult) return;
  const d = buildReportData(state.lastResult);

  const sectorRows = d.sectors.map((s) =>
    `| ${s.name} (${s.az}°) | ${fmtKm(s.dist45)} | ${fmtKm(s.dist30)} | ${s.abarMax.toFixed(1)} dB | ${s.masked ? 'MASQUÉ' : 'DÉGAGÉ'} |`
  ).join('\n');

  const md = `# SOUNDCHECK — RAPPORT D'ANALYSE ACOUSTIQUE PRÉVISIONNELLE

Généré le ${d.dateStr} · SoundCheck v2.0 · Soundsystem Hardening
Diffusion restreinte — contient les coordonnées du site étudié.

## 01 · Paramètres de simulation

| Paramètre | Valeur |
|---|---|
| Horodatage | ${d.stamp} |
| Point source | ${d.lat}, ${d.lng} |
| Altitude source | ${d.sourceElev} m |
| Configuration sonore | ${d.totalTxt} |
| Hauteur du mur de son | ${d.wallHeight} m |
${d.simRange ? `| Portée de simulation | ${d.simRange} (adaptative) |\n` : ''}\
| Environnement d'émission | ${d.venueLabel}${d.indoor ? ` · ouvertures ${d.openLabel}` : ''} |
${d.indoor ? `| Isolement enveloppe (basses fréq.) | paroi ${d.tlEnv} dB → effectif ${d.tlEff.toFixed(1)} dB |\n` : ''}| ${d.indoor ? 'Orientation des ouvertures' : 'Orientation du stack'} | ${d.omni ? 'sans objet (omnidirectionnel)' : d.orientTxt} |
| Niveau de puissance du rig Lw | ${d.lwSource} dB re 1 pW |
${d.indoor ? `| Lw effectif rayonné vers l'extérieur | ${d.lw} dB re 1 pW |\n` : ''}| Mode de calcul | ${d.mode} |
| Seuils | 45 dB (audible) / 30 dB (résiduel) |

## 02 · Résultats globaux

| Indicateur | Valeur |
|---|---|
| Empreinte audible (>= 45 dB) | ${d.area45} km² |
| Empreinte résiduelle (>= 30 dB) | ${d.area30} km² |
| Référence plate 45 dB | rayon ${d.flat45} (${d.flatArea45} km²) |
| Référence plate 30 dB | rayon ${d.flat30} |
| Masque topographique | ${d.maskPct} % |
| Azimuts occultés | ${d.blockedRays} / ${d.rayCount} |
| Direction la plus défavorable | ${d.worstAz}, audible à ${d.worstDist} |

## 03 · Analyse par secteur

| Secteur | Portée 45 dB | Portée 30 dB | Atténuation relief | Statut |
|---|---|---|---|---|
${sectorRows}

## 04 · Argumentaire juridique (zone scannée)

Cadre applicable : Code de la santé publique art. R. 1336-5 et R. 1336-7 (émergence
5 dB(A) jour / 3 dB(A) nuit) ; Code pénal art. R. 623-2 (tapage nocturne) ; Décret
n° 2002-887 du 3 mai 2002 (rassemblements festifs à caractère musical) ; Norme
NF S 31-010 (mesure des bruits de voisinage).${d.indoor ? `
Spécifique lieux clos : décret n° 2017-1244 du 7 août 2017 et art. R. 1336-1 CSP
(102 dB(A) / 118 dB(C) sur 15 min à l'intérieur si le lieu reçoit du public).` : ''}

1. **ARG-01 — Portée limitée.** Dans la direction la plus défavorable (${d.worstAz}),
   le niveau calculé passe sous 45 dB(A) au-delà de ${d.worstDistM} m. Au-delà du
   contour 30 dB, le son est noyé dans le bruit résiduel nocturne : l'émergence au
   sens de l'art. R. 1336-7 CSP ne peut être caractérisée hors de ce contour.
${d.isTopo
? `2. **ARG-02 — Masque topographique.** Le relief absorbe ${d.maskPct} % de l'empreinte
   théorique ; ${d.blockedRays}/${d.rayCount} azimuts sont occultés (diffraction jusqu'à
   20 dB, ISO 9613-2). Choix de site documenté = démarche proactive de limitation des
   nuisances, pertinente face à une allégation de trouble anormal du voisinage.`
: `2. **ARG-02 — Calcul conservateur.** Simulation en terrain plat (pire cas) : le relief
   réel ne peut que réduire l'empreinte présentée. Valeurs = borne haute opposable.`}
${d.indoor
? `3. **ARG-03 — Confinement du dispositif.** Sonorisation installée en ${d.venueLabel.toLowerCase()} :
   isolement effectif estimé ${d.tlEff.toFixed(1)} dB aux basses fréquences (paroi ${d.tlEnv} dB,
   loi des parois composites, ouvertures ${d.openLabel.toLowerCase()}). Lw rayonné ramené de
   ${d.lwSource} à ${d.lw} dB : mesure de réduction à la source la plus efficace et vérifiable.${d.omni ? '' : `
   Ouvertures principales orientées ${d.orientTxt}.`}`
: `3. **ARG-03 — Orientation maîtrisée.** Stack orienté ${d.orientTxt} ; émission arrière
   (secteur ${d.rearTxt}) atténuée d'environ 12 dB par la directivité du dispositif.`}
4. **ARG-04 — Méthode reproductible.** ISO 9613-2 + diffraction de Maekawa, paramètres
   documentés, vérifiable contradictoirement par mesurage NF S 31-010.

Checklist : absence d'habitations dans le contour 45 dB · relevé du fond sonore
résiduel · conservation du rapport horodaté · référent joignable sur site.${d.indoor ? `
Spécifique intérieur : ouvertures côté habitations maintenues fermées (une porte
ouverte court-circuite l'isolement) · contrôle sonomètre extérieur en début
d'événement · si public : 102 dB(A)/15 min à l'intérieur (R. 1336-1 CSP) · ventilation.` : ''}

## 05 · Réserves méthodologiques

Document d'aide à la décision généré localement (100 % client-side). Ne constitue ni
un avis juridique ni un mesurage réglementaire NF S 31-010. Non pris en compte : vent,
inversions thermiques nocturnes, végétation, réflexions. Multi-stacks : sources
modélisées co-localisées (cumul +10·log10(N), borne haute au centre du site).
Hypothèses : rendement 2 %,
facteur de programme -6 dB, fréquence dominante 200 Hz. En intérieur : isolement
d'enveloppe estimé par typologie constructive (loi des parois composites), à vérifier
sur site.
`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soundcheck-rapport-${state.lastMeta.date.toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  logLine('Rapport exporté en Markdown (généré localement, aucun upload).', 'ok');
}

function exportPrint() {
  if (!state.lastResult) return;
  const reportHtml = el('sc-report').innerHTML;
  const d = buildReportData(state.lastResult);

  const w = window.open('', '_blank');
  if (!w) { logLine('Popup bloquée par le navigateur — autorise les popups pour imprimer.', 'err'); return; }

  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>SoundCheck — Rapport ${d.stamp}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; margin: 40px; line-height: 1.5; }
  h1 { font-size: 19px; border-bottom: 2px solid #111; padding-bottom: 8px; letter-spacing: 0.05em; }
  .meta { font-size: 11px; color: #555; margin-bottom: 24px; }
  .sc-rp-block { margin-bottom: 22px; page-break-inside: avoid; }
  .sc-rp-title { font-size: 12px; font-weight: bold; letter-spacing: 0.12em; border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 10px; }
  .sc-rp-grid div { display: flex; justify-content: space-between; gap: 16px; font-size: 12px; padding: 3px 0; border-bottom: 1px dotted #ddd; }
  .sc-rp-k { color: #555; }
  .sc-rp-hl { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #999; padding: 5px 8px; text-align: left; }
  th { background: #eee; }
  .sc-rp-args li { font-size: 12px; margin-bottom: 10px; }
  .sc-rp-law-cadre, .sc-rp-check { font-size: 11px; background: #f4f4f4; padding: 10px 12px; margin: 10px 0; }
  .sc-rp-reserves p { font-size: 10.5px; color: #444; }
  .sc-rp-ok::before { content: '■ '; } .sc-rp-warn::before { content: '□ '; }
</style></head><body>
<h1>SOUNDCHECK — RAPPORT D'ANALYSE ACOUSTIQUE PRÉVISIONNELLE</h1>
<div class="meta">Généré le ${d.dateStr} · SoundCheck v2.0 · Soundsystem Hardening · Diffusion restreinte (coordonnées du site incluses)</div>
${reportHtml}
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
  logLine('Vue d\'impression ouverte — imprime ou enregistre en PDF.', 'ok');
}

/* == UI HELPERS =========================================================== */

function endScan() {
  state.running = false;
  const btn = el('sc-scan-btn');
  btn.disabled = !state.source;
  btn.classList.remove('sc-scanning');
  btn.textContent = '[ LANCER LE SCAN TOPOGRAPHIQUE ]';
  setProgress(1);
}

function setReadout(id, text, tone) {
  const node = el(id);
  node.textContent = text;
  node.classList.remove('sc-good', 'sc-mid', 'sc-bad');
  if (tone === 'good') node.classList.add('sc-good');
  if (tone === 'mid') node.classList.add('sc-mid');
  if (tone === 'bad') node.classList.add('sc-bad');
}

function setGauge(id, pct, color) {
  const g = el(id);
  if (!g) return;
  g.style.width = `${Math.max(2, Math.min(100, pct))}%`;
  g.style.background = color;
  g.style.boxShadow = `0 0 8px ${color}`;
}

function setProgress(value) {
  el('sc-progress').style.width = `${Math.round(value * 100)}%`;
}

function logLine(text, tone) {
  const box = el('sc-console');
  const line = document.createElement('div');
  const ts = new Date().toTimeString().slice(0, 8);
  line.textContent = `[${ts}] ${text}`;
  line.className = tone === 'err' ? 'sc-log-err'
    : tone === 'warn' ? 'sc-log-warn'
    : tone === 'ok' ? 'sc-log-ok'
    : 'sc-log';
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function compass16(az) {
  return COMPASS_16[Math.round(((az % 360) + 360) % 360 / 22.5) % 16];
}

function fmtKm(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

function el(id) {
  return document.getElementById(id);
}
