FROM node:24-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@11.24.0 turbo
COPY . .
RUN pnpm install --frozen-lockfile
# API_GATEWAY_URL is consumed during 'next build' to bake rewrites into routes-manifest.json.
# Changing container runtime environment will NOT retarget rewrites; a different upstream requires rebuilding.
ENV API_GATEWAY_URL=http://api-gateway-service:8000
RUN pnpm turbo run build --filter=@fieldforge/web-buyer-portal...

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5173
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/apps/web-buyer-portal/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web-buyer-portal/.next/static ./apps/web-buyer-portal/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web-buyer-portal/public ./apps/web-buyer-portal/public

USER nextjs

EXPOSE 5173
CMD ["node", "apps/web-buyer-portal/server.js"]
