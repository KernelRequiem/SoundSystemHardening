/**
 * acousticWorker.js — SOUNDCHECK v2 / Soundsystem Hardening
 * ----------------------------------------------------------
 * Web Worker natif. Zéro dépendance, zéro requête réseau.
 * Empreinte acoustique par lancer de rayons topographiques (raycasting)
 * + propagation ISO 9613-2 + diffraction de Maekawa + directivité du stack.
 *
 * ENTREE :
 * {
 *   cmd: 'COMPUTE',
 *   payload: {
 *     powerKw:     number,   // puissance électrique PAR STACK (kW)
 *     stackCount:  number,   // nombre de stacks / sound systems (teknival : cumul +10·log10(N))
 *     maxRange:    number,   // portée de simulation (m) — adaptative côté client
 *     wallHeight:  number,   // hauteur du mur de son (m)
 *     orientation: number,   // azimut face avant du stack / ouvertures (deg, 0 = Nord)
 *     sourceElev:  number,   // altitude du sol au point source (m)
 *     flatMode:    boolean,  // true = pas de topo (fallback hors-ligne)
 *     venue: {               // environnement d'émission
 *       tlEnv:      number,  // isolement de l'enveloppe aux basses fréq. (dB), 0 = plein air
 *       openFrac:   number,  // fraction de surface ouverte (portes/fuites), 0..1
 *       indoor:     boolean,
 *       dirFloorDb: number,  // contraste avant/arrière de directivité (dB), 0 = omni
 *     },
 *     rays: [{ azimuth: deg, profile: [{dist,elev}] | null }]
 *   }
 * }
 *
 * SORTIE :
 *   { cmd:'PROGRESS', value: 0..1 }
 *   { cmd:'RESULT',  payload: {...} }  — voir fin de fichier
 */

'use strict';

/* == CONSTANTES PHYSIQUES ================================================ */

const EFFICIENCY      = 0.02;    // rendement électroacoustique d'un gros PA (~2 %)
const PROGRAM_DB      = 6;       // facteur de programme (musique != sinus continu)
const P_REF           = 1e-12;   // puissance acoustique de référence (W)
const ATM_ABS         = 0.0035;  // absorption atmosphérique (dB/m), pondérée basses
const LAMBDA          = 1.7;     // longueur d'onde dominante ~200 Hz (m)
const RECEIVER_HEIGHT = 1.5;     // oreille d'un riverain debout (m)
const MAX_BARRIER_DB  = 20;      // plafond ISO 9613-2, diffraction simple (dB)
const MIN_DIST        = 50;      // début de la marche (m)
const STEP            = 25;      // pas de marche (m)
const MAX_RANGE_DEF   = 8000;    // portée par défaut (m)
const MAX_RANGE_CAP   = 25000;   // portée plafond (m) — config teknival

const THRESHOLD_AUDIBLE  = 45;   // dB SPL : audible / gêne potentielle (nuit)
const THRESHOLD_RESIDUAL = 30;   // dB SPL : fond sonore rural nocturne, inaudible au-delà

const SECTOR_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/* == OUTILS MATHEMATIQUES ================================================ */

/** Lw (dB) depuis la puissance électrique (kW). */
function soundPowerLevel(powerKw) {
  const acousticWatts = powerKw * 1000 * EFFICIENCY;
  return 10 * Math.log10(acousticWatts / P_REF) - PROGRAM_DB;
}

/**
 * ISOLEMENT COMPOSITE DE L'ENVELOPPE (loi des parois composites).
 * τ_eff = (1-f)·10^(-TL/10) + f·1  →  TL_eff = -10·log10(τ_eff)
 * Les ouvertures (facteur f) dominent : une porte ouverte court-circuite
 * la meilleure paroi. tlEnv = 0 → plein air, TL_eff = 0.
 */
function compositeTL(tlEnv, openFrac) {
  if (tlEnv <= 0) return 0;
  const f = Math.min(1, Math.max(0, openFrac));
  const tau = (1 - f) * Math.pow(10, -tlEnv / 10) + f;
  return -10 * Math.log10(tau);
}

/**
 * Perte de directivité (dB) pour un rayon d'azimut rayAz.
 * Cardioïde en puissance p(θ) = (1+cosθ)/2 avec plancher arrière paramétrable.
 *  - Plein air (stack nu)        : plancher -12 dB (0 dB avant, -3 dB à 90°).
 *  - Intérieur, ouvertures       : plancher -4 dB (le bâtiment lisse le lobe,
 *    les ouvertures gardent une direction privilégiée).
 *  - Intérieur fermé             : dirFloorDb = 0 → omnidirectionnel
 *    (toute l'enveloppe rayonne, l'orientation du stack devient indifférente).
 */
function directivityLoss(rayAz, orientation, dirFloorDb) {
  if (!dirFloorDb || dirFloorDb <= 0) return 0;
  const floor = Math.pow(10, -dirFloorDb / 10);
  const theta = ((rayAz - orientation) * Math.PI) / 180;
  const p = Math.max((1 + Math.cos(theta)) / 2, floor);
  return -10 * Math.log10(p);
}

