# Fonctionnalités

## 1. Wiki : rendu de Markdown en pages HTML

**Fichiers concernés :** `src/pages/wiki/[slug].astro`, `src/content/wiki/*.md`

### Ce que ça fait

Chaque fichier `.md` du dossier wiki devient une page web accessible via `/wiki/nom-du-fichier`. Un visiteur qui accède à `/wiki/Contacts-Allies` reçoit une page HTML complète, avec mise en forme, table des matières et navigation.

### Comment ça fonctionne techniquement

Le fichier `[slug].astro` contient une fonction `getStaticPaths()` qui s'exécute au moment du build. Elle lit la liste des fichiers `.md`, et pour chacun, déclare une route à générer. C'est ce qu'Astro appelle le **Static Site Generation** (SSG).

Le Markdown est ensuite converti en HTML par un parser maison. Ce parser utilise des **expressions régulières** (des patterns de recherche/remplacement) pour transformer la syntaxe Markdown en balises HTML :

```
# Titre  →  <h1>Titre</h1>
**gras**  →  <strong>gras</strong>
[lien](url)  →  <a href="url">lien</a>
```

Les blocs de code (délimités par ```) sont préservés avant le remplacement pour éviter que leur contenu soit altéré, puis réinsérés après.

### Pourquoi pas le Content Collections d'Astro ?

Astro propose un système natif appelé "Content Collections" pour gérer du contenu Markdown. Il n'est pas utilisé ici car le projet a besoin de plus de contrôle sur le rendu HTML (styles spécifiques, comportement des liens, etc.).

---

## 2. Recherche fulltext sans serveur

**Fichiers concernés :** `src/pages/search.astro`, `src/pages/search-index.json.ts`

### Ce que ça fait

Un champ de recherche sur `/search` permet de trouver n'importe quelle information dans les ~60 pages wiki en temps réel, avec tolérance aux fautes de frappe. Taper "gav" trouve les pages qui parlent de garde à vue. Taper "ripost" trouve la stratégie contre RIPOST 2026.

### Comment ça fonctionne techniquement

**Étape 1 — Build :** Le fichier `search-index.json.ts` s'exécute au moment du build. Il lit chaque fichier `.md`, en extrait le titre (premier `# H1`), les sous-titres (`## H2` et `### H3`), et un extrait du contenu en texte brut (500 caractères, balises Markdown supprimées). Il génère un fichier JSON statique à `/search-index.json`.

```json
[
  {
    "slug": "Contacts-Allies",
    "title": "Contacts Alliés",
    "content": "Les structures, collectifs...",
    "headings": ["Urgence juridique", "FSJS", "..."],
    "url": "/wiki/Contacts-Allies"
  },
  ...
]
```

**Étape 2 — Navigateur :** Quand un visiteur ouvre `/search`, la page télécharge ce fichier JSON. Fuse.js charge l'index en mémoire. Chaque frappe au clavier déclenche une recherche Fuse sur les champs `title` (poids 50%), `headings` (30%), `content` (20%). L'algorithme calcule un score de similarité pour chaque page et affiche les résultats triés par pertinence.

**L'avantage :** zéro serveur, zéro base de données, zéro API. La recherche fonctionne même hors ligne (si la page a déjà été chargée), et aucune requête de recherche n'est enregistrée nulle part.

---

## 3. Carte interactive des incidents

**Fichiers concernés :** `src/pages/map.astro`, `src/data/incidents.json`

### Ce que ça fait

Une carte de France interactive affiche les incidents répressifs documentés (saisies, GAV, charges, blessures, interdictions préfectorales). Chaque marqueur est cliquable et affiche les détails de l'incident. La carte est filtrable par type d'incident et par département.

### Comment ça fonctionne techniquement

Leaflet est chargé via CDN uniquement sur la page `/map` (pas sur tout le site, pour ne pas alourdir les autres pages). Les tuiles de fond de carte viennent d'OpenStreetMap (open source, sans clé API, sans tracking Google).

Les données viennent de `incidents.json`. Au chargement de la page, JavaScript parcourt ce fichier et crée un marqueur Leaflet pour chaque incident, en colorant selon le type. La sidebar latérale est générée dynamiquement depuis les mêmes données.

Le fichier `incidents.json` est la seule "base de données" du projet. L'ajouter un incident = ajouter un objet JSON dans ce fichier, pusher sur GitHub, et le site se met à jour automatiquement au prochain déploiement.

---

## 4. Arbre de décision interactif

**Fichiers concernés :** `src/pages/decision.astro`, `src/data/decision.ts`

### Ce que ça fait

Une interface guidée pose des questions à l'utilisateur (Avant / Pendant / Après un contrôle) et le mène vers des conseils adaptés à sa situation exacte : contrôle d'identité, fouille, interpellation, garde à vue. Chaque nœud terminal affiche les droits applicables, les actions recommandées, les pièges à éviter, et des liens vers les ressources pertinentes.

### Comment ça fonctionne techniquement

L'arbre de décision est un **graphe orienté** : chaque nœud a un identifiant unique (`id`), un texte, et une liste de choix possibles, chaque choix pointant vers l'identifiant du nœud suivant.

```typescript
{
  id: "fouille-consentement",
  text: "As-tu ouvert le véhicule toi-même ?",
  choices: [
    { label: "Oui", next: "fouille-consentie" },
    { label: "Non", next: "fouille-forcee" }
  ]
}
```

Le moteur de rendu JavaScript charge le nœud initial, affiche ses choix sous forme de boutons, et remplace le contenu avec le nœud suivant à chaque clic. Il n'y a pas de rechargement de page. L'état actuel (quel nœud est affiché) est géré en mémoire JavaScript.

Les types TypeScript (`NodeType`, `Phase`, `Severity`, `Resource`) garantissent que chaque nœud de données respecte la structure attendue. Si un contributeur ajoute un nœud mal formé, TypeScript signale l'erreur au moment du build plutôt qu'en production.

---

## 5. RIG-LOCK : générateur de manifeste de saisie

**Fichier concerné :** `src/pages/rig-lock.astro`

### Ce que ça fait

RIG-LOCK est un outil de terrain qui génère un PDF de manifeste de saisie horodaté : liste du matériel confisqué, identité des agents, circonstances, estimation de valeur. Ce document sert de pièce dans un recours juridique.

### Comment ça fonctionne techniquement

Tout se passe dans le navigateur, côté client. Aucune donnée n'est envoyée à un serveur. Le formulaire collecte les informations, JavaScript les assemble dans une structure documentaire, et une bibliothèque de génération PDF (chargée en local) produit le fichier téléchargeable.

L'horodatage utilise `new Date()` du navigateur, en heure locale. Le PDF est généré en mémoire (objet `Blob`), puis proposé au téléchargement via un lien temporaire (`URL.createObjectURL`).

**Implication sécurité :** comme tout le traitement est local, aucune requête réseau n'est effectuée lors de la génération. Un outil de surveillance réseau ne peut pas intercepter le contenu du manifeste.

---

## 6. Page urgence avec accordéons

**Fichier concerné :** `src/pages/urgence.astro`

### Ce que ça fait

La page `/urgence` propose 5 scénarios terrain (contrôle routier, fouille, saisie, garde à vue, besoin d'avocat). Cliquer sur un scénario l'ouvre en accordéon et affiche immédiatement les réflexes applicables, les phrases exactes à prononcer, et les contacts d'urgence cliquables. Zéro navigation vers une autre page.

### Comment ça fonctionne techniquement

L'UX est pilotée par une classe CSS `.is-open` toggleée par JavaScript. Quand un utilisateur clique sur une card :

1. La classe `.is-open` est retirée de toutes les autres cards (accordéon exclusif)
2. La classe `.is-open` est ajoutée à la card cliquée
3. En CSS, `.scenario-card.is-open .card-panel { display: block; }` révèle le contenu
4. Un `scrollIntoView()` fait défiler doucement vers la card ouverte si elle est hors écran

Le contenu de chaque card (réflexes, contacts) est directement embarqué dans le HTML de la page. Il n'y a aucun appel réseau lors de l'ouverture d'une card.

Les contacts sensibles (numéros de téléphone, emails) utilisent des liens natifs `tel://` et `mailto://` : sur mobile, cliquer sur un numéro ouvre directement le téléphone.

---

## 7. Sidebar avec accordéons de navigation

**Fichier concerné :** `src/layouts/Layout.astro`

### Ce que ça fait

La sidebar contient ~10 sections de navigation (Droits & Libertés, Contre RIPOST, Stratégie, etc.). Chaque section est un accordéon : cliquer sur le titre de section déroule la liste des pages, cliquer à nouveau la referme. La section contenant la page actuellement visitée s'ouvre automatiquement.

### Comment ça fonctionne techniquement

Astro transmet le `currentPath` (l'URL actuelle) à chaque lien de la sidebar. Un lien dont `href === currentPath` reçoit la classe `active`. Au chargement de la page, JavaScript vérifie si un lien `active` est présent dans chaque section. Si oui, la section est ouverte par défaut.

Les accordéons sont gérés avec les classes CSS `open` / sans `open`, et un `max-height` en CSS pour l'animation de fermeture/ouverture.

---

## 8. Barre de progression de lecture

**Fichier concerné :** `src/layouts/Layout.astro` (script inline)

### Ce que ça fait

Une ligne verte en haut de page avance proportionnellement à la progression du scroll, indiquant où on en est dans la lecture d'une page.

### Comment ça fonctionne techniquement

```javascript
const update = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (scrollTop / docHeight * 100) + '%';
};
window.addEventListener('scroll', update, { passive: true });
```

L'event listener `scroll` est déclaré avec `{ passive: true }`, ce qui signifie qu'il ne bloquera jamais le rendu de la page (il ne peut pas appeler `preventDefault()`). C'est une optimisation de performance standard.

---

## 9. Thème clair / sombre

**Fichier concerné :** `src/layouts/Layout.astro`

### Ce que ça fait

Un bouton dans la topbar permet de basculer entre le thème sombre (par défaut) et un thème clair. Le choix est mémorisé entre les sessions.

### Comment ça fonctionne techniquement

Le thème est stocké dans `localStorage` sous la clé `theme`. À chaque chargement de page, le script lit cette valeur et applique l'attribut `data-theme="dark"` ou `data-theme="light"` sur la balise `<html>`. En CSS, les variables de couleur changent selon cet attribut.

---

## 10. PWA (Progressive Web App)

**Fichiers concernés :** `public/manifest.json`, balises `<meta>` dans le layout

### Ce que ça fait

Le site peut être "installé" sur un téléphone Android ou iOS comme une application native. Il apparaît sur l'écran d'accueil avec une icône et s'ouvre sans la barre d'adresse du navigateur.

### Comment ça fonctionne techniquement

Le fichier `manifest.json` déclare le nom, les icônes, la couleur de thème et le mode d'affichage de l'application. Les balises `<meta>` spécifiques Apple (`apple-mobile-web-app-capable`, etc.) activent ce comportement sur iOS. Aucun Service Worker n'est implémenté (pas de fonctionnalité hors ligne complète), mais l'installation est possible.

---

## 11. SEO et Open Graph

**Fichier concerné :** `src/layouts/Layout.astro`

### Ce que ça fait

Chaque page a des métadonnées adaptées pour les moteurs de recherche et les prévisualisations sur réseaux sociaux (quand on partage un lien sur Signal, Telegram, Twitter, etc.).

### Comment ça fonctionne techniquement

Le layout accepte `title`, `description` et `ogImage` comme props. Il génère les balises standard :

```html
<meta name="description" content="..." />
<meta property="og:title" content="..." />
<meta property="og:image" content="..." />
<link rel="canonical" href="https://soundsystemhardening.fr/..." />
```

La balise `canonical` indique aux moteurs de recherche l'URL officielle d'une page, évitant les problèmes de contenu dupliqué. Le sitemap généré par `@astrojs/sitemap` liste toutes les URLs pour faciliter l'indexation.
