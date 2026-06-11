// ════════════════════════════════════════════════════════════════════════════
// RIG SPLITTING & REDUNDANCY TOOL
// Répartit physiquement le sound system sur plusieurs contenants (véhicules /
// points de stockage) pour réduire le risque de perte totale en cas de saisie.
//
// Modèle de risque PROBABILISTE :
//   - chaque "scénario de saisie" touche k contenants avec une probabilité p.
//   - on calcule l'espérance de valeur perdue et de capacité sonore perdue
//     selon la répartition proposée, vs une répartition naïve (tout ensemble).
// 100% client-side, aucune donnée transmise.
// ════════════════════════════════════════════════════════════════════════════

type Cat = 'ampli' | 'enceinte' | 'table' | 'cable' | 'groupe' | 'autre';

interface Item {
  id: string;
  name: string;
  cat: Cat;
  value: number;   // euros
  critical: boolean; // sans lui, plus de son
}

const CAT_LABELS: Record<Cat, string> = {
  ampli:    'Ampli / tête',
  enceinte: 'Enceinte / caisson',
  table:    'Table / mixette / DJ',
  cable:    'Câblage / accessoires',
  groupe:   'Groupe électrogène',
  autre:    'Autre',
};

// Catégories indispensables pour produire du son : si une de ces catégories est
// entièrement perdue, le rig est hors service (redondance fonctionnelle = 0).
const FUNCTIONAL: Cat[] = ['ampli', 'enceinte', 'table', 'groupe'];

// ─── ÉTAT ─────────────────────────────────────────────────────────────────────

let items: Item[] = [];
let nbContainers = 3;
let scenario: 'routier' | 'site' | 'totale' = 'routier';
let uid = 0;

