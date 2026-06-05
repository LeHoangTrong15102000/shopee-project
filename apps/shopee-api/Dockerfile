# =============================================================================
# shopee-api — Multi-stage Dockerfile
# Build context: monorepo root (docker build -f apps/shopee-api/Dockerfile .)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: deps — install production dependencies only
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Enable corepack and activate the exact pnpm version pinned in the workspace
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# Copy workspace manifests first so this layer is cached when only source changes
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/shopee-api/package.json ./apps/shopee-api/

# Install only the API package and its workspace dependencies
RUN pnpm install --frozen-lockfile --filter @shopee/api...

# -----------------------------------------------------------------------------
# Stage 2: build — compile TypeScript with path alias resolution
# -----------------------------------------------------------------------------
FROM deps AS build

# Copy the full API source (tsconfig, src/, etc.)
COPY apps/shopee-api/ ./apps/shopee-api/

# Compile TypeScript and resolve path aliases via tsc-alias
# Output lands in apps/shopee-api/build/
RUN pnpm --filter @shopee/api run build

# -----------------------------------------------------------------------------
# Stage 3: deploy-prod — produce a complete, self-contained flat node_modules
#   `pnpm deploy --prod` resolves the @shopee/api production dependency closure
#   and writes a proper, flattened node_modules to /app/out — independent of
#   whether the workspace linker is isolated or hoisted.  Built FROM build so
#   pnpm has access to the full workspace + lockfile + installed deps.
# Note: pnpm 10.x may require --legacy in filtered workspaces; included here.
# -----------------------------------------------------------------------------
FROM build AS deploy-prod

RUN pnpm --filter @shopee/api deploy --prod --legacy /app/out

# -----------------------------------------------------------------------------
# Stage 4: runtime — minimal production image
# Required runtime env vars (supply via env_file or -e):
#   MONGO_URI, REDIS_URL, SECRET_KEY_JWT, JWT_ACCESS_TTL, JWT_REFRESH_TTL,
#   PORT (default 4000), CLIENT_URL, UPLOAD_DIR, NODE_ENV
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app

# Create a dedicated non-root user (uid 1001) for running the process.
# node:20-alpine ships with a built-in "node" user at uid 1000; we create
# a separate "appuser" at uid 1001 to match the spec exactly.
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser

# Copy compiled output from build stage.
# tsconfig has outDir ./build and no explicit rootDir, so tsc infers rootDir as
# src/ and emits flattened output to apps/shopee-api/build/ (entrypoint is
# build/index.js, NOT build/src/index.js — there is no build/src/ subdirectory).
# We copy them to /app/build/ so CMD "node build/index.js" resolves correctly.
COPY --from=build /app/apps/shopee-api/build ./build

# Copy the self-contained flat node_modules produced by pnpm deploy --prod.
# This closure is independent of the workspace linker and always complete.
COPY --from=deploy-prod /app/out/node_modules ./node_modules

ENV NODE_ENV=production

# Create the upload directory and set ownership before switching user
RUN mkdir -p /app/upload && chown -R appuser:appuser /app

USER appuser

EXPOSE 4000

# Entry point: tsc infers rootDir as src/ (no explicit rootDir set), so output is
# flattened to build/ — entrypoint is build/index.js, not build/src/index.js.
# With WORKDIR /app and build/ copied to /app/build/, this resolves correctly.
CMD ["node", "build/index.js"]
