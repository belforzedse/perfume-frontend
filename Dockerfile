# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies efficiently
RUN npm ci --only=production && npm cache clean --force

# Copy rest of the source code
COPY . .

# Disable Turbopack for stable builds
ENV NEXT_DISABLE_TURBOPACK=1
ENV NEXT_IGNORE_ESLINT=1

# Build the Next.js app
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy only the built output and needed files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]
