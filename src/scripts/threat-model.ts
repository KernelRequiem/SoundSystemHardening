// ════════════════════════════════════════════════════════════════════════════
// THREAT MODEL BUILDER
// Questionnaire guidé -> fiche de modèle de menace hybride opérationnelle.
// Cadre : actifs à protéger / adversaire probable / surface par canal / contre-mesures.
// 100% client-side, aucune donnée transmise.
// ════════════════════════════════════════════════════════════════════════════

type Opt = { value: string; label: string; desc?: string; weight?: number };
type Step = {
  id: string;
  q: string;
  hint: string;
  multi: boolean;
  options: Opt[];
};

// ─── DÉFINITION DU QUESTIONNAIRE ──────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'role',
    q: 'Quel est ton rôle réel sur l\'événement ?',
    hint: 'Le rôle détermine ton exposition pénale. La PPL 1133 capte les "contributeurs directs ou indirects" : sois lucide sur ce que tu fais vraiment.',
    multi: false,
    options: [
      { value: 'orga',     label: 'Organisateur principal', desc: 'Décision du lieu, de la date, coordination centrale', weight: 5 },
      { value: 'rig',      label: 'Proprio / conducteur du son', desc: 'Tu transportes ou possèdes le matériel', weight: 4 },
      { value: 'logistique', label: 'Logistique / bénévole actif', desc: 'Bar, sécu, montage, infoline, repos', weight: 3 },
      { value: 'diffusion', label: 'Diffusion d\'infos', desc: 'Tu relaies le lieu, l\'heure, les coordonnées', weight: 3 },
      { value: 'participant', label: 'Participant', desc: 'Tu viens pour faire la fête, sans rôle d\'orga', weight: 1 },
    ],
  },
  {
    id: 'context',
    q: 'Quel est le contexte de l\'événement ?',
    hint: 'Le cadre juridique du terrain et la taille changent radicalement le niveau de risque.',
    multi: true,
    options: [
      { value: 'gros',      label: 'Gros teknival (> seuil légal)', desc: 'Au-dessus du seuil de déclaration (500, bientôt 250)', weight: 3 },
      { value: 'nondeclare', label: 'Non déclaré en préfecture', desc: 'Aucune déclaration préalable déposée', weight: 3 },
      { value: 'arrete',    label: 'Zone sous arrêté préfectoral', desc: 'Interdiction préfectorale en vigueur sur le secteur', weight: 3 },
      { value: 'public',    label: 'Communication publique', desc: 'L\'événement est annoncé sur réseaux ouverts', weight: 2 },
      { value: 'prive',     label: 'Terrain privé avec accord', desc: 'Propriétaire consentant, zone grise favorable', weight: -1 },
    ],
  },
  {
    id: 'adversary',
    q: 'Quel adversaire est le plus probable ?',
    hint: 'On ne se protège pas de la même façon d\'un voisin que d\'une cellule de renseignement. Choisis le scénario réaliste, pas le pire imaginable.',
    multi: true,
    options: [
      { value: 'gendarmerie', label: 'Gendarmerie / police locale', desc: 'Contrôle routier, intervention de terrain', weight: 3 },
      { value: 'prefecture',  label: 'Préfecture / renseignement territorial', desc: 'Veille en amont, arrêtés, anticipation', weight: 4 },
      { value: 'osint',       label: 'Surveillance des réseaux (OSINT)', desc: 'Veille sur réseaux sociaux ouverts, captures', weight: 3 },
      { value: 'riverain',    label: 'Riverains / signalements', desc: 'Plaintes voisinage, dénonciation', weight: 1 },
      { value: 'media',       label: 'Médias / caméras', desc: 'Identification via photos/vidéos publiques', weight: 2 },
    ],
  },
  {
    id: 'channels',
    q: 'Quels canaux utilises-tu pour t\'organiser ?',
    hint: 'Chaque canal a une surface d\'exposition différente. C\'est le coeur de l\'OPSEC : choisir le bon canal pour chaque type d\'information.',
    multi: true,
    options: [
      { value: 'facebook', label: 'Facebook / Instagram', desc: 'Réseau public, indexable, reconnaissance faciale', weight: 5 },
      { value: 'whatsapp', label: 'WhatsApp / Telegram', desc: 'Chiffré mais métadonnées et numéros exposés', weight: 3 },
      { value: 'signal',   label: 'Signal', desc: 'Chiffré bout-en-bout, métadonnées minimales', weight: 1 },
      { value: 'sms',      label: 'SMS / appels classiques', desc: 'Non chiffré, interceptable, fadettes', weight: 4 },
      { value: 'verbal',   label: 'Bouche à oreille / papier', desc: 'Hors ligne, surface numérique nulle', weight: 0 },
    ],
  },
  {
    id: 'assets',
    q: 'Que dois-tu protéger en priorité ?',
    hint: 'Tes actifs : ce dont la perte ou la compromission te ferait le plus mal. C\'est ce que l\'adversaire cherche.',
    multi: true,
    options: [
      { value: 'identite', label: 'Mon identité / celle des orgas', desc: 'Éviter l\'ouverture d\'un dossier nominatif', weight: 4 },
      { value: 'localisation', label: 'La localisation du site', desc: 'Empêcher l\'intervention préventive', weight: 4 },
      { value: 'materiel', label: 'Le sound system', desc: 'Éviter la saisie et la confiscation', weight: 3 },
      { value: 'reseau',   label: 'Le réseau de contacts', desc: 'Empêcher la cartographie du collectif', weight: 3 },
      { value: 'devices',  label: 'Mes appareils / données', desc: 'Téléphone, ordinateur, comptes', weight: 3 },
    ],
  },
];

