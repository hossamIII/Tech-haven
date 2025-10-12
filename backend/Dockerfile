# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-slim AS build
WORKDIR /app

# (Optional) tools for native modules; harmless if not used
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# 1) Install deps first (cache-friendly)
COPY package*.json ./
RUN npm ci

# 2) Now copy the rest of the source (this is what was missing)
COPY . .

# 3) Build Medusa (server + admin)
RUN npm run build

# 4) Trim dev deps for runtime
RUN npm prune --omit=dev

# ---------- Runtime stage ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=9000

# Bring in built app and pruned node_modules
COPY --from=build /app /app

EXPOSE 9000
CMD ["npm", "start"]