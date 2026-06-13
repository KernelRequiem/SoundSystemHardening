# Bot Telegram de pilotage SoundSystem Hardening

J'utilise ce bot pour piloter mon site depuis Telegram : surveiller sa santé, le redéployer, le redémarrer, basculer le mode maintenance, l'arrêter ou le relancer, et modérer les signalements. Le bot tourne dans son propre conteneur Docker, à côté du site, orchestré par Coolify.

Je pose d'abord le modèle de sécurité, parce que c'est lui qui justifie chaque choix d'architecture. Le reste découle.

## Modèle de menace et décisions de sécurité

Le bot est une télécommande de mon infrastructure de production. Si un attaquant en prend le contrôle, il peut couper mon site ou déployer du code. Je le traite donc comme un composant sensible, pas comme un gadget.

Contrôle d'accès par allowlist d'IDs Telegram. Seuls les identifiants numériques listés dans `TG_ALLOWED_IDS` peuvent parler au bot. Tout autre expéditeur est ignoré en silence, sans réponse. Le silence est délibéré : répondre "accès refusé" confirmerait l'existence et l'activité du bot à un inconnu, ce qui ouvre une énumération. Je rejette donc sans rien révéler, et je journalise la tentative.

Long polling, pas de webhook. Le bot ne fait que des connexions sortantes vers `api.telegram.org` via `getUpdates`. Il n'ouvre aucun port public et n'ajoute aucune surface d'attaque entrante. C'est cohérent avec mon durcissement serveur, où seuls 80 et 443 sont publics et l'administration vit derrière VPN. Un webhook aurait imposé d'exposer un endpoint HTTP public supplémentaire, donc une cible de plus.

Confirmation à usage unique pour toute action destructrice. `deploy`, `restart`, `shutdown`, `siteup` et `maintenance` ne s'exécutent jamais sur une simple commande. Le bot émet d'abord un jeton éphémère lié à mon identifiant, et je dois cliquer "Confirmer" dans la minute. Ça neutralise le fat-finger et impose une seconde action volontaire. Le jeton est à usage unique et expire.

Pilotage via l'API Coolify, jamais via le socket Docker. Le bot n'a pas accès à `/var/run/docker.sock`. Monter ce socket dans le conteneur lui donnerait un contrôle root sur tout l'hôte : une faille dans le bot deviendrait une compromission totale du serveur. Je passe par l'API Coolify authentifiée, dont la portée est bornée par le scope du token.

Secrets hors du code. Le token du bot, le token Coolify, le secret HMAC et le token Airtable vivent uniquement dans les variables d'environnement Coolify. Le `.env` local est gitignored. Seul `.env.example`, avec des valeurs factices, est versionné.

Exécution non privilégiée. Le conteneur tourne en utilisateur `node` (uid 1000), pas en root, sur le même principe que le conteneur du site.

Rate limit et journal d'audit. Chaque utilisateur est limité par fenêtre glissante d'une minute. Chaque action sensible est tracée en JSON sur stdout (récupéré par Coolify) avec l'identifiant de l'opérateur, l'action et le résultat.

## Capacités

| Commande | Rôle | Sensible |
|---|---|---|
| `/status` | État complet : site, conteneur Coolify, bot | non |
| `/health` | Sonde rapide du site | non |
| `/uptime` | Statistiques de surveillance | non |
| `/deploy` | Redéploie la dernière version | oui |
| `/restart` | Redémarre le conteneur du site | oui |
| `/logs` | Dernières lignes de logs applicatifs | non |
| `/maintenance on\|off` | Bascule la page maintenance | oui |
| `/shutdown` | Arrête le conteneur du site | oui |
| `/siteup` | Relance le conteneur du site | oui |
| `/pending` | Liste les signalements en attente, validation ou rejet en un clic | oui |

En plus des commandes, le bot pousse des alertes automatiques : il sonde `/api/health` en continu et me prévient sur transition UP vers DOWN et DOWN vers UP, une seule fois par transition pour ne pas transformer une panne en déluge de notifications.

## Architecture des fichiers

```
telegram-bot/
├── Dockerfile           Image non-root, multi-stage
├── package.json         grammY, ESM, Node 20
├── .env.example         Gabarit des variables (valeurs factices)
└── src/
    ├── index.js         Boot : config, monitor, serveur interne, polling
    ├── config.js        Lecture + validation fail-fast de l'environnement
    ├── logger.js        Journal JSON + piste d'audit
    ├── security.js      Allowlist, rate limit, confirmations à usage unique
    ├── coolify.js       Client API Coolify (deploy/restart/stop/start/env/logs)
    ├── monitor.js       Sonde de santé + alertes sur transition d'état
    ├── airtable.js      Modération des signalements (optionnel)
    ├── notify.js        Serveur interne : /health + /notify signé HMAC
    └── bot.js           Câblage des commandes et des callbacks
```

## Configuration

Je copie `.env.example` vers `.env` en local, ou je remplis les variables dans Coolify en production. Variables obligatoires :

- `TG_BOT_TOKEN` : token donné par @BotFather.
- `TG_ALLOWED_IDS` : mes IDs Telegram autorisés, séparés par des virgules. Je récupère mon ID en écrivant à @userinfobot.

