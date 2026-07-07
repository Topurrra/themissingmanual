# syntax=docker/dockerfile:1
FROM rust:1-slim-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY platform/ ./platform/
RUN cargo build --release --manifest-path platform/Cargo.toml -p server

FROM debian:bookworm-slim AS runtime
RUN groupadd -r app && useradd -r -g app app
WORKDIR /app
COPY --from=build /build/platform/target/release/server /usr/local/bin/server
COPY --chown=app:app guides/ ./guides/
COPY platform/server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENV BIND_ADDR=0.0.0.0:3000
ENV CONTENT_ROOT=.
EXPOSE 3000
# Starts as root (needed to chown the mounted data volume - see the entrypoint),
# then drops to the non-root `app` user via setpriv before exec'ing the server.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["server"]
