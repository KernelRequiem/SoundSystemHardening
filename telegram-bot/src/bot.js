// src/bot.js
// Assemblage du bot : securite, commandes slash, et console interactive a menus.
// Modele d'interaction : un message unique que l'on navigue par boutons inline,
// edite en place (pas d'empilement de messages). Toute action sensible passe par
// allowlist + rate limit + confirmation a usage unique.

import { Bot, InlineKeyboard, GrammyError, HttpError } from 'grammy';
import { config } from './config.js';
import { log, getAuditTrail } from './logger.js';
import {
  allowlistGuard,
  rateLimitGuard,
  createConfirmation,
  consumeConfirmation,
  cancelConfirmation,
  createTypedChallenge,
  consumeTypedChallenge,
  cancelTypedChallenge,
  hasTypedChallenge,
} from './security.js';
import { coolify } from './coolify.js';
import { airtable, formatRecord } from './airtable.js';
import {
  checkHealthOnce,
  getStats,
  muteAlerts,
  unmuteAlerts,
  sendTestAlert,
} from './monitor.js';
import {
  G,
  esc,
  pre,
  fmtDuration,
  renderDashboard,
  mainMenu,
  monMenu,
  depMenu,
  admMenu,
  modMenu,
  helpScreen,
  confirmPrompt,
  resultScreen,
  infoScreen,
  linksMenu,
  deploymentsView,
  whoamiView,
  auditView,
  typedChallengePrompt,
} from './ui.js';

// ─── Helpers d'envoi / edition ────────────────────────────────────────────────
const HTML = { parse_mode: 'HTML' };

async function send(ctx, view) {
  await ctx.reply(view.text, { ...HTML, reply_markup: view.keyboard });
}

// Edition en place tolerante : ignore "message not modified", retombe sur un
// nouvel envoi si l'edition echoue pour une autre raison.
async function safeEdit(ctx, view) {
  try {
    await ctx.editMessageText(view.text, { ...HTML, reply_markup: view.keyboard });
  } catch (err) {
    const desc = err?.description || '';
    if (desc.includes('message is not modified')) return;
    try {
      await ctx.reply(view.text, { ...HTML, reply_markup: view.keyboard });
    } catch {
      /* on abandonne silencieusement, l'erreur est deja journalisee par bot.catch */
    }
  }
}

function auditCtx(ctx, detail, result) {
  return { userId: ctx.from?.id, username: ctx.from?.username, detail, result };
}

// ─── Collecte de donnees pour le tableau de bord ──────────────────────────────
async function gatherDashboardData() {
  const health = await checkHealthOnce();
  let container = null;
  if (coolify.enabled()) {
    const c = await coolify.status();
    container = c.ok ? c.data?.status || c.data?.state || 'inconnu' : `erreur ${c.status}`;
  }
  return {
    health,
    container,
    stats: getStats(),
    intervalSec: config.site.healthIntervalSec,
    threshold: config.site.healthFailThreshold,
  };
}

async function dashboardView() {
  return renderDashboard(await gatherDashboardData());
}

function healthView(r) {
  const body = r.ok
    ? `Sante du site\n${G.ok} UP\nHTTP ${r.status} . ${r.latencyMs} ms`
    : `Sante du site\n${G.ko} DOWN\n${r.status ? 'HTTP ' + r.status : 'aucune reponse'} . ${r.latencyMs} ms`;
  return infoScreen(pre(body), 'nav:mon');
}

function uptimeView() {
  const s = getStats();
  const body = [
    'SURVEILLANCE',
    `Bot uptime    ${fmtDuration(s.botUptimeSec)}`,
    `Derniere sonde ${s.lastCheck || 'aucune'}`,
    `Dernier etat  ${s.lastOk === null ? 'inconnu' : s.lastOk ? 'UP' : 'DOWN'}`,
    `Latence       ${s.lastLatencyMs != null ? s.lastLatencyMs + ' ms' : 'n/a'}`,
    `Echecs cons.  ${s.consecutiveFails}`,
  ].join('\n');
  return infoScreen(pre(body), 'nav:mon');
}

