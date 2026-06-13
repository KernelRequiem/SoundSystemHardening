// src/ui.js
// Couche presentation : identite "Operational Terminal" du site portee dans
// Telegram. Contraintes : pas de couleur libre en HTML Telegram, donc on combine
// trois leviers premium et coherents avec le site :
//   1. une barre d'accent ▌ (rappel du liseré vert néon des cards du site),
//   2. des pastilles d'etat couleur (vert sain / rouge critique / jaune warn)
//      qui reprennent le langage chromatique du design system,
//   3. des tables monospace alignees (JetBrains Mono cote site) dans des blocs
//      <pre>, pures (sans emoji) pour garder l'alignement.
// Toute valeur dynamique est echappee avant insertion (anti-injection HTML).

import { InlineKeyboard } from 'grammy';
import { config } from './config.js';

export const BRAND = 'SOUNDSYSTEM HARDENING';
const BAR = '▌';

// Glyphes monospace (dans les tables <pre>, ou les emoji casseraient l'alignement)
export const G = {
  ok: '✓',
  ko: '✗',
  on: '●',
  off: '○',
  back: '‹',
};

// Pastilles d'etat couleur (hors <pre>, ou la largeur n'importe pas)
function dot(state) {
  return state === 'up' ? '🟢' : state === 'down' ? '🔴' : state === 'warn' ? '🟡' : '⚪';
}

