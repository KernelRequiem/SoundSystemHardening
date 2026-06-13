// src/airtable.js
// Moderation des signalements stockes dans Airtable.
// Module OPTIONNEL : actif seulement si AIRTABLE_API_TOKEN et AIRTABLE_BASE_ID
// sont configures.
//
// Note importante de securite : le token utilise ici doit etre scope
// LECTURE + ECRITURE. Le token write-only du site (data.records:write) ne
// permet pas de LISTER les enregistrements a moderer. Je cree donc un token
// dedie au bot, distinct de celui du site, avec la portee minimale necessaire.

import { config } from './config.js';
import { log } from './logger.js';

const A = config.airtable;
const baseUrl = () =>
  `https://api.airtable.com/v0/${A.baseId}/${encodeURIComponent(A.table)}`;

async function call(method, url, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${A.token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      log.warn('airtable_http_error', { method, status: res.status });
      return { ok: false, status: res.status, data };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    log.error('airtable_call_failed', { method, error: String(err?.message || err) });
    return { ok: false, status: 0, data: { error: String(err?.message || err) } };
  } finally {
    clearTimeout(timer);
  }
}

export const airtable = {
  enabled: () => A.enabled,

  // Liste les signalements en attente de moderation.
  async listPending(limit = 10) {
    const formula = `{${A.statusField}}='${A.statusPending}'`;
    const url =
      `${baseUrl()}?maxRecords=${limit}` +
      `&filterByFormula=${encodeURIComponent(formula)}`;
    const r = await call('GET', url);
    if (!r.ok) return r;
    const records = (r.data.records || []).map((rec) => ({
      id: rec.id,
      fields: rec.fields || {},
    }));
    return { ok: true, records };
  },

  approve(recordId) {
    return call('PATCH', `${baseUrl()}/${recordId}`, {
      fields: { [A.statusField]: A.statusApproved },
    });
  },

  reject(recordId) {
    return call('PATCH', `${baseUrl()}/${recordId}`, {
      fields: { [A.statusField]: A.statusRejected },
    });
  },
};

// Met en forme un enregistrement pour affichage Telegram (champs texte courts).
export function formatRecord(rec) {
  const f = rec.fields;
  const keys = Object.keys(f).slice(0, 6);
  const lines = keys.map((k) => {
    let v = f[k];
    if (Array.isArray(v)) v = v.join(', ');
    v = String(v ?? '').replace(/\s+/g, ' ').trim();
    if (v.length > 200) v = v.slice(0, 200) + '...';
    return `${k} : ${v}`;
  });
  return lines.join('\n');
}
