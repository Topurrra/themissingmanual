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
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
