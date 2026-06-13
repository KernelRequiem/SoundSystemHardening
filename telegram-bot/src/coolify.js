// src/coolify.js
// Client minimal de l'API Coolify v1.
// Pilote le cycle de vie de l'application "site" sans jamais toucher au socket
// Docker : on passe par l'API authentifiee (Bearer), qui est le levier prevu et
// dont la portee est limitee par le scope du token. Monter /var/run/docker.sock
// dans le conteneur du bot donnerait au bot un controle root sur tout l'hote :
// on s'y refuse.

import { config } from './config.js';
import { log } from './logger.js';

const API = () => `${config.coolify.baseUrl.replace(/\/$/, '')}/api/v1`;

// Appel HTTP authentifie avec timeout dur (evite un bot bloque sur un Coolify muet).
async function call(method, path, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${API()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.coolify.token}`,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      log.warn('coolify_http_error', { method, path, status: res.status });
      return { ok: false, status: res.status, data };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    log.error('coolify_call_failed', { method, path, error: String(err?.message || err) });
    return { ok: false, status: 0, data: { error: String(err?.message || err) } };
  } finally {
    clearTimeout(timer);
  }
}

const uuid = () => config.coolify.appUuid;

export const coolify = {
  enabled: () => config.coolify.enabled,

  // Etat de l'application (status, fqdn, etc.).
  status() {
    return call('GET', `/applications/${uuid()}`);
  },

  // Deploiement. Equivalent du bouton "Deploy" de l'UI : dispatch d'un
  // ApplicationDeploymentJob. force=true force un rebuild sans cache.
  // Le webhook dedie reste prioritaire s'il est configure (deploy simple).
  async deploy(force = false) {
    if (config.coolify.deployWebhook && !force) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      try {
        const res = await fetch(config.coolify.deployWebhook, { signal: ctrl.signal });
        return { ok: res.ok, status: res.status, data: { via: 'webhook' } };
      } catch (err) {
        return { ok: false, status: 0, data: { error: String(err?.message || err) } };
      } finally {
        clearTimeout(timer);
      }
    }
    return call('GET', `/applications/${uuid()}/start${force ? '?force=true' : ''}`);
  },

  restart() {
    return call('GET', `/applications/${uuid()}/restart`);
  },

  stop() {
    return call('GET', `/applications/${uuid()}/stop`);
  },

  start() {
    return call('GET', `/applications/${uuid()}/start`);
  },

  logs(tail = 50) {
    return call('GET', `/applications/${uuid()}/logs?tail=${tail}`);
  },

  // Historique des deploiements de l'application (le plus recent en dernier
  // cote API ; on inversera a l'affichage). Necessite le scope read.
  deployments() {
    return call('GET', `/deployments/applications/${uuid()}`);
  },

  // Annule un deploiement en cours (queued / in_progress). Necessite le scope deploy.
  cancelDeployment(deploymentUuid) {
    return call('POST', `/deployments/${deploymentUuid}/cancel`);
  },

  // Met a jour une variable d'environnement de l'application.
  setEnv(key, value) {
    return call('PATCH', `/applications/${uuid()}/envs`, {
      key,
      value,
      is_preview: false,
    });
  },

  // Mode maintenance : le middleware du site lit MAINTENANCE_MODE a chaque requete.
  // On modifie la variable cote Coolify puis on relance le conteneur pour qu'il
  // demarre avec la nouvelle valeur d'environnement.
  async setMaintenance(on) {
    const key = config.coolify.maintenanceEnvKey;
    const setRes = await this.setEnv(key, on ? 'true' : 'false');
    if (!setRes.ok) return { ok: false, step: 'set_env', detail: setRes };
    const restartRes = await this.restart();
    if (!restartRes.ok) return { ok: false, step: 'restart', detail: restartRes };
    return { ok: true };
  },
};
