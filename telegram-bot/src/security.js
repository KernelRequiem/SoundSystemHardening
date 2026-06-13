// src/security.js
// Coeur de securite du bot :
//   1. Allowlist d'IDs Telegram (drop silencieux des inconnus).
//   2. Rate limit par utilisateur (anti-abus / anti-flood).
//   3. Gestionnaire de confirmations a usage unique pour les actions sensibles.

import { randomBytes } from 'node:crypto';
import { config } from './config.js';
import { log } from './logger.js';

// ─── 1. Allowlist ─────────────────────────────────────────────────────────────
// Middleware grammY : tout update dont l'expediteur n'est pas dans l'allowlist
// est abandonne sans reponse. Le silence est volontaire : repondre "acces refuse"
// confirmerait l'existence et l'activite du bot a un inconnu (enumeration).
export function allowlistGuard() {
  return async (ctx, next) => {
    const id = ctx.from?.id;
    if (!id || !config.telegram.allowedIds.has(id)) {
      log.warn('access_denied', {
        userId: id ?? null,
        username: ctx.from?.username ?? null,
        text: ctx.message?.text ? '[masque]' : null,
      });
      return; // drop silencieux
    }
    return next();
  };
}

// ─── 2. Rate limit par utilisateur ──────────────────────────────────────────
// Fenetre glissante d'une minute, en memoire (suffisant pour un seul conteneur).
const hits = new Map(); // userId -> number[] (timestamps ms)

export function rateLimitGuard() {
  const WINDOW = 60_000;
  const MAX = config.limits.userRatePerMin;
  return async (ctx, next) => {
    const id = ctx.from?.id;
    if (!id) return;
    const now = Date.now();
    const arr = (hits.get(id) || []).filter((t) => now - t < WINDOW);
    arr.push(now);
    hits.set(id, arr);
    if (arr.length > MAX) {
      log.warn('rate_limited', { userId: id, count: arr.length });
      // On previent une seule fois au passage du seuil pour ne pas spammer.
      if (arr.length === MAX + 1) {
        await ctx.reply('Trop de commandes. Patiente une minute.').catch(() => {});
      }
      return;
    }
    return next();
  };
}

// ─── 3. Confirmations a usage unique ──────────────────────────────────────────
// Les actions destructrices (deploy, restart, stop, maintenance) ne s'executent
// jamais sur une simple commande. On emet d'abord un jeton ephemere a usage
// unique, l'utilisateur doit cliquer "Confirmer". Cela neutralise le fat-finger
// et impose une seconde action volontaire de l'operateur identifie.
const pending = new Map(); // token -> { userId, action, payload, expiresAt }

export function createConfirmation(userId, action, payload = {}) {
  const token = randomBytes(8).toString('hex');
  const expiresAt = Date.now() + config.limits.confirmTtlSec * 1000;
  pending.set(token, { userId, action, payload, expiresAt });
  return token;
}

// Valide ET consomme le jeton. Verifie que c'est bien le meme utilisateur.
export function consumeConfirmation(token, userId) {
  const entry = pending.get(token);
  if (!entry) return { ok: false, reason: 'introuvable_ou_deja_utilise' };
  pending.delete(token);
  if (entry.userId !== userId) return { ok: false, reason: 'utilisateur_different' };
  if (Date.now() > entry.expiresAt) return { ok: false, reason: 'expire' };
  return { ok: true, action: entry.action, payload: entry.payload };
}

export function cancelConfirmation(token, userId) {
  const entry = pending.get(token);
  if (entry && entry.userId === userId) pending.delete(token);
}

// Purge periodique des jetons expires (borne la memoire).
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pending) if (now > v.expiresAt) pending.delete(k);
}, 30_000).unref();

// ─── 4. Defi de confirmation par mot tape (actions critiques) ─────────────────
// Pour l'action la plus destructrice (arret du site), un simple bouton ne suffit
// pas : un clic accidentel ou un appareil deverrouille pourraient le declencher.
// On exige donc que l'operateur RECOPIE un mot precis. Ce defi "challenge-
// response" force une intention explicite et non automatisable d'un seul geste.
const typedChallenges = new Map(); // userId -> { word, action, payload, expiresAt }

export function createTypedChallenge(userId, action, payload, word) {
  typedChallenges.set(userId, {
    word,
    action,
    payload,
    expiresAt: Date.now() + config.limits.confirmTtlSec * 1000,
  });
  return word;
}

export function cancelTypedChallenge(userId) {
  typedChallenges.delete(userId);
}

export function hasTypedChallenge(userId) {
  const c = typedChallenges.get(userId);
  if (!c) return false;
  if (Date.now() > c.expiresAt) {
    typedChallenges.delete(userId);
    return false;
  }
  return true;
}

// Verifie ET consomme le defi. Le mot doit correspondre exactement.
export function consumeTypedChallenge(userId, text) {
  const c = typedChallenges.get(userId);
  if (!c) return { ok: false, reason: 'aucun_defi' };
  typedChallenges.delete(userId);
  if (Date.now() > c.expiresAt) return { ok: false, reason: 'expire' };
  if (String(text).trim() !== c.word) return { ok: false, reason: 'mot_incorrect' };
  return { ok: true, action: c.action, payload: c.payload };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of typedChallenges) if (now > v.expiresAt) typedChallenges.delete(k);
}, 30_000).unref();
