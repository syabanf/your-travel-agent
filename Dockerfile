# syntax=docker/dockerfile:1
#
# Icon Holiday — multi-stage image.
#
#   dev    → Vite dev server with hot reload      (docker compose up dev)
#   test   → lint + the vitest suite, fails the build on red
#   prod   → static bundle served by nginx        (docker compose up web)
#
# The app is a pure front-end SPA (data lives in the browser's localStorage),
# so production is just static files — no Node process at runtime.

ARG NODE_VERSION=22-alpine

########################  dependencies  ########################
# Isolated so `npm ci` is only re-run when the lockfile changes.
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

##############################  dev  ###########################
FROM node:${NODE_VERSION} AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
# --host is required: without it Vite binds 127.0.0.1 inside the container and
# the port publish appears to do nothing.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

#############################  test  ###########################
# `docker build --target test .` is a self-contained CI gate.
FROM node:${NODE_VERSION} AS test
WORKDIR /app
ENV CI=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run lint && npx vitest run

############################  build  ###########################
FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

#############################  prod  ###########################
# Unprivileged nginx: runs as uid 101 and listens on 8080, so the container
# needs no root and no extra capabilities.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS prod
LABEL org.opencontainers.image.title="Icon Holiday" \
      org.opencontainers.image.description="Traveler app, admin CMS and company-profile landing page"
COPY docker/nginx.conf            /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
