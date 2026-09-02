FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/notification-service...
EXPOSE 8005
CMD ["node", "apps/notification-service/dist/main.js"]
