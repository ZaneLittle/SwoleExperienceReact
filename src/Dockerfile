# Multi-stage build for Expo React Native web app
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY app.json ./
COPY app/ ./app/
COPY components/ ./components/
COPY contexts/ ./contexts/
COPY lib/ ./lib/
COPY hooks/ ./hooks/
COPY index.js ./
COPY babel.config.js ./
COPY tsconfig.json ./
COPY jest.setup.js ./
COPY public/ ./public/

# Build the web version
RUN npx expo export --platform web

# Copy public files to dist directory
RUN cp -r public/* dist/ || true

# Production image
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy built assets
COPY --from=builder /app/dist ./

# Create simple SVG icon
RUN echo '<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg"><rect width="192" height="192" fill="#000000"/><text x="96" y="110" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="#ffffff" text-anchor="middle">💪</text><text x="96" y="160" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" text-anchor="middle">Swole</text></svg>' > icon.svg

# Create Apple touch icon
RUN cp icon.svg apple-touch-icon.png

# Create favicon
RUN cp icon.svg favicon.ico

# Set proper permissions
RUN chmod 644 /usr/share/nginx/html/icon* /usr/share/nginx/html/apple-touch-icon.png /usr/share/nginx/html/favicon.ico

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (nginx default)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
