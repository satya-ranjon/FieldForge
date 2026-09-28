FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@11.24.0 turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/auth-service...
EXPOSE 8001
CMD ["node", "apps/auth-service/dist/main.js"]
