# Messagerie chiffrée

> Statut : stable
> Dernière mise à jour : mai 2026
> Dossier : `cyber-opsec/`
> Prérequis : lire [`threat-model.md`](threat-model.md) avant ce fichier

Ce fichier documente les outils de messagerie adaptés à un collectif soumis à un niveau de menace 2 en France. Pour chaque outil : ce qu'il fait techniquement, ce qu'il protège réellement, ce qu'il ne protège pas, et la configuration à appliquer.

---

## Sommaire

1. [Comprendre le chiffrement de bout en bout](#1-comprendre-le-chiffrement-de-bout-en-bout)
2. [Signal - le standard de référence](#2-signal--le-standard-de-référence)
3. [Briar - P2P sans infrastructure](#3-briar--p2p-sans-infrastructure)
4. [Telegram - usages et pièges](#4-telegram--usages-et-pièges)
5. [Email - ProtonMail et alternatives](#5-email--protonmail-et-alternatives)
6. [Tableau de décision](#6-tableau-de-décision)
7. [Ce que la messagerie ne protège jamais](#7-ce-que-la-messagerie-ne-protège-jamais)
8. [Sources et références](#8-sources-et-références)

---

## 1. Comprendre le chiffrement de bout en bout

### Le problème du transit en clair

Quand vous envoyez un SMS, votre message est lisible par votre opérateur téléphonique (Orange, SFR, Bouygues, Free). L'opérateur peut le fournir à un juge sur réquisition judiciaire. Quand vous envoyez un email Gmail, Google stocke votre message sur ses serveurs et peut le fournir aux autorités américaines, qui peuvent le transmettre aux autorités françaises via des accords de coopération internationale.

```
Messagerie sans chiffrement E2E :

[Votre téléphone] → [Serveur de l'opérateur ou plateforme]
                              ↓
                    [Réquisition judiciaire]
                              ↓
                    [Police / Parquet / Juge]
```

### Le chiffrement de bout en bout (E2E)

E2E signifie que le message est chiffré sur votre téléphone avant d'être envoyé, et n'est déchiffré que sur le téléphone du destinataire. Le serveur intermédiaire ne voit que du texte chiffré illisible.

```
Messagerie avec chiffrement E2E :

[Votre téléphone]                    [Téléphone destinataire]
      |                                        |
   Chiffrement                             Déchiffrement
   avec clé                               avec clé
   du destinataire                        personnelle
      |                                        |
      └──── [Serveur] ──── texte illisible ────┘
               ↓
    [Réquisition judiciaire]
               ↓
    "Désolé, on ne peut pas lire ça"
```

**La condition :** le chiffrement E2E ne fonctionne que si les deux parties utilisent le même outil configuré correctement. Un message Signal vers un numéro qui n'a pas Signal passe en SMS classique, non chiffré.

### La clé cryptographique - mécanisme simplifié

Le chiffrement repose sur des paires de clés asymétriques :

* **Clé publique** : diffusée à tous. Sert à chiffrer les messages à votre destination.
* **Clé privée** : stockée uniquement sur votre appareil. Sert à déchiffrer les messages reçus.

Analogie : votre clé publique est une boîte aux lettres ouverte dans laquelle n'importe qui peut déposer un message. Votre clé privée est la seule clé qui permet d'ouvrir cette boîte. Le serveur peut voir la boîte, mais pas son contenu.

**Forward secrecy (confidentialité persistante) :** Signal va plus loin. Chaque message utilise une clé de session temporaire différente, détruite après usage. Même si votre clé principale est compromise dans le futur, les messages passés restent illisibles - les clés qui les ont chiffrés n'existent plus.

---

## 2. Signal - le standard de référence

### Ce qu'est Signal Protocol

Signal utilise le **Signal Protocol**, conçu par Open Whisper Systems en 2013. C'est le protocole de chiffrement de référence mondiale : il est audité publiquement, utilisé par WhatsApp (pour les messages, pas les métadonnées), iMessage, et d'autres. Son code source est ouvert, ce qui signifie que n'importe quel chercheur en sécurité peut vérifier qu'il ne contient pas de porte dérobée.

Le protocole combine :
* **X3DH** (Extended Triple Diffie-Hellman) : échange de clés initial sécurisé
* **Double Ratchet** : régénération des clés à chaque message pour assurer la forward secrecy
* **Curve25519, AES-256, HMAC-SHA256** : algorithmes cryptographiques de référence

**Ce que tout ça signifie pratiquement :** même si Signal était contraint légalement de livrer des données, il ne pourrait livrer que la date de création du compte, la date de dernière connexion, et le numéro de téléphone. Pas les messages - ils ne sont stockés nulle part sur les serveurs Signal.

### Installation et configuration essentielle

**Étape 1 - Téléchargement**
Signal est disponible sur iOS (App Store) et Android (Play Store ou APK direct sur signal.org). Toujours télécharger depuis la source officielle. Ne jamais utiliser un APK trouvé ailleurs.

**Étape 2 - Configuration de sécurité obligatoire**

```
Paramètre 1 : Disparition automatique des messages
  Emplacement : Paramètres > Confidentialité > Disparition par défaut
  Valeur recommandée :
    → 24h pour les communications sensibles
    → 7 jours pour les groupes de coordination ordinaires
  Pourquoi : si votre téléphone est saisi, les messages anciens
             n'existent plus. La police ne peut saisir que
             ce qui existe au moment de la saisie.

Paramètre 2 : Verrouillage d'inscription
  Emplacement : Paramètres > Compte > Verrouillage d'inscription
  Action : activer + créer un PIN à 6+ chiffres
  Pourquoi : sans ce PIN, quelqu'un qui accède à votre numéro
             (SIM volée, opérateur compromis) peut transférer
             votre compte Signal sur un autre appareil.

Paramètre 3 : Sauvegardes cloud - NE PAS activer
  Sur Android : ne pas activer la sauvegarde Google Drive
  Sur iOS : dans Paramètres Signal > Chats > Sauvegardes, vérifier que
            la sauvegarde iCloud est désactivée
  Pourquoi critique : si vous sauvegardez Signal sur le cloud,
                     vos messages sont stockés sur des serveurs
                     Google ou Apple, accessibles par réquisition
                     judiciaire. Vous détruisez le bénéfice du E2E.

Paramètre 4 : Note to self
  Ne pas utiliser la "note personnelle" Signal comme stockage
  de documents sensibles. Ce n'est pas un coffre-fort.

Paramètre 5 : Écran de confidentialité
  Emplacement : Paramètres > Confidentialité > Écran de confidentialité
  Action : activer
  Pourquoi : cache les aperçus des conversations dans le
             gestionnaire de tâches, visible par quelqu'un
             regardant votre écran par-dessus votre épaule.
```

**Étape 3 - Vérifier les numéros de sécurité**

Signal permet de vérifier que vous communiquez bien avec la bonne personne (pas un intermédiaire qui se fait passer pour elle) via les "numéros de sécurité" :

```
Emplacement : ouvrir une conversation → appuyer sur le nom → Voir le numéro de sécurité

Pour vérifier en personne : comparer visuellement les chiffres
Pour vérifier à distance : lire les chiffres à voix haute au téléphone
ou via un canal différent (pas Signal)
```

Cette étape est critique si vous avez des raisons de penser que votre réseau a pu être infiltré.

### Les limites réelles de Signal

**Ce que Signal protège :**
* Le contenu des messages (illisible pour Signal, les opérateurs, les autorités)
* Les pièces jointes
* Les appels et notes vocales
* Les réactions aux messages

**Ce que Signal ne protège PAS :**

```
Signal ne cache pas :
  → Le fait que vous communiquez avec quelqu'un
    (métadonnée de trafic visible pour les opérateurs)
  → La fréquence et les horaires de vos échanges
  → Le numéro de téléphone associé à votre compte Signal
    (lié à votre identité réelle via l'opérateur)
  → Le contenu si votre téléphone est saisi déverrouillé
    et que les messages ne sont pas encore supprimés
```

**Signal est lié à un numéro de téléphone.** Ce numéro est une identité réelle rattachée à un abonné. Un juge peut requérir l'opérateur d'identifier l'abonné derrière un numéro. Signal est un outil de confidentialité, pas d'anonymat.

**Cas d'usage adapté :** communications confidentielles entre personnes de confiance dont l'identité est déjà connue de l'adversaire potentiel, ou qui acceptent que l'adversaire sache qu'elles communiquent.

**Cas d'usage inadapté :** communications anonymes où l'adversaire ne doit pas savoir qui parle à qui (utiliser Briar à la place).

### Les groupes Signal

Signal supporte les groupes chiffrés jusqu'à 1 000 membres. La même logique s'applique :

```
Groupes Signal - bonnes pratiques :
  → Activer la disparition automatique au niveau du groupe
  → Limiter la taille du groupe au besoin réel
    (chaque membre est un vecteur de fuite potentiel)
  → Ne jamais discuter dans un groupe Signal de questions
    qui concernent uniquement 2 membres (utiliser une conv. directe)
  → Le lien d'invitation du groupe ne donne pas accès
    aux messages passés (ceux-ci sont chiffrés par des
    clés que le nouveau membre ne possède pas)
```

---

## 3. Briar - P2P sans infrastructure

### Architecture fondamentalement différente

Briar est une messagerie **peer-to-peer** (P2P) : les messages transitent directement entre les terminaux, sans passer par aucun serveur central. Il n'existe pas de "serveur Briar" qui pourrait être réquisitionné.

```
Signal (architecture centralisée) :
[Téléphone A] → [Serveur Signal] → [Téléphone B]
                      ↑
              Accessible par réquisition
              (même si contenu illisible)

Briar (architecture P2P) :
[Téléphone A] ←────────────────────→ [Téléphone B]
                  Direct ou via Tor
                  Pas de serveur central
```

Briar peut fonctionner via trois canaux selon la situation :

**Mode Bluetooth** : portée ~10 mètres, sans Internet, sans réseau mobile. Utile sur site quand on veut zéro émission radio GSM.

**Mode Wi-Fi local** : sur le même réseau Wi-Fi, sans Internet. Utile quand un réseau local est disponible mais pas Internet.

**Mode Internet via Tor** : pour les communications à distance, le trafic transite par le réseau Tor (voir [`reseau-anonymisation.md`](reseau-anonymisation.md)), ce qui masque à la fois l'origine et la destination.

### Ce que Briar apporte que Signal n'apporte pas

**Anonymat plutôt que confidentialité :** Briar ne requiert pas de numéro de téléphone. Votre identité dans Briar est une paire de clés cryptographiques générée localement. Aucun opérateur téléphonique n'est dans la boucle.

**Fonctionnement sans infrastructure :** si le réseau mobile est coupé, surchargé ou perturbé (par exemple par un IMSI-catcher), Briar via Bluetooth ou Wi-Fi continue de fonctionner.

**Résistance à la censure :** pas de serveur central à bloquer ou à réquisitionner.

### Installation et premier contact

```
Installation :
  Android uniquement (pas disponible sur iOS à ce jour)
  Source : F-Droid (recommandé) ou Google Play Store

Premier contact avec quelqu'un :
  Les deux personnes doivent avoir Briar installé
  Option 1 : échange en personne → scanner le QR code affiché
             dans l'app de l'autre (recommandé - le plus sûr)
  Option 2 : échange du lien d'invitation via un autre canal
             (moins sûr - risque d'interception du lien)

Pourquoi l'échange en personne est recommandé :
  L'échange de clés est le moment le plus vulnérable.
  Un adversaire qui intercepte le lien d'invitation
  peut se substituer à votre contact
  (attaque de l'homme du milieu).
  Un échange physique élimine ce risque.
```

### Cas d'usage adaptés

```
✓ Coordination sur site lors d'un événement
  → Mode Bluetooth / Wi-Fi, zéro signal GSM, non captable par IMSI-catcher

✓ Communications anonymes sans numéro de téléphone
  → Pour les membres qui veulent une séparation d'identité totale

✓ Situation où le réseau mobile est indisponible ou non fiable
  → Zones rurales, zones saturées, perturbation réseau

✗ Pas adapté : communication de masse ou diffusion d'informations
  → Briar est conçu pour des cercles de confiance restreints
```

---

## 4. Telegram - usages et pièges

### L'architecture de Telegram expliquée

Telegram est massivement utilisé par les collectifs militants en France pour la diffusion d'information. C'est aussi la principale vulnérabilité numérique du mouvement. La confusion vient d'une mauvaise compréhension de son architecture.

**Schéma simplifié :**

```
Messages Telegram "normaux" (groupes, canaux, MP standards) :
  [Téléphone] → chiffrement TLS → [Serveur Telegram] → chiffrement TLS → [Téléphone]

  ↑ Ce chiffrement protège le transit (personne entre vous et Telegram ne peut lire)
  ↑ MAIS Telegram détient les clés et peut lire vos messages
  ↑ Telegram peut livrer ces messages sur réquisition judiciaire

"Chats secrets" Telegram (activés manuellement) :
  [Téléphone] ←── chiffrement E2E Signal Protocol ──→ [Téléphone]

  ↑ Ce chiffrement est E2E : Telegram ne peut pas lire
  ↑ Disponible uniquement en conversation 1:1, pas dans les groupes
  ↑ Doit être activé manuellement par les deux parties
```

**La distinction importante :** les groupes Telegram, même "privés", ne sont PAS chiffrés de bout en bout. Tous les messages y sont lisibles par Telegram et peuvent être livrés aux autorités.

### La politique de coopération de Telegram

Telegram a longtemps communiqué sur sa non-coopération avec les autorités. Cette communication a évolué depuis l'arrestation de Pavel Durov en France en août 2024 et les suites judiciaires. Il ne faut pas se fier à la réputation passée de Telegram comme outil de résistance à la surveillance.

**Ce que Telegram peut livrer aux autorités sur réquisition :**
* Les messages stockés sur ses serveurs (tout sauf les Chats secrets)
* Les métadonnées de compte (numéro de téléphone enregistré)
* Les adresses IP de connexion

### Règles d'usage pour un collectif

**Usage acceptable :**

```
✓ Canal public de communication officielle du collectif
  (infos générales, agenda, prises de position publiques)
  → Ce qui est dit là est déjà public. La sécurité n'est pas l'enjeu.

✓ Diffusion d'informations non sensibles à un large réseau
  → Des centaines de membres, information non opérationnelle

✓ Liens vers des ressources, partage d'articles
```

**Usage à risque :**

```
✗ Coordination opérationnelle dans un groupe de 200+ personnes
  → Au moins une personne dans le groupe n'est pas de confiance vérifiée
  → Tout ce qui est dit là peut être répété ou screenshoté

✗ Partage de fichiers avec métadonnées sans nettoyage préalable
  → Un PDF ou une photo partagée conserve ses métadonnées sur Telegram

✗ Confiance dans la confidentialité d'un groupe "privé"
  → Privé = non listé publiquement, pas chiffré E2E

✗ Post-loi 1133 : diffusion d'informations pratiques (lieu, heure, accès)
  → Ces messages constituent des éléments de preuve potentiels
  → Telegram peut les livrer sur réquisition judiciaire
```

**Les "Chats secrets" Telegram :**
Ils utilisent le même protocole que Signal (MTProto avec E2E). Ils sont disponibles uniquement en 1:1 (pas en groupe) et doivent être activés explicitement :

```
Activation d'un Chat secret :
  Appuyer sur le nom du contact → "Démarrer un chat secret"
  Le chat secret s'affiche avec une icône de cadenas verte
  Les messages disparaissent automatiquement si la durée est configurée
```

### La règle de séparation des canaux

La règle pratique pour un collectif utilisant Telegram :

```
Canal Telegram public/semi-public (> 50 personnes) :
  → Informations non opérationnelles, déjà publiques
  → Aucune donnée permettant de planifier une intervention préventive

Signal groupes fermés (8-20 personnes de confiance vérifiée) :
  → Coordination opérationnelle, informations sensibles

Briar / Signal 1:1 (2-5 personnes clés) :
  → Décisions critiques, informations de niveau critique
```

---

## 5. Email - ProtonMail et alternatives

### Le problème structurel de l'email

L'email est un protocole des années 1970 conçu sans sécurité. Un email standard transite en clair sur les serveurs des expéditeur et destinataire, et potentiellement sur des serveurs intermédiaires. Il n'est pas adapté aux communications sensibles.

**Même chiffré, l'email expose :**
* L'objet du message (souvent en clair même avec PGP)
* Les métadonnées (expéditeur, destinataire, heure, adresse IP)
* Le fait que deux personnes communiquent

**Règle générale :** pour les communications sensibles, préférer Signal. L'email, même ProtonMail, est un pis-aller.

### ProtonMail - ce qu'il apporte et ses limites

**Ce que ProtonMail chiffre :**
Entre deux comptes ProtonMail, les messages sont chiffrés de bout en bout. ProtonMail ne peut pas lire le contenu. C'est sa proposition de valeur principale.

```
ProtonMail → ProtonMail :
  ✓ Chiffrement E2E automatique
  ✓ ProtonMail ne peut pas lire le contenu
  ✓ Même sur réquisition, ProtonMail ne peut livrer que les métadonnées

ProtonMail → Gmail / Orange / autre :
  ✗ Le message quitte le périmètre chiffré E2E de Proton
  ✗ Il passe en chiffrement TLS standard (transit protégé, stockage non)
  ✗ Le serveur du destinataire stocke le message en clair
```

**Juridiction suisse :** ProtonMail est basé en Suisse, hors de l'UE. Les demandes judiciaires françaises doivent passer par l'entraide judiciaire internationale, ce qui est plus lent et plus difficile. Ce n'est pas une protection absolue - en 2021, Proton a livré l'adresse IP d'un utilisateur suite à une décision de justice suisse.

**Règle pratique :** ProtonMail est adapté pour la correspondance administrative et les inscriptions à des services sensibles. Il n'est pas adapté pour remplacer Signal dans les communications de coordination.

### Tutanota

Alternative à ProtonMail, également basée en Allemagne. Chiffrement E2E entre comptes Tutanota, chiffrement de l'objet du message (contrairement à PGP standard). Gratuit pour l'usage basique.

### Adresses email jetables

Pour l'inscription à des services sans lier une identité réelle, des services d'adresses temporaires existent (Guerrilla Mail, Temp Mail). Utiles pour les inscriptions ponctuelles, pas pour les communications régulières.

---

## 6. Tableau de décision

| Besoin | Outil recommandé | Pourquoi | Alternative |
|--------|-----------------|----------|------------|
| Coordination quotidienne entre membres de confiance | Signal | E2E, forward secrecy, audit public | - |
| Communication sur site sans réseau | Briar (Bluetooth) | P2P, zéro serveur, zéro GSM | Radio PMR |
| Communication anonyme sans numéro de téléphone | Briar (Tor) | Pas de lien avec identité réelle | - |
| Diffusion d'infos publiques à large audience | Telegram canal public | Usage adapté au canal, info non sensible | - |
| Coordination restreinte de confiance | Signal groupes | E2E, membres vérifiés | Briar |
| Email sécurisé | ProtonMail | E2E entre comptes Proton, juridiction CH | Tutanota |
| Conversation 1:1 ultra-sensible | Signal + messages éphémères 24h | Contenu + suppression automatique | Briar |

**Règle de base :** la valeur de l'information détermine le canal. Plus l'information est sensible, plus le cercle est petit et le canal sécurisé.

---

## 7. Ce que la messagerie ne protège jamais

Quelle que soit la messagerie utilisée, certaines informations restent exposées :

**L'analyse de trafic**

Même sans lire un seul message, un adversaire qui observe le trafic réseau peut voir :
* Que vous utilisez Signal (le trafic Signal est identifiable par sa forme)
* Quand vous envoyez des messages (heures d'activité)
* Avec qui vous communiquez si votre IP est connue

Tor atténue ce problème (voir [`reseau-anonymisation.md`](reseau-anonymisation.md)). Signal ne le résout pas seul.

**Le terminal physique saisi**

Si votre téléphone est saisi et déverrouillé (par votre code PIN) :
* Tous les messages non supprimés sont lisibles directement
* Les sauvegardes locales sont accessibles
* L'historique des applications utilisées est visible

**La configuration du code PIN vs biométrie :**

```
En France, la question juridique n'est pas tranchée définitivement,
mais la pratique dominante indique :

Biométrie (empreinte, Face ID) :
  → Un juge peut légalement ordonner l'utilisation forcée
  → Plus facilement contournable physiquement

Code PIN :
  → Refus de le communiquer = possible infraction distincte
    (article 434-15-2 du code pénal, peine possible)
  → Mais le PIN lui-même ne peut pas être extrait par la force physique
  → Recommandé : PIN à 6 chiffres minimum, pas de date de naissance

Recommandation pratique :
  Désactiver Touch ID / Face ID avant une situation à risque
  (Paramètres > Touch/Face ID > désactiver temporairement)
  Ne garder que le PIN
```

**Le maillon humain**

La sécurité d'une communication chiffrée est celle de l'extrémité la moins protégée. Si votre contact a son téléphone saisi déverrouillé, vos messages chez lui sont lisibles - même s'ils ont disparu de votre côté.

---

## 8. Sources et références

**Sur Signal Protocol :**
* Signal Foundation - documentation technique - https://signal.org/docs/
* Audit public du Signal Protocol - https://eprint.iacr.org/2016/1013.pdf

**Sur Briar :**
* Briar Project - documentation officielle - https://briarproject.org/
* Briar - code source - https://code.briarproject.org/briar/briar

**Guides pratiques :**
* EFF - Surveillance Self-Defense : Choosing Your Tools - https://ssd.eff.org/module/choosing-your-tools
* EFF - How to Use Signal on Android - https://ssd.eff.org/module/how-use-signal-android
* Security in a Box - Secure Communications - https://securityinabox.org/fr/

**Contexte légal français :**
* Article 434-15-2 du code pénal (refus de remettre une clé de déchiffrement) - https://www.legifrance.gouv.fr

---

*Fichiers suivants dans ce dossier :*
* [`metadonnees-exif.md`](metadonnees-exif.md) - le vecteur de fuite le plus sous-estimé
* [`surveillance-mobile.md`](surveillance-mobile.md) - IMSI-catcher et réseau GSM
* [`reseau-anonymisation.md`](reseau-anonymisation.md) - VPN, Tor, Tails OS
* [`identites-numeriques.md`](identites-numeriques.md) - séparation des identités
* [`compartimentation.md`](compartimentation.md) - architecture d'information
