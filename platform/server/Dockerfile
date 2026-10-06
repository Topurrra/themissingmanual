# syntax=docker/dockerfile:1
FROM rust:1-slim-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /build
# Only the Rust workspace - copying all of platform/ (incl. web/) made every web-only
# change bust this layer and recompile every crate from scratch.
COPY platform/Cargo.toml platform/Cargo.lock ./platform/
COPY platform/core/ ./platform/core/
COPY platform/server/ ./platform/server/
COPY platform/third_party/ ./platform/third_party/
# Persistent BuildKit caches: the registry and target/ survive between builds, so a
# change recompiles only what changed instead of all dependencies. target/ lives in
# the cache mount (not the image), so the binary is copied out in the same step.
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/build/platform/target \
    cargo build --release --manifest-path platform/Cargo.toml -p server \
    && cp platform/target/release/server /build/server

FROM debian:bookworm-slim AS runtime
RUN groupadd -r app && useradd -r -g app app
WORKDIR /app
COPY --from=build /build/server /usr/local/bin/server
COPY --chown=app:app guides/ ./guides/
COPY --chown=app:app translations/ ./translations/
COPY platform/server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENV BIND_ADDR=0.0.0.0:3000
ENV CONTENT_ROOT=.
EXPOSE 3000
# Starts as root (needed to chown the mounted data volume - see the entrypoint),
# then drops to the non-root `app` user via setpriv before exec'ing the server.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["server"]