// ─── BASE DE CONTRE-MESURES (reliées au wiki opsec) ───────────────────────────

type CM = { txt: string; res?: { label: string; href: string; external?: boolean } };

const COUNTERMEASURES: Record<string, CM[]> = {
  identite: [
    { txt: 'Flouter systématiquement les visages des orgas sur toute photo/vidéo publique avant diffusion.', res: { label: 'Sécurité numérique · Règle 3', href: '/wiki/Sécurite-Numerique' } },
    { txt: 'Ne jamais associer un nom réel à un rôle d\'organisation sur un canal ouvert.', res: { label: 'OpSec : protéger les infos', href: '/wiki/wiki-opsec' } },
    { txt: 'Épurer les métadonnées (EXIF/GPS) de chaque média avant publication.', res: { label: 'StripMeta', href: '/stripmeta' } },
  ],
  localisation: [
    { txt: 'Ne jamais publier la localisation précise sur un réseau public : diffusion tardive et sur canal chiffré uniquement.', res: { label: 'Sécurité numérique · Règle 1', href: '/wiki/Sécurite-Numerique' } },
    { txt: 'Désactiver le GPS et le partage de position avant d\'approcher du point de rassemblement.', res: { label: 'Sécurité numérique · Règle 4', href: '/wiki/Sécurite-Numerique' } },
    { txt: 'Diffuser le point final par paliers (point de rendez-vous puis lieu réel) le plus tard possible.', res: { label: 'Coordination décentralisée', href: '/wiki/Coordination-Decentralisee' } },
  ],
  materiel: [
    { txt: 'Répartir physiquement le rig sur plusieurs véhicules et points de stockage pour éviter la perte totale.', res: { label: 'Rig Splitting (onglet voisin)', href: '#rig' } },
    { txt: 'Conserver factures et titres de propriété séparés du matériel, idéalement chez un tiers.', res: { label: 'Recours juridiques · saisie', href: '/wiki/recours-juridiques' } },
    { txt: 'Documenter le matériel (numéros de série, photos) pour préparer une contestation de saisie.', res: { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive' } },
  ],
  reseau: [
    { txt: 'Compartimenter : chaque personne ne connaît que ce qui la concerne (besoin d\'en connaître).', res: { label: 'OpSec : protéger les infos', href: '/wiki/wiki-opsec' } },
    { txt: 'Utiliser des groupes Signal éphémères avec messages à durée de vie limitée.', res: { label: 'Messagerie chiffrée', href: '/wiki/messagerie-chiffree' } },
    { txt: 'Éviter les listes nominatives centralisées ; pas de carnet d\'adresses du collectif en clair.', res: { label: 'Coordination décentralisée', href: '/wiki/Coordination-Decentralisee' } },
  ],
  devices: [
    { txt: 'Chiffrer intégralement le disque de chaque appareil et utiliser un code long (6+ chiffres).', res: { label: 'Sécurité numérique', href: '/wiki/Sécurite-Numerique' } },
    { txt: 'Désactiver le déverrouillage biométrique : la contrainte physique sur un code est juridiquement plus lourde.', res: { label: 'Décision · code PIN en GAV', href: '/decision' } },
    { txt: 'Chiffrer les fiches sensibles avant tout transfert, sur n\'importe quel canal.', res: { label: 'InfoCrypt', href: '/infocrypt' } },
  ],
  // canaux à risque -> recommandations de migration
  facebook: [
    { txt: 'Bannir le réseau public pour toute information sensible (lieu, identité, timing).', res: { label: 'Sécurité numérique · Règle 1', href: '/wiki/Sécurite-Numerique' } },
  ],
  sms: [
    { txt: 'Migrer les communications opérationnelles vers Signal : les SMS et appels laissent des fadettes exploitables.', res: { label: 'Communications sécurisées', href: '/wiki/Sécurité-des-communications' } },
  ],
  whatsapp: [
    { txt: 'Préférer Signal à WhatsApp/Telegram : moins de métadonnées et pas de carnet exposé.', res: { label: 'Messagerie chiffrée', href: '/wiki/messagerie-chiffree' } },
  ],
};

// ─── ÉVALUATION DES CANAUX (surface d'exposition) ─────────────────────────────

const CHANNEL_PROFILE: Record<string, { label: string; sev: 'green'|'orange'|'red'; note: string }> = {
  facebook: { label: 'Facebook / Instagram', sev: 'red',    note: 'Public, indexé, reconnaissance faciale. Surface maximale. À proscrire pour l\'info sensible.' },
  sms:      { label: 'SMS / appels',          sev: 'red',    note: 'Non chiffré, interceptable, fadettes conservées. Évite pour l\'opérationnel.' },
  whatsapp: { label: 'WhatsApp / Telegram',   sev: 'orange', note: 'Contenu chiffré mais métadonnées, numéros et carnets exposés. Acceptable en repli.' },
  signal:   { label: 'Signal',                sev: 'green',  note: 'Chiffrement bout-en-bout, métadonnées minimales, messages éphémères. Canal recommandé.' },
  verbal:   { label: 'Bouche à oreille / papier', sev: 'green', note: 'Surface numérique nulle. Idéal pour le plus sensible, mais ne passe pas à l\'échelle.' },
};

// ─── ÉTAT ─────────────────────────────────────────────────────────────────────

const answers: Record<string, string[]> = {};
let stepIdx = 0;

const root = document.getElementById('threat-root');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

function progressBar(): string {
  const total = STEPS.length;
  const segs = STEPS.map((_, i) => {
    const cls = i < stepIdx ? 'done' : i === stepIdx ? 'current' : '';
    return `<div class="ot-progress-step ${cls}"></div>`;
  }).join('');
  return `<div class="ot-progress">${segs}<span class="ot-progress-label">${stepIdx + 1} / ${total}</span></div>`;
}

// ─── RENDER : ÉTAPE ───────────────────────────────────────────────────────────

function renderStep(): void {
  if (!root) return;
  const step = STEPS[stepIdx];
  const sel = answers[step.id] || [];

  const choices = step.options.map(o => {
    const isSel = sel.includes(o.value);
    return `
      <button class="ot-choice ${isSel ? 'selected' : ''}" data-val="${o.value}">
        <span class="ot-choice-check">${step.multi ? '✓' : '●'}</span>
        <span class="ot-choice-body">
          <span class="ot-choice-label">${esc(o.label)}</span>
          ${o.desc ? `<span class="ot-choice-desc">${esc(o.desc)}</span>` : ''}
        </span>
      </button>`;
  }).join('');

  const canNext = sel.length > 0;
  const isLast = stepIdx === STEPS.length - 1;

  root.innerHTML = `
    ${progressBar()}
    <div class="ot-explain">
      <div class="ot-explain-title">◈ Pourquoi cette question</div>
      <div class="ot-explain-txt">${esc(step.hint)}</div>
    </div>
    <p class="ot-step-q">${esc(step.q)}</p>
    <p class="ot-step-hint">${step.multi ? 'Plusieurs réponses possibles.' : 'Une seule réponse.'}</p>
    <div class="ot-choices ${step.options.length > 4 ? '' : 'grid2'}">${choices}</div>
    <div class="ot-nav">
      <button class="ot-btn" id="tm-back" ${stepIdx === 0 ? 'disabled' : ''}>← Précédent</button>
      <button class="ot-btn ot-btn-primary" id="tm-next" ${canNext ? '' : 'disabled'}>
        ${isLast ? 'Générer ma fiche →' : 'Suivant →'}
      </button>
    </div>`;

  root.querySelectorAll<HTMLButtonElement>('.ot-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.val!;
      if (step.multi) {
        const cur = answers[step.id] || [];
        answers[step.id] = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v];
      } else {
        answers[step.id] = [v];
      }
      renderStep();
    });
  });

  document.getElementById('tm-back')?.addEventListener('click', () => { if (stepIdx > 0) { stepIdx--; renderStep(); } });
  document.getElementById('tm-next')?.addEventListener('click', () => {
    if ((answers[step.id] || []).length === 0) return;
    if (isLast) { renderReport(); } else { stepIdx++; renderStep(); }
  });
}