const root = document.getElementById('rig-root');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
function eur(n: number): string {
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

// ─── MOTEUR DE RÉPARTITION ────────────────────────────────────────────────────
// Objectif : répartir pour qu'aucune catégorie fonctionnelle ne soit concentrée
// dans un seul contenant, et équilibrer la valeur.
//
// Stratégie : round-robin par catégorie fonctionnelle (distribue les amplis sur
// des contenants différents, idem enceintes, etc.), puis équilibrage de la valeur
// pour le reste. Cela garantit une redondance maximale : perdre un contenant ne
// retire jamais 100% d'une catégorie tant qu'il y a >= 2 unités.

function distribute(): Item[][] {
  const bins: Item[][] = Array.from({ length: nbContainers }, () => []);
  const binValue = () => bins.map(b => b.reduce((s, i) => s + i.value, 0));

  // 1) catégories fonctionnelles d'abord, en round-robin décalé par catégorie
  let offset = 0;
  for (const cat of FUNCTIONAL) {
    const group = items.filter(i => i.cat === cat);
    group.forEach((it, idx) => {
      bins[(idx + offset) % nbContainers].push(it);
    });
    offset++; // décalage pour ne pas empiler ampli[0]+enceinte[0] toujours au même endroit
  }

  // 2) le reste (câbles, autre) : remplir le contenant le moins chargé en valeur
  const rest = items.filter(i => !FUNCTIONAL.includes(i.cat));
  for (const it of rest) {
    const vals = binValue();
    let min = 0;
    for (let b = 1; b < nbContainers; b++) if (vals[b] < vals[min]) min = b;
    bins[min].push(it);
  }
  return bins;
}

// ─── MODÈLE DE RISQUE ─────────────────────────────────────────────────────────
// Pour chaque scénario, on définit la distribution du nombre de contenants saisis.
//   - routier   : un contrôle attrape 1 véhicule (parfois 2 s'ils roulent ensemble)
//   - site      : descente sur site, plusieurs contenants présents touchés
//   - totale    : saisie maximale, presque tout part
// On calcule l'espérance de perte = somme sur k de P(k contenants saisis) * perte
// moyenne quand k contenants (les plus chargés, pire cas réaliste) sont saisis.

interface ScenarioModel {
  label: string;
  desc: string;
  // probabilité que EXACTEMENT k contenants soient touchés, pour k=0..nbContainers
  dist: (n: number) => number[];
}

const SCENARIOS: Record<string, ScenarioModel> = {
  routier: {
    label: 'Contrôle routier',
    desc: 'Un véhicule est intercepté et fouillé. Risque que deux partent s\'ils roulent en convoi.',
    dist: (n) => {
      // ~70% : 1 contenant ; ~20% : 2 (convoi) ; ~10% : 0 (rien trouvé / relâché)
      const out = new Array(n + 1).fill(0);
      out[0] = 0.10;
      out[1] = 0.70;
      if (n >= 2) out[2] = 0.20; else out[1] += 0.20;
      return out;
    },
  },
  site: {
    label: 'Descente sur site',
    desc: 'Intervention sur le lieu : les contenants présents sur place sont touchés, ceux restés en amont/aval sont épargnés.',
    dist: (n) => {
      // touche en moyenne ~60% des contenants présents ; on modélise une binomiale p=0.6
      const p = 0.6;
      const out = new Array(n + 1).fill(0);
      for (let k = 0; k <= n; k++) out[k] = binom(n, k, p);
      return out;
    },
  },
  totale: {
    label: 'Saisie totale',
    desc: 'Scénario du pire : opération coordonnée, presque tous les contenants sont saisis.',
    dist: (n) => {
      const p = 0.9;
      const out = new Array(n + 1).fill(0);
      for (let k = 0; k <= n; k++) out[k] = binom(n, k, p);
      return out;
    },
  },
};

function binom(n: number, k: number, p: number): number {
  return choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
  return r;
}

// Perte moyenne quand k contenants sont saisis : on prend la moyenne sur toutes
// les combinaisons de k contenants (espérance exacte = (k/n) * valeur totale,
// car chaque contenant a une chance k/n d'être dans le tirage).
// Pour la perte fonctionnelle, on calcule la proba que le rig devienne inutilisable.

interface RiskResult {
  expectedValueLoss: number;     // espérance de valeur perdue (euros)
  expectedValuePct: number;      // en % de la valeur totale
  pFunctionalKO: number;         // probabilité que le rig soit hors service
  totalValue: number;
  // comparaison avec "tout dans un seul contenant"
  naiveValueLoss: number;
  naivePct: number;
}

function assessRisk(bins: Item[][]): RiskResult {
  const n = bins.length;
  const totalValue = items.reduce((s, i) => s + i.value, 0);
  const binVals = bins.map(b => b.reduce((s, i) => s + i.value, 0));
  const model = SCENARIOS[scenario];
  const dist = model.dist(n);

  // espérance de valeur perdue : sum_k P(k) * E[valeur de k contenants tirés]
  // E[valeur de k contenants] = (k/n) * totalValue  (linéarité, tirage sans remise)
  let expValLoss = 0;
  for (let k = 0; k <= n; k++) {
    const meanLossK = n > 0 ? (k / n) * totalValue : 0;
    expValLoss += dist[k] * meanLossK;
  }

  // proba que le rig soit fonctionnellement KO :
  // on estime via les contenants : pour chaque catégorie fonctionnelle, compter
  // dans combien de contenants elle est présente. Le rig est KO si TOUTE une
  // catégorie fonctionnelle présente est entièrement saisie.
  // Approximation : on calcule, pour le nombre attendu de contenants saisis,
  // la proba qu'au moins une catégorie critique soit entièrement raflée.
  const catSpread: Record<string, number> = {};
  for (const cat of FUNCTIONAL) {
    const present = bins.filter(b => b.some(i => i.cat === cat)).length;
    if (items.some(i => i.cat === cat)) catSpread[cat] = present;
  }
  // P(une catégorie répartie sur m contenants soit entièrement saisie | k saisis)
  // = C(n-m, k-m)/C(n,k) si k>=m sinon 0 ; on agrège sur k via la distribution,
  // puis union bound prudente (max sur les catégories = pire maillon).
  let pKO = 0;
  for (let k = 0; k <= n; k++) {
    let pCatAllSeizedGivenK = 0;
    for (const cat of Object.keys(catSpread)) {
      const m = catSpread[cat];
      const p = k >= m ? choose(n - m, k - m) / Math.max(choose(n, k), 1e-9) : 0;
      pCatAllSeizedGivenK = Math.max(pCatAllSeizedGivenK, p); // maillon faible
    }
    pKO += dist[k] * pCatAllSeizedGivenK;
  }

  // référence naïve : tout dans 1 contenant -> dès qu'on saisit >=1 contenant, tout part
  const pAtLeastOne = 1 - dist[0];
  const naiveLoss = pAtLeastOne * totalValue;

  return {
    expectedValueLoss: expValLoss,
    expectedValuePct: totalValue ? (expValLoss / totalValue) * 100 : 0,
    pFunctionalKO: pKO,
    totalValue,
    naiveValueLoss: naiveLoss,
    naivePct: totalValue ? (naiveLoss / totalValue) * 100 : 0,
  };
}

// ─── RENDER ───────────────────────────────────────────────────────────────────

function addItem(name = '', cat: Cat = 'enceinte', value = 0, critical = false): void {
  items.push({ id: 'it' + (uid++), name, cat, value, critical });
}

function renderInput(): string {
  const rows = items.map(it => `
    <div class="ot-matrow" data-id="${it.id}">
      <input class="ot-input" data-f="name" placeholder="ex: Tête RCF 4Pro" value="${esc(it.name)}" />
      <select class="ot-select" data-f="cat">
        ${(Object.keys(CAT_LABELS) as Cat[]).map(c => `<option value="${c}" ${it.cat === c ? 'selected' : ''}>${CAT_LABELS[c]}</option>`).join('')}
      </select>
      <input class="ot-input" data-f="value" type="number" min="0" placeholder="€" value="${it.value || ''}" />
      <button class="ot-del" data-del="${it.id}" title="Supprimer">×</button>
    </div>`).join('');

  return `
    <div class="ot-explain">
      <div class="ot-explain-title">⊟ Principe</div>
      <div class="ot-explain-txt">Une saisie ne devient une catastrophe que si tout part d'un coup. En répartissant le rig sur plusieurs contenants (véhicules, points de stockage), tu transformes une perte totale en perte partielle. L'outil calcule l'espérance de perte selon le scénario et propose une répartition qui préserve la redondance fonctionnelle.</div>
    </div>

    <div class="ot-section-head"><span class="lbl">1 · Ton matériel</span><span class="line"></span></div>
    <div id="rig-items">${rows || '<div class="ot-empty">Aucun matériel. Ajoute tes éléments ou charge un exemple.</div>'}</div>
    <div class="ot-nav" style="margin-top:12px">
      <button class="ot-btn" id="rig-add">+ Ajouter un élément</button>
      <button class="ot-btn" id="rig-sample">⎙ Charger un exemple</button>
    </div>

    <div class="ot-section-head" style="margin-top:28px"><span class="lbl">2 · Répartition & scénario</span><span class="line"></span></div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end;margin-bottom:6px">
      <div style="flex:1;min-width:180px">
        <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(122,122,138,0.8);display:block;margin-bottom:6px">Nombre de contenants</label>
        <select class="ot-select" id="rig-containers">
          ${[2, 3, 4, 5, 6].map(n => `<option value="${n}" ${n === nbContainers ? 'selected' : ''}>${n} véhicules / points</option>`).join('')}
        </select>
      </div>
      <div style="flex:2;min-width:220px">
        <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(122,122,138,0.8);display:block;margin-bottom:6px">Scénario de saisie modélisé</label>
        <select class="ot-select" id="rig-scenario">
          ${Object.entries(SCENARIOS).map(([k, s]) => `<option value="${k}" ${k === scenario ? 'selected' : ''}>${s.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <p class="ot-step-hint" id="rig-scenario-desc">${esc(SCENARIOS[scenario].desc)}</p>

    <div class="ot-nav">
      <button class="ot-btn ot-btn-primary" id="rig-compute" ${items.length < 2 ? 'disabled' : ''}>Calculer la répartition optimale →</button>
    </div>

    <div id="rig-output"></div>`;
}

function renderOutput(): void {
  const out = document.getElementById('rig-output');
  if (!out) return;
  if (items.length < 2) { out.innerHTML = ''; return; }

  const bins = distribute();
  const risk = assessRisk(bins);

  // jauge : perte attendue en % (répartie) vs naïve
  const pct = Math.min(100, risk.expectedValuePct);
  const naivePct = Math.min(100, risk.naivePct);
  const gaugeColor = pct < 25 ? '#00ff9f' : pct < 50 ? '#facc15' : '#f87171';
  const koPct = Math.round(risk.pFunctionalKO * 100);
  const koColor = koPct < 25 ? 'green' : koPct < 50 ? 'orange' : 'red';

  // cartes véhicules
  const vehCards = bins.map((b, i) => {
    const val = b.reduce((s, it) => s + it.value, 0);
    const cats = new Set(b.map(it => it.cat));
    const itemsHtml = b.length
      ? b.map(it => `<div class="ot-veh-item"><span>${esc(it.name || CAT_LABELS[it.cat])} <span class="ot-chip ${it.critical ? 'ot-chip--crit' : ''}">${CAT_LABELS[it.cat]}</span></span><span style="color:rgba(122,122,138,0.85)">${eur(it.value)}</span></div>`).join('')
      : '<div class="ot-veh-item" style="color:rgba(122,122,138,0.6)">vide</div>';
    return `
      <div class="ot-veh-card">
        <div class="ot-veh-head">
          <span class="ot-veh-name">▣ Contenant ${i + 1}</span>
          <span class="ot-veh-stat">${b.length} élément(s) · ${eur(val)} · ${cats.size} catégorie(s)</span>
        </div>
        ${itemsHtml}
      </div>`;
  }).join('');

  // analyse de redondance par catégorie fonctionnelle
  const redundancy = FUNCTIONAL.filter(c => items.some(i => i.cat === c)).map(cat => {
    const spread = bins.filter(b => b.some(i => i.cat === cat)).length;
    const count = items.filter(i => i.cat === cat).length;
    const sev = spread >= 2 ? 'green' : 'red';
    const note = spread >= 2
      ? `répartie sur ${spread} contenants — perdre un contenant n'élimine pas la catégorie`
      : `concentrée sur 1 seul contenant — point unique de défaillance`;
    return `<div class="ot-row"><span class="bullet"><span class="ot-badge ot-badge--${sev}">${spread >= 2 ? 'redondant' : 'fragile'}</span></span><span class="txt"><strong style="color:rgba(232,232,240,0.95)">${CAT_LABELS[cat]}</strong> (${count} unité·s) — ${note}</span></div>`;
  }).join('');

  out.innerHTML = `
    <div class="ot-report" style="margin-top:24px">
      <div class="ot-report-head">
        <div class="ot-report-kicker">Plan de répartition · scénario : ${esc(SCENARIOS[scenario].label)}</div>
        <h2 class="ot-report-title">${eur(risk.totalValue)} répartis sur ${nbContainers} contenants</h2>
      </div>
      <div class="ot-report-body">

        <div class="ot-section">
          <div class="ot-section-head"><span class="lbl">▣ Risque de perte (espérance)</span><span class="line"></span></div>
          <div class="ot-gauge">
            <div class="ot-gauge-track"><div class="ot-gauge-fill" style="width:${pct}%;background:${gaugeColor}"></div></div>
            <div class="ot-gauge-scale"><span>Réparti : ${Math.round(pct)}% de perte attendue (${eur(risk.expectedValueLoss)})</span><span>0 → 100%</span></div>
          </div>
          <div class="ot-gauge">
            <div class="ot-gauge-track"><div class="ot-gauge-fill" style="width:${naivePct}%;background:rgba(248,113,113,0.5)"></div></div>
            <div class="ot-gauge-scale"><span style="color:rgba(248,113,113,0.8)">Tout dans 1 contenant : ${Math.round(naivePct)}% (${eur(risk.naiveValueLoss)})</span><span>référence naïve</span></div>
          </div>
          <div class="ot-row" style="margin-top:10px">
            <span class="bullet"><span class="ot-badge ot-badge--${koColor}">${koPct}%</span></span>
            <span class="txt">Probabilité que le rig soit <strong>hors service</strong> (une catégorie indispensable entièrement saisie) dans ce scénario.</span>
          </div>
        </div>

        <div class="ot-section">
          <div class="ot-section-head"><span class="lbl">⊟ Plan de répartition concret</span><span class="line"></span></div>
          ${vehCards}
        </div>

        <div class="ot-section">
          <div class="ot-section-head"><span class="lbl">◆ Redondance fonctionnelle</span><span class="line"></span></div>
          ${redundancy || '<div class="ot-row"><span class="txt" style="color:rgba(122,122,138,0.7)">Ajoute du matériel des catégories indispensables (ampli, enceinte, table, groupe) pour analyser la redondance.</span></div>'}
        </div>

        <div class="ot-explain" style="margin-bottom:0">
          <div class="ot-explain-title">▸ Recommandations</div>
          <div class="ot-explain-txt">
            Fais rouler les contenants séparément (pas en convoi) pour neutraliser le risque "deux véhicules d'un coup".
            Garde factures et titres de propriété hors des contenants, chez un tiers, pour pouvoir contester une saisie.
            Vise au moins 2 contenants par catégorie indispensable : c'est ce qui fait passer le rig de "fragile" à "redondant".
            <a class="ot-reslink" style="margin-left:4px" href="/wiki/recours-juridiques">◇ Contester une saisie →</a>
            <a class="ot-reslink" style="margin-left:6px" href="/wiki/Documentation-Preemptive">◇ Documentation préemptive →</a>
          </div>
        </div>

        <div class="ot-nav">
          <button class="ot-btn ot-btn-primary" id="rig-copy">⎘ Copier le plan (texte)</button>
        </div>
      </div>
    </div>`;

  document.getElementById('rig-copy')?.addEventListener('click', () => copyPlan(bins, risk));
}

