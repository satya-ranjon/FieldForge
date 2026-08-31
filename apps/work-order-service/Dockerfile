FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/work-order-service...
EXPOSE 3002
CMD ["node", "apps/work-order-service/dist/main.js"]
