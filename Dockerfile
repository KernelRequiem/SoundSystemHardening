# ── Stage 1 : Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Stage 2 : Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copier le dist, les dépendances de prod, et le contenu source nécessaire au runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# En mode output:server, les pages lisent src/content et src/data à chaque requête
COPY --from=builder /app/src/content ./src/content
COPY --from=builder /app/src/data ./src/data

# Fix @astrojs/node v8 : resolveClientDir() cherche dans dist/server/client/
# au lieu de dist/client/ (décalage d'un niveau dû au chunk dans chunks/)
RUN ln -sf /app/dist/client /app/dist/server/client

# Variables d'environnement runtime (à surcharger dans Coolify)
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

# ── Execution en utilisateur non privilegie ──────────────────────────────────
# Par defaut le conteneur tournerait en root : une RCE applicative donnerait
# alors un shell root dans le conteneur. L'image node:alpine fournit deja un
# utilisateur 'node' (uid 1000). On lui transfere la propriete de /app et on
# bascule dessus. Le port 4321 (>1024) ne necessite aucun privilege.
RUN chown -R node:node /app
USER node

EXPOSE 4321

# Sonde de vie interne : l'endpoint /api/health ne divulgue plus aucune config.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4321/api/health || exit 1

CMD ["node", "dist/server/entry.mjs"]
