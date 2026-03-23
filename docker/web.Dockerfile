FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace=apps/web
COPY apps/web apps/web
ENV NEXT_PUBLIC_API_URL=http://localhost:3000
RUN npm run build --workspace=apps/web
EXPOSE 3001
CMD ["npx", "--workspace=apps/web", "next", "start", "-p", "3001"]
