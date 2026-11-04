FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci

COPY . .

ENV DATABASE_URL="mysql://user:pass@localhost:3306/db"
RUN npx prisma generate

RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install production dependencies plus prisma CLI for migrations
RUN npm ci --only=production && npm install prisma

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose the application port
EXPOSE 1234

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:1234/ || exit 1

# Start the application with entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]