# Les Ports Réseau — Notes complètes

> Mes notes sur les ports réseau : ce qu'ils sont, pourquoi ils existent, et ce qu'ils exposent en pentest.
> Je dois connaître les ports courants à vue, et comprendre l'attaque associée à chacun.

---

## Table des matières

1. [C'est quoi un port exactement ?](#cest-quoi-un-port-exactement-)
2. [Les trois plages de ports](#les-trois-plages-de-ports)
3. [Les ports bien connus (0-1023)](#les-ports-bien-connus-0-1023)
   - [Ports de management et diagnostic](#ports-de-management-et-diagnostic)
   - [Ports web](#ports-web)
   - [Ports email](#ports-email)
   - [Ports d'accès distant](#ports-daccès-distant)
   - [Ports de base de données](#ports-de-base-de-données)
   - [Ports réseau et infrastructure](#ports-réseau-et-infrastructure)
4. [Les ports enregistrés (1024-49151)](#les-ports-enregistrés-1024-49151)
5. [Les ports éphémères (49152-65535)](#les-ports-éphémères-49152-65535)
6. [Comprendre une connexion TCP](#comprendre-une-connexion-tcp)
7. [Scanner les ports avec nmap](#scanner-les-ports-avec-nmap)
8. [Les ports dangereux en pentest](#les-ports-dangereux-en-pentest)
9. [Mémo rapide](#mémo-rapide)

---

## C'est quoi un port exactement ?

Un port est un **numéro entre 0 et 65535** qui identifie un **service réseau** sur une machine. C'est comme les numéros de maison dans une rue — l'IP (adresse) c'est la rue, le port c'est le numéro de maison.

```
Adresse IP    = 192.168.1.100
Port          = 80
Combinaison   = 192.168.1.100:80  ← je me connecte au serveur web sur cette machine
```

Un serveur peut avoir **plusieurs services en écoute simultanément sur différents ports**.

```
192.168.1.100:80   → serveur web (HTTP)
192.168.1.100:443  → serveur web sécurisé (HTTPS)
192.168.1.100:22   → serveur SSH
192.168.1.100:3306 → base de données MySQL
```

### Pourquoi les ports existent ?

Quand mon navigateur envoie une requête HTTP, le système d'exploitation utilise la paire **(IP source, port source, IP destination, port destination)** pour identifier la connexion de manière unique.

```
Hypothèse : je visite 5 sites différents simultanément depuis mon navigateur

Connexion 1 : 192.168.1.42:54821 → 93.184.216.34:80
Connexion 2 : 192.168.1.42:54822 → 142.250.74.46:80
Connexion 3 : 192.168.1.42:54823 → 151.101.193.140:80
Connexion 4 : 192.168.1.42:54824 → 199.96.157.170:80
Connexion 5 : 192.168.1.42:54825 → 216.239.32.10:80

→ 5 connexions différentes, même port destination (80), ports sources différents
→ Mon OS sait lequel des 5 navigateurs reçoit la réponse grâce à la combinaison complète
```

C'est pour ça que les ports existent — c'est le **multiplexage** — une même machine peut avoir plusieurs conversations simultanées sur des ports différents.

### TCP vs UDP

Couche 4 du modèle OSI. Deux protocoles utilisent les ports :

**TCP (Transmission Control Protocol)**  
Connexion établie avant transmission (handshake 3-way). Fiable. Les ports 80, 443, 22, 3306 utilisent TCP par défaut.

**UDP (User Datagram Protocol)**  
Pas de connexion préalable. Rapide, mais sans garantie. Les ports 53 (DNS), 123 (NTP) utilisent UDP.

```
Quand on dit "port 80", on veut dire TCP/80 ou UDP/80 selon le contexte.
La plupart du temps (web, SSH, DB), c'est TCP.
DNS, streaming, jeux utilisent UDP.
```

---

## Les trois plages de ports

### Plage 1 : Ports bien connus (0-1023)

**Nécessitent des privilèges root/administrateur pour être utilisés.**

Un utilisateur normal ne peut pas démarrer un service sur le port 80 ou 22 — seul root peut. C'est une protection de sécurité — empêcher un utilisateur piégé de se faire passer pour un service système.

```bash
# Comme utilisateur normal
sudo nc -l -p 22    # ✓ marche avec sudo
nc -l -p 22         # ✗ erreur "Permission denied"

# Comme root
nc -l -p 22         # ✓ marche
```

### Plage 2 : Ports enregistrés (1024-49151)

N'importe quel utilisateur peut les utiliser. C'est où les applications lancent leurs services.

```
8080 — port web alternatif (développement local)
3000 — port app Node.js par défaut
5000 — port Flask/Python par défaut
5432 — PostgreSQL alternatif
```

### Plage 3 : Ports éphémères (49152-65535)

Automatiquement attribués par l'OS quand un client établit une connexion. Le port source de ma requête est dans cette plage.

```
Mon navigateur → 192.168.1.42:54832 (éphémère auto-attribué par l'OS)
            → 93.184.216.34:80
```

---

## Les ports bien connus (0-1023)

### Ports de management et diagnostic

#### 21 — FTP (File Transfer Protocol)

**Service** : Transfert de fichiers. Ancien, avant SFTP.

**Protocole** : TCP

**Raison du port** : FTP a besoin de deux connexions — une pour les commandes (port 21), une pour les données (port 20 ou dynamique). Historiquement associé au numéro 21.

**En pentest :**
* Anonymous login souvent activé par défaut → accès aux fichiers
* Credentials FTP stockés en clair sur le réseau (pas de chiffrement)
* Brute force des identifiants possible

```bash
# Scanner FTP
nmap -p 21 target.com

# Tester anonymous login
ftp target.com
→ login: anonymous
→ password: (vide ou email)

# Si ça marche → je peux télécharger tous les fichiers partagés
```

#### 22 — SSH (Secure Shell)

**Service** : Accès distant sécurisé à un shell (ligne de commande).

**Protocole** : TCP (chiffré par TLS)

**Raison du port** : Historiquement choisi par le créateur d'SSH (Tatu Ylönen). Simplement séquentiel après FTP (21).

**En pentest :**
* Brute force d'identifiants (username/password)
* Clés privées SSH mal protégées → accès sans mot de passe
* SSH tunneling pour accéder à des services internes

```bash
# Brute force SSH
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://target.com

# Vérifier les versions SSH (vulnérabilités connues)
nmap -sV -p 22 target.com

# Scanner de vulnérabilités SSH
ssh-audit target.com
```

#### 23 — Telnet

**Service** : Accès distant non chiffré. Ancêtre d'SSH. Plus utilisé.

**Protocole** : TCP (aucun chiffrement)

**Pourquoi le port 23 ?** : Séquentiel après SSH (22). Raison historique.

**En pentest :**
* Identifiants en clair sur le réseau → très dangereux
* Facilement sniffable
* Rarement activé sur internet, mais courant sur les réseaux industriels legacy

### Ports web

#### 80 — HTTP

**Service** : Serveur web non chiffré.

**Protocole** : TCP

**Raison du port 80 ?** : Choix historique arbitraire. Avant qu'on utilise l'IANA, les administrateurs réseau avaient besoin d'un numéro — 80 a été choisi pour les services web.

**En pentest :**
* Tous les labs, CTF, applications web tourneront sur 80 ou 443
* HTTP non chiffré — je peux sniffer le trafic en clair
* Vulnérabilités web typiques (SQLi, XSS, CSRF, IDOR)

```bash
# Accéder au site
curl http://target.com
```

#### 443 — HTTPS

**Service** : Serveur web chiffré (HTTP + TLS).

**Protocole** : TCP (TLS)

**Raison du port 443 ?** : Choix arbitraire. Il fallait que ce soit > 1023 (pour les privilèges root) et différent de 80. 443 a été choisi.

**En pentest :**
* Même attaques qu'HTTP, mais le trafic est chiffré
* Burp Suite intercepte en se posant comme proxy de confiance
* Certificats mal configurés → possibilité de downgrade TLS ou MitM

```bash
# Accéder au site sécurisé
curl https://target.com

# Vérifier le certificat TLS
testssl.sh https://target.com
```

#### 8080 — HTTP alternatif

**Service** : Serveur web sur port alternatif (développement, applications internes).

**Protocole** : TCP

**Raison du port 8080 ?** : Pas de raison historique profonde. Convention — "80" suivi de "80" de nouveau. Utilisé quand le port 80 est déjà occupé.

**En pentest :**
* Beaucoup d'applications de développement tournent en local sur 8080
* Applications web internes (monitoring, logging) exposées sur 8080
* Moins bien sécurisées que le site principal

```bash
# Scanner les ports courants sur une machine
nmap -p 80,443,8080,8443 target.com

# Accéder à une application sur 8080
curl http://target.com:8080/admin
```

### Ports email

#### 25 — SMTP (Simple Mail Transfer Protocol)

**Service** : Envoi d'emails.

**Protocole** : TCP

**Raison du port 25 ?** : Choix de l'ARPANET dans les années 80.

**En pentest :**
* Énumération d'utilisateurs valides (commandes VRFY/EXPN)
* Open relay — envoi d'emails en tant que quelqu'un d'autre (spam, phishing)
* Relaying d'emails à travers la cible vers d'autres domaines

```bash
# Scanner SMTP
nmap -p 25 target.com

# Test manuel
nc target.com 25
EHLO attacker.com
VRFY admin@target.com    → "550 No such user" ou "250 user found"
```

#### 110 — POP3 (Post Office Protocol)

**Service** : Récupération des emails depuis un serveur.

**Protocole** : TCP

**Raison du port 110 ?** : Attribué par l'IANA. Pas de raison historique profonde.

**En pentest :**
* Accès aux emails stockés sur le serveur
* Credentials en clair sur le réseau (pas de chiffrement)
* Brute force possible

#### 143 — IMAP (Internet Message Access Protocol)

**Service** : Accès aux emails (plus moderne et riche que POP3).

**Protocole** : TCP

**Raison du port 143 ?** : Attribué séquentiellement après les autres services (100s).

**En pentest :**
* Même vecteurs que POP3 mais plus riches (dossiers, recherche)
* Credentials en clair
* Brute force possible

#### 587 — SMTP alternatif (submission)

**Service** : Envoi d'emails pour les clients (version sécurisée de 25).

**Protocole** : TCP + TLS

**Raison du port 587 ?** : Port "submission" défini dans les RFC pour éviter les problèmes de relay ouvert sur port 25.

**En pentest :**
* Moins de problèmes de relay ouvert qu'en 25 (chiffrement + authentification obligatoires)
* Brute force possible si no rate limiting

#### 465 — SMTPS

**Service** : SMTP chiffré (TLS dès la connexion, contrairement à 587 qui négocie le chiffrement).

**Protocole** : TCP + TLS

**En pentest :** Même vecteurs, mais tout est chiffré.

### Ports d'accès distant

#### 3389 — RDP (Remote Desktop Protocol)

**Service** : Accès à l'écran d'une machine Windows à distance.

**Protocole** : TCP (chiffré)

**Raison du port 3389 ?** : Choix Microsoft. Aucune raison historique particulière autre que "c'était libre".

**En pentest :**
* Brute force d'identifiants administrateur
* Failles connues dans RDP (CVE-2019-0708 BlueKeep)
* Sniffing possible si chiffrement mal configuré
* Utilisé massivement dans les réseaux d'entreprise

```bash
# Scanner RDP
nmap -p 3389 target.com

# Test de vulnérabilité BlueKeep
nmap --script rdp-vuln-ms12-020 -p 3389 target.com

# Brute force RDP
hydra -l administrator -P rockyou.txt rdp://target.com
```

### Ports de base de données

#### 3306 — MySQL

**Service** : Base de données MySQL.

**Protocole** : TCP

**Raison du port 3306 ?** : Choix arbitraire de Michael Widenius (créateur de MySQL). "3306" parce que 3306 = 330*10 + 6 (pas de raison profonde).

**En pentest :**
* Si MySQL expose sur internet → accès direct à la base de données
* Brute force d'identifiants
* SQL injection via l'interface réseau
* Extraction de données sensibles

```bash
# Scanner MySQL
nmap -p 3306 target.com

# Connexion directe
mysql -h target.com -u root -p

# Utiliser un outil d'exploitation
sqlmap -u "http://target.com" --dbs
```

#### 5432 — PostgreSQL

**Service** : Base de données PostgreSQL.

**Protocole** : TCP

**Raison du port 5432 ?** : Choix du créateur de PostgreSQL. "5432" ressemble à "POSTGRES" en quelque sorte (blague interne). Mais vraiment un choix arbitraire.

**En pentest :** Mêmes vecteurs que MySQL.

#### 1433 — MSSQL (Microsoft SQL Server)

**Service** : Base de données SQL Server (Microsoft).

**Protocole** : TCP

**Raison du port 1433 ?** : Choix Microsoft. Simplement le premier port libre dans les 1400s.

**En pentest :** Mêmes vecteurs. Souvent dans les réseaux d'entreprise Windows.

#### 27017 — MongoDB

**Service** : Base de données NoSQL MongoDB.

**Protocole** : TCP

**Raison du port 27017 ?** : Choix MongoDB inc. 27017 = 27000 + 17. Pas de raison profonde.

**En pentest :**
* MongoDB n'a souvent **aucune authentification par défaut**
* Accès complet à la base de données si exposée
* Extraction massive de données possibles

```bash
# Scanner MongoDB
nmap -p 27017 target.com

# Connexion directe
mongo mongodb://target.com:27017

# Dump de toutes les bases
mongodump --host target.com:27017 --out ./dump
```

### Ports réseau et infrastructure

#### 53 — DNS (Domain Name System)

**Service** : Résolution de noms de domaines (example.com → 93.184.216.34).

**Protocole** : UDP port 53 (ou TCP 53 pour les grosses réponses)

**Raison du port 53 ?** : Choix de l'IANA dans les premières RFC. "53" = "S" en ASCII ? (blague). Vraiment arbitraire.

**En pentest :**
* Énumération de sous-domaines (zone transfer si misconfiguration)
* DNS poisoning (ARP + DNS hijacking)
* DNS tunneling pour exfiltrer des données

```bash
# Énumération DNS
nslookup target.com
dig target.com

# Tentative de transfert de zone (zone transfer)
dig axfr @ns1.target.com target.com
# Si ça marche → toute la cartographie DNS interne exposée

# Brute force de sous-domaines
subfinder -d target.com
```

#### 67, 68 — DHCP (Dynamic Host Configuration Protocol)

**Service** : Attribue les adresses IP automatiquement aux machines du réseau.

**Protocole** : UDP

**Raison des ports 67 (serveur) et 68 (client) ?** : Choix historique. "67" et "68" = séquentiel arbitraire.

**En pentest :**
* DHCP spoofing — se faire passer pour le serveur DHCP
* Man-in-the-Middle en attribuant une fausse gateway
* Exfiltration de données en re-routant le trafic par ma machine

```bash
# Écouter les requêtes DHCP
sudo tcpdump -i eth0 -n 'udp port 67 or udp port 68'
```

#### 137, 138, 139 — NetBIOS (NetBIOS Name Service, Datagram Service, Session Service)

**Service** : Résolution de noms et partage de fichiers sur LAN Windows (avant DNS).

**Protocoles** : UDP (137, 138) et TCP (139)

**Raison des ports 137-139 ?** : Plage séquentielle arbitraire.

**En pentest :**
* Énumération d'utilisateurs et groupes
* SMB enumeration (voir port 445)
* Capture de hashes NTLM
* Exploitation EternalBlue (SMB vulnerability)

```bash
# Scanner NetBIOS
nmap -p 137-139 target.com
nbtscan target.com

# Énumération SMB
nmap -p 445 --script smb-enum-users target.com
```

#### 445 — SMB (Server Message Block)

**Service** : Partage de fichiers et imprimantes sur Windows. Remplaçant moderne de NetBIOS (ports 137-139).

**Protocole** : TCP

**Raison du port 445 ?** : Port moderne de SMB, historiquement alloué sans raison profonde.

**En pentest :**
* Énumération de partages partagés
* Accès aux partages (si credentials volés)
* EternalBlue (CVE-2017-0144) — RCE massif
* Pass-the-Hash attack
* Credential capture via Responder

```bash
# Scanner SMB
nmap -p 445 --script smb-enum-shares target.com

# Énumération complète
cme smb target.com -u '' -p ''

# Lister les partages avec credentials
smbclient -L //target.com -U username%password

# Exploit EternalBlue
use exploit/windows/smb/ms17_010_eternalblue
```

#### 123 — NTP (Network Time Protocol)

**Service** : Synchronisation de l'heure réseau.

**Protocole** : UDP

**Raison du port 123 ?** : Choix historique. "123" = première vraie utilisation dans les RFC.

**En pentest :**
* NTP amplification attack (DDoS)
* Information disclosure (versions de serveurs NTP)
* Relativement peu d'impact en pentest direct

---

## Les ports enregistrés (1024-49151)

Ces ports sont attribués par l'IANA pour des services spécifiques, mais n'importe quel utilisateur peut les utiliser.

### Ports de développement courants

| Port | Service | Raison |
|---|---|---|
| 3000 | Node.js (Express) par défaut | Choix arbitraire du framework |
| 5000 | Flask/Python par défaut | Choix arbitraire du framework |
| 8000 | Django par défaut | Choix arbitraire du framework |
| 8080 | Proxy HTTP, dev | Convention — port 80 alternatif |
| 9000 | Services de monitoring | Plage haute, peu utilisée |
| 9200 | Elasticsearch | Port de service NoSQL |
| 6379 | Redis | In-memory datastore, choix arbitraire |
| 5672 | RabbitMQ | Message broker AMQP |
| 27017 | MongoDB | NoSQL database |

**En pentest :**
* Énormément d'applications dev exposées accidentellement en prod
* Pas de rate limiting
* Brute force trivial
* Source d'information (stack traces, versions)

```bash
# Scanner les ports courants de dev
nmap -p 3000,5000,8000,8080,9000,9200,6379 target.com

# Accéder à une app dev
curl http://target.com:3000/admin
```

---

## Les ports éphémères (49152-65535)

Attribués automatiquement par l'OS à chaque client qui établit une connexion.

```
Mon navigateur établit une connexion :
local_port = random(49152, 65535)  ← port source, auto-attribué par l'OS
destination_port = 80

La paire (local_port, destination_port) identifie la connexion de manière unique.
```

**En pentest :**  
Pas directement attaquable — les ports éphémères existent juste pour le multiplexage côté client. Je m'en fiche.

---

## Comprendre une connexion TCP

Quand je me connecte à un serveur, voici ce qui se passe en détail.

```
Moi                              Serveur
192.168.1.42:54832              93.184.216.34:80

SYN (j'existe)  ─────────────────→
                ←───────────── SYN-ACK (ok)
ACK (reçu)      ─────────────────→
                [Connexion établie]
```

**Les deux ports :**
* **Port source (54832)** : Attribué automatiquement par mon OS (éphémère, aléatoire)
* **Port destination (80)** : Porté sur lequel le serveur écoute (le service web)

**L'importance :**  
Mon navigateur établit plusieurs connexions simultanément. Chacune a un port source différent. C'est comme ça que l'OS sait lequel des onglets ouverts reçoit la réponse.

```
Onglet 1 : 192.168.1.42:54821 → 93.184.216.34:80
Onglet 2 : 192.168.1.42:54822 → 142.250.74.46:80
Onglet 3 : 192.168.1.42:54823 → 199.232.1.1:80

Les trois connexions utilisent le même port destination (80), mais des ports sources différents.
Mon OS les démultiplexe correctement.
```

---

## Scanner les ports avec nmap

La façon standard de découvrir les services actifs sur une machine.

### Les techniques de scan principales

#### Scan SYN (le plus courant)

```bash
nmap -sS target.com
```

* Envoie des SYN sans compléter le handshake (ne complète pas le ACK)
* Furtif — pas d'entrées dans les logs d'accès de nombreux services
* Nécessite root/administrateur

```
SYN ──→ (port ouvert)
  ←── SYN-ACK
RST (cancel la connexion)

Résultat : open
```

#### Scan TCP Connect (complet)

```bash
nmap -sT target.com
```

* Effectue le handshake complet TCP
* Génère des entrées de logs
* Fonctionnne sans root

#### UDP Scan

```bash
nmap -sU target.com
```

* Scan des ports UDP (DNS, NTP, etc.)
* Plus lent — pas de réponse confirmée pour les ports ouverts
* Utilisé quand on cherche des services UDP

### Paramètres utiles

```bash
# Scanner les 65535 ports (lent)
nmap -p- target.com

# Scanner juste les ports courants
nmap -p 22,80,443,3306,5432 target.com

# Scanner un range
nmap -p 1-1000 target.com

# Scanner la version des services
nmap -sV target.com
# → identifie le service ET sa version (Apache 2.4.41, SSH OpenSSH 7.4, etc.)

# OS fingerprinting
nmap -O target.com

# Agressif
nmap -A target.com
# → combine -sV, -O, --script default, traceroute

# Scénario réaliste pour un pentest
nmap -sV -sC -A -p- -oA results target.com
# → scan complet, toutes les versions, scripts par défaut, output dans results.nmap
```

**Utiliser nmap en pentest :**

```bash
# Découverte rapide
nmap -p 22,80,443,3306,5432,8080 target.com

# Si ports ouverts trouvés → approfondir
nmap -sV -A -p 22,80,443 target.com

# Énumération complète (bruyante, trace logs)
nmap -sV -sC -p- target.com

# Furtif (lent mais discret)
nmap -sS -p- --max-rate 50 target.com
```

---

## Les ports dangereux en pentest

Certains ports exposés = accès direct au système. Critères d'une cible.

### Extrêmement critiques

| Port | Service | Impact |
|---|---|---|
| 22 | SSH | Accès shell complet |
| 3389 | RDP | Accès écran complet (Windows) |
| 445 | SMB | Enumeration, partages, EternalBlue |
| 27017 | MongoDB | Accès complet base de données (souvent sans auth) |
| 5432 | PostgreSQL | Accès complet base de données |
| 3306 | MySQL | Accès complet base de données |

### Très critiques

| Port | Service | Impact |
|---|---|---|
| 80/443 | HTTP/HTTPS | Vulnérabilités web (SQLi, XSS, etc.) |
| 25 | SMTP | Information disclosure, relay ouvert |
| 21 | FTP | Fichiers exposés, credentials en clair |
| 389 | LDAP | Énumération du répertoire (Active Directory) |
| 139 | NetBIOS | Énumération SMB, capture de hashes |

### Modérément critiques

| Port | Service | Impact |
|---|---|---|
| 23 | Telnet | Credentials en clair (rarement actif) |
| 110/143 | POP3/IMAP | Accès aux emails, brute force |
| 587 | SMTP alternatif | Envoi d'emails falsifiés (phishing) |
| 5000 | Dev app | Souvent pas de rate limiting, debug actif |
| 3000 | Dev app | Idem |

---

## Mémo rapide

```
Plages de ports :
0-1023       → bien connus (root nécessaire)
1024-49151   → enregistrés (n'importe quel utilisateur)
49152-65535  → éphémères (attribués par l'OS aux clients)

Ports à connaître par cœur :
22   → SSH (accès shell)
80   → HTTP (web)
443  → HTTPS (web sécurisé)
3306 → MySQL
5432 → PostgreSQL
3389 → RDP (Windows)
445  → SMB (Windows file sharing)
53   → DNS
25   → SMTP
21   → FTP

Scanner avec nmap :
nmap -p- target.com                    # tous les ports
nmap -sV target.com                    # identifier les services
nmap -p 22,80,443 target.com           # ports spécifiques
nmap -sS -p- target.com                # SYN stealth scan

Réflexe en pentest :
1. nmap -sV -p- target.com             # découvrir les services
2. Pour chaque port ouvert → tester l'exploitation associée
3. Port 22 ouvert → SSH brute force
4. Port 80 ouvert → web vulnerabilities
5. Port 445 ouvert → SMB enumeration
6. Port 27017 ouvert → MongoDB dump complet
```

---

## Références

* [IANA Service Name Registry](https://www.iana.org/assignments/service-names-port-numbers/)
* [nmap Manual](https://nmap.org/book/man.html)
* [TCP/IP Illustrated](https://en.wikipedia.org/wiki/TCP/IP_Illustrated) — Richard Stevens
* [HackTricks — Ports](https://book.hacktricks.xyz/)

---

*Notes de formation — Jedha Cybersécurité, Fullstack RNCP Niveau 6.*
