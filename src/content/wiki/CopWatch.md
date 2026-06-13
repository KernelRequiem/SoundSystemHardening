# CopWatch

> Résumé : observatoire documentaire des tactiques, méthodes et moyens observés des forces de l'ordre contre le mouvement free party et les sound systems.
> Statut : actif
> Mise à jour : juin 2026

**J'ai construit CopWatch comme un outil de documentation publique et structurée. Il recense, source et gradue les tactiques que j'observe dans la répression des rassemblements festifs. Il ne sert pas à éviter les contrôles : il sert à connaître mes droits, à documenter les pratiques et à préparer mes recours.**

L'outil interactif est disponible sur la page [CopWatch](/copwatch). Cette page wiki en décrit la méthode, la structure et les règles de rédaction.

---

## Pourquoi cet outil

Je pars d'un constat simple. La répression des free parties suit des schémas répétés : veille en amont, arrêté préfectoral, filtrage routier, saisie du matériel, garde à vue, amendes. Ces schémas sont documentés de façon dispersée, dans la presse locale, les retours de collectifs et les comptes rendus juridiques. CopWatch les rassemble dans un format unique, comparable et vérifiable.

L'objectif est triple. Documenter ce qui se passe réellement sur le terrain, en m'appuyant sur des sources publiques. Relier chaque tactique aux droits applicables et aux voies de recours, via l'[Outil Décision](/decision). Donner une lecture d'ensemble qui fait apparaître les tendances, grâce à la heatmap tactique par phase.

---

## Charte documentaire

Cette charte est impérative. Elle conditionne tout ce que j'écris dans une fiche.

Je décris ce qui est observé, je le source, j'en gradue la fiabilité. Je ne fournis aucun conseil d'évitement ni de contournement d'un contrôle. Je ne donne aucune instruction susceptible d'entraver l'action des forces de l'ordre. Le seul registre actif que je m'autorise est défensif et juridique : les droits applicables et les recours, présentés par renvoi vers l'Outil Décision et le wiki juridique.

Concrètement, une fiche répond à la question « qu'est-ce qui est fait, par qui, sur quel fondement, et comment le contester en droit ». Elle ne répond jamais à la question « comment y échapper ». Cette ligne n'est pas une précaution de façade : elle garantit que l'outil reste un instrument de documentation et de défense, utilisable sans risque par les personnes du mouvement comme par les juristes et les journalistes.

---

## Structure de l'outil

L'outil repose sur trois briques.

Les **fiches tactiques** sont l'unité de base. Chaque fiche décrit une tactique observée selon un gabarit fixe (voir le template plus bas). Elles sont identifiées par un code stable du type `CW-CTRL-01`.

La **heatmap** est la vue d'ensemble. Elle croise chaque tactique avec les trois phases du cycle (avant, pendant, après) et colore chaque case selon le niveau de menace documenté. Elle se lit en quelques secondes et fait apparaître où se concentre la pression. Elle complète la [carte géographique](/map) des incidents, qui répond à la question « où », là où la heatmap répond à la question « quand et avec quelle intensité ».

Les **renvois croisés** relient l'observation à l'action. Chaque fiche pointe vers les nœuds de l'Outil Décision pertinents et vers les pages wiki de référence. Une tactique documentée n'est donc jamais un cul-de-sac : elle débouche toujours sur les droits et les recours correspondants.

---

## Catégories

Je classe les tactiques en neuf familles. Ce découpage suit la logique opérationnelle, du renseignement amont à la réponse judiciaire aval.

Renseignement et veille. Administratif et préfectoral. Contrôle et filtrage. Surveillance aérienne. Intervention et force. Saisie de matériel. Numérique et données. Judiciaire et sanctions. Médiatique et dissuasion.

---

## Échelle de menace

Je gradue l'impact observé de chaque tactique sur une échelle de 1 à 4. Cette échelle pilote la couleur des cases de la heatmap.

Niveau 1, faible : effet indirect, sans coercition propre. Niveau 2, modéré : contrainte limitée ou réversible. Niveau 3, élevé : atteinte significative aux personnes, au matériel ou à la liberté d'aller et venir. Niveau 4, critique : atteinte grave, durable ou irréversible (blessures, saisie lourde, privation de liberté prolongée).

---

## Grille de fiabilité

