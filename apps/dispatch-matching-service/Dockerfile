FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/dispatch-matching-service...
EXPOSE 3003
CMD ["node", "apps/dispatch-matching-service/dist/main.js"]
