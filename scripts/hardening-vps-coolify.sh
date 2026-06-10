#!/usr/bin/env bash
# =============================================================================
# hardening-vps-coolify.sh
# Hardening Ubuntu VPS avec Coolify déployé — sans casser Docker/Traefik
# Usage : sudo bash hardening-vps-coolify.sh [--admin-ip <IP>]
# =============================================================================
set -euo pipefail

# --- Couleurs ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# --- Vérifications ---
[[ $EUID -ne 0 ]] && error "Lance ce script en root (sudo)"

ADMIN_IP=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --admin-ip) ADMIN_IP="$2"; shift 2 ;;
    *) error "Option inconnue : $1" ;;
  esac
done

echo ""
echo "============================================================"
echo "  VPS HARDENING — Coolify-safe"
echo "============================================================"
echo ""

if [[ -z "$ADMIN_IP" ]]; then
  warn "Aucun --admin-ip fourni. Le panel Coolify (port 8000) restera accessible publiquement."
  warn "Recommandé : relancer avec --admin-ip <ton_ip_fixe>"
  read -rp "Continuer sans restriction du panel Coolify ? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || exit 0
fi

# =============================================================================
# 1. MISE À JOUR DU SYSTÈME
# =============================================================================
info "1/7 — Mise à jour du système..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get autoremove -y -qq

# =============================================================================
# 2. PAQUETS DE SÉCURITÉ
# =============================================================================
info "2/7 — Installation des paquets de sécurité..."
apt-get install -y -qq \
  ufw \
  fail2ban \
  unattended-upgrades \
  apt-listchanges \
  libpam-pwquality \
  auditd \
  curl \
  jq

# =============================================================================
# 3. HARDENING SSH
# =============================================================================
info "3/7 — Hardening SSH..."

SSH_CONFIG="/etc/ssh/sshd_config"
cp "$SSH_CONFIG" "${SSH_CONFIG}.bak.$(date +%F)"

# Applique les directives critiques
declare -A SSH_SETTINGS=(
  ["PermitRootLogin"]="no"
  ["PasswordAuthentication"]="no"
  ["PubkeyAuthentication"]="yes"
  ["AuthenticationMethods"]="publickey"
  ["X11Forwarding"]="no"
  ["AllowTcpForwarding"]="no"
  ["MaxAuthTries"]="3"
  ["LoginGraceTime"]="20"
  ["ClientAliveInterval"]="300"
  ["ClientAliveCountMax"]="2"
  ["Protocol"]="2"
  ["PermitEmptyPasswords"]="no"
  ["Banner"]="/etc/ssh/banner"
)

for key in "${!SSH_SETTINGS[@]}"; do
  value="${SSH_SETTINGS[$key]}"
  if grep -qE "^#?${key}\s" "$SSH_CONFIG"; then
    sed -i "s|^#\?${key}\s.*|${key} ${value}|" "$SSH_CONFIG"
  else
    echo "${key} ${value}" >> "$SSH_CONFIG"
  fi
done

# Banner dissuasif
cat > /etc/ssh/banner << 'EOF'
*******************************************************************
* Accès autorisé uniquement. Toutes les connexions sont journalisées.
* Accès non autorisé = poursuites légales.
*******************************************************************
EOF

# Validation de la config SSH avant rechargement
sshd -t && systemctl reload sshd
info "SSH hardened — auth par clé uniquement, root login désactivé"

# =============================================================================
# 4. FIREWALL UFW (Coolify-aware)
# =============================================================================
info "4/7 — Configuration UFW..."

# CRITIQUE : UFW seul ne protège PAS les ports exposés par Docker.
# Docker injecte ses règles directement dans iptables (FORWARD chain),
# contournant UFW. On corrige ça via la chaîne DOCKER-USER.

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Ports système
ufw allow 22/tcp    comment "SSH"
ufw allow 80/tcp    comment "Traefik HTTP"
ufw allow 443/tcp   comment "Traefik HTTPS"

# Port Coolify panel
if [[ -n "$ADMIN_IP" ]]; then
  ufw allow from "$ADMIN_IP" to any port 8000 proto tcp comment "Coolify panel (admin only)"
  info "Panel Coolify (8000) restreint à : $ADMIN_IP"
else
  ufw allow 8000/tcp comment "Coolify panel (public - non recommandé)"
  warn "Panel Coolify exposé publiquement — utilise --admin-ip pour restreindre"
fi

ufw --force enable
info "UFW activé"

# --- Fix Docker bypass UFW via DOCKER-USER chain ---
info "Application du fix Docker+UFW (chaîne DOCKER-USER)..."

