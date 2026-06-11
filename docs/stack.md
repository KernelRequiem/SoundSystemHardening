# Stack technique

J'explique ici chaque technologie que j'utilise et pourquoi je l'ai choisie. L'objectif est qu'un contributeur, même peu technique, comprenne comment l'ensemble tient debout.

## Le cadre : Astro 4

Astro est le framework qui orchestre tout le site. Son rôle est de prendre mes fichiers sources (`.astro`, `.md`, `.ts`, `.json`) et de les transformer en site web livrable.

J'ai choisi Astro pour son modèle « zéro JavaScript par défaut ». Contrairement à Next.js qui envoie un gros paquet de JavaScript au navigateur pour chaque page, Astro n'envoie du JavaScript que là où c'est explicitement nécessaire. Le résultat : des pages qui s'affichent très vite, même sur une connexion mobile faible en zone rurale, ce qui est exactement le contexte d'usage d'un rave.

Un fichier `.astro` ressemble à du HTML avec une section de code (le « frontmatter ») délimitée par `---`. Ce code s'exécute au moment de la construction du site, pas dans le navigateur du visiteur.

```astro
---
// Ce code s'exécute à la construction, pas chez le visiteur
const titre = "Bonjour"
---
<h1>{titre}</h1>
```

Point important sur le mode de rendu : j'utilise Astro en mode `hybrid`. Cela signifie que la grande majorité des pages sont pré-générées en HTML statique (rapides, sans serveur), mais que quelques routes précises (les formulaires) tournent côté serveur quand c'est indispensable. C'est le meilleur des deux mondes : la vitesse du statique partout, la puissance du serveur seulement là où un formulaire doit envoyer un email ou enregistrer un signalement.

**Version utilisée :** Astro 4.16

---

## CSS : Tailwind CSS 3

Tailwind est une bibliothèque de classes CSS utilitaires. Au lieu d'écrire du CSS dans un fichier à part, j'applique des classes directement sur les éléments HTML.

```html
<div class="bg-black border border-green-400 p-4 rounded">...</div>
```

Tailwind ne génère que le CSS correspondant aux classes réellement utilisées dans le projet, ce qui donne une feuille de style très légère. J'étends Tailwind avec ma propre palette de couleurs (voir le design system), avec des noms parlants comme `neon-green` ou `dedsec-black`.

**Version utilisée :** Tailwind CSS 3.4

---

## Recherche : Fuse.js

Fuse.js est une bibliothèque de recherche floue qui fonctionne entièrement dans le navigateur, sans serveur. « Floue » signifie qu'elle tolère les fautes de frappe : chercher « gav » trouve « garde à vue », chercher « ripost » trouve « RIPOST 2026 ».

Au moment de la construction, je génère un fichier `/search-index.json` qui contient le titre, les sous-titres et un extrait de chaque page wiki. Le navigateur télécharge cet index une seule fois, puis toutes les recherches se font localement. Aucune requête de recherche n'est jamais envoyée ni enregistrée nulle part, ce qui est un choix de confidentialité délibéré.

**Version utilisée :** Fuse.js 7.4

---

## Carte : Leaflet

Leaflet est la bibliothèque open source de cartographie la plus répandue. Elle affiche une carte interactive en utilisant des tuiles d'OpenStreetMap, l'alternative libre à Google Maps, sans clé API et sans tracking publicitaire.

J'affiche avec Leaflet les incidents répressifs stockés dans `incidents.json`, chaque incident devenant un marqueur coloré selon son type. La bibliothèque n'est chargée que sur la page carte, pas sur tout le site.

**Version utilisée :** Leaflet 1.9

---

## Rendu Markdown : marked

Le wiki est écrit en Markdown, un format texte simple où `# Titre` devient un grand titre et `**gras**` devient du gras. J'utilise `marked` pour convertir ce Markdown en HTML au moment de la construction, et `@astrojs/mdx` pour les pages qui mélangent Markdown et composants Astro.

---

## Polices : auto-hébergées

J'utilise trois polices : Bebas Neue pour les grands titres, Space Grotesk pour le corps de texte, et JetBrains Mono (monospace, façon terminal) pour les labels et le code.

Point de sécurité essentiel : ces polices sont servies depuis mon propre domaine, pas depuis Google Fonts. Charger une police depuis Google enregistre l'adresse IP de chaque visiteur chez Google à chaque page. Pour un projet qui enseigne à éviter la surveillance, c'était inacceptable. Les fichiers de police sont donc stockés dans mon dossier `public/fonts/` et déclarés en `@font-face` local. Le visiteur ne contacte que mon site.

---

## Email transactionnel : SMTP

Le formulaire de contact envoie un email via un serveur SMTP. Les identifiants de connexion vivent uniquement côté serveur, dans des variables d'environnement, jamais dans le code. Le traitement se fait dans une route serveur Astro (rendue possible par le mode hybrid), avec un piège anti-robot (« honeypot ») pour filtrer les spams automatisés.

---

## Signalements : Airtable

Les signalements d'incidents envoyés via la carte sont enregistrés dans Airtable, avec un statut « En attente » jusqu'à validation manuelle. Le jeton d'accès utilisé par le serveur est limité à l'écriture seule : même en cas de fuite, il ne permet pas de lire la base.

---

## Sitemap : @astrojs/sitemap

Cette intégration génère automatiquement un plan du site (`sitemap-index.xml`) listant toutes les pages, ce qui aide les moteurs de recherche à indexer le contenu. Aucune configuration manuelle nécessaire.

---

## Tableau récapitulatif

| Composant | Outil | Version | Rôle |
|---|---|---|---|
| Framework | Astro (mode hybrid) | 4.16 | Génération du site, routes serveur |
| CSS | Tailwind CSS | 3.4 | Styles utilitaires |
| Recherche | Fuse.js | 7.4 | Recherche fulltext côté navigateur |
| Carte | Leaflet | 1.9 | Carte interactive des incidents |
| Markdown | marked | 18 | Rendu des pages wiki |
| Polices | Auto-hébergées | n/a | Bebas Neue, Space Grotesk, JetBrains Mono |
| Email | SMTP via nodemailer | n/a | Formulaire de contact |
| Signalements | Airtable | n/a | Base des incidents (write-only côté serveur) |
| Sitemap | @astrojs/sitemap | 3.7 | Indexation moteurs de recherche |
| Hébergement | VPS auto-hébergé (Docker) | n/a | Voir doc Déploiement |
