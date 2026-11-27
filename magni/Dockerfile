# Multi-stage build for Expo React Native web app. Node 22 is the current LTS
# supported by Expo SDK 58. Node 24 is also required by Jest 30's ESM loader.
FROM node:24-alpine AS base

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# The packageManager field in package.json pins pnpm for reproducible builds.
RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build stage
FROM base AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
# .dockerignore keeps development files and secrets out of the build context.
COPY . .

# Build the web version
RUN pnpm exec expo export --platform web

# Production image
FROM nginxinc/nginx-unprivileged:1.28-alpine AS runner
WORKDIR /usr/share/nginx/html

COPY --chown=nginx:nginx --from=builder /app/dist ./

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Non-root nginx serves the app on an unprivileged port.
EXPOSE 42069

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
