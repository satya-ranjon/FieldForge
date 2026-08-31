FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/api-gateway...
EXPOSE 3000
CMD ["node", "apps/api-gateway/dist/main.js"]