Je refuse de présenter une rumeur comme un fait. Chaque fiche porte donc un grade de fiabilité, adapté du code de l'Amirauté. Ce grade dit au lecteur quelle confiance accorder à l'information.

Grade A, corroborée : plusieurs sources indépendantes et des traces matérielles (images, certificats, procès-verbaux). Grade B, corroborée : sources concordantes, typiquement presse et témoignages. Grade C, rapportée : une source fiable, pas encore recoupée. Grade D, isolée : signalement unique non confirmé.

Quand un point ne peut pas être documenté publiquement, je l'indique dans la note documentaire de la fiche plutôt que de combler le vide par une supposition.

---

## Fréquence et tendance

Deux indicateurs complètent l'évaluation. La fréquence dit à quel point la tactique est répandue sur la période : isolée, occasionnelle, récurrente, systématique. La tendance dit comment elle évolue sur les douze derniers mois : nouveau, en hausse, stable, en baisse. Ensemble, ils permettent de distinguer une pratique marginale d'une pratique installée.

---

## Template d'une fiche tactique

Voici le gabarit complet. Chaque nouvelle fiche le suit champ par champ. Le modèle technique de référence se trouve dans `src/data/copwatch.ts` (constante `FICHE_TEMPLATE`).

Identité. Identifiant stable, code CopWatch, nom de la tactique, catégorie, phases du cycle concernées.

Évaluation. Niveau de menace, fréquence, tendance, grade de fiabilité.

Description documentaire. Un résumé en une phrase. Une description factuelle et neutre de ce qui est observé. L'objectif opérationnel apparent. Les indicateurs observables qui permettent de reconnaître et de documenter la tactique, sur un registre strictement descriptif.

Moyens et acteurs. Les unités ou services typiquement impliqués. Les matériels et moyens observés.

Ancrage juridique. Les fondements généralement invoqués par les forces de l'ordre. Les points de fragilité juridique documentés, c'est-à-dire ce que la défense conteste habituellement.

Réponse défensive. Les nœuds de l'Outil Décision applicables. Les pages wiki de référence. Ces renvois sont la seule dimension « active » de la fiche, et elle est exclusivement juridique.

Preuves et veille. Les cas concrets observés, rattachés à la carte des incidents quand c'est possible. Les sources publiques. La date de la dernière occurrence documentée. Une note documentaire pour les réserves et les points à recouper.

---

## Intégration avec les autres outils

CopWatch ne vit pas isolé. Il s'articule avec l'écosystème existant du projet.

Avec l'[Outil Décision](/decision), le lien est direct : chaque fiche renvoie aux nœuds qui exposent les droits et la conduite à tenir face à la tactique décrite. Une fiche sur la saisie pointe vers les nœuds de saisie et de restitution ; une fiche sur le filtrage routier pointe vers les nœuds de contrôle d'identité et de fouille de véhicule. Le pont est nominatif et vérifié.

Avec la [carte des incidents](/map), la complémentarité est géographique. Les cas observés d'une fiche sont rattachés, quand ils existent, à un incident cartographié par sa clé. La heatmap répond au « quand » et au « combien », la carte au « où ».

Avec le wiki, l'articulation est documentaire. Les fiches s'appuient sur l'[Arsenal législatif](/wiki/arsenal-legislatif), les [Recours juridiques](/wiki/recours-juridiques), la [Jurisprudence](/wiki/jurisprudence) et les études de cas comme [Carhaix 2025](/wiki/Carhaix-Pourquoi-Intervention) ou [Redon 2021](/wiki/Redon-Messe-Techno). CopWatch est l'index tactique de ce corpus, pas son remplacement.

---

## Contribuer

Un cas observé, une source publique, une correction ou une nouvelle tactique à documenter se signalent via la page [Contribuer](/contribuer). Toute contribution doit respecter la charte documentaire : une observation, une source, un grade de fiabilité honnête, et aucun conseil d'évitement.

---

## Sources et références

| Ressource | Usage |
|---|---|
| [Arsenal législatif](/wiki/arsenal-legislatif) | Fondements juridiques invoqués et sanctions |
| [Recours juridiques](/wiki/recours-juridiques) | Voies de contestation par tactique |
| [Outil Décision](/decision) | Droits et conduite à tenir, par situation |
| [Carte des incidents](/map) | Ancrage géographique des cas observés |
| [Répression](/wiki/Repression) | Vue d'ensemble du mode opératoire |
