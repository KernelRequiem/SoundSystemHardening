# Documentation technique : SoundSystemHardening

> Ce dossier `docs/` n'est pas publié sur le site. Il documente comment j'ai construit le projet, quelles technologies j'utilise et pourquoi. Il est destiné aux contributeurs et à moi-même pour maintenir le projet dans le temps.
>
> Les détails opérationnels sensibles (configuration serveur précise, secrets, règles réseau) ne sont volontairement pas ici. Ils vivent dans un dossier privé exclu de git.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](./stack.md)
3. [Architecture du projet](./architecture.md)
4. [Fonctionnalités](./fonctionnalites.md)
5. [Design system](./design-system.md)
6. [Déploiement](./deploiement.md)
7. Sécurité : voir `SECURITY.md` à la racine du projet

---

## 1. Vue d'ensemble

SoundSystemHardening est un wiki d'autodéfense juridique et numérique pour le mouvement free party : droits face aux forces de l'ordre, sécurité numérique (OpSec), stratégie de résistance, et outils de terrain.

Techniquement, c'est une application Astro en mode `hybrid`. La quasi-totalité du site est pré-générée en pages HTML statiques au moment de la construction, ce qui le rend rapide et difficile à attaquer. Seules quelques routes serveur précises (les formulaires de contact et de signalement) s'exécutent à la demande, parce qu'elles doivent envoyer un email ou écrire dans une base.

J'héberge le site moi-même sur un serveur que je contrôle, dans un conteneur Docker. Ce choix d'auto-hébergement n'est pas un détail : il me permet de garantir qu'aucun tiers ne voit passer le trafic des visiteurs, ce qui est la condition de base pour un projet qui enseigne à se protéger de la surveillance.

**Ce que le site fait :**

- Rendre lisibles une soixantaine de pages de wiki juridique et opérationnel
- Proposer une carte interactive des incidents répressifs en France
- Fournir un arbre de décision interactif pour les situations de terrain
- Offrir des outils de terrain locaux : génération de manifeste de saisie, chiffrement de messages, nettoyage de métadonnées d'images, horodatage
- Garantir une page d'urgence utilisable en situation de stress, disponible même hors ligne
- Permettre la recherche fulltext dans tout le wiki, sans serveur et sans laisser de trace

**Le principe directeur :** chaque octet qui part du navigateur d'un visiteur vers un tiers est un risque. Tout le projet est construit pour que le visiteur ne contacte que mon domaine, et les rares exceptions techniques nécessaires (tuiles de carte) sont documentées et maîtrisées.
