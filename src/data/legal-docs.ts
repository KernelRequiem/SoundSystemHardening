// ─── DOCUMENTS LÉGAUX PAR SITUATION ──────────────────────────────────────────
// Un document type, templatisé et exportable, pour chaque nœud résultat de
// l'arbre de décision (src/data/decision.ts). Les variables {{champ}} sont
// remplacées par les valeurs saisies dans le formulaire (cf. decision.astro).
//
// Rien n'est conseil juridique individualisé : ces modèles sont des points de
// départ à adapter et, pour les actes contentieux, à valider avec un avocat.

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface LegalField {
  id:           string;
  label:        string;
  type?:        'text' | 'textarea' | 'date' | 'tel' | 'email';
  placeholder?: string;
  full?:        boolean; // champ pleine largeur
}

export interface LegalDoc {
  docType:    string;       // catégorie : Requête, Plainte, Fiche, Déclaration…
  title:      string;       // titre du document
  intro:      string;       // explication courte affichée au-dessus du formulaire
  recipient?: string;       // destinataire suggéré
  fields:     LegalField[]; // champs à remplir
  body:       string;       // corps avec variables {{id}}
  legalRefs?: string[];     // fondements cités
  wiki?:      { label: string; href: string }; // modèle détaillé correspondant (anti-doublon)
}

// ─── CHAMPS RÉUTILISABLES ─────────────────────────────────────────────────────

const fNom:     LegalField = { id: 'nom',        label: 'Nom et prénom',   placeholder: 'NOM Prénom' };
const fAdresse: LegalField = { id: 'adresse',    label: 'Adresse',         type: 'textarea', placeholder: 'N°, rue\nCode postal Ville', full: true };
const fTel:     LegalField = { id: 'tel',        label: 'Téléphone',       type: 'tel',   placeholder: '06 00 00 00 00' };
const fEmail:   LegalField = { id: 'email',      label: 'Email',           type: 'email', placeholder: 'moi@exemple.fr' };
const fNaiss:   LegalField = { id: 'naissance',  label: 'Né(e) le / à',    placeholder: 'JJ/MM/AAAA à Ville' };
const fDateF:   LegalField = { id: 'date_faits', label: 'Date des faits',  type: 'date' };
const fHeureF:  LegalField = { id: 'heure_faits',label: 'Heure',           placeholder: 'ex : 14h30' };
const fLieuF:   LegalField = { id: 'lieu_faits', label: 'Lieu des faits',  placeholder: 'Commune, route, lieu-dit', full: true };
const fService: LegalField = { id: 'service',    label: 'Service / unité', placeholder: 'Gendarmerie, CRS, n° RIO si connu', full: true };
const fVilleS:  LegalField = { id: 'ville_sig',  label: 'Fait à',          placeholder: 'Ville' };
const fDateS:   LegalField = { id: 'date_sig',   label: 'Le',              type: 'date' };

