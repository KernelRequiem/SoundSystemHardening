# Design system

## Concept : "Operational Terminal"

L'identité visuelle est pensée autour d'un terminal opérationnel : un outil de travail, pas une vitrine. L'esthétique hacker/cypherpunk est assumée : fond très sombre, accents néon vert, typographie monospace, grille subtile en fond. Mais c'est au service d'une lisibilité maximale, pas d'un effet purement décoratif.

**Règles absolues définies dans le code source :**
- Pas de `neon-cyan` dans l'interface (réservé aux liens si besoin)
- Pas de `neon-pink` dans l'interface
- Pas de tirets quadratins (em-dash)
- Pas de `clip-path` sur les boutons
- Pas d'animation glitch sur du contenu informatif (décoratif uniquement)

---

## Palette de couleurs

Les couleurs sont définies comme **design tokens** dans `tailwind.config.mjs`. Elles ont des noms sémantiques plutôt que des valeurs brutes, ce qui rend le code lisible et facilite les modifications globales.

### Couleurs de fond

| Token Tailwind | Valeur hex | Usage |
|---|---|---|
| `dedsec-black` | `#0a0a0f` | Fond principal de toutes les pages |
| `dedsec-darker` | `#08080c` | Fond des cards, sidebar |
| `dedsec-dark` | `#13131a` | Fond des éléments légèrement surélevés |
| `dedsec-gray` | `#1a1a24` | Fond hover subtil |

### Couleurs de texte

| Token Tailwind | Valeur hex | Usage |
|---|---|---|
| `dedsec-text` | `#e8e8f0` | Corps de texte principal |
| `dedsec-muted` | `#7a7a8a` | Labels, métadonnées, texte secondaire |
| `dedsec-border` | `#2a2a3a` | Bordures, séparateurs |

### Couleurs d'accent

| Token Tailwind | Valeur hex | Usage |
|---|---|---|
| `neon-green` | `#00ff9f` | Accent principal : liens actifs, CTA, éléments importants |
| `neon-red` | `#ff2020` | Critique uniquement : urgence, danger, alertes |

### Variables CSS

En parallèle des tokens Tailwind, des variables CSS custom sont définies dans `global.css` :

```css
:root {
  --color-bg: #0a0a0f;
  --color-bg-dark: #08080c;
  --color-text: #e8e8f0;
  --color-green: #00ff9f;
  --color-border: #2a2a3a;
  --color-muted: #7a7a8a;
}
```

Ces variables permettent de changer le thème complet du site en modifiant une seule déclaration `:root`.

---

## Typographie

### JetBrains Mono

Police monospace (chaque caractère occupe exactement la même largeur). Utilisée pour :
- Tout le texte d'interface (labels, badges, navigation)
- Les codes et termes techniques
- Les métadonnées (dates, versions, numéros)

L'espacement lettres (`letter-spacing`) est systématiquement augmenté sur les éléments en uppercase : `tracking-widest` (Tailwind) ou `letter-spacing: 0.2em` en CSS direct. Ça améliore la lisibilité des textes courts en capitales.

### Space Grotesk

Police sans-serif géométrique moderne. Utilisée pour :
- Les titres de pages (`<h1>`)
- Les titres de sections importantes
- Les éléments de mise en valeur qui ne doivent pas paraître "froids"

La combinaison des deux polices crée une hiérarchie visuelle claire : la monospace signale "données, interface, technique", la sans-serif signale "titre, importance, humanité".

---

## Fond texturé

Le fond de page n'est pas un simple noir uni. Il combine :

```css
body {
  background-image:
    /* Point lumineux vert très subtil en haut à gauche */
    radial-gradient(circle at 20% 30%, rgba(0, 255, 159, 0.018) 0%, transparent 55%),
    /* Dégradé de noir à noir légèrement différent */
    linear-gradient(180deg, #0a0a0f 0%, #08080c 100%);
}

/* Grille de points verts quasi-invisibles */
body::after {
  background-image:
    linear-gradient(rgba(0, 255, 159, 0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 159, 0.015) 1px, transparent 1px);
  background-size: 48px 48px;
}
```

La grille (`0.015` d'opacité) est intentionnellement à la limite du perceptible. Sur un écran calibré elle est visible, sur un écran bas de gamme elle disparaît. C'est voulu : la texture est un bonus esthétique, pas un élément porteur d'information.

---

## Animations

Les animations sont définies dans `tailwind.config.mjs` et `global.css` :

### scan (ligne qui traverse l'écran)
```css
body::before {
  /* Ligne horizontale vert néon, quasi-transparente */
  animation: scan 10s linear infinite;
}
@keyframes scan {
  0%  { transform: translateY(-100%); }
  100%{ transform: translateY(100vh); }
}
```
Référence visuelle au scan des écrans CRT. Dure 10 secondes pour ne pas être distrayante.

### fadeIn (apparition des pages)
```css
@keyframes fadeIn {
  0%  { opacity: 0; transform: translateY(10px); }
  100%{ opacity: 1; transform: translateY(0); }
}
```
Appliqué sur `<article>` dans le layout via la classe `animate-fade-in`. Le léger mouvement vers le haut en même temps que l'apparition donne une sensation de "matérialisation" du contenu.

### pulse-neon (effet de pulsation des éléments actifs)
```css
@keyframes pulse-neon {
  0%, 100%{ box-shadow: 0 0 5px #00ff9f, 0 0 10px #00ff9f; }
  50%      { box-shadow: 0 0 20px #00ff9f, 0 0 30px #00ff9f; }
}
```
Utilisé sur les indicateurs de statut "LIVE" pour signaler l'état actif d'un système.

---

## Composants CSS récurrents

### `.btn-neon-primary`
Bouton CTA principal : fond vert néon, texte noir, ombre portée verte. Utilisé pour les actions primaires de la homepage.

### `.card-neon-tool`
Card de module : fond sombre, bordure subtile, transition de couleur au hover. Utilisée dans la grille de modules de la homepage.

### `.sidebar-link`
Lien de navigation sidebar : texte muted par défaut, vert au hover, bordure gauche colorée à l'état actif. L'état actif est déterminé par comparaison avec `currentPath` au moment du build.

### `.badge-critical`
Badge rouge utilisé pour signaler les éléments urgents ou critiques (RIPOST 2026, etc.).

### `.prose-dedsec`
Classe appliquée sur le conteneur `<article>` des pages wiki. Elle surcharge les styles Tailwind prose pour adapter la typographie au design system : couleurs, espacements, styles des `<h2>`, `<h3>`, `<code>`, `<table>`, etc.

---

## Thème clair

Le thème clair est défini via l'attribut `data-theme="light"` sur `<html>`. En CSS :

```css
[data-theme="light"] {
  --color-bg: #f5f5f7;
  --color-text: #1a1a2e;
  /* etc. */
}
```

Toutes les couleurs qui utilisent les variables CSS custom (`var(--color-bg)`) s'adaptent automatiquement. Les classes Tailwind hardcodées (`bg-dedsec-black`) ne s'adaptent pas : c'est un compromis de l'implémentation actuelle.
