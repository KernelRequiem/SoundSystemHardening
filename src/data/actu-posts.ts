// Posts détaillés de la page Actualités (section "À la une").
// Chaque post expose aussi une ligne `ticker` reprise automatiquement dans la
// bannière de l'accueil (voir src/data/ticker.ts) : règle du projet, tout post
// récent de la page actu doit apparaître dans la bannière.
//
// Ordre : du plus récent au plus ancien (l'ordre du tableau fait foi).

export interface ActuPost {
  id: string;
  date: string;      // ISO yyyy-mm-dd
  dateFR: string;    // affichage
  tag: string;       // libellé court (sert aussi de couleur via TAG_ACCENT)
  titre: string;
  chapo: string;     // intro mise en avant
  corps: string[];   // paragraphes
  encadre?: { titre: string; texte: string };
  liens?: { label: string; href: string }[];
  source?: { label: string; url: string };
  ticker: string;    // ligne reprise dans la bannière, format "[ TAG ] texte"
}

export const actuPosts: ActuPost[] = [
  {
    id: "fete-de-la-musique-2026",
    date: "2026-06-21",
    dateFR: "21 juin 2026",
    tag: "CULTURE",
    titre: "Fête de la musique : la rue célèbre le son que la loi veut faire taire",
    chapo: "Le 21 juin, l'État encourage la musique partout dans la rue. Le même État criminalise les fêtes libres avec la PPL 1133 et le projet de loi RIPOST. Le paradoxe n'est pas un accident, c'est une politique.",
    corps: [
      "La Fête de la musique repose sur une idée simple : faire de la musique et danser dans l'espace public est un droit culturel, gratuit et ouvert à toutes et tous. C'est exactement la définition de la fête libre. La seule différence tient au cadre : un soir autorisé contre une culture autogérée que l'on cherche à éteindre le reste de l'année.",
      "Pendant que les scènes officielles occupent les places, les organisateur·ices de free party encourent désormais des peines de prison, jusqu'à 30 000 € d'amende, la confiscation du véhicule et la suspension du permis si le projet de loi RIPOST est promulgué. La même culture électronique est célébrée d'un côté et réprimée de l'autre.",
      "Profiter de la Fête de la musique, c'est aussi rappeler les fondamentaux de la réduction des risques : bouchons d'oreille, hydratation, pauses, vigilance entre potes. La fête ne doit jamais se payer en santé. Ces réflexes, portés par les associations comme Techno+ et Freeform, sont précisément ceux que la répression rend plus difficiles en poussant les événements vers des lieux isolés.",
      "Ce 21 juin est une occasion de faire connaître la cause au-delà du mouvement : expliquer ce que sont réellement les fêtes libres, documenter la répression et défendre une culture qui existe depuis plus de trente ans."
    ],
    liens: [
      { label: "Carte de la répression", href: "/map" },
      { label: "Wiki : loi RIPOST", href: "/wiki/ripost" },
      { label: "Wiki : mobilisation", href: "/wiki/Mobilisation" }
    ],
    ticker: "[ CULTURE ] 21 juin · Fête de la musique : la rue célèbre le son que la loi RIPOST veut faire taire le reste de l'année"
  },
  {
    id: "manifestive-2026-there-are-alternatives",
    date: "2026-06-13",
    dateFR: "13 juin 2026",
    tag: "MOBILISATION",
    titre: "Manifestive 2026 « There Are Alternatives » : l'appel de Techno+ et Tekno Anti Rep",
    chapo: "Le collectif Tekno Anti Rep, relayé par l'association de santé Techno+, a appelé à des manifestations dans une trentaine de villes les 30 mai, 6 et 13 juin 2026 pour défendre la culture free-party et exiger le retrait de la PPL 1133 et du projet de loi RIPOST.",
    corps: [
      "Le mot d'ordre, « There Are Alternatives » (T.A.A), détourne le slogan « There Is No Alternative » de Margaret Thatcher. Le clin d'œil est politique : ce sont les restrictions des rassemblements nocturnes décidées sous Thatcher qui ont fait naître les premières free-party. L'argument central est qu'une autre manière de faire la fête, gratuite et autogérée, existe et résiste depuis plus de trente ans.",
      "Deux textes sont visés. La proposition de loi 1133 (Horizons, Laetitia Saint-Paul) prévoyait de criminaliser jusqu'aux pratiques de réduction des risques ; un amendement a finalement exclu de la notion d'« organisation » les personnes qui proposent du soin, de la nourriture et des espaces de repos. Le projet de loi RIPOST (ministère de l'Intérieur) va plus loin : peines de prison, 30 000 € d'amende, confiscation du véhicule, et une obligation de signalement imposée aux loueurs de matériel sonore, qui revient à organiser la délation.",
      "Le point d'alerte de Techno+ est sanitaire : intervenant·es de réduction des risques assimilé·es à des participant·es (jusqu'à 7 500 € et 6 mois de prison), exposition aux violences policières comme à Redon en 2021, où des palets de lacrymogène ont été lancés dans un poste de soin. Leur thèse tient en une formule : plus de répression égale plus de risques. La pénalisation pousse vers des sites isolés, éloigne les secours et nourrit la clandestinité, sans jamais faire reculer la pratique.",
      "Les revendications sont claires : retrait de la PPL 1133 et du projet de loi RIPOST, arrêt immédiat des interventions violentes en free-party, reprise du dialogue entre organisateur·ices et autorités. Le cortège marche en mémoire de Steve Maia Caniço et de toutes les victimes de violences policières, et revendique une fête libre, inclusive, antifasciste et anticapitaliste."
    ],
    encadre: {
      titre: "Ce qu'il faut retenir",
      texte: "« Les lois liberticides et autoritaires utilisées aujourd'hui contre le mouvement free-party serviront demain dans le droit commun à réprimer toute forme de lutte ou d'opposition. Même si vous ne vous sentez pas concerné·e, ces lois finiront par vous atteindre. » (Techno+)"
    },
    liens: [
      { label: "Carte de la répression", href: "/map" },
      { label: "Wiki : loi RIPOST", href: "/wiki/ripost" },
      { label: "Wiki : mobilisation", href: "/wiki/Mobilisation" }
    ],
    source: {
      label: "Techno+ · Appel à rejoindre la Manifestive 2026",
      url: "https://technoplus.org/fete-libre/9244-techno-appelle-a-rejoindre-la-manifestive-2026/"
    },
    ticker: "[ MOBILISATION ] Manifestive 2026 « There Are Alternatives » · 30 villes les 30 mai, 6 et 13 juin contre RIPOST & PPL 1133 (Techno+ / Tekno Anti Rep)"
  }
];
