// src/index.js
// Point d'entree : valide la config, demarre le serveur sante/notify, lance la
// surveillance, puis demarre le bot en long polling (getUpdates).
//
// Choix du long polling plutot que d'un webhook : le bot n'effectue que des
// connexions SORTANTES vers api.telegram.org. Il n'ouvre aucun port public et
// n'ajoute aucune surface d'attaque entrante, ce qui colle au durcissement du
// serveur (UFW : seuls 80/443 publics, admin derriere VPN). Un webhook aurait
// impose d'exposer un endpoint public supplementaire.

import { config, capabilitiesSummary } from './config.js';
import { log } from './logger.js';
import { buildBot } from './bot.js';
import { startMonitor } from './monitor.js';
import { startNotifyServer } from './notify.js';

const bot = buildBot();

// Serveur interne (sonde de vie du conteneur + push optionnel depuis le site).
const server = startNotifyServer(bot);

// Surveillance active du site.
startMonitor(bot);

// Menu des commandes (suggestions dans l'UI Telegram).
async function publishCommands() {
  try {
    await bot.api.setMyCommands([
      { command: 'menu', description: 'Ouvrir la console a boutons' },
      { command: 'dashboard', description: 'Tableau de bord temps reel' },
      { command: 'status', description: 'Etat complet (site + conteneur + bot)' },
      { command: 'health', description: 'Sonde rapide du site' },
      { command: 'uptime', description: 'Stats de surveillance' },
      { command: 'deploy', description: 'Redeployer (confirmation)' },
      { command: 'restart', description: 'Redemarrer le conteneur (confirmation)' },
      { command: 'logs', description: 'Dernieres lignes de logs' },
      { command: 'deployments', description: 'Derniers deploiements' },
      { command: 'maintenance', description: 'on|off page maintenance (confirmation)' },
      { command: 'shutdown', description: 'Arreter le site (confirmation)' },
      { command: 'siteup', description: 'Relancer le site (confirmation)' },
      { command: 'pending', description: 'Signalements en attente' },
      { command: 'audit', description: 'Journal des actions sensibles' },
      { command: 'links', description: 'Liens rapides' },
      { command: 'whoami', description: 'Mon ID Telegram' },
      { command: 'help', description: 'Aide' },
    ]);
  } catch (err) {
    log.warn('set_commands_failed', { error: String(err?.message || err) });
  }
}

// Arret propre : on stoppe le polling et on ferme le serveur HTTP.
function shutdown(signal) {
  log.info('shutting_down', { signal });
  bot.stop();
  server.close();
  setTimeout(() => process.exit(0), 1500).unref();
}
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

log.info('boot', { capabilities: capabilitiesSummary() });

await publishCommands();

// Demarrage du long polling. La promesse ne resout qu'a l'arret du bot.
bot.start({
  drop_pending_updates: true,
  onStart: (me) => log.info('bot_started', { username: me.username, id: me.id }),
});
