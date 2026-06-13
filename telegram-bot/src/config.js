// src/config.js
// Lecture et validation de la configuration au demarrage (fail-fast).
// Aucun secret n'est ecrit ici : tout vient de l'environnement (Coolify).
// Si une variable obligatoire manque, le process refuse de demarrer.

function req(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    console.error(`[config] Variable obligatoire manquante : ${name}`);
    process.exit(1);
  }
  return v.trim();
}

function opt(name, fallback = '') {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : fallback;
}

function int(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Parse "11111111,22222222" en Set d'identifiants numeriques.
function parseIds(raw) {
  return new Set(
    raw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0),
  );
}

const allowedIds = parseIds(req('TG_ALLOWED_IDS'));
if (allowedIds.size === 0) {
  console.error('[config] TG_ALLOWED_IDS ne contient aucun ID valide. Arret.');
  process.exit(1);
}

const firstAllowed = [...allowedIds][0];

export const config = {
  telegram: {
    token: req('TG_BOT_TOKEN'),
    allowedIds,
    alertChatId: Number(opt('ALERT_CHAT_ID', String(firstAllowed))),
  },

  site: {
    healthUrl: opt('SITE_HEALTH_URL', 'https://soundsystemhardening.fr/api/health'),
    publicUrl: opt('SITE_PUBLIC_URL', 'https://soundsystemhardening.fr'),
    healthIntervalSec: int('HEALTH_INTERVAL_SEC', 60),
    healthFailThreshold: int('HEALTH_FAIL_THRESHOLD', 2),
  },

  coolify: {
    baseUrl: opt('COOLIFY_BASE_URL'),
    token: opt('COOLIFY_API_TOKEN'),
    appUuid: opt('COOLIFY_APP_UUID'),
    deployWebhook: opt('COOLIFY_DEPLOY_WEBHOOK'),
    maintenanceEnvKey: opt('MAINTENANCE_ENV_KEY', 'MAINTENANCE_MODE'),
    panelUrl: opt('COOLIFY_PANEL_URL', opt('COOLIFY_BASE_URL')),
    // La fonctionnalite est active uniquement si l'API est configuree.
    get enabled() {
      return Boolean(this.baseUrl && this.token && this.appUuid);
    },
  },

  // Liens rapides (boutons URL). Vide = bouton masque.
  links: {
    site: opt('SITE_PUBLIC_URL', 'https://soundsystemhardening.fr'),
    panel: opt('COOLIFY_PANEL_URL', opt('COOLIFY_BASE_URL')),
    github: (() => {
      const r = opt('GITHUB_REPO');
      return r ? `https://github.com/${r}` : '';
    })(),
  },

  notify: {
    secret: opt('NOTIFY_SECRET'),
    port: int('NOTIFY_PORT', 8099),
    get enabled() {
      return Boolean(this.secret);
    },
  },

  airtable: {
    token: opt('AIRTABLE_API_TOKEN'),
    baseId: opt('AIRTABLE_BASE_ID'),
    table: opt('AIRTABLE_TABLE', 'Signalements'),
    statusField: opt('AIRTABLE_STATUS_FIELD', 'Statut'),
    statusPending: opt('AIRTABLE_STATUS_PENDING', 'En attente'),
    statusApproved: opt('AIRTABLE_STATUS_APPROVED', 'Valide'),
    statusRejected: opt('AIRTABLE_STATUS_REJECTED', 'Rejete'),
    get enabled() {
      return Boolean(this.token && this.baseId);
    },
  },

  limits: {
    userRatePerMin: int('USER_RATE_PER_MIN', 20),
    confirmTtlSec: int('CONFIRM_TTL_SEC', 60),
  },

  logLevel: opt('LOG_LEVEL', 'info'),
};

// Recapitulatif des capacites actives, journalise au boot (sans secrets).
export function capabilitiesSummary() {
  return {
    monitoring: Boolean(config.site.healthUrl),
    coolify: config.coolify.enabled,
    notify: config.notify.enabled,
    airtable: config.airtable.enabled,
    allowedUsers: config.telegram.allowedIds.size,
  };
}
