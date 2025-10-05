# ---------- Stage 1: Build ----------
FROM node:20-bullseye AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy project
COPY . .

# ✅ Force classic compiler (disable Turbopack completely)
ENV NEXT_SKIP_TURBOPACK=1
ENV NEXT_IGNORE_ESLINT=1

# Build the app
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:20-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