Variables recommandées pour le monitoring : `SITE_HEALTH_URL`, `HEALTH_INTERVAL_SEC`, `HEALTH_FAIL_THRESHOLD`, `ALERT_CHAT_ID`.

Variables pour le pilotage Coolify : `COOLIFY_BASE_URL`, `COOLIFY_API_TOKEN`, `COOLIFY_APP_UUID`. Le token se crée dans Coolify sous Keys & Tokens, API tokens, avec la portée la plus restreinte possible. L'UUID de l'application "site" est visible dans l'URL de son panel.

Le reste (Airtable, notify HMAC) est optionnel et détaillé plus bas.

## Lancement en local

```bash
cd telegram-bot
npm install
cp .env.example .env   # puis je renseigne au minimum TG_BOT_TOKEN et TG_ALLOWED_IDS
npm start
```

Sans `TG_BOT_TOKEN` ou `TG_ALLOWED_IDS`, le process refuse de démarrer et indique la variable manquante. C'est la validation fail-fast : je préfère un crash immédiat et explicite à un bot qui tourne à moitié configuré.

## Déploiement sur Coolify

Je déploie le bot comme une seconde application Coolify, distincte du site, à partir du même dépôt :

1. Nouvelle application, même source Git que le site.
2. Build Pack : Dockerfile.
3. Base Directory : `telegram-bot`.
4. Dockerfile Location : `telegram-bot/Dockerfile`.
5. Je renseigne les variables d'environnement dans l'onglet Environment Variables.
6. Pas de domaine public à attacher : le bot n'a pas besoin d'être joignable depuis l'extérieur.

Le `HEALTHCHECK` du conteneur interroge le serveur interne sur le port 8099 (`/health`). Coolify voit ainsi l'état du bot.

Pour que le bot atteigne l'API Coolify depuis l'intérieur, je règle `COOLIFY_BASE_URL`. Deux options selon mon réseau Docker : l'URL interne du service Coolify (par exemple `http://coolify:8080` si je rattache le bot au réseau `coolify`), ou l'URL du panel si l'IP de sortie du conteneur est déjà whitelistée. Je teste avec `/status` après le premier déploiement.

## Mécanique du mode maintenance

Mon `src/middleware.ts` lit `process.env.MAINTENANCE_MODE === 'true'` à chaque requête et redirige vers `/maintenance`. Les variables d'environnement Docker se fixent au démarrage du conteneur : pour appliquer un changement, il faut relancer le conteneur. Quand je tape `/maintenance on`, le bot met donc à jour la variable côté Coolify puis déclenche un restart, et le site redémarre avec la nouvelle valeur. Bascule propre, au prix d'un court redémarrage.

Évolution possible sans redémarrage : remplacer la lecture de variable par un fichier indicateur sur un volume partagé entre le site et le bot, que le middleware consulte à chaque requête. Le bot écrirait ou supprimerait le fichier, sans restart. Je garde l'approche variable plus restart tant que je ne veux pas modifier le middleware.

## Modération des signalements (optionnel)

`/pending` lit les enregistrements Airtable dont le champ statut vaut "En attente" et propose Valider ou Rejeter en un clic. Deux points d'attention :

Le token Airtable du bot doit être en lecture plus écriture. Le token du site est volontairement write-only : il ne permet pas de lister les enregistrements, donc il ne convient pas pour modérer. Je crée un token dédié au bot, avec la portée minimale nécessaire.

Mon `/api/signalement` actuel envoie un email SMTP, il n'écrit pas dans Airtable. Pour que la modération par le bot ait du sens, les signalements doivent atterrir dans Airtable. Soit je bascule le sink de `/api/signalement` vers Airtable, soit j'adapte les noms de table et de champs via `AIRTABLE_TABLE`, `AIRTABLE_STATUS_FIELD` et les valeurs de statut.

## Push d'alertes depuis le site (optionnel)

Pour être prévenu en temps réel d'un nouveau signalement ou message de contact, j'active le canal `/notify`. Je définis `NOTIFY_SECRET` côté bot, puis j'ajoute un appel signé HMAC dans mes routes serveur. Le bot recalcule la signature et compare en temps constant ; sans signature valide, la requête est rejetée. Ce canal vit sur le réseau Docker interne et ne doit jamais être routé par Traefik.

Exemple de hook à ajouter dans `src/pages/api/signalement.ts` après l'envoi réussi :

```ts
import { createHmac } from 'node:crypto';

async function pushTelegram(title: string, body: string) {
  const secret = process.env.NOTIFY_SECRET;
  const url = process.env.BOT_NOTIFY_URL; // ex: http://ssh-bot:8099/notify
  if (!secret || !url) return; // canal désactivé : on ne bloque jamais la requête
  const payload = JSON.stringify({ type: 'signalement', title, body });
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': sig },
      body: payload,
    });
  } catch {
    /* le push est best-effort : son échec ne doit pas casser le formulaire */
  }
}
```

Le bot reste le seul détenteur du token Telegram. Le site ne connaît que le secret HMAC partagé, jamais le token du bot : si le site fuit, l'attaquant ne récupère pas le contrôle du bot.
