# ============================================================
# CloudBox Backend — Multi-Stage Dockerfile
# ============================================================
# Stage 1 : Install all deps + generate Prisma client
# Stage 2 : Install production-only deps (compiles native modules)
# Stage 3 : Lean runtime image — no build tools, non-root user
# ============================================================


# ────────────────────────────────────────────────────────────
# Stage 1 — Full install + Prisma client generation
# ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Build tools required by bcrypt (native C++ addon)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Install ALL dependencies (including devDeps — we need the prisma CLI)
COPY package.json package-lock.json ./
RUN npm ci

# Copy Prisma schema and config, then generate the client.
# prisma generate reads the schema file only — no DB connection is made.
# We supply placeholder URLs only to satisfy prisma.config.ts env() calls;
# these are never written as ENV and disappear after this RUN layer.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://placeholder" \
    DIRECT_URL="postgresql://placeholder" \
    npx prisma generate


# ────────────────────────────────────────────────────────────
# Stage 2 — Production-only node_modules
# ────────────────────────────────────────────────────────────
FROM node:20-slim AS prod-deps

WORKDIR /app

# Build tools required by bcrypt (native C++ addon)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev


# ────────────────────────────────────────────────────────────
# Stage 3 — Runtime image
# ────────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

# 1. Copy production node_modules (includes compiled bcrypt .node binary)
COPY --from=prod-deps /app/node_modules ./node_modules

# 2. Overlay the Prisma-generated packages from the builder stage.
#    prisma generate writes into node_modules/.prisma/client/ and
#    patches node_modules/@prisma/client/  — both must come from builder.
COPY --from=builder /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# 3. Copy application source.
#    Nothing from .env or serviceAccKey.json is copied (see .dockerignore).
COPY server.js       ./
COPY src             ./src
COPY prisma          ./prisma
COPY prisma.config.ts ./
COPY package.json    ./

# Run as a non-root user for security
RUN groupadd --system appgroup && \
    useradd  --system --gid appgroup --no-create-home appuser
USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
