# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

# ✅ Disable Turbopack & ESLint for stable build
ENV NEXT_SKIP_TURBOPACK=1
ENV NEXT_IGNORE_ESLINT=1

# 👇 Build using stable compiler
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy only what's needed for runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
