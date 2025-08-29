# ---------- Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# ---------- Runner ----------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
# для корректной локали/юникода
ENV TZ=Europe/Moscow

# только нужное
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Если есть swagger/static — раскомментируй
# COPY public ./public

# Порт Nest
EXPOSE 8080

# Переменные, которые будем прокидывать из compose/k8s:
# GIGACHAT_URL, GIGACHAT_BASE, GIGACHAT_OAUTH_PATH, GIGACHAT_SCOPE, GIGACHAT_BASIC, ...
# QDRANT_URL, QDRANT_COLLECTION, QDRANT_DISTANCE, ...
# RAG_TOP_K, RAG_MAX_CHUNKS, RAG_CHUNK_SLICE

CMD ["node", "dist/main.js"]