/** Interpolation linéaire de l'altitude du terrain à la distance d. */
function elevationAt(profile, d) {
  if (!profile || profile.length === 0) return 0;
  if (d <= profile[0].dist) return profile[0].elev;
  const last = profile[profile.length - 1];
  if (d >= last.dist) return last.elev;
  for (let i = 1; i < profile.length; i++) {
    if (profile[i].dist >= d) {
      const a = profile[i - 1];
      const b = profile[i];
      const t = (d - a.dist) / (b.dist - a.dist);
      return a.elev + t * (b.elev - a.elev);
    }
  }
  return last.elev;
}

/** Divergence géométrique : Adiv = 20·log10(d) + 11 (ISO 9613-2 §7.1). */
function divergence(d) {
  return 20 * Math.log10(d) + 11;
}

/** Effet de sol, méthode alternative ISO 9613-2 §7.3.2, borné à 0. */
function groundAttenuation(hm, d) {
  return Math.max(0, 4.8 - (2 * hm / d) * (17 + 300 / d));
}

/**
 * RAYCASTING + Maekawa : cherche le point du relief qui pénètre le plus
 * la ligne de visée Source→Récepteur, calcule la différence de marche δ,
 * le nombre de Fresnel N = 2δ/λ et Abar = 10·log10(3+20N), borné [0, 20].
 */
function barrierAttenuation(profile, dReceiver, srcZ, recZ) {
  if (!profile || profile.length < 2) return { loss: 0, blocked: false };

  let worstDelta = -Infinity;
  for (let i = 0; i < profile.length; i++) {
    const p = profile[i];
    if (p.dist <= 0 || p.dist >= dReceiver) continue;
    const losZ = srcZ + (recZ - srcZ) * (p.dist / dReceiver);
    if (p.elev - losZ > 0) {
      const so  = Math.hypot(p.dist, p.elev - srcZ);
      const or_ = Math.hypot(dReceiver - p.dist, recZ - p.elev);
      const sr  = Math.hypot(dReceiver, recZ - srcZ);
      const delta = so + or_ - sr;
      if (delta > worstDelta) worstDelta = delta;
    }
  }
  if (worstDelta === -Infinity) return { loss: 0, blocked: false };

  const fresnelN = (2 * worstDelta) / LAMBDA;
  const loss = Math.min(MAX_BARRIER_DB, Math.max(0, 10 * Math.log10(3 + 20 * fresnelN)));
  return { loss, blocked: loss > 5 };
}

/* == MOTEUR DE CALCUL ===================================================== */

/**
 * Marche le long d'un rayon. Retourne :
 *  dist45 / dist30 : dernier point où Lp >= seuil (conservateur),
 *  abarMax : atténuation topo max rencontrée,
 *  blocked : relief occultant (> 5 dB) sur le trajet.
 */
function traceRay(lw, dirLoss, sourceElev, wallHeight, profile, flat, maxRange) {
  const srcZ = sourceElev + wallHeight;
  const hm = Math.max(0.5, (wallHeight + RECEIVER_HEIGHT) / 2);

  let dist45 = MIN_DIST;
  let dist30 = MIN_DIST;
  let abarMax = 0;
  let blocked = false;

  for (let d = MIN_DIST; d <= maxRange; d += STEP) {
    let abar = 0;
    if (!flat) {
      const groundZ = elevationAt(profile, d);
      const bar = barrierAttenuation(profile, d, srcZ, groundZ + RECEIVER_HEIGHT);
      abar = bar.loss;
      if (bar.loss > abarMax) abarMax = bar.loss;
      if (bar.blocked) blocked = true;
    }
    const lp = lw - dirLoss - divergence(d) - ATM_ABS * d - groundAttenuation(hm, d) - abar;
    if (lp >= THRESHOLD_AUDIBLE)  dist45 = d;
    if (lp >= THRESHOLD_RESIDUAL) dist30 = d;
  }

  return { dist45, dist30, abarMax, blocked };
}

/** Distance plate de référence (omnidirectionnel, sans relief) pour un seuil. */
function flatDistance(lw, wallHeight, threshold, maxRange) {
  const hm = Math.max(0.5, (wallHeight + RECEIVER_HEIGHT) / 2);
  let dist = MIN_DIST;
  for (let d = MIN_DIST; d <= maxRange; d += STEP) {
    const lp = lw - divergence(d) - ATM_ABS * d - groundAttenuation(hm, d);
    if (lp >= threshold) dist = d;
  }
  return dist;
}

/** Aire d'un contour polaire (formule du lacet adaptée), en m². */
function polarArea(contour) {
  let area = 0;
  const n = contour.length;
  for (let i = 0; i < n; i++) {
    const a = contour[i];
    const b = contour[(i + 1) % n];
    let dTheta = ((b.azimuth - a.azimuth) * Math.PI) / 180;
    if (dTheta <= 0) dTheta += 2 * Math.PI;
    area += 0.5 * a.dist * b.dist * Math.sin(Math.min(dTheta, Math.PI));
  }
  return area;
}

/* == POINT D'ENTREE ======================================================= */

