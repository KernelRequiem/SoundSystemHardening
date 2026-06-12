# Rapport de conformisation du Wiki

Statut : terminé. Phase 1 (passe légère) puis phase 2 (refonte et complétion). Le wiki compte désormais 75 pages, contre 61 au départ, sans aucun lien interne cassé.

Ce rapport recense ce que j'ai corrigé, ce que j'ai créé, ce que j'ai laissé volontairement intact, et les points qui demandent ta décision.

## Phase 2 : refonte, complétion et corrections d'interface

### Compte GitHub unifié

J'ai remplacé toutes les occurrences de `menardrop-cpu` par `KernelRequiem`. Le wiki ne référence plus qu'un seul dépôt.

### 14 pages créées

Les liens menaient auparavant vers des pages inexistantes. Je les ai toutes créées, avec le même gabarit (résumé, statut, mise à jour, section En bref, sources, voir aussi) :

Zones grises et failles, Techniques de contournement, Autorisation locale tacite, Couverture médiatique dissuasive, Présence de témoins neutralisante, Déclaration stratégique, Carhaix 2025 (pourquoi l'intervention), Redon 2021 (la messe techno), Phalsbourg 2024, Teknival de Marigny (avant et après), plus quatre fiches cyber-opsec : Modèle de menace, Métadonnées et EXIF, Identités numériques, Compartimentation.

Les études de cas s'appuient sur les faits déjà sourcés dans le wiki. La page Phalsbourg est marquée comme partielle car les sources primaires manquent : je n'ai inventé aucun fait.

### Liens internes entièrement réparés

Au delà des liens Markdown, j'ai corrigé les liens de type `[[Page]]` qui pointaient vers de mauvais slugs (Strategie-Resistance, Veille, Axe-Politique, Axe-Juridique, etc.) et le lien malformé en tête de la page Sound Systems. Vérification finale : zéro lien interne cassé sur les 75 pages.

### Refonte design appliquée à toutes les pages

J'ai amélioré le gabarit de rendu commun, ce qui met à niveau toutes les pages d'un coup :

* Un bandeau de catégorie avec retour vers l'index, au dessus de chaque titre.
* L'en-tête de page (résumé, statut, mise à jour) rendu comme une fiche premium au lieu de boîtes empilées. Pour cela j'ai modifié le moteur de rendu afin de fusionner les lignes de citation consécutives.
* Des accents néon sur les titres de section et les puces, un meilleur espacement de lecture.

### Page d'accueil

J'ai retiré le tiret restant dans la phrase de présentation et refondu le bloc EUX / NOUS : opposition visuelle rouge (répression) contre vert (résistance), liseré dégradé, flèche animée de transformation.

### Top barre

J'ai ajouté un lien WIKI vers l'index, et retiré le tiret du libellé de navigation VPN, Tor et réseau anonyme.

### Build vérifié

Le projet compile : toutes les pages et routes sont générées sans erreur. Les seuls blocages rencontrés sont des permissions du système de fichiers de l'environnement de travail, sans rapport avec le code.

### En-têtes harmonisés sur toutes les pages

J'ai ajouté la fiche meta (Résumé, Statut, Mise à jour) aux 43 pages qui ne l'avaient pas encore, en préservant leur contenu. La page Médias et Propriété, qui n'avait pas de titre et affichait son bloc technique en clair, a reçu un vrai titre. Résultat : les 73 pages de contenu disposent désormais du même en-tête, rendu en fiche premium. Il ne reste aucune page hétérogène.

---

## Phase 1 : passe légère initiale

J'ai préservé la structure et la voix éditoriale existante du wiki, je n'ai rien réorganisé, je n'ai ajouté aucun fait non sourcé.

## 1. Bannissement des tirets de ponctuation

Le wiki n'utilisait aucun tiret quadratin ni demi cadratin. En revanche, 30 pages employaient le tiret simple comme signe de ponctuation. J'ai traité 712 occurrences selon le contexte :

* Dans les titres, le tiret devient deux points. Exemple : « 1993 - Fondation en France » est devenu « 1993 : Fondation en France ».
* Dans une apposition encadrée par deux tirets, j'ai posé des parenthèses. Exemple : « Leur son - dark tekno, hardtekno - est » est devenu « Leur son (dark tekno, hardtekno) est ».
* Dans les bibliographies et les lignes prose, le tiret devient virgule, et le tiret qui précédait une URL devient un point. Exemple : « InfoLibertaire - Manifestive 2025 - https://... » est devenu « InfoLibertaire, Manifestive 2025. https://... ».
* Les cellules de tableau vides (un tiret seul entre deux barres) ont été conservées telles quelles. C'est une convention de tableau, pas une ponctuation.
* Tout le contenu des blocs de code, des templates et des schémas ASCII a été laissé verbatim, y compris leurs tirets.

Résultat vérifié : zéro tiret quadratin, zéro tiret demi cadratin, zéro tiret de ponctuation hors code et hors tableau.

## 2. Liens internes réparés

J'ai remappé 25 liens internes cassés vers les vrais noms de fichiers (problèmes d'accents, de casse ou de suffixe « .md »).

