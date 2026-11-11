# Any static site or SPA (React, Vue, Angular, Svelte build output) served by nginx.
FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Written by Taglore before docker build -> GET /release-notes/latest.json
COPY release-notes/ /usr/share/nginx/html/release-notes/
