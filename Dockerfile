# Two stages: build the static site, then serve it with nginx.
# The runtime image carries no Node, no source and no build cache —
# it is a web server plus a folder of HTML, which is what makes this
# trivial to run on a NAS (Synology / QNAP Container Manager, Portainer).

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Baked into canonical URLs, RSS and the sitemap at build time.
ARG SITE_URL=http://localhost:8080
ENV SITE_URL=$SITE_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null || exit 1
