// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Phase     = 'avant' | 'pendant' | 'apres';
export type Situation = 'controle' | 'fouille' | 'interpellation' | 'gav';
export type NodeType  = 'phase-select' | 'situation-select' | 'question' | 'result';
export type Severity  = 'green' | 'orange' | 'red';

export interface Resource {
  label: string;
  href:  string;
  type:  'wiki' | 'contact' | 'template';
}

export interface Choice {
  label: string;
  next:  string;
  tag?:  string; // badge optionnel ex: "URGENT"
}

export interface DecisionNode {
  id:        string;
  text:      string;
  subtitle?: string;
  type:      NodeType;
  phase?:    Phase;
  situation?: Situation;
  severity?: Severity;
  icon?:     string;
  choices?:  Choice[];
  // Champs des nœuds résultat uniquement
  context?:    string;   // paragraphe juridique développé
  actions?:    string[]; // que faire maintenant (ordonné)
  rights?:     string[]; // tes droits applicables
  pitfalls?:   string[]; // pièges courants à éviter
  resources?:  Resource[];
  next_phase?: { label: string; next: string }; // lien vers la phase suivante
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

export const PHASE_LABELS: Record<Phase, string> = {
  avant:   'Avant',
  pendant: 'Pendant',
  apres:   'Après',
};

export const PHASE_ICONS: Record<Phase, string> = {
  avant:   '◷',
  pendant: '◈',
  apres:   '↩',
};

export const PHASE_SUBTITLES: Record<Phase, string> = {
  avant:   'Prépare-toi avant d\'être confronté',
  pendant: 'Tu es face aux forces de l\'ordre',
  apres:   'Documente, conteste, prends les bonnes décisions',
};

export const SITUATION_LABELS: Record<Situation, string> = {
  controle:      'Contrôle d\'identité',
  fouille:       'Fouille / Perquisition',
  interpellation:'Interpellation',
  gav:           'Garde à vue',
};

export const SITUATION_ICONS: Record<Situation, string> = {
  controle:       '🪪',
  fouille:        '🔍',
  interpellation: '🚔',
  gav:            '⛓',
};

// ─── ARBRE DE DÉCISION ────────────────────────────────────────────────────────

export const tree: Record<string, DecisionNode> = {

  // ── RACINE : sélecteur de phase ──────────────────────────────────────────

  root: {
    id:       'root',
    text:     'Tu es dans quelle phase ?',
    subtitle: 'Sélectionne le moment de ton interaction avec les forces de l\'ordre',
    type:     'phase-select',
    choices: [
      { label: 'Avant',   next: 'sit_avant',   tag: 'Préparation' },
      { label: 'Pendant', next: 'sit_pendant', tag: 'En cours'    },
      { label: 'Après',   next: 'sit_apres',   tag: 'Recours'     },
    ],
  },

  // ── SÉLECTEURS DE SITUATION (un par phase) ───────────────────────────────

  sit_avant: {
    id:       'sit_avant',
    text:     'Quelle situation veux-tu préparer ?',
    subtitle: 'Connais tes droits et prépare le matériel nécessaire',
    type:     'situation-select',
    phase:    'avant',
    choices: [
      { label: 'Contrôle d\'identité', next: 'avant_controle'      },
      { label: 'Fouille / Perquisition', next: 'avant_fouille'     },
      { label: 'Interpellation',       next: 'avant_interpellation' },
      { label: 'Garde à vue',          next: 'avant_gav'            },
    ],
  },

  sit_pendant: {
    id:       'sit_pendant',
    text:     'Quelle est ta situation ?',
    subtitle: 'Suis les étapes dans l\'ordre, reste calme',
    type:     'situation-select',
    phase:    'pendant',
    choices: [
      { label: 'Contrôle d\'identité', next: 'pdt_controle'      },
      { label: 'Fouille / Perquisition', next: 'pdt_fouille'     },
      { label: 'Interpellation',       next: 'pdt_interpellation' },
      { label: 'Garde à vue',          next: 'pdt_gav'            },
    ],
  },

  sit_apres: {
    id:       'sit_apres',
    text:     'Quelle situation s\'est passée ?',
    subtitle: 'Documente, conteste et prends les bonnes décisions',
    type:     'situation-select',
    phase:    'apres',
    choices: [
      { label: 'Contrôle d\'identité', next: 'apr_controle'      },
      { label: 'Fouille / Perquisition', next: 'apr_fouille'     },
      { label: 'Interpellation',       next: 'apr_interpellation' },
      { label: 'Garde à vue',          next: 'apr_gav'            },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AVANT
  // ═══════════════════════════════════════════════════════════════════════════

  avant_controle: {
    id:        'avant_controle',
    text:      'Préparer un contrôle d\'identité',
    type:      'result',
    phase:     'avant',
    situation: 'controle',
    severity:  'green',
    icon:      '🪪',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Arsenal législatif', href: '/wiki/arsenal-legislatif', type: 'wiki' },
    ],
    next_phase: { label: '→ Pendant : Contrôle d\'identité', next: 'pdt_controle' },
  },

  avant_fouille: {
    id:        'avant_fouille',
    text:      'Préparer une fouille / perquisition',
    type:      'result',
    phase:     'avant',
    situation: 'fouille',
    severity:  'orange',
    icon:      '🔍',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Modus Operandi', href: '/wiki/Modus-Operandi', type: 'wiki' },
    ],
    next_phase: { label: '→ Pendant : Fouille / Perquisition', next: 'pdt_fouille' },
  },

  avant_interpellation: {
    id:        'avant_interpellation',
    text:      'Préparer une interpellation',
    type:      'result',
    phase:     'avant',
    situation: 'interpellation',
    severity:  'orange',
    icon:      '🚔',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Contacts & Alliés', href: '/wiki/Contacts-Allies', type: 'contact' },
    ],
    next_phase: { label: '→ Pendant : Interpellation', next: 'pdt_interpellation' },
  },