async function logsView() {
  if (!coolify.enabled()) return infoScreen('Coolify non configure.', 'nav:dep');
  const r = await coolify.logs(40);
  if (!r.ok) return infoScreen(`Logs indisponibles (status ${r.status}).`, 'nav:dep');
  const raw = typeof r.data === 'string' ? r.data : r.data?.logs || JSON.stringify(r.data);
  const text = String(raw).slice(-3000) || '(vide)';
  return infoScreen(pre(text), 'nav:dep');
}

async function deploymentsScreen() {
  if (!coolify.enabled()) return infoScreen('Coolify non configure.', 'nav:dep');
  const r = await coolify.deployments();
  if (!r.ok) return infoScreen(`Deploiements indisponibles (status ${r.status}).`, 'nav:dep');
  const records = Array.isArray(r.data) ? r.data : r.data?.deployments || r.data?.data || [];
  return deploymentsView(records);
}

// ─── Actions sensibles ─────────────────────────────────────────────────────────
// Catalogue des demandes declenchees par les boutons "req:*".
const REQUESTS = {
  deploy: { action: 'deploy', payload: {}, label: 'redeployer le site' },
  deploy_force: { action: 'deploy', payload: { force: true }, label: 'redeployer avec rebuild complet (sans cache)' },
  restart: { action: 'restart', payload: {}, label: 'redemarrer le conteneur' },
  stop: { action: 'stop', payload: {}, label: 'ARRETER le conteneur (site injoignable)' },
  start: { action: 'start', payload: {}, label: 'relancer le conteneur du site' },
  maint_on: { action: 'maintenance', payload: { on: true }, label: 'ACTIVER la page maintenance' },
  maint_off: { action: 'maintenance', payload: { on: false }, label: 'DESACTIVER la page maintenance' },
};

// Mot a recopier pour l'arret du site (defi le plus strict).
const STOP_WORD = 'ARRET';

async function runAction(action, payload, ctx) {
  switch (action) {
    case 'deploy': {
      const force = payload.force === true;
      const r = await coolify.deploy(force);
      log.audit(force ? 'deploy_force' : 'deploy', auditCtx(ctx, null, r.ok));
      return r.ok
        ? `${G.ok} Deploiement${force ? ' (rebuild sans cache)' : ''} declenche.`
        : `${G.ko} Echec deploiement (status ${r.status}).`;
    }
    case 'restart': {
      const r = await coolify.restart();
      log.audit('restart', auditCtx(ctx, null, r.ok));
      return r.ok ? `${G.ok} Redemarrage declenche.` : `${G.ko} Echec redemarrage (status ${r.status}).`;
    }
    case 'stop': {
      const r = await coolify.stop();
      log.audit('stop', auditCtx(ctx, null, r.ok));
      return r.ok ? `${G.ok} Conteneur du site ARRETE.` : `${G.ko} Echec arret (status ${r.status}).`;
    }
    case 'start': {
      const r = await coolify.start();
      log.audit('start', auditCtx(ctx, null, r.ok));
      return r.ok ? `${G.ok} Conteneur du site RELANCE.` : `${G.ko} Echec demarrage (status ${r.status}).`;
    }
    case 'maintenance': {
      const on = payload.on === true;
      const r = await coolify.setMaintenance(on);
      log.audit('maintenance', auditCtx(ctx, on ? 'on' : 'off', r.ok));
      if (r.ok) return `${G.ok} Maintenance ${on ? 'ACTIVE' : 'DESACTIVE'} (variable + restart).`;
      return `${G.ko} Echec maintenance a l'etape "${r.step}".`;
    }
    default:
      return 'Action inconnue.';
  }
}

