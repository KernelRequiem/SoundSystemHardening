// src/notify.js
// Petit serveur HTTP interne, double role :
//   - GET /health  : sonde de vie du conteneur (HEALTHCHECK Docker). Toujours actif.
//   - POST /notify : canal de push depuis le site (nouveau signalement, nouveau
//                    message de contact). Actif seulement si NOTIFY_SECRET est defini.
//
// Securite : ce serveur ne doit JAMAIS etre route par Traefik. Il vit sur le
// reseau docker interne. /notify est en plus protege par une signature HMAC :
// le site signe le corps avec le secret partage, le bot recalcule et compare en
// temps constant. Sans signature valide, la requete est rejetee. Polling cote
// Telegram (getUpdates) : le bot n'expose donc aucune surface publique entrante.

import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { log } from './logger.js';

function verifySignature(rawBody, signatureHex) {
  if (!signatureHex) return false;
  const expected = createHmac('sha256', config.notify.secret).update(rawBody).digest();
  let provided;
  try {
    provided = Buffer.from(signatureHex, 'hex');
  } catch {
    return false;
  }
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export function startNotifyServer(bot) {
  const server = createServer((req, res) => {
    // Sonde de vie : reponse minimale, aucune info.
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
      return;
    }

    if (req.method === 'POST' && req.url === '/notify') {
      if (!config.notify.enabled) {
        res.writeHead(404);
        res.end();
        return;
      }
      const chunks = [];
      let size = 0;
      req.on('data', (c) => {
        size += c.length;
        if (size > 64 * 1024) req.destroy(); // borne anti-DoS
        else chunks.push(c);
      });
      req.on('end', async () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        const sig = req.headers['x-signature'];
        if (!verifySignature(raw, Array.isArray(sig) ? sig[0] : sig)) {
          log.warn('notify_bad_signature', { ip: req.socket.remoteAddress });
          res.writeHead(401);
          res.end();
          return;
        }
        let payload;
        try {
          payload = JSON.parse(raw);
        } catch {
          res.writeHead(400);
          res.end();
          return;
        }
        const title = String(payload.title || 'Notification site').slice(0, 120);
        const body = String(payload.body || '').slice(0, 2000);
        const text = `[SITE] ${title}${body ? '\n\n' + body : ''}`;
        try {
          await bot.api.sendMessage(config.telegram.alertChatId, text);
          log.info('notify_relayed', { type: payload.type || 'generic' });
          res.writeHead(200);
          res.end('{"ok":true}');
        } catch (err) {
          log.error('notify_relay_failed', { error: String(err?.message || err) });
          res.writeHead(502);
          res.end();
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(config.notify.port, '0.0.0.0', () => {
    log.info('notify_server_listening', {
      port: config.notify.port,
      notifyEnabled: config.notify.enabled,
    });
  });
  return server;
}