  avant_gav: {
    id:        'avant_gav',
    text:      'Préparer une garde à vue',
    type:      'result',
    phase:     'avant',
    situation: 'gav',
    severity:  'red',
    icon:      '⛓',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Contacts & Alliés', href: '/wiki/Contacts-Allies', type: 'contact' },
      { label: 'Sécurité numérique', href: '/wiki/Sécurite-Numerique', type: 'wiki' },
    ],
    next_phase: { label: '→ Pendant : Garde à vue', next: 'pdt_gav' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PENDANT : CONTRÔLE D'IDENTITÉ
  // ═══════════════════════════════════════════════════════════════════════════

  pdt_controle: {
    id:        'pdt_controle',
    text:      'Quel est le déroulement du contrôle ?',
    type:      'question',
    phase:     'pendant',
    situation: 'controle',
    choices: [
      { label: 'Demande de papiers, contrôle classique',     next: 'pdt_controle_simple'  },
      { label: 'Ils refusent de me laisser partir',          next: 'pdt_controle_retenu'  },
      { label: 'Ils tentent une fouille sans motif clair',   next: 'pdt_fouille'          },
    ],
  },

  pdt_controle_simple: {
    id:        'pdt_controle_simple',
    text:      'Contrôle d\'identité classique',
    type:      'result',
    phase:     'pendant',
    situation: 'controle',
    severity:  'green',
    icon:      '✅',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Arsenal législatif', href: '/wiki/arsenal-legislatif', type: 'wiki' },
    ],
    next_phase: { label: '→ Après : Recours et documentation', next: 'apr_controle' },
  },

