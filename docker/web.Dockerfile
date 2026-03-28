# Stage 1: install all deps + build
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace=apps/web
COPY apps/web apps/web
ENV NEXT_PUBLIC_API_URL=http://localhost:3000
RUN npm run build --workspace=apps/web

# Stage 2: production runner — only prod deps + build output
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Install only production dependencies
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace=apps/web --omit=dev
# Copy Next.js build output
COPY --from=builder /app/apps/web/.next apps/web/.next
COPY apps/web/next.config.js apps/web/
COPY apps/web/package.json apps/web/
EXPOSE 3001
CMD ["npx", "--workspace=apps/web", "next", "start", "-p", "3001"]
