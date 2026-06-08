# Architecture du projet

## Structure des dossiers

```
sound-system-hardening-new/
│
├── docs/                        ← Ce dossier. Non publié.
│
├── src/                         ← Tout le code source du site
│   ├── components/              ← Composants réutilisables
│   │   └── TableOfContents.astro
│   ├── content/
│   │   └── wiki/                ← Les ~60 fichiers Markdown du wiki
│   ├── data/
│   │   ├── incidents.json       ← Base de données des incidents répressifs
│   │   └── decision.ts          ← Arbre de décision (données + types)
│   ├── layouts/
│   │   └── Layout.astro         ← Layout universel (sidebar, topbar, footer)
│   ├── pages/                   ← Une page = un fichier = une URL
│   │   ├── index.astro          ← / (page d'accueil)
│   │   ├── urgence.astro        ← /urgence
│   │   ├── map.astro            ← /map
│   │   ├── decision.astro       ← /decision
│   │   ├── rig-lock.astro       ← /rig-lock
│   │   ├── search.astro         ← /search
│   │   ├── search-index.json.ts ← /search-index.json (généré au build)
│   │   ├── securite.astro       ← /securite
│   │   ├── strategie.astro      ← /strategie
│   │   ├── terrain.astro        ← /terrain
│   │   ├── a-propos.astro       ← /a-propos
│   │   ├── contact.astro        ← /contact
│   │   ├── contribuer.astro     ← /contribuer
│   │   └── wiki/
│   │       ├── index.astro      ← /wiki (index du wiki)
│   │       └── [slug].astro     ← /wiki/[n'importe-quelle-page]
│   └── styles/
│       └── global.css           ← CSS global (~800 lignes)
│
├── public/                      ← Fichiers copiés tels quels dans le build
│   ├── favicon.ico
│   ├── manifest.json            ← PWA manifest
│   └── SoundSystemHardeninglogo.png
│
├── astro.config.mjs             ← Configuration Astro
├── tailwind.config.mjs          ← Configuration Tailwind
└── package.json                 ← Dépendances npm
```

---

## Le routing : comment une URL devient une page

Astro utilise un système de routing basé sur les fichiers. Chaque fichier dans `src/pages/` correspond directement à une URL :

| Fichier | URL générée |
|---|---|
| `src/pages/index.astro` | `/` |
| `src/pages/urgence.astro` | `/urgence` |
| `src/pages/map.astro` | `/map` |
| `src/pages/wiki/index.astro` | `/wiki` |
| `src/pages/wiki/[slug].astro` | `/wiki/*` (toutes les pages wiki) |
| `src/pages/search-index.json.ts` | `/search-index.json` |

Le fichier `[slug].astro` est un fichier de routing dynamique. Les crochets signifient "paramètre variable". Ce fichier unique génère autant de pages HTML qu'il y a de fichiers `.md` dans `src/content/wiki/`. C'est ce qu'on appelle le **Static Site Generation (SSG)** : au moment du build, Astro génère une page HTML pour chaque fichier Markdown.

---

## Le layout universel

`src/layouts/Layout.astro` est le squelette commun à toutes les pages du site. Il contient :

- Les balises `<head>` avec les métadonnées SEO, les balises Open Graph (prévisualisations sur réseaux sociaux), le manifest PWA
- La barre de progression de lecture (la ligne verte en haut qui avance en scrollant)
- Le bouton hamburger (menu mobile)
- La sidebar latérale avec navigation accordéon
- La topbar avec le fil d'Ariane et les onglets d'outils rapides
- Le footer avec les liens alliés et les informations légales
- Les scripts JavaScript pour : sidebar mobile, progress bar, thème clair/sombre, accordéons de navigation

Chaque page passe ses propriétés au layout via les props Astro :

```astro
---
// Dans une page
import Layout from '../layouts/Layout.astro';
---
<Layout title="MAP" category="OUTILS">
  <!-- contenu spécifique à la page -->
</Layout>
```

---

## Les données

### incidents.json

Fichier JSON structuré contenant chaque incident répressif documenté. Chaque entrée comporte au minimum : date, département, type d'incident, description courte, et coordonnées GPS pour la carte. Ce fichier est la "base de données" de la carte.

```json
{
  "date": "2026-05-15",
  "dept": "26",
  "type": "saisie",
  "titre": "Saisie Salles-sous-Bois",
  "lat": 44.7,
  "lng": 4.9
}
```

Il est importé à la fois dans `index.astro` (pour le compteur de la homepage) et dans `map.astro` (pour alimenter la carte Leaflet).

### decision.ts

Fichier TypeScript qui contient toutes les données de l'arbre de décision : les questions, les réponses possibles, les nœuds de résultat avec les actions à entreprendre et les ressources associées. TypeScript (par rapport à JSON) permet de typer précisément la structure des données, ce qui évite les erreurs lors de l'édition.

---

## Le système wiki : comment les pages .md deviennent des pages web

1. Un fichier `src/content/wiki/Contacts-Allies.md` existe.
2. Au build, `src/pages/wiki/[slug].astro` lit tous les fichiers `.md` du dossier wiki.
3. Pour chaque fichier, il génère une page statique accessible à `/wiki/Contacts-Allies`.
4. Le contenu Markdown est converti en HTML via un parser maison basé sur `marked` et des expressions régulières.
5. Le HTML généré est injecté dans le layout via `<slot />`.

Ce pipeline évite toute dépendance à un CMS (système de gestion de contenu). Les fichiers `.md` sont la source de vérité. Ils peuvent être édités directement sur GitHub, via l'interface web GitHub, ou avec n'importe quel éditeur de texte.

---

## Ce qui n'est PAS publié

Le dossier `docs/` est à la racine du projet, en dehors de `src/`. Astro ne construit que le contenu de `src/pages/`. Tout ce qui est à la racine du projet (hors `public/`) est ignoré lors du build. Ce dossier est donc visible sur GitHub mais jamais servi sur le site.
