// src/logger.js
// Journalisation structuree (JSON sur stdout) recuperee par Coolify.
// Le canal "audit" trace toute action sensible : qui, quoi, quand.
// Aucun secret (token, mot de passe) ne doit transiter par le logger.

import { config } from './config.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

// Tampon circulaire en memoire de la piste d'audit, consultable depuis le bot
// (commande /audit). Borne a 50 entrees pour ne pas grossir indefiniment.
const AUDIT_MAX = 50;
const auditTrail = [];

export function getAuditTrail() {
  return auditTrail.slice().reverse(); // le plus recent en premier
}

function emit(level, msg, fields = {}) {
  if (LEVELS[level] > threshold) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  };
  const out = level === 'error' ? process.stderr : process.stdout;
  out.write(JSON.stringify(line) + '\n');
}

export const log = {
  error: (msg, f) => emit('error', msg, f),
  warn: (msg, f) => emit('warn', msg, f),
  info: (msg, f) => emit('info', msg, f),
  debug: (msg, f) => emit('debug', msg, f),

  // Piste d'audit dediee. Volontairement en "info" pour etre toujours conservee.
  audit: (action, ctx) => {
    const entry = {
      ts: new Date().toISOString(),
      action,
      userId: ctx?.userId ?? null,
      username: ctx?.username ?? null,
      detail: ctx?.detail ?? null,
      result: ctx?.result ?? null,
    };
    auditTrail.push(entry);
    if (auditTrail.length > AUDIT_MAX) auditTrail.shift();
    emit('info', 'AUDIT', { audit: true, ...entry });
  },
};
