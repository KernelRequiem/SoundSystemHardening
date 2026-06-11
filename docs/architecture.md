# Architecture du projet

## Structure des dossiers

```
sound-system-hardening-new/
│
├── docs/                        ← Ce dossier. Documentation publique, non publiée sur le site.
├── private/                     ← Documentation interne sensible. Exclue de git.
│
├── src/                         ← Tout le code source du site
│   ├── components/              ← Composants réutilisables (table des matières, etc.)
│   ├── content/
│   │   └── wiki/                ← Les fichiers Markdown du wiki
│   ├── data/
│   │   ├── incidents.json       ← Base des incidents répressifs (alimente la carte)
│   │   └── decision.ts          ← Arbre de décision (données + types)
│   ├── layouts/
│   │   └── Layout.astro         ← Layout universel (sidebar, topbar, footer)
│   ├── pages/                   ← Une page = un fichier = une URL
│   │   ├── index.astro          ← / (accueil)
│   │   ├── urgence.astro        ← /urgence
│   │   ├── map.astro            ← /map (carte)
│   │   ├── decision.astro       ← /decision (arbre de décision)
│   │   ├── opsec-tools.astro    ← /opsec-tools (boîte à outils OpSec)
│   │   ├── infocrypt.astro      ← /infocrypt (chiffrement de messages)
│   │   ├── stripmeta.astro      ← /stripmeta (nettoyage de métadonnées)
│   │   ├── timeseal.astro       ← /timeseal (horodatage)
│   │   ├── rig-lock.astro       ← /rig-lock (manifeste de saisie)
│   │   ├── search.astro         ← /search (recherche)
│   │   ├── securite.astro       ← /securite
│   │   ├── a-propos.astro       ← /a-propos
│   │   ├── contact.astro        ← /contact
│   │   ├── api/                 ← Routes serveur (voir plus bas)
│   │   │   ├── contact.ts        ← reçoit le formulaire de contact, envoie un email
│   │   │   ├── signalement.ts    ← reçoit un signalement, l'écrit dans Airtable
│   │   │   └── health.ts         ← vérification d'état (monitoring du conteneur)
│   │   └── wiki/
│   │       ├── index.astro      ← /wiki
│   │       └── [slug].astro     ← /wiki/[n'importe-quelle-page]
│   └── styles/
│       └── global.css           ← CSS global + polices auto-hébergées
│
├── public/                      ← Fichiers copiés tels quels dans la construction
│   ├── fonts/                   ← Polices auto-hébergées (zéro Google Fonts)
│   ├── favicon.ico
│   ├── manifest.json            ← Manifeste PWA
│   └── sw.js                    ← Service worker (cache hors ligne)
│
├── astro.config.mjs             ← Configuration Astro (mode hybrid, adapter Node)
├── Dockerfile                   ← Recette de construction du conteneur
├── tailwind.config.mjs          ← Configuration Tailwind
└── package.json                 ← Dépendances npm
```

---

## Statique d'abord, serveur quand il le faut

Le site fonctionne en mode `hybrid`. Concrètement :

- La quasi-totalité des pages (accueil, wiki, urgence, outils de terrain) sont **pré-générées en HTML statique** au moment de la construction. Elles ne sollicitent aucun serveur quand un visiteur les ouvre. C'est rapide et la surface d'attaque est minimale.
- Trois routes seulement sont **rendues côté serveur** à la demande, parce qu'elles ont besoin de faire quelque chose qu'un fichier statique ne peut pas : envoyer un email, écrire dans une base, répondre à un test de santé. Elles sont déclarées avec `export const prerender = false`.

Cette séparation est volontaire : tout ce qui peut être statique l'est, et le serveur n'est exposé que sur le strict nécessaire.

---

## Le routing : comment une URL devient une page

Astro utilise un routing basé sur les fichiers. Chaque fichier dans `src/pages/` correspond à une URL.

| Fichier | URL générée | Type |
|---|---|---|
| `src/pages/index.astro` | `/` | Statique |
| `src/pages/map.astro` | `/map` | Statique |
| `src/pages/wiki/[slug].astro` | `/wiki/*` (toutes les pages wiki) | Statique |
| `src/pages/search-index.json.ts` | `/search-index.json` | Généré à la construction |
| `src/pages/api/contact.ts` | `/api/contact` | Serveur (à la demande) |
| `src/pages/api/signalement.ts` | `/api/signalement` | Serveur (à la demande) |

Le fichier `[slug].astro` est une route dynamique : les crochets signifient « paramètre variable ». Ce fichier unique génère autant de pages HTML qu'il y a de fichiers Markdown dans le wiki. C'est le principe de la génération de site statique.

---

## Le layout universel

`src/layouts/Layout.astro` est le squelette commun à toutes les pages. Il contient les métadonnées (SEO, prévisualisations sociales, manifeste PWA), la barre de progression de lecture, le menu mobile, la sidebar de navigation, la topbar avec les outils rapides, le footer, et les scripts d'interface (menu, thème, accordéons).

Chaque page passe ses propriétés au layout :

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="MAP" category="OUTILS">
  <!-- contenu de la page -->
</Layout>
```

---

## Les données

### incidents.json

La « base de données » de la carte. Chaque entrée décrit un incident répressif : date, département, type, description, coordonnées GPS. Le fichier est lu à la fois par l'accueil (pour le compteur) et par la carte (pour les marqueurs).

### decision.ts

Toutes les données de l'arbre de décision : questions, réponses possibles, nœuds de résultat avec actions et ressources. C'est du TypeScript plutôt que du JSON, ce qui permet de typer la structure et d'attraper les erreurs de saisie dès la construction plutôt qu'en production.

---

## Le système wiki : du Markdown vers des pages web

1. Un fichier `src/content/wiki/Contacts-Allies.md` existe.
2. À la construction, `src/pages/wiki/[slug].astro` lit tous les fichiers Markdown du wiki.
3. Pour chaque fichier, il génère une page accessible à `/wiki/Contacts-Allies`.
4. Le Markdown est converti en HTML via `marked`.
5. Le HTML est injecté dans le layout via `<slot />`.

Ce pipeline évite tout CMS. Les fichiers Markdown sont la source de vérité, éditables directement sur GitHub.

---

## Ce qui n'est PAS publié

Deux dossiers ne sont jamais servis sur le site :

- `docs/` (cette documentation) est en dehors de `src/`, donc ignoré à la construction. Il reste visible sur GitHub mais n'apparaît pas sur le site.
- `private/` contient la documentation interne sensible (infra détaillée, schémas, feuille de route). Il est exclu de git, donc ni sur le site, ni sur GitHub.
