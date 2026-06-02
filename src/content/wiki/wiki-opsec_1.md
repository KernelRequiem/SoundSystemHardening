# Opsec : Protection des informations sensibles

**L'OPSEC est une méthode pour identifier et éliminer les informations sensibles qui pourraient compromettre une structure ou une action. Dans le contexte des free parties, c'est simple : empêcher que des informations cruciales (localisation, identités, coordination) ne tombent entre les mains des autorités. Quatre règles fondamentales structurent tout l'opsec numérique. Ce wiki explique pourquoi, et comment les appliquer.**

---

## Qu'est-ce que l'OPSEC ?

### Définition

L'OPSEC est une méthode systématique qui repose sur un postulat simple : **les informations sensibles, en circulation, créent des risques**. 

L'objectif : identifier les informations qu'un adversaire cherche, puis bloquer les canaux par lesquels il y accède.

### Appliqué aux free parties

Un événement comporte des informations sensibles :
- **Où :** localisation précise du site
- **Quand :** date, heure, timing
- **Qui :** identités des orgas, coordinateurs, participants
- **Comment :** moyens de transport, effectifs, matériel

Si ces informations atteignent les autorités assez tôt, une intervention devient possible. Si ces informations restent confinées, l'événement se déroule.

**L'OPSEC c'est donc : mettre en place des processus pour que ces informations ne circulent que dans des canaux sécurisés, auprès de gens de confiance.**

### Niveaux de risque selon le canal

| Information | Partagée sur Facebook | Partagée sur Signal | Situation |
|---|---|---|---|
| Localisation précise | ❌ RISQUE CRITIQUE | ✅ SÉCURISÉ | Autorités voient / Autorités ne voient pas |
| Identité orga visible | ❌ RECONNAISSANCE FACIALE | ✅ ANONYME | Dossier ouvert / Zéro trace |
| Timing exacte | ❌ INTERVENTION PRÉPARE | ✅ TARDIF | 48h avant / Impossible |
| Réseau contacts | ❌ GRAPHE DE RELATION | ✅ ISOLÉ | Démantèlement / Collectif intact |

**L'OPSEC c'est choisir le bon canal pour chaque type d'information.**

---

## Les quatre règles de l'OPSEC numérique

Ces quatre règles couvrent 90% des failles d'OPSEC observées en pratique. Elles ne sont pas "conseils". Elles sont **critiques**.

### Règle 1 : Ne pas partager de localisations sur les réseaux publics

#### Pourquoi c'est critique

Une localisation partagée publiquement = autorités ont le point de rassemblement. Pas d'ambiguïté. Pas de retour en arrière.

#### Ce que ça signifie

- ❌ **Ne pas poster** : Instagram Stories avec la localisation, photo avec géotag Facebook, tweet du point de convoi
- ❌ **Ne pas partager** : adresse précise dans les commentaires, coordonnées GPS en clair, "on se retrouve au parking Carrefour de [ville]"
- ❌ **Ne pas envoyer** : screenshot de Google Maps, photo prise au point de rassemblement avant l'événement

#### Ce qu'on peut faire

- ✅ Partager avant via **canal sécurisé** (Signal, en privé) : "coordonnées pour ceux qui les demandent"
- ✅ Communiquer après l'événement (quand le risque a disparu)
- ✅ Utiliser des repères génériques ("derrière le Carrefour bleu") seulement pour publics de confiance déjà présents

#### Cas concret

**Événement réel :** Un teufeur poste un screenshot Google Maps sur Facebook avec les coordonnées du point de convoi. Quelques heures après, la préfecture les voit, demande à la gendarmerie de vérifier. 36 heures après le post, intervention.

**OPSEC appliquée :** Les coordonnées circulent uniquement sur Signal, entre orgas confirmées. Zéro trace publique. L'événement se déroule sans intervention.

---

### Règle 2 : Partager les informations sensibles uniquement sur des canaux chiffrés

#### Pourquoi c'est critique

Les autorités peuvent demander légalement accès aux métadonnées de communication. Sur un réseau non-chiffré, elles voient **qui contacte qui, quand, avec quel nombre de messages**. Cela suffit pour tracer un réseau entier.