// ─── CALCUL DU NIVEAU DE MENACE ───────────────────────────────────────────────

function threatScore(): { score: number; level: 'green'|'orange'|'red'; label: string } {
  let s = 0;
  for (const step of STEPS) {
    const sel = answers[step.id] || [];
    for (const v of sel) {
      const opt = step.options.find(o => o.value === v);
      if (opt?.weight) s += opt.weight;
    }
  }
  // bornes empiriques : min ~1, max ~50
  if (s >= 28) return { score: s, level: 'red',    label: 'Exposition élevée' };
  if (s >= 15) return { score: s, level: 'orange', label: 'Exposition modérée' };
  return { score: s, level: 'green', label: 'Exposition contenue' };
}

// ─── RENDER : FICHE ───────────────────────────────────────────────────────────

function renderReport(): void {
  if (!root) return;
  const role = (answers.role || [])[0];
  const roleLabel = STEPS[0].options.find(o => o.value === role)?.label || '—';
  const threat = threatScore();

  // Actifs
  const assets = (answers.assets || []);
  const assetLabels = assets.map(a => STEPS[4].options.find(o => o.value === a)?.label || a);

  // Adversaires
  const advs = (answers.adversary || []);
  const advLabels = advs.map(a => STEPS[2].options.find(o => o.value === a)?.label || a);

  // Canaux -> profil de surface
  const chans = (answers.channels || []);
  const chanRows = chans
    .map(c => CHANNEL_PROFILE[c])
    .filter(Boolean)
    .sort((a, b) => ({ red: 0, orange: 1, green: 2 }[a.sev] - { red: 0, orange: 1, green: 2 }[b.sev]))
    .map(p => `
      <div class="ot-row">
        <span class="bullet"><span class="ot-badge ot-badge--${p.sev}">${p.sev === 'red' ? 'critique' : p.sev === 'orange' ? 'modéré' : 'sûr'}</span></span>
        <span class="txt"><strong style="color:rgba(232,232,240,0.95)">${esc(p.label)}</strong> — ${esc(p.note)}</span>
      </div>`).join('');

  // Contre-mesures : actifs + canaux à risque, dédupliquées
  const cmKeys = [...assets, ...chans.filter(c => COUNTERMEASURES[c])];
  const seen = new Set<string>();
  const cmList: CM[] = [];
  for (const k of cmKeys) {
    for (const cm of (COUNTERMEASURES[k] || [])) {
      if (!seen.has(cm.txt)) { seen.add(cm.txt); cmList.push(cm); }
    }
  }
  const cmRows = cmList.map(cm => `
    <div class="ot-row">
      <span class="bullet">▸</span>
      <span class="txt">${esc(cm.txt)}${cm.res ? ` <a class="ot-reslink" style="margin-left:6px" href="${cm.res.href}"${cm.res.external ? ' target="_blank" rel="noopener"' : ''}>◇ ${esc(cm.res.label)} ${cm.res.external ? '↗' : '→'}</a>` : ''}</span>
    </div>`).join('');

  const assetRows = assetLabels.map(a => `<div class="ot-row"><span class="bullet">◆</span><span class="txt">${esc(a)}</span></div>`).join('') || '<div class="ot-row"><span class="txt" style="color:rgba(122,122,138,0.7)">Aucun actif sélectionné.</span></div>';
  const advRows = advLabels.map(a => `<div class="ot-row"><span class="bullet">⊠</span><span class="txt">${esc(a)}</span></div>`).join('');

  root.innerHTML = `
    <div class="ot-report">
      <div class="ot-report-head">
        <div class="ot-report-kicker">Fiche de modèle de menace · générée localement</div>
        <h2 class="ot-report-title">${esc(roleLabel)}</h2>
        <div style="margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span class="ot-badge ot-badge--${threat.level}">${esc(threat.label)}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(122,122,138,0.7)">indice ${threat.score}</span>
        </div>
      </div>
      <div class="ot-report-body">

        <div class="ot-section">
          <div class="ot-section-head"><span class="lbl">◆ Ce que tu protèges</span><span class="line"></span></div>
          ${assetRows}
        </div>

        <div class="ot-section">
          <div class="ot-section-head"><span class="lbl">⊠ Adversaire probable</span><span class="line"></span></div>
          ${advRows}
        </div>

        <div class="ot-section">
          <div class="ot-section-head"><span class="lbl">◈ Surface d'exposition par canal</span><span class="line"></span></div>
          ${chanRows || '<div class="ot-row"><span class="txt" style="color:rgba(122,122,138,0.7)">Aucun canal sélectionné.</span></div>'}
        </div>

        <div class="ot-section">
          <div class="ot-section-head"><span class="lbl">▸ Contre-mesures prioritaires</span><span class="line"></span></div>
          ${cmRows || '<div class="ot-row"><span class="txt" style="color:rgba(122,122,138,0.7)">Sélectionne des actifs pour obtenir des contre-mesures.</span></div>'}
        </div>

        <div class="ot-explain" style="margin-top:8px;margin-bottom:0">
          <div class="ot-explain-title">⚠ Lecture de ta fiche</div>
          <div class="ot-explain-txt">Cette fiche est un point de départ, pas une garantie. L'indice d'exposition agrège ton rôle, ton contexte, tes canaux et tes adversaires : plus il est haut, plus tu dois durcir tes canaux et compartimenter. Croise-la avec le wiki OpSec et adapte-la à ta réalité.</div>
        </div>

        <div class="ot-nav">
          <button class="ot-btn" id="tm-restart">↺ Recommencer</button>
          <button class="ot-btn ot-btn-primary" id="tm-copy">⎘ Copier la fiche (texte)</button>
        </div>
      </div>
    </div>`;

  document.getElementById('tm-restart')?.addEventListener('click', () => {
    for (const k of Object.keys(answers)) delete answers[k];
    stepIdx = 0; renderStep();
  });
  document.getElementById('tm-copy')?.addEventListener('click', () => copyReport(roleLabel, threat, assetLabels, advLabels, chans, cmList));
}