self.onmessage = (event) => {
  const { cmd, payload } = event.data || {};
  if (cmd !== 'COMPUTE') return;

  try {
    const {
      powerKw, wallHeight, orientation = 0,
      stackCount = 1, maxRange: requestedRange,
      sourceElev = 0, flatMode = false, rays = [],
      venue = { tlEnv: 0, openFrac: 0, indoor: false, dirFloorDb: 12 },
    } = payload;

    const maxRange = Math.min(MAX_RANGE_CAP, Math.max(1000, requestedRange || MAX_RANGE_DEF));
    const n = Math.max(1, Math.round(stackCount));

    // Cumul énergétique de N sources incohérentes : +10·log10(N).
    // Hypothèse conservatrice : stacks co-localisés (borne haute au centre du site).
    const lwSource = soundPowerLevel(powerKw) + 10 * Math.log10(n);
    const tlEff = compositeTL(venue.tlEnv, venue.openFrac);
    const lw = lwSource - tlEff;                   // puissance réellement rayonnée vers l'extérieur
    const dirFloorDb = venue.dirFloorDb ?? 12;

    const contour45 = [];
    const contour30 = [];
    const rayDetails = [];
    let blockedRays = 0;

    for (let i = 0; i < rays.length; i++) {
      const ray = rays[i];
      const flat = flatMode || !ray.profile;
      const dirLoss = directivityLoss(ray.azimuth, orientation, dirFloorDb);
      const res = traceRay(lw, dirLoss, sourceElev, wallHeight, ray.profile, flat, maxRange);

      if (res.blocked) blockedRays++;
      contour45.push({ azimuth: ray.azimuth, dist: res.dist45 });
      contour30.push({ azimuth: ray.azimuth, dist: res.dist30 });
      rayDetails.push({
        azimuth: ray.azimuth,
        dist45: res.dist45,
        dist30: res.dist30,
        abarMax: Math.round(res.abarMax * 10) / 10,
        dirLoss: Math.round(dirLoss * 10) / 10,
        blocked: res.blocked,
      });

      if (i % 4 === 0 || i === rays.length - 1) {
        self.postMessage({ cmd: 'PROGRESS', value: (i + 1) / rays.length });
      }
    }

    // Références plates omnidirectionnelles (pire cas opposable)
    const flat45 = flatDistance(lw, wallHeight, THRESHOLD_AUDIBLE, maxRange);
    const flat30 = flatDistance(lw, wallHeight, THRESHOLD_RESIDUAL, maxRange);

    const area45 = polarArea(contour45);
    const area30 = polarArea(contour30);
    const flatArea45 = Math.PI * flat45 * flat45;
    const maskFactor = flatArea45 > 0
      ? Math.max(0, Math.min(1, 1 - area45 / flatArea45))
      : 0;

    // Agrégats par secteur (8 × 45°, N centré sur 0°)
    const sectors = SECTOR_NAMES.map((name, s) => ({
      name, az: s * 45, dist45: 0, dist30: 0, abarMax: 0, blocked: 0, count: 0,
    }));
    for (const rd of rayDetails) {
      const s = Math.round(rd.azimuth / 45) % 8;
      const sec = sectors[s];
      sec.count++;
      if (rd.dist45 > sec.dist45) sec.dist45 = rd.dist45;
      if (rd.dist30 > sec.dist30) sec.dist30 = rd.dist30;
      if (rd.abarMax > sec.abarMax) sec.abarMax = rd.abarMax;
      if (rd.blocked) sec.blocked++;
    }
    for (const sec of sectors) sec.masked = sec.count > 0 && sec.blocked >= sec.count / 2;

    // Direction la plus défavorable (portée audible max)
    let worst = rayDetails[0] || { azimuth: 0, dist45: flat45 };
    for (const rd of rayDetails) if (rd.dist45 > worst.dist45) worst = rd;

    self.postMessage({
      cmd: 'RESULT',
      payload: {
        contour45,
        contour30,
        rayDetails,
        sectors,
        flat45,
        flat30,
        area45Km2: area45 / 1e6,
        area30Km2: area30 / 1e6,
        flatArea45Km2: flatArea45 / 1e6,
        maskFactor,
        blockedRays,
        rayCount: rays.length,
        worstAzimuth: worst.azimuth,
        worstDist45: worst.dist45,
        mode: flatMode ? 'FLAT_ISO9613' : 'TOPO_RAYCAST',
        lw: Math.round(lw * 10) / 10,               // Lw effectif rayonné
        lwSource: Math.round(lwSource * 10) / 10,   // Lw du rig avant enveloppe
        tlEff: Math.round(tlEff * 10) / 10,         // isolement effectif (dB)
        dirFloorDb,
        maxRange,
        thresholds: { audible: THRESHOLD_AUDIBLE, residual: THRESHOLD_RESIDUAL },
        params: { powerKw, stackCount: n, totalKw: powerKw * n, wallHeight, orientation, sourceElev, venue },
      },
    });
  } catch (err) {
    self.postMessage({ cmd: 'ERROR', message: String(err && err.message || err) });
  }
};
