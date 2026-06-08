# Stack technique

## Le cadre : Astro 4

Astro est le framework qui orchestre tout le site. Son rôle est de prendre des fichiers sources (`.astro`, `.md`, `.ts`, `.json`) et de les transformer en un site HTML/CSS/JS statique prêt à être déployé.

**Pourquoi Astro et pas autre chose ?**

La concurrence directe serait Next.js, Nuxt, ou Hugo. Astro a été choisi pour une raison principale : son modèle "zéro JavaScript par défaut". Contrairement à Next.js qui envoie un gros fichier JavaScript au navigateur pour chaque page, Astro n'envoie du JavaScript que là où c'est explicitement nécessaire. Le résultat : des pages qui s'affichent très vite, même sur une connexion mobile 3G lors d'un rave en zone rurale.

Astro utilise un système de fichiers `.astro` qui ressemble à du HTML avec une section de code (appelée "frontmatter") délimitée par `---`. Exemple minimal :

```astro
---
// Ce code s'exécute au moment du build, pas dans le navigateur
const titre = "Bonjour"
---
<!-- Ce HTML est envoyé au navigateur -->
<h1>{titre}</h1>
```

**Version utilisée :** Astro 4.16.19

---

## CSS : Tailwind CSS 3

Tailwind est une bibliothèque de classes CSS utilitaires. Au lieu d'écrire du CSS dans un fichier séparé, on applique des classes directement sur les éléments HTML :

```html
<!-- Sans Tailwind -->
<div class="ma-carte">...</div>

<!-- Avec Tailwind -->
<div class="bg-black border border-green-400 p-4 rounded">...</div>
```

Tailwind génère uniquement le CSS correspondant aux classes réellement utilisées dans le projet. Un projet complet peut peser moins de 20 Ko de CSS, contre plusieurs centaines de Ko pour un framework comme Bootstrap.

Le projet étend Tailwind avec un système de couleurs personnalisé (voir [Design system](./design-system.md)) qui définit des tokens comme `neon-green` (`#00ff9f`) ou `dedsec-black` (`#0a0a0f`).

**Version utilisée :** Tailwind CSS 3.4.13

---

## Recherche : Fuse.js

Fuse.js est une bibliothèque de recherche "fuzzy" (floue) qui fonctionne entièrement dans le navigateur, sans serveur. "Fuzzy" signifie qu'elle tolère les fautes de frappe et les approximations : chercher "gav" trouvera "Garde à vue", chercher "ripost" trouvera "RIPOST 2026".

**Comment ça fonctionne dans ce projet :**

Au moment du build, Astro génère un fichier `/search-index.json` contenant le titre, les sous-titres et un extrait du contenu de chaque page wiki. Ce fichier est téléchargé par le navigateur au premier accès à la page de recherche. Fuse.js charge cet index en mémoire et effectue toutes les recherches localement, sans aucun appel réseau.

```
Build → search-index.json (toutes les pages indexées)
                ↓
Navigateur → télécharge l'index une fois
                ↓
Utilisateur tape → Fuse.js cherche en mémoire → résultats instantanés
```

**Version utilisée :** Fuse.js 7.4.1

---

## Carte : Leaflet

Leaflet est la bibliothèque open source de cartographie la plus répandue. Elle affiche des cartes interactives (zoom, clic, marqueurs) en utilisant des tuiles de carte fournies par OpenStreetMap — une alternative libre à Google Maps.

Dans ce projet, Leaflet affiche les incidents répressifs stockés dans `src/data/incidents.json`. Chaque incident est un marqueur coloré selon son type (saisie, GAV, charge, blessure...). La bibliothèque est chargée via CDN uniquement sur la page `/map`, pas sur tout le site.

**Version utilisée :** Leaflet 1.9.4

---

## Rendu Markdown : marked

Le wiki contient ~60 fichiers `.md` (Markdown). Markdown est un format texte simple où `# Titre` devient un `<h1>`, `**gras**` devient du gras, etc. 

Le projet utilise deux mécanismes complémentaires :
- **marked** (v18) : bibliothèque Node.js qui convertit du Markdown en HTML. Elle est utilisée dans le template `[slug].astro` pour rendre les pages wiki.
- **@astrojs/mdx** : intégration officielle pour les fichiers `.mdx` (Markdown avec composants Astro embarqués).

---

## Typo et polices : Google Fonts

Deux polices sont chargées depuis Google Fonts :
- **JetBrains Mono** : police monospace (chaque caractère fait la même largeur). Utilisée pour tout le texte d'interface, les labels, les codes. Elle évoque un terminal, renforce l'identité "outil opérationnel".
- **Space Grotesk** : police sans-serif géométrique. Utilisée pour les titres et les éléments qui doivent être mis en valeur sans paraître froid.

---

## Analytics : Vercel Speed Insights

Vercel Speed Insights est un outil qui mesure les performances réelles du site pour les visiteurs (temps de chargement, score Core Web Vitals). Il n'enregistre pas d'identifiants, pas de cookies, pas d'IP. C'est du monitoring de performance, pas du tracking utilisateur.

Le composant `<SpeedInsights />` est injecté dans le layout principal.

---

## Sitemap : @astrojs/sitemap

L'intégration `@astrojs/sitemap` génère automatiquement un fichier `/sitemap-index.xml` au build, listant toutes les pages du site. Ce fichier est utilisé par les moteurs de recherche pour indexer le site. Aucune configuration manuelle nécessaire.

---

## Tableau récapitulatif

| Composant | Outil | Version | Rôle |
|---|---|---|---|
| Framework | Astro | 4.16 | Génération du site statique |
| CSS | Tailwind CSS | 3.4 | Styles utilitaires |
| Recherche | Fuse.js | 7.4 | Recherche fulltext côté navigateur |
| Carte | Leaflet | 1.9 | Carte interactive des incidents |
| Markdown | marked | 18 | Rendu des pages wiki |
| Polices | Google Fonts | — | JetBrains Mono + Space Grotesk |
| Analytics | Vercel Speed Insights | 2.0 | Mesure de performance |
| Sitemap | @astrojs/sitemap | 3.7 | Indexation SEO |
| Hébergement | Vercel | — | Déploiement et CDN |