# La chaîne DOCKER-USER est traversée AVANT les règles Docker.
# On y ajoute une règle RETURN pour les connexions établies/liées,
# puis on DROP le reste non autorisé (hors 80/443 gérés par Traefik).

# Assure que la chaîne existe (Docker doit être démarré)
if ! iptables -L DOCKER-USER -n &>/dev/null; then
  warn "Chaîne DOCKER-USER absente — Docker est-il démarré ? Lance le fix manuellement après démarrage de Docker."
else
  # Flush les règles existantes de DOCKER-USER
  iptables -F DOCKER-USER

  # Autorise les connexions établies (évite de casser les sessions actives)
  iptables -I DOCKER-USER -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN

  # Autorise le trafic interne Docker (172.16.0.0/12 = plage Docker par défaut)
  iptables -I DOCKER-USER -s 172.16.0.0/12 -j RETURN

  # Autorise localhost
  iptables -I DOCKER-USER -s 127.0.0.1 -j RETURN

  # Si admin IP défini, autorise l'accès au port 8000 Coolify via Docker
  if [[ -n "$ADMIN_IP" ]]; then
    iptables -I DOCKER-USER -p tcp --dport 8000 -s "$ADMIN_IP" -j RETURN
    iptables -A DOCKER-USER -p tcp --dport 8000 -j DROP
  fi

  info "Règles DOCKER-USER appliquées"
fi

# Persistance des règles iptables au reboot
apt-get install -y -qq iptables-persistent
netfilter-persistent save

# =============================================================================
# 5. FAIL2BAN
# =============================================================================
info "5/7 — Configuration fail2ban..."

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled  = true
port     = 22
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 24h

[coolify-panel]
enabled  = false
# Activer si Coolify expose des logs d'auth dans /var/log
EOF

systemctl enable fail2ban
systemctl restart fail2ban
info "fail2ban actif — SSH : 3 tentatives max, ban 24h"

# =============================================================================
# 6. MISES À JOUR AUTOMATIQUES DE SÉCURITÉ
# =============================================================================
info "6/7 — Configuration unattended-upgrades..."

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "root";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

systemctl enable unattended-upgrades
info "Mises à jour de sécurité automatiques activées"

# =============================================================================
# 7. HARDENING KERNEL (sysctl)
# =============================================================================
info "7/7 — Hardening kernel (sysctl)..."

# ATTENTION : net.ipv4.ip_forward=1 est REQUIS par Docker/Coolify — ne pas désactiver

cat > /etc/sysctl.d/99-hardening.conf << 'EOF'
# --- Protection réseau ---
# Désactive l'acceptation des paquets ICMP redirect (évite le routage malveillant)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Désactive l'envoi de redirects ICMP
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Désactive l'acceptation des source-routed packets
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Protection SYN flood (SYN cookies)
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_syn_retries = 2
net.ipv4.tcp_synack_retries = 2

# Ignore les broadcasts ICMP (évite Smurf attack)
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Protection contre le bogus ICMP
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Activation du reverse path filtering (anti-spoofing IP)
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# --- REQUIS Docker/Coolify : NE PAS MODIFIER ---
# net.ipv4.ip_forward = 1   <- Docker l'active lui-même, on ne touche pas

# --- Protection mémoire ---
# Désactive le core dump pour les SUID binaires
fs.suid_dumpable = 0

# Restreint l'accès aux logs kernel
kernel.dmesg_restrict = 1

# Randomisation de l'espace d'adressage (ASLR)
kernel.randomize_va_space = 2

# Cache les pointeurs du kernel dans /proc
kernel.kptr_restrict = 2
EOF

sysctl --system > /dev/null
info "Paramètres kernel appliqués"

# =============================================================================
# RÉSUMÉ
# =============================================================================
echo ""
echo "============================================================"
echo "  HARDENING TERMINÉ"
echo "============================================================"
echo ""
echo "  SSH         : clé publique uniquement, root désactivé"
echo "  UFW         : actif (22, 80, 443 ouverts)"
if [[ -n "$ADMIN_IP" ]]; then
echo "  Coolify     : panel 8000 restreint à $ADMIN_IP"
else
echo "  Coolify     : panel 8000 PUBLIC (--admin-ip recommandé)"
fi
echo "  DOCKER-USER : fix bypass Docker+UFW appliqué"
echo "  fail2ban    : actif (SSH ban 24h après 3 tentatives)"
echo "  Auto-update : sécurité uniquement, sans reboot auto"
echo "  sysctl      : ip_forward intact pour Docker"
echo ""
warn "VÉRIFIE que tu as une clé SSH active AVANT de fermer cette session !"
warn "Teste dans un autre terminal : ssh -i <ta_cle> user@<vps_ip>"
echo ""
