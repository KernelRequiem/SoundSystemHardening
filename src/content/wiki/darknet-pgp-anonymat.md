# Darknet, Tor, VPN et PGP — Guide pratique

> Statut : stable
> Dernière mise à jour : juin 2026
> Dossier : `cyber-opsec/`
> Complémentaire de : [`reseau-anonymisation.md`](reseau-anonymisation.md) (VPN et Tor en détail)

Ce guide couvre quatre outils complémentaires : ce que le darknet est réellement, comment l'utiliser via Tor, comment un VPN s'intègre dans l'ensemble, et surtout comment PGP/GPG fonctionne — le seul outil de chiffrement absent des autres pages de ce wiki. PGP est la pièce manquante pour chiffrer des communications qui ne passent pas par Signal.

---

## Sommaire

1. [Le darknet — ce que c'est vraiment](#1-le-darknet--ce-que-cest-vraiment)
2. [Les services .onion — accès et usages légitimes](#2-les-services-onion--accès-et-usages-légitimes)
3. [VPN — synthèse et positionnement](#3-vpn--synthèse-et-positionnement)
4. [PGP/GPG — chiffrement asymétrique de zéro](#4-pgpgpg--chiffrement-asymétrique-de-zéro)
5. [Combiner les outils — quelle architecture pour quoi](#5-combiner-les-outils--quelle-architecture-pour-quoi)
6. [Ressources et téléchargements](#6-ressources-et-téléchargements)

---

## 1. Le darknet — ce que c'est vraiment

### Trois couches d'internet

Le terme "darknet" est systématiquement mal utilisé. Avant d'aller plus loin :

| Couche | Définition | Exemples |
|--------|-----------|---------|
| **Surface web** | Pages indexées par Google, accessibles normalement | Wikipedia, journaux, ce wiki |
| **Deep web** | Pages non-indexées mais accessibles avec URL directe | Webmails, espaces privés, intranets |
| **Darknet** | Réseau superposé nécessitant un logiciel spécifique | Sites .onion (via Tor), réseaux I2P |

Le darknet n'est pas un endroit noir et criminel — c'est une infrastructure réseau. Les outils qui le composent (Tor, I2P) ont été créés pour la vie privée et la résistance à la censure, pas pour le crime organisé.

### Ce que le darknet fait techniquement

Un service .onion (l'implémentation Tor du darknet) est un serveur dont l'adresse IP réelle est cachée, même de ses visiteurs. Les deux extrémités de la connexion restent à l'intérieur du réseau Tor.

```
Web classique avec Tor :

[Votre appareil] → [Réseau Tor] → [Exit Node] → [Serveur]
                                       ↑
                              L'exit node contacte
                              le serveur = son IP est visible

Service .onion avec Tor :

[Votre appareil] → [Réseau Tor] ←→ [Serveur .onion]
                                         ↑
                              Le serveur ne sort jamais de Tor
                              = personne ne voit l'IP du serveur
                              = personne ne sait où il est hébergé
```

La conséquence : un service .onion est à la fois plus anonyme pour le visiteur (pas d'exit node) **et** plus protégé pour l'hébergeur (IP du serveur inconnue).

### Usages légitimes du darknet

Le darknet est utilisé quotidiennement par des journalistes, des lanceurs d'alerte, des organisations de défense des droits humains et des personnes vivant sous des régimes autoritaires. Les usages criminels existent mais sont minoritaires en volume de trafic.

**Services .onion légitimes et utiles :**

```
Presse et information :
  BBC : https://www.bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion
  Le Monde : accès .onion disponible (chercher sur leur site officiel)
  Deutsche Welle : https://www.dwnewsvdyyiamwnp6zkriuy57kgaqlcqoa7xynogkd6kzg4loaocpyd.onion

Sécurité numérique :
  Tor Project : http://2gzyxa5ihm7nsggfxnu52rck2vv4rvmdlkiu3zzui5du4xyclen53wid.onion
  EFF : https://www.effectfnne6r5e3nt.onion

Lanceurs d'alerte :
  SecureDrop (réseau de boîtes aux lettres sécurisées pour journalistes) :
  → The Guardian, Le Monde, Der Spiegel, NYT ont leurs propres adresses .onion
  → Répertoire : https://securedrop.org/directory/

Outils en .onion :
  DuckDuckGo : https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion
```

### Ce que le darknet ne garantit PAS

```
✗ L'anonymat parfait si vous vous identifiez
  → Accéder à un site .onion en étant connecté à votre compte
    Google détruit l'anonymat immédiatement

✗ La sécurité du contenu que vous lisez
  → Un site .onion peut quand même servir du contenu malveillant

✗ La confidentialité si vous ne chiffrez pas le contenu
  → .onion = anonymat de la connexion, pas chiffrement du contenu
  → Utilisez HTTPS .onion + PGP pour le contenu sensible

✗ L'impunité légale
  → Ce que vous faites sur le darknet reste soumis au droit
```

---

## 2. Les services .onion — accès et usages légitimes

### Accéder aux .onion

La seule façon d'accéder à un service .onion est via **Tor Browser** ou un système qui route tout par Tor (Tails OS, Whonix).

```
1. Télécharger Tor Browser depuis https://www.torproject.org/fr/
2. Vérifier la signature (instructions sur la page de téléchargement)
3. Démarrer Tor Browser
4. Copier-coller l'adresse .onion directement dans la barre d'adresse
```

Les adresses .onion v3 font 56 caractères alphanumériques + `.onion`. Elles ne sont pas mémorisables — conservez-les dans un gestionnaire de mots de passe chiffré (KeePassXC).

### SecureDrop — signaler à un journaliste de façon anonyme

SecureDrop est le système standard utilisé par les rédactions pour recevoir des documents sensibles de lanceurs d'alerte. Chaque journal a sa propre adresse .onion.

```
Comment ça fonctionne :
  1. Vous téléchargez Tor Browser (idéalement depuis Tails)
  2. Vous accédez à l'adresse SecureDrop du journal voulu
  3. Vous uploadez vos documents et rédigez votre message
  4. Le système vous donne un code source anonyme (à sauvegarder)
  5. Vous pouvez revenir plus tard (avec Tor) pour lire la réponse
     du journaliste

Ce qui est anonyme :
  ✓ Votre adresse IP
  ✓ Votre identité si vous n'incluez pas de données personnelles
  ✓ L'adresse IP du serveur SecureDrop

Ce qui n'est pas anonyme si vous ne faites pas attention :
  ✗ Les métadonnées dans vos documents (nettoyez-les avant upload)
  ✗ Votre écriture (style d'écriture identifiable si vous êtes
    la seule personne au courant)
```

### Héberger un service .onion

Il est possible d'héberger un service web accessible uniquement via Tor — utile pour une plateforme de coordination qui ne doit pas avoir d'IP publique. La configuration passe par Tor et un serveur web local. Hors du périmètre de ce guide — voir la documentation officielle du Tor Project.

---

## 3. VPN — synthèse et positionnement

La page [`reseau-anonymisation.md`](reseau-anonymisation.md) couvre le VPN en détail. Synthèse pour comprendre comment il s'articule avec Tor et PGP :

**Ce qu'un VPN fait :** crée un tunnel chiffré entre vous et un serveur intermédiaire. Les sites que vous visitez voient l'IP du VPN, pas la vôtre. Votre FAI voit que vous utilisez un VPN, pas ce que vous faites.

**Ce qu'un VPN ne fait pas :** il déplace la confiance vers le fournisseur VPN. Si le VPN log et reçoit une réquisition, vous êtes exposé.

**Le VPN recommandé :** Mullvad (Suède, no-log audité, paiement cash ou Monero, open source). Voir [`reseau-anonymisation.md`](reseau-anonymisation.md) pour la configuration complète.

**Positionnement par rapport à Tor et PGP :**

```
VPN seul :
  → Masque votre IP aux sites visités
  → Ne protège pas le contenu (si le VPN log, il voit tout)
  → Rapide, adapté au quotidien

VPN + Tor :
  → Le VPN masque à votre FAI que vous utilisez Tor
  → Tor masque au fournisseur VPN ce que vous faites
  → Plus lent mais plus fort

PGP (indépendant du réseau) :
  → Chiffre le contenu indépendamment du transport
  → Utilisable sur n'importe quel canal, y compris email non-chiffré
  → Ne masque pas qui communique avec qui, seulement le contenu
```

---

## 4. PGP/GPG — chiffrement asymétrique de zéro

### Concept fondamental : cryptographie asymétrique

PGP (*Pretty Good Privacy*) et son implémentation open source GPG (*GNU Privacy Guard*) reposent sur un principe différent du chiffrement symétrique (mot de passe partagé).

**Chiffrement symétrique (mot de passe) :**
```
Alice et Bob partagent le même mot de passe.
Alice chiffre avec le mot de passe → Bob déchiffre avec le même mot de passe.
Problème : comment partager le mot de passe sans qu'il soit intercepté ?
```

**Chiffrement asymétrique (paire de clés) :**
```
Alice génère une paire de clés :
  → Clé PUBLIQUE  : distribuée à tout le monde, ouvertement
  → Clé PRIVÉE    : jamais partagée, gardée secrète

Pour envoyer un message chiffré à Alice :
  → Bob chiffre avec la clé PUBLIQUE d'Alice
  → Seule la clé PRIVÉE d'Alice peut déchiffrer ce message
  → Même Bob ne peut plus lire le message après l'avoir chiffré

Aucun secret partagé préalable nécessaire.
```

**Analogie concrète :**
```
La clé publique = un cadenas ouvert que vous distribuez partout
La clé privée   = la clé de ce cadenas que vous gardez sur vous

N'importe qui peut fermer le cadenas (chiffrer avec votre clé publique).
Seul vous pouvez l'ouvrir (déchiffrer avec votre clé privée).
```

### Deux usages distincts : chiffrement et signature

PGP permet deux opérations différentes :

**1. Chiffrer un message (confidentialité)**
```
But : que seul le destinataire puisse lire le message

Comment :
  → Vous chiffrez avec la clé PUBLIQUE du destinataire
  → Seul le destinataire (sa clé privée) peut déchiffrer

Résultat : même si le message est intercepté, il est illisible
```

**2. Signer un message (authenticité)**
```
But : prouver que c'est bien vous qui avez écrit ce message

Comment :
  → Vous signez avec VOTRE clé PRIVÉE
  → N'importe qui avec votre clé PUBLIQUE peut vérifier la signature

Résultat : le destinataire sait que le message vient bien de vous
           et qu'il n'a pas été modifié en transit
```

**Combiné :**
```
→ Vous signez avec votre clé PRIVÉE (prouve que c'est vous)
→ Vous chiffrez avec la clé PUBLIQUE du destinataire (seul lui lit)
= Authentification + confidentialité
```

### Installer GPG

**Linux :**
```bash
# Ubuntu/Debian
sudo apt install gnupg

# Fedora/RHEL
sudo dnf install gnupg2

# Vérifier l'installation
gpg --version
```

**macOS :**
```bash
# Via Homebrew
brew install gnupg

# Ou télécharger GPG Suite (interface graphique incluse)
# https://gpgtools.org/
```

**Windows :**
```
Télécharger Gpg4win : https://www.gpg4win.org/
Inclut Kleopatra (interface graphique) + GnuPG en ligne de commande
```

### Générer une paire de clés

```bash
gpg --full-generate-key
```

Le programme pose plusieurs questions. Recommandations :

```
Type de clé :
  → Choisir (1) RSA and RSA
  → Ou (9) ECC (sign and encrypt) + Curve 25519 — plus moderne et plus rapide

Taille de clé (si RSA) :
  → 4096 bits — ne jamais choisir moins de 3072

Durée de validité :
  → 2 ans recommandé (forcer le renouvellement périodique)
  → Vous pourrez prolonger avant expiration

Identifiant :
  → Nom : peut être un pseudonyme
  → Email : peut être une adresse ProtonMail ou un alias
  → Commentaire : optionnel

Passphrase :
  → OBLIGATOIRE et LONGUE (minimum 6 mots aléatoires ou 20 caractères)
  → C'est la dernière ligne de défense si votre clé privée est volée
  → Conservez-la dans KeePassXC
```

**Après génération, vérifier :**
```bash
gpg --list-keys
```

Vous verrez quelque chose comme :
```
pub   rsa4096 2026-06-01 [SC] [expires: 2028-06-01]
      A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0
uid           [ultimate] Nom Pseudonyme <alias@protonmail.com>
sub   rsa4096 2026-06-01 [E] [expires: 2028-06-01]
```

La longue chaîne de caractères est l'**empreinte** (*fingerprint*) de votre clé. Elle identifie votre clé de façon unique.

### Exporter votre clé publique

Pour que les autres puissent vous envoyer des messages chiffrés, ils ont besoin de votre clé publique.

```bash
# Exporter en format texte (ASCII armor)
gpg --armor --export alias@protonmail.com > ma-cle-publique.asc

# Le fichier ma-cle-publique.asc peut être partagé publiquement :
# → Mis sur votre site web
# → Envoyé par email
# → Uploadé sur un serveur de clés
```

**Uploader sur un serveur de clés :**
```bash
# keys.openpgp.org est le serveur recommandé (vérifie les emails)
gpg --keyserver keys.openpgp.org --send-keys VOTRE_EMPREINTE
```

### Importer la clé publique d'un correspondant

```bash
# Depuis un fichier
gpg --import cle-publique-contact.asc

# Depuis le serveur de clés (si la personne y a uploadé sa clé)
gpg --keyserver keys.openpgp.org --recv-keys EMPREINTE_DU_CONTACT

# Vérifier que la clé est importée
gpg --list-keys
```

**Vérifier l'empreinte en dehors du canal numérique :**

L'import d'une clé publique ne garantit pas que c'est bien la clé de la personne voulue — quelqu'un pourrait avoir uploadé une fausse clé en votre nom. La vérification se fait en comparant l'empreinte (fingerprint) en personne, par téléphone, ou via un canal différent de celui qu'on veut sécuriser.

```bash
# Afficher l'empreinte d'une clé importée
gpg --fingerprint alias@protonmail.com
```

Comparez les deux dernières lignes de l'empreinte avec la personne directement. Si elles correspondent, la clé est authentique.

### Chiffrer un message

```bash
# Chiffrer un fichier pour un destinataire
gpg --encrypt --armor -r destinataire@email.com message.txt
# → Crée message.txt.asc (texte chiffré, partageable)

# Chiffrer pour plusieurs destinataires (vous inclus pour pouvoir relire)
gpg --encrypt --armor -r destinataire@email.com -r votre@email.com message.txt

# Chiffrer ET signer (authentification + confidentialité)
gpg --encrypt --sign --armor -r destinataire@email.com message.txt
```

Le fichier `.asc` produit ressemble à :
```
-----BEGIN PGP MESSAGE-----

hQEMA2xQKmdm9B0RAQf9GupT8...
(bloc de texte illisible)
...
-----END PGP MESSAGE-----
```

Ce texte peut être envoyé par email, posté dans un forum, ou copié dans n'importe quel canal — il est illisible sans la clé privée du destinataire.

### Déchiffrer un message reçu

```bash
# Déchiffrer un fichier .asc
gpg --decrypt message.txt.asc

# Le programme demande la passphrase de votre clé privée
# Le message déchiffré s'affiche dans le terminal
# (ou rediriger vers un fichier : gpg --decrypt message.txt.asc > message-clair.txt)
```

### Signer un document (sans chiffrer)

Utile pour signer des communiqués, des prises de position publiques — prouve qu'ils viennent bien de vous sans les chiffrer.

```bash
# Signer avec une signature lisible intégrée au texte
gpg --clearsign document.txt
# → Crée document.txt.asc avec la signature intégrée

# Signer avec une signature séparée
gpg --detach-sign --armor document.txt
# → Crée document.txt.asc (fichier de signature séparé)
```

### Vérifier une signature

```bash
# Signature intégrée (--clearsign)
gpg --verify document.txt.asc

# Signature séparée
gpg --verify document.txt.asc document.txt
```

Le résultat affiché :
```
gpg: Good signature from "Nom Pseudonyme <alias@protonmail.com>"
```

Si la signature est invalide ou si le document a été modifié :
```
gpg: BAD signature from "..."
```

### Gestion des clés — bonnes pratiques

**Certificat de révocation :**
Générer immédiatement après création de la paire de clés. Permet d'invalider la clé si la clé privée est compromise ou perdue.

```bash
gpg --gen-revoke VOTRE_EMPREINTE > certificat-revocation.asc
# Conservez ce fichier en lieu sûr, hors de l'ordinateur habituel
# (clé USB chiffrée, papier dans un endroit sûr)
```

**Sauvegarde de la clé privée :**
```bash
gpg --armor --export-secret-keys votre@email.com > ma-cle-privee.asc
# Ce fichier est ULTRA SENSIBLE
# Ne jamais le stocker en ligne, sur un cloud, ou sur un appareil connecté
# → Clé USB chiffrée (VeraCrypt ou LUKS), stockée hors réseau
```

**Durée de validité :**
```bash
# Prolonger l'expiration avant qu'elle arrive
gpg --edit-key VOTRE_EMPREINTE
# Dans l'interface : taper "expire", choisir nouvelle durée, "save"
```

### Intégration email : Thunderbird

Thunderbird (client email open source) intègre OpenPGP nativement depuis la version 78.

```
Configuration :
  1. Ouvrir Thunderbird
  2. Paramètres du compte → Chiffrement de bout en bout
  3. "Ajouter une clé" → Importer votre clé privée GPG
  → Thunderbird gère le chiffrement/déchiffrement automatiquement

Utilisation :
  → Rédiger un email → bouton cadenas = chiffrer
  → Bouton crayon = signer
  → Si vous avez la clé publique du destinataire, Thunderbird chiffre
    automatiquement si l'option est activée
```

**Autres clients :**
- **GPG Suite** (macOS) — intégration native avec Mail.app
- **Kleopatra** (Windows/Linux) — interface graphique pour GPG, gestion des clés
- **OpenKeychain** (Android) — gestion des clés GPG sur mobile

---

## 5. Combiner les outils — quelle architecture pour quoi

### Matrice de choix

| Situation | VPN | Tor | PGP | Tails |
|-----------|-----|-----|-----|-------|
| Navigation quotidienne avec IP masquée | ✓ | — | — | — |
| Envoyer un email sensible via canal non-chiffré | — | — | ✓ | — |
| Publier un document anonymement | — | ✓ | — | — |
| Publier un document signé (authenticité prouvable) | — | — | ✓ | — |
| Contacter un journaliste (SecureDrop) | — | ✓ | ✓ | ✓ |
| Coordination d'un événement (canal chiffré) | — | — | — | Signal |
| Communication ultra-sensible sans trace locale | — | ✓ | ✓ | ✓ |
| Accéder au wiki depuis un lieu inconnu | ✓ | — | — | — |

### Architecture recommandée pour les communications les plus sensibles

Situation : vous devez envoyer un document compromettant à un journaliste ou à une organisation de défense des droits, sans être identifiable.

```
Étape 1 — Préparer l'environnement
  → Démarrer Tails depuis une clé USB (zéro trace sur l'ordinateur)

Étape 2 — Nettoyer les métadonnées du document
  → Utiliser MAT2 (inclus dans Tails)
  → Vérifier qu'aucun nom, IP, username n'est encodé dans les métadonnées

Étape 3 — Chiffrer le document avec PGP
  → Importer la clé publique du destinataire (journaliste, organisation)
  → Chiffrer avec sa clé publique
  → Signer avec votre clé (optionnel si vous voulez rester totalement anonyme)

Étape 4 — Transmettre via Tor
  → Utiliser SecureDrop (adresse .onion du journal)
  → Ou envoyer via ProtonMail accessible en .onion

Résultat :
  → Le réseau ne voit pas votre IP (Tor)
  → L'ordinateur ne conserve aucune trace (Tails)
  → Le contenu est illisible si intercepté (PGP)
  → Les métadonnées du document sont vides (MAT2)
```

### Ce que chaque couche protège

```
COUCHE RÉSEAU (VPN / Tor)
  Protège : qui vous êtes sur le réseau (votre IP)
  Ne protège pas : le contenu si intercepté entre vous et le destinataire

COUCHE CONTENU (PGP)
  Protège : ce que vous dites (le contenu du message)
  Ne protège pas : qui communique avec qui (les métadonnées réseau)

COUCHE ENVIRONNEMENT (Tails)
  Protège : les traces sur l'appareil physique
  Ne protège pas : réseau ou contenu seul

Les trois ensemble :
  → Personne ne sait qui vous êtes sur le réseau
  → Personne ne peut lire ce que vous dites
  → Personne ne peut trouver de trace sur l'appareil
```

---

## 6. Ressources et téléchargements

### Téléchargements

```
Tor Browser (darknet + anonymat réseau) :
  → https://www.torproject.org/fr/
  → Version .onion du site : http://2gzyxa5ihm7nsggfxnu52rck2vv4rvmdlkiu3zzui5du4xyclen53wid.onion

Tails OS (environnement amnésique + Tor intégré) :
  → https://tails.boum.org/install/
  → Version .onion : http://tails.boum.org/ (redirige vers .onion)

GPG / GnuPG (chiffrement asymétrique) :
  → Linux : paquet gnupg (gestionnaire de paquets)
  → macOS : https://gpgtools.org/ (GPG Suite, interface graphique incluse)
  → Windows : https://www.gpg4win.org/ (Gpg4win + Kleopatra)

Thunderbird (email + OpenPGP intégré) :
  → https://www.thunderbird.net/fr/

Mullvad VPN (VPN recommandé) :
  → https://mullvad.net/fr/
  → Version .onion : https://mullvadch5wn7nzzmq3gq7jq4x6aawp3ek6b4s7mmqnbbxvvklsn3id.onion

KeePassXC (gestionnaire mots de passe + stockage clés PGP) :
  → https://keepassxc.org/

OpenKeychain (GPG sur Android) :
  → https://www.openkeychain.org/
```

### Documentation complémentaire dans ce wiki

- [`reseau-anonymisation.md`](reseau-anonymisation.md) — VPN et Tor en détail, configuration pas à pas
- [`messagerie-chiffree.md`](messagerie-chiffree.md) — Signal, Briar, ProtonMail
- [`surveillance-mobile.md`](surveillance-mobile.md) — opsec sur téléphone

### Documentation externe de référence

```
EFF Surveillance Self-Defense :
  → https://ssd.eff.org/fr/
  → Guide pratique par niveau de menace, maintenu à jour

Security in a Box :
  → https://securityinabox.org/fr/
  → Guides par outil, traduits en français

Tor Project — Documentation :
  → https://tb-manual.torproject.org/fr/

Riseup — Guides de sécurité numérique :
  → https://riseup.net/fr/security
  → Orienté militants et organisations politiques
```

---

*Dernière vérification technique : juin 2026. PGP/GPG est un standard stable depuis 1991 — les commandes et concepts documentés ici sont pérennes.*