  pdt_controle_retenu: {
    id:        'pdt_controle_retenu',
    text:      'Rétention sans motif légal',
    type:      'result',
    phase:     'pendant',
    situation: 'controle',
    severity:  'orange',
    icon:      '⚠️',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Contacts & Alliés', href: '/wiki/Contacts-Allies', type: 'contact' },
    ],
    next_phase: { label: '→ Après : Recours et documentation', next: 'apr_controle' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PENDANT : FOUILLE / PERQUISITION
  // ═══════════════════════════════════════════════════════════════════════════

  pdt_fouille: {
    id:        'pdt_fouille',
    text:      'Quel type de fouille ?',
    type:      'question',
    phase:     'pendant',
    situation: 'fouille',
    choices: [
      { label: 'Fouille du véhicule (coffre, habitacle)',            next: 'pdt_fouille_vehicule'     },
      { label: 'Fouille corporelle / palpation de sécurité',        next: 'pdt_fouille_corporelle'   },
      { label: 'Fouille des affaires personnelles (sac, vêtements)', next: 'pdt_fouille_affaires'     },
      { label: 'Perquisition au domicile',                           next: 'pdt_fouille_perquisition' },
    ],
  },

  pdt_fouille_vehicule: {
    id:        'pdt_fouille_vehicule',
    text:      'Fouille du véhicule',
    type:      'result',
    phase:     'pendant',
    situation: 'fouille',
    severity:  'orange',
    icon:      '🚗',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Templates recours', href: '/wiki/Templates-Recours', type: 'template' },
    ],
    next_phase: { label: '→ Après : Recours fouille', next: 'apr_fouille' },
  },