const SIG = [fVilleS, fDateS];
const FOOTER = `

Fait à {{ville_sig}}, le {{date_sig}}.

Signature :
{{nom}}`;

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export const LEGAL_DOCS: Record<string, LegalDoc> = {

  // ═══════════════════════════════ AVANT ════════════════════════════════════

  avant_controle_majeur: {
    docType: 'Fiche réflexe',
    title: 'Carte de droits - contrôle d\'identité',
    intro: 'Fiche à imprimer et garder sur soi. Elle rappelle la formule neutre à répéter et centralise les contacts utiles, hors du téléphone.',
    fields: [fNom, { id: 'avocat', label: 'Avocat / permanence', placeholder: 'Maître …, tél.', full: true }, { id: 'referent', label: 'Référent juridique du collectif', placeholder: 'Nom, tél.', full: true }, { id: 'proche', label: 'Proche à prévenir', placeholder: 'Nom, tél.' }],
    body: `FICHE REFLEXE - CONTROLE D'IDENTITE (majeur)
Fondement du contrôle : article 78-2 du Code de procédure pénale.

PHRASE A REPETER :
"Je vous présente mes papiers. Je n'ai rien d'autre à déclarer."

MES DROITS :
- Je prouve mon identité par tout moyen (pièce, permis, témoignage).
- Je peux demander le motif et le cadre du contrôle.
- Je n'ai aucune obligation de répondre au-delà de mon identité.
- La palpation de sécurité doit rester superficielle et justifiée.

A NE PAS FAIRE :
- Déverrouiller mon téléphone par biométrie (PIN long, biométrie coupée).
- Donner ma destination ou parler de l'événement.

CONTACTS (à compléter, hors téléphone) :
- Moi : {{nom}}
- Avocat / permanence : {{avocat}}
- Référent juridique : {{referent}}
- Proche à prévenir : {{proche}}`,
    legalRefs: ['Art. 78-2 CPP', 'Art. 78-3 CPP'],
  },

  avant_controle_mineur: {
    docType: 'Fiche réflexe',
    title: 'Fiche mineur + contacts représentant légal',
    intro: 'Fiche à garder sur soi par le mineur ou son entourage. L\'avocat est obligatoire dès la retenue d\'un mineur, sans renonciation possible.',
    fields: [{ id: 'nom', label: 'Nom et prénom du mineur', placeholder: 'NOM Prénom' }, fNaiss, { id: 'parent', label: 'Représentant légal', placeholder: 'Nom, lien, tél.', full: true }, { id: 'avocat', label: 'Avocat / permanence', placeholder: 'Maître …, tél.', full: true }],
    body: `FICHE REFLEXE - MINEUR
Fondement : art. 78-2 CPP ; Code de la justice pénale des mineurs (art. L413-6).

A SAVOIR :
- En cas de retenue ou de garde à vue, les parents sont informés sans délai.
- L'avocat est OBLIGATOIRE et ne peut faire l'objet d'aucune renonciation.
- Je ne réponds à RIEN sur les faits avant l'arrivée de l'avocat.
- Le droit au silence et l'examen médical s'appliquent aussi aux mineurs.

A NE PAS FAIRE :
- "Coopérer pour rentrer plus vite" : aucune audition sans avocat.
- Mentir sur mon âge : l'âge réel protège.

IDENTITE :
- Mineur : {{nom}}, né(e) le {{naissance}}
- Représentant légal : {{parent}}
- Avocat / permanence : {{avocat}}`,
    legalRefs: ['Art. L413-6 CJPM', 'Art. 78-2 CPP'],
  },

  avant_controle_etranger: {
    docType: 'Fiche réflexe',
    title: 'Fiche contrôle - ressortissant étranger',
    intro: 'Fiche de rappel des droits et des contacts spécialisés. Le contrôle ne peut pas reposer sur la seule apparence physique.',
    fields: [fNom, { id: 'titre', label: 'Titre / visa / récépissé', placeholder: 'Nature et n° du document', full: true }, { id: 'permanence', label: 'Permanence droit des étrangers', placeholder: 'La Cimade / GISTI, tél.', full: true }],
    body: `FICHE REFLEXE - CONTROLE (étranger)
Fondement : art. L812-1 et s. CESEDA ; retenue art. L813-1 CESEDA (24 h max).

MES DROITS :
- Le contrôle ne peut pas être fondé sur des critères physiques ou ethniques.
- En retenue pour vérification du droit au séjour : avocat, interprète, médecin,
  information d'un proche, durée limitée à 24 heures.
- Je prouve mon droit à circuler ou séjourner par mes documents.

A NE PAS FAIRE :
- Signer un document en langue non comprise sans interprète.
- Accepter une "aide au retour" ou une mesure d'éloignement sans avocat.

IDENTITE / CONTACTS :
- Moi : {{nom}}
- Document de séjour : {{titre}}
- Permanence juridique : {{permanence}}`,
    legalRefs: ['Art. L812-1 CESEDA', 'Art. L813-1 CESEDA'],
  },

  avant_fouille_vehicule: {
    docType: 'Attestation',
    title: 'Attestation de propriété du matériel son',
    intro: 'Document à conserver séparément du matériel (idéalement chez un tiers). La propriété par un tiers de bonne foi peut faire échec à la confiscation.',
    fields: [{ id: 'proprietaire', label: 'Propriétaire du matériel', placeholder: 'NOM Prénom ou raison sociale', full: true }, fAdresse, { id: 'materiel', label: 'Désignation du matériel', type: 'textarea', placeholder: 'Type, marque, modèle, n° de série, valeur estimée (une ligne par bien)', full: true }, { id: 'immat', label: 'Véhicule (immatriculation)', placeholder: 'AA-000-AA' }, ...SIG],
    body: `ATTESTATION DE PROPRIETE DE MATERIEL DE SONORISATION

Je soussigné(e) {{proprietaire}},
demeurant {{adresse}},

atteste être le propriétaire légitime du matériel de sonorisation suivant :
{{materiel}}

Ce matériel peut être transporté à bord du véhicule immatriculé {{immat}}.
La présente attestation, accompagnée des factures correspondantes, est établie
pour faire valoir mes droits, notamment en cas de saisie, et opposer ma qualité
de propriétaire de bonne foi (art. 131-21 CP ; Cass. Crim. 17 mars 2020 :
la seule possession ne caractérise pas la qualité d'organisateur).${FOOTER}`,
    legalRefs: ['Art. 78-2-3 CPP', 'Art. 131-21 CP', 'Art. L211-15 CSI'],
  },

  avant_fouille_corps: {
    docType: 'Fiche réflexe',
    title: 'Fiche palpation vs fouille à corps',
    intro: 'Rappel de la différence de régime entre la palpation de sécurité (superficielle) et la fouille à corps (assimilée à une perquisition).',
    fields: [fNom, { id: 'avocat', label: 'Avocat / permanence', placeholder: 'Maître …, tél.', full: true }],
    body: `FICHE REFLEXE - PALPATION / FOUILLE A CORPS

PALPATION DE SECURITE :
- Geste superficiel, par-dessus les vêtements, pour vérifier l'absence d'objet
  dangereux. En principe réalisée par une personne du même sexe.

FOUILLE A CORPS INTEGRALE :
- Mesure d'enquête intrusive, assimilée à une perquisition.
- Exige le cadre du flagrant délit ou une commission rogatoire.
- Doit respecter la dignité de la personne. Hors cadre : nullité possible.

PHRASE UTILE :
"S'agit-il d'une palpation ou d'une fouille à corps ? Sur quel fondement ?"

A NE PAS FAIRE :
- Vider mes poches spontanément.
- Réagir physiquement (risque de rébellion).

Moi : {{nom}}   /   Avocat : {{avocat}}`,
    legalRefs: ['Art. 78-2-2 CPP', 'Jurisp. fouille à corps = perquisition'],
  },

  avant_fouille_domicile: {
    docType: 'Mandat',
    title: 'Désignation d\'avocat + consignes perquisition',
    intro: 'Document à préparer en amont : désignation d\'un avocat joignable et consignes pour l\'entourage en cas de perquisition.',
    fields: [fNom, fAdresse, { id: 'avocat', label: 'Avocat désigné', placeholder: 'Maître …, barreau, tél.', full: true }, { id: 'proche', label: 'Proche relais', placeholder: 'Nom, tél.' }, ...SIG],
    body: `DESIGNATION D'AVOCAT ET CONSIGNES - PERQUISITION

Je soussigné(e) {{nom}}, demeurant {{adresse}},
désigne pour me défendre et m'assister :
Avocat : {{avocat}}

CONSIGNES EN CAS DE PERQUISITION :
- Demander le cadre : enquête préliminaire (art. 76 CPP), flagrance, ou
  commission rogatoire.
- En préliminaire, NE PAS donner d'accord écrit : exiger l'autorisation du JLD.
- Exiger un inventaire précis de chaque objet saisi AVANT toute signature.
- Ne communiquer aucun code d'appareil sans avis de l'avocat.
- Rappeler que les perquisitions de nuit (21h-6h) sont en principe interdites
  pour les infractions de droit commun.

Proche relais à prévenir : {{proche}}${FOOTER}`,
    legalRefs: ['Art. 56 CPP', 'Art. 76 CPP', 'Art. 59 CPP (nuit)'],
  },

  avant_interpellation: {
    docType: 'Fiche réflexe',
    title: 'Carte de poche - silence + avocat',
    intro: 'Fiche à garder sur soi. Elle fixe la ligne à tenir : droit au silence systématique et demande d\'avocat immédiate.',
    fields: [fNom, { id: 'avocat', label: 'Avocat / permanence', placeholder: 'Maître …, tél.', full: true }, { id: 'referent', label: 'Référent juridique', placeholder: 'Nom, tél.' }],
    body: `CARTE DE POCHE - INTERPELLATION

MA LIGNE :
"Je souhaite garder le silence et m'entretenir avec un avocat."

A SAVOIR :
- Le droit au silence s'applique avant même la notification de garde à vue.
- Je ne réponds qu'à mon identité.
- La simple possession d'un véhicule ou de matériel ne suffit pas à me qualifier
  d'organisateur (Cass. Crim. 17 mars 2020).
- Vouloir "expliquer mon rôle" est exactement le piège de la définition large
  d'organisateur (PPL 1133).

A NE PAS FAIRE :
- Déverrouiller mon téléphone (biométrie coupée, PIN long).
- Minimiser ("j'aidais juste un ami") : formule requalifiable.

Moi : {{nom}}  /  Avocat : {{avocat}}  /  Référent : {{referent}}`,
    legalRefs: ['Art. 63-1 CPP', 'PPL 1133', 'Cass. Crim. 17 mars 2020'],
  },

  avant_gav: {
    docType: 'Fiche réflexe',
    title: 'Fiche garde à vue - droits et logistique',
    intro: 'Fiche de préparation : formule à retenir, droits notifiés en GAV, et logistique de soutien à l\'extérieur.',
    fields: [fNom, { id: 'avocat', label: 'Avocat / permanence', placeholder: 'Maître …, tél.', full: true }, { id: 'proche', label: 'Proche à prévenir', placeholder: 'Nom, tél.' }],
    body: `FICHE REFLEXE - GARDE A VUE
Durée : 24 h, renouvelable une fois (48 h) sur autorisation du procureur.
Droits notifiés : art. 63-1 CPP.

FORMULE :
"Je souhaite garder le silence et m'entretenir avec un avocat."

MES DROITS :
- Droit absolu de me taire pendant toute la garde à vue.
- Avocat dès la première heure (choisi ou commis d'office).
- Médecin et interprète.
- Faire prévenir un proche et mon employeur.

A NE PAS FAIRE :
- Parler pendant l'audition "libre" avant l'avocat.
- Minimiser mon rôle. Signer un PV non lu intégralement.

LOGISTIQUE EXTERIEURE :
- Avocat : {{avocat}}
- Proche à prévenir : {{proche}}
- Moi : {{nom}}`,
    legalRefs: ['Art. 63 CPP', 'Art. 63-1 CPP', 'Art. 63-3-1 CPP'],
  },

  // ═══════════════════════════════ PENDANT ══════════════════════════════════

  pdt_controle_simple: {
    docType: 'Note',
    title: 'Note de contrôle (horodatage)',
    intro: 'Note à remplir mentalement puis transcrire dès que possible. Elle fige les éléments objectifs du contrôle.',
    fields: [fDateF, fHeureF, fLieuF, fService, { id: 'motif', label: 'Motif invoqué', placeholder: 'Réquisition, infraction…', full: true }, ...SIG],
    body: `NOTE DE CONTROLE D'IDENTITE
Fondement annoncé : art. 78-2 CPP.

- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}
- Motif invoqué : {{motif}}
- Déroulé : identité présentée, aucune autre déclaration.
- Question posée : "Suis-je libre de partir ?"

Cette note est établie pour mémoire et pourra servir en cas de répétition ou de
litige ultérieur.${FOOTER}`,
    legalRefs: ['Art. 78-2 CPP'],
  },

  pdt_controle_retenu: {
    docType: 'Note',
    title: 'Note de rétention sans cadre',
    intro: 'Note à figer si l\'on me retient alors que mon identité est établie et qu\'aucune infraction ne m\'est reprochée. L\'horodatage est décisif.',
    fields: [fDateF, { id: 'heure_debut', label: 'Heure de début de rétention', placeholder: 'ex : 14h30' }, { id: 'heure_fin', label: 'Heure de fin', placeholder: 'ex : 16h10' }, fLieuF, fService, ...SIG],
    body: `NOTE DE RETENTION
Fondement applicable : vérification d'identité, art. 78-3 CPP (4 h maximum).

- Date : {{date_faits}}
- Début de rétention : {{heure_debut}}    Fin : {{heure_fin}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}
- Question posée : "Suis-je libre de partir ? Sur quel fondement suis-je retenu ?"

Mon identité étant établie et aucune infraction ne m'étant reprochée, je consigne
ces éléments en vue d'une éventuelle contestation de la régularité de la mesure.${FOOTER}`,
    legalRefs: ['Art. 78-3 CPP'],
  },

  pdt_controle_sans_papier: {
    docType: 'Note',
    title: 'Note de vérification d\'identité',
    intro: 'Note à figer en cas de conduite au poste pour vérification d\'identité. La mesure est limitée à 4 heures.',
    fields: [fDateF, { id: 'heure_debut', label: 'Heure de début de vérification', placeholder: 'ex : 14h30' }, fLieuF, fService, { id: 'preuve', label: 'Identité prouvée par', placeholder: 'Autre document, témoignage…', full: true }, ...SIG],
    body: `NOTE DE VERIFICATION D'IDENTITE
Fondement : art. 78-3 CPP (durée maximale 4 heures).

- Date : {{date_faits}}    Début de la vérification : {{heure_debut}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}
- J'ai prouvé mon identité par : {{preuve}}
- J'ai demandé que le procureur de la République et un proche soient prévenus.

L'absence de pièce d'identité n'est pas une infraction. Je consigne l'heure de
début : le délai de 4 heures court à compter de celle-ci.${FOOTER}`,
    legalRefs: ['Art. 78-3 CPP', 'Art. 434-23 CP'],
  },

  pdt_fouille_vehicule: {
    docType: 'Déclaration',
    title: 'Déclaration de non-consentement (véhicule)',
    intro: 'Déclaration à exprimer et consigner si la visite du véhicule est tentée sans réquisition ni flagrance. Hors flagrant délit, elle suppose mon accord ou une réquisition écrite du procureur.',
    fields: [fNom, fDateF, fHeureF, fLieuF, fService, { id: 'immat', label: 'Véhicule (immatriculation)', placeholder: 'AA-000-AA' }, ...SIG],
    body: `DECLARATION DE NON-CONSENTEMENT A LA VISITE DU VEHICULE
Fondement : art. 78-2-3 et 78-2-4 CPP.

Je soussigné(e) {{nom}}, conducteur du véhicule immatriculé {{immat}},

déclare ne PAS consentir à la visite de mon véhicule en l'absence de flagrant
délit et de réquisition écrite du procureur de la République.

Je demande à voir la réquisition (lieu, période, infractions visées) et à
assister à la visite. En cas de saisie, j'exige un procès-verbal listant chaque
matériel avec son numéro de série.

- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}${FOOTER}`,
    legalRefs: ['Art. 78-2-3 CPP', 'Art. 78-2-4 CPP', 'Art. L211-15 CSI'],
  },

  pdt_fouille_corporelle: {
    docType: 'Déclaration',
    title: 'Déclaration relative à une fouille à corps',
    intro: 'Déclaration à exprimer et consigner si une fouille intégrale est tentée hors cadre. La fouille à corps est assimilée à une perquisition.',
    fields: [fNom, fDateF, fHeureF, fLieuF, fService, ...SIG],
    body: `DECLARATION - FOUILLE A CORPS
Fondement : la fouille à corps intégrale est assimilée à une perquisition et
exige le cadre du flagrant délit ou une commission rogatoire.

Je soussigné(e) {{nom}} déclare :
- ne pas consentir à une fouille à corps intégrale ;
- demander que la palpation de sécurité reste superficielle, soit réalisée par
  une personne du même sexe et hors de la vue du public ;
- demander que le fondement et le déroulé de la mesure soient consignés au PV.

Je ne m'oppose pas physiquement mais je signale clairement l'absence de mon
consentement à toute mesure intrusive.

- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}${FOOTER}`,
    legalRefs: ['Art. 78-2-2 CPP', 'Jurisp. fouille à corps = perquisition'],
  },

  pdt_fouille_affaires: {
    docType: 'Déclaration',
    title: 'Déclaration de non-consentement (affaires)',
    intro: 'Déclaration à exprimer si la fouille du sac ou des affaires est tentée sans cadre. Même régime que la visite de véhicule.',
    fields: [fNom, fDateF, fHeureF, fLieuF, fService, ...SIG],
    body: `DECLARATION DE NON-CONSENTEMENT A LA FOUILLE DES AFFAIRES
Fondement : hors flagrant délit, la fouille des bagages suppose mon accord ou
une réquisition (régime aligné sur l'art. 78-2-3 CPP).

Je soussigné(e) {{nom}} déclare ne PAS consentir à la fouille de mon sac, de mes
bagages ou de mes affaires personnelles, en l'absence de flagrance ou de
réquisition. Je n'ai pas à vider mes poches de moi-même.

Je demande le fondement invoqué et qu'il soit consigné.

- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}${FOOTER}`,
    legalRefs: ['Art. 78-2-3 CPP'],
  },

  pdt_fouille_perquisition: {
    docType: 'Mention manuscrite',
    title: 'Mention de refus + observations (perquisition)',
    intro: 'Mention à porter de ma main sur le procès-verbal en cas de perquisition en enquête préliminaire. Mon accord écrit n\'est pas obligatoire.',
    fields: [fNom, fAdresse, fDateF, fHeureF, fService, ...SIG],
    body: `MENTION A PORTER AU PROCES-VERBAL DE PERQUISITION
Fondement : art. 76 CPP (enquête préliminaire).

A recopier de ma main sur le PV, à la rubrique des observations :

"Je soussigné(e) {{nom}}, demeurant {{adresse}}, ne donne pas mon accord écrit à
la perquisition et demande qu'il soit fait application des dispositions exigeant
l'autorisation du juge des libertés et de la détention. Je demande qu'un
inventaire précis de chaque objet saisi soit dressé. Je n'ai communiqué aucun
code d'appareil. Je me réserve de soulever toute irrégularité."

- Date : {{date_faits}}    Heure : {{heure_faits}}
- Service / unité : {{service}}${FOOTER}`,
    legalRefs: ['Art. 76 CPP', 'Art. 56 CPP', 'Art. 57 CPP'],
  },

  pdt_interpel_pre_gav: {
    docType: 'Déclaration',
    title: 'Déclaration d\'exercice du droit au silence',
    intro: 'Déclaration à exprimer dès l\'interpellation, avant même la notification de la garde à vue. Le droit au silence s\'applique immédiatement.',
    fields: [fNom, fDateF, { id: 'heure_interp', label: 'Heure de l\'interpellation', placeholder: 'ex : 14h30' }, fLieuF, fService, ...SIG],
    body: `DECLARATION D'EXERCICE DU DROIT AU SILENCE

Je soussigné(e) {{nom}} déclare :
"Je souhaite garder le silence et m'entretenir avec un avocat avant toute
audition. Je ne réponds qu'à mon identité."

- Date : {{date_faits}}
- Heure de l'interpellation (début de la privation de liberté) : {{heure_interp}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}

Le droit au silence s'applique avant même la notification formelle de garde à
vue. Je n'ai pas à justifier mon rôle dans une quelconque organisation.${FOOTER}`,
    legalRefs: ['Art. 63-1 CPP', 'Art. préliminaire CPP'],
  },

  pdt_interpel_saisie: {
    docType: 'Demande',
    title: 'Demande de procès-verbal de saisie détaillé',
    intro: 'Demande à formuler sur place lors de la saisie. Le PV détaillé conditionne la restitution.',
    fields: [fNom, fDateF, fHeureF, fLieuF, fService, { id: 'materiel', label: 'Matériel saisi', type: 'textarea', placeholder: 'Désignation, marque, n° de série (une ligne par bien)', full: true }, ...SIG],
    body: `DEMANDE DE PROCES-VERBAL DE SAISIE
Fondement de la saisie : art. L211-15 CSI (saisie conservatoire, max 6 mois,
en vue de confiscation).

Je soussigné(e) {{nom}} demande la remise immédiate d'un procès-verbal de saisie
listant chaque bien saisi avec sa désignation et son numéro de série :
{{materiel}}

Je rappelle :
- que la saisie est conservatoire et que la confiscation exige un jugement ;
- qu'un tiers de bonne foi propriétaire peut contester la saisie ;
- qu'une saisie disproportionnée peut être contestée.

- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}${FOOTER}`,
    legalRefs: ['Art. L211-15 CSI', 'Art. 131-21 CP', 'Cass. Crim. 17 mars 2020'],
    wiki: { label: 'Modèle détaillé : restitution de matériel saisi', href: '/wiki/Templates-Recours#template-6--demande-de-restitution-de-matériel-saisi' },
  },

  pdt_interpel_violences: {
    docType: 'Constat',
    title: 'Constat de blessures et de témoins',
    intro: 'Fiche à remplir à chaud en cas de blessure ou d\'usage de la force. Elle prépare le certificat médical et un futur recours.',
    fields: [fNom, fDateF, fHeureF, fLieuF, fService, { id: 'blessures', label: 'Blessures constatées', type: 'textarea', placeholder: 'Localisation, nature, douleur…', full: true }, { id: 'temoins', label: 'Témoins', type: 'textarea', placeholder: 'Nom, contact (une ligne par témoin)', full: true }, ...SIG],
    body: `CONSTAT DE BLESSURES / USAGE DE LA FORCE
Fondement : l'usage de la force doit être nécessaire et proportionné
(art. R434-18 CSI).

- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}

BLESSURES CONSTATEES :
{{blessures}}

TEMOINS :
{{temoins}}

DEMARCHES IMMEDIATES :
- Examen médical demandé (droit en GAV) en vue d'un certificat avec ITT.
- Blessures photographiées avec date.
- Vêtements conservés en l'état, sans lavage.

Constat établi par {{nom}} pour servir et valoir ce que de droit.${FOOTER}`,
    legalRefs: ['Art. R434-18 CSI', 'Art. 222-13 CP'],
    wiki: { label: 'Modèle détaillé : plainte pénale (violences)', href: '/wiki/Templates-Recours#template-4--plainte-pénale-au-procureur-pour-violences-policières' },
  },

  pdt_interpel_observateur: {
    docType: 'Témoignage',
    title: 'Attestation de témoin (art. 202 CPC)',
    intro: 'Attestation de témoin direct d\'une intervention. Filmer des agents en intervention sur la voie publique est licite (Conseil constitutionnel, mai 2021).',
    fields: [fNom, fNaiss, fAdresse, fDateF, fHeureF, fLieuF, { id: 'recit', label: 'Récit des faits observés', type: 'textarea', placeholder: 'Ce que j\'ai vu, dans l\'ordre, de façon factuelle', full: true }, ...SIG],
    body: `ATTESTATION DE TEMOIN
Etablie en application de l'article 202 du Code de procédure civile.

Je soussigné(e) {{nom}}, né(e) le {{naissance}}, demeurant {{adresse}},
sais que la présente attestation est destinée à être produite en justice et
qu'une fausse attestation m'expose à des sanctions pénales (art. 441-7 CP).

J'ai personnellement constaté les faits suivants :
- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}

RECIT :
{{recit}}

J'ai capté des images à distance, sans entraver l'intervention. Je peux les
produire à l'appui de la présente.${FOOTER}`,
    legalRefs: ['Art. 202 CPC', 'Art. 441-7 CP', 'Cons. const. 20 mai 2021'],
  },

  pdt_gav_debut: {
    docType: 'Demande',
    title: 'Demande d\'exercice des droits en GAV',
    intro: 'Demande à formuler dès la notification de la garde à vue, à faire consigner au procès-verbal (art. 63-1 CPP).',
    fields: [fNom, fDateF, { id: 'heure_gav', label: 'Heure de début de GAV', placeholder: 'ex : 15h00' }, { id: 'avocat', label: 'Avocat souhaité', placeholder: 'Maître … ou commis d\'office' }, { id: 'proche', label: 'Proche à prévenir', placeholder: 'Nom, tél.' }, ...SIG],
    body: `DEMANDE D'EXERCICE DES DROITS EN GARDE A VUE
Fondement : art. 63-1 CPP.

Je soussigné(e) {{nom}} demande, dès la notification de ma garde à vue débutée
le {{date_faits}} à {{heure_gav}}, à exercer les droits suivants :
- m'entretenir avec un avocat AVANT toute audition : {{avocat}} ;
- garder le silence pendant toute la garde à vue ;
- faire prévenir un proche : {{proche}} ;
- être examiné(e) par un médecin ;
- être assisté(e) d'un interprète si nécessaire.

Je demande que la présente demande soit consignée au procès-verbal et que
l'heure exacte de début de garde à vue y figure.${FOOTER}`,
    legalRefs: ['Art. 63-1 CPP', 'Art. 63-3-1 CPP', 'Art. 63-2 CPP', 'Art. 63-3 CPP'],
  },

  pdt_gav_interrogatoire: {
    docType: 'Observations',
    title: 'Observations à porter au procès-verbal d\'audition',
    intro: 'Observations à faire consigner en fin d\'audition. Le droit au silence ne peut pas fonder une condamnation.',
    fields: [fNom, fDateF, fService, { id: 'observations', label: 'Observations / inexactitudes à corriger', type: 'textarea', placeholder: 'Points à rectifier, réserves…', full: true }, ...SIG],
    body: `OBSERVATIONS A PORTER AU PROCES-VERBAL D'AUDITION

Je soussigné(e) {{nom}} demande que les observations suivantes soient consignées
au procès-verbal :

"J'exerce mon droit au silence. Je ne confirme aucune prise de décision relative
à l'organisation, au lieu, à la sonorisation, à la planification ou à la
diffusion d'informations. Le silence ne peut fonder aucune culpabilité."

Inexactitudes à corriger avant signature :
{{observations}}

- Date : {{date_faits}}
- Service / unité : {{service}}

Je ne signe aucun procès-verbal que je n'ai pas lu intégralement.${FOOTER}`,
    legalRefs: ['Art. 63-1 CPP', 'Art. 429 CPP'],
  },

  pdt_gav_telephone: {
    docType: 'Déclaration',
    title: 'Déclaration sur la demande de code de déchiffrement',
    intro: 'Déclaration à exprimer si l\'on exige le code du téléphone. Arbitrage délicat : à faire impérativement avec l\'avocat, profil par profil (art. 434-15-2 CP).',
    fields: [fNom, fDateF, fService, ...SIG],
    body: `DECLARATION - DEMANDE DE CODE DE DECHIFFREMENT
Fondement invoqué par l'enquête : art. 434-15-2 CP (refus de remettre une
convention secrète de déchiffrement).

Je soussigné(e) {{nom}} déclare :
- exercer mon droit au silence sur le contenu et l'usage de mon téléphone ;
- ne communiquer aucun code sans avoir consulté mon avocat, l'arbitrage
  dépendant de mon profil et des faits reprochés ;
- demander que toute remise éventuelle de code soit faite via l'avocat et
  consignée au procès-verbal.

Je rappelle que le déverrouillage biométrique forcé et la remise volontaire d'un
code ne relèvent pas du même régime.

- Date : {{date_faits}}
- Service / unité : {{service}}${FOOTER}`,
    legalRefs: ['Art. 434-15-2 CP', 'Cass. Crim. 2022-2023'],
  },

  pdt_gav_proche: {
    docType: 'Mandat',
    title: 'Désignation d\'avocat pour un proche en GAV',
    intro: 'Acte par lequel je mandate un avocat pour un proche placé en garde à vue, alors que je suis à l\'extérieur.',
    fields: [{ id: 'nom', label: 'Mon nom et prénom', placeholder: 'NOM Prénom' }, { id: 'lien', label: 'Lien avec la personne', placeholder: 'ami, conjoint, parent…' }, { id: 'gav_nom', label: 'Personne en GAV', placeholder: 'NOM Prénom' }, { id: 'lieu_gav', label: 'Lieu présumé de la GAV', placeholder: 'Commissariat / gendarmerie de…', full: true }, { id: 'avocat', label: 'Avocat mandaté', placeholder: 'Maître …, barreau, tél.', full: true }, ...SIG],
    body: `DESIGNATION D'AVOCAT POUR UNE PERSONNE EN GARDE A VUE
Fondement : art. 63-3-1 CPP (l'avocat peut être désigné par un proche).

Je soussigné(e) {{nom}}, {{lien}} de la personne ci-dessous,

désigne l'avocat suivant pour assister, dans le cadre de sa garde à vue :
- Personne concernée : {{gav_nom}}
- Lieu présumé : {{lieu_gav}}
- Avocat mandaté : {{avocat}}

Je demande que cette désignation soit transmise sans délai au service concerné.
La désignation devra être confirmée par l'intéressé(e).${FOOTER}`,
    legalRefs: ['Art. 63-3-1 CPP'],
  },

  // ═══════════════════════════════ APRES ════════════════════════════════════

  apr_controle_doc: {
    docType: 'Fiche de signalement',
    title: 'Fiche de documentation d\'un contrôle',
    intro: 'Fiche pour documenter un contrôle, même banal. La trace alimente la cartographie collective et sert en cas de répétition.',
    fields: [fNom, fDateF, fHeureF, fLieuF, fService, { id: 'deroule', label: 'Déroulé', type: 'textarea', placeholder: 'Ce qui s\'est passé, factuellement', full: true }, ...SIG],
    body: `FICHE DE SIGNALEMENT - CONTROLE

- Personne contrôlée : {{nom}}
- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}

DEROULE :
{{deroule}}

PIECES : images et enregistrements conservés et dupliqués.

Cette fiche sera, le cas échéant, reportée sur la carte collective de la
répression si le contrôle s'inscrit dans une vague répressive.${FOOTER}`,
    legalRefs: ['Art. 78-2 CPP'],
  },

  apr_controle_abus: {
    docType: 'Saisine',
    title: 'Saisine du Défenseur des droits (contrôle au faciès)',
    intro: 'Courrier de saisine du Défenseur des droits, gratuit et sans avocat, pour un contrôle discriminatoire ou abusif.',
    recipient: 'Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07',
    fields: [fNom, fAdresse, fTel, fEmail, fDateF, fHeureF, fLieuF, fService, { id: 'recit', label: 'Récit et éléments de discrimination', type: 'textarea', placeholder: 'Répétition, propos, témoins, absence de motif…', full: true }, ...SIG],
    body: `Objet : saisine pour contrôle d'identité discriminatoire

Madame, Monsieur le Défenseur des droits,

Je soussigné(e) {{nom}}, demeurant {{adresse}}
(tél. {{tel}}, courriel {{email}}),

vous saisis d'un contrôle d'identité que j'estime discriminatoire et/ou abusif :
- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}

EXPOSE :
{{recit}}

Un contrôle fondé sur l'apparence physique est illégal et peut engager la
responsabilité de l'Etat (Cass., 9 nov. 2016 ; CEDH). Je sollicite l'ouverture
d'une instruction et la communication des éléments utiles. Je me tiens à votre
disposition pour tout complément.

Je vous prie d'agréer, Madame, Monsieur le Défenseur des droits, l'expression de
ma considération distinguée.${FOOTER}`,
    legalRefs: ['Loi org. n°2011-333', 'Art. 225-1 CP', 'Cass. 9 nov. 2016'],
    wiki: { label: 'Modèle détaillé : signalement inspection (IGPN/IGGN)', href: '/wiki/Templates-Recours#template-5--signalement-iggn-gendarme' },
  },

  apr_fouille: {
    docType: 'Requête',
    title: 'Demande de restitution + note de nullité',
    intro: 'Courrier au procureur pour demander la restitution des objets saisis non confisqués et signaler les irrégularités de la fouille ou perquisition.',
    recipient: 'Monsieur le Procureur de la République, TJ de …',
    fields: [fNom, fAdresse, fTel, fDateF, fLieuF, fService, { id: 'objets', label: 'Objets saisis à restituer', type: 'textarea', placeholder: 'Désignation, n° de série', full: true }, { id: 'irreg', label: 'Irrégularités constatées', type: 'textarea', placeholder: 'Absence de cadre, défaut d\'inventaire, fouille de nuit, absence du concerné…', full: true }, { id: 'ref', label: 'Référence procédure / PV', placeholder: 'N° de procédure si connu' }, ...SIG],
    body: `Objet : demande de restitution (art. 41-4 CPP) et observations sur la régularité

Monsieur le Procureur de la République,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),
référence de procédure : {{ref}},

sollicite la restitution des objets suivants, saisis le {{date_faits}} à
{{lieu_faits}} (service : {{service}}) et non confisqués :
{{objets}}

Je signale par ailleurs les irrégularités suivantes affectant la mesure :
{{irreg}}

Ces irrégularités me paraissent de nature à fonder une demande de nullité, que
mon conseil soulèvera dans les délais de la procédure. Je vous remercie de bien
vouloir ordonner la restitution sollicitée.

Je vous prie d'agréer, Monsieur le Procureur, l'expression de ma considération
distinguée.${FOOTER}`,
    legalRefs: ['Art. 41-4 CPP', 'Art. 56 CPP', 'Art. 59 CPP', 'Art. 170 CPP'],
    wiki: { label: 'Modèle détaillé : restitution de matériel saisi', href: '/wiki/Templates-Recours#template-6--demande-de-restitution-de-matériel-saisi' },
  },

  apr_afd_terrain: {
    docType: 'Déclaration',
    title: 'Refus de paiement immédiat / réserve de contestation',
    intro: 'Déclaration à exprimer si une amende forfaitaire délictuelle est présentée sur le terrain. Payer vaut reconnaissance et ferme la contestation.',
    fields: [fNom, fDateF, fHeureF, fLieuF, fService, { id: 'num_afd', label: 'N° de l\'avis d\'AFD', placeholder: 'si remis' }, ...SIG],
    body: `DECLARATION - AMENDE FORFAITAIRE DELICTUELLE (terrain)

Je soussigné(e) {{nom}} déclare :
- ne PAS payer immédiatement l'amende forfaitaire qui m'est présentée, le
  paiement valant reconnaissance de l'infraction et éteignant mon droit de
  contester sur le fond ;
- me réserver le droit de former une requête en exonération dans les délais.

Je demande la remise de l'avis d'AFD avec son numéro et la qualification exacte.
- N° d'avis : {{num_afd}}
- Date : {{date_faits}}    Heure : {{heure_faits}}
- Lieu : {{lieu_faits}}
- Service / unité / matricule (RIO) : {{service}}

Je conteste, le cas échéant, la qualification d'organisateur (art. R211-27 CSI).${FOOTER}`,
    legalRefs: ['Art. 495-17 CPP', 'Art. R211-27 CSI'],
    wiki: { label: 'Modèle détaillé : contestation de contravention', href: '/wiki/Templates-Recours#template-1--contestation-dune-contravention-premier-tour' },
  },

  apr_afd_moins15j: {
    docType: 'Requête',
    title: 'Requête en exonération (AFD)',
    intro: 'Requête en exonération à envoyer en recommandé avec AR, dans la fenêtre favorable, avant toute majoration.',
    recipient: 'Officier du ministère public (adresse au dos de l\'avis)',
    fields: [fNom, fAdresse, fTel, { id: 'num_afd', label: 'N° de l\'avis d\'AFD', placeholder: 'Numéro figurant sur l\'avis', full: true }, fDateF, fLieuF, { id: 'moyens', label: 'Moyens de contestation', type: 'textarea', placeholder: 'Qualification d\'organisateur, régularité, proportionnalité…', full: true }, ...SIG],
    body: `Objet : requête en exonération - avis d'AFD n° {{num_afd}}

Monsieur l'Officier du ministère public,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),

conteste l'amende forfaitaire délictuelle référencée ci-dessus, relative à des
faits du {{date_faits}} à {{lieu_faits}}, et forme une requête en exonération.

MOYENS :
{{moyens}}

A titre principal, je conteste la qualification d'organisateur (art. R211-27
CSI) et j'invoque la liberté de réunion (art. 11 CESDH). Je sollicite le
classement ou, à défaut, le renvoi devant le tribunal.

Pièces jointes : copie de l'avis d'AFD ; justificatifs ; le cas échéant
consignation.

Je vous prie d'agréer, Monsieur l'Officier du ministère public, l'expression de
ma considération distinguée.${FOOTER}`,
    legalRefs: ['Art. 495-17 CPP', 'Art. 529-10 CPP', 'Art. R211-27 CSI', 'Art. 11 CESDH'],
    wiki: { label: 'Modèle détaillé : requête en exonération', href: '/wiki/Templates-Recours#template-2--requête-en-exonération-second-tour' },
  },

  apr_afd_15_30j: {
    docType: 'Requête',
    title: 'Requête en exonération (urgente)',
    intro: 'Même requête, à envoyer aujourd\'hui en recommandé avec AR : le délai inscrit sur l\'avis approche.',
    recipient: 'Officier du ministère public (adresse au dos de l\'avis)',
    fields: [fNom, fAdresse, fTel, { id: 'num_afd', label: 'N° de l\'avis d\'AFD', placeholder: 'Numéro figurant sur l\'avis', full: true }, { id: 'delai', label: 'Délai inscrit sur l\'avis', placeholder: 'Date limite de contestation' }, fDateF, fLieuF, { id: 'moyens', label: 'Moyens de contestation', type: 'textarea', placeholder: 'Qualification, régularité, proportionnalité…', full: true }, ...SIG],
    body: `Objet : requête en exonération URGENTE - avis d'AFD n° {{num_afd}}

Monsieur l'Officier du ministère public,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),

forme, dans le délai inscrit sur l'avis ({{delai}}), une requête en exonération
contre l'amende forfaitaire délictuelle n° {{num_afd}}, relative à des faits du
{{date_faits}} à {{lieu_faits}}.

MOYENS :
{{moyens}}

Je conteste la qualification d'organisateur (art. R211-27 CSI) et invoque la
liberté de réunion (art. 11 CESDH). La présente contestation suspend le
recouvrement du montant majoré.

Pièces jointes : copie de l'avis ; justificatifs.

Je vous prie d'agréer, Monsieur l'Officier du ministère public, l'expression de
ma considération distinguée.${FOOTER}`,
    legalRefs: ['Art. 495-17 CPP', 'Art. 529-10 CPP', 'Art. R211-27 CSI'],
    wiki: { label: 'Modèle détaillé : requête en exonération', href: '/wiki/Templates-Recours#template-2--requête-en-exonération-second-tour' },
  },

  apr_afd_plus30j: {
    docType: 'Réclamation',
    title: 'Réclamation à l\'OMP pour motif légitime',
    intro: 'Réclamation motivée lorsque le délai ordinaire est dépassé : non-réception, erreur d\'adresse. Situation technique, à sécuriser avec le FSJS ou un avocat.',
    recipient: 'Officier du ministère public (adresse au dos de l\'avis)',
    fields: [fNom, fAdresse, fTel, { id: 'num_afd', label: 'N° de l\'avis / titre exécutoire', placeholder: 'Numéro', full: true }, { id: 'motif', label: 'Motif légitime', type: 'textarea', placeholder: 'Non-réception, erreur d\'adresse, preuve à l\'appui', full: true }, fDateF, ...SIG],
    body: `Objet : réclamation pour motif légitime - avis/titre n° {{num_afd}}

Monsieur l'Officier du ministère public,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),

forme une réclamation contre l'amende forfaitaire délictuelle / le titre
exécutoire n° {{num_afd}}, relatif à des faits du {{date_faits}}.

MOTIF LEGITIME :
{{motif}}

N'ayant pas été en mesure de contester dans le délai ordinaire pour ce motif, je
sollicite la prise en compte de ma réclamation, l'annulation du titre majoré et
le renvoi devant le tribunal. Je vérifie par ailleurs les délais de prescription
applicables.

Pièces jointes : justificatifs du motif invoqué.

Je vous prie d'agréer, Monsieur l'Officier du ministère public, l'expression de
ma considération distinguée.${FOOTER}`,
    legalRefs: ['Art. 530 CPP', 'Art. 495-17 CPP'],
    wiki: { label: 'Modèle détaillé : requête en exonération', href: '/wiki/Templates-Recours#template-2--requête-en-exonération-second-tour' },
  },

  apr_contravention: {
    docType: 'Contestation',
    title: 'Contestation de contravention de 5e classe',
    intro: 'Lettre de contestation (2e temps, par courrier recommandé, avec attestations de témoins) après le refus quasi systématique de la contestation en ligne. Délai de 45 jours.',
    recipient: 'Officier du ministère public (adresse au dos de l\'avis)',
    fields: [fNom, fAdresse, fTel, { id: 'num_avis', label: 'N° de l\'avis de contravention', placeholder: 'Numéro', full: true }, fDateF, fLieuF, { id: 'temoins', label: 'Témoins joints (attestations)', type: 'textarea', placeholder: 'Nom des témoins dont l\'attestation est jointe', full: true }, { id: 'moyens', label: 'Moyens', type: 'textarea', placeholder: 'Qualification d\'organisateur, régularité, proportionnalité…', full: true }, ...SIG],
    body: `Objet : contestation - avis de contravention n° {{num_avis}}

Monsieur l'Officier du ministère public,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),

conteste l'avis de contravention de 5e classe n° {{num_avis}}, relatif à des
faits du {{date_faits}} à {{lieu_faits}}, fondé sur l'organisation d'un
rassemblement sans déclaration (art. R211-27 CSI).

MOYENS :
{{moyens}}

Je conteste en premier lieu ma qualité d'organisateur : la définition de
l'art. R211-27 CSI suppose un rôle effectif d'organisation, que les éléments du
dossier n'établissent pas. J'invoque la liberté de réunion (art. 11 CESDH).

ATTESTATIONS DE TEMOINS JOINTES :
{{temoins}}

Je sollicite le classement ou le renvoi devant la juridiction de proximité.

Pièces jointes : copie de l'avis ; attestations de témoins (art. 202 CPC).

Je vous prie d'agréer, Monsieur l'Officier du ministère public, l'expression de
ma considération distinguée.${FOOTER}`,
    legalRefs: ['Art. R211-27 CSI', 'Art. 529-2 CPP', 'Art. 530 CPP', 'Art. 11 CESDH'],
    wiki: { label: 'Modèle détaillé : contestation de contravention', href: '/wiki/Templates-Recours#template-1--contestation-dune-contravention-premier-tour' },
  },

  apr_interpel_sans_suite: {
    docType: 'Demande',
    title: 'Demande de restitution de matériel',
    intro: 'Courrier au procureur pour demander la restitution du matériel saisi alors qu\'aucune poursuite n\'est engagée (art. 41-4 CPP).',
    recipient: 'Monsieur le Procureur de la République, TJ de …',
    fields: [fNom, fAdresse, fTel, fDateF, fLieuF, fService, { id: 'objets', label: 'Matériel à restituer', type: 'textarea', placeholder: 'Désignation, n° de série', full: true }, { id: 'preuves', label: 'Preuves de propriété', placeholder: 'Factures, carte grise…', full: true }, ...SIG],
    body: `Objet : demande de restitution d'objets saisis (art. 41-4 CPP)

Monsieur le Procureur de la République,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),

ayant été relâché(e) sans poursuite à la suite des faits du {{date_faits}} à
{{lieu_faits}} (service : {{service}}), sollicite la restitution du matériel
suivant, saisi à cette occasion :
{{objets}}

Je justifie de ma qualité de propriétaire par les pièces suivantes :
{{preuves}}

En l'absence de confiscation, la restitution est de droit. Je vous remercie de
bien vouloir l'ordonner et reste à disposition.

Je vous prie d'agréer, Monsieur le Procureur, l'expression de ma considération
distinguée.${FOOTER}`,
    legalRefs: ['Art. 41-4 CPP'],
    wiki: { label: 'Modèle détaillé : restitution de matériel saisi', href: '/wiki/Templates-Recours#template-6--demande-de-restitution-de-matériel-saisi' },
  },

  apr_interpel_saisie: {
    docType: 'Requête',
    title: 'Requête en restitution d\'objets saisis',
    intro: 'Requête en restitution fondée sur la propriété et la proportionnalité, à adresser au procureur ou au tribunal. Le FSJS récupère le matériel dans ~90% des dossiers suivis.',
    recipient: 'Monsieur le Procureur de la République, TJ de …',
    fields: [fNom, fAdresse, fTel, fDateF, fLieuF, { id: 'pv', label: 'Référence du PV de saisie', placeholder: 'N° / date du PV' }, { id: 'objets', label: 'Matériel saisi', type: 'textarea', placeholder: 'Désignation, n° de série, valeur', full: true }, { id: 'preuves', label: 'Preuves de propriété', placeholder: 'Factures, photos, carte grise…', full: true }, ...SIG],
    body: `Objet : requête en restitution d'objets saisis (art. 41-4 / 99 CPP)

Monsieur le Procureur de la République,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),
PV de saisie : {{pv}},

sollicite la restitution du matériel saisi le {{date_faits}} à {{lieu_faits}}
sous le régime de l'art. L211-15 CSI :
{{objets}}

MOYENS :
- Propriété : je justifie être propriétaire (ou tiers de bonne foi) par :
  {{preuves}} ;
- Proportionnalité : la valeur du matériel est sans commune mesure avec la
  gravité alléguée des faits ;
- La saisie est conservatoire (6 mois max) ; la confiscation exige un jugement
  (art. 131-21 CP) ; la seule possession ne caractérise pas l'organisation
  (Cass. Crim. 17 mars 2020).

Je sollicite la restitution et reste à disposition.

Je vous prie d'agréer, Monsieur le Procureur, l'expression de ma considération
distinguée.${FOOTER}`,
    legalRefs: ['Art. 41-4 CPP', 'Art. 99 CPP', 'Art. L211-15 CSI', 'Art. 131-21 CP'],
    wiki: { label: 'Modèle détaillé : restitution de matériel saisi', href: '/wiki/Templates-Recours#template-6--demande-de-restitution-de-matériel-saisi' },
  },

  apr_interpel_plainte: {
    docType: 'Plainte',
    title: 'Plainte pour violences (procureur)',
    intro: 'Plainte simple adressée au procureur. En cas de classement, la constitution de partie civile force l\'ouverture d\'une enquête. La preuve médicale (ITT) est déterminante.',
    recipient: 'Monsieur le Procureur de la République, TJ de …',
    fields: [fNom, fNaiss, fAdresse, fTel, fEmail, fDateF, fHeureF, fLieuF, fService, { id: 'faits', label: 'Exposé des faits', type: 'textarea', placeholder: 'Récit chronologique et factuel des violences', full: true }, { id: 'preuves', label: 'Preuves', type: 'textarea', placeholder: 'Certificat médical ITT, photos, vidéos, témoins', full: true }, ...SIG],
    body: `Objet : plainte pour violences par personne dépositaire de l'autorité publique

Monsieur le Procureur de la République,

Je soussigné(e) {{nom}}, né(e) le {{naissance}}, demeurant {{adresse}}
(tél. {{tel}}, courriel {{email}}),

porte plainte contre les agents identifiés ou à identifier du service {{service}},
pour des faits de violences commis le {{date_faits}} à {{heure_faits}}, à
{{lieu_faits}}.

EXPOSE DES FAITS :
{{faits}}

PREUVES :
{{preuves}}

L'usage de la force doit être nécessaire et proportionné (art. R434-18 CSI) ; à
défaut, il est fautif et susceptible de qualification pénale (art. 222-13 CP).
Je sollicite l'ouverture d'une enquête. A défaut de poursuite, je me réserve de
me constituer partie civile (art. 85 CPP) et je saisis en parallèle le Défenseur
des droits.

Je vous prie d'agréer, Monsieur le Procureur, l'expression de ma considération
distinguée.${FOOTER}`,
    legalRefs: ['Art. 222-13 CP', 'Art. R434-18 CSI', 'Art. 40 CPP', 'Art. 85 CPP'],
    wiki: { label: 'Modèle détaillé : plainte pénale (violences)', href: '/wiki/Templates-Recours#template-4--plainte-pénale-au-procureur-pour-violences-policières' },
  },

  apr_gav_sortie: {
    docType: 'Demande',
    title: 'Demande de copie des procès-verbaux',
    intro: 'Demande adressée au procureur (ou via l\'avocat) pour obtenir copie des PV et connaître la qualification retenue à la sortie de GAV.',
    recipient: 'Monsieur le Procureur de la République, TJ de …',
    fields: [fNom, fAdresse, fTel, fDateF, { id: 'service', label: 'Service ayant procédé à la GAV', placeholder: 'Commissariat / gendarmerie de…', full: true }, ...SIG],
    body: `Objet : demande de copie de procès-verbaux et de la qualification retenue

Monsieur le Procureur de la République,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),

ayant fait l'objet d'une garde à vue le {{date_faits}} au sein du service
{{service}}, sollicite, pour l'exercice des droits de la défense, la copie des
procès-verbaux me concernant ainsi que la communication de la qualification
exacte retenue et des suites envisagées.

Je signale me réserver de soulever toute irrégularité de la procédure (délais,
accès à l'avocat, conditions de la mesure) susceptible de fonder une nullité.

Je vous prie d'agréer, Monsieur le Procureur, l'expression de ma considération
distinguée.${FOOTER}`,
    legalRefs: ['Art. 63-1 CPP', 'Art. 114 CPP', 'Art. 170 CPP'],
  },

  apr_gav_convocation: {
    docType: 'Désignation',
    title: 'Désignation d\'avocat + demande de pièces',
    intro: 'Courrier de désignation d\'avocat et de demande du dossier après réception d\'une convocation (CRPC, COPJ, citation directe). Ne jamais se présenter seul à une CRPC.',
    recipient: 'Monsieur le Procureur de la République / Greffe, TJ de …',
    fields: [fNom, fAdresse, fTel, { id: 'type_conv', label: 'Type de convocation', placeholder: 'CRPC, COPJ, citation directe…' }, { id: 'date_aud', label: 'Date d\'audience', type: 'date' }, { id: 'avocat', label: 'Avocat désigné', placeholder: 'Maître …, barreau', full: true }, ...SIG],
    body: `Objet : désignation d'avocat et demande de communication du dossier

Monsieur le Procureur de la République,

Je soussigné(e) {{nom}}, demeurant {{adresse}} (tél. {{tel}}),

ayant reçu une convocation de type {{type_conv}} pour l'audience du {{date_aud}},

vous informe désigner pour me défendre :
Avocat : {{avocat}}

Je sollicite la communication du dossier en temps utile pour la préparation de ma
défense. Je précise que je n'accepterai aucune procédure de comparution sur
reconnaissance préalable de culpabilité (CRPC) sans en avoir mesuré, avec mon
conseil, les conséquences, une telle procédure impliquant la reconnaissance des
faits. Je me réserve d'invoquer la liberté de réunion (art. 11 CESDH) et de
soulever une question prioritaire de constitutionnalité.

Je vous prie d'agréer, Monsieur le Procureur, l'expression de ma considération
distinguée.${FOOTER}`,
    legalRefs: ['Art. 495-8 CPP (CRPC)', 'Art. 390-1 CPP', 'Art. 11 CESDH'],
  },

  apr_gav_appel: {
    docType: 'Déclaration d\'appel',
    title: 'Déclaration d\'appel correctionnel',
    intro: 'Déclaration d\'appel à former dans les 10 jours du jugement, au greffe du tribunal qui a statué. L\'affaire est rejugée en fait et en droit.',
    recipient: 'Greffe du tribunal correctionnel de …',
    fields: [fNom, fNaiss, fAdresse, { id: 'juridiction', label: 'Tribunal ayant jugé', placeholder: 'TJ de…', full: true }, { id: 'date_jug', label: 'Date du jugement', type: 'date' }, { id: 'num_jug', label: 'N° du jugement / parquet', placeholder: 'Référence' }, { id: 'portee', label: 'Portée de l\'appel', placeholder: 'Total ou limité (peine, intérêts civils…)', full: true }, ...SIG],
    body: `DECLARATION D'APPEL
Fondement : art. 498 et 502 CPP (délai d'appel : 10 jours).

Je soussigné(e) {{nom}}, né(e) le {{naissance}}, demeurant {{adresse}},

déclare faire APPEL du jugement rendu par le {{juridiction}}
le {{date_jug}} (référence : {{num_jug}}).

Portée de l'appel : {{portee}}

Je conteste notamment la qualification d'organisateur retenue, la proportionnalité
de la peine, et j'invoque la liberté de réunion (art. 11 CESDH). Je me réserve de
produire des éléments nouveaux et d'envisager une question prioritaire de
constitutionnalité.

Cette déclaration est faite pour être enregistrée au greffe dans le délai légal.${FOOTER}`,
    legalRefs: ['Art. 498 CPP', 'Art. 502 CPP', 'Art. 509 CPP', 'Art. 11 CESDH'],
  },

};

// Liste des identifiants couverts, pour vérification.
export const LEGAL_DOC_IDS = Object.keys(LEGAL_DOCS);