Sur un réseau chiffré, elles ne voient rien : le contenu est illisible, les métadonnées minimales.

#### Ce que ça signifie

- ❌ **Ne pas utiliser** : WhatsApp pour coordination sensible, Telegram pour localisation, SMS pour timing, email pour détails d'organisation
- ✅ **Utiliser obligatoirement** : Signal pour tout ce qui est sensible (localisation, identités, timing, coordination)

#### Signal vs les autres

**Telegram :**
- Chiffrement du contenu = non obligatoire (faut activer "Secret Chat")
- Métadonnées de Telegram = visibles (qui contacte qui, quand, combien de messages, adresse IP)
- Risque : autorités demandent accès Telegram → reçoivent la cartographie de tes relations

**WhatsApp :**
- Chiffrement du contenu = oui, par défaut
- Métadonnées de WhatsApp = limitées (mais WhatsApp appartient à Meta / Facebook)
- Risque : Métadonnées en tant que telles + accès aux données via Facebook

**Signal :**
- Chiffrement du contenu = oui, obligatoire
- Métadonnées de Signal = minimales (Signal ne peut pas les lire)
- Avantage : même si autorités demandent accès Signal, Signal n'a rien à donner

#### Cas concret

**Événement réel :** Une orga utilise Telegram pour coordonner un weekend d'événements. Partage les localisation, le timing, les contacts des co-orgas. Les métadonnées Telegram montrent qui contacte qui, quand, et combien de messages. Une demande légale donne accès à ces métadonnées. Graphe de relation visible. Trois mois après, auditions pour tout le réseau.

**OPSEC appliquée :** Même coordination, mais sur Signal. Même demande légale. Signal n'a rien à donner : pas de métadonnées stockées, contenu chiffré. Zéro conséquence.

---

### Règle 3 : Flouter l'identité des orgas sur les photos et vidéos publiques

#### Pourquoi c'est critique

Les autorités disposent d'outils de reconnaissance faciale. Une photo ou vidéo avec un visage d'orga identifiable peut être croisée avec d'autres photos (Facebook, fichier de police, base de données) pour identifier et tracer cette personne.

Flouter le visage = reconnaissance faciale échoue = identification impossible.

#### Ce que ça signifie

- ❌ **Ne pas poster** : vidéo live avec visages des orgas, photo du point de rassemblement avec les faces visibles, screenshot d'événement montrant les coordinateurs
- ❌ **Ne pas partager** : directement après l'événement avec faces visibles (même "juste" entre amis)
- ✅ **Flouter obligatoirement** : tous les visages identifiables (orgas, coordinateurs, personnes du noyau dur) avant toute publication, même limitée

#### Flouter comment

Deux options :

