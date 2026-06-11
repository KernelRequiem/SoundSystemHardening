# SoundSystemHardening

Wiki d'autodéfense juridique et numérique pour le mouvement free party : droits face aux forces de l'ordre, sécurité numérique (OpSec), stratégie de résistance, et outils de terrain.

Site en production : [soundsystemhardening.fr](https://soundsystemhardening.fr)

## Ce que c'est

Une application web qui rassemble une soixantaine de pages de wiki juridique et opérationnel, une carte interactive des incidents répressifs, un arbre de décision pour les situations de terrain, et plusieurs outils côté client (chiffrement de messages, nettoyage de métadonnées d'images, horodatage, génération de manifeste de saisie).

Le principe directeur est simple : un site qui enseigne à se protéger de la surveillance ne doit lui-même exposer aucune donnée de ses visiteurs. Chaque choix technique découle de cette règle. Le détail de la posture de sécurité est dans [`SECURITY.md`](./SECURITY.md).

## Stack

J'utilise Astro 4 en mode `hybrid` : la quasi-totalité du site est pré-générée en HTML statique (rapide, sans serveur), et seules quelques routes précises (les formulaires) s'exécutent côté serveur quand c'est indispensable.

| Couche | Technologie |
|---|---|
| Framework | Astro 4 (mode hybrid, adapter Node) |
| Styles | Tailwind CSS 3 |
| Recherche | Fuse.js (fulltext, côté navigateur) |
| Carte | Leaflet + tuiles OpenStreetMap |
| Contenu wiki | Markdown rendu via marked |
| Polices | Auto-hébergées (Bebas Neue, Space Grotesk, JetBrains Mono) |
| Email | SMTP via nodemailer (formulaire de contact) |
| Signalements | Airtable (jeton write-only côté serveur) |
| Hébergement | VPS auto-hébergé, Coolify (Docker + Traefik) |

## Structure du projet

```
.
├── docs/             Documentation technique (non publiée sur le site)
├── public/           Fichiers servis tels quels (polices, favicons, manifest, service worker)
│   └── tools/        Versions HTML autonomes de certains outils
├── scripts/          Scripts utilitaires (build, favicons, synchronisation)
├── src/
│   ├── components/   Composants réutilisables
│   ├── content/wiki/ Pages du wiki en Markdown
│   ├── data/         incidents.json (carte), decision.ts (arbre de décision)
│   ├── layouts/      Layout universel
│   ├── pages/        Une page = une URL
│   │   └── api/      Routes serveur : contact, signalement, report, health
│   ├── scripts/      Logique TypeScript des outils
│   └── styles/       CSS global
├── astro.config.mjs
├── Dockerfile        Recette de construction du conteneur
├── package.json
├── README.md
└── SECURITY.md       Posture de sécurité (app + infra)
```

## Démarrage local

```bash
# Installer les dépendances (une seule fois)
npm install

# Serveur de développement
npm run dev
# → http://localhost:4321

# Construire la version de production
npm run build

# Prévisualiser le build localement
npm run preview
```

Les variables d'environnement nécessaires aux formulaires sont décrites dans [`.env.example`](./.env.example). Le fichier `.env` réel n'est jamais versionné.

## Déploiement

Le site est conteneurisé (voir [`Dockerfile`](./Dockerfile)) et déployé sur un VPS via Coolify. Un push sur la branche `main` déclenche automatiquement la construction de l'image et le redéploiement, avec HTTPS géré par le reverse proxy.

Détails et choix d'architecture : [`docs/deploiement.md`](./docs/deploiement.md).

## Contribuer au wiki

Ajouter ou corriger une page ne demande aucune compétence en développement :

1. Ouvrir le dossier `src/content/wiki/` sur GitHub
2. Éditer un fichier `.md` ou en créer un via l'interface GitHub
3. Valider le changement sur `main`
4. Le site se reconstruit et se redéploie automatiquement

## Documentation

- [`docs/`](./docs/) : stack, architecture, fonctionnalités, design system, déploiement
- [`SECURITY.md`](./SECURITY.md) : modèle de menace, durcissement application et infrastructure

## Licence

Contenu sous licence CC BY-SA 4.0.
