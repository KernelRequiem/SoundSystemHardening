// Actualités affichées dans le ticker de la page d'accueil.
// Ajouter/modifier ici sans toucher au template.
// Format : chaîne de caractères, le tag [ DATE ] en tête est libre.

import { actuPosts } from './actu-posts';

// Items de base du fil (hors posts détaillés de la page actu).
export const baseTickerItems: string[] = [
  '[ MAINTENANCE ] Formulaire de contact hors service jusqu\'au 25 juin (sécurisation du canal) · en attendant : mail crxzydiam0nd@protonmail.com ou Signal KernelRequiem.27',
  '[ JUIN 2026 ] Migration infra vers VPS souverain · Hébergement Suisse, juridiction nLPD',
  '[ VEILLE ] Loi RIPOST votée au Sénat le 26 mai 2026 · industrialisation des AFD et saisies destructives',
  '[ WIKI ] Nouvelle page : Stratégie contre-RIPOST · parades et éléments de langage face aux médias',
  '[ WIKI ] Nouvelle page : Drones thermiques et nasses logistiques · adaptation des infrastructures critiques',
  '[ OPSEC ] Protocoles burners Telegram/Signal via Fragment mis à jour',
  '[ INFRA ] Zéro script tiers · aucun outil de monitoring externe sur les pages wiki',
  '[ DROIT ] Jurisprudences GAV et forçage biométrique mises à jour · mai 2026',
];

// Ticker complet = posts récents de la page actu (À la une) + items de base.
// Règle du projet : tout post récent de la page actu apparaît aussi dans la bannière.
export const tickerItems: string[] = [
  ...actuPosts.map((p) => p.ticker),
  ...baseTickerItems,
];
