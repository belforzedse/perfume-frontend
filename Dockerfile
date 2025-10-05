# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev ones)
RUN npm install

# Copy source
COPY . .

# Disable Turbopack and ESLint
ENV NEXT_DISABLE_TURBOPACK=1
ENV NEXT_IGNORE_ESLINT=1

# Build the app
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy minimal runtime files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
