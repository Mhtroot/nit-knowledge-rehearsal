# ---------- Build stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and Prisma config first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all dependencies (including devDependencies for building)
RUN npm install --no-audit --no-fund

# Copy source code
COPY . .

# Generate Prisma client (dummy URL, only needed for generation)
ENV DATABASE_URL="mysql://user:pass@localhost:3306/db"
RUN npx prisma generate

# Build TypeScript
RUN npm run build


# ---------- Production stage ----------
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files and Prisma config
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install production dependencies only (prisma CLI is in "dependencies")
RUN npm install --omit=dev --no-audit --no-fund

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend ./frontend
# COPY --from=builder /app/generated ./generated

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose the application port
EXPOSE 4567

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4567/ || exit 1

# Start the application with entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]