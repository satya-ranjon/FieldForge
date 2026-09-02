FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/billing-service...
EXPOSE 8004
CMD ["node", "apps/billing-service/dist/main.js"]