// Verifie Coolify et edite un ecran d'erreur si absent.
async function ensureCoolify(ctx, backTo) {
  if (coolify.enabled()) return true;
  await safeEdit(ctx, infoScreen('Coolify non configure (token / base url / uuid).', backTo));
  return false;
}

// Liste les signalements en attente sous forme de messages avec boutons.
async function sendPending(ctx) {
  if (!airtable.enabled()) {
    await ctx.reply('Moderation Airtable non configuree.');
    return;
  }
  const r = await airtable.listPending(10);
  if (!r.ok) {
    await ctx.reply(`Lecture Airtable impossible (status ${r.status}). Token en lecture+ecriture ?`);
    return;
  }
  if (!r.records.length) {
    await ctx.reply('Aucun signalement en attente.');
    return;
  }
  await ctx.reply(`${r.records.length} signalement(s) en attente :`);
  for (const rec of r.records) {
    const kb = new InlineKeyboard().text('Valider', `ap:${rec.id}`).text('Rejeter', `rj:${rec.id}`);
    await ctx.reply(formatRecord(rec), { reply_markup: kb });
  }
}

// ─── Construction du bot ──────────────────────────────────────────────────────
export function buildBot() {
  const bot = new Bot(config.telegram.token);

  bot.use(allowlistGuard());
  bot.use(rateLimitGuard());

  // ── Commandes slash (la console reste accessible au clavier) ──────────────────
  bot.command(['start', 'menu'], (ctx) => send(ctx, mainMenu()));
  bot.command('help', (ctx) => send(ctx, helpScreen()));
  bot.command('dashboard', async (ctx) => send(ctx, await dashboardView()));
  bot.command('status', async (ctx) => send(ctx, await dashboardView()));
  bot.command('health', async (ctx) => send(ctx, healthView(await checkHealthOnce())));
  bot.command('uptime', (ctx) => send(ctx, uptimeView()));
  bot.command('logs', async (ctx) => send(ctx, await logsView()));
  bot.command('deployments', async (ctx) => send(ctx, await deploymentsScreen()));
  bot.command('links', (ctx) => send(ctx, linksMenu()));
  bot.command('whoami', (ctx) => send(ctx, whoamiView(ctx.from)));
  bot.command('pending', (ctx) => sendPending(ctx));

  bot.command('deploy', (ctx) => requestConfirm(ctx, 'deploy', false));
  bot.command('restart', (ctx) => requestConfirm(ctx, 'restart', false));
  bot.command('shutdown', (ctx) => startStopChallenge(ctx, false));
  bot.command('siteup', (ctx) => requestConfirm(ctx, 'start', false));
  bot.command('audit', (ctx) => send(ctx, auditView(getAuditTrail())));
  bot.command('maintenance', (ctx) => {
    const arg = (ctx.match || '').trim().toLowerCase();
    if (arg !== 'on' && arg !== 'off') return ctx.reply('Usage : /maintenance on | off');
    return requestConfirm(ctx, arg === 'on' ? 'maint_on' : 'maint_off', false);
  });

  // Cree une confirmation et l'affiche (edit en place ou nouveau message).
  async function requestConfirm(ctx, key, edit) {
    if (!coolify.enabled()) {
      const v = infoScreen('Coolify non configure.', 'nav:dep');
      return edit ? safeEdit(ctx, v) : send(ctx, v);
    }
    const def = REQUESTS[key];
    const token = createConfirmation(ctx.from.id, def.action, def.payload);
    const view = confirmPrompt(def.label, token);
    return edit ? safeEdit(ctx, view) : send(ctx, view);
  }

  // Arret du site : defi par mot tape (plus strict qu'un bouton de confirmation).
  async function startStopChallenge(ctx, edit) {
    if (!coolify.enabled()) {
      const v = infoScreen('Coolify non configure.', 'nav:adm');
      return edit ? safeEdit(ctx, v) : send(ctx, v);
    }
    createTypedChallenge(ctx.from.id, 'stop', {}, STOP_WORD);
    const view = typedChallengePrompt(STOP_WORD);
    return edit ? safeEdit(ctx, view) : send(ctx, view);
  }

  // Reception d'un mot tape : resout un eventuel defi de confirmation critique.
  // Enregistre apres les commandes : un message commencant par "/" est capte par
  // bot.command et n'arrive jamais ici.
  bot.on('message:text', async (ctx) => {
    if (!hasTypedChallenge(ctx.from.id)) {
      return ctx.reply('Tape /menu pour ouvrir la console.').catch(() => {});
    }
    const res = consumeTypedChallenge(ctx.from.id, ctx.message.text);
    if (!res.ok) {
      const why = res.reason === 'mot_incorrect' ? 'Mot incorrect.' : 'Defi expire.';
      return ctx.reply(`${why} Action annulee.`);
    }
    await ctx.reply('Mot valide. Execution...');
    const msg = await runAction(res.action, res.payload, ctx);
    await ctx.reply(msg);
  });

  // ── Routeur de callbacks (navigation + actions) ──────────────────────────────
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const uid = ctx.from.id;

    // Navigation entre menus
    if (data === 'nav:main') return ack(ctx, () => safeEdit(ctx, mainMenu()));
    if (data === 'nav:mon') return ack(ctx, () => safeEdit(ctx, monMenu()));
    if (data === 'nav:dep') return ack(ctx, () => safeEdit(ctx, depMenu()));
    if (data === 'nav:adm') return ack(ctx, () => safeEdit(ctx, admMenu()));
    if (data === 'nav:mod') return ack(ctx, () => safeEdit(ctx, modMenu()));
    if (data === 'nav:links') return ack(ctx, () => safeEdit(ctx, linksMenu()));
    if (data === 'nav:help') return ack(ctx, () => safeEdit(ctx, helpScreen()));

    // Tableau de bord
    if (data === 'act:dash' || data === 'dash:refresh') {
      await ctx.answerCallbackQuery({ text: data === 'dash:refresh' ? 'Mis a jour' : '' });
      return safeEdit(ctx, await dashboardView());
    }

    // Monitoring
    if (data === 'act:status') return ack(ctx, async () => safeEdit(ctx, await dashboardView()));
    if (data === 'act:health') return ack(ctx, async () => safeEdit(ctx, healthView(await checkHealthOnce())));
    if (data === 'act:uptime') return ack(ctx, () => safeEdit(ctx, uptimeView()));
    if (data === 'act:logs') return ack(ctx, async () => safeEdit(ctx, await logsView()));
    if (data === 'act:deploys') return ack(ctx, async () => safeEdit(ctx, await deploymentsScreen()));
    if (data === 'act:whoami') return ack(ctx, () => safeEdit(ctx, whoamiView(ctx.from)));
    if (data === 'act:audit') return ack(ctx, () => safeEdit(ctx, auditView(getAuditTrail())));

    // Pause / reprise des alertes
    if (data === 'act:mute') {
      const until = muteAlerts(2);
      log.audit('alerts_mute', auditCtx(ctx, '2h', true));
      await ctx.answerCallbackQuery({ text: 'Alertes en pause 2h.' });
      const when = new Date(until).toISOString().replace('T', ' ').slice(0, 19);
      return safeEdit(ctx, infoScreen(`Alertes suspendues jusqu'a ${when} (UTC).`, 'nav:mon'));
    }
    if (data === 'act:unmute') {
      unmuteAlerts();
      log.audit('alerts_unmute', auditCtx(ctx, null, true));
      await ctx.answerCallbackQuery({ text: 'Alertes reprises.' });
      return safeEdit(ctx, infoScreen('Alertes reactivees.', 'nav:mon'));
    }
    if (data === 'act:testalert') {
      await ctx.answerCallbackQuery({ text: 'Envoi...' });
      const ok = await sendTestAlert(bot);
      return safeEdit(ctx, infoScreen(ok ? 'Message de test envoye.' : 'Echec envoi du test.', 'nav:mon'));
    }

    // Annulation d'un defi de mot tape
    if (data === 'tc:cancel') {
      cancelTypedChallenge(uid);
      await ctx.answerCallbackQuery({ text: 'Annule.' });
      return safeEdit(ctx, resultScreen('Arret annule.'));
    }

    // Annulation d'un deploiement en cours
    if (data.startsWith('cd:')) {
      const id = data.slice(3);
      const r = await coolify.cancelDeployment(id);
      log.audit('deploy_cancel', auditCtx(ctx, id, r.ok));
      await ctx.answerCallbackQuery({ text: r.ok ? 'Annulation demandee.' : `Echec (${r.status}).`, show_alert: !r.ok });
      return safeEdit(ctx, await deploymentsScreen());
    }

    // Moderation (envoie des messages dedies)
    if (data === 'act:pending') {
      await ctx.answerCallbackQuery();
      return sendPending(ctx);
    }

    // Demandes d'action sensible depuis les menus
    if (data.startsWith('req:')) {
      const key = data.slice(4);
      if (!REQUESTS[key]) return ctx.answerCallbackQuery();
      await ctx.answerCallbackQuery();
      if (!(await ensureCoolify(ctx, 'nav:adm'))) return;
      // L'arret du site exige le defi par mot tape, pas un simple bouton.
      if (key === 'stop') return startStopChallenge(ctx, true);
      return requestConfirm(ctx, key, true);
    }

    // Confirmation acceptee
    if (data.startsWith('cf:')) {
      const res = consumeConfirmation(data.slice(3), uid);
      if (!res.ok) {
        await ctx.answerCallbackQuery({ text: `Confirmation invalide (${res.reason}).`, show_alert: true });
        return;
      }
      await ctx.answerCallbackQuery({ text: 'Execution...' });
      await safeEdit(ctx, resultScreen('Action confirmee. Execution en cours...'));
      const msg = await runAction(res.action, res.payload, ctx);
      return safeEdit(ctx, resultScreen(msg));
    }

    // Confirmation annulee
    if (data.startsWith('cx:')) {
      cancelConfirmation(data.slice(3), uid);
      await ctx.answerCallbackQuery({ text: 'Annule.' });
      return safeEdit(ctx, resultScreen('Action annulee.'));
    }

    // Moderation : valider / rejeter un enregistrement
    if (data.startsWith('ap:') || data.startsWith('rj:')) {
      const approve = data.startsWith('ap:');
      const id = data.slice(3);
      const r = approve ? await airtable.approve(id) : await airtable.reject(id);
      log.audit(approve ? 'moderate_approve' : 'moderate_reject', auditCtx(ctx, id, r.ok));
      await ctx.answerCallbackQuery({ text: r.ok ? (approve ? 'Valide.' : 'Rejete.') : 'Echec.' });
      const tag = r.ok ? (approve ? `${G.ok} VALIDE` : `${G.ko} REJETE`) : 'Echec';
      await ctx.editMessageText(`${ctx.callbackQuery.message?.text || ''}\n\n=> ${tag}`).catch(() => {});
      return;
    }

    await ctx.answerCallbackQuery();
  });

  // Petit wrapper : repond au callback (stoppe le spinner) puis execute l'action.
  async function ack(ctx, fn) {
    await ctx.answerCallbackQuery().catch(() => {});
    return fn();
  }

  // ── Gestion d'erreur globale ───────────────────────────────────────────────────
  bot.catch((err) => {
    const e = err.error;
    if (e instanceof GrammyError) log.error('grammy_error', { description: e.description });
    else if (e instanceof HttpError) log.error('telegram_http_error', { error: String(e) });
    else log.error('bot_unhandled', { error: String(e?.message || e) });
  });

  return bot;
}
