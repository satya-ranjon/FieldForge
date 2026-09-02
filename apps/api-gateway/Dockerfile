FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/api-gateway...
EXPOSE 8000
CMD ["node", "apps/api-gateway/dist/main.js"]
