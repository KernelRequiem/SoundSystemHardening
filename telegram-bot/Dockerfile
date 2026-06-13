# ── Stage 1 : Build (install des deps de prod uniquement) ────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Pas de lockfile garanti a la creation : npm install genere/respecte package-lock.
RUN npm install --omit=dev

# ── Stage 2 : Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

ENV NODE_ENV=production
# Port interne du petit serveur sante / notify (jamais expose via Traefik).
ENV NOTIFY_PORT=8099

# ── Execution en utilisateur non privilegie ──────────────────────────────────
# Meme principe que le conteneur du site : une RCE applicative ne doit pas
# donner un shell root. node:alpine fournit deja l'utilisateur 'node' (uid 1000).
RUN chown -R node:node /app
USER node

EXPOSE 8099

# Sonde de vie : le bot repond 200 sur /health (serveur interne).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8099/health || exit 1

CMD ["node", "src/index.js"]
