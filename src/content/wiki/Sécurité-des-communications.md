# Sécurité des communications

> **Statut :** actif - mis à jour mai 2026  
> **Public :** techniciens et personnes avec des bases réseau souhaitant comprendre les mécanismes, pas seulement les outils  
> **Scope :** messagerie chiffrée, gestion des identités numériques, métadonnées, réseau, sécurité physique mobile

---

## Pourquoi ce document

La sécurité numérique des petits collectifs (associations, syndicats, groupes de travail militants, équipes sans DSI) repose presque entièrement sur les pratiques individuelles de leurs membres. Il n'y a pas de firewall d'entreprise, pas de MDM, pas de SOC. La surface d'attaque, c'est chaque téléphone, chaque compte, chaque message envoyé.

Ce wiki documente les menaces réelles auxquelles ces structures font face et les contre-mesures concrètes à mettre en place, avec les mécanismes techniques expliqués à chaque étape.

---

## Table des matières

1. [Modèle de menace : poser le cadre avant de choisir les outils](#1-modèle-de-menace--poser-le-cadre-avant-de-choisir-les-outils)
2. [Messagerie chiffrée](#2-messagerie-chiffrée)
   - 2.1 [Signal : référence et limites](#21-signal--référence-et-limites)
   - 2.2 [Briar : P2P sans infrastructure](#22-briar--p2p-sans-infrastructure)
   - 2.3 [Telegram : usages et pièges](#23-telegram--usages-et-pièges)
   - 2.4 [Email : ProtonMail et alternatives](#24-email--protonmail-et-alternatives)
3. [Métadonnées : le vecteur de fuite ignoré](#3-métadonnées--le-vecteur-de-fuite-ignoré)
   - 3.1 [EXIF dans les images](#31-exif-dans-les-images)
   - 3.2 [Métadonnées dans les documents](#32-métadonnées-dans-les-documents)
   - 3.3 [Outillage de nettoyage](#33-outillage-de-nettoyage)
4. [Surveillance mobile : IMSI-catcher et réseaux GSM](#4-surveillance-mobile--imsi-catcher-et-réseaux-gsm)
   - 4.1 [Fonctionnement technique](#41-fonctionnement-technique)
   - 4.2 [Cadre légal en France](#42-cadre-légal-en-france)
   - 4.3 [Contre-mesures](#43-contre-mesures)
5. [Réseau et anonymisation](#5-réseau-et-anonymisation)
   - 5.1 [VPN : ce que ça fait vraiment](#51-vpn--ce-que-ça-fait-vraiment)
   - 5.2 [Tor : routage en oignon](#52-tor--routage-en-oignon)
   - 5.3 [Tails OS](#53-tails-os)
6. [Gestion des identités numériques](#6-gestion-des-identités-numériques)
   - 6.1 [Séparation des identités](#61-séparation-des-identités)
   - 6.2 [Corrélation de pseudonymes : le piège de l'homogénéité](#62-corrélation-de-pseudonymes--le-piège-de-lhomogénéité)
7. [Analyse de trafic : ce que le chiffrement ne cache pas](#7-analyse-de-trafic--ce-que-le-chiffrement-ne-cache-pas)
8. [Compartimentation de l'information](#8-compartimentation-de-linformation)
9. [Sécurité physique du terminal](#9-sécurité-physique-du-terminal)
10. [Matrice de décision : quel outil pour quel usage](#10-matrice-de-décision--quel-outil-pour-quel-usage)
11. [Ressources](#11-ressources)

---

## 1. Modèle de menace : poser le cadre avant de choisir les outils

Le modèle de menace (*threat model*) est la première étape de toute démarche de sécurité sérieuse. Il répond à quatre questions :

```
1. Quoi protéger ?       → les actifs (données, communications, identités)
2. Contre qui ?          → l'adversaire (et ses capacités réelles)
3. Quelle probabilité ?  → le risque d'exploitation
4. Quel coût acceptable? → le compromis sécurité / praticabilité
```

Un collectif local ne fait pas face aux mêmes menaces qu'un journaliste d'investigation ou qu'un lanceur d'alerte. Appliquer des contre-mesures de niveau NSA à une situation de niveau "curiosité administrative locale" est contre-productif : ça épuise les membres, ça complexifie la coordination, et ça génère un faux sentiment de sécurité sur les vrais vecteurs.

### Niveaux de menace typiques pour un petit collectif

| Niveau | Adversaire | Capacités | Exemples |
|--------|-----------|-----------|---------|
| 1 | Acteur malveillant individuel | OSINT basique, ingénierie sociale | Harcèlement, doxxing |
| 2 | Acteur judiciaire standard | Réquisition opérateurs, saisie matériel, OSINT | Enquête préliminaire, garde à vue |
| 3 | Renseignement territorial | IMSI-catcher, surveillance réseaux sociaux, sources humaines | Suivi long terme de militants |
| 4 | Renseignement d'État avancé | Exploitation de 0-day, compromission d'infrastructure | Journalistes, dissidents, États |

Ce document couvre les niveaux 1 à 3. Le niveau 4 nécessite des ressources et des pratiques hors de portée d'un collectif standard.

---

## 2. Messagerie chiffrée

### 2.1 Signal : référence et limites

**Ce que Signal fait**

Signal implémente le *Signal Protocol*, un protocole de chiffrement de bout en bout (*end-to-end encryption*, E2E) considéré comme l'état de l'art. Le principe :

```
[Alice]                          [Serveur Signal]                    [Bob]
  |                                     |                              |
  |-- message chiffré avec clé Bob ---->|-- message chiffré ---------->|
  |                                     |                              |
  |              Le serveur ne voit que du texte chiffré               |
  |              Il ne peut pas déchiffrer le contenu                  |
```

Le chiffrement repose sur un échange de clés *Diffie-Hellman* combiné à un mécanisme de *forward secrecy* (chaque session génère de nouvelles clés temporaires). Même si une clé est compromise dans le futur, les messages passés restent illisibles : les clés de session sont détruites après usage.

**Configuration essentielle**

```
Paramètres Signal à activer obligatoirement :

[x] Disparition automatique des messages
    → 24h pour les communications sensibles
    → 7 jours pour les groupes de coordination
    → Réduit la surface d'exposition en cas de saisie du terminal

[x] Verrouillage d'inscription (PIN de registre)
    → Empêche le transfert du numéro Signal sans consentement
    → Menu : Paramètres > Compte > Verrouillage d'inscription

[ ] Sauvegardes cloud
    → NE PAS activer
    → Les sauvegardes Google Drive ou iCloud sont accessibles
      aux autorités via réquisition judiciaire aux opérateurs cloud
    → Une sauvegarde cloud d'une messagerie E2E détruit le E2E

[x] Note to self effacée
    → Ne pas stocker de documents sensibles dans Signal
      comme si c'était un cloud personnel
```

**Les limites réelles**

Signal n'est pas anonyme. Il est confidentiel.

```
Ce que Signal protège :
  ✓ Le contenu des messages (illisible pour Signal et les tiers)
  ✓ Les pièces jointes
  ✓ Les appels et notes vocales

Ce que Signal ne protège PAS :
  ✗ Le fait que Alice et Bob communiquent (métadonnée de trafic)
  ✗ La fréquence et les horaires des échanges
  ✗ Le numéro de téléphone de chaque participant
    (lié à une identité réelle via l'opérateur)
  ✗ Le contenu si le terminal est saisi déverrouillé
```

Signal collecte et peut être contraint de fournir aux autorités : la date de création du compte, la date de dernière connexion, et le numéro de téléphone enregistré. C'est documenté dans les rapports de transparence de Signal Foundation. Rien d'autre, car Signal ne stocke pas les messages.

**Quand Signal suffit :** communications confidentielles entre personnes de confiance dont l'identité est déjà connue de l'adversaire potentiel.

**Quand Signal ne suffit pas :** quand l'anonymat de l'émetteur est l'enjeu (l'adversaire ne doit pas savoir *qui* communique, pas seulement *quoi*).

---

### 2.2 Briar : P2P sans infrastructure

**Architecture**

Briar est une messagerie *peer-to-peer* qui ne passe par aucun serveur central. Les messages transitent directement entre les terminaux par trois canaux possibles :

```
Mode 1 : Bluetooth (portée ~10m)
Mode 2 : Wi-Fi local (même réseau, sans Internet)
Mode 3 : Internet via Tor (anonymisation du trafic)
```

Il n'y a pas de serveur Briar. Pas de compte lié à un numéro de téléphone. L'identité dans Briar est une paire de clés cryptographiques générée localement. La synchronisation des messages se fait quand les deux terminaux sont en contact (direct ou via Tor) : c'est un modèle *store-and-forward* décentralisé.

**Cas d'usage**

```
Situation 1 : réseau téléphonique indisponible ou non sûr sur site
  → Briar en Bluetooth ou Wi-Fi local
  → Pas de signal GSM émis, pas capturable par IMSI-catcher

Situation 2 : communication anonyme sans numéro de téléphone
  → Briar via Tor
  → L'interlocuteur ne connaît pas ton numéro
  → Aucun opérateur dans la boucle

Situation 3 : infrastructure Internet coupée ou censurée
  → Briar en mode local fonctionne sans Internet
```

**Limite principale :** les deux parties doivent avoir Briar installé et s'être échangé leur identifiant Briar en amont (en personne de préférence, pour éviter une usurpation d'identité à l'échange de clés). Pas adapté à la communication de masse.

---

### 2.3 Telegram : usages et pièges

Telegram est l'outil de diffusion d'information de masse le plus utilisé par les collectifs militants en France. C'est aussi le vecteur de fuite numérique le plus fréquent. La confusion vient d'une mauvaise compréhension de son architecture.

**Architecture de Telegram**

```
Messages "normaux" (groupes, canaux, MP standards) :
  [Terminal] ---> [Serveur Telegram] ---> [Terminal]
      |                  |
      |   Chiffrement en transit (TLS)   |
      |   Mais Telegram détient les clés |
      |   et peut lire les messages      |

"Chats secrets" (activés manuellement) :
  [Terminal] <--E2E Signal Protocol--> [Terminal]
      |                  |
      |   Telegram ne peut pas lire     |
      |   Pas de sauvegarde serveur     |
```

**Ce que Telegram peut fournir aux autorités :**

Les messages stockés sur ses serveurs (tout sauf les Chats secrets), les métadonnées de compte, les adresses IP de connexion. Telegram a longtemps revendiqué une politique de non-coopération, mais depuis l'arrestation de Pavel Durov en France en août 2024 et les suites judiciaires, sa politique effective de coopération avec les autorités européennes a évolué. Ne pas se fier à la réputation passée.

**Règles d'usage pour un collectif**

```
Usage acceptable :
  ✓ Canal public de communication officielle du collectif
    (tout ce qui est dit là est déjà public)
  ✓ Diffusion d'informations non sensibles à un large réseau
  ✓ Liens vers des ressources, agenda public

Usage à risque :
  ✗ Coordination opérationnelle dans un groupe de 200 personnes
    (au moins une est inconnue)
  ✗ Partage de fichiers avec métadonnées sans nettoyage préalable
  ✗ Confiance dans la confidentialité des groupes "privés"
    (privé = non listé publiquement, pas chiffré)
```

---

### 2.4 Email : ProtonMail et alternatives

**Le problème de l'email standard**

Un email envoyé depuis Gmail vers une boîte Orange transite en clair sur les serveurs des deux opérateurs. Ces opérateurs peuvent être requis de fournir le contenu aux autorités. Les métadonnées (expéditeur, destinataire, objet, heure, adresse IP de connexion) sont conservées et accessibles.

**ProtonMail**

ProtonMail implémente le chiffrement E2E entre comptes ProtonMail (via PGP sous le capot, géré automatiquement). Les messages entre deux utilisateurs ProtonMail ne sont pas lisibles par Proton. Juridiction suisse, hors de l'UE et du cadre GDPR pour les demandes judiciaires françaises, mais Proton a été contraint par une décision judiciaire helvétique de fournir des informations d'adresse IP dans au moins un cas documenté (2021).

**Règle d'or pour l'email :**

L'email est structurellement inadapté aux communications sensibles à cause des métadonnées. Même chiffré, l'objet du message est souvent en clair, et les métadonnées (qui écrit à qui, quand) sont toujours disponibles. Pour les communications vraiment sensibles, Signal reste préférable.

---

## 3. Métadonnées : le vecteur de fuite ignoré

### 3.1 EXIF dans les images

**Ce qu'est EXIF**

EXIF (*Exchangeable Image File Format*) est un standard de métadonnées intégré dans les fichiers image (JPEG, PNG, TIFF, HEIC). Ces métadonnées sont écrites directement dans le fichier, invisibles à l'affichage mais lisibles par tout logiciel qui sait les extraire.

```bash
# Ce qu'ExifTool révèle sur une photo standard de smartphone :

$ exiftool photo.jpg

File Name                       : photo.jpg
GPS Latitude                    : 48 deg 51' 23.54" N   ← localisation précise
GPS Longitude                   : 2 deg 21' 5.11" E     ← à quelques mètres
GPS Altitude                    : 35 m Above Sea Level
Date/Time Original              : 2026:04:13 22:47:03    ← heure exacte
Make                            : Apple
Camera Model Name               : iPhone 14 Pro          ← modèle du terminal
Software                        : 17.4.1                 ← version iOS
```

**Les vecteurs de fuite**

La plupart des plateformes sociales (Instagram, Facebook, X) suppriment les EXIF à l'upload. Ce n'est pas le cas de :

```
Vecteurs qui CONSERVENT les EXIF :
  → Telegram (fichiers envoyés comme "fichier", pas comme "photo compressée")
  → Discord (fichiers attachés)
  → Email (pièces jointes)
  → WeTransfer, Google Drive, Dropbox (partage de fichiers)
  → Sites web sans traitement d'image automatique
  → Tout partage direct du fichier original
```

**Reconstitution de trajectoire**

Une série de photos avec EXIF permet de reconstituer les déplacements d'une personne dans le temps avec une précision GPS. C'est une technique OSINT standard utilisée par des journalistes, des enquêteurs privés, et des services judiciaires.

### 3.2 Métadonnées dans les documents

Les fichiers Office (`.docx`, `.xlsx`, `.pptx`) et PDF intègrent des métadonnées qui incluent souvent :

```
Métadonnées typiques d'un .docx :

Author           : Jean-Pierre Dupont      ← nom réel de l'auteur
Last Modified By : Marie Martin            ← nom réel du dernier éditeur
Created          : 2026-03-15 14:32:00
Company          : Association X
Revision Number  : 7                       ← nombre de versions
Total Edit Time  : 2 hours 43 minutes
```

Un document Word partagé dans un groupe Telegram avec le nom réel de l'auteur dans ses métadonnées constitue une identification directe.

### 3.3 Outillage de nettoyage

**ExifTool (référence CLI)**

```bash
# Installer ExifTool
sudo apt install exiftool          # Debian/Ubuntu
brew install exiftool              # macOS

# Supprimer TOUTES les métadonnées d'un fichier
exiftool -all= photo.jpg

# Traitement en lot (dossier entier)
exiftool -all= /chemin/vers/dossier/*.jpg

# Vérifier les métadonnées restantes
exiftool photo.jpg

# Supprimer uniquement les données GPS (conserver les autres)
exiftool -gps:all= photo.jpg
```

**MAT2 (Metadata Anonymisation Toolkit)**

Outil Python orienté sécurité, gère les formats image, PDF, documents Office, audio, vidéo.

```bash
# Installer MAT2
pip install mat2
# ou
sudo apt install mat2

# Nettoyer un fichier
mat2 document.pdf

# Nettoyer sans créer de fichier de sauvegarde
mat2 --inplace document.pdf

# Vérifier le résultat
mat2 --check document.pdf
```

**Applications mobiles**

```
Android :
  → Scrambled Exif (F-Droid) : supprime les EXIF avant partage
  → Imagepipe (F-Droid) : redimensionne + supprime les métadonnées

iOS :
  → Désactiver la géolocalisation de l'app Appareil photo :
    Réglages > Confidentialité > Services de localisation
    > Appareil photo > Jamais
```

**Règle de workflow**

```
Avant tout partage de fichier hors plateforme sociale :

1. Vérifier les métadonnées présentes
   $ exiftool fichier.jpg | grep -E "GPS|Author|Creator"

2. Supprimer si nécessaire
   $ exiftool -all= fichier.jpg

3. Vérifier à nouveau
   $ exiftool fichier.jpg

Ce workflow prend 10 secondes. Il élimine un vecteur
de traçabilité systématiquement sous-estimé.
```

---

## 4. Surveillance mobile : IMSI-catcher et réseaux GSM

### 4.1 Fonctionnement technique

**L'architecture GSM en conditions normales**

```
[Terminal mobile]
       |
       | (signal radio)
       |
[Antenne-relais légitime BTS]
       |
       | (réseau opérateur)
       |
[MSC - Mobile Switching Center]
       |
       | (Internet / RTC)
       |
[Destinataire]
```

Le terminal choisit automatiquement l'antenne avec le signal le plus fort. Il n'y a pas d'authentification mutuelle dans GSM (2G) : le terminal s'authentifie auprès du réseau, mais pas l'inverse. Cette asymétrie est la vulnérabilité exploitée par l'IMSI-catcher.

**L'attaque IMSI-catcher (attaque de type MITM actif)**

```
[Terminal mobile]
       |
       | (signal radio fort, prioritaire)
       |
[IMSI-catcher - fausse BTS]
  |          |
  |          | → Collecte : IMSI, IMEI, numéros appelés,
  |          |   durée des appels, position géographique
  |          |
  |          | → Optionnellement : downgrade vers GSM 2G
  |          |   (suppression du chiffrement A5/0)
  |          |   → interception des communications en clair
  |
[Vraie antenne-relais opérateur]
       |
    [Réseau normal]
```

L'IMSI-catcher se positionne entre le terminal et le réseau légitime. Il émet un signal plus fort que les antennes environnantes pour forcer les terminaux à s'y connecter. En 4G/5G, l'authentification mutuelle est renforcée (le terminal peut vérifier l'antenne), mais des techniques de *downgrade forcé* vers 2G contournent cette protection sur les terminaux qui acceptent encore le 2G.

**Ce que l'IMSI-catcher collecte**

```
Toujours collecté :
  → IMSI (identifiant SIM, lié à l'abonné chez l'opérateur)
  → IMEI (identifiant matériel du terminal)
  → Présence géographique (le terminal est dans le rayon de couverture)
  → Métadonnées des appels (numéros, durée, heure)

Collecté si downgrade 2G ou protocole non chiffré :
  → Contenu des SMS (SMS non chiffrés par défaut)
  → Contenu des appels vocaux (si GSM 2G sans chiffrement)

Non collecté (chiffrement E2E actif) :
  → Contenu des messages Signal, WhatsApp, iMessage
  → Contenu des appels Signal ou FaceTime
```

**La valeur de l'IMSI pour l'enquêteur**

L'IMSI seul ne donne pas le nom. Mais une réquisition judiciaire à l'opérateur mobile associe l'IMSI à un abonné nominal. Un IMSI capté sur un lieu X à une heure Y corrèle avec une identité réelle en quelques heures via procédure judiciaire. Une liste d'IMSI captés sur plusieurs sites différents dans le temps reconstitue un graphe de présence et de relation.

### 4.2 Cadre légal en France

```
Chronologie légale :

2015 → Loi Renseignement : légalisation des IMSI-catchers
        pour les services de renseignement

2016 → Extension à la police judiciaire
        (sur autorisation d'un juge d'instruction
        ou du procureur dans le cadre d'une enquête)

→ Usage documenté sur des manifestations et des militants
  (militants antinucléaires de Bure, manifestations politiques)
```

### 4.3 Contre-mesures

**Mode avion**

La seule contre-mesure fiable à 100% contre l'IMSI-catcher est l'absence d'émission radio du terminal. Un téléphone en mode avion n'émet pas de signal GSM/4G/5G. Il ne peut pas être capté par un faux relais.

```
Limites du mode avion :
  → Le GPS reste actif par défaut (capteur passif, ne reçoit que)
    → Éteindre explicitement le GPS si nécessaire
  → Le Wi-Fi et Bluetooth peuvent rester actifs
    → Les désactiver manuellement ou vérifier la configuration
  → Certains terminaux compromis peuvent émettre
    même en mode avion (menace niveau 4, hors scope ici)
```

**Détection d'IMSI-catcher**

L'outil **SnoopSnitch** (Android, nécessite un terminal rooté ou Qualcomm) surveille les paramètres du réseau GSM et détecte les anomalies caractéristiques d'un faux relais :

```
Indicateurs surveillés par SnoopSnitch :
  → CID (Cell Identity) : changements anormaux
  → LAC (Location Area Code) : incohérences géographiques
  → Force du signal : pic anormal non cohérent avec la cartographie
  → Downgrade forcé vers 2G depuis une zone normalement 4G
```

La détection n'est pas fiable à 100% et produit des faux positifs en zones à couverture instable. C'est un indicateur d'alerte, pas une certitude.

**Radio PMR 446 comme alternative sur site**

Les radios PMR (*Private Mobile Radio*) 446 MHz sont légales en France sans licence, disponibles pour moins de 30 €, et ne passent pas par le réseau téléphonique. Elles n'émettent pas d'identifiants SIM ou IMEI. Leur portée est de 1 à 5 km en terrain dégagé.

```
Avantages PMR :
  ✓ Zéro lien avec une identité réelle
  ✓ Fonctionne sans réseau (infrastructure zéro)
  ✓ Non captable par un IMSI-catcher (fréquence différente)
  ✓ Coût minimal

Inconvénients PMR :
  ✗ Communication en clair (interceptable par scanner radio)
  ✗ Portée limitée
  ✗ Ne convient qu'à la coordination sur site, pas à distance
```

---

## 5. Réseau et anonymisation

### 5.1 VPN : ce que ça fait vraiment

**Ce qu'un VPN change dans le flux réseau**

```
Sans VPN :
  [Terminal] → [FAI] → [Internet] → [Site/Service]
     IP réelle visible par le FAI et par le site/service

Avec VPN :
  [Terminal] → [FAI] → [Serveur VPN] → [Internet] → [Site/Service]
     IP chiffrée  IP masquée   IP du VPN visible    IP du VPN visible
     pour le FAI  pour le FAI   par le site          par le site
```

**Ce qu'un VPN protège**

```
✓ Masque l'adresse IP réelle aux sites visités
✓ Chiffre le trafic entre le terminal et le serveur VPN
  (empêche le FAI de voir les destinations)
✓ Protège sur les Wi-Fi publics non sécurisés
  (café, bibliothèque, hôtel)

✗ Ne protège PAS contre :
  → Le serveur VPN lui-même (il voit tout)
  → Les cookies de tracking et l'identité de navigateur
  → Une corrélation temporelle (si le timing d'entrée/sortie
    du VPN est analysé simultanément des deux côtés)
  → Les fuites DNS si mal configuré
```

**Choisir un VPN pour un usage sensible**

```
Critères :
  → Juridiction hors de l'UE (ou hors des accords 5/9/14 Eyes)
  → Politique de non-journalisation vérifiée par audit indépendant
    (pas juste une promesse marketing)
  → Paiement anonyme possible (cash, Monero)

Recommandations documentées :
  → Mullvad (Suède) : audit public disponible, paiement cash/Monero accepté
  → ProtonVPN (Suisse) : open source, audité, tier gratuit disponible

À éviter :
  → VPN gratuits (le service, c'est toi)
  → VPN basés aux US ou UK (juridictions contraignantes)
  → VPN sans politique de logs publiée et vérifiée
```

### 5.2 Tor : routage en oignon

**Architecture**

Tor applique trois couches de chiffrement successives. Le trafic passe par trois nœuds (relais) choisis aléatoirement dans le réseau Tor :

```
[Terminal]
   |
   | Couche 3 chiffrée (pour nœud 1 seulement)
   |
[Nœud 1 - Guard]
   → Déchiffre couche 3, connaît l'origine (terminal)
   → Ne connaît PAS la destination finale
   |
   | Couche 2 chiffrée (pour nœud 2 seulement)
   |
[Nœud 2 - Middle]
   → Déchiffre couche 2, ne connaît ni l'origine ni la destination
   |
   | Couche 1 chiffrée (pour nœud 3 seulement)
   |
[Nœud 3 - Exit]
   → Déchiffre couche 1, connaît la destination
   → Ne connaît PAS l'origine
   |
[Site/Service de destination]
```

Aucun nœud seul ne connaît à la fois l'origine et la destination. C'est la propriété fondamentale qui distingue Tor d'un VPN simple.

**Limites**

```
Ce que Tor ne protège pas contre :
  → La corrélation de trafic globale (si un adversaire contrôle
    à la fois le nœud d'entrée ET le nœud de sortie,
    il peut corréler par analyse de timing)
  → Les applications qui fuient l'IP réelle hors Tor
    (JavaScript, plugins, applis natives)
  → L'identification par comportement (fingerprinting de navigateur)

Règles d'usage :
  → Utiliser Tor Browser (configuré pour éviter les fuites)
  → Ne JAMAIS se connecter à des comptes personnels via Tor
    (détruit l'anonymat immédiatement)
  → Ne pas redimensionner la fenêtre Tor Browser
    (le fingerprinting utilise la taille de fenêtre)
```

### 5.3 Tails OS

Tails (*The Amnesic Incognito Live System*) est un système d'exploitation live démarré depuis une clé USB. Ses propriétés :

```
Propriétés de Tails :

[x] Tout le trafic routé via Tor par défaut
[x] Aucune écriture sur le disque dur de la machine hôte
    (la RAM est effacée à l'extinction)
[x] Amnésie totale : après reboot, aucune trace
[x] Include : Tor Browser, client Signal (via extension),
    MAT2, KeePassXC, outils de chiffrement de fichiers

Usage type :
  → Communications depuis un terminal inconnu (cybercafé, ordi partagé)
  → Publication de documents sensibles
  → Gestion de comptes séparés depuis un espace isolé
```

---

## 6. Gestion des identités numériques

### 6.1 Séparation des identités

La séparation des identités consiste à maintenir des identités numériques distinctes et non corrélables pour des activités de niveaux de sensibilité différents.

```
Mauvaise pratique (identité unique) :
  Même adresse email pour :
    → Compte bancaire
    → Compte GitHub pro
    → Coordination de collectif
    → Compte Instagram personnel

  Un seul point de compromission expose tout.

Bonne pratique (identités séparées) :
  Identité A - personnelle / pro :
    → Email Gmail lié au nom réel
    → Réseaux sociaux personnels
    → Comptes administratifs

  Identité B - collectif public :
    → Email ProtonMail sans nom réel
    → Comptes réseaux sociaux dédiés au collectif
    → Pas de lien apparent avec l'identité A

  Identité C - coordination sensible :
    → Compte Signal sur numéro prépayé
    → Briar
    → Aucun lien avec A ou B
```

**Les fuites courantes qui cassent la séparation**

```
→ Réutilisation du même pseudonyme sur différentes plateformes
→ Réutilisation du même avatar ou de la même photo de profil
→ Connexion aux deux identités depuis la même adresse IP
  (utiliser le VPN ou Tor pour l'identité B/C)
→ Mentionner dans l'identité B des éléments qui permettent
  de remonter à l'identité A (lieu de résidence, employeur,
  références personnelles précises)
```

### 6.2 Corrélation de pseudonymes : le piège de l'homogénéité

La corrélation de pseudonymes est une technique OSINT qui consiste à relier des comptes supposément distincts via des invariants comportementaux ou stylistiques.

**Vecteurs de corrélation**

```
Techniques passives :
  → Même pseudonyme ou variante évidente (pierre_37 → p.pierre37)
  → Même avatar ou image de profil
  → Mêmes horaires de connexion / publication
  → Même style d'écriture (stylométrie)
  → Même adresse IP de connexion

Techniques actives :
  → Corrélation d'abonnés communs (les deux comptes suivent
    les mêmes 47 comptes peu communs)
  → Analyse des erreurs de frappe récurrentes
    (la stylométrie identifie via les tics d'écriture)
```

**Contre-mesures basiques**

```
→ Pseudonymes sans lien logique entre les identités
→ Avatars générés, pas de photo personnelle
→ Connexions depuis des IP différentes (VPN ou Tor)
→ Ne jamais cross-poster entre identités
→ Varier les horaires de publication si possible
```

---

## 7. Analyse de trafic : ce que le chiffrement ne cache pas

C'est le point le plus souvent mal compris. Le chiffrement protège le contenu. Il ne masque pas les métadonnées de communication.

```
Ce qu'un analyste de trafic peut voir même sur Signal chiffré :

  Terminal A contacte Terminal B à 23h47
  Durée de la session : 4 minutes
  Terminal A était géolocalisé sur cellule réseau de Paris 11e
  Terminal B était géolocalisé sur cellule réseau de Bordeaux
  3 minutes plus tard, Terminal B contacte Terminal C et D
  → Graphe de diffusion d'information reconstitué
```

**L'analyse de trafic dans un contexte de surveillance**

```
Scénario : IMSI-catcher déployé sur un site X

Données collectées :
  → Liste de 847 IMSI présents sur site
  → 12 IMSI ont émis des communications dans l'heure
    précédant le rassemblement
  → Corrélation avec bases de données opérateurs :
    ces 12 IMSI correspondent à 12 abonnés identifiés
  → Ces 12 personnes constituent le premier cercle de suspects
    pour "participation à l'organisation"
```

**Contre-mesure principale :** limiter les émissions radio dans les phases sensibles (mode avion, Briar local, PMR). Le contenu est une information secondaire. La présence est la donnée primaire.

---

## 8. Compartimentation de l'information

La compartimentation est le principe organisationnel qui découle du threat modeling. Elle consiste à limiter la circulation de chaque information au cercle qui en a strictement besoin, au moment où elle en a besoin.

**Modèle à cercles concentriques**

```
Cercle 0 - coordination de cœur (3 à 5 personnes)
  Canal : Signal E2E, messages éphémères 24h
  Information : décisions critiques, informations à haute sensibilité temporelle
  Règle : aucune information de ce niveau ne sort vers le cercle 1
           avant la fenêtre temporelle définie

Cercle 1 - réseau de confiance proche (10 à 30 personnes)
  Canal : Signal groupes fermés
  Information : informations opérationnelles générales
  Règle : information partagée à J-X seulement

Cercle 2 - réseau élargi (30 à 200 personnes)
  Canal : Telegram groupes avec lien d'invitation contrôlé
  Information : informations orientantes, pas opérationnelles
  Règle : pas d'information permettant une interception préventive

Cercle 3 - public
  Canal : Telegram canal public, réseaux sociaux
  Information : uniquement ce qui est déjà ou volontairement public
```

**Principe de la fenêtre temporelle**

L'information la plus sensible perd de sa valeur dès qu'elle devient publique de fait (rassemblement visible). La compartimentation temporelle consiste à ne diffuser chaque niveau d'information qu'au moment où la valeur pour l'adversaire commence à diminuer.

```
Information critique → diffusée dans le cercle 0 à J-72h
Information orientante → diffusée dans le cercle 1 à J-12h
Information publique → diffusée dans le cercle 3 à J-2h ou J
```

---

## 9. Sécurité physique du terminal

La sécurité logicielle est inutile si le terminal est physiquement compromis ou saisi déverrouillé.

**Chiffrement du stockage**

```
iOS :
  → Chiffrement activé par défaut si code PIN défini
  → Utiliser un code à 6 chiffres minimum (pas 4)
  → Désactiver Touch ID / Face ID dans les situations à risque
    (Paramètres > Touch/Face ID > désactiver temporairement)
  → Raison : un code PIN ne peut pas être obtenu par contrainte
    physique légalement (en France, refus de remettre clé de
    déchiffrement = infraction, mais refus d'utiliser son empreinte
    est moins clairement illégal selon jurisprudence actuelle)

Android :
  → Chiffrement activé par défaut sur Android 6+
  → Vérifier : Paramètres > Sécurité > Chiffrement
  → Même logique pour le code PIN vs biométrie
```

**Faraday bag**

```
Principe : tissu conducteur qui forme une cage de Faraday
           bloquant les signaux électromagnétiques entrants et sortants

Bloque : GSM / 4G / 5G / Wi-Fi / Bluetooth / GPS (signal actif)
Ne bloque pas : GPS en mode passif (réception seule) sur certains modèles

Usage : transporter un terminal de manière à ce qu'il
        n'émette pas de signal radio et ne soit pas géolocalisable
        pendant un trajet sensible

Coût : 15 à 40 €
Vérification d'efficacité : appeler le terminal dans le bag
                             (il ne doit pas sonner)
```

---

## 10. Matrice de décision : quel outil pour quel usage

| Besoin | Outil recommandé | Alternative | À éviter |
|--------|-----------------|-------------|----------|
| Messagerie confidentielle 1:1 | Signal | Briar | SMS, Telegram standard |
| Messagerie confidentielle groupe | Signal | Wire | Telegram groupe |
| Messagerie anonyme (sans numéro) | Briar | Session | - |
| Communication sur site hors réseau | Briar (BT/Wi-Fi) | Radio PMR | Téléphone allumé |
| Email sécurisé | ProtonMail | Tutanota | Gmail, Outlook |
| Navigation anonyme | Tor Browser | Mullvad VPN | VPN gratuit |
| Environnement isolé | Tails OS | Whonix | - |
| Nettoyage métadonnées (desktop) | ExifTool / MAT2 | - | Rien (ne pas oublier) |
| Nettoyage métadonnées (mobile) | Scrambled Exif | Désactiver GPS photo | - |
| Isolation terminal | Mode avion | Faraday bag | - |
| Communication courte portée | Radio PMR 446 | Briar Bluetooth | Téléphone |

---

## 11. Ressources

**Documentation technique de référence**

* [Signal Protocol documentation](https://signal.org/docs/) - spécifications cryptographiques du protocole Signal
* [Tor Project](https://www.torproject.org/fr/) - documentation officielle, guide OPSEC
* [Tails documentation](https://tails.boum.org/doc/index.fr.html) - guide d'installation et d'usage
* [ExifTool documentation](https://exiftool.org/) - référence complète des commandes

**Guides de sécurité numérique pour militants**

* [Surveillance Self-Defense (EFF)](https://ssd.eff.org/fr) - guide progressif selon le niveau de risque, disponible en français
* [Security in a Box](https://securityinabox.org/fr/) - guides pratiques par outil et par contexte
* [La Quadrature du Net](https://www.laquadrature.net/) - veille juridique et technique sur la surveillance en France

**Sur l'IMSI-catcher**

* [SnoopSnitch](https://f-droid.org/packages/de.srlabs.snoopsnitch/) - application de détection, disponible sur F-Droid
* [EFF - IMSI Catcher Guide](https://www.eff.org/wp/gotta-catch-em-all-understanding-how-imsi-catchers-interact-our-phones) - documentation technique anglophone

---

> Ce document est mis à jour régulièrement. Les outils et leurs configurations évoluent : vérifier les dates de dernière mise à jour avant de s'appuyer sur des recommandations spécifiques.
