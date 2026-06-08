# Documentation technique — SoundSystemHardening

> Ce dossier `/docs` n'est pas publié sur le site. Il documente précisément comment le projet a été construit, quelles technologies ont été utilisées et pourquoi. Il est destiné aux contributeurs et à moi-même pour maintenir le projet dans le temps.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](./stack.md)
3. [Architecture du projet](./architecture.md)
4. [Fonctionnalités](./fonctionnalites.md)
5. [Design system](./design-system.md)
6. [Déploiement](./deploiement.md)

---

## 1. Vue d'ensemble

SoundSystemHardening est un wiki statique d'autodéfense juridique et numérique pour le mouvement free party. "Statique" signifie que le site est généré une fois au moment du build (de la compilation) et livré sous forme de fichiers HTML/CSS/JS purs — sans serveur, sans base de données, sans traitement à la demande.

Ce choix n'est pas anodin : un site statique ne peut pas être hacké via une injection SQL, ne loggue pas les IP des visiteurs par défaut, survit à une charge de trafic élevée sans infrastructure coûteuse, et peut être hébergé gratuitement. C'est une décision de sécurité autant que d'économie.

**Ce que le site fait :**
- Rendre lisible ~60 pages de wiki juridique et opérationnel
- Proposer une carte interactive des incidents répressifs en France
- Fournir un arbre de décision interactif pour les situations terrain
- Offrir un outil de génération de manifeste de saisie (RIG-LOCK)
- Garantir une page d'urgence utilisable en situation de stress
- Permettre la recherche fulltext dans tout le wiki, sans serveur