const LINE = '─'.repeat(34);

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function pre(body) {
  return `<pre>${esc(body)}</pre>`;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function tidyTs(ts) {
  return String(ts || '')
    .replace('T', ' ')
    .replace(/\.\d+Z?$/, '')
    .slice(0, 19);
}

export function fmtDuration(sec) {
  if (sec == null) return 'n/a';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (d) parts.push(`${d}j`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

// Entete de marque commune a tous les ecrans.
function head(section, sub) {
  let h = `${BAR} <b>${esc(BRAND)}</b>`;
  if (section) h += `\n<b>${esc(section)}</b>`;
  if (sub) h += `\n<i>${esc(sub)}</i>`;
  return h;
}

function footer() {
  const host = String(config.links.site || '').replace(/^https?:\/\//, '');
  return host ? `<i>${esc(host)}</i>` : '';
}

// ─── Tableau de bord ──────────────────────────────────────────────────────────
export function renderDashboard(data) {
  const { health, container, stats } = data;
  const siteState = health.ok ? 'up' : 'down';
  const contState = container
    ? container.includes('healthy')
      ? 'up'
      : /exited|error|stopped|degraded/i.test(container)
        ? 'down'
        : 'warn'
    : 'unknown';

  const strip =
    `${dot(siteState)} <b>SITE</b> ${health.ok ? 'UP' : 'DOWN'}` +
    `   ${dot(contState)} <b>CONTENEUR</b> ${esc(container || 'n/a')}`;

  const table = [
    `${pad('latence', 15)}${health.latencyMs} ms`,
    `${pad('http', 15)}${health.status || '-'}`,
    `${pad('bot uptime', 15)}${fmtDuration(stats.botUptimeSec)}`,
    `${pad('surveillance', 15)}sonde ${data.intervalSec}s . seuil ${data.threshold}`,
    `${pad('derniere sonde', 15)}${tidyTs(stats.lastCheck) || 'aucune'}`,
    `${pad('alertes', 15)}${stats.muted ? 'EN PAUSE' : 'actives'}`,
  ].join('\n');

  const text = [head(null, 'operational console'), '', strip, pre(table), footer()]
    .filter(Boolean)
    .join('\n');

  const keyboard = new InlineKeyboard()
    .text('Rafraichir', 'dash:refresh')
    .text(`${G.back} Menu`, 'nav:main');
  return { text, keyboard };
}

// ─── Menus de navigation ──────────────────────────────────────────────────────
export function mainMenu() {
  const keyboard = new InlineKeyboard()
    .text('Tableau de bord', 'act:dash')
    .row()
    .text('Monitoring', 'nav:mon')
    .text('Deploiement', 'nav:dep')
    .row()
    .text('Administration', 'nav:adm')
    .text('Moderation', 'nav:mod')
    .row()
    .text('Liens', 'nav:links')
    .text('Aide', 'nav:help');
  return { text: `${head('CONSOLE', 'Selectionne une section.')}`, keyboard };
}

export function monMenu() {
  const keyboard = new InlineKeyboard()
    .text('Statut complet', 'act:status')
    .text('Sante', 'act:health')
    .row()
    .text('Uptime', 'act:uptime')
    .row()
    .text('Pause alertes 2h', 'act:mute')
    .text('Reprendre', 'act:unmute')
    .row()
    .text('Tester une alerte', 'act:testalert')
    .row()
    .text(`${G.back} Retour`, 'nav:main');
  return { text: head('MONITORING', 'Etat a la demande et alertes.'), keyboard };
}

export function depMenu() {
  const keyboard = new InlineKeyboard()
    .text('Deployer', 'req:deploy')
    .text('Redemarrer', 'req:restart')
    .row()
    .text('Redeployer (rebuild)', 'req:deploy_force')
    .row()
    .text('Derniers deploiements', 'act:deploys')
    .text('Logs', 'act:logs')
    .row()
    .text(`${G.back} Retour`, 'nav:main');
  return { text: head('DEPLOIEMENT', 'Deploy et restart demandent confirmation.'), keyboard };
}

export function admMenu() {
  const keyboard = new InlineKeyboard()
    .text('Maintenance ON', 'req:maint_on')
    .text('Maintenance OFF', 'req:maint_off')
    .row()
    .text('Arreter le site', 'req:stop')
    .text('Relancer le site', 'req:start')
    .row()
    .text('Mon ID (whoami)', 'act:whoami')
    .text("Journal d'audit", 'act:audit')
    .row()
    .text(`${G.back} Retour`, 'nav:main');
  return { text: head('ADMINISTRATION', 'Actions sensibles, confirmation requise.'), keyboard };
}

export function modMenu() {
  const keyboard = new InlineKeyboard()
    .text('Signalements en attente', 'act:pending')
    .row()
    .text(`${G.back} Retour`, 'nav:main');
  return { text: head('MODERATION', 'Signalements Airtable.'), keyboard };
}

export function linksMenu() {
  const keyboard = new InlineKeyboard();
  let any = false;
  if (config.links.site) {
    keyboard.url('Ouvrir le site', config.links.site).row();
    any = true;
  }
  if (config.links.panel) {
    keyboard.url('Panel Coolify', config.links.panel).row();
    any = true;
  }
  if (config.links.github) {
    keyboard.url('Depot GitHub', config.links.github).row();
    any = true;
  }
  keyboard.text(`${G.back} Retour`, 'nav:main');
  return {
    text: head('LIENS', any ? 'Ouverture directe dans le navigateur.' : 'Aucun lien configure.'),
    keyboard,
  };
}

export function helpScreen() {
  const body = [
    'COMMANDES',
    LINE,
    '/menu        ouvre la console',
    '/dashboard   tableau de bord',
    '/status      etat complet',
    '/health      sonde rapide',
    '/uptime      stats surveillance',
    '/deploy      redeploie (confirm)',
    '/restart     redemarre (confirm)',
    '/logs        derniers logs',
    '/deployments historique deploiements',
    '/maintenance on|off (confirm)',
    '/shutdown    arret site (mot tape)',
    '/siteup      relance site (confirm)',
    '/pending     signalements',
    '/audit       journal des actions',
    '/links       liens rapides',
    '/whoami      mon ID telegram',
  ].join('\n');
  const keyboard = new InlineKeyboard().text(`${G.back} Menu`, 'nav:main');
  return { text: `${head('AIDE')}\n${pre(body)}`, keyboard };
}

// ─── Ecrans transitoires ──────────────────────────────────────────────────────
export function confirmPrompt(label, token) {
  const keyboard = new InlineKeyboard()
    .text('Confirmer', `cf:${token}`)
    .text('Annuler', `cx:${token}`);
  return {
    text: `${BAR} <b>ACTION SENSIBLE</b>\n${esc(label)}\n\n<i>Valable ${config.limits.confirmTtlSec}s.</i>`,
    keyboard,
  };
}

// Defi par mot tape pour l'arret du site (plus fort qu'un bouton).
export function typedChallengePrompt(word) {
  const keyboard = new InlineKeyboard().text('Annuler', 'tc:cancel');
  return {
    text:
      `${BAR} <b>ARRET DU SITE</b>\n<i>Action critique, le site deviendra injoignable.</i>\n\n` +
      `Pour confirmer, recopie exactement ce mot :\n<code>${esc(word)}</code>\n\n` +
      `<i>Valable ${config.limits.confirmTtlSec}s.</i>`,
    keyboard,
  };
}

export function resultScreen(text) {
  const keyboard = new InlineKeyboard()
    .text(`${G.back} Menu`, 'nav:main')
    .text('Tableau de bord', 'act:dash');
  return { text: typeof text === 'string' ? text : pre(String(text)), keyboard };
}

export function infoScreen(htmlText, backTo = 'nav:main') {
  const keyboard = new InlineKeyboard().text(`${G.back} Retour`, backTo);
  return { text: htmlText, keyboard };
}

// ─── Derniers deploiements ────────────────────────────────────────────────────
const DEPLOY_GLYPH = {
  finished: G.ok,
  failed: G.ko,
  'cancelled-by-user': G.off,
  queued: G.on,
  in_progress: G.on,
};

function shortCommit(rec) {
  const c = rec.commit || rec.commit_sha || rec.git_commit_sha || '';
  return String(c).slice(0, 7) || '-------';
}

export function deploymentsView(records) {
  const list = Array.isArray(records) ? [...records] : [];
  list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  const recent = list.slice(0, 6);

  const lines = ['DERNIERS DEPLOIEMENTS', LINE];
  if (!recent.length) {
    lines.push('Aucun deploiement remonte.');
  } else {
    for (const r of recent) {
      const g = DEPLOY_GLYPH[r.status] || '?';
      lines.push(`${g} ${pad(r.status || '?', 18)} ${shortCommit(r)}  ${tidyTs(r.created_at)}`);
      const msg = (r.commit_message || '').replace(/\s+/g, ' ').trim();
      if (msg) lines.push(`    ${msg.slice(0, 60)}`);
    }
  }

  const keyboard = new InlineKeyboard();
  for (const r of recent) {
    if (r.status === 'queued' || r.status === 'in_progress') {
      const id = r.deployment_uuid || r.uuid;
      if (id) keyboard.text(`Annuler ${String(id).slice(0, 6)}`, `cd:${id}`).row();
    }
  }
  keyboard.text('Rafraichir', 'act:deploys').text(`${G.back} Retour`, 'nav:dep');
  return { text: `${head('DEPLOIEMENTS')}\n${pre(lines.join('\n'))}`, keyboard };
}

// ─── whoami ───────────────────────────────────────────────────────────────────
export function whoamiView(from) {
  const allowed = config.telegram.allowedIds.has(from.id);
  const body = [
    'IDENTITE TELEGRAM',
    LINE,
    `${pad('Id', 12)}${from.id}`,
    `${pad('Username', 12)}${from.username ? '@' + from.username : '-'}`,
    `${pad('Nom', 12)}${[from.first_name, from.last_name].filter(Boolean).join(' ') || '-'}`,
    `${pad('Acces', 12)}${allowed ? 'autorise (allowlist)' : 'NON autorise'}`,
    `${pad('Allowlist', 12)}${config.telegram.allowedIds.size} entree(s)`,
  ].join('\n');
  const note =
    '<i>Ajouter une personne : recuperer son Id (via @userinfobot), ' +
    "l'ajouter a TG_ALLOWED_IDS, puis redemarrer le bot.</i>";
  const keyboard = new InlineKeyboard().text(`${G.back} Retour`, 'nav:adm');
  return { text: `${head('WHOAMI')}\n${pre(body)}\n${note}`, keyboard };
}

// ─── Journal d'audit ──────────────────────────────────────────────────────────
export function auditView(entries) {
  const lines = ["JOURNAL D'AUDIT", LINE];
  if (!entries.length) {
    lines.push('Aucune action enregistree depuis le boot.');
  } else {
    for (const e of entries.slice(0, 12)) {
      const who = e.username ? '@' + e.username : e.userId || '?';
      const res = e.result === true ? G.ok : e.result === false ? G.ko : ' ';
      const det = e.detail ? ` ${e.detail}` : '';
      lines.push(`${tidyTs(e.ts)} ${res} ${pad(e.action + det, 16)} ${who}`);
    }
  }
  const keyboard = new InlineKeyboard()
    .text('Rafraichir', 'act:audit')
    .text(`${G.back} Retour`, 'nav:adm');
  return { text: `${head('AUDIT', 'Actions sensibles depuis le demarrage.')}\n${pre(lines.join('\n'))}`, keyboard };
}
