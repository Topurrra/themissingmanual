# syntax=docker/dockerfile:1
FROM rust:1-slim-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY platform/ ./platform/
RUN cargo build --release --manifest-path platform/Cargo.toml -p server

FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /build/platform/target/release/server /usr/local/bin/server
COPY guides/ ./guides/
ENV BIND_ADDR=0.0.0.0:3000
ENV CONTENT_ROOT=.
EXPOSE 3000
CMD ["server"]
