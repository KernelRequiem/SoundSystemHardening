# Surveillance mobile

> Statut : stable
> Dernière mise à jour : mai 2026
> Dossier : `cyber-opsec/`
> Prérequis : lire [`threat-model.md`](threat-model.md) avant ce fichier

Ce fichier documente la surveillance des réseaux mobiles : fonctionnement technique du réseau GSM/4G/5G, mécanisme des IMSI-catchers, cadre légal français, et contre-mesures concrètes. C'est la menace physique la plus redoutable sur site lors d'un événement surveillé.

---

## Sommaire

1. [Architecture du réseau mobile - les bases](#1-architecture-du-réseau-mobile--les-bases)
2. [L'identifiant qui vous trahit : IMSI et IMEI](#2-lidentifiant-qui-vous-trahit--imsi-et-imei)
3. [L'IMSI-catcher - mécanisme d'attaque détaillé](#3-limsi-catcher--mécanisme-dattaque-détaillé)
4. [Ce que l'IMSI-catcher collecte réellement](#4-ce-que-limsi-catcher-collecte-réellement)
5. [Cadre légal en France](#5-cadre-légal-en-france)
6. [Cas documentés d'utilisation en France](#6-cas-documentés-dutilisation-en-france)
7. [Contre-mesures techniques](#7-contre-mesures-techniques)
8. [La radio PMR comme alternative sur site](#8-la-radio-pmr-comme-alternative-sur-site)
9. [Détection des IMSI-catchers](#9-détection-des-imsi-catchers)
10. [Schéma de décision sur site](#10-schéma-de-décision-sur-site)
11. [Sources et références](#11-sources-et-références)

---

## 1. Architecture du réseau mobile - les bases

Pour comprendre comment l'IMSI-catcher fonctionne, il faut d'abord comprendre comment votre téléphone se connecte au réseau mobile en conditions normales.

### Les composants du réseau GSM/4G/5G

```
[Votre téléphone]
       |
       | Signal radio (fréquences 700 MHz à 3,5 GHz selon la génération)
       |
[BTS - Base Transceiver Station]
(l'antenne-relais physique, le pylône)
       |
       | Câble fibre ou liaison hertzienne
       |
[BSC - Base Station Controller]
(gère plusieurs antennes dans une zone)
       |
[MSC - Mobile Switching Center]
(cœur du réseau, gère les appels et la signalisation)
       |
[Internet / Réseau téléphonique commuté]
```

### Comment votre téléphone choisit son antenne

Votre téléphone scanne en permanence les signaux des antennes environnantes et se connecte automatiquement à **celle qui émet le signal le plus fort**. Ce choix est automatique et permanent.

**Le paramètre clé :** la puissance du signal, mesurée en dBm (décibels-milliwatts). Plus le chiffre est proche de 0 (moins négatif), plus le signal est fort. Votre téléphone bascule d'une antenne à l'autre silencieusement, sans notification.

**L'absence d'authentification mutuelle en GSM 2G :** en GSM (2G), le téléphone s'authentifie auprès du réseau, mais le réseau ne s'authentifie pas auprès du téléphone. Le téléphone fait confiance à n'importe quelle antenne qui émet le bon signal. C'est la faille fondamentale que l'IMSI-catcher exploite.

**Amélioration en 4G/5G :** les protocoles LTE (4G) et NR (5G) ont introduit une authentification mutuelle - le téléphone peut en théorie vérifier l'identité de l'antenne. Cependant, les IMSI-catchers modernes contournent cette protection via des techniques de *downgrade* (forçage vers 2G).

---

## 2. L'identifiant qui vous trahit : IMSI et IMEI

### IMSI - International Mobile Subscriber Identity

L'IMSI est un numéro unique à 15 chiffres gravé dans votre carte SIM. Il identifie votre abonnement chez l'opérateur, indépendamment du téléphone.

```
Format IMSI : 208 01 1234567890
              ↑↑↑ ↑↑ ↑↑↑↑↑↑↑↑↑↑
              |   |  numéro d'abonné unique
              |   code réseau (01 = Orange, 20 = Bouygues, etc.)
              code pays (208 = France)
```

**Ce que l'IMSI permet :** une réquisition judiciaire à votre opérateur avec un IMSI permet d'obtenir immédiatement votre identité civile complète (nom, prénom, adresse, numéro de téléphone), l'historique de votre présence réseau, et les antennes auxquelles vous vous êtes connecté (donc vos déplacements).

### IMEI - International Mobile Equipment Identity

L'IMEI est un numéro unique à 15 chiffres gravé dans le téléphone lui-même (pas dans la SIM). Il identifie le terminal physique.

```
Format IMEI : 35 123456 789012 3
              ↑↑ ↑↑↑↑↑↑ ↑↑↑↑↑↑ ↑
              |  |      |      chiffre de contrôle
              |  |      numéro de série
              |  code fabricant/modèle
              code d'attribution (TAC)
```

**Trouver son IMEI :** composer `*#06#` sur le clavier téléphonique.

**Ce que l'IMEI permet :** identifier le modèle exact du téléphone, et le relier à un achat si le téléphone a été acheté avec une identité (carte de crédit, compte Apple/Google). Changer de SIM ne change pas l'IMEI. Un téléphone peut donc être identifié même avec une SIM prépayée anonyme, si l'IMEI a déjà été capté lors d'un événement précédent.

### La combinaison IMSI + IMEI

Un IMSI-catcher capte les deux. La combinaison est particulièrement puissante :

```
IMSI seul : identifie l'abonnement → réquisition opérateur → identité civile
IMEI seul : identifie le terminal → possible si achat traçable
IMSI + IMEI : confirme que la même personne utilisait ce téléphone
              → utilisable pour relier plusieurs événements
```

---

## 3. L'IMSI-catcher - mécanisme d'attaque détaillé

### Définition

Un IMSI-catcher (aussi appelé *Stingray* aux États-Unis, *IMSI grabber*, ou *fausse antenne-relais*) est un appareil électronique qui simule une vraie antenne-relais de réseau mobile. Il constitue ce qu'on appelle en cybersécurité une **attaque de l'homme du milieu** (*Man-in-the-Middle, MitM*) au niveau de la couche physique.

### Fonctionnement pas à pas

```
Étape 1 - Émission d'un signal fort
  L'IMSI-catcher émet un signal radio plus puissant que les
  vraies antennes environnantes sur les mêmes fréquences.

  [IMSI-catcher] ─── signal fort ───→ [Téléphones dans le rayon]
  [Vraies antennes] ─ signal faible ─→ ignorées

Étape 2 - Connexion automatique des téléphones
  Les téléphones à portée choisissent automatiquement l'antenne
  au signal le plus fort = l'IMSI-catcher.
  Les propriétaires ne voient rien, aucune alerte.

Étape 3 - Collecte des identifiants
  Lors de la procédure de connexion au réseau, le téléphone
  transmet son IMSI et son IMEI à l'antenne (normale ou fausse).
  L'IMSI-catcher collecte ces identifiants pour tous les terminaux
  qui s'y connectent.

Étape 4 - Transfert vers le vrai réseau (optionnel)
  Les IMSI-catchers modernes peuvent relayer le trafic vers
  une vraie antenne pour que les téléphones continuent à
  fonctionner normalement - les propriétaires ne remarquent rien.

Étape 5 - Interception du trafic (selon la configuration)
  Sur les réseaux 2G (GSM) : possible d'intercepter appels et SMS
  Sur les réseaux 4G/5G chiffrés : seules les métadonnées sont
  accessibles (identifiants, présence) pas le contenu.
```

### Le *downgrade attack* - contourner la 4G/5G

La protection d'authentification mutuelle de la 4G/5G est contournable via une technique de *downgrade forcé* :

```
L'IMSI-catcher annonce ne pas supporter la 4G/5G
  ↓
Le téléphone repasse en 2G pour maintenir la connexion
  ↓
Sur 2G, l'authentification mutuelle n'existe pas
  ↓
L'IMSI-catcher peut capturer les identifiants et intercepter
le trafic non chiffré (appels voix, SMS)
```

**Ce que ça signifie concrètement :** un téléphone qui affiche "4G" peut basculer en 2G sans que vous le voyiez si un IMSI-catcher est présent. La barre de réseau ne protège pas.

**Comment s'en protéger partiellement :** certains Android récents permettent de forcer l'utilisation du réseau 4G/5G uniquement et de refuser le 2G :

```
Android (varie selon le constructeur) :
  Réglages → Réseau mobile → Type de réseau préféré
  → Sélectionner "4G/LTE uniquement" ou "5G/LTE uniquement"
  → Le téléphone perdra le signal si seul du 2G est disponible
    (y compris si un IMSI-catcher force le downgrade)

iOS :
  Pas d'option équivalente accessible à l'utilisateur.
  La protection repose sur le mode avion ou l'extinction.
```

---

## 4. Ce que l'IMSI-catcher collecte réellement

Il faut être précis sur ce qui est collecté selon la génération réseau et la configuration de l'appareil.

### Toujours collecté

```
✓ IMSI de tous les terminaux dans le rayon de couverture
  → Identifie chaque abonnement sans ambiguïté

✓ IMEI de tous les terminaux
  → Identifie chaque terminal physique

✓ Présence géographique
  → Le terminal était dans le rayon de couverture à ce moment

✓ Métadonnées des appels et SMS
  → Numéros appelés/appelants, durée, heure (pas le contenu)
```

### Collecté uniquement sur 2G (ou après downgrade)

```
✓ Contenu des appels vocaux
  → Les appels GSM 2G peuvent être interceptés si le chiffrement
    A5/0 est actif (pas de chiffrement) ou A5/1 (chiffrement faible
    cassable en temps réel avec matériel dédié)

✓ Contenu des SMS
  → Les SMS transitent en clair sur 2G, interceptables

✗ Contenu des appels Signal, FaceTime, WhatsApp
  → Ces appels utilisent le chiffrement E2E au niveau applicatif,
    indépendant du chiffrement réseau GSM
  → Même sur 2G, le contenu reste illisible pour l'IMSI-catcher

✗ Contenu des messages Signal, iMessage, WhatsApp
  → Même logique : chiffrement E2E applicatif, non affecté par
    le niveau de chiffrement réseau
```

### Ce que l'IMSI-catcher NE collecte PAS

```
✗ Le contenu des communications chiffrées E2E (Signal, etc.)
✗ Les données des applications (photos, fichiers locaux)
✗ Les informations sur un téléphone en mode avion
✗ Les informations sur un téléphone éteint
✗ Les données Wi-Fi (l'IMSI-catcher ne surveille pas le Wi-Fi)
```

### La valeur de l'IMSI pour construire un dossier

L'IMSI capté sur site n'est pas directement un nom. La chaîne de traitement pour passer de l'IMSI à l'identité est la suivante :

```
IMSI capté sur site A le 13 avril 2026 à 22h47
  ↓
Réquisition judiciaire à l'opérateur français
(Orange, Bouygues, SFR, Free - obligation légale de répondre)
  ↓
Opérateur fournit : nom, prénom, adresse, numéro de téléphone,
                    historique de présence réseau
  ↓
Identité civile confirmée

Durée de la procédure : quelques heures à quelques jours
selon l'urgence et la voie judiciaire choisie
```

Un graphe des IMSI captés sur plusieurs événements distincts permet de :
* Identifier les personnes présentes sur plusieurs sites (organisateurs récurrents)
* Reconstituer les réseaux de relation (qui était où avec qui)
* Corroborer d'autres preuves (témoignages, photos)

---

## 5. Cadre légal en France

### Historique législatif

```
2015 : Loi Renseignement (loi n° 2015-912 du 24 juillet 2015)
  → Légalise les IMSI-catchers pour les services de renseignement
  → Sous autorisation de la Commission Nationale de Contrôle
    des Techniques de Renseignement (CNCTR)
  → Usage : antiterrorisme, contre-espionnage, criminalité organisée

2016 : Extension à la police judiciaire
  → Les services de police judiciaire obtiennent accès aux
    IMSI-catchers dans le cadre d'enquêtes judiciaires
  → Nécessite une autorisation du juge d'instruction ou du
    procureur selon le cadre de l'enquête

2021 : Usage documenté sur des mouvements sociaux et militants
  → Affaire des militants antinucléaires de Bure : dizaines
    de milliers de communications interceptées selon les
    dossiers judiciaires publiés
```

### Qui peut autoriser l'utilisation d'un IMSI-catcher

```
Renseignement (DGSI, DGSE, DRT) :
  → Autorisation de la CNCTR (commission administrative indépendante)
  → Pas de juge dans la boucle obligatoirement

Police judiciaire :
  → Dans le cadre d'une enquête préliminaire :
    autorisation du procureur de la République
  → Dans le cadre d'une information judiciaire :
    commission rogatoire du juge d'instruction
  → Durée : limitée, renouvelable
```

**Ce que ça signifie pour les collectifs :** l'IMSI-catcher n'est pas un outil de surveillance quotidienne de masse. Son déploiement nécessite une autorisation. Mais cette autorisation peut être obtenue rapidement (quelques heures) en situation d'urgence, et les préfectures peuvent anticiper sur des événements connus.

---

## 6. Cas documentés d'utilisation en France

### Affaire de Bure - militants antinucléaires

Des IMSI-catchers ont été utilisés contre des militants antinucléaires opposés au projet de stockage de déchets nucléaires CIGÉO à Bure (Meuse). Les dossiers judiciaires ont révélé l'interception de dizaines de milliers de communications. Cette affaire est la plus documentée publiquement en France concernant la surveillance de militants.

### Manifestations politiques

La Quadrature du Net a documenté des déploiements d'IMSI-catchers lors de manifestations à Paris, notamment lors des mobilisations contre la loi Renseignement en 2015. Des parlementaires avaient interpellé le gouvernement à ce sujet.

### Utilisation lors de grands rassemblements

Des témoignages de participants à de grands teknivals font état d'anomalies réseau (basculement inattendu en 2G, chutes de signal soudaines) compatibles avec la présence d'IMSI-catchers, sans que cela soit formellement documenté.

---

## 7. Contre-mesures techniques

### Contre-mesure principale : le mode avion

C'est la seule contre-mesure **fiable à 100%** contre l'IMSI-catcher.

**Mécanisme :** un téléphone en mode avion désactive toutes les émissions radio : GSM, 4G, 5G, Wi-Fi, Bluetooth, NFC. Il n'émet aucun signal capturablepar un IMSI-catcher. Il est invisible sur le réseau mobile.

**Limites à connaître :**

```
Mode avion - ce qu'il désactive :
  ✓ GSM / 4G / 5G (réseau mobile)
  ✓ Wi-Fi (sauf si réactivé manuellement après)
  ✓ Bluetooth (sauf si réactivé manuellement après)
  ✓ NFC

Mode avion - ce qu'il ne désactive PAS toujours :
  ⚠ GPS en mode réception passive
    → Le GPS reçoit des signaux satellites mais n'en émet pas
    → Ne peut pas être capté par un IMSI-catcher
    → Mais enregistre votre position si une application l'utilise

  ⚠ Certains iPhones peuvent maintenir des communications
    d'urgence (SOS) même en mode avion
    → Pas un vecteur de surveillance ordinaire

Vérification du mode avion :
  → L'icône avion doit apparaître dans la barre de statut
  → Vérifier que les barres de signal réseau ont disparu
  → Tenter un appel : doit échouer immédiatement
```

**Protocole mode avion pour un événement à risque :**

```
Avant d'arriver sur le site (2 km minimum avant) :
  1. Passer en mode avion
  2. Vérifier que le Wi-Fi et Bluetooth sont désactivés
     (certains appareils les réactivent séparément du mode avion)
  3. Désactiver le GPS si des applications pourraient l'utiliser

Sur site :
  → Téléphone en mode avion tout au long de l'événement
  → Pour communiquer sur site : Briar via Bluetooth,
    ou radio PMR (voir section 8)
  → N'allumer le téléphone (réseau actif) que si absolument nécessaire,
    et le plus loin possible du cœur du site

En quittant le site :
  → Rester en mode avion jusqu'à être à distance significative
  → Ne pas rallumer le réseau dans les premiers kilomètres
```

### Contre-mesure partielle : forcer le réseau 4G uniquement

En désactivant le 2G dans les paramètres réseau, vous vous protégez contre le downgrade forcé :

```
Android :
  Réglages → Réseau mobile → Type de réseau préféré
  → "4G/LTE uniquement" ou "5G"

Résultat : si un IMSI-catcher force un downgrade vers 2G,
           votre téléphone perd le signal plutôt que de se
           connecter à la fausse antenne 2G.

Limite : vous perdez le signal si vous êtes dans une zone
         sans couverture 4G (zones rurales isolées).
         Sur un site d'événement en zone blanche, ce paramètre
         peut simplement couper toute connectivité.
```

### Faraday bag - isolation physique

Un *Faraday bag* est une housse en tissu conducteur qui bloque les ondes électromagnétiques dans les deux sens : ni entrée ni sortie.

```
Ce que ça bloque :
  ✓ GSM / 4G / 5G
  ✓ Wi-Fi
  ✓ Bluetooth
  ✓ GPS (en émission, mais le GPS est passif)
  ✓ NFC

Comment vérifier qu'un Faraday bag fonctionne :
  1. Placer le téléphone dans le sac, bien fermer
  2. Appeler le téléphone depuis un autre téléphone
  3. Le téléphone ne doit pas sonner
  4. Si le téléphone sonne → le sac est défectueux ou mal fermé

Coût : 15 à 40 €
Marques connues : Silent Pocket, Faraday Defense, ou confection DIY
                  avec tissu conducteur (moins fiable)

Usage recommandé :
  Transport du téléphone sur le trajet vers le site,
  quand on veut être présent mais non localisable par le réseau.
  Alternative au mode avion quand on oublie ou ne peut pas
  interagir avec l'interface du téléphone.
```

### Cartes SIM prépayées et anonymat

**En France depuis 2021 :** l'enregistrement nominal est obligatoire pour toute SIM prépayée. Acheter une SIM anonyme en France est légalement impossible (pour les français). Cette obligation facilite la corrélation IMSI → identité.

**SIM étrangères :** dans certains pays européens (Belgique, Espagne), des SIM prépayées sans enregistrement nominal restent disponibles. Une SIM étrangère non nominative est captée par l'IMSI-catcher (l'IMSI est émis), mais la réquisition judiciaire doit alors passer par l'opérateur étranger, ce qui est plus lent et plus difficile. Ce n'est pas une protection absolue mais c'est une friction supplémentaire.

**Risque à connaître :** l'IMEI du téléphone ne change pas. Si votre IMEI a été capté lors d'un événement précédent avec votre SIM nominative française, il reste connu même si vous changez de SIM.

---

## 8. La radio PMR comme alternative sur site

La radio PMR 446 (*Private Mobile Radio* 446 MHz) est la solution la plus efficace pour communiquer sur site sans aucun risque lié au réseau mobile.

### Pourquoi la PMR est supérieure à tout autre outil sur site

```
Avantage 1 - Pas de réseau mobile
  → Impossible à capter par un IMSI-catcher
  → Ne passe par aucun serveur
  → Ne requiert aucun opérateur

Avantage 2 - Pas d'identifiant
  → Pas d'IMSI, pas d'IMEI, pas de numéro de téléphone
  → Aucun lien avec une identité réelle

Avantage 3 - Infrastructure zéro
  → Fonctionne sans électricité externe, sans antenne-relais,
    sans internet, sans abonnement

Avantage 4 - Légal sans licence en France
  → La bande 446 MHz est libre d'usage en Europe pour la PMR
  → Pas de déclaration, pas d'autorisation
  → Puissance limitée à 0.5W (portée 1-5 km selon terrain)

Avantage 5 - Coût minimal
  → Une radio PMR : 15 à 40 €
  → Durée de vie : plusieurs années
```

### Limites de la PMR

```
✗ Communication en clair
  → Les communications PMR ne sont pas chiffrées nativement
  → Un scanner radio (receveur large bande) peut écouter
    les communications PMR si quelqu'un est à portée
    et cherche activement à intercepter

  Mitigation : utiliser des codes convenus, ne pas mentionner
               de noms ou informations directement identifiantes,
               communiquer en termes génériques

✗ Portée limitée
  → 1 à 2 km en terrain urbanisé
  → 3 à 5 km en terrain dégagé
  → Les bâtiments, arbres et reliefs réduisent la portée

✗ Usage intersite impossible
  → Uniquement pour la coordination sur le site de l'événement,
    pas pour les communications à distance
```

### Modèles recommandés

Pour une utilisation occasionnelle, des modèles d'entrée de gamme suffisent :

```
Budget : Baofeng UV-5R ou UV-82 (20-30 €)
  → Populaires, robustes, large communauté
  → Peuvent aussi émettre sur d'autres fréquences
    (vérifier la légalité selon l'usage)
  → Batterie rechargeable

Standard : Motorola TLKR T80 ou T92 H2O (40-60 €)
  → Design étanche (T92)
  → Certifiés PMR 446 d'usine
  → Plus simples à configurer pour des non-techniciens

Professionnel : Sepura, Motorola Solutions (> 200 €)
  → Pour une utilisation intensive, pas nécessaire
    pour un collectif occasionnel
```

### Configuration de base PMR 446

```
Canal PMR 446 : 8 canaux disponibles (1 à 8)
  → Convention courante : canal 1 pour coordination générale
  → Canal 8 souvent utilisé comme canal d'urgence
  → Choisir un canal et l'annoncer à tous les membres avant l'événement

Sous-tons CTCSS (optionnel) :
  → Permet de filtrer les communications d'autres groupes
    sur le même canal
  → Ne chiffre pas, ne protège pas - filtre uniquement l'affichage
```

---

## 9. Détection des IMSI-catchers

La détection d'IMSI-catchers n'est pas fiable mais peut constituer un signal d'alerte.

### SnoopSnitch - Android

SnoopSnitch est une application Android qui analyse les paramètres du réseau GSM et détecte les anomalies caractéristiques d'un faux relais.

```
Installation :
  Disponible sur F-Droid (recommandé)
  Nécessite un terminal Android rooté sur certaines versions
  Fonctionne mieux sur les terminaux Qualcomm (chipset radio accessible)

Ce que SnoopSnitch surveille :
  → CID (Cell Identity) : identifiant unique de chaque antenne
    Une antenne qui change d'identifiant anormalement est suspecte
  → LAC (Location Area Code) : code de zone géographique
    Une incohérence entre le code de zone et la position réelle est suspecte
  → Changement soudain de 4G vers 2G sans raison apparente
  → Puissance de signal anormalement élevée pour la zone
  → Anomalies dans la signalisation réseau

Limites :
  → Taux de faux positifs élevé dans les zones à couverture instable
  → Ne détecte pas tous les IMSI-catchers (les plus récents
    sont conçus pour paraître comme de vraies antennes)
  → Indicateur d'alerte, pas une certitude
  → Sur iOS : pas d'application équivalente disponible (accès réseau
    trop restreint par Apple)
```

### Anomalies réseau à surveiller manuellement

Sans application dédiée, certains signes peuvent indiquer la présence d'un IMSI-catcher :

```
Signes suspects :
  → Chute soudaine de 4G vers 2G (visible dans la barre de statut)
    dans une zone normalement bien couverte en 4G
  → Signal très fort (4-5 barres) dans un lieu isolé où la couverture
    est normalement faible
  → Batterie qui se vide anormalement vite (le téléphone essaie de
    maintenir une connexion avec un signal instable)
  → Appels qui coupent ou latence inhabituelle dans les SMS

Ces signes ne sont PAS une confirmation - ils peuvent avoir
des explications banales. Ils doivent juste inciter à activer
le mode avion si vous êtes en situation à risque.
```

---

## 10. Schéma de décision sur site

```
┌────────────────────────────────────────────────────────────────┐
│  ARRIVÉE SUR UN SITE D'ÉVÉNEMENT                               │
└────────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────┐
│  Niveau de risque évalué (voir threat-model.md)                │
│                                                                │
│  Niveau 1 (pas de surveillance connue) :                       │
│  → Mode normal, vigilance sur les photos (EXIF)               │
│                                                                │
│  Niveau 2 (enquête judiciaire possible) :                      │
│  → Mode avion sur site                                         │
│  → Communication via Briar Bluetooth ou PMR                   │
│                                                                │
│  Niveau 3 (surveillance documentée ou redoutée) :             │
│  → Mode avion depuis 2 km avant le site                       │
│  → Faraday bag pendant le transport                           │
│  → Communication PMR uniquement sur site                      │
│  → Pas de téléphone allumé (réseau actif) sur site            │
└────────────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────────────┐
│  COMMUNICATION SUR SITE                                        │
│                                                                │
│  Option A - Briar Bluetooth (recommandé niveau 2)             │
│  → Téléphone en mode avion, Wi-Fi désactivé                   │
│  → Briar actif en mode Bluetooth                              │
│  → Communication chiffrée, P2P, sans réseau mobile           │
│  → Portée ~10 mètres                                          │
│                                                                │
│  Option B - Radio PMR (recommandé niveau 3)                   │
│  → Téléphone éteint ou en Faraday bag                        │
│  → Radio PMR pour coordination                                │
│  → En clair mais aucun identifiant exposé                    │
│  → Portée 1-5 km selon terrain                               │
│                                                                │
│  Option C - Ne pas communiquer                                │
│  → Toute coordination faite avant l'arrivée sur site          │
│  → Pas de communication sur site = surface d'attaque zéro    │
└────────────────────────────────────────────────────────────────┘
```

---

## 11. Sources et références

**Sur les IMSI-catchers - technique :**
* Electronic Frontier Foundation - Gotta Catch 'Em All: Understanding How IMSI Catchers Interact With Our Phones - https://www.eff.org/wp/gotta-catch-em-all-understanding-how-imsi-catchers-interact-our-phones
* ACLU - Stingrays: The Most Common Surveillance Tool the Government Won't Tell You About - https://www.aclu.org/issues/privacy-technology/surveillance-technologies/stingray-tracking-devices

**Sur le cadre légal français :**
* Légifrance - Loi n° 2015-912 du 24 juillet 2015 relative au renseignement - https://www.legifrance.gouv.fr/lods/id/JORFTEXT000030931343
* La Quadrature du Net - Documentation IMSI-catchers en France - https://www.laquadrature.net/

**Sur SnoopSnitch :**
* SnoopSnitch - F-Droid - https://f-droid.org/packages/de.srlabs.snoopsnitch/
* Security Research Labs - IMSI Catcher Detection - https://srlabs.de/imsi-catcher-detection/

**Sur la radio PMR :**
* ANFR - Réglementation PMR 446 en France - https://www.anfr.fr/
* Wikipedia FR - PMR 446 - https://fr.wikipedia.org/wiki/PMR_446

**Guides pratiques :**
* EFF - Surveillance Self-Defense : Mobile Devices - https://ssd.eff.org/module/mobile-phones
* Security in a Box - Protect Your Device - https://securityinabox.org/fr/

---

*Fichiers suivants dans ce dossier :*
* [`reseau-anonymisation.md`](reseau-anonymisation.md) - VPN, Tor, Tails OS
* [`identites-numeriques.md`](identites-numeriques.md) - séparation des identités
* [`compartimentation.md`](compartimentation.md) - architecture d'information
