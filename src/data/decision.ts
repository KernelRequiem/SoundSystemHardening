// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Phase     = 'avant' | 'pendant' | 'apres';
export type Situation = 'controle' | 'fouille' | 'interpellation' | 'gav';
export type NodeType  = 'phase-select' | 'situation-select' | 'question' | 'result';
export type Severity  = 'green' | 'orange' | 'red';

export interface Resource {
  label:  string;
  href:   string;
  type:   'wiki' | 'contact' | 'template' | 'external';
  status?: 'missing' | 'partial'; // signale une page wiki à créer / compléter
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
    subtitle: 'Connais tes droits et prépare le matériel nécessaire avant le contact',
    type:     'situation-select',
    phase:    'avant',
    choices: [
      { label: 'Contrôle d\'identité',    next: 'avant_controle'       },
      { label: 'Fouille / Perquisition',  next: 'avant_fouille'        },
      { label: 'Interpellation',          next: 'avant_interpellation' },
      { label: 'Garde à vue',             next: 'avant_gav'            },
    ],
  },

  sit_pendant: {
    id:       'sit_pendant',
    text:     'Quelle est ta situation ?',
    subtitle: 'Suis les étapes dans l\'ordre, reste calme',
    type:     'situation-select',
    phase:    'pendant',
    choices: [
      { label: 'Contrôle d\'identité',    next: 'pdt_controle'       },
      { label: 'Fouille / Perquisition',  next: 'pdt_fouille'        },
      { label: 'Interpellation',          next: 'pdt_interpellation' },
      { label: 'Garde à vue',             next: 'pdt_gav'            },
    ],
  },

  sit_apres: {
    id:       'sit_apres',
    text:     'Quelle situation s\'est passée ?',
    subtitle: 'Documente, conteste et prends les bonnes décisions',
    type:     'situation-select',
    phase:    'apres',
    choices: [
      { label: 'Contrôle d\'identité',    next: 'apr_controle'       },
      { label: 'Fouille / Perquisition',  next: 'apr_fouille'        },
      { label: 'Interpellation',          next: 'apr_interpellation' },
      { label: 'Garde à vue',             next: 'apr_gav'            },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AVANT : CONTRÔLE D'IDENTITÉ
  // ═══════════════════════════════════════════════════════════════════════════

  avant_controle: {
    id:        'avant_controle',
    text:      'Quel est ton profil pour ce contrôle ?',
    type:      'question',
    phase:     'avant',
    situation: 'controle',
    choices: [
      { label: 'Majeur, ressortissant français',                next: 'avant_controle_majeur'   },
      { label: 'Mineur (moins de 18 ans)',                       next: 'avant_controle_mineur'   },
      { label: 'Étranger / sans titre de séjour sur soi',        next: 'avant_controle_etranger' },
    ],
  },

  avant_controle_majeur: {
    id:        'avant_controle_majeur',
    text:      'Préparer un contrôle d\'identité (majeur)',
    type:      'result',
    phase:     'avant',
    situation: 'controle',
    severity:  'green',
    icon:      '🪪',
    context:   'Le contrôle d\'identité est encadré par l\'article 78-2 du Code de procédure pénale. Il ne peut avoir lieu que dans des cas précis : indice de commission d\'une infraction, réquisition écrite du procureur pour une zone et une durée définies, ou contrôle des frontières. Sur le trajet d\'un teknival, le motif invoqué est presque toujours la réquisition du procureur. Tu n\'es pas obligé de porter une pièce d\'identité, mais ne pas pouvoir prouver ton identité autorise les forces de l\'ordre à te conduire au poste pour vérification (jusqu\'à 4 heures).',
    actions:   [
      'Garde une pièce d\'identité sur toi : cela évite la vérification au poste, qui immobilise jusqu\'à 4 heures.',
      'Mémorise une phrase neutre à répéter : "Je vous présente mes papiers, je n\'ai rien d\'autre à déclarer."',
      'Prépare ton téléphone : code PIN long (6 chiffres minimum), pas de déverrouillage biométrique activé au moment du trajet.',
      'Note à l\'avance le numéro d\'un avocat ou du référent juridique du collectif, sur papier et hors du téléphone.',
    ],
    rights:    [
      'Tu peux prouver ton identité par tout moyen, pas seulement la carte d\'identité (permis, livret de famille, témoignage).',
      'Tu as le droit de demander le motif du contrôle (réquisition, infraction).',
      'La palpation de sécurité n\'est pas une fouille : elle doit rester superficielle et justifiée.',
      'Tu n\'as aucune obligation de répondre à des questions au-delà de ton identité.',
    ],
    pitfalls:  [
      'Activer le déverrouillage par empreinte ou visage : la contrainte physique pour déverrouiller est juridiquement plus simple qu\'obtenir un code.',
      'Donner spontanément ta destination ou parler de l\'événement : tout est notable au PV.',
      'S\'énerver ou filmer de façon ostentatoire dès la première seconde : reste factuel.',
    ],
    resources: [
      { label: 'Arsenal législatif',   href: '/wiki/arsenal-legislatif', type: 'wiki'    },
      { label: 'Sécurité numérique',   href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Art. 78-2 CPP (Légifrance)', href: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038311800', type: 'external' },
    ],
    next_phase: { label: '→ Pendant : Contrôle d\'identité', next: 'pdt_controle' },
  },

  avant_controle_mineur: {
    id:        'avant_controle_mineur',
    text:      'Préparer un contrôle (mineur)',
    type:      'result',
    phase:     'avant',
    situation: 'controle',
    severity:  'orange',
    icon:      '🧒',
    context:   'Un mineur peut être contrôlé dans les mêmes conditions qu\'un majeur (art. 78-2 CPP), mais bénéficie de protections renforcées en cas de retenue ou de garde à vue. Si un mineur est retenu, les parents ou le représentant légal doivent être informés sans délai et un avocat est obligatoire dès le début de la retenue (art. L413-6 du Code de la justice pénale des mineurs). Le mineur ne peut pas renoncer à l\'avocat.',
    actions:   [
      'Garde sur toi le numéro d\'un parent ou représentant légal, joignable rapidement.',
      'Si tu es mineur, sache que l\'avocat est obligatoire : ne réponds à rien avant son arrivée.',
      'Préviens un adulte de confiance de ta présence sur l\'événement avant de partir.',
    ],
    rights:    [
      'En cas de retenue ou de GAV, l\'information immédiate des parents est obligatoire.',
      'L\'assistance d\'un avocat est de droit et ne peut pas faire l\'objet d\'une renonciation pour un mineur.',
      'Un examen médical peut être demandé et est de droit pour les plus jeunes.',
      'Le droit au silence s\'applique aussi aux mineurs.',
    ],
    pitfalls:  [
      'Croire qu\'on doit "coopérer" pour rentrer plus vite : un mineur ne doit jamais être auditionné sans avocat.',
      'Mentir sur son âge : l\'aggravation procédurale est réelle, l\'âge réel protège.',
    ],
    resources: [
      { label: 'Contacts & Alliés',    href: '/wiki/Contacts-Allies', type: 'contact' },
      { label: 'Droits des mineurs en GAV (Service-Public)', href: 'https://www.service-public.fr/particuliers/vosdroits/F1485', type: 'external' },
      { label: 'Spécificités mineurs (wiki à créer)', href: '/wiki/Mineurs-Droits', type: 'wiki', status: 'missing' },
    ],
    next_phase: { label: '→ Pendant : Contrôle d\'identité', next: 'pdt_controle' },
  },

  avant_controle_etranger: {
    id:        'avant_controle_etranger',
    text:      'Préparer un contrôle (étranger)',
    type:      'result',
    phase:     'avant',
    situation: 'controle',
    severity:  'orange',
    icon:      '🛂',
    context:   'Un ressortissant étranger doit pouvoir présenter les documents sous le couvert desquels il est autorisé à circuler ou séjourner en France (art. L812-1 et suivants du CESEDA). L\'absence de titre peut conduire à une retenue pour vérification du droit au séjour (jusqu\'à 24 heures, art. L813-1 CESEDA), distincte de la garde à vue. Le contrôle ne peut pas reposer sur la seule apparence physique.',
    actions:   [
      'Garde sur toi l\'original ou une copie lisible de ton titre de séjour, visa ou récépissé.',
      'Mémorise le numéro d\'une permanence juridique spécialisée droit des étrangers (La Cimade, GISTI).',
      'Si tu es en cours de régularisation, garde la preuve du dépôt de dossier.',
    ],
    rights:    [
      'Le contrôle ne peut être fondé sur des critères physiques ou ethniques (contrôle au faciès interdit).',
      'En retenue pour vérification du droit au séjour : droit à un avocat, à un interprète, à prévenir un proche et un médecin.',
      'La durée de la retenue administrative est limitée à 24 heures.',
    ],
    pitfalls:  [
      'Signer un document en langue non comprise sans interprète.',
      'Accepter une "aide au retour" ou une mesure d\'éloignement sans avoir consulté un avocat.',
    ],
    resources: [
      { label: 'Contacts & Alliés',    href: '/wiki/Contacts-Allies', type: 'contact' },
      { label: 'La Cimade',            href: 'https://www.lacimade.org', type: 'external' },
      { label: 'GISTI (droit des étrangers)', href: 'https://www.gisti.org', type: 'external' },
      { label: 'Retenue droit au séjour (wiki à créer)', href: '/wiki/Etrangers-Controle', type: 'wiki', status: 'missing' },
    ],
    next_phase: { label: '→ Pendant : Contrôle d\'identité', next: 'pdt_controle' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AVANT : FOUILLE / PERQUISITION
  // ═══════════════════════════════════════════════════════════════════════════

  avant_fouille: {
    id:        'avant_fouille',
    text:      'Que veux-tu préparer ?',
    type:      'question',
    phase:     'avant',
    situation: 'fouille',
    choices: [
      { label: 'Fouille de mon véhicule sur la route',          next: 'avant_fouille_vehicule' },
      { label: 'Fouille de mes affaires / de ma personne',      next: 'avant_fouille_corps'    },
      { label: 'Perquisition de mon domicile',                  next: 'avant_fouille_domicile' },
    ],
  },

  avant_fouille_vehicule: {
    id:        'avant_fouille_vehicule',
    text:      'Préparer une fouille de véhicule',
    type:      'result',
    phase:     'avant',
    situation: 'fouille',
    severity:  'orange',
    icon:      '🚗',
    context:   'La visite d\'un véhicule est encadrée par l\'article 78-2-3 et 78-2-4 du Code de procédure pénale. En dehors du flagrant délit, elle nécessite l\'accord du conducteur ou une réquisition du procureur. Sans cela, les forces de l\'ordre peuvent immobiliser le véhicule le temps d\'obtenir des instructions, mais pas fouiller librement. Le coffre d\'un véhicule transportant du matériel son est le point sensible : c\'est là que se joue la qualification d\'organisateur et la saisie (art. L211-15 CSI).',
    actions:   [
      'Garde les factures et titres de propriété du matériel son séparés du matériel lui-même, idéalement chez un tiers.',
      'Conserve le certificat d\'immatriculation à jour : la propriété du véhicule conditionne la contestation d\'une saisie.',
      'Répartis le matériel sensible sur plusieurs véhicules pour limiter l\'impact d\'une saisie unique.',
      'Mémorise : "Je ne consens pas à la fouille" si aucune réquisition ni flagrance n\'est présentée.',
    ],
    rights:    [
      'Hors flagrant délit, la visite du véhicule suppose ton accord ou une réquisition écrite du procureur.',
      'Tu peux demander à voir la réquisition (lieu, période, infractions visées).',
      'Le conducteur doit pouvoir assister à la visite de son véhicule.',
      'La propriété du matériel par un tiers de bonne foi peut faire échec à la confiscation.',
    ],
    pitfalls:  [
      'Consentir "pour aller plus vite" : un consentement écrase l\'absence de base légale et valide la saisie.',
      'Transporter factures et matériel ensemble : la saisie emporte les preuves de propriété.',
      'Laisser des éléments nominatifs (listes, plans) visibles dans l\'habitacle.',
    ],
    resources: [
      { label: 'Modus Operandi',       href: '/wiki/Modus-Operandi',   type: 'wiki'     },
      { label: 'Arsenal législatif',   href: '/wiki/arsenal-legislatif', type: 'wiki'   },
      { label: 'Art. 78-2-3 CPP (Légifrance)', href: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006578153', type: 'external' },
    ],
    next_phase: { label: '→ Pendant : Fouille du véhicule', next: 'pdt_fouille_vehicule' },
  },

  avant_fouille_corps: {
    id:        'avant_fouille_corps',
    text:      'Préparer une fouille corporelle / des affaires',
    type:      'result',
    phase:     'avant',
    situation: 'fouille',
    severity:  'orange',
    icon:      '🎒',
    context:   'Il faut distinguer la palpation de sécurité (geste superficiel par-dessus les vêtements, pour vérifier l\'absence d\'objet dangereux) de la fouille à corps, qui est une mesure d\'enquête bien plus intrusive assimilée à une perquisition et qui exige le cadre du flagrant délit ou une commission rogatoire. La fouille des bagages relève du même régime que la fouille de véhicule (accord ou réquisition).',
    actions:   [
      'Ne transporte rien de compromettant sur toi : la séparation physique entre toi et le matériel sensible est ta meilleure protection.',
      'Garde tes affaires personnelles minimales et organisées pour qu\'une palpation reste rapide et superficielle.',
      'Mémorise la différence : une palpation est tolérée, une fouille à corps complète exige un cadre légal précis.',
    ],
    rights:    [
      'La palpation doit rester superficielle et, en principe, être réalisée par une personne du même sexe.',
      'La fouille à corps intégrale est une mesure exceptionnelle soumise au cadre du flagrant délit ou d\'une instruction.',
      'Tu peux exiger que les motifs de la fouille soient consignés.',
    ],
    pitfalls:  [
      'Confondre palpation et fouille intégrale et "laisser faire" une mesure illégale sans le mentionner.',
      'Vider tes poches spontanément : ne facilite pas une fouille que rien n\'impose.',
    ],
    resources: [
      { label: 'Templates recours',    href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Recours juridiques',   href: '/wiki/recours-juridiques', type: 'wiki'    },
    ],
    next_phase: { label: '→ Pendant : Fouille / palpation', next: 'pdt_fouille_corporelle' },
  },

  avant_fouille_domicile: {
    id:        'avant_fouille_domicile',
    text:      'Préparer une perquisition de domicile',
    type:      'result',
    phase:     'avant',
    situation: 'fouille',
    severity:  'red',
    icon:      '🏠',
    context:   'La perquisition au domicile est très encadrée (art. 56 et suivants, art. 76 CPP). En enquête préliminaire, elle exige en principe ton accord écrit, sauf autorisation du juge des libertés et de la détention. En flagrance ou sur commission rogatoire, elle peut être imposée. Hors de ces cas, et entre 21h et 6h, elle est en principe interdite pour les infractions de droit commun. C\'est souvent la cible quand un collectif est identifié après un événement.',
    actions:   [
      'Applique une hygiène numérique stricte sur tes appareils domestiques : chiffrement complet du disque, sessions verrouillées.',
      'Ne stocke pas au domicile les éléments centralisant le collectif (listes, comptes, trésorerie) en clair.',
      'Identifie à l\'avance un avocat joignable et préviens un proche de confiance de la marche à suivre.',
      'Sache distinguer une perquisition avec accord (préliminaire) d\'une perquisition imposée (flagrance, commission rogatoire).',
    ],
    rights:    [
      'En enquête préliminaire, la perquisition exige ton accord écrit ou l\'autorisation du JLD.',
      'Tu dois être présent ou représenté, et un inventaire des saisies doit être dressé.',
      'Les perquisitions de nuit (21h-6h) sont en principe interdites pour les infractions de droit commun.',
      'Le secret professionnel de l\'avocat protège les échanges avec ton conseil.',
    ],
    pitfalls:  [
      'Donner un accord écrit en enquête préliminaire alors que rien ne t\'y oblige.',
      'Laisser des appareils déverrouillés ou non chiffrés accessibles.',
      'Ne pas vérifier l\'inventaire des objets saisis avant de signer.',
    ],
    resources: [
      { label: 'Sécurité numérique',   href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Contacts & Alliés',    href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Perquisition (Service-Public)', href: 'https://www.service-public.fr/particuliers/vosdroits/F32299', type: 'external' },
    ],
    next_phase: { label: '→ Pendant : Perquisition', next: 'pdt_fouille_perquisition' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AVANT : INTERPELLATION
  // ═══════════════════════════════════════════════════════════════════════════

  avant_interpellation: {
    id:        'avant_interpellation',
    text:      'Préparer une interpellation',
    type:      'result',
    phase:     'avant',
    situation: 'interpellation',
    severity:  'orange',
    icon:      '🚔',
    context:   'L\'interpellation est le moment où les forces de l\'ordre te privent de ta liberté d\'aller et venir pour t\'amener au poste. Avec la PPL 1133 (adoptée à l\'Assemblée le 9 avril 2026, créant un délit de participation à l\'organisation puni jusqu\'à 6 mois et 30 000 euros) et le texte RIPOST voté au Sénat le 26 mai 2026, le risque pénal lié au rôle joué sur l\'événement augmente fortement. La préparation consiste à ne donner aucune prise à une requalification en "organisateur de fait".',
    actions:   [
      'Décide à l\'avance ta ligne : droit au silence systématique, demande d\'avocat immédiate.',
      'Prépare ton téléphone : chiffrement, code long, biométrie désactivée, applications sensibles fermées.',
      'Convénez dans le collectif un protocole d\'alerte : qui prévenir, quel avocat, qui récupère le matériel.',
      'Garde sur papier le numéro d\'un avocat et du référent juridique, jamais uniquement dans le téléphone.',
    ],
    rights:    [
      'Tu as le droit de te taire à tout moment, y compris avant toute notification de garde à vue.',
      'Tu as le droit de faire prévenir un proche et de demander un avocat dès la GAV.',
      'La simple possession d\'un véhicule ou de matériel ne suffit pas à te qualifier d\'organisateur (Cass. Crim. 17 mars 2020).',
    ],
    pitfalls:  [
      'Vouloir "expliquer" ton rôle pour minimiser : c\'est exactement ce que la définition large d\'organisateur cherche à capter.',
      'Compter sur la mémoire pour les numéros utiles le jour J.',
      'Laisser ton téléphone déverrouillable par biométrie.',
    ],
    resources: [
      { label: 'Contacts & Alliés',    href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Sécurité numérique',   href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Recours juridiques',   href: '/wiki/recours-juridiques', type: 'wiki'    },
    ],
    next_phase: { label: '→ Pendant : Interpellation', next: 'pdt_interpellation' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AVANT : GARDE À VUE
  // ═══════════════════════════════════════════════════════════════════════════

  avant_gav: {
    id:        'avant_gav',
    text:      'Préparer une garde à vue',
    type:      'result',
    phase:     'avant',
    situation: 'gav',
    severity:  'red',
    icon:      '⛓',
    context:   'La garde à vue est une mesure de contrainte de 24 heures (renouvelable une fois sur autorisation du procureur, soit 48 heures pour les infractions de droit commun). Tes droits sont notifiés dès le début (art. 63-1 CPP) : droit de te taire, droit à un avocat, droit à un médecin, droit de faire prévenir un proche. Se préparer, c\'est avoir décidé en amont d\'exercer le silence et de réclamer un avocat, et avoir une logistique de soutien prête à l\'extérieur.',
    actions:   [
      'Mémorise une formule : "Je souhaite garder le silence et m\'entretenir avec un avocat."',
      'Conviens à l\'avance d\'un avocat ou du dispositif du collectif, et d\'une personne extérieure à prévenir.',
      'Prépare ton corps : connaître son droit à un examen médical est utile en cas de fatigue, traitement ou blessure.',
      'Briefe ton entourage : que faire à l\'extérieur pendant les 24 à 48h (récupérer matériel, contacter avocat).',
    ],
    rights:    [
      'Droit absolu de te taire pendant toute la garde à vue.',
      'Droit à un avocat dès la première heure, choisi ou commis d\'office.',
      'Droit de faire prévenir un proche et ton employeur.',
      'Droit à un examen médical et à un interprète si nécessaire.',
    ],
    pitfalls:  [
      'Parler pendant l\'audition "libre" avant l\'arrivée de l\'avocat : tout est exploitable.',
      'Minimiser ton rôle ("j\'aidais juste un ami") : la formulation peut être requalifiée en participation.',
      'Signer un procès-verbal sans l\'avoir lu intégralement.',
    ],
    resources: [
      { label: 'Contacts & Alliés (avocats)', href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Sécurité numérique',          href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Garde à vue (Service-Public)', href: 'https://www.service-public.fr/particuliers/vosdroits/F1043', type: 'external' },
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
      { label: 'Demande de papiers, contrôle classique',     next: 'pdt_controle_simple' },
      { label: 'Ils refusent de me laisser partir',          next: 'pdt_controle_retenu' },
      { label: 'Je n\'ai aucun papier sur moi',               next: 'pdt_controle_sans_papier' },
      { label: 'Ils tentent une fouille sans motif clair',   next: 'pdt_fouille'        },
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
    context:   'Tu es contrôlé sur le fondement de l\'article 78-2 CPP. Présenter une pièce d\'identité met fin au contrôle en quelques minutes. Reste calme et factuel : un contrôle d\'identité classique n\'est pas une audition, tu n\'as à fournir que ton identité.',
    actions:   [
      'Présente une pièce d\'identité ou prouve ton identité par tout moyen.',
      'Réponds uniquement sur ton identité ; pour le reste : "Je n\'ai rien à déclarer."',
      'Note mentalement l\'heure, le lieu et, si visible, le numéro de matricule (RIO) des agents.',
      'Une fois ton identité vérifiée, demande calmement si tu es libre de partir.',
    ],
    rights:    [
      'Tu peux prouver ton identité par tout moyen, pas seulement la carte d\'identité.',
      'Tu peux demander le motif et le cadre du contrôle.',
      'Tu n\'as aucune obligation de répondre au-delà de ton identité.',
    ],
    pitfalls:  [
      'Engager la conversation sur ta destination ou l\'événement.',
      'Déverrouiller ton téléphone "pour montrer ta bonne foi".',
    ],
    resources: [
      { label: 'Arsenal législatif', href: '/wiki/arsenal-legislatif', type: 'wiki' },
      { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive', type: 'wiki' },
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
    context:   'Si ton identité est établie et qu\'aucune infraction ne t\'est reprochée, te retenir sans cadre légal est irrégulier. La vérification d\'identité (art. 78-3 CPP) ne peut excéder 4 heures, et seulement si tu refuses ou es dans l\'impossibilité de justifier ton identité. Toute rétention au-delà du nécessaire peut fonder une contestation ultérieure.',
    actions:   [
      'Demande explicitement et calmement : "Suis-je libre de partir ? Sur quel fondement suis-je retenu ?"',
      'Mémorise précisément l\'heure de début, le lieu et la durée de la rétention.',
      'Si possible, fais constater la scène par un témoin ou en filmant à distance, sans gêner l\'intervention.',
      'Ne hausse pas le ton : l\'outrage ou la rébellion sont les infractions "miroir" les plus fréquentes.',
    ],
    rights:    [
      'La vérification d\'identité est limitée à 4 heures et suppose que tu ne puisses pas justifier ton identité.',
      'Tu as le droit de faire prévenir le procureur et un proche en cas de vérification au poste.',
      'Tu peux demander qu\'un procès-verbal de vérification soit établi (il doit l\'être).',
    ],
    pitfalls:  [
      'Croire que tu dois "attendre sagement" sans jamais demander le fondement.',
      'Réagir à la provocation : c\'est le terrain de l\'outrage/rébellion.',
    ],
    resources: [
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',  type: 'contact' },
      { label: 'Templates recours',  href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive', type: 'wiki' },
    ],
    next_phase: { label: '→ Après : Recours et documentation', next: 'apr_controle' },
  },

  pdt_controle_sans_papier: {
    id:        'pdt_controle_sans_papier',
    text:      'Contrôle sans pièce d\'identité',
    type:      'result',
    phase:     'pendant',
    situation: 'controle',
    severity:  'orange',
    icon:      '🪪',
    context:   'Ne pas porter de pièce d\'identité n\'est pas une infraction, mais si tu ne peux pas prouver ton identité par un autre moyen, les forces de l\'ordre peuvent te retenir pour vérification (art. 78-3 CPP) jusqu\'à 4 heures, le temps d\'établir ton identité. Au-delà, ou si ton identité est établie autrement, la rétention doit cesser.',
    actions:   [
      'Prouve ton identité par tout autre moyen : autre document, témoignage d\'un proche présent, déclaration vérifiable.',
      'Reste coopératif sur ta seule identité, silencieux sur le reste.',
      'Note l\'heure de début : le compteur des 4 heures démarre au début de la vérification.',
      'Demande qu\'un proche soit prévenu si tu es conduit au poste.',
    ],
    rights:    [
      'L\'absence de pièce d\'identité n\'est pas en soi une infraction.',
      'La vérification d\'identité ne peut excéder 4 heures.',
      'Tu peux demander à prévenir le procureur de la République et un proche.',
      'Tu peux refuser de te soumettre à une prise d\'empreintes / photo, mais ce refus est lui-même sanctionnable : pèse-le avec un avocat.',
    ],
    pitfalls:  [
      'Donner une fausse identité : c\'est un délit autonome (art. 434-23 CP).',
      'Croire que sans papiers tu peux être gardé indéfiniment : 4 heures maximum pour la seule vérification.',
    ],
    resources: [
      { label: 'Arsenal législatif', href: '/wiki/arsenal-legislatif', type: 'wiki' },
      { label: 'Vérification d\'identité (Service-Public)', href: 'https://www.service-public.fr/particuliers/vosdroits/F1036', type: 'external' },
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
    context:   'La visite du véhicule (art. 78-2-3 et 78-2-4 CPP) suppose, hors flagrant délit, ton accord ou une réquisition écrite du procureur. Le coffre chargé de matériel son est l\'enjeu central : c\'est sur cette base que se déclenchent la qualification d\'organisateur et la saisie conservatoire (art. L211-15 CSI), possible avant toute condamnation et jusqu\'à 6 mois en vue de confiscation.',
    actions:   [
      'Si aucune réquisition ni flagrance : "Je ne consens pas à la fouille de mon véhicule."',
      'Demande à voir la réquisition du procureur (lieu, période, infractions visées).',
      'Exige d\'assister à la visite et de filmer ou faire constater le déroulé.',
      'En cas de saisie, exige immédiatement un PV de saisie listant chaque matériel avec numéro de série.',
    ],
    rights:    [
      'Hors flagrance, la visite suppose ton accord ou une réquisition écrite du procureur.',
      'Tu peux assister à la visite de ton véhicule.',
      'Tu as droit à la remise d\'un inventaire des objets saisis.',
      'Un tiers de bonne foi propriétaire du matériel peut contester la saisie.',
    ],
    pitfalls:  [
      'Consentir verbalement : ton accord valide la visite et la saisie.',
      'Ne pas réclamer le PV de saisie sur place : il conditionne la restitution.',
      'Laisser saisir factures et titres de propriété avec le matériel.',
    ],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'     },
      { label: 'FSJS (saisies sound system)', href: 'https://www.facebook.com/association.fsjs/', type: 'external' },
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
    context:   'La palpation de sécurité est un geste superficiel par-dessus les vêtements, destiné à vérifier l\'absence d\'objet dangereux. La fouille à corps intégrale est tout autre chose : assimilée à une perquisition, elle exige le cadre du flagrant délit ou une commission rogatoire et doit respecter la dignité de la personne. Une fouille intégrale hors cadre est une atteinte grave susceptible de nullité de procédure.',
    actions:   [
      'Distingue à voix haute palpation et fouille intégrale : "S\'agit-il d\'une palpation ou d\'une fouille à corps ? Sur quel fondement ?"',
      'Demande que la palpation soit réalisée par une personne du même sexe et hors de la vue du public.',
      'Mémorise l\'heure, le lieu, les agents et fais constater par un témoin si possible.',
      'Ne t\'oppose pas physiquement, mais signale clairement ton absence de consentement à une mesure intrusive.',
    ],
    rights:    [
      'La palpation doit rester superficielle et proportionnée.',
      'La fouille à corps intégrale exige un cadre légal strict (flagrance, instruction) et le respect de la dignité.',
      'Tu peux demander que les motifs et le déroulé soient consignés au procès-verbal.',
    ],
    pitfalls:  [
      'Laisser passer une fouille intégrale illégale sans jamais la nommer ni la contester.',
      'Réagir physiquement : cela ouvre la porte à la rébellion.',
    ],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'     },
      { label: 'Défenseur des droits (saisine)', href: 'https://www.defenseurdesdroits.fr/saisir', type: 'external' },
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
    context:   'La fouille d\'un sac ou de bagages relève du même régime que la visite de véhicule : hors flagrant délit, elle suppose ton accord ou une réquisition. La présentation spontanée du contenu de tes poches n\'est jamais obligatoire. C\'est souvent le moment où sont "découverts" des éléments qui servent ensuite à la qualification.',
    actions:   [
      'Si aucun cadre n\'est présenté : "Je ne consens pas à la fouille de mes affaires."',
      'Demande le fondement (réquisition, flagrance) et fais-le consigner.',
      'N\'ouvre pas spontanément ton sac ni tes poches.',
      'Note l\'heure, le lieu, les agents, et fais constater si possible.',
    ],
    rights:    [
      'Hors flagrance, la fouille des affaires suppose ton accord ou une réquisition.',
      'Tu peux demander à voir le cadre légal invoqué.',
      'Tu n\'as pas à vider tes poches de toi-même.',
    ],
    pitfalls:  [
      'Ouvrir ton sac "pour coopérer" : tu valides une fouille que rien n\'imposait.',
      'Transporter des éléments nominatifs (listes, plans, trésorerie) sur toi.',
    ],
    resources: [
      { label: 'Modus Operandi',     href: '/wiki/Modus-Operandi',   type: 'wiki'     },
      { label: 'Templates recours',  href: '/wiki/Templates-Recours', type: 'template' },
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
    context:   'La perquisition est en cours à ton domicile. Le régime dépend du cadre : en enquête préliminaire (art. 76 CPP) elle exige en principe ton accord écrit ou l\'autorisation du JLD ; en flagrance ou sur commission rogatoire, elle s\'impose. Un inventaire des objets saisis doit être dressé et tu dois être présent ou représenté. Les perquisitions de nuit (21h-6h) sont en principe interdites pour les infractions de droit commun.',
    actions:   [
      'Demande sur quel cadre repose la perquisition (préliminaire, flagrance, commission rogatoire).',
      'En enquête préliminaire, ne donne pas spontanément ton accord écrit : exige l\'autorisation du JLD.',
      'Reste présent et exige un inventaire précis de chaque objet saisi avant toute signature.',
      'Appelle immédiatement un avocat ; ne communique aucun code d\'appareil sans son conseil.',
    ],
    rights:    [
      'En préliminaire, la perquisition exige ton accord écrit ou l\'autorisation du JLD.',
      'Tu dois être présent ou représenté, et l\'inventaire des saisies est obligatoire.',
      'Les perquisitions de nuit sont en principe interdites (droit commun).',
      'Tu peux te taire et demander l\'assistance d\'un avocat.',
    ],
    pitfalls:  [
      'Signer l\'accord écrit en préliminaire alors que rien ne t\'y oblige.',
      'Donner les codes de tes appareils sans avis d\'avocat.',
      'Signer l\'inventaire sans l\'avoir vérifié objet par objet.',
    ],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',   type: 'contact'  },
      { label: 'Sécurité numérique', href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Perquisition (Service-Public)', href: 'https://www.service-public.fr/particuliers/vosdroits/F32299', type: 'external' },
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
      { label: 'Je suis blessé / il y a eu usage de la force',        next: 'pdt_interpel_violences' },
      { label: 'Je filme / j\'observe en tant que témoin ou presse',   next: 'pdt_interpel_observateur' },
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
    context:   'Tu es interpellé mais la garde à vue n\'a pas encore été notifiée. Ce moment "gris" est sensible : tout ce que tu dis peut être consigné et utilisé, même hors audition formelle. Avec la définition large d\'organisateur introduite par la PPL 1133 ("contribuer de manière directe ou indirecte"), la moindre déclaration sur ton rôle peut peser. La règle est simple : silence, et demande d\'avocat dès la notification de GAV.',
    actions:   [
      'Reste silencieux sur les faits : "Je souhaite garder le silence et m\'entretenir avec un avocat."',
      'Ne réponds qu\'à ton identité.',
      'Mémorise l\'heure de l\'interpellation : elle marque le début effectif de la privation de liberté.',
      'Ne touche pas à ton téléphone et ne le déverrouille pas.',
    ],
    rights:    [
      'Le droit au silence s\'applique avant même la notification formelle de GAV.',
      'Dès la GAV notifiée : avocat, médecin, information d\'un proche.',
      'Tu n\'as pas à justifier ton rôle dans l\'organisation.',
    ],
    pitfalls:  [
      'Profiter du flou pré-GAV pour "s\'expliquer" : c\'est le piège principal.',
      'Déverrouiller ton téléphone par biométrie sous la pression.',
    ],
    resources: [
      { label: 'Sécurité numérique', href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'    },
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
    context:   'La saisie repose sur l\'article L211-15 CSI : préfet, OPJ et APJ habilités peuvent saisir le matériel dès le constat de l\'infraction, avant toute condamnation, pour une durée maximale de 6 mois en vue d\'une confiscation par le tribunal. C\'est une saisie conservatoire préventive, particulièrement sévère. La contestation repose sur la propriété, la proportionnalité et les droits des tiers de bonne foi (Cass. Crim. 17 mars 2020 : la possession du véhicule ne suffit pas à qualifier d\'organisateur).',
    actions:   [
      'Exige sur place un procès-verbal de saisie listant chaque matériel avec numéros de série.',
      'Photographie ou filme le matériel saisi et le déroulé, si possible.',
      'Rassemble immédiatement factures, titres de propriété et carte grise (idéalement déjà chez un tiers).',
      'Contacte le FSJS sans attendre : restitution obtenue dans environ 90% des dossiers suivis.',
    ],
    rights:    [
      'La saisie est conservatoire (max 6 mois) ; la confiscation définitive exige une décision de justice.',
      'Tu as droit à la liste détaillée des matériels saisis.',
      'Un tiers de bonne foi propriétaire peut contester la saisie.',
      'La saisie disproportionnée (valeur du matériel >> gravité de l\'infraction) peut être contestée.',
    ],
    pitfalls:  [
      'Repartir sans PV de saisie : la restitution devient beaucoup plus difficile.',
      'Laisser saisir les preuves de propriété avec le matériel.',
      'Attendre plusieurs semaines pour agir : le délai de contestation est court.',
    ],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'RIPOST',             href: '/wiki/ripost',            type: 'wiki'     },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',   type: 'contact'  },
      { label: 'FSJS (contact@fsjs.fr)', href: 'https://www.facebook.com/association.fsjs/', type: 'external' },
    ],
    next_phase: { label: '→ Après : Matériel saisi - recours', next: 'apr_interpel_saisie' },
  },

  pdt_interpel_violences: {
    id:        'pdt_interpel_violences',
    text:      'Blessure / usage de la force',
    type:      'result',
    phase:     'pendant',
    situation: 'interpellation',
    severity:  'red',
    icon:      '🩹',
    context:   'L\'usage de la force par les forces de l\'ordre doit rester absolument nécessaire et strictement proportionné (art. R434-18 du Code de la sécurité intérieure). Toute blessure doit être documentée immédiatement : c\'est la condition d\'un futur recours (plainte, saisine de l\'IGPN/IGGN ou du Défenseur des droits). La preuve médicale (certificat avec ITT) et visuelle est déterminante.',
    actions:   [
      'Demande immédiatement un examen médical : c\'est un droit en GAV et la base d\'un certificat avec ITT.',
      'Fais photographier tes blessures dès que possible, avec date et témoins.',
      'Note matricule (RIO), unité, heure et lieu ; recueille les coordonnées de témoins.',
      'Conserve tes vêtements en l\'état (traces) sans les laver.',
    ],
    rights:    [
      'Droit à un examen médical en garde à vue.',
      'Droit de déposer plainte et de saisir le Défenseur des droits et l\'IGPN/IGGN.',
      'L\'usage de la force doit être nécessaire et proportionné ; à défaut, il est fautif.',
    ],
    pitfalls:  [
      'Ne pas faire constater médicalement les blessures dans les délais : la preuve s\'efface.',
      'Laver vêtements et traces avant constatation.',
      'Riposter physiquement : transforme la victime en mis en cause (rébellion).',
    ],
    resources: [
      { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive', type: 'wiki'    },
      { label: 'Contacts & Alliés',        href: '/wiki/Contacts-Allies',          type: 'contact' },
      { label: 'Défenseur des droits (saisine)', href: 'https://www.defenseurdesdroits.fr/saisir', type: 'external' },
      { label: 'Violences policières - recours (wiki à créer)', href: '/wiki/Violences-Policieres-Recours', type: 'wiki', status: 'missing' },
    ],
    next_phase: { label: '→ Après : Suites interpellation', next: 'apr_interpellation' },
  },

  pdt_interpel_observateur: {
    id:        'pdt_interpel_observateur',
    text:      'Témoin / observateur / presse',
    type:      'result',
    phase:     'pendant',
    situation: 'interpellation',
    severity:  'orange',
    icon:      '🎥',
    context:   'Filmer ou photographier une intervention policière sur la voie publique est un droit. Le Conseil constitutionnel a censuré, en mai 2021, le délit de "provocation à l\'identification" issu de la loi Sécurité globale. Tu peux donc capter et diffuser des images d\'agents en intervention, dès lors que tu n\'entraves pas matériellement leur action. Cette documentation est précieuse pour les personnes interpellées.',
    actions:   [
      'Filme à distance, sans gêner physiquement l\'intervention ni franchir un périmètre.',
      'Cadre les éléments utiles : matricule (RIO), heure, déroulé, identité des personnes interpellées si elles consentent.',
      'Sauvegarde et duplique les fichiers rapidement (cloud chiffré, second appareil).',
      'Recueille les coordonnées d\'autres témoins.',
    ],
    rights:    [
      'Filmer des agents en intervention sur la voie publique est licite (décision Conseil constitutionnel, mai 2021).',
      'On ne peut pas t\'obliger à effacer des images ni te confisquer ton téléphone sans cadre légal.',
      'Tu n\'as pas à justifier ta présence au-delà de ton identité.',
    ],
    pitfalls:  [
      'Entraver physiquement l\'intervention : cela peut caractériser un délit.',
      'Effacer tes images sous la pression : tu n\'y es pas tenu.',
      'Diffuser des images permettant d\'identifier des participants sans leur accord.',
    ],
    resources: [
      { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive', type: 'wiki' },
      { label: 'Sécurité numérique',       href: '/wiki/Sécurite-Numerique',       type: 'wiki' },
      { label: 'Observatoire des libertés (LDH)', href: 'https://www.ldh-france.org', type: 'external' },
    ],
    next_phase: { label: '→ Après : Recours et documentation', next: 'apr_controle' },
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
      { label: 'Droits viennent d\'être lus, premier moment', next: 'pdt_gav_debut'          },
      { label: 'Audition en cours / interrogatoire',          next: 'pdt_gav_interrogatoire' },
      { label: 'Ils veulent mon téléphone ou mon code PIN',   next: 'pdt_gav_telephone'      },
      { label: 'Un proche est en GAV, je suis dehors',        next: 'pdt_gav_proche'         },
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
    context:   'La GAV vient d\'être notifiée. Tes droits te sont lus (art. 63-1 CPP) : droit de te taire, droit à un avocat, droit à un médecin, droit de faire prévenir un proche et ton employeur. La durée est de 24 heures, renouvelable une fois sur autorisation du procureur (48h pour les infractions de droit commun). Les premières minutes fixent ta ligne : silence et avocat.',
    actions:   [
      'Demande explicitement un avocat : "Je veux m\'entretenir avec un avocat avant toute audition."',
      'Exerce le droit au silence : tu n\'as à donner que ton identité.',
      'Demande qu\'un proche soit prévenu et, si besoin, un examen médical.',
      'Note mentalement l\'heure exacte de début de GAV : elle conditionne tous les délais.',
    ],
    rights:    [
      'Droit absolu de te taire.',
      'Droit à un avocat dès la première heure, choisi ou commis d\'office.',
      'Droit à un médecin et à un interprète.',
      'Droit de faire prévenir un proche et ton employeur.',
    ],
    pitfalls:  [
      'Renoncer à l\'avocat "pour aller plus vite".',
      'Parler pendant l\'attente de l\'avocat.',
      'Signer un PV non lu.',
    ],
    resources: [
      { label: 'Contacts & Alliés (avocats)', href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Sécurité numérique',          href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Garde à vue (Service-Public)', href: 'https://www.service-public.fr/particuliers/vosdroits/F1043', type: 'external' },
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
    context:   'L\'audition est le cœur de la procédure : le procès-verbal qui en résulte sert de base à toute la suite. Le droit au silence est un droit absolu et stratégique : ton avocat évalue avec toi les preuves déjà détenues par les enquêteurs avant de conseiller une version, ou le silence. Une déclaration minimisant ton rôle peut être requalifiée en participation à l\'organisation (PPL 1133).',
    actions:   [
      'Maintiens le silence tant que tu n\'as pas vu ton avocat et défini une stratégie avec lui.',
      'Ne confirme aucune prise de décision (lieu, sono, planification, diffusion d\'infos).',
      'Lis intégralement chaque PV avant de signer ; fais corriger toute inexactitude.',
      'Si une question te pousse à minimiser ton rôle, reste sur le silence.',
    ],
    rights:    [
      'Droit au silence pendant toute l\'audition.',
      'Droit à la présence de l\'avocat pendant les auditions.',
      'Droit de faire consigner tes observations et de demander des corrections au PV.',
    ],
    pitfalls:  [
      'Minimiser ("j\'aidais juste un ami") : formule requalifiable en organisation de fait.',
      'Signer un PV contenant des imprécisions.',
      'Répondre pour "ne pas avoir l\'air coupable" : le silence ne peut pas fonder une condamnation.',
    ],
    resources: [
      { label: 'Contacts & Alliés (avocats)', href: '/wiki/Contacts-Allies', type: 'contact' },
      { label: 'Recours juridiques',          href: '/wiki/recours-juridiques', type: 'wiki' },
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
    context:   'Le refus de communiquer une convention secrète de déchiffrement (code PIN, mot de passe) d\'un moyen de cryptologie susceptible d\'avoir servi à préparer ou commettre un crime ou délit est réprimé par l\'article 434-15-2 du Code pénal. La jurisprudence (Cass. Crim. 2022-2023) a confirmé que le code de déverrouillage d\'un téléphone peut entrer dans ce champ. C\'est un arbitrage délicat à faire avec ton avocat, profil par profil.',
    actions:   [
      'Ne communique aucun code sans avoir consulté ton avocat : l\'arbitrage dépend de ton profil et des faits.',
      'Rappelle que le déverrouillage biométrique forcé et la remise d\'un code n\'ont pas le même régime.',
      'Demande à ce que toute remise éventuelle de code soit faite via l\'avocat et consignée.',
      'Garde le silence sur le contenu et l\'usage du téléphone.',
    ],
    rights:    [
      'Droit au silence sur les faits.',
      'Droit à l\'assistance de l\'avocat pour arbitrer la question du code.',
      'La contrainte doit reposer sur un cadre légal ; tout dépassement peut être contesté.',
    ],
    pitfalls:  [
      'Donner le code spontanément sous la pression, sans avis d\'avocat.',
      'Avoir laissé la biométrie active : elle facilite le déverrouillage sous contrainte.',
    ],
    resources: [
      { label: 'Sécurité numérique', href: '/wiki/Sécurite-Numerique', type: 'wiki'    },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Art. 434-15-2 CP (Légifrance)', href: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043409816', type: 'external' },
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
    context:   'Tu es à l\'extérieur et un proche est en garde à vue. Tu ne peux pas le contacter directement, mais tu peux agir utilement : mobiliser un avocat, préserver les preuves, et organiser le soutien matériel. Le temps joue : la GAV dure 24h, renouvelable une fois.',
    actions:   [
      'Contacte immédiatement un avocat (ou le référent juridique du collectif) et communique-lui l\'identité et le lieu présumé de la GAV.',
      'Note l\'heure à laquelle tu as su l\'interpellation : utile pour vérifier les délais.',
      'Préserve les preuves de propriété du matériel et mets-les à l\'abri.',
      'Organise le relais : qui récupère le véhicule, qui prévient la famille, qui suit la sortie.',
    ],
    rights:    [
      'Le proche en GAV a droit à un avocat, un médecin et à faire prévenir un proche (c\'est peut-être toi).',
      'Tu peux mandater un avocat pour lui même sans pouvoir lui parler directement.',
    ],
    pitfalls:  [
      'Appeler les services en donnant des informations qui aggravent le dossier.',
      'Diffuser publiquement des détails qui nuisent à la défense.',
    ],
    resources: [
      { label: 'Contacts & Alliés (urgence)', href: '/wiki/Contacts-Allies', type: 'contact' },
      { label: 'Garde à vue d\'un proche (Service-Public)', href: 'https://www.service-public.fr/particuliers/vosdroits/F1043', type: 'external' },
    ],
    next_phase: { label: '→ Après : Sortie de GAV', next: 'apr_gav' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APRÈS : CONTRÔLE D'IDENTITÉ
  // ═══════════════════════════════════════════════════════════════════════════

  apr_controle: {
    id:        'apr_controle',
    text:      'Que s\'est-il passé pendant le contrôle ?',
    type:      'question',
    phase:     'apres',
    situation: 'controle',
    choices: [
      { label: 'Contrôle banal, je veux juste documenter',     next: 'apr_controle_doc'     },
      { label: 'Contrôle abusif / au faciès, je veux contester', next: 'apr_controle_abus'  },
    ],
  },

  apr_controle_doc: {
    id:        'apr_controle_doc',
    text:      'Documenter le contrôle',
    type:      'result',
    phase:     'apres',
    situation: 'controle',
    severity:  'green',
    icon:      '📋',
    context:   'Même un contrôle banal mérite d\'être documenté : la trace constitue une preuve en cas de répétition ou de litige ultérieur, et alimente la cartographie collective de la répression. La documentation préemptive transforme un fait isolé en élément exploitable.',
    actions:   [
      'Note à chaud : date, heure, lieu, unité, matricule (RIO), motif invoqué, déroulé.',
      'Conserve toute image ou enregistrement et duplique-les.',
      'Signale l\'incident sur la carte collective si le contrôle s\'inscrit dans une vague répressive.',
    ],
    rights:    [
      'Tu peux demander copie du procès-verbal de vérification d\'identité s\'il a été établi.',
      'Tu peux conserver et utiliser tes propres enregistrements.',
    ],
    pitfalls:  [
      'Attendre plusieurs jours pour noter les détails : la mémoire se dégrade.',
      'Ne garder qu\'une seule copie des fichiers.',
    ],
    resources: [
      { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive', type: 'wiki' },
      { label: 'Carte de la répression',   href: '/map',                           type: 'wiki' },
    ],
  },

  apr_controle_abus: {
    id:        'apr_controle_abus',
    text:      'Contester un contrôle abusif',
    type:      'result',
    phase:     'apres',
    situation: 'controle',
    severity:  'orange',
    icon:      '⚖️',
    context:   'Un contrôle fondé sur l\'apparence physique ou répété sans motif est un contrôle discriminatoire. La jurisprudence (Cass., arrêts de 2016 sur les contrôles au faciès ; CEDH) reconnaît la possibilité d\'engager la responsabilité de l\'État. Le Défenseur des droits peut être saisi gratuitement, et une action en responsabilité contre l\'État est envisageable.',
    actions:   [
      'Rassemble tout élément de preuve : témoins, vidéos, horodatage, répétition des contrôles.',
      'Saisis le Défenseur des droits (gratuit, en ligne).',
      'Consulte un avocat ou une permanence (LDH, SAF) sur une éventuelle action contre l\'État.',
      'Rédige un récit factuel précis tant que les détails sont frais.',
    ],
    rights:    [
      'Le contrôle au faciès est illégal et peut engager la responsabilité de l\'État.',
      'Tu peux saisir le Défenseur des droits sans avocat ni frais.',
      'Tu peux demander réparation devant le juge judiciaire.',
    ],
    pitfalls:  [
      'Penser qu\'un contrôle au faciès "ne se prouve pas" : le faisceau d\'indices (répétition, témoins) compte.',
      'Laisser passer les délais sans consigner les faits.',
    ],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours',  type: 'template' },
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'     },
      { label: 'Défenseur des droits (saisine)', href: 'https://www.defenseurdesdroits.fr/saisir', type: 'external' },
      { label: 'LDH (permanences)',  href: 'https://www.ldh-france.org', type: 'external' },
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
    context:   'Après une fouille ou une perquisition, deux leviers existent : la contestation de la régularité de la mesure (qui peut entraîner la nullité des actes et des preuves obtenues) et, le cas échéant, la restitution des objets saisis. La nullité de procédure se soulève devant le juge, souvent par l\'avocat, dans les délais de la procédure pénale.',
    actions:   [
      'Récupère et conserve tout PV (de fouille, de perquisition, de saisie) avec inventaire.',
      'Note les irrégularités constatées : absence de cadre légal, défaut d\'inventaire, fouille de nuit, absence du concerné.',
      'Transmets ces éléments à un avocat pour soulever une éventuelle nullité.',
      'Engage une demande de restitution pour les objets saisis non confisqués.',
    ],
    rights:    [
      'Une fouille ou perquisition irrégulière peut être annulée, entraînant l\'écartement des preuves.',
      'Tu peux demander la restitution des objets saisis en l\'absence de confiscation.',
      'Tu as droit à l\'inventaire des objets saisis.',
    ],
    pitfalls:  [
      'Ne pas conserver les PV : sans eux, la contestation est très difficile.',
      'Laisser filer les délais procéduraux pour soulever la nullité.',
    ],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours',  type: 'template' },
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'     },
      { label: 'Prescription et délais', href: '/wiki/Prescription-et-Delais', type: 'wiki' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APRÈS : INTERPELLATION
  // ═══════════════════════════════════════════════════════════════════════════

  apr_interpellation: {
    id:        'apr_interpellation',
    text:      'Quelle est la suite ?',
    type:      'question',
    phase:     'apres',
    situation: 'interpellation',
    choices: [
      { label: 'J\'ai reçu une AFD (amende forfaitaire délictuelle)', next: 'apr_afd_timing'         },
      { label: 'J\'ai reçu une contravention de 5e classe',           next: 'apr_contravention'      },
      { label: 'Relâché sans suite, pas d\'amende',                   next: 'apr_interpel_sans_suite' },
      { label: 'Mon matériel a été saisi',                             next: 'apr_interpel_saisie'    },
      { label: 'Je veux porter plainte (violences, abus)',            next: 'apr_interpel_plainte'   },
    ],
  },

  apr_afd_timing: {
    id:        'apr_afd_timing',
    text:      'Quand as-tu reçu l\'AFD ?',
    type:      'question',
    phase:     'apres',
    situation: 'interpellation',
    choices: [
      { label: 'Sur le terrain, maintenant',             next: 'apr_afd_terrain',  tag: 'URGENT' },
      { label: 'Reçue par courrier (moins de 15 jours)', next: 'apr_afd_moins15j'                },
      { label: 'Reçue par courrier (15 à 30 jours)',     next: 'apr_afd_15_30j',   tag: 'URGENT' },
      { label: 'Reçue par courrier (plus de 30 jours)',  next: 'apr_afd_plus30j'                 },
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
    context:   'L\'amende forfaitaire délictuelle te permet d\'éteindre les poursuites en payant immédiatement. Payer vaut reconnaissance de l\'infraction et ferme la voie de la contestation sur le fond. Sur le terrain, rien ne t\'oblige à payer immédiatement : tu peux refuser le paiement comptant et te réserver le droit de contester.',
    actions:   [
      'Ne paie pas sur le coup : le paiement vaut reconnaissance et éteint ton droit de contester.',
      'Demande et conserve l\'avis d\'AFD avec son numéro et la qualification exacte.',
      'Note l\'identité de l\'agent, l\'heure et les circonstances.',
      'Consulte le FSJS ou un avocat avant toute décision de paiement.',
    ],
    rights:    [
      'Tu peux refuser le paiement immédiat et choisir de contester ensuite.',
      'Tu disposes d\'un délai pour formuler une requête en exonération.',
      'Tu peux contester la qualification d\'organisateur (art. R211-27 CSI).',
    ],
    pitfalls:  [
      'Payer "pour en finir" : tu perds tout recours sur le fond.',
      'Égarer l\'avis d\'AFD : son numéro conditionne la contestation.',
    ],
    resources: [
      { label: 'RIPOST',            href: '/wiki/ripost',            type: 'wiki'     },
      { label: 'Templates recours', href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Guide contestation FSJS (PDF)', href: 'https://freeform.fr/wp-content/uploads/2025/03/Guide-de-contestation.pdf', type: 'external' },
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
    context:   'Tu es dans la fenêtre favorable. En contestant rapidement (requête en exonération avec l\'avis et son numéro), tu évites la majoration et tu portes le dossier devant l\'officier du ministère public, puis le cas échéant le tribunal. La contestation suspend l\'obligation de payer le montant majoré.',
    actions:   [
      'Rédige et envoie la requête en exonération dans les délais, en recommandé.',
      'Joins une consignation si elle est exigée (elle est restituée si tu obtiens gain de cause).',
      'Conserve une copie complète de ton envoi et l\'accusé de réception.',
      'Prépare tes arguments : qualification d\'organisateur, régularité de la procédure, proportionnalité.',
    ],
    rights:    [
      'Tu peux contester par requête en exonération avant majoration.',
      'La contestation est portée devant l\'OMP puis, si besoin, le tribunal.',
      'Tu peux invoquer la liberté de réunion (CESDH art. 11).',
    ],
    pitfalls:  [
      'Envoyer la contestation sans preuve d\'envoi.',
      'Dépasser le délai et basculer sur l\'amende majorée.',
    ],
    resources: [
      { label: 'RIPOST',            href: '/wiki/ripost',                 type: 'wiki'     },
      { label: 'Templates recours', href: '/wiki/Templates-Recours',      type: 'template' },
      { label: 'Contacts & Alliés', href: '/wiki/Contacts-Allies',        type: 'contact'  },
      { label: 'Guide contestation FSJS (PDF)', href: 'https://freeform.fr/wp-content/uploads/2025/03/Guide-de-contestation.pdf', type: 'external' },
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
    context:   'Tu approches de la limite. Selon le délai applicable, l\'amende peut basculer vers le montant majoré et la contestation devient plus contrainte. Agis immédiatement : la requête doit partir aujourd\'hui, en recommandé, avec l\'avis et tous les justificatifs.',
    actions:   [
      'Envoie ta requête en exonération sans attendre, aujourd\'hui, en recommandé avec AR.',
      'Vérifie le délai exact mentionné sur ton avis : il fait foi.',
      'Contacte en parallèle le FSJS ou un avocat pour sécuriser la forme.',
      'Conserve toutes les preuves d\'envoi.',
    ],
    rights:    [
      'Tu conserves un droit de contestation tant que le délai de l\'avis n\'est pas expiré.',
      'La contestation suspend le recouvrement du montant majoré.',
    ],
    pitfalls:  [
      'Reporter encore l\'envoi : chaque jour rapproche de la forclusion.',
      'Te fier à un délai général plutôt qu\'à celui inscrit sur ton avis.',
    ],
    resources: [
      { label: 'RIPOST',            href: '/wiki/ripost',            type: 'wiki'     },
      { label: 'Templates recours', href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'Prescription et délais', href: '/wiki/Prescription-et-Delais', type: 'wiki' },
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
    context:   'Le délai ordinaire de contestation peut être dépassé et l\'amende est susceptible d\'être devenue exécutoire et majorée. Tout n\'est pas perdu : une réclamation auprès de l\'officier du ministère public reste possible en invoquant un motif légitime (non-réception, erreur d\'adresse), et certaines voies subsistent. C\'est le moment de faire intervenir un avocat ou le FSJS.',
    actions:   [
      'Contacte immédiatement le FSJS ou un avocat : la situation est récupérable mais technique.',
      'Rassemble la preuve d\'une éventuelle non-réception ou erreur d\'adresse.',
      'Adresse une réclamation motivée à l\'OMP, en recommandé.',
      'Vérifie les délais de prescription applicables à ton infraction.',
    ],
    rights:    [
      'Une réclamation pour motif légitime (non-réception) reste possible après le délai ordinaire.',
      'La prescription peut éteindre la poursuite selon le type d\'infraction.',
    ],
    pitfalls:  [
      'Considérer le dossier comme définitivement perdu sans consulter.',
      'Payer le montant majoré sans vérifier les voies restantes.',
    ],
    resources: [
      { label: 'Contacts & Alliés (urgence)', href: '/wiki/Contacts-Allies', type: 'contact' },
      { label: 'Prescription et délais',      href: '/wiki/Prescription-et-Delais', type: 'wiki' },
      { label: 'Recours juridiques',          href: '/wiki/recours-juridiques', type: 'wiki' },
    ],
  },

  apr_contravention: {
    id:        'apr_contravention',
    text:      'Contravention de 5e classe',
    type:      'result',
    phase:     'apres',
    situation: 'interpellation',
    severity:  'orange',
    icon:      '🧾',
    context:   'En droit actuel (avant entrée en vigueur pleine de la PPL 1133), l\'organisation sans déclaration est punie d\'une contravention de 5e classe, soit jusqu\'à 1 500 euros (art. R211-27 CSI). L\'avis de contravention se conteste. Le FSJS recommande une procédure en deux temps : contester d\'abord en ligne (refus quasi-systématique), puis contester de nouveau par courrier avec attestations de témoins. Le délai est de 45 jours pour contester sans risque de majoration.',
    actions:   [
      'Conteste d\'abord en ligne, sans attestations : tu recevras un refus, c\'est normal.',
      'Conteste de nouveau par courrier recommandé, cette fois avec attestations de témoins.',
      'Attaque la qualification d\'organisateur (art. R211-27) : es-tu vraiment "organisateur" ?',
      'Respecte le délai de 45 jours pour éviter la majoration.',
    ],
    rights:    [
      'Tu peux contester l\'avis de contravention dans un délai de 45 jours.',
      'Tu peux contester la qualification, la régularité de la procédure et la proportionnalité.',
      'Tu peux produire des attestations de témoins à l\'appui.',
    ],
    pitfalls:  [
      'Abandonner après le premier refus (en ligne) : la vraie contestation se fait par courrier.',
      'Oublier les attestations de témoins dans le second envoi.',
      'Dépasser le délai de 45 jours.',
    ],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours',  type: 'template' },
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'     },
      { label: 'Guide contestation FSJS (PDF)', href: 'https://freeform.fr/wp-content/uploads/2025/03/Guide-de-contestation.pdf', type: 'external' },
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
    context:   'Aucune poursuite immédiate ne t\'est notifiée, mais "sans suite sur le moment" ne signifie pas "classement définitif" : une enquête peut se poursuivre et une convocation arriver plus tard. C\'est le bon moment pour consolider ta documentation et vérifier l\'état d\'éventuelles saisies.',
    actions:   [
      'Documente l\'intégralité de l\'épisode (date, lieu, agents, déroulé) tant que c\'est frais.',
      'Vérifie si du matériel a été saisi et engage les démarches de restitution si besoin.',
      'Conserve toute trace écrite remise (récépissé, PV).',
      'Garde le silence public sur les détails : une procédure peut encore venir.',
    ],
    rights:    [
      'L\'absence de suite immédiate ne vaut pas relaxe ; tu conserves tes droits de défense.',
      'Tu peux demander la restitution du matériel saisi non confisqué.',
    ],
    pitfalls:  [
      'Considérer l\'affaire close et détruire tes preuves.',
      'Communiquer publiquement des détails exploitables contre toi ou le collectif.',
    ],
    resources: [
      { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive', type: 'wiki' },
      { label: 'Prescription et délais',   href: '/wiki/Prescription-et-Delais',   type: 'wiki' },
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
    context:   'Le matériel a été saisi sous le régime de l\'article L211-15 CSI (saisie conservatoire, max 6 mois, en vue de confiscation). La restitution s\'obtient en établissant la propriété et en contestant la saisie devant le JLD ou le tribunal correctionnel, sur les motifs de disproportion, de propriété d\'un tiers de bonne foi ou de contestation de propriété. Le FSJS récupère le matériel dans environ 90% des dossiers suivis.',
    actions:   [
      'Récupère le PV de saisie avec la liste des matériels et numéros de série.',
      'Rassemble toutes les preuves de propriété : factures, photos, carte grise.',
      'Contacte le FSJS (contact@fsjs.fr) : avocate spécialisée dans les saisies de sound systems.',
      'Engage une demande de restitution devant le JLD ou le tribunal, dans les jours qui suivent.',
    ],
    rights:    [
      'La saisie est conservatoire (max 6 mois) ; la confiscation exige un jugement.',
      'Un tiers de bonne foi propriétaire peut obtenir la restitution.',
      'Une saisie disproportionnée peut être contestée.',
      'Tu as droit à la liste détaillée des biens saisis.',
    ],
    pitfalls:  [
      'Tarder : le délai de contestation de saisie est court.',
      'Ne pas pouvoir prouver la propriété (factures saisies avec le matériel).',
    ],
    resources: [
      { label: 'Templates recours',  href: '/wiki/Templates-Recours', type: 'template' },
      { label: 'RIPOST',             href: '/wiki/ripost',            type: 'wiki'     },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',   type: 'contact'  },
      { label: 'FSJS (Facebook)',    href: 'https://www.facebook.com/association.fsjs/', type: 'external' },
    ],
  },

  apr_interpel_plainte: {
    id:        'apr_interpel_plainte',
    text:      'Porter plainte (violences, abus)',
    type:      'result',
    phase:     'apres',
    situation: 'interpellation',
    severity:  'orange',
    icon:      '⚖️',
    context:   'En cas de violences ou d\'abus, plusieurs voies coexistent : plainte auprès du procureur, plainte avec constitution de partie civile (qui force l\'ouverture d\'une enquête si le parquet classe), saisine du Défenseur des droits et de l\'IGPN/IGGN. La preuve médicale (certificat avec ITT) et la documentation visuelle sont déterminantes. Les délais de prescription courent : agis sans tarder.',
    actions:   [
      'Fais établir un certificat médical avec ITT décrivant précisément les lésions.',
      'Rassemble vidéos, photos, témoignages et l\'identification des agents (RIO, unité).',
      'Dépose plainte ; en cas de classement, envisage la constitution de partie civile.',
      'Saisis en parallèle le Défenseur des droits (gratuit).',
    ],
    rights:    [
      'Tu peux porter plainte et te constituer partie civile.',
      'Tu peux saisir le Défenseur des droits et l\'inspection (IGPN/IGGN).',
      'L\'usage disproportionné de la force est fautif et engage la responsabilité.',
    ],
    pitfalls:  [
      'Tarder à faire constater médicalement : la preuve s\'efface.',
      'Déposer plainte sans avoir réuni les preuves matérielles.',
      'Ignorer la voie de la partie civile en cas de classement sans suite.',
    ],
    resources: [
      { label: 'Templates recours',        href: '/wiki/Templates-Recours',        type: 'template' },
      { label: 'Documentation préemptive', href: '/wiki/Documentation-Preemptive', type: 'wiki'    },
      { label: 'Défenseur des droits (saisine)', href: 'https://www.defenseurdesdroits.fr/saisir', type: 'external' },
      { label: 'Violences policières - recours (wiki à créer)', href: '/wiki/Violences-Policieres-Recours', type: 'wiki', status: 'missing' },
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
      { label: 'Je viens de sortir de GAV',                    next: 'apr_gav_sortie'      },
      { label: 'J\'ai une convocation / je dois comparaître',   next: 'apr_gav_convocation' },
      { label: 'J\'ai été condamné, je veux faire appel',       next: 'apr_gav_appel'       },
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
    context:   'À la sortie de GAV, le dossier n\'est pas clos : le procureur décide des suites (classement, alternative aux poursuites, convocation, comparution). C\'est le moment de récupérer les procès-verbaux, de faire le point avec ton avocat sur la qualification retenue, et de préserver les preuves (propriété du matériel, état physique, irrégularités éventuelles de la procédure).',
    actions:   [
      'Demande à ton avocat copie des procès-verbaux et la qualification exacte retenue.',
      'Si tu as des blessures, fais établir un certificat médical avec ITT immédiatement.',
      'Note toute irrégularité de la GAV (délais, accès à l\'avocat, conditions) pour une éventuelle nullité.',
      'Engage les démarches de restitution du matériel saisi.',
    ],
    rights:    [
      'Tu as accès aux procès-verbaux te concernant via ton avocat.',
      'Une irrégularité de la GAV peut fonder une nullité de procédure.',
      'Tu conserves le droit au silence pour la suite.',
    ],
    pitfalls:  [
      'Croire que la sortie vaut classement.',
      'Ne pas faire constater les blessures dans les délais.',
      'Communiquer publiquement des éléments du dossier.',
    ],
    resources: [
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'    },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Prescription et délais', href: '/wiki/Prescription-et-Delais', type: 'wiki' },
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
    context:   'Une convocation (CRPC, COPJ, citation directe) ouvre la phase de jugement. Le choix de la procédure a des conséquences lourdes : la comparution sur reconnaissance préalable de culpabilité (CRPC, "plaider-coupable") implique de reconnaître les faits. Ne prends aucune décision sans avocat. La stratégie de défense se construit sur la qualification d\'organisateur, la proportionnalité et les libertés fondamentales.',
    actions:   [
      'Mandate un avocat avant l\'audience : ne te présente jamais seul à une CRPC.',
      'Rassemble tout : PV, preuves de propriété, attestations, éléments sur ton rôle réel.',
      'Construis avec l\'avocat les arguments : qualification (art. R211-27), CESDH art. 11, proportionnalité.',
      'Si une CRPC t\'est proposée, n\'accepte pas sans avoir mesuré qu\'elle implique reconnaissance de culpabilité.',
    ],
    rights:    [
      'Droit à un avocat (choisi ou commis d\'office) à l\'audience.',
      'Droit de refuser une CRPC et de demander un procès classique.',
      'Droit d\'invoquer la liberté de réunion et de soulever une QPC.',
    ],
    pitfalls:  [
      'Accepter une CRPC sans en mesurer les conséquences.',
      'Te présenter sans avocat ni préparation.',
      'Négliger la contestation de la qualification d\'organisateur.',
    ],
    resources: [
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'    },
      { label: 'Templates recours',  href: '/wiki/Templates-Recours',  type: 'template' },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Jurisprudence',      href: '/wiki/jurisprudence',      type: 'wiki'    },
    ],
  },

  apr_gav_appel: {
    id:        'apr_gav_appel',
    text:      'Faire appel d\'une condamnation',
    type:      'result',
    phase:     'apres',
    situation: 'gav',
    severity:  'red',
    icon:      '↩',
    context:   'L\'appel correctionnel doit être formé dans un délai de 10 jours à compter du jugement. L\'affaire est alors rejugée en fait et en droit, et de nouvelles pièces peuvent être produites. Attention : le parquet peut aussi faire appel et demander une peine plus lourde. Au-delà, le pourvoi en cassation (1 mois) ne porte que sur des points de droit, et une QPC peut être soulevée pour contester la loi appliquée.',
    actions:   [
      'Forme l\'appel dans les 10 jours : ce délai est impératif.',
      'Avec ton avocat, prépare des éléments nouveaux sur la qualification d\'organisateur.',
      'Attaque la proportionnalité de la peine et invoque la liberté de réunion (CESDH art. 11).',
      'Évalue l\'opportunité d\'une QPC (légalité des délits, présomption d\'innocence).',
    ],
    rights:    [
      'Appel correctionnel dans les 10 jours, affaire rejugée en fait et en droit.',
      'Pourvoi en cassation dans le mois sur les points de droit.',
      'Possibilité de soulever une QPC ou de saisir la CEDH après épuisement des recours.',
    ],
    pitfalls:  [
      'Dépasser le délai de 10 jours.',
      'Oublier que le parquet peut aggraver la peine en appel.',
      'Renoncer aux arguments de libertés fondamentales.',
    ],
    resources: [
      { label: 'Recours juridiques', href: '/wiki/recours-juridiques', type: 'wiki'    },
      { label: 'Jurisprudence',      href: '/wiki/jurisprudence',      type: 'wiki'    },
      { label: 'Contacts & Alliés',  href: '/wiki/Contacts-Allies',    type: 'contact' },
      { label: 'Saisine CEDH (echr.coe.int)', href: 'https://www.echr.coe.int', type: 'external' },
    ],
  },

};