// ─── EXPORT TEXTE ─────────────────────────────────────────────────────────────

function copyPlan(bins: Item[][], risk: RiskResult): void {
  const L: string[] = [];
  L.push('=== PLAN DE RÉPARTITION DU RIG ===');
  L.push(`Scénario modélisé : ${SCENARIOS[scenario].label}`);
  L.push(`Valeur totale : ${eur(risk.totalValue)}`);
  L.push(`Perte attendue (réparti) : ${Math.round(risk.expectedValuePct)}% (${eur(risk.expectedValueLoss)})`);
  L.push(`Perte si tout ensemble : ${Math.round(risk.naivePct)}% (${eur(risk.naiveValueLoss)})`);
  L.push(`Proba rig hors service : ${Math.round(risk.pFunctionalKO * 100)}%`);
  L.push('');
  bins.forEach((b, i) => {
    const val = b.reduce((s, it) => s + it.value, 0);
    L.push(`# Contenant ${i + 1} (${eur(val)})`);
    b.forEach(it => L.push(`  - ${it.name || CAT_LABELS[it.cat]} [${CAT_LABELS[it.cat]}] ${eur(it.value)}`));
    if (!b.length) L.push('  (vide)');
  });
  L.push('');
  L.push('Conseils : contenants séparés (pas de convoi), factures chez un tiers, 2+ contenants par catégorie clé.');
  L.push('Généré localement via soundsystemhardening.fr/opsec-tools — aucune donnée transmise.');

  navigator.clipboard?.writeText(L.join('\n')).then(() => {
    const btn = document.getElementById('rig-copy');
    if (btn) { const old = btn.textContent; btn.textContent = '✓ Copié'; setTimeout(() => btn.textContent = old, 1600); }
  }).catch(() => {});
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

function bind(): void {
  if (!root) return;

  document.getElementById('rig-add')?.addEventListener('click', () => { addItem(); rerender(); });

  document.getElementById('rig-sample')?.addEventListener('click', () => {
    items = [];
    addItem('Tête d\'ampli #1', 'ampli', 1200, true);
    addItem('Tête d\'ampli #2', 'ampli', 1200, true);
    addItem('Caisson sub #1', 'enceinte', 900, true);
    addItem('Caisson sub #2', 'enceinte', 900, true);
    addItem('Caisson sub #3', 'enceinte', 900, true);
    addItem('Caisson sub #4', 'enceinte', 900, true);
    addItem('Table de mix', 'table', 800, true);
    addItem('Groupe électrogène', 'groupe', 1500, true);
    addItem('Câblage + accessoires', 'cable', 400, false);
    rerender();
  });

  document.getElementById('rig-containers')?.addEventListener('change', (e) => {
    nbContainers = parseInt((e.target as HTMLSelectElement).value);
    renderOutput();
  });

  document.getElementById('rig-scenario')?.addEventListener('change', (e) => {
    scenario = (e.target as HTMLSelectElement).value as typeof scenario;
    const d = document.getElementById('rig-scenario-desc');
    if (d) d.textContent = SCENARIOS[scenario].desc;
    renderOutput();
  });

  document.getElementById('rig-compute')?.addEventListener('click', renderOutput);

  // édition inline des items
  root.querySelectorAll<HTMLElement>('.ot-matrow').forEach(rowEl => {
    const id = rowEl.dataset.id!;
    rowEl.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-f]').forEach(field => {
      field.addEventListener('input', () => {
        const it = items.find(x => x.id === id);
        if (!it) return;
        const f = (field as HTMLElement).dataset.f;
        if (f === 'name') it.name = (field as HTMLInputElement).value;
        else if (f === 'cat') it.cat = (field as HTMLSelectElement).value as Cat;
        else if (f === 'value') it.value = parseFloat((field as HTMLInputElement).value) || 0;
      });
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => { items = items.filter(x => x.id !== btn.dataset.del); rerender(); });
  });
}

function rerender(): void {
  if (!root) return;
  root.innerHTML = renderInput();
  bind();
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

if (root) rerender();
