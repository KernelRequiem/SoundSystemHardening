# Changelog et Historique des Mises à Jour

Ce document retrace chronologiquement toutes les modifications majeures apportées au dépôt technique (code/protocoles) et au Wiki (stratégie/veille). 

**Pourquoi documenter rigoureusement les mises à jour ?** 
Une documentation de sécurité opérationnelle ou de droit pénal qui n'est pas datée est une documentation dangereuse. Les doctrines de maintien de l'ordre, les jurisprudences et les vulnérabilités technologiques évoluent constamment. Ce changelog garantit à chaque utilisateur qu'il déploie des protocoles adaptés à la menace actuelle, et non à celle de l'année précédente.

---

## [Juin 2026] - Migration infrastructure vers souveraineté suisse

### Modifications techniques
* **[Infrastructure]** Migration de l'hébergement vers un VPS Infomaniak (Genève, Suisse). *Pourquoi : hébergement souverain en Suisse, protection des données renforcée (nLPD), aucune dépendance à une plateforme cloud américaine pour l'hébergement du site.*
* **[Infrastructure]** Remplacement de la stack cloud (Vercel) par un déploiement auto-géré via Coolify (open-source) et Traefik. Aucun tiers ne dispose désormais d'un accès opérationnel à l'infrastructure.
* **[Transparence]** Suppression de l'intégration Vercel Speed Insights : le site ne charge plus aucun script tiers lors de la navigation. Zéro contact externe hors consultation de la carte.
* **[Pages]** Mise à jour des pages `/a-propos` et `/securite` pour refléter le nouveau profil de risque juridique et technique de l'infrastructure.

---

## [Mai 2026] - Refonte Cyber-OpSec et Veille RIPOST

### Ajouts
* **[Repo / cyber-opsec]** Création de `canaux-diffusion.md` : Ajout des protocoles de création de comptes administrateurs anonymes ("burners") sur Telegram et Signal via l'usage de Fragment (numéros blockchain) et VoIP. *Pourquoi : Le modèle de menace a pivoté ; le risque principal n'est plus l'interception de la ligne, mais l'infiltration OSINT des boucles publiques par les cellules d'investigation numérique.*
* **[Repo / cyber-opsec]** Création de `infolines-legacy.md` : Documentation des architectures de repli (routeurs 4G dédiés, SIM cash).
* **[Wiki / Veille]** Création de la page `Actualités Répression` : Intégration de l'analyse des nouvelles doctrines policières constatées au printemps 2026 (drones à vision thermique, nasses logistiques périphériques). *Pourquoi : Permettre aux orgas d'adapter le camouflage de leurs infrastructures critiques (groupes électrogènes) face à la reconnaissance aérienne.*
* **[Wiki / Veille]** Suivi de la loi RIPOST : Ajout de l'analyse du projet de loi voté au Sénat le 26 mai 2026, avec un focus sur l'industrialisation des Amendes Forfaitaires Délictuelles (AFD) et l'accélération des saisies destructives.
* **[Wiki / Stratégie]** Ajout des pages `Manifeste.md` et `Argumentaire.md` : Centralisation des éléments de langage et des parades factuelles pour déconstruire la rhétorique répressive face aux médias et aux élus locaux.

### Mises à jour
* **[Repo / droits-libertes]** Mise à jour des fiches sur le forçage biométrique et les codes PIN en Garde à Vue. Intégration des jurisprudences récentes sur la notion de "convention de déchiffrement".

---

## [Avril 2026] - Initialisation de l'infrastructure et PPL 1133

### Ajouts
* **[Architecture]** Séparation structurelle du projet en deux entités : un dépôt versionné sous Git pour l'OpSec stricte et un Wiki éditable pour la stratégie. *Pourquoi : Limiter la surface d'attaque des données techniques sensibles tout en conservant une friction minimale pour la collaboration militante et juridique.*
* **[Repo / cyber-opsec]** Déploiement du `threat-model.md` de base. Modélisation des menaces selon les profils (Orga vs Participant).
* **[Wiki / Veille]** Intégration de la PPL 1133 (adoptée à l'Assemblée nationale) au suivi législatif. Documentation approfondie de la création du "délit de présence".
* **[Repo / droits-libertes]** Ajout de la fiche réflexe "Contrôles Routiers" : Différenciation juridique précise entre l'inspection visuelle et la fouille de véhicule nécessitant l'intervention d'un OPJ.

### Mises à jour
* **[Documentation]** Révision du `README.md` et du `CONTRIBUTING.md` pour imposer l'hygiène de contribution (commits signés, utilisation d'e-mails GitHub masqués de type `@users.noreply.github.com` pour protéger l'identité des contributeurs).