# ───────────────────────────────────────────────────────────────────────
# AURA · imagen Docker multi-stage (Node 20 build + nginx alpine serve)
#
# Argumentos build-time:
#   BASE_PATH       → ruta base a la que se sirve la app (default "/")
#                     Ejemplos:
#                       BASE_PATH=/         → https://aura.tu-dominio.com/
#                       BASE_PATH=/aura/    → https://tu-dominio.com/aura/
#
# Construir y correr local:
#   docker build -t aura .
#   docker run --rm -p 8080:80 aura
#   → http://localhost:8080
# ───────────────────────────────────────────────────────────────────────

# === build ============================================================
FROM node:20-alpine AS build
WORKDIR /app

ARG BASE_PATH=/
ARG VITE_API_URL=
ENV VITE_BASE=$BASE_PATH
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# === serve ============================================================
FROM nginx:alpine

# Copiamos el bundle estático y la config de nginx con SPA fallback
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
