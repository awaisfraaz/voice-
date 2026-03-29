# ── Stage 1: Build (install native deps + compile sherpa-onnx-node) ──
FROM node:18-bookworm AS builder

# Install build tools required by sherpa-onnx-node
RUN apt-get update && apt-get install -y \
    cmake \
    g++ \
    make \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including native addons)
RUN npm ci

# ── Stage 2: Production image ──
FROM node:18-bookworm-slim

# Install runtime libraries needed by sherpa-onnx-node native addon
RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy node_modules from builder (includes compiled native addon)
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY package.json package-lock.json ./
COPY server.js ./
COPY supabaseClient.js ./
COPY routes/ ./routes/
COPY models/ ./models/

# Create upload directory in /tmp (writable on all cloud platforms)
RUN mkdir -p /tmp/uploads/voice

# Railway injects PORT env var dynamically
ENV PORT=3000

# Start the server
CMD ["node", "server.js"]
