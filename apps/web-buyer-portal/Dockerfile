FROM node:20-alpine AS build
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fieldforge/web-buyer-portal...

FROM nginx:alpine
COPY --from=build /app/apps/web-buyer-portal/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
