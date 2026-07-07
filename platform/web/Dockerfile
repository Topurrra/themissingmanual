# syntax=docker/dockerfile:1
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
# Fonts for OG-image rasterization (@resvg/resvg-js renders the /og.png cards).
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-dejavu-core fontconfig \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENV PORT=3000
EXPOSE 3000
# Starts as root (needed to chown the mounted data volume - see the entrypoint),
# then drops to the non-root `node` user via setpriv before exec'ing the app.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "build"]