**En ligne (web, pas d'appli à installer) :**
- https://pixelied.com/fr-fr/outils/flouter-une-photo/flouter-visage-photo
- https://facepixelizer.com/fr/

**Sur téléphone :**
- iOS : BlurFace (App Store, gratuit, détection automatique)
- Android : Blur Q (Google Play, gratuit, détection automatique)

**Processus :** Upload/import → détection automatique des visages → flou appliqué → exporter → partager.

Temps requis : 1-2 minutes par image.

#### Cas concret

**Événement réel :** Une vidéo live est postée depuis un événement. Les orgas sont visibles, faces découvertes. Quelques jours après, une personne reconnaît un visage, le croise avec des photos Facebook d'un orga connu de sound system X. Dossier ouvert. Quelques semaines après, audition pour "suspicion d'organisation d'un rassemblement illégal".

**OPSEC appliquée :** Même vidéo live, mais avec floutage des visages des orgas. Même croisement de photos. Résultat : impossible d'identifier qui était sur la vidéo. Zéro dossier.

---

### Règle 4 : Désactiver la localisation GPS avant d'arriver au point de rassemblement

#### Pourquoi c'est critique

Même sans partager ta localisation volontairement, ton téléphone enregistre automatiquement où tu es. Ces données de localisation peuvent se retrouver dans :
- Métadonnées de photos (localisation GPS encodée)
- Historique Google Maps
- Requêtes de données légales
- Triangulation cellulaire (les tours 4G/5G enregistrent où tu t'es connecté)

Désactiver la localisation GPS réduit significativement le risque qu'une trace matérielle ne t'associe au lieu.

#### Ce que ça signifie

**Avant de quitter ton domicile :**
- Localisation GPS : OFF
- Données mobiles : peut rester ON (OK)
- WiFi : OFF jusqu'au point de rassemblement

**En arrivant au point de rassemblement :**
- Mode avion : ON (déconnecte toutes les transmissions)
- Jusqu'à repartir : Mode avion reste ON

**Avant de repartir :**
- Mode avion : OFF (redevient normal)

#### Pourquoi le mode avion

Mode avion coupe les connexions réseau (4G/5G, WiFi, Bluetooth). Sans connexion réseau, ton téléphone ne crée aucune empreinte numériques de ta présence au lieu.

#### Cas concret

**Événement réel :** Après un événement, une demande légale donne accès aux données de triangulation cellulaire (quel téléphone s'est connecté à quelles tours, et quand). Un participant avait laissé sa localisation GPS + données mobiles actives. La triangulation le localise précisément au point de rassemblement, pendant 4 heures. Il devient suspect. Audition trois semaines après.

**OPSEC appliquée :** Même demande légale. Même triangulation. Mais ce participant avait mode avion dès l'arrivée. Aucune connexion réseau enregistrée. Aucune localisation. Zéro implication.

---

## Structure pratique de l'OPSEC

### Avant l'événement

**Information à protéger :** Localisation, timing, coordinateurs

**Canal à utiliser :** Signal uniquement
- Localisation partagée uniquement via Signal
- Identités des orgas = parlées en personne ou Signal
- Timing exact = Signal
- Contacts d'urgence = Signal

**Canaux à éviter :** Facebook, Instagram, Telegram, WhatsApp, SMS

### Pendant l'événement

**Information à protéger :** Visages des orgas, preuves de ta présence

**Actions à prendre :**
- Mode avion dès arrivée (toute la durée)
- Pas de photo avec localisation GPS
- Si vidéo/photo : visages floutés avant partage
- Zéro post en direct

### Après l'événement

**Information à protéger :** Identités, réseau de contacts

**Actions à prendre :**
- Photos/vidéos partagées : visages obligatoirement floutés
- Attendre quelques jours avant partage (risque réduit avec le temps)
- Utiliser Signal pour retours personnels
- Pas de récit complet publiquement

### Avec le recul (mois+)

**Information à partager :** Récit généraliste, pas identifiant

**Canaux accessibles :** Tous (risque volatilisé)

---

## FAQ : Opsec et objections courantes

**"C'est paranoia. Personne ne surveille ce que je fais."**

C'est pas de la paranoïa d'observer que l'État dispose d'outils légaux (demande de données) pour accéder aux métadonnées. OPSEC c'est juste reconnaître le risque et l'éliminer. C'est responsable, pas paranoid.

**"Signal c'est compliqué à utiliser."**

Signal a exactement la même interface que Telegram ou WhatsApp. Zéro différence. Chercher sur Google Play ou App Store, installer, créer compte avec numéro (10 secondes), inviter des contacts. C'est trivial.

**"Je peux pas désactiver ma localisation, j'ai besoin de mon téléphone."**

Tu désactives juste le GPS, pas tout le téléphone. Mode avion = tu conserves le téléphone, tu coups juste les transmissions réseau. Tu peux toujours utiliser applis locales (musique, notes, lampe). Mode avion = 2 secondes à activer/désactiver.

**"Si j'oublie une fois de flouter ?"**

C'est OK. Tu apprends. L'OPSEC c'est un processus qu'on améliore. Oublier une fois, ce n'est pas une faute morale. C'est une opportunité d'apprendre et de mettre en place un système (checklist avant partage).

**"Mais tout le monde partage des stories Instagram."**

Partager c'est le choix de chacun. L'OPSEC dit juste : si tu partages localisation + identification, tu crées un risque légal pour le collectif. Chacun évalue son confort. Mais comprendre le risque c'est être informé.

**"Comment j'invite quelqu'un à utiliser Signal s'il ne l'a pas ?"**

Signal est open source, gratuit, disponible sur tous les stores. Envoie-lui le lien direct : https://signal.org/fr/. Trois clics. Pas besoin d'accord global. Chacun décide pour lui-même.

**"Et si on me demande mes données ?"**

Si autorités demandent accès à tes données Signal = Signal n'a rien à donner (contenu chiffré, pas de métadonnées). Si elles demandent accès à Telegram = Telegram a tout (métadonnées + si pas Secret Chat, contenu). Voilà la différence.

---

## Checklist OPSEC avant publication

Avant de poster ou partager quoi que ce soit :

```
☐ Cette publication contient une localisation précise ?
  → Si oui : Supprimer immédiatement

☐ Cette publication montre un visage d'orga / coordinateur identifiable ?
  → Si oui : Flouter avant de partager

☐ J'utilise un canal non-chiffré pour une info sensible (localisation, identités) ?
  → Si oui : Basculer sur Signal

☐ J'arrive à un point de rassemblement avec localisation ou données mobiles actives ?
  → Si oui : Mode avion immédiatement

☐ Je peux expliquer les quatre règles de l'OPSEC à quelqu'un ?
  → Si non : relire ce guide
```

---

## Ressources essentielles

### Installation Signal

**Web :** https://signal.org/fr/
**iOS App Store :** Chercher "Signal"
**Google Play :** Chercher "Signal"

Pas de frais, open source, audité indépendamment.

### Flouter visages

**Web :** https://pixelied.com/fr-fr/outils/flouter-une-photo/flouter-visage-photo ou https://facepixelizer.com/fr/

**iOS :** BlurFace (App Store, gratuit)

**Android :** Blur Q (Google Play, gratuit)

### Documentation

Signal Protocol (transparence technique) : https://signal.org/fr/

---

## Synthèse des quatre règles

| Règle | Pourquoi | Conséquence non-respect | Comment |
|---|---|---|---|
| **1. Pas de localisation publique** | Autorités voient le point | Intervention 48h après | Partager via Signal uniquement |
| **2. Info sensible = Signal** | Métadonnées tracent le réseau | Dossier sur le collectif | Utiliser Signal pour coordination |
| **3. Flouter les visages** | Reconnaissance faciale | Identification des orgas | Pixelied / BlurFace avant partage |
| **4. Mode avion à l'arrivée** | Géolocalisation t'associe au lieu | Trace matérielle de présence | OFF tous réseaux pendant l'événement |

Ces quatre règles forment un système. Respecter trois sur quatre ne suffit pas. L'OPSEC c'est l'ensemble du processus.

---

---

## Sources et références

### Définition et concept OPSEC

OPSEC (pour « OPerations SECurity ») est une méthode pour se prémunir des risques que peut encourir une structure si des informations sensibles sont acquises par un adversaire à cette structure. 

L'OPSEC est un processus systématique en cinq étapes qui protège les informations sensibles en analysant les opérations du point de vue d'un adversaire. Le terme a été popularisé par l'armée américaine durant la guerre du Vietnam.

**Sources :**
- [Vectra : OPSEC et sécurité opérationnelle](https://fr.vectra.ai/topics/opsec)
- [Wikipédia : OPSEC](https://fr.wikipedia.org/wiki/OPSEC)
- [Trend Micro : Sécurité opérationnelle](https://www.trendmicro.com/fr_fr/what-is/operational-security-opsec.html)
- [Proofpoint : Operational Security](https://www.proofpoint.com/fr/threat-reference/operational-security-opsec)
- [Fortinet : Sécurité opérationnelle](https://www.fortinet.com/fr/resources/cyberglossary/operational-security)

### Signal vs Telegram : chiffrement et métadonnées

Signal active le chiffrement de bout en bout par défaut sur tous les messages, alors que Telegram propose le chiffrement E2EE uniquement dans les « Secret Chats » facultatifs, et non par défaut.

Signal n'enregistre quasiment aucune métadonnée et ne stocke jamais les messages, contacts ou listes de groupes sur ses serveurs, tandis que Telegram conserve des métadonnées comme l'adresse IP et les contacts.

Signal offre un chiffrement de bout en bout intégral qui protège à la fois le contenu et les métadonnées associées.

**Sources :**
- [Google Play 2026 : Telegram vs Signal](https://www.emuviews.com/telegram-vs-signal-2026/)
- [FastestVPN : Signal ou Telegram 2026](https://fastestvpn.com/fr/blogs/signal-vs-telegram/)
- [Spocket : Signal contre Telegram](https://www.spocket.co/fr/blogs/signal-contre-telegram/)
- [Blog du Modérateur : Niveaux de sécurité des messageries](https://www.blogdumoderateur.com/messageries-niveaux-securite/)

### Reconnaissance faciale et identification

Depuis 2015, la police française utilise le logiciel Briefcam (israélien) pour la reconnaissance faciale vidéo, déployé dans plus de 100 municipalités françaises.

Les algorithmes de reconnaissance faciale permettent de détecter, traquer, extraire et classifier les personnes, avec corrélation automatique avec les bases de données internes de la police.

Les smartphones professionnels de police disposent d'un accès au TAJ (fichier des procédures judiciaires) avec fonction de « rapprochement par photographie » accessible depuis 2022.

**Sources :**
- [Futura Sciences : Vidéosurveillance et reconnaissance faciale](https://www.futura-sciences.com/tech/actualites/intelligence-artificielle-videosurveillance-police-francaise-utilise-illegalement-logiciel-reconnaissance-faciale-depuis-8-ans-109186/)
- [Cyberjustice Blog : Reconnaissance faciale police](https://cyberjustice.blog/2024/03/10/reconnaissance-faciale-quand-la-police-surveille/)
- [Amnesty France : Surveillance et reconnaissance faciale](https://www.amnesty.fr/actualites/france-technologies-de-surveillance-reconnaissance-faciale/)
- [Clubic : Reconnaissance faciale illégale](https://www.clubic.com/actualite-604987-reconnaissance-faciale-et-controle-d-identite-une-enquete-alerte-sur-les-pratiques-illegales-de-la-police.html)
- [Assemblée Nationale : Question 14142 sur la reconnaissance faciale](https://www.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE14142)

### Cas Redon 2021 : documentation et intervention

Dans la nuit du 18 au 19 juin 2021, les gendarmes ont lancé des grenades lacrymogènes, de désencerclement et GM2L pendant sept heures, causant un jeune homme ayant la main arrachée, onze gendarmes et des dizaines de participants blessés.

Amnesty International a analysé l'intervention en se basant sur des entretiens avec douze personnes présentes sur place (journalistes, participants, responsables associatifs), ainsi que sur des vidéos et documents, et a conclu que l'usage de la force n'était ni nécessaire ni proportionné.

Les vidéos montrent que les gendarmes n'ont utilisé aucun mégaphone ou moyen de communication avec les participants, et que l'usage de la force a été immédiat sans tentative de dialogue ou désescalade.

**Sources :**
- [Amnesty International : Teknival de Redon](https://www.amnesty.org/fr/latest/news/2021/09/france-abusive-and-illegal-use-of-force-by-police-at-redon-rave-highlights-need-for-accountability-francais/)
- [Amnesty France : Violences policières Redon](https://www.amnesty.fr/presse/france--violences-policieres.-une-nouvelle-enquete)
- [Courrier de l'Atlas : Teknival de Redon usage disproportionné](https://www.lecourrierdelatlas.com/teknival-de-redon-un-usage-de-la-force-ni-necessaire-ni-proportionne/)
- [Police Human Rights Resources : Rapport Amnesty Redon PDF](https://policehumanrightsresources.org/content/uploads/2021/10/AI-Rapport-Redon.pdf?x54919=)
- [Assemblée Nationale : Question 43350 sur l'intervention de Redon](https://www.assemblee-nationale.fr/dyn/15/questions/QANR5L15QE43350.pdf)

*Documentation mise à jour en mai 2026. Basée sur cas réels et sources documentées. L'OPSEC n'est pas optionnel : c'est ce qui permet aux événements de se dérouler sans intervention.*
