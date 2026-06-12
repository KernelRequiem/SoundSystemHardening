# Modèle de menace

> Résumé : méthode pour définir qui veut nous nuire, ce que l'on protège et jusqu'où aller, avant de choisir le moindre outil.
> Statut : stable
> Mise à jour : juin 2026
> Dossier : cyber-opsec

Aucun outil de sécurité n'a de sens sans modèle de menace. Chiffrer, anonymiser ou cloisonner ne sert à rien si l'on ne sait pas contre qui et pourquoi. Cette page pose la grille d'analyse à appliquer avant tout choix technique. Elle est le prérequis des autres fiches OPSEC.

---

## En bref

* Un modèle de menace répond à cinq questions : que protège-t-on, contre qui, quelles sont leurs capacités, quelles conséquences en cas d'échec, jusqu'où sommes nous prêts à aller.
* La sécurité parfaite n'existe pas. L'objectif est d'élever le coût de l'attaque au dessus du bénéfice attendu par l'adversaire.
* Un modèle surdimensionné est aussi nuisible qu'un modèle absent : il épuise et pousse à l'abandon des bonnes pratiques.

## Les cinq questions

La démarche tient en cinq questions, à se poser dans l'ordre.

Que protège-t-on ? Des identités, des lieux, des dates, des listes de contacts, du matériel, des communications. Chaque actif a une valeur différente.

Contre qui ? Un voisin curieux, un opposant politique, une plateforme commerciale, une enquête de gendarmerie, un service de renseignement. Les capacités varient du tout au tout.

De quoi l'adversaire est il capable ? Lecture d'un téléphone saisi, réquisition d'un opérateur, exploitation des métadonnées, infiltration, analyse d'images. Voir [[surveillance-mobile]].

Quelles conséquences en cas d'échec ? Une amende, une garde à vue, une mise en cause pénale comme organisateur, l'exposition d'un tiers. Plus la conséquence est lourde, plus l'effort se justifie.

Jusqu'où est on prêt à aller ? La sécurité a un coût en confort, en temps et en argent. Un modèle doit rester tenable dans la durée.

## Profils d'adversaires

Tous les adversaires n'ont pas les mêmes moyens. On distingue utilement plusieurs niveaux.

```
Niveau 1  Curieux, proches, presse        Capacité faible
Niveau 2  Plateformes, annonceurs         Collecte massive passive
Niveau 3  Enquête locale, gendarmerie     Réquisition, saisie, expertise
Niveau 4  Renseignement, moyens d'État    Interception, capacités avancées
```

La plupart des situations du mouvement relèvent des niveaux 2 et 3. Calibrer pour le niveau 4 par défaut conduit à des pratiques intenables et contre productives.

## Surface d'exposition

La surface d'exposition est l'ensemble des points par lesquels une information peut fuir : un téléphone, un compte, une photo publiée, un déplacement, une conversation. Réduire cette surface, c'est diminuer le nombre de prises offertes à l'adversaire. Le cloisonnement et la séparation des identités servent cet objectif. Voir [[compartimentation]] et [[identites-numeriques]].

## Le piège du surdimensionnement

Une erreur fréquente consiste à empiler les outils sans modèle. Multiplier les couches que l'on ne maîtrise pas crée de fausses certitudes et de vraies failles. Mieux vaut quelques pratiques simples, comprises et tenues, qu'un arsenal théorique abandonné au premier obstacle.

## Voir aussi

* [[Sécurite-Numerique]]
* [[messagerie-chiffree]]
* [[compartimentation]]
