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

EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
