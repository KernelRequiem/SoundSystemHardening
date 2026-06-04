# Réseau et anonymisation

> Statut : stable
> Dernière mise à jour : mai 2026
> Dossier : `cyber-opsec/`
> Prérequis : lire [`threat-model.md`](threat-model.md) avant ce fichier

Ce fichier documente les outils d'anonymisation réseau : ce qu'ils font, ce qu'ils ne font pas, et quand les utiliser. VPN, Tor et Tails OS ne sont pas interchangeables - ils répondent à des menaces différentes. Choisir le mauvais outil pour la bonne raison est aussi dangereux que ne rien faire.

---

## Sommaire

1. [Pourquoi anonymiser sa connexion](#1-pourquoi-anonymiser-sa-connexion)
2. [Ce qu'est une adresse IP et pourquoi elle vous expose](#2-ce-quest-une-adresse-ip-et-pourquoi-elle-vous-expose)
3. [VPN - ce que ça fait vraiment](#3-vpn--ce-que-ça-fait-vraiment)
4. [Tor - routage en oignon](#4-tor--routage-en-oignon)
5. [Tails OS - l'environnement amnésique](#5-tails-os--lenvironnement-amnésique)
6. [Comparaison et cas d'usage](#6-comparaison-et-cas-dusage)
7. [Les erreurs qui détruisent l'anonymat](#7-les-erreurs-qui-détruisent-lanonymat)
8. [Configuration pratique](#8-configuration-pratique)
9. [Sources et références](#9-sources-et-références)

---

## 1. Pourquoi anonymiser sa connexion

Chaque fois que votre appareil se connecte à internet, il laisse deux traces fondamentales :

**L'adresse IP** : l'identifiant réseau de votre connexion, visible par tout serveur que vous contactez. Elle peut être corrélée à votre identité réelle via votre FAI (Fournisseur d'Accès Internet).

**Les métadonnées de trafic** : qui vous contactez, quand, combien de fois, depuis quelle localisation géographique - même si le contenu est chiffré.

Pour un collectif organisant des activités sensibles en 2026, les situations où l'anonymisation est utile incluent :

* Gérer des comptes de réseaux sociaux séparés de l'identité réelle
* Publier des documents sensibles (communiqués, wikis, informations pratiques)
* Consulter des ressources sans laisser de trace associée à l'identité réelle
* Correspondre via email sans lier l'adresse IP à l'identité

**Ce que ce fichier ne couvre pas :** l'anonymisation sur mobile (voir [`surveillance-mobile.md`](surveillance-mobile.md)). Ce fichier se concentre sur les connexions depuis un ordinateur.

---

## 2. Ce qu'est une adresse IP et pourquoi elle vous expose

### L'adresse IP - fonctionnement

Toute communication internet nécessite une adresse d'origine et une adresse de destination. L'adresse IP (*Internet Protocol*) est l'adresse réseau de votre appareil au moment de la connexion.

```
Analogie postale :
  Quand vous envoyez une lettre, l'enveloppe porte :
  → Adresse expéditeur (votre adresse IP)
  → Adresse destinataire (IP du serveur contacté)

  Le facteur (FAI) connaît les deux.
  Le destinataire voit votre adresse d'expéditeur.
```

### Comment l'adresse IP mène à votre identité

```
Votre FAI (Orange, Free, SFR, Bouygues) vous attribue une IP
  ↓
Votre FAI conserve les logs : IP attribuée ← → identité du client
                              pendant minimum 1 an (obligation légale)
  ↓
Un serveur que vous contactez voit votre IP
  ↓
Si ce serveur reçoit une réquisition judiciaire :
  → Il communique votre IP à la police
  ↓
La police envoie une réquisition à votre FAI :
  → "Qui était derrière l'IP X.X.X.X le JJ/MM/AAAA à HH:MM ?"
  ↓
Votre FAI répond : nom, prénom, adresse, contrat
```

**Délai réaliste :** quelques heures à quelques jours pour l'ensemble de la procédure entre la demande et l'identification. Ce n'est pas immédiat, mais c'est rapide.

### Adresse IP dynamique vs statique

La plupart des connexions résidentielles ont une IP **dynamique** : elle change périodiquement (parfois quotidiennement, parfois toutes les semaines). Cela ne protège pas, car les FAI conservent les logs d'attribution avec les horodatages précis.

---

## 3. VPN - ce que ça fait vraiment

### Définition et fonctionnement

Un VPN (*Virtual Private Network*) est un tunnel chiffré entre votre appareil et un serveur intermédiaire. Tout votre trafic internet passe par ce serveur, qui devient votre "adresse" visible pour les services que vous contactez.

```
Sans VPN :
  [Votre ordinateur]  →  [FAI]  →  [Site / Service]
       IP réelle          ↑              ↑
                     voit tout      voit votre IP réelle

Avec VPN :
  [Votre ordinateur]  →  [FAI]  →  [Serveur VPN]  →  [Site / Service]
       IP réelle          ↑              ↑                  ↑
                     voit trafic   voit votre IP     voit IP du VPN
                     chiffré       réelle
                     (destination
                     = serveur VPN)
```

**Ce que le VPN déplace :** il ne supprime pas la confiance nécessaire - il la déplace de votre FAI vers votre fournisseur VPN. Votre FAI ne voit plus vos destinations. Votre fournisseur VPN les voit toutes.

### Ce qu'un VPN protège

```
✓ Masque votre IP réelle aux sites et services que vous contactez
✓ Chiffre le trafic entre vous et le serveur VPN
  → Votre FAI voit que vous utilisez un VPN, pas ce que vous faites
✓ Protège sur les Wi-Fi publics (café, bibliothèque, hôtel)
  → Empêche l'interception locale du trafic
✓ Contourne certains géoblocages
```

### Ce qu'un VPN ne protège PAS

```
✗ Votre fournisseur VPN voit tout ce que votre FAI ne voit plus
  → Si le VPN conserve des logs et reçoit une réquisition,
    vos activités sont exposées

✗ Les cookies et techniques de fingerprinting du navigateur
  → Un site peut vous identifier même avec une IP différente
    via les caractéristiques de votre navigateur

✗ Votre identité si vous vous connectez à des comptes personnels
  → Se connecter à Gmail avec un VPN n'anonymise pas Gmail
    Google sait qui vous êtes

✗ Les fuites DNS si mal configuré
  → Vos requêtes DNS peuvent contourner le VPN et aller
    directement à votre FAI si le client VPN est mal configuré

✗ Une corrélation temporelle
  → Si un adversaire contrôle simultanément votre côté et le côté
    du serveur VPN, il peut corréler par analyse temporelle
```

### Choisir un VPN - critères

La promesse "no-log" que tous les VPN affichent est difficile à vérifier. Ces critères permettent de filtrer :

**1. Juridiction**

Un VPN basé dans un pays soumis à des ordres de communication avec la France (UE, accords de coopération judiciaire) est moins protecteur qu'un VPN hors de cette juridiction.

```
Juridictions favorables :
  → Suisse (hors UE, lois de confidentialité strictes)
  → Islande (hors UE pour la surveillance, membre EEE)
  → Panama
  → îles Vierges britanniques

Juridictions à éviter pour un usage sensible :
  → États-Unis (Five Eyes, accords MLAT avec la France)
  → Royaume-Uni (Five Eyes)
  → Pays UE (coopération judiciaire directe)
  → Canada, Australie, Nouvelle-Zélande (Five Eyes)
```

**2. Audit public**

Un fournisseur qui a soumis son infrastructure à un audit indépendant publié est plus crédible qu'un fournisseur qui se contente de promettre.

**3. Paiement anonyme**

Un fournisseur qui accepte les paiements en cash ou en cryptomonnaie (Monero de préférence - meilleure confidentialité que Bitcoin) ne peut pas corréler votre compte VPN à une identité financière.

**4. Open source**

Un client VPN dont le code est public peut être audité par des tiers. Un client propriétaire ne peut l'être.

### Mullvad - le choix de référence

Mullvad est le fournisseur VPN le plus recommandé par les organisations de défense des droits numériques pour un usage sensible.

```
Critères satisfaits :
  ✓ Basé en Suède (hors Five Eyes, juridiction favorable)
  ✓ Politique de no-log vérifiée par audit indépendant
  ✓ Paiement en cash par courrier accepté (anonymat total possible)
  ✓ Paiement en Monero accepté
  ✓ Pas de compte email requis (numéro de compte généré localement)
  ✓ Client open source
  ✓ Kill switch intégré (coupe internet si VPN déconnecté)
  ✓ Protection contre les fuites DNS

Tarif : 5 €/mois environ
Site : mullvad.net
```

**ProtonVPN** est une alternative acceptable (Suisse, audité, open source, tier gratuit disponible). Moins anonyme que Mullvad sur la gestion des comptes.

**À éviter :** tout VPN gratuit. Le modèle économique d'un VPN gratuit repose presque toujours sur la monétisation des données de trafic. Votre traffic est le produit.

### Configuration pratique Mullvad

```bash
# Installation sur Linux (Ubuntu/Debian)
wget --content-disposition https://mullvad.net/download/app/deb/latest
sudo apt install ./mullvad-vpn_*.deb

# Installation sur macOS
# Télécharger depuis mullvad.net/download

# Connexion (après avoir obtenu un numéro de compte sur mullvad.net)
mullvad account login VOTRE_NUMERO_DE_COMPTE
mullvad connect

# Vérifier la connexion
mullvad status

# Activer le kill switch (coupe internet si VPN déconnecté)
mullvad lockdown-mode set on

# Vérifier les fuites DNS
mullvad dns check
```

**Test de fuite DNS :** aller sur `dnsleaktest.com` une fois le VPN connecté. Le serveur DNS affiché doit appartenir à Mullvad, pas à votre FAI.

---

## 4. Tor - routage en oignon

### Concept fondamental

Tor (*The Onion Router*) est un réseau de routage anonyme géré par le projet Tor (organisation à but non lucratif). Il applique plusieurs couches de chiffrement successives et fait transiter le trafic à travers au moins trois nœuds relais indépendants.

L'objectif de Tor est l'**anonymat**, pas seulement la confidentialité. La différence :
* **Confidentialité** (VPN) : le contenu est secret, mais quelqu'un sait que vous avez communiqué
* **Anonymat** (Tor) : personne ne sait avec certitude qui a communiqué avec qui

### Mécanisme du routage en oignon - expliqué pas à pas

```
Vous voulez accéder à site.com de façon anonyme.

Étape 1 - Construction du circuit
  Votre client Tor choisit aléatoirement 3 nœuds dans le réseau :
  → Nœud 1 (Guard / Entrée) : connaît votre IP réelle
  → Nœud 2 (Middle / Milieu) : ne connaît ni l'origine ni la destination
  → Nœud 3 (Exit / Sortie) : contacte site.com pour vous

Étape 2 - Chiffrement en couches (l'oignon)
  Votre message est chiffré 3 fois, couche par couche :
  → Couche externe : chiffrée avec la clé du nœud 1
  → Couche intermédiaire : chiffrée avec la clé du nœud 2
  → Couche interne : chiffrée avec la clé du nœud 3

Étape 3 - Transit par les nœuds
  Nœud 1 (Guard) :
    → Reçoit votre connexion depuis votre IP réelle
    → Déchiffre la couche externe → sait qu'il doit envoyer au nœud 2
    → Ne connaît pas la destination finale
    → Ne peut pas lire le message (encore 2 couches de chiffrement)

  Nœud 2 (Middle) :
    → Reçoit le paquet du nœud 1
    → Déchiffre sa couche → sait qu'il doit envoyer au nœud 3
    → Ne connaît ni votre IP ni la destination finale

  Nœud 3 (Exit) :
    → Reçoit le paquet du nœud 2
    → Déchiffre la dernière couche → voit la destination (site.com)
    → Contacte site.com en votre nom
    → site.com voit l'IP du nœud 3, pas la vôtre

Résultat :
  Nœud 1 sait qui vous êtes, mais pas où vous allez
  Nœud 2 ne sait ni qui vous êtes ni où vous allez
  Nœud 3 sait où vous allez, mais pas qui vous êtes
  → Aucun nœud seul ne possède les deux informations simultanément
```

### Forces et limites de Tor

**Forces :**

```
✓ Anonymat réel si utilisé correctement
  → Plusieurs années d'utilisation par journalistes et défenseurs
    des droits humains dans des pays autoritaires

✓ Pas de fournisseur central de confiance
  → Les nœuds sont gérés par des volontaires indépendants
  → Aucune entité unique ne peut trahir votre anonymat

✓ Gratuit et open source
  → Audité continuellement par la communauté cryptographique

✓ Services .onion (Darkweb légitime)
  → Sites accessibles uniquement via Tor, offrant une anonymisation
    supplémentaire car la connexion ne sort pas du réseau Tor
```

**Limites :**

```
✗ Lenteur
  → Le trafic fait 3 bonds supplémentaires, souvent à travers le monde
  → Latence élevée : incompatible avec les appels vidéo, le streaming
  → Acceptable pour la navigation textuelle et le téléchargement

✗ La corrélation temporelle (attaque avancée)
  → Si un adversaire contrôle simultanément le nœud Guard
    (qui voit votre IP) et le nœud Exit (qui voit la destination),
    il peut corréler les timings de trafic et désanonymiser
  → Cela nécessite des capacités de surveillance globale (niveau 4)
  → Hors de portée de la plupart des adversaires au niveau 2-3

✗ Les applications qui "fuient" l'identité
  → Tor protège la connexion réseau
  → Une application qui transmet votre identité dans son contenu
    (se connecter à un compte Gmail via Tor) expose quand même
    qui vous êtes

✗ Le nœud Exit voit le contenu non chiffré
  → Si vous accédez à un site HTTP (non HTTPS) via Tor,
    le nœud Exit voit le contenu en clair
  → Toujours utiliser HTTPS avec Tor
  → Tor Browser active HTTPS-Only par défaut
```

### Tor Browser - l'outil recommandé

Tor Browser est le navigateur officiel du projet Tor. Il configure automatiquement Tor et applique des protections supplémentaires contre le fingerprinting.

```
Téléchargement : https://www.torproject.org/fr/
  → Toujours télécharger depuis le site officiel
  → Vérifier la signature PGP du fichier (instructions sur le site)

Configuration incluse dans Tor Browser :
  ✓ Connexion automatique au réseau Tor
  ✓ HTTPS-Only activé par défaut
  ✓ JavaScript limité en mode "Safer"
  ✓ Toutes les fenêtres ont la même taille (contre le fingerprinting)
  ✓ Pas d'extensions (chaque extension modifie votre fingerprint)
  ✓ Pas d'historique, cookies supprimés à la fermeture
```

**Règles d'usage de Tor Browser :**

```
✓ À faire :
  → Toujours utiliser Tor Browser (jamais configurer Tor sur Firefox)
  → Rester en mode "Safer" ou "Safest" (Paramètres > Sécurité)
  → Utiliser uniquement des sites HTTPS
  → Ne pas redimensionner la fenêtre Tor Browser
    (la taille de fenêtre est un vecteur de fingerprinting)

✗ À ne jamais faire :
  → Se connecter à des comptes personnels (Gmail, Facebook, Instagram)
    via Tor Browser - détruit l'anonymat immédiatement
  → Télécharger des fichiers et les ouvrir avec des applications
    externes (PDF, Word) - ces applications peuvent se connecter
    à internet directement, révélant votre IP réelle
  → Installer des extensions dans Tor Browser
  → Utiliser Tor Browser pour les téléchargements en BitTorrent
    (le protocole peut contourner Tor)
```

---

## 5. Tails OS - l'environnement amnésique

### Concept

Tails (*The Amnesic Incognito Live System*) est un système d'exploitation complet démarré depuis une clé USB. Il est conçu pour ne laisser aucune trace sur l'ordinateur utilisé et router tout le trafic via Tor par défaut.

Le nom est explicite : **amnésique** (aucune trace conservée) et **incognito** (tout passe par Tor).

```
Fonctionnement :
  1. Démarrer l'ordinateur depuis la clé USB Tails
  2. Tails charge en mémoire vive (RAM), sans toucher au disque dur
  3. Tout le trafic réseau passe automatiquement par Tor
  4. À l'extinction : toute la RAM est effacée
  5. L'ordinateur repart comme si Tails n'avait jamais été là

Résultat :
  → Aucune trace sur le disque dur de l'ordinateur hôte
  → Aucun fichier temporaire, aucun cookie, aucun log
  → Même si l'ordinateur est saisi après utilisation,
    aucune trace de l'activité Tails n'est récupérable
```

### Ce que Tails inclut

```
Navigation :
  ✓ Tor Browser (configuré par défaut)
  ✓ Navigateur non-anonyme désactivé par défaut

Communications :
  ✓ Client email Thunderbird avec Enigmail (PGP)
  ✓ Client XMPP/Jabber (messagerie chiffrée)

Chiffrement et sécurité :
  ✓ MAT2 (suppression de métadonnées)
  ✓ KeePassXC (gestionnaire de mots de passe)
  ✓ GnuPG (chiffrement PGP)
  ✓ Chiffrement du stockage persistant (LUKS)

Outils divers :
  ✓ Suite LibreOffice (documents, tableurs)
  ✓ Éditeur de texte, terminal
  ✓ Imprimante (si pilote compatible)
```

### Stockage persistant

Par défaut, Tails est totalement amnésique : rien n'est conservé entre deux sessions. Le stockage persistant est une partition chiffrée optionnelle sur la clé USB qui permet de sauvegarder des fichiers et configurations sélectionnés.

```
Ce qui peut être persisté (sélection à la configuration) :
  → Signets Tor Browser
  → Mots de passe KeePassXC
  → Clés PGP
  → Fichiers personnels

Ce qui n'est jamais persisté par défaut :
  → Historique de navigation
  → Cookies et sessions
  → Fichiers téléchargés (sauf si sauvegardés explicitement
    dans le dossier persistant)
```

### Installation de Tails

```
1. Télécharger Tails depuis https://tails.boum.org/
   → Vérifier la signature (instructions sur le site)

2. Créer la clé USB bootable
   → Tails Installer (depuis une Tails existante) - recommandé
   → BalenaEtcher ou dd (depuis un autre OS)
   → Clé USB : minimum 8 GB, USB 3.0 recommandé pour la rapidité

3. Démarrer depuis la clé USB
   → Au démarrage du PC : touche F2, F12, Suppr, ou Échap
     selon le fabricant (pour accéder au menu de boot)
   → Sélectionner la clé USB dans le menu de démarrage
   → Le logo Tails apparaît, laisser démarrer

4. Premier démarrage
   → Choisir la langue (français disponible)
   → Configurer le stockage persistant si souhaité
   → Tails se connecte automatiquement à Tor
```

### Cas d'usage adaptés pour Tails

```
✓ Rédiger et publier des documents sensibles
  → Zéro trace sur l'ordinateur utilisé
  → Publication via Tor = IP anonyme

✓ Gérer des comptes séparés de l'identité réelle
  → Connexion aux comptes militants sans lier à l'IP habituelle
  → Aucune trace locale après la session

✓ Utiliser un ordinateur partagé ou de confiance incertaine
  → Bibliothèque, cybercafé, ordinateur d'un tiers
  → Tails ignore complètement le système installé sur le disque

✓ Communication ultra-sensible depuis un lieu non habituel
  → Changer de lieu physique + Tails = deux couches d'anonymisation

✗ Usage quotidien
  → La lenteur de Tor et l'amnésie permanente rendent Tails
    peu pratique pour un usage de tous les jours
  → Réserver aux opérations spécifiques nécessitant l'anonymat maximal
```

---

## 6. Comparaison et cas d'usage

### Tableau comparatif

| Critère | VPN | Tor | Tails |
|---------|-----|-----|-------|
| Protège l'IP réelle | ✓ | ✓ ✓ | ✓ ✓ |
| Anonymat réel | ✗ (confiance VPN) | ✓ | ✓ |
| Trace sur l'ordinateur | ✓ (laisse des traces) | ✓ (laisse des traces) | ✗ (amnésique) |
| Vitesse | Bonne | Lente | Lente (Tor inclus) |
| Compatibilité | Tous usages | Navigation / texte | Usages spécifiques |
| Coût | ~5 €/mois | Gratuit | Gratuit |
| Niveau de protection | Moyen | Élevé | Maximum |
| Complexité | Faible | Moyenne | Moyenne |

### Quel outil pour quelle situation

**VPN seul :**
* Navigation quotidienne avec une IP non traçable à l'identité
* Accès à des ressources depuis un réseau Wi-Fi public
* Contourner des géoblocages
* Quand la lenteur de Tor est inacceptable

**Tor Browser :**
* Publication de documents ou informations sensibles
* Consultation de ressources sensibles sans laisser de trace associée à l'IP
* Communication via des services .onion (SecureDrop, etc.)
* Quand l'anonymat est nécessaire mais l'environnement (ordinateur) est de confiance

**Tails OS :**
* Opérations nécessitant zéro trace sur l'ordinateur hôte
* Utilisation d'un ordinateur de confiance incertaine
* Anonymat maximum pour une opération spécifique
* Rédaction et publication de documents très sensibles

**VPN + Tor (cascade) :**
Possible mais compliqué à configurer correctement. La cascade VPN → Tor masque à votre FAI que vous utilisez Tor, et masque au nœud Guard votre IP réelle (il voit l'IP du VPN). Utile dans des contextes où l'utilisation de Tor seule est elle-même problématique.

---

## 7. Les erreurs qui détruisent l'anonymat

Ce sont les erreurs les plus courantes qui rendent un outil d'anonymisation totalement inefficace.

### Erreur 1 - Se connecter à un compte personnel

```
Scénario :
  Alice utilise Tor Browser pour publier un document anonyme.
  Pendant la même session, elle se connecte à son Gmail habituel
  pour vérifier ses emails.

Résultat :
  Google sait maintenant que l'IP Tor était liée à alice@gmail.com
  à ce moment précis. La session "anonyme" est compromise.

Règle absolue :
  Dans une session Tor ou Tails, ne jamais se connecter à un compte
  lié à l'identité réelle. Jamais.
```

### Erreur 2 - Ouvrir des fichiers téléchargés hors Tails / Tor Browser

```
Scénario :
  Bob télécharge un PDF via Tor Browser sur son PC habituel.
  Il ouvre le PDF avec Adobe Reader.
  Adobe Reader contacte les serveurs Adobe pour vérifier les droits.
  Cette connexion ne passe PAS par Tor - elle utilise l'IP réelle.

Résultat :
  Adobe (ou tout autre service) voit l'IP réelle de Bob.
  Le fichier peut également contenir des macros ou scripts
  qui contactent des serveurs externes.

Solution :
  → Sur Tails : les fichiers s'ouvrent dans des applications isolées
  → Sur PC habituel : ne jamais ouvrir les fichiers téléchargés via Tor
    avec des applications externes pendant la session Tor
  → Alternative : désactiver le réseau (Tor Browser en mode hors ligne)
    avant d'ouvrir un fichier téléchargé
```

### Erreur 3 - Le fingerprinting de navigateur

```
Votre navigateur envoie à chaque site web de nombreuses informations :
  → Résolution d'écran exacte
  → Polices installées sur le système
  → Plugins et extensions installés
  → Timezone du système
  → Version exacte du navigateur et de l'OS
  → Préférences de langue

La combinaison de ces informations forme une "empreinte" unique
qui peut vous identifier même avec une IP différente.

Tor Browser protège contre ça en :
  → Forçant la même taille de fenêtre pour tous les utilisateurs
  → Présentant le même profil navigateur standardisé
  → Désactivant les polices système
  → Désactivant ou limitant JavaScript

Règle : ne jamais redimensionner Tor Browser, ne jamais installer
        d'extensions dans Tor Browser.
```

### Erreur 4 - Les métadonnées dans les fichiers publiés

```
Publier un document via Tor ne sert à rien si le document lui-même
contient votre nom dans les métadonnées.

Workflow correct :
  1. Rédiger le document
  2. Nettoyer les métadonnées (MAT2, disponible dans Tails)
  3. Vérifier que les métadonnées sont vides
  4. Publier via Tor Browser ou Tails
```

Voir [`metadonnees-exif.md`](metadonnees-exif.md) pour le nettoyage.

### Erreur 5 - Utiliser Tor depuis son domicile en permanence

```
Problème :
  Si vous utilisez Tor régulièrement depuis votre connexion habituelle,
  votre FAI voit que vous utilisez Tor - même s'il ne voit pas
  ce que vous faites avec.
  Dans certains contextes, l'utilisation de Tor est elle-même
  un signal d'intérêt pour la surveillance.

Solutions :
  → VPN avant Tor (masque l'utilisation de Tor à votre FAI)
  → Utiliser Tails depuis un lieu différent de votre domicile
  → Utiliser un réseau Wi-Fi public (avec VPN pour protéger le Wi-Fi)
```

---

## 8. Configuration pratique

### Checklist VPN (Mullvad)

```
☐ Télécharger le client depuis mullvad.net (vérifier HTTPS)
☐ Payer de façon anonyme si possible (cash par courrier, Monero)
☐ Générer un numéro de compte sans email
☐ Installer le client et se connecter
☐ Activer le kill switch (lockdown mode)
☐ Tester les fuites DNS sur dnsleaktest.com
☐ Vérifier que l'IP visible est celle de Mullvad
   (whatismyip.com ou ipleak.net)
☐ Configurer le démarrage automatique avec le système
```

### Checklist Tor Browser

```
☐ Télécharger depuis torproject.org (vérifier la signature PGP)
☐ Extraire dans un dossier dédié (pas dans Applications ou Program Files)
☐ Mettre à jour régulièrement (les mises à jour de sécurité sont critiques)
☐ Configurer le niveau de sécurité selon le besoin :
    Standard : JavaScript activé (confort, moins sécurisé)
    Safer    : JavaScript désactivé sur les sites non-HTTPS
    Safest   : JavaScript désactivé partout (recommandé pour l'anonymat)
☐ Ne jamais installer d'extensions
☐ Ne jamais se connecter à des comptes personnels
☐ Ne pas redimensionner la fenêtre
```

### Checklist Tails

```
☐ Télécharger depuis tails.boum.org
☐ Vérifier la signature OpenPGP (instructions sur le site)
☐ Créer la clé USB bootable (minimum 8 GB)
☐ Tester le démarrage depuis la clé USB sur votre matériel
   (certains BIOS/UEFI refusent le boot USB par défaut - vérifier)
☐ Configurer le stockage persistant si nécessaire
☐ Vérifier que la connexion Tor est active (icône oignon dans la barre)
☐ Mettre à jour Tails régulièrement (mise à jour intégrée à l'outil)
☐ Conserver la clé USB dans un endroit sûr
```

---

## 9. Sources et références

**Sur le VPN :**
* Mullvad - documentation officielle - https://mullvad.net/fr/help/
* Privacy Guides - recommandations VPN vérifiées - https://www.privacyguides.org/en/vpn/
* EFF - What Is a VPN? - https://www.eff.org/deeplinks/2019/11/what-vpn

**Sur Tor :**
* The Tor Project - documentation officielle - https://tb-manual.torproject.org/fr/
* Tor Project - How Tor Works - https://www.torproject.org/about/history/
* EFF - Tor and HTTPS - https://www.eff.org/pages/tor-and-https

**Sur Tails :**
* Tails - documentation officielle - https://tails.boum.org/doc/index.fr.html
* Tails - Pourquoi utiliser Tails ? - https://tails.boum.org/about/index.fr.html

**Guides pratiques :**
* EFF - Surveillance Self-Defense : Tor - https://ssd.eff.org/module/how-use-tor-windows
* Security in a Box - Anonymat en ligne - https://securityinabox.org/fr/

---

*Fichiers suivants dans ce dossier :*
* [`identites-numeriques.md`](identites-numeriques.md) - séparation des identités
* [`compartimentation.md`](compartimentation.md) - architecture d'information sécurisée
