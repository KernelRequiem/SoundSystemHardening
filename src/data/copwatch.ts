// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  COPWATCH · Observatoire documentaire des tactiques policières             ║
// ║  Projet SoundSystemHardening                                               ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  Finalité : documenter de façon structurée, factuelle et sourcée les       ║
// ║  tactiques, méthodes et moyens observés des forces de l'ordre dans le      ║
// ║  cadre de la répression du mouvement free party et des sound systems.      ║
// ║                                                                            ║
// ║  CHARTE DOCUMENTAIRE (impérative) :                                        ║
// ║  - Chaque fiche est un RETOUR D'OBSERVATION et de documentation publique.  ║
// ║  - On décrit ce qui est observé, on source, on gradue la fiabilité.        ║
// ║  - On NE donne JAMAIS de conseil d'évitement ou de contournement d'un      ║
// ║    contrôle, ni d'instruction susceptible d'entraver l'action des FDO.     ║
// ║  - Le seul registre "actif" autorisé est DÉFENSIF et JURIDIQUE : droits    ║
// ║    applicables et voies de recours, via des renvois vers l'Outil Décision  ║
// ║    (champ `liens_decision`) et le wiki juridique (champ `liens_wiki`).     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ─── TYPES ────────────────────────────────────────────────────────────────────

// Phases du cycle d'un événement, alignées sur l'Outil Décision (decision.ts).
export type Phase = 'avant' | 'pendant' | 'apres';

// Familles de tactiques observées.
export type Categorie =
  | 'renseignement'        // veille, OSINT, renseignement territorial, infiltration
  | 'administratif'        // arrêtés préfectoraux, interdictions, réquisitions
  | 'controle-filtrage'    // points de contrôle, filtrage routier, LAPI
  | 'intervention'         // encerclement, charges, usage de la force, armes
  | 'saisie'               // saisie conservatoire du matériel, des véhicules
  | 'numerique'            // exploitation des téléphones, données, surveillance
  | 'aerien'               // hélicoptères, drones, observation aérienne
  | 'judiciaire'           // GAV, AFD, qualification d'organisateur, poursuites
  | 'mediatique';          // communication de dissuasion, cadrage médiatique

// Niveau de menace documenté (impact observé sur les personnes et le matériel).
// 1 = faible, 4 = critique. Sert à la lecture de la heatmap.
export type NiveauMenace = 1 | 2 | 3 | 4;

// Fréquence d'observation de la tactique sur la période documentée.
export type Frequence = 'isolee' | 'occasionnelle' | 'recurrente' | 'systematique';

// Tendance observée sur les 12 derniers mois.
export type Tendance = 'nouveau' | 'hausse' | 'stable' | 'baisse';

// Grille de fiabilité de la documentation, adaptée du code de l'Amirauté.
// Croise la fiabilité de la source et la solidité de l'information.
//  A = corroborée par plusieurs sources indépendantes + traces matérielles
//  B = corroborée par sources concordantes (presse + témoignages)
//  C = rapportée par une source fiable, non encore recoupée
//  D = isolée / signalement unique non confirmé
export type Fiabilite = 'A' | 'B' | 'C' | 'D';

// Un cas concret observé, rattaché si possible à un incident cartographié.
export interface CasObserve {
  date:        string;  // ISO court AAAA-MM-JJ
  lieu:        string;  // commune (département)
  resume:      string;  // une phrase factuelle
  incident_id?: string; // clé dans data/incidents.json (carte /map), si existante
  source?:     string;  // URL publique
}

// Lien croisé vers un nœud de l'Outil Décision (decision.ts).
export interface LienDecision {
  node:  string;  // id du nœud (ex: 'pdt_fouille_vehicule')
  label: string;  // libellé lisible
}

// Lien vers une page wiki.
export interface LienWiki {
  href:  string;  // ex: '/wiki/recours-juridiques'
  label: string;
}

// Source documentaire externe.
export interface Source {
  label: string;
  href:  string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE DE FICHE TACTIQUE
// ═══════════════════════════════════════════════════════════════════════════
// Chaque champ est documenté ci-dessous. Pour créer une nouvelle fiche, copier
// le bloc `FICHE_TEMPLATE` plus bas et renseigner chaque champ. Les champs
// marqués (obligatoire) ne doivent jamais rester vides.
export interface FicheTactique {
  // ── Identité ──────────────────────────────────────────────────────────────
  id:        string;        // (obligatoire) slug stable, ex: 'controle-filtrage-routier'
  code:      string;        // (obligatoire) référence CopWatch, ex: 'CW-CTRL-01'
  nom:       string;        // (obligatoire) intitulé de la tactique
  categorie: Categorie;     // (obligatoire)
  phases:    Phase[];       // (obligatoire) phase(s) du cycle où elle est observée

  // ── Évaluation ──────────────────────────────────────────────────────────────
  niveau_menace: NiveauMenace; // (obligatoire) impact observé
  frequence:     Frequence;    // (obligatoire)
  tendance:      Tendance;     // (obligatoire)
  fiabilite:     Fiabilite;    // (obligatoire) grade de la documentation

  // ── Description documentaire (registre factuel, neutre) ─────────────────────
  resume:           string;   // (obligatoire) synthèse en une phrase
  description:      string;   // (obligatoire) ce qui est observé, sans jugement
  objectif_observe: string;   // (obligatoire) objectif opérationnel apparent
  indicateurs:      string[]; // signes observables servant à documenter/identifier
                              // la tactique (registre descriptif, PAS d'évitement)

  // ── Moyens et acteurs observés ──────────────────────────────────────────────
  unites:   string[];  // unités/services typiquement impliqués
  moyens:   string[];  // matériels et moyens observés

  // ── Ancrage juridique ───────────────────────────────────────────────────────
  cadre_invoque:    string[]; // fondements juridiques généralement invoqués par les FDO
  points_fragiles:  string[]; // points de fragilité juridique documentés (registre
                              // défensif : ce que la défense conteste habituellement)