| Lien d'origine | Cible corrigée |
| --- | --- |
| Histoire-Culture | Histoire-&-Culture |
| Incidents-Repressifs | Incidents-répressifs |
| Patrimoine-Culturel | Patrimoine-culturel |
| Strategie-Resistance | Stratégie-résistance |
| Sound-Systems | Sound-System |
| Urgence_Immediata | Urgence-immédiate |
| Axe-Juridique | Juridique |
| Axe-Politique | Politique |
| Axe-Organisationnel | Organisationnel |
| Axe-Culturel | Culturel |
| Axe-Sanitaire-RdR | Axe-sanitaire |
| messagerie-chiffree.md | messagerie-chiffree |
| surveillance-mobile.md | surveillance-mobile |
| reseau-anonymisation.md | reseau-anonymisation |

J'ai aussi corrigé une ancre de sommaire défectueuse dans Juridique (inversion de lettres : « lignpiggn » au lieu de « ligpniggn » pour le titre IGPN/IGGN). J'ai recalé tous les textes de sommaire touchés par le passage du tiret aux deux points, en miroir exact de la fonction de slug du moteur de rendu, pour qu'aucune ancre ne se brise.

Vérification finale : zéro ancre de sommaire cassée sur l'ensemble du wiki.

## 3. Fautes corrigées

* « consester » est devenu « contester » (Home).
* « dokumentées » est devenu « documentées » (Chronologie).

Note : le bac à sable ne dispose d'aucun dictionnaire orthographique français, je n'ai donc pas pu lancer un correcteur automatique exhaustif. Les deux fautes ci dessus ont été repérées à la lecture. Une relecture humaine reste utile sur les pages les plus denses.

## 4. Points qui demandent ta décision

### Liens vers des pages qui n'existent pas encore

Le sommaire et certaines pages renvoient vers 10 pages jamais créées. Les liens restent en place mais mènent à une page « non trouvée » :

Autorisation-Locale-Tacite, Carhaix-Pourquoi-Intervention, Couverture-Mediatique-Dissuasive, Declaration-Strategique, Phalsbourg-Succes-Absence-Intervention, Presence-Temoins-Neutralisante, Redon-Messe-Techno, Techniques-Contournement, Teknival-Marigny-Avant-Apres, Zones-Grises-Failles.

À trancher : créer ces pages, ou retirer les liens en attendant.

### Documents cyber-opsec référencés mais absents du wiki

Quatre fichiers sont cités en prérequis dans les pages OPSEC (messagerie-chiffree, reseau-anonymisation, surveillance-mobile) mais n'existent pas localement :

threat-model.md, metadonnees-exif.md, identites-numeriques.md, compartimentation.md.

Je ne les ai pas redirigés automatiquement, car j'ai relevé une incohérence de dépôt GitHub (voir plus bas). À trancher : importer ces pages dans le wiki, ou pointer les liens vers le dépôt distant.

### Incohérence du compte GitHub

Le wiki mélange deux propriétaires de dépôt dans ses URL : « KernelRequiem/digital-rights » (barre latérale) et « menardrop-cpu/digital-rights » (corps de Juridique). L'un des deux est probablement obsolète. À uniformiser.

### Doublon possible Axe sanitaire

Il existe deux fichiers proches : Axe-sanitaire.md et Sanitaire.md. J'ai pointé le lien « Axe-Sanitaire-RdR » vers Axe-sanitaire. Si Sanitaire.md est la version canonique, il faut inverser ce choix et fusionner les deux.

## 5. Ce que je n'ai pas touché, volontairement

* La structure des pages, la hiérarchie des titres et l'ordre des sections restent intacts (consigne de passe légère).
* Les emojis décoratifs en tête de titre (maison, attention, cadenas) sont conservés. Les retirer relève d'un choix de direction artistique à part entière, pas d'un nettoyage de ponctuation.
* Aucun fait, chiffre, date ou citation n'a été ajouté ni reformulé sur le fond. Je me suis limité à la forme.
