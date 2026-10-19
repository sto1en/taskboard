# syntax=docker/dockerfile:1

# ============================================================
#  Frontend — React + Vite
#  Собираем статику, отдаём её через nginx и проксируем
#  /api и /uploads на backend.
# ============================================================

# ------------------------------------------------------------
# 1. Сборка статики
# ------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /build

# Сначала манифесты — слой с node_modules кэшируется.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Исходники и прод-сборка.
# ВАЖНО: baseURL остаётся относительным (/api), поэтому абсолютный
# адрес backend в бандле не нужен — его подставит nginx.
COPY . .
RUN npm run build

# ------------------------------------------------------------
# 2. Раздача через nginx
# ------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Наш конфиг: SPA-fallback + прокси /api и /uploads на backend:8080.
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