  // ── Réponse défensive (renvois, jamais d'évitement) ─────────────────────────
  liens_decision: LienDecision[]; // nœuds de l'Outil Décision applicables
  liens_wiki:     LienWiki[];     // pages wiki de référence

  // ── Preuves et veille ───────────────────────────────────────────────────────
  cas_observes:        CasObserve[]; // cas concrets, rattachés à la carte si possible
  sources:             Source[];     // sources publiques
  derniere_observation: string;      // date ISO de la dernière occurrence documentée
  note_documentation?: string;       // réserves, limites, points à recouper
}

// ─── CONSTANTES D'AFFICHAGE ────────────────────────────────────────────────────

export const PHASE_LABELS: Record<Phase, string> = {
  avant:   'Avant',
  pendant: 'Pendant',
  apres:   'Après',
};

export const CATEGORIE_LABELS: Record<Categorie, string> = {
  renseignement:     'Renseignement & veille',
  administratif:     'Administratif & préfectoral',
  'controle-filtrage':'Contrôle & filtrage',
  intervention:      'Intervention & force',
  saisie:            'Saisie de matériel',
  numerique:         'Numérique & données',
  aerien:            'Surveillance aérienne',
  judiciaire:        'Judiciaire & sanctions',
  mediatique:        'Médiatique & dissuasion',
};

export const CATEGORIE_ICONS: Record<Categorie, string> = {
  renseignement:     '◎',
  administratif:     '§',
  'controle-filtrage':'⊟',
  intervention:      '✸',
  saisie:            '⊠',
  numerique:         '⌥',
  aerien:            '✣',
  judiciaire:        '⚖',
  mediatique:        '◈',
};

// Échelle de menace : libellé + couleur (du vert calme au rouge critique).
export const MENACE_META: Record<NiveauMenace, { label: string; color: string }> = {
  1: { label: 'Faible',    color: '#00ff9f' },
  2: { label: 'Modéré',    color: '#ffd400' },
  3: { label: 'Élevé',     color: '#ff8a00' },
  4: { label: 'Critique',  color: '#ff2e4d' },
};

export const FREQUENCE_LABELS: Record<Frequence, string> = {
  isolee:        'Isolée',
  occasionnelle: 'Occasionnelle',
  recurrente:    'Récurrente',
  systematique:  'Systématique',
};

export const TENDANCE_META: Record<Tendance, { label: string; symbol: string }> = {
  nouveau: { label: 'Nouveau',     symbol: '◆' },
  hausse:  { label: 'En hausse',   symbol: '▲' },
  stable:  { label: 'Stable',      symbol: '▬' },
  baisse:  { label: 'En baisse',   symbol: '▼' },
};

export const FIABILITE_LABELS: Record<Fiabilite, string> = {
  A: 'A · Corroborée (multi-sources + traces)',
  B: 'B · Corroborée (sources concordantes)',
  C: 'C · Rapportée (source fiable, non recoupée)',
  D: 'D · Isolée (signalement unique)',
};

// ═══════════════════════════════════════════════════════════════════════════
// FICHES TACTIQUES
// ═══════════════════════════════════════════════════════════════════════════

export const fiches: FicheTactique[] = [

  // ── CW-INT-01 ───────────────────────────────────────────────────────────────
  {
    id:        'veille-renseignement-territorial',
    code:      'CW-INT-01',
    nom:       'Veille en source ouverte et renseignement territorial',
    categorie: 'renseignement',
    phases:    ['avant'],
    niveau_menace: 2,
    frequence:     'systematique',
    tendance:      'hausse',
    fiabilite:     'B',
    resume:    'Surveillance des canaux de diffusion (réseaux sociaux, messageries publiques) en amont des rassemblements pour anticiper lieu, date et affluence.',
    description: 'En phase préparatoire, le Service central du renseignement territorial (SCRT) et ses échelons départementaux documentent l\'activité des collectifs via la veille en source ouverte : pages publiques, groupes ouverts, comptes de diffusion, annonces relayées par la presse locale. L\'objectif observé est d\'estimer l\'affluence attendue et la localisation probable afin de dimensionner un dispositif ou de préparer un arrêté d\'interdiction.',
    objectif_observe: 'Anticiper la tenue d\'un rassemblement pour permettre un arrêté préfectoral préventif ou un pré-positionnement des effectifs.',
    indicateurs: [
      'Couverture de presse locale "anticipée" évoquant un rassemblement avant qu\'il ait lieu.',
      'Arrêté préfectoral publié peu avant un week-end ciblé, parfois sans événement annoncé publiquement.',
      'Communications préfectorales mentionnant une affluence chiffrée estimée en amont.',
    ],
    unites: ['Renseignement territorial (SCRT/DDSP)', 'Gendarmerie (cellules de renseignement)'],
    moyens: ['Veille en source ouverte (OSINT)', 'Notes de situation', 'Liaison préfecture'],
    cadre_invoque: [
      'Mission générale de renseignement (Code de la sécurité intérieure, livre VIII).',
      'Police administrative préventive du préfet (art. L211-7 CSI pour l\'interdiction qui en découle).',
    ],
    points_fragiles: [
      'La veille en source ouverte est légale, mais l\'arrêté d\'interdiction qui en résulte doit être motivé par des faits précis et reste contestable (voir CW-ADM-01).',
      'Une estimation d\'affluence non étayée ne suffit pas à fonder une interdiction proportionnée.',
    ],
    liens_decision: [
      { node: 'avant_interpel_role_actif', label: 'Préparer une interpellation (rôle actif)' },
    ],
    liens_wiki: [
      { href: '/wiki/surveillance-mobile', label: 'Surveillance mobile' },
      { href: '/wiki/Sécurite-Numerique', label: 'Sécurité numérique' },
      { href: '/wiki/Repression', label: 'Répression (vue d\'ensemble)' },
    ],
    cas_observes: [
      { date: '2025-07-18', lieu: 'Mende (48)', resume: 'Estimation publique de 12 000 personnes attendues, verrouillage routier préparé en amont.', incident_id: 'mende-lozere-2025' },
      { date: '2025-05-08', lieu: 'Montvalent (46)', resume: 'Affluence anticipée à 9 000 personnes, dispositif préfectoral préparé puis non maintenu.', incident_id: 'montvalent-2025' },
    ],
    sources: [
      { label: 'CopWatch · Répression (wiki)', href: '/wiki/Repression' },
    ],
    derniere_observation: '2026-06-05',
    note_documentation: 'La part exacte du renseignement humain face à la seule veille en source ouverte n\'est pas documentable publiquement. Fiche limitée aux éléments observables (effets : arrêtés, pré-positionnements).',
  },

  // ── CW-ADM-01 ───────────────────────────────────────────────────────────────
  {
    id:        'arrete-prefectoral-interdiction',
    code:      'CW-ADM-01',
    nom:       'Arrêté préfectoral d\'interdiction et de restriction de circulation',
    categorie: 'administratif',
    phases:    ['avant', 'pendant'],
    niveau_menace: 3,
    frequence:     'systematique',
    tendance:      'hausse',
    fiabilite:     'A',
    resume:    'Interdiction préfectorale des rassemblements festifs sur tout ou partie d\'un département, souvent assortie d\'une interdiction de transport de matériel de sonorisation.',
    description: 'Le préfet prend un arrêté interdisant, pour une période et un périmètre donnés, les rassemblements festifs non déclarés, et fréquemment le transport ou la détention de matériel de sonorisation sur les axes concernés. Ces arrêtés, devenus quasi systématiques sur les week-ends prolongés, servent de base juridique aux contrôles et aux saisies en aval. Ils sont présumés légaux tant qu\'ils ne sont pas suspendus par le juge administratif.',
    objectif_observe: 'Créer la base légale d\'un dispositif de filtrage et de saisie, et dissuader la tenue de l\'événement.',
    indicateurs: [
      'Publication au recueil des actes administratifs de la préfecture quelques jours avant un week-end ciblé.',
      'Périmètre large (département entier) et durée étendue (plusieurs jours).',
      'Mention explicite de l\'interdiction de transport de matériel de sonorisation.',
    ],
    unites: ['Préfecture', 'Sous-préfecture', 'DDSP / Groupement de gendarmerie départemental'],
    moyens: ['Arrêté de police administrative', 'Recueil des actes administratifs'],
    cadre_invoque: [
      'Art. L211-7 CSI (interdiction d\'un rassemblement de nature à troubler gravement l\'ordre public).',
      'Pouvoir de police générale du préfet (sécurité, salubrité, tranquillité publiques).',
    ],
    points_fragiles: [
      'Défaut de motivation concrète : une formule générale sur le "risque de trouble" sans faits précis est un motif d\'illégalité.',
      'Champ trop large : l\'interdiction ne peut viser que les rassemblements non déclarés ou interdits, pas toute activité festive.',
      'Disproportion de durée ou d\'étendue géographique au regard du risque allégué.',
      'Contestable en référé-liberté (48h, art. L521-2 CJA) et en recours pour excès de pouvoir (2 mois).',
    ],
    liens_decision: [
      { node: 'pdt_controle_arrete', label: 'Arrêté préfectoral opposé sur place' },
      { node: 'apr_arrete_prefectoral', label: 'Contester un arrêté préfectoral' },
    ],
    liens_wiki: [
      { href: '/wiki/recours-juridiques', label: 'Recours juridiques (voie administrative)' },
      { href: '/wiki/arsenal-legislatif', label: 'Arsenal législatif' },
      { href: '/wiki/jurisprudence', label: 'Jurisprudence' },
    ],
    cas_observes: [
      { date: '2025-11-07', lieu: 'Saint-Pierre-de-Chandieu (69)', resume: '1 300 amendes dressées en 4 jours sur le fondement d\'un arrêté d\'interdiction.', incident_id: 'st-pierre-chandieu-2025' },
      { date: '2025-10-03', lieu: 'Aspres-sur-Buëch (05)', resume: 'Préfet présent sur place à 2h30, application d\'un arrêté d\'interdiction.', incident_id: 'aspres-sur-buech-2025' },
      { date: '2025-07-18', lieu: 'Mende (48)', resume: 'Verrouillage routier départemental adossé à un arrêté préfectoral.', incident_id: 'mende-lozere-2025' },
    ],
    sources: [
      { label: 'Green Law Avocat · interdictions préfectorales (Montpellier 2025)', href: 'https://www.green-law-avocat.fr/presomption-de-legalite-dune-interdiction-de-rave-partie/' },
      { label: 'CopWatch · Recours juridiques (wiki)', href: '/wiki/recours-juridiques' },
    ],
    derniere_observation: '2026-06-05',
    note_documentation: 'La jurisprudence Montpellier (février 2025) confirme qu\'un arrêté bien motivé et limité résiste au référé. La contestation cible les défauts précis, pas le principe.',
  },

  // ── CW-CTRL-01 ──────────────────────────────────────────────────────────────
  {
    id:        'controle-filtrage-routier',
    code:      'CW-CTRL-01',
    nom:       'Filtrage routier et points de contrôle d\'accès',
    categorie: 'controle-filtrage',
    phases:    ['pendant'],
    niveau_menace: 3,
    frequence:     'systematique',
    tendance:      'hausse',
    fiabilite:     'A',
    resume:    'Établissement de points de contrôle sur les axes d\'accès, contrôles d\'identité et visites de véhicules sur réquisition du procureur, lecture automatisée des plaques.',
    description: 'Sur les axes menant à un site présumé, les forces de l\'ordre établissent des points de contrôle filtrants. Les contrôles d\'identité s\'appuient le plus souvent sur une réquisition écrite du procureur (art. 78-2 CPP) couvrant une zone et une période définies. Les visites de véhicules supposent l\'accord du conducteur ou une réquisition (art. 78-2-3 CPP). Des dispositifs de lecture automatisée des plaques (LAPI/ANPR) sont employés pour filtrer les flux.',
    objectif_observe: 'Empêcher l\'accès au site, identifier les personnes et repérer le matériel de sonorisation en transit.',
    indicateurs: [
      'Barrages mobiles sur les départementales convergentes, en amont du site présumé.',
      'Contrôles systématiques des utilitaires et véhicules chargés.',
      'Présence de dispositifs de lecture de plaques aux points de passage.',
    ],
    unites: ['Gendarmerie mobile', 'EGM (escadrons)', 'BAC / DDSP', 'Pelotons motorisés'],
    moyens: ['Barrages', 'Réquisitions procureur', 'Lecteurs LAPI/ANPR', 'Herses'],
    cadre_invoque: [
      'Art. 78-2 CPP (contrôle d\'identité sur réquisition du procureur).',
      'Art. 78-2-3 et 78-2-4 CPP (visite des véhicules).',
      'Arrêté préfectoral d\'interdiction en appui (voir CW-ADM-01).',
    ],
    points_fragiles: [
      'La visite d\'un véhicule hors flagrance suppose l\'accord du conducteur ou une réquisition écrite : l\'absence de l\'un et de l\'autre est irrégulière.',
      'La réquisition doit être circonscrite dans le temps et l\'espace ; un contrôle hors zone ou hors période est contestable.',
      'La rétention au-delà du nécessaire à la vérification d\'identité (4h max, art. 78-3 CPP) est irrégulière.',
    ],
    liens_decision: [
      { node: 'pdt_controle', label: 'Déroulement du contrôle d\'identité' },
      { node: 'pdt_controle_retenu', label: 'Rétention sans motif légal' },
      { node: 'pdt_fouille_vehicule', label: 'Fouille du véhicule' },
    ],
    liens_wiki: [
      { href: '/wiki/arsenal-legislatif', label: 'Arsenal législatif' },
      { href: '/wiki/recours-juridiques', label: 'Recours juridiques' },
    ],
    cas_observes: [
      { date: '2025-07-18', lieu: 'Mende (48)', resume: 'Verrouillage routier départemental, filtrage des accès pour 12 000 personnes attendues.', incident_id: 'mende-lozere-2025' },
      { date: '2025-06-20', lieu: 'Saint-Hilaire-Cusson-la-Valmitte (42)', resume: '150 gendarmes mobilisés pour 600 personnes, filtrage et tolérance zéro locale.', incident_id: 'st-hilaire-2025' },
    ],
    sources: [
      { label: 'Kohen Avocats · contrôles et saisies rave party', href: 'https://kohenavocats.com/rave-party-illegale-amende-saisie-materiel-garde-vue/' },
    ],
    derniere_observation: '2026-06-05',
  },

  // ── CW-SAI-01 ───────────────────────────────────────────────────────────────
  {
    id:        'saisie-conservatoire-sound-system',
    code:      'CW-SAI-01',
    nom:       'Saisie conservatoire du sound system et des véhicules',
    categorie: 'saisie',
    phases:    ['pendant', 'apres'],
    niveau_menace: 4,
    frequence:     'systematique',
    tendance:      'hausse',
    fiabilite:     'A',
    resume:    'Saisie du matériel de sonorisation et des véhicules dès le constat de l\'infraction, avant toute condamnation, pour une durée maximale de 6 mois en vue d\'une confiscation.',
    description: 'La saisie repose sur l\'article L211-15 CSI : le préfet, les OPJ et APJ habilités peuvent saisir le matériel utilisé dès le constat de l\'infraction, avant tout jugement, pour une durée maximale de 6 mois en vue d\'une confiscation par le tribunal. C\'est la tactique la plus fréquemment documentée (majorité des incidents cartographiés). Elle vise le coeur logistique du mouvement : enceintes, tables de mixage, générateurs, camions.',
    objectif_observe: 'Mettre fin à l\'événement par la privation de matériel et frapper durablement la capacité logistique du collectif.',
    indicateurs: [
      'Établissement d\'un procès-verbal de saisie listant le matériel et les numéros de série.',
      'Mobilisation de moyens de levage et de transport (camions, fourgons) pour évacuer le matériel.',
      'Saisie incluant les véhicules de transport, pas seulement le matériel sonore.',
    ],
    unites: ['OPJ / APJ habilités', 'Gendarmerie', 'DDSP', 'Sous l\'autorité du préfet'],
    moyens: ['Procès-verbal de saisie', 'Moyens d\'enlèvement', 'Fourrière / lieu de séquestre'],
    cadre_invoque: [
      'Art. L211-15 CSI (saisie conservatoire du matériel, max 6 mois, en vue de confiscation).',
      'Art. R211-27 CSI (confiscation possible du matériel par le tribunal).',
    ],
    points_fragiles: [
      'La saisie est conservatoire : la confiscation définitive exige une décision de justice.',
      'La propriété d\'un tiers de bonne foi (matériel prêté, association) peut faire échec à la confiscation.',
      'La disproportion entre la valeur saisie et la gravité de l\'infraction est un motif de contestation.',
      'La seule possession du véhicule ne suffit pas à qualifier d\'organisateur (Cass. Crim. 17 mars 2020).',
    ],
    liens_decision: [
      { node: 'pdt_interpel_saisie', label: 'Saisie du matériel son / véhicule' },
      { node: 'apr_interpel_saisie', label: 'Matériel saisi - recours' },
      { node: 'apr_fouille_restitution', label: 'Obtenir la restitution des objets saisis' },
      { node: 'avant_interpel_conducteur', label: 'Préparer (conducteur / propriétaire du son)' },
    ],
    liens_wiki: [
      { href: '/wiki/recours-juridiques', label: 'Recours juridiques (saisies)' },
      { href: '/wiki/Templates-Recours', label: 'Templates de recours' },
      { href: '/wiki/arsenal-legislatif', label: 'Arsenal législatif' },
    ],
    cas_observes: [
      { date: '2026-06-05', lieu: 'Claret / Ferrières-les-Verreries (34)', resume: 'Matériel saisi, deux organisateurs interpellés.', incident_id: 'claret-2026' },
      { date: '2025-10-24', lieu: 'Kergrist-Moëlou (22)', resume: 'Générateurs et enceintes saisis (site éolien).', incident_id: 'kergrist-moelou-2025' },
      { date: '2025-06-06', lieu: 'Nizas (34)', resume: 'Tables de mixage saisies sur ancien aérodrome.', incident_id: 'nizas-2025' },
    ],
    sources: [
      { label: 'FSJS · Fonds de Soutien Juridique des Sons', href: 'https://www.facebook.com/association.fsjs/' },
      { label: 'CopWatch · Recours juridiques (wiki)', href: '/wiki/recours-juridiques' },
    ],
    derniere_observation: '2026-06-05',
    note_documentation: 'Le FSJS rapporte la restitution du matériel dans environ 90 % des dossiers qu\'il suit, ce qui confirme le caractère majoritairement conservatoire (et non définitif) des saisies documentées.',
  },

  // ── CW-INTERV-01 ────────────────────────────────────────────────────────────
  {
    id:        'encerclement-usage-force',
    code:      'CW-INTERV-01',
    nom:       'Encerclement, nasse et usage de la force',
    categorie: 'intervention',
    phases:    ['pendant'],
    niveau_menace: 4,
    frequence:     'recurrente',
    tendance:      'hausse',
    fiabilite:     'A',
    resume:    'Encerclement du site, confinement des participants et recours à la force (gaz lacrymogène, lanceurs de balles de défense) lors d\'opérations de dispersion.',
    description: 'Certaines opérations documentées prennent la forme d\'un encerclement complet du site, suivi d\'un confinement (nasse) des participants et d\'un recours à la force pour disperser ou évacuer : gaz lacrymogène, lanceurs de balles de défense (LBD), parfois tirs en direction de véhicules. Plusieurs cas ont entraîné des blessures graves. L\'usage de la force doit rester absolument nécessaire et strictement proportionné (art. R434-18 CSI).',
    objectif_observe: 'Disperser ou évacuer par la contrainte, et interrompre l\'événement.',
    indicateurs: [
      'Positionnement en cordon sur tous les accès, fermeture des voies de sortie.',
      'Emploi de lacrymogène et de LBD documenté par des images et des certificats médicaux.',
      'Bilans de blessés rapportés par la presse et les associations.',
    ],
    unites: ['Gendarmerie mobile / EGM', 'CRS', 'BAC'],
    moyens: ['Lacrymogène', 'LBD', 'Cordon / nasse', 'Sommations'],
    cadre_invoque: [
      'Maintien de l\'ordre et dispersion (cadre de la police administrative et judiciaire).',
      'Art. R434-18 CSI (usage de la force : nécessité et proportionnalité).',
    ],
    points_fragiles: [
      'L\'usage de la force doit être nécessaire et proportionné ; à défaut il est fautif et engage la responsabilité de l\'État.',
      'Toute blessure doit être documentée (certificat avec ITT) pour fonder plainte, saisine de l\'IGGN/IGPN ou du Défenseur des droits.',
      'La nasse fait l\'objet d\'un encadrement jurisprudentiel strict (conditions de proportionnalité et d\'information).',
    ],
    liens_decision: [
      { node: 'pdt_interpel_violences', label: 'Blessure / usage de la force' },
      { node: 'apr_interpel_plainte', label: 'Porter plainte (violences, abus)' },
      { node: 'pdt_interpel_observateur', label: 'Témoin / observateur / presse' },
    ],
    liens_wiki: [
      { href: '/wiki/Documentation-Preemptive', label: 'Documentation préemptive' },
      { href: '/wiki/Carhaix-Pourquoi-Intervention', label: 'Étude de cas : Carhaix 2025' },
      { href: '/wiki/Redon-Messe-Techno', label: 'Étude de cas : Redon 2021' },
    ],
    cas_observes: [
      { date: '2025-12-06', lieu: 'Carhaix (29)', resume: 'Encerclement total, tirs documentés sur des véhicules.', incident_id: 'carhaix-2025' },
      { date: '2026-05-22', lieu: 'Elven (56)', resume: 'Charges et tirs de LBD, dizaines de blessés rapportés.', incident_id: 'elven-2026' },
      { date: '2026-05-16', lieu: 'Ploërmel / Monteneuf (56)', resume: 'Heurts lors de l\'intervention, blessés des deux côtés.', incident_id: 'ploermel-monteneuf-2026' },
    ],
    sources: [
      { label: 'Amnesty International · maintien de l\'ordre', href: 'https://www.amnesty.fr' },
      { label: 'CopWatch · Incidents répressifs (wiki)', href: '/wiki/Incidents-répressifs' },
    ],
    derniere_observation: '2026-05-22',
    note_documentation: 'Les bilans de blessés varient selon les sources (presse, préfecture, collectifs). Les cas retenus sont ceux corroborés par au moins deux sources et/ou des certificats médicaux rapportés.',
  },

  // ── CW-NUM-01 ───────────────────────────────────────────────────────────────
  {
    id:        'exploitation-telephones-donnees',
    code:      'CW-NUM-01',
    nom:       'Saisie et exploitation des téléphones et des données',
    categorie: 'numerique',
    phases:    ['pendant', 'apres'],
    niveau_menace: 3,
    frequence:     'recurrente',
    tendance:      'hausse',
    fiabilite:     'B',
    resume:    'Saisie des téléphones, demande des codes de déverrouillage et exploitation des données en procédure pour documenter les rôles et les liens d\'organisation.',
    description: 'En procédure (interpellation, garde à vue), les téléphones sont saisis et leur contenu exploité pour reconstituer les rôles et les chaînes d\'organisation. La demande du code de déverrouillage s\'appuie sur l\'article 434-15-2 du Code pénal, dont la jurisprudence (Cass. Crim. 2022-2023) a admis qu\'il puisse couvrir le code d\'un téléphone susceptible d\'avoir servi à préparer une infraction. Hors procédure, lors d\'un simple contrôle, l\'exploitation des données n\'a pas de base légale autonome.',
    objectif_observe: 'Établir la qualification d\'organisateur et cartographier les liens entre participants à partir des données.',
    indicateurs: [
      'Saisie systématique des téléphones lors des interpellations.',
      'Demande explicite du code PIN ou tentative de déverrouillage biométrique.',
      'Mentions des échanges de messagerie dans les procès-verbaux d\'audition.',
    ],
    unites: ['OPJ', 'Police judiciaire', 'Services d\'investigation numérique'],
    moyens: ['Saisie d\'appareils', 'Outils d\'extraction', 'Réquisitions opérateurs'],
    cadre_invoque: [
      'Art. 434-15-2 CP (refus de remettre une convention de déchiffrement).',
      'Régime des perquisitions / saisies pour l\'exploitation du contenu.',
    ],
    points_fragiles: [
      'Hors procédure, lors d\'un simple contrôle, rien n\'oblige à déverrouiller un appareil.',
      'Le déverrouillage biométrique forcé et la remise d\'un code ne relèvent pas du même régime juridique.',
      'L\'arbitrage sur la remise du code dépend du profil et des faits : il relève du conseil d\'un avocat.',
    ],
    liens_decision: [
      { node: 'pdt_fouille_telephone', label: 'Consultation du téléphone sur place' },
      { node: 'pdt_gav_telephone', label: 'Pression sur le téléphone / code PIN' },
    ],
    liens_wiki: [
      { href: '/wiki/Sécurite-Numerique', label: 'Sécurité numérique' },
      { href: '/wiki/surveillance-mobile', label: 'Surveillance mobile' },
      { href: '/wiki/messagerie-chiffree', label: 'Messagerie chiffrée' },
    ],
    cas_observes: [
      { date: '2026-04-21', lieu: 'Vendée (85)', resume: 'Interpellation d\'un organisateur présumé (HexDex), volet numérique en procédure.', incident_id: 'vendee-gav-avril-2026' },
    ],
    sources: [
      { label: 'Légifrance · art. 434-15-2 CP', href: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043409816' },
    ],
    derniere_observation: '2026-04-21',
    note_documentation: 'Le détail des outils d\'extraction employés n\'est pas documentable publiquement. Fiche limitée aux éléments procéduraux observables (saisies, mentions au PV, demandes de code).',
  },

  // ── CW-AER-01 ───────────────────────────────────────────────────────────────
  {
    id:        'surveillance-aerienne',
    code:      'CW-AER-01',
    nom:       'Surveillance aérienne (hélicoptères, drones)',
    categorie: 'aerien',
    phases:    ['pendant'],
    niveau_menace: 2,
    frequence:     'occasionnelle',
    tendance:      'hausse',
    fiabilite:     'B',
    resume:    'Emploi de moyens aériens (hélicoptères, et de plus en plus drones) pour l\'observation des sites, l\'estimation de l\'affluence et la coordination des dispositifs au sol.',
    description: 'Sur les rassemblements de grande ampleur, des moyens aériens sont employés pour observer le site, estimer l\'affluence et coordonner les unités au sol. L\'hélicoptère est documenté de longue date ; l\'usage de drones de surveillance est en progression, dans un cadre juridique encadré (autorisation préfectorale, finalités limitées, contrôle de la CNIL).',
    objectif_observe: 'Obtenir une vue d\'ensemble du site, estimer l\'affluence et guider les dispositifs au sol.',
    indicateurs: [
      'Survols répétés d\'un hélicoptère au-dessus d\'un site.',
      'Présence de drones de surveillance signalée par les participants ou la presse.',
      'Mentions de moyens aériens dans les bilans préfectoraux.',
    ],
    unites: ['Forces aériennes de la gendarmerie', 'Sections aériennes', 'Cellules drones'],
    moyens: ['Hélicoptères', 'Drones de surveillance', 'Optiques / caméras'],
    cadre_invoque: [
      'Cadre d\'emploi des aéronefs de l\'État.',
      'Cadre légal de la captation par drones (autorisation préfectorale, finalités encadrées).',
    ],
    points_fragiles: [
      'La captation d\'images par drone est strictement encadrée (finalités, durée, information) et a déjà fait l\'objet de censures (Conseil d\'État, CNIL) en cas de dépassement.',
      'Le détournement de finalité ou l\'absence d\'autorisation est contestable.',
    ],
    liens_decision: [
      { node: 'pdt_interpel_observateur', label: 'Témoin / observateur / presse' },
    ],
    liens_wiki: [
      { href: '/wiki/surveillance-mobile', label: 'Surveillance mobile' },
      { href: '/wiki/Repression', label: 'Répression (vue d\'ensemble)' },
    ],
    cas_observes: [
      { date: '2025-07-18', lieu: 'Mende (48)', resume: 'Moyens aériens documentés dans un dispositif de grande ampleur.', incident_id: 'mende-lozere-2025' },
    ],
    sources: [
      { label: 'CNIL · encadrement des drones', href: 'https://www.cnil.fr' },
    ],
    derniere_observation: '2026-05-22',
    note_documentation: 'Les incidents cartographiés recensent à ce jour peu de cas de drones explicitement confirmés (champ "drones" = 0 dans les données), contre plusieurs cas d\'hélicoptères. Tendance "hausse" fondée sur l\'évolution du cadre légal et des signalements, à recouper.',
  },

  // ── CW-JUD-01 ───────────────────────────────────────────────────────────────
  {
    id:        'qualification-organisateur-afd',
    code:      'CW-JUD-01',
    nom:       'Qualification large d\'organisateur et amendes forfaitaires',
    categorie: 'judiciaire',
    phases:    ['apres'],
    niveau_menace: 3,
    frequence:     'systematique',
    tendance:      'hausse',
    fiabilite:     'A',
    resume:    'Recours massif aux amendes (contravention de 5e classe, amendes forfaitaires) et tendance à retenir une qualification large d\'organisateur pour étendre les sanctions.',
    description: 'En aval des opérations, la réponse judiciaire combine des amendes en nombre (contravention de 5e classe jusqu\'à 1 500 euros pour organisation sans déclaration, art. R211-27 CSI) et, lorsque les textes en navette parlementaire l\'introduisent, des amendes forfaitaires délictuelles. La tendance documentée est d\'étendre la notion d\'organisateur au-delà du seul décideur, ce que la PPL 1133 consacrerait avec la formule "contribution directe ou indirecte".',
    objectif_observe: 'Maximiser le nombre de personnes sanctionnées et alourdir la réponse pénale par une qualification extensive.',
    indicateurs: [
      'Distribution d\'amendes en grand nombre sur un même événement (centaines, voire plus d\'un millier).',
      'Qualification d\'organisateur retenue contre des personnes au rôle périphérique.',
      'Référence, sur les avis, à des textes récents dont l\'entrée en vigueur doit être vérifiée.',
    ],
    unites: ['Parquet', 'OPJ', 'Officier du ministère public'],
    moyens: ['Avis de contravention', 'Amende forfaitaire délictuelle', 'Procès-verbaux'],
    cadre_invoque: [
      'Art. R211-27 CSI (contravention de 5e classe, organisation sans déclaration).',
      'PPL 1133 et RIPOST (textes adoptés mais en navette parlementaire, non promulgués à ce jour).',
    ],
    points_fragiles: [
      'Nul ne peut être puni en vertu d\'un texte non entré en vigueur à la date des faits (légalité, art. 112-1 CP) : vérifier la base légale de chaque avis.',
      'La qualification d\'organisateur exige, en droit en vigueur, un rôle décisionnel réel.',
      'L\'avis de contravention se conteste (délai en principe de 45 jours) ; l\'AFD se conteste par requête en exonération.',
      'La définition "contribution indirecte" est fragile au regard du principe de légalité (fondement d\'une QPC).',
    ],
    liens_decision: [
      { node: 'apr_afd_terrain', label: 'AFD présentée sur le terrain' },
      { node: 'apr_contravention', label: 'Contravention de 5e classe' },
      { node: 'apr_gav_convocation', label: 'Convocation / comparution' },
      { node: 'avant_interpel_role_actif', label: 'Préparer (rôle actif sur l\'événement)' },
    ],
    liens_wiki: [
      { href: '/wiki/Definition-Ambigue-Organisateur', label: 'Définition ambiguë d\'organisateur' },
      { href: '/wiki/Contestation', label: 'Contester les amendes' },
      { href: '/wiki/arsenal-legislatif', label: 'Arsenal législatif' },
    ],
    cas_observes: [
      { date: '2025-11-07', lieu: 'Saint-Pierre-de-Chandieu (69)', resume: '1 300 amendes dressées en 4 jours.', incident_id: 'st-pierre-chandieu-2025' },
      { date: '2025-11-01', lieu: 'Grandchamp-des-Fontaines (44)', resume: 'Amendes dressées et matériel saisi.', incident_id: 'grandchamp-des-fontaines-2025' },
    ],
    sources: [
      { label: 'Guide de contestation FSJS (PDF)', href: 'https://freeform.fr/wp-content/uploads/2025/03/Guide-de-contestation.pdf' },
      { label: 'CopWatch · Arsenal législatif (wiki)', href: '/wiki/arsenal-legislatif' },
    ],
    derniere_observation: '2026-06-05',
    note_documentation: 'La part des amendes effectivement contestées et annulées n\'est pas connue précisément. Point à recouper avec le FSJS et les collectifs.',
  },

  // ── CW-MED-01 ───────────────────────────────────────────────────────────────
  {
    id:        'dissuasion-mediatique-prefectorale',
    code:      'CW-MED-01',
    nom:       'Communication de dissuasion et cadrage médiatique',
    categorie: 'mediatique',
    phases:    ['avant', 'apres'],
    niveau_menace: 1,
    frequence:     'recurrente',
    tendance:      'stable',
    fiabilite:     'B',
    resume:    'Communiqués préfectoraux et relais de presse mettant en avant les sanctions encourues et les bilans d\'opérations, dans une logique de dissuasion.',
    description: 'En amont et en aval des opérations, la préfecture communique sur les sanctions encourues, les moyens déployés et les bilans (amendes, saisies, interpellations). Ce cadrage médiatique vise à dissuader la participation et à valoriser l\'action publique. Il s\'appuie souvent sur une mise en avant des risques (stupéfiants, troubles) et sur des bilans chiffrés repris par la presse locale.',
    objectif_observe: 'Dissuader la participation et légitimer le dispositif répressif auprès de l\'opinion.',
    indicateurs: [
      'Communiqués préfectoraux rappelant les peines encourues avant un week-end ciblé.',
      'Bilans d\'opérations chiffrés (amendes, saisies) diffusés à la presse.',
      'Reprise quasi à l\'identique du communiqué dans plusieurs titres locaux.',
    ],
    unites: ['Préfecture (service communication)', 'Ministère de l\'Intérieur'],
    moyens: ['Communiqués de presse', 'Points presse', 'Relais réseaux sociaux institutionnels'],
    cadre_invoque: [
      'Communication institutionnelle (pas de fondement coercitif propre).',
    ],
    points_fragiles: [
      'La communication n\'a pas d\'effet juridique : les sanctions annoncées doivent reposer sur des textes effectivement en vigueur.',
      'Une couverture médiatique équilibrée et la présence de témoins ont, à l\'inverse, un effet documenté de modération des interventions.',
    ],
    liens_decision: [],
    liens_wiki: [
      { href: '/wiki/Couverture-Mediatique-Dissuasive', label: 'Couverture médiatique dissuasive' },
      { href: '/wiki/Medias-Propriete', label: 'Médias & propriété' },
      { href: '/wiki/Presence-Temoins-Neutralisante', label: 'Présence de témoins neutralisante' },
    ],
    cas_observes: [
      { date: '2025-11-07', lieu: 'Saint-Pierre-de-Chandieu (69)', resume: 'Bilan de 1 300 amendes largement médiatisé.', incident_id: 'st-pierre-chandieu-2025' },
    ],
    sources: [
      { label: 'CopWatch · Médias & propriété (wiki)', href: '/wiki/Medias-Propriete' },
    ],
    derniere_observation: '2026-05-26',
    note_documentation: 'Niveau de menace faible (1) car la tactique n\'a pas d\'effet coercitif direct, mais elle conditionne le climat des opérations. Incluse pour la complétude documentaire.',
  },

];

// ─── HELPERS ────────────────────────────────────────────────────────────────

// Ordre canonique des catégories pour l'affichage.
export const CATEGORIE_ORDER: Categorie[] = [
  'renseignement', 'administratif', 'controle-filtrage', 'aerien',
  'intervention', 'saisie', 'numerique', 'judiciaire', 'mediatique',
];

// Ordre canonique des phases.
export const PHASE_ORDER: Phase[] = ['avant', 'pendant', 'apres'];

// Cellule de la heatmap tactique × phase.
export interface HeatCell {
  phase:   Phase;
  active:  boolean;       // la tactique est-elle observée dans cette phase ?
  menace:  NiveauMenace;  // niveau de menace reporté si active, sinon 0 implicite
}

// Ligne de la heatmap : une tactique, ses trois phases.
export interface HeatRow {
  code:      string;
  nom:       string;
  categorie: Categorie;
  cells:     HeatCell[];
}

// Construit la matrice heatmap tactique × phase à partir des fiches.
// L'intensité d'une cellule = niveau de menace de la fiche si la phase est
// couverte, 0 sinon. Données dérivées automatiquement : pas de double saisie.
export function buildHeatmap(): HeatRow[] {
  return [...fiches]
    .sort((a, b) =>
      CATEGORIE_ORDER.indexOf(a.categorie) - CATEGORIE_ORDER.indexOf(b.categorie)
      || a.code.localeCompare(b.code))
    .map(f => ({
      code:      f.code,
      nom:       f.nom,
      categorie: f.categorie,
      cells: PHASE_ORDER.map(phase => ({
        phase,
        active: f.phases.includes(phase),
        menace: f.phases.includes(phase) ? f.niveau_menace : (0 as unknown as NiveauMenace),
      })),
    }));
}

// Statistiques agrégées pour les bandeaux de synthèse.
export function copwatchStats() {
  const total = fiches.length;
  const parCategorie = CATEGORIE_ORDER.map(c => ({
    categorie: c,
    count: fiches.filter(f => f.categorie === c).length,
  })).filter(x => x.count > 0);
  const critiques = fiches.filter(f => f.niveau_menace === 4).length;
  const systematiques = fiches.filter(f => f.frequence === 'systematique').length;
  const enHausse = fiches.filter(f => f.tendance === 'hausse' || f.tendance === 'nouveau').length;
  const dates = fiches.map(f => f.derniere_observation).sort();
  const derniere = dates.length ? dates[dates.length - 1] : '';
  return { total, parCategorie, critiques, systematiques, enHausse, derniere };
}

// ─── TEMPLATE VIERGE (à copier pour créer une nouvelle fiche) ────────────────
// Conserver ce modèle en bas de fichier. Il n'est pas exporté dans `fiches`.
export const FICHE_TEMPLATE: FicheTactique = {
  id:        'slug-tactique',
  code:      'CW-XXX-00',
  nom:       'Nom de la tactique',
  categorie: 'controle-filtrage',
  phases:    ['pendant'],
  niveau_menace: 2,
  frequence:     'occasionnelle',
  tendance:      'stable',
  fiabilite:     'C',
  resume:    'Synthèse en une phrase.',
  description: 'Description factuelle et neutre de ce qui est observé.',
  objectif_observe: 'Objectif opérationnel apparent.',
  indicateurs: ['Signe observable 1', 'Signe observable 2'],
  unites: ['Unité / service'],
  moyens: ['Moyen / matériel'],
  cadre_invoque: ['Fondement juridique invoqué'],
  points_fragiles: ['Point de fragilité juridique documenté (registre défensif)'],
  liens_decision: [{ node: 'root', label: 'Outil Décision' }],
  liens_wiki: [{ href: '/wiki/Repression', label: 'Répression' }],
  cas_observes: [{ date: '2026-01-01', lieu: 'Commune (00)', resume: 'Cas documenté.' }],
  sources: [{ label: 'Source publique', href: 'https://' }],
  derniere_observation: '2026-01-01',
  note_documentation: 'Réserves, limites, points à recouper.',
};