  pdt_fouille_corporelle: {
    id:        'pdt_fouille_corporelle',
    text:      'Fouille corporelle / palpation',
    type:      'result',
    phase:     'pendant',
    situation: 'fouille',
    severity:  'red',
    icon:      '🔴',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Templates recours', href: '/wiki/Templates-Recours', type: 'template' },
    ],
    next_phase: { label: '→ Après : Recours fouille', next: 'apr_fouille' },
  },

  pdt_fouille_affaires: {
    id:        'pdt_fouille_affaires',
    text:      'Fouille des affaires personnelles',
    type:      'result',
    phase:     'pendant',
    situation: 'fouille',
    severity:  'orange',
    icon:      '🎒',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Modus Operandi', href: '/wiki/Modus-Operandi', type: 'wiki' },
    ],
    next_phase: { label: '→ Après : Recours fouille', next: 'apr_fouille' },
  },

  pdt_fouille_perquisition: {
    id:        'pdt_fouille_perquisition',
    text:      'Perquisition au domicile',
    type:      'result',
    phase:     'pendant',
    situation: 'fouille',
    severity:  'red',
    icon:      '🏠',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Templates recours', href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Contacts & Alliés', href: '/wiki/Contacts-Allies',   type: 'contact'  },
    ],
    next_phase: { label: '→ Après : Recours fouille', next: 'apr_fouille' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PENDANT : INTERPELLATION
  // ═══════════════════════════════════════════════════════════════════════════

  pdt_interpellation: {
    id:        'pdt_interpellation',
    text:      'Quelle est la situation ?',
    type:      'question',
    phase:     'pendant',
    situation: 'interpellation',
    choices: [
      { label: 'Je viens d\'être interpellé, pas encore notifié GAV', next: 'pdt_interpel_pre_gav' },
      { label: 'Ils saisissent le matériel son / le véhicule',        next: 'pdt_interpel_saisie'  },
    ],
  },

  pdt_interpel_pre_gav: {
    id:        'pdt_interpel_pre_gav',
    text:      'Interpellation - avant notification de GAV',
    type:      'result',
    phase:     'pendant',
    situation: 'interpellation',
    severity:  'red',
    icon:      '🚔',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Sécurité numérique', href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
    ],
    next_phase: { label: '→ Après : Suites interpellation', next: 'apr_interpellation' },
  },

  pdt_interpel_saisie: {
    id:        'pdt_interpel_saisie',
    text:      'Saisie du matériel son / véhicule',
    type:      'result',
    phase:     'pendant',
    situation: 'interpellation',
    severity:  'red',
    icon:      '📦',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Templates recours',         href: '/wiki/Templates-Recours',        type: 'template' },
      { label: 'Stratégie contre RIPOST',   href: '/wiki/Strategie-contre-ripost',  type: 'wiki'     },
      { label: 'Contacts & Alliés',         href: '/wiki/Contacts-Allies',          type: 'contact'  },
    ],
    next_phase: { label: '→ Après : Matériel saisi - recours', next: 'apr_interpel_saisie' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PENDANT : GARDE À VUE
  // ═══════════════════════════════════════════════════════════════════════════

  pdt_gav: {
    id:        'pdt_gav',
    text:      'Quelle est ta situation en GAV ?',
    type:      'question',
    phase:     'pendant',
    situation: 'gav',
    choices: [
      { label: 'Droits viennent d\'être lus, premier moment', next: 'pdt_gav_debut'       },
      { label: 'Audition en cours / interrogatoire',          next: 'pdt_gav_interrogatoire' },
      { label: 'Ils veulent mon téléphone ou mon code PIN',   next: 'pdt_gav_telephone'   },
      { label: 'Un proche est en GAV, je suis dehors',        next: 'pdt_gav_proche'      },
    ],
  },

  pdt_gav_debut: {
    id:        'pdt_gav_debut',
    text:      'Début de garde à vue',
    type:      'result',
    phase:     'pendant',
    situation: 'gav',
    severity:  'red',
    icon:      '⛓',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Contacts & Alliés (avocats)', href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Sécurité numérique',          href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
    ],
    next_phase: { label: '→ Après : Sortie de GAV', next: 'apr_gav' },
  },

  pdt_gav_interrogatoire: {
    id:        'pdt_gav_interrogatoire',
    text:      'Audition / interrogatoire en cours',
    type:      'result',
    phase:     'pendant',
    situation: 'gav',
    severity:  'red',
    icon:      '🎙',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Contacts & Alliés (avocats)', href: '/wiki/Contacts-Allies', type: 'contact' },
    ],
    next_phase: { label: '→ Après : Sortie de GAV', next: 'apr_gav' },
  },

  pdt_gav_telephone: {
    id:        'pdt_gav_telephone',
    text:      'Pression sur le téléphone / code PIN',
    type:      'result',
    phase:     'pendant',
    situation: 'gav',
    severity:  'red',
    icon:      '📱',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Sécurité numérique', href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
    ],
    next_phase: { label: '→ Après : Sortie de GAV', next: 'apr_gav' },
  },

  pdt_gav_proche: {
    id:        'pdt_gav_proche',
    text:      'Un proche est en GAV',
    type:      'result',
    phase:     'pendant',
    situation: 'gav',
    severity:  'orange',
    icon:      '👥',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Contacts & Alliés (urgence)', href: '/wiki/Contacts-Allies', type: 'contact' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APRÈS : CONTRÔLE D'IDENTITÉ
  // ═══════════════════════════════════════════════════════════════════════════

  apr_controle: {
    id:        'apr_controle',
    text:      'Suite d\'un contrôle d\'identité',
    type:      'result',
    phase:     'apres',
    situation: 'controle',
    severity:  'green',
    icon:      '📋',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Templates recours', href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'  },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APRÈS : FOUILLE / PERQUISITION
  // ═══════════════════════════════════════════════════════════════════════════

  apr_fouille: {
    id:        'apr_fouille',
    text:      'Suite d\'une fouille / perquisition',
    type:      'result',
    phase:     'apres',
    situation: 'fouille',
    severity:  'orange',
    icon:      '📋',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours',  type: 'template' },
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'     },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APRÈS : INTERPELLATION
  // ═══════════════════════════════════════════════════════════════════════════

  apr_interpellation: {
    id:        'apr_interpellation',
    text:      'Suite d\'une interpellation',
    type:      'question',
    phase:     'apres',
    situation: 'interpellation',
    choices: [
      { label: 'J\'ai reçu une AFD (amende forfaitaire délictuelle)', next: 'apr_afd_timing'        },
      { label: 'Relâché sans suite, pas d\'AFD',                      next: 'apr_interpel_sans_suite' },
      { label: 'Mon matériel a été saisi',                             next: 'apr_interpel_saisie'    },
    ],
  },

  apr_afd_timing: {
    id:        'apr_afd_timing',
    text:      'Quand as-tu reçu l\'AFD ?',
    type:      'question',
    phase:     'apres',
    situation: 'interpellation',
    choices: [
      { label: 'Sur le terrain, maintenant',             next: 'apr_afd_terrain',  tag: 'URGENT'  },
      { label: 'Reçue par courrier (moins de 15 jours)', next: 'apr_afd_moins15j'                 },
      { label: 'Reçue par courrier (15 à 30 jours)',     next: 'apr_afd_15_30j',   tag: 'URGENT'  },
      { label: 'Reçue par courrier (plus de 30 jours)',  next: 'apr_afd_plus30j'                  },
    ],
  },

  apr_afd_terrain: {
    id:        'apr_afd_terrain',
    text:      'AFD présentée sur le terrain',
    type:      'result',
    phase:     'apres',
    situation: 'interpellation',
    severity:  'orange',
    icon:      '⚠️',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Stratégie contre RIPOST', href: '/wiki/Strategie-contre-ripost', type: 'wiki' },
    ],
  },

  apr_afd_moins15j: {
    id:        'apr_afd_moins15j',
    text:      'AFD reçue - moins de 15 jours',
    type:      'result',
    phase:     'apres',
    situation: 'interpellation',
    severity:  'orange',
    icon:      '⚠️',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Stratégie contre RIPOST', href: '/wiki/Strategie-contre-ripost', type: 'wiki'    },
      { label: 'Contacts & Alliés',       href: '/wiki/Contacts-Allies',         type: 'contact' },
    ],
  },

  apr_afd_15_30j: {
    id:        'apr_afd_15_30j',
    text:      'AFD reçue - entre 15 et 30 jours',
    type:      'result',
    phase:     'apres',
    situation: 'interpellation',
    severity:  'red',
    icon:      '🔴',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Stratégie contre RIPOST', href: '/wiki/Strategie-contre-ripost', type: 'wiki'     },
      { label: 'Templates recours',       href: '/wiki/Templates-Recours',       type: 'template' },
    ],
  },

  apr_afd_plus30j: {
    id:        'apr_afd_plus30j',
    text:      'AFD reçue - plus de 30 jours',
    type:      'result',
    phase:     'apres',
    situation: 'interpellation',
    severity:  'red',
    icon:      '🔴',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Contacts & Alliés (urgence)', href: '/wiki/Contacts-Allies', type: 'contact' },
    ],
  },

  apr_interpel_sans_suite: {
    id:        'apr_interpel_sans_suite',
    text:      'Relâché sans suite',
    type:      'result',
    phase:     'apres',
    situation: 'interpellation',
    severity:  'green',
    icon:      '✅',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive', type: 'wiki' },
    ],
  },

  apr_interpel_saisie: {
    id:        'apr_interpel_saisie',
    text:      'Matériel saisi - recours',
    type:      'result',
    phase:     'apres',
    situation: 'interpellation',
    severity:  'red',
    icon:      '📦',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Templates recours',       href: '/wiki/Templates-Recours',      type: 'template' },
      { label: 'Stratégie contre RIPOST', href: '/wiki/Strategie-contre-ripost', type: 'wiki'    },
      { label: 'Contacts & Alliés',       href: '/wiki/Contacts-Allies',         type: 'contact' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APRÈS : GARDE À VUE
  // ═══════════════════════════════════════════════════════════════════════════

  apr_gav: {
    id:        'apr_gav',
    text:      'Suite d\'une garde à vue',
    type:      'question',
    phase:     'apres',
    situation: 'gav',
    choices: [
      { label: 'Je viens de sortir de GAV',                next: 'apr_gav_sortie'      },
      { label: 'J\'ai une convocation / je dois comparaître', next: 'apr_gav_convocation' },
    ],
  },

  apr_gav_sortie: {
    id:        'apr_gav_sortie',
    text:      'Sortie de garde à vue',
    type:      'result',
    phase:     'apres',
    situation: 'gav',
    severity:  'orange',
    icon:      '🚪',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'    },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
    ],
  },

  apr_gav_convocation: {
    id:        'apr_gav_convocation',
    text:      'Convocation / comparution',
    type:      'result',
    phase:     'apres',
    situation: 'gav',
    severity:  'red',
    icon:      '📋',
    context:   'TODO',
    actions:   ['TODO'],
    rights:    ['TODO'],
    pitfalls:  ['TODO'],
    resources: [
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'    },
      { label: 'Templates recours',  href: '/wiki/Templates-Recours',  type: 'template' },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
    ],
  },

};
