// src/monitor.js
// Surveillance active de la sante du site.
// Le bot sonde periodiquement /api/health (endpoint qui ne divulgue aucune
// config) et alerte sur les transitions d'etat : UP -> DOWN et DOWN -> UP.
// On n'alerte que sur les transitions, jamais a chaque cycle, pour ne pas
// transformer une panne en deluge de notifications.

import { config } from './config.js';
import { log } from './logger.js';

const state = {
  bootTime: Date.now(),
  lastCheck: null,
  lastOk: null, // true / false / null (jamais sonde)
  lastLatencyMs: null,
  consecutiveFails: 0,
  downSince: null,
  alertedDown: false,
  mutedUntil: 0, // timestamp ms jusqu'auquel les alertes sont suspendues
};

// ─── Pause des alertes (maintenance planifiee) ────────────────────────────────
// Suspend l'envoi des alertes automatiques sans arreter la surveillance : on
// continue de sonder et de tenir les stats a jour, on cesse juste de notifier.
// Utile pour une intervention prevue ou on sait que le site va tomber.
export function muteAlerts(hours) {
  state.mutedUntil = Date.now() + hours * 3600_000;
  return state.mutedUntil;
}

export function unmuteAlerts() {
  state.mutedUntil = 0;
}

export function isMuted() {
  return Date.now() < state.mutedUntil;
}

export function mutedUntil() {
  return state.mutedUntil;
}

// Une sonde unique, avec timeout. Renvoie un resultat structure.
export async function checkHealthOnce() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  const t0 = Date.now();
  try {
    const res = await fetch(config.site.healthUrl, {
      signal: ctrl.signal,
      headers: { 'Cache-Control': 'no-store' },
    });
    const latency = Date.now() - t0;
    let ok = res.ok;
    // /api/health renvoie {ok:true}. On confirme le corps si possible.
    try {
      const body = await res.json();
      if (body && typeof body.ok === 'boolean') ok = res.ok && body.ok;
    } catch {
      /* corps non JSON : on garde le statut HTTP */
    }
    return { ok, status: res.status, latencyMs: latency };
  } catch (err) {
    return { ok: false, status: 0, latencyMs: Date.now() - t0, error: String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

export function getStats() {
  const now = Date.now();
  return {
    botUptimeSec: Math.floor((now - state.bootTime) / 1000),
    lastCheck: state.lastCheck,
    lastOk: state.lastOk,
    lastLatencyMs: state.lastLatencyMs,
    consecutiveFails: state.consecutiveFails,
    downSince: state.downSince,
    muted: now < state.mutedUntil,
    mutedUntil: state.mutedUntil,
  };
}

// Boucle de surveillance. Recoit le bot pour pouvoir alerter le chat configure.
export function startMonitor(bot) {
  const intervalMs = config.site.healthIntervalSec * 1000;
  const threshold = config.site.healthFailThreshold;

  async function tick() {
    const r = await checkHealthOnce();
    state.lastCheck = new Date().toISOString();
    state.lastLatencyMs = r.latencyMs;

    if (r.ok) {
      // Transition DOWN -> UP : on previent du retablissement.
      if (state.alertedDown) {
        const downMs = state.downSince ? Date.now() - state.downSince : 0;
        await notify(
          bot,
          `Site RETABLI.\nLatence ${r.latencyMs} ms.\nIndisponibilite ~ ${Math.round(downMs / 1000)} s.`,
        );
        log.info('site_recovered', { downMs });
      }
      state.lastOk = true;
      state.consecutiveFails = 0;
      state.downSince = null;
      state.alertedDown = false;
    } else {
      state.consecutiveFails += 1;
      if (!state.downSince) state.downSince = Date.now();
      state.lastOk = false;
      log.warn('health_fail', { status: r.status, fails: state.consecutiveFails, error: r.error });
      // Transition UP -> DOWN : alerte une seule fois au passage du seuil.
      if (state.consecutiveFails >= threshold && !state.alertedDown) {
        state.alertedDown = true;
        await notify(
          bot,
          `Site DOWN.\nEchecs consecutifs : ${state.consecutiveFails}.\nDernier statut HTTP : ${r.status || 'aucune reponse'}.\nCible : ${config.site.healthUrl}`,
        );
      }
    }
  }

  // Premiere sonde rapide, puis cadence reguliere.
  setTimeout(tick, 3000);
  const handle = setInterval(tick, intervalMs);
  handle.unref();
  log.info('monitor_started', { intervalSec: config.site.healthIntervalSec, threshold });
  return handle;
}

async function notify(bot, text) {
  // Alertes suspendues : on journalise mais on n'envoie pas.
  if (isMuted()) {
    log.info('alert_suppressed_muted', { until: new Date(state.mutedUntil).toISOString() });
    return;
  }
  try {
    await bot.api.sendMessage(config.telegram.alertChatId, `[ALERTE] ${text}`);
  } catch (err) {
    log.error('alert_send_failed', { error: String(err?.message || err) });
  }
}

// Envoi d'un message de test (ignore volontairement le mute : c'est explicite).
export async function sendTestAlert(bot) {
  try {
    await bot.api.sendMessage(config.telegram.alertChatId, '[TEST] Canal d\'alerte operationnel.');
    return true;
  } catch (err) {
    log.error('test_alert_failed', { error: String(err?.message || err) });
    return false;
  }
}
