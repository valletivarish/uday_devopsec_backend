# ============================================================================
# Backend Dockerfile - Order Processing & Management API
#
# Multi-stage build for the Node.js Express backend.
# Stage 1: Install production dependencies only (smaller image).
# Stage 2: Copy application code and run the server.
#
# Author: Uday Kiran Reddy Dodda (x25166484)
# ============================================================================

# ---------- Stage 1: Install dependencies ----------
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy only package files first to leverage Docker layer caching —
# dependencies are re-installed only when package.json changes
COPY package.json package-lock.json ./

# Install production dependencies only (no devDependencies)
RUN npm ci --only=production

# ---------- Stage 2: Production image ----------
FROM node:20-alpine AS production

# Set environment to production for optimised Express performance
ENV NODE_ENV=production

WORKDIR /app

# Create a non-root user for security (principle of least privilege)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules from the dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY package.json ./
COPY server.js ./
COPY src/ ./src/

# Switch to non-root user before running the application
USER appuser

# Expose the API port (matches PORT env variable default)
EXPOSE 5000

# Health check to verify the container is serving requests
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
