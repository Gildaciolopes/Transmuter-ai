FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core-engine/package.json packages/core-engine/
COPY apps/api/package.json apps/api/
RUN npm ci --workspace=packages/core-engine --workspace=apps/api
COPY packages/core-engine packages/core-engine
COPY apps/api apps/api
RUN npm run build --workspace=packages/core-engine
RUN npm run build --workspace=apps/api

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/core-engine/dist ./packages/core-engine/dist
COPY --from=build /app/packages/core-engine/package.json ./packages/core-engine/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
ENV API_PORT=3000
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
