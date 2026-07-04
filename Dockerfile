# ============================================================================
# Odoo HR Management - Docker Build Configuration
# Container Name: odoo-hr-app
# ============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS odoo-hr-dependencies
LABEL maintainer="HR Management Team"

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS odoo-hr-builder
LABEL maintainer="HR Management Team"

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS odoo-hr-runtime
LABEL maintainer="HR Management Team" \
      description="Odoo HR Management Application - Production Container"

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application from builder stage
COPY --from=odoo-hr-builder /app/.next ./.next
COPY --from=odoo-hr-builder /app/public ./public
COPY --from=odoo-hr-dependencies /app/node_modules ./node_modules
COPY --from=odoo-hr-builder /app/package.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