// ─── EXPORT TEXTE ─────────────────────────────────────────────────────────────

function copyReport(role: string, threat: { score: number; label: string }, assets: string[], advs: string[], chans: string[], cms: CM[]): void {
  const lines: string[] = [];
  lines.push('=== MODÈLE DE MENACE ===');
  lines.push(`Rôle : ${role}`);
  lines.push(`Exposition : ${threat.label} (indice ${threat.score})`);
  lines.push('');
  lines.push('# Ce que je protège');
  assets.forEach(a => lines.push(`- ${a}`));
  lines.push('');
  lines.push('# Adversaire probable');
  advs.forEach(a => lines.push(`- ${a}`));
  lines.push('');
  lines.push('# Surface par canal');
  chans.forEach(c => { const p = CHANNEL_PROFILE[c]; if (p) lines.push(`- [${p.sev.toUpperCase()}] ${p.label} : ${p.note}`); });
  lines.push('');
  lines.push('# Contre-mesures');
  cms.forEach(cm => lines.push(`- ${cm.txt}`));
  lines.push('');
  lines.push('Généré localement via soundsystemhardening.fr/opsec-tools — aucune donnée transmise.');

  const txt = lines.join('\n');
  navigator.clipboard?.writeText(txt).then(() => {
    const btn = document.getElementById('tm-copy');
    if (btn) { const old = btn.textContent; btn.textContent = '✓ Copié'; setTimeout(() => btn.textContent = old, 1600); }
  }).catch(() => {});
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

if (root) renderStep();
