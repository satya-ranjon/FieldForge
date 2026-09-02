FROM node:24-alpine AS build
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/web-buyer-portal...

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5173
COPY --from=build /app/apps/web-buyer-portal/.next/standalone ./
COPY --from=build /app/apps/web-buyer-portal/.next/static ./apps/web-buyer-portal/.next/static
EXPOSE 5173
CMD ["node", "apps/web-buyer-portal/server.js"]
