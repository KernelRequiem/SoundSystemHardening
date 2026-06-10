# Hardening VPS Infomaniak + Coolify

**Stack** : Ubuntu LTS · Infomaniak VPS · Coolify (Docker + Traefik)  
**Contrainte principale** : ne pas casser Docker, Traefik (80/443) ni le panel Coolify (8000)

---

## Exécution rapide

```bash
# Copier le script sur le VPS
scp scripts/hardening-vps-coolify.sh user@<vps_ip>:~/

# Connexion SSH
ssh user@<vps_ip>

# Lancer avec ton IP fixe (recommandé)
sudo bash hardening-vps-coolify.sh --admin-ip <ton_ip_fixe>
```

> **Règle absolue** : avoir une session SSH ouverte en parallèle pendant l'exécution. Si l'auth par clé n'est pas configurée avant, tu te verrouilles dehors.

---

## Ce que fait le script

### 1. SSH Hardening

| Directive | Valeur | Pourquoi |
|---|---|---|
| `PermitRootLogin` | `no` | Supprime la cible n°1 des brute-force |
| `PasswordAuthentication` | `no` | Force l'auth par clé Ed25519/RSA |
| `AuthenticationMethods` | `publickey` | Interdit tout autre vecteur |
| `MaxAuthTries` | `3` | Limite la fenêtre de brute-force |
| `LoginGraceTime` | `20` | Ferme la connexion si pas auth sous 20s |
| `X11Forwarding` | `no` | Ferme le vecteur GUI forwarding |
| `AllowTcpForwarding` | `no` | Bloque le tunnel TCP arbitraire via SSH |

### 2. UFW — Ports ouverts

| Port | Proto | Service | Restriction |
|---|---|---|---|
| 22 | TCP | SSH | Public (fail2ban en protection) |
| 80 | TCP | Traefik HTTP → redirect HTTPS | Public |
| 443 | TCP | Traefik HTTPS | Public |
| 8000 | TCP | Panel Coolify | Restreint à `--admin-ip` si fourni |

### 3. Fix critique : Docker bypass UFW

Docker modifie directement `iptables` en dehors de UFW. Concrètement, un `ufw deny 8000` **n'a aucun effet** sur un port exposé par un container Docker — le trafic passe quand même.

**Solution** : la chaîne `DOCKER-USER` dans `iptables`.

```
Paquet entrant
      │
      ▼
  iptables PREROUTING
      │
      ▼
  chaîne FORWARD
      │
      ├──► DOCKER-USER  ◄─── nos règles custom (exécutées en premier)
      │
      └──► DOCKER       ◄─── règles auto Docker (après les nôtres)
```

Le script ajoute dans `DOCKER-USER` :
- RETURN pour connexions établies (évite de casser les sessions en cours)
- RETURN pour le réseau interne Docker (`172.16.0.0/12`)
- Si `--admin-ip` fourni : DROP sur port 8000 sauf depuis cette IP

Ces règles sont persistées via `iptables-persistent` (survie au reboot).

### 4. fail2ban

```
[sshd]
maxretry = 3
bantime  = 24h
```

Après 3 tentatives SSH échouées depuis une même IP → ban 24h automatique. Les IPs bannies sont visibles avec :

```bash
fail2ban-client status sshd
```

### 5. Mises à jour automatiques

`unattended-upgrades` configure uniquement les patchs de sécurité (`-security`). Pas de mise à jour des packages applicatifs (évite les breakages Coolify). Reboot automatique **désactivé** — à faire manuellement après vérification.

### 6. Kernel sysctl

Paramètres modifiés (sans toucher à `ip_forward` requis par Docker) :

| Paramètre | Valeur | Protection |
|---|---|---|
| `tcp_syncookies` | `1` | Anti SYN flood |
| `accept_redirects` | `0` | Anti ICMP redirect attack |
| `rp_filter` | `1` | Anti IP spoofing |
| `icmp_echo_ignore_broadcasts` | `1` | Anti Smurf DDoS |
| `randomize_va_space` | `2` | ASLR complet |
| `kptr_restrict` | `2` | Cache les adresses kernel dans /proc |
| `dmesg_restrict` | `1` | Limite l'accès aux logs kernel |

---

## Ce qu'on ne touche PAS (et pourquoi)

| Élément | Raison |
|---|---|
| `net.ipv4.ip_forward` | Requis par Docker pour le routage inter-containers |
| Daemon Docker / socket Docker | Coolify en dépend entièrement |
| Port 80/443 dans UFW | Traefik (reverse proxy Coolify) doit y répondre |
| Réseau `172.16.0.0/12` | Plage interne Docker, bloquer = casser le réseau containers |

---

## Vérifications post-hardening

```bash
# Statut UFW
sudo ufw status verbose

# Règles DOCKER-USER actives
sudo iptables -L DOCKER-USER -n -v

# fail2ban
sudo fail2ban-client status sshd

# Services Coolify toujours up
sudo docker ps

# Scan des ports exposés (depuis ta machine locale)
nmap -sV <vps_ip>

# Headers HTTP de sécurité
curl -I https://<ton-domaine>
```

---

## Prochaine étape : hardening Coolify

Le panel Coolify lui-même mérite un hardening séparé :
- Activer 2FA sur le compte Coolify
- Configurer un domaine dédié pour le panel (+ cert TLS auto Traefik)
- Activer les webhooks de déploiement avec secret
- Isoler les networks Docker par projet
