# ==========================================================
# Multi-Stage Production Dockerfile for Malayalam TV
# ==========================================================

# Stage 1: Build Frontend and Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build client
COPY . .
RUN npm run build

# Remove development dependencies to keep image tiny
RUN npm prune --production

# Stage 2: Minimal Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy production build and dependencies
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose backend & frontend port
EXPOSE 3001

# Run as non-root user for maximum container security
USER node

CMD ["npm", "start"]
