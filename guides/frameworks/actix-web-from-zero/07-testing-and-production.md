---
title: "Testing & Production"
guide: "actix-web-from-zero"
phase: 7
summary: "Test an actix-web app in memory with actix_web::test (no ports), share routes between main and tests via .configure(), then ship it with workers, built-in graceful shutdown, and env config."
tags: [actix-web, rust, testing, production, workers]
difficulty: intermediate
synonyms: ["actix testing", "actix_web::test", "actix init_service test", "actix workers", "actix graceful shutdown", "actix production deploy"]
updated: 2026-06-23
---

# Testing & Production

You've grown the articles API the whole way — `App`, `HttpServer`, extractors, responders, shared state, middleware, and a full CRUD layer with `ResponseError`. Now comes the part that decides whether anyone trusts it: proving it works, and running it somewhere real without it falling over at 3am. The good news is that actix-web makes both smaller than you'd expect — once you see the one fact that shrinks testing, and once you realize how much of production it already handles for you.

## The mental model: testing is calling your app in memory — no ports

Here's the fact that makes actix-web pleasant to test: you never start a real server. The `actix_web::test` module builds your `App` into an in-memory service and lets you push requests straight through it. No socket opens, no port binds, no background task running a server you have to remember to shut down. You hand the app a request, it produces a response, you read it back — all inside the test process, in microseconds.

> 💡 A test is just: build the same `App` your real server runs, turn it into a service with `test::init_service`, craft a request with `test::TestRequest`, and call `test::call_service`. The entire chain — middleware, routing, extractors, your handler — runs exactly as it would for a live request, except nothing leaves the process.

```rust
use actix_web::{test, App, web};

#[actix_web::test]
async fn list_articles_ok() {
    let app = test::init_service(
        App::new().app_data(state()).route("/articles", web::get().to(list))
    ).await;
    let req = test::TestRequest::get().uri("/articles").to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}
```

*What just happened:* the `#[actix_web::test]` attribute does what `#[actix_web::main]` does for `main` — it spins up the actix runtime so your `async` test can `.await`. `test::init_service` takes the *same* `App` builder your server uses (same state, same routes) and compiles it into an in-memory service. `test::TestRequest::get().uri("/articles").to_request()` builds a real `Request` with no connection behind it. `test::call_service(&app, req)` runs the whole pipeline and hands back the `ServiceResponse`, whose `.status()` we assert is a 2xx. This finishes in well under a millisecond and never touches the network.

Testing a **POST with a JSON body** is the same shape with two helpers — `set_json` to attach the body (it sets `Content-Type: application/json` for you) and `read_body_json` to deserialize the response so you can assert on its contents:

```rust
use actix_web::{test, App, web};

#[actix_web::test]
async fn create_article_returns_it() {
    let app = test::init_service(
        App::new().app_data(state()).route("/articles", web::post().to(create))
    ).await;

    let req = test::TestRequest::post()
        .uri("/articles")
        .set_json(&serde_json::json!({ "title": "write tests" }))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 201);

    let body: Article = test::read_body_json(resp).await;
    assert_eq!(body.title, "write tests");
}
```

*What just happened:* `set_json(&body)` serializes the value and sets the JSON content type, so your `web::Json<T>` extractor sees a properly-formed request — exactly the path a real client hits. We assert `201` (the status your create handler returns), then `test::read_body_json(resp).await` reads the response body and deserializes it into an `Article` so we can check the field. There are tighter helpers too: `test::call_and_read_body_json` does the call-and-deserialize in one step, and `test::try_call_service` returns a `Result` instead of panicking, which is handy when you want to assert on an error path yourself.

> 📝 For testing inputs you *expect* to fail — a missing title, malformed JSON — send the bad payload and assert the status and error body your `ResponseError` impl produces. That's where the error-handling work from [Phase 6](06-rest-api-and-errors.md) pays off: your tests confirm clients get the right `400`, not a stack trace.

This is the heart of testing a web app. The rest — table-driven cases, fixtures, running it all on every push — is general Rust testing, covered in [testing in CI](/guides/testing-in-ci).

## Share routes between `main` and tests with `.configure()`

Look at the two tests above and you'll notice a smell: each one re-declares its routes. The moment your real `App` and your test `App` describe routes *differently*, your tests are validating wiring that production doesn't use. The fix is to declare routes exactly once, in a function, and call it from both places.

actix-web has a dedicated hook for this: **`.configure(config_fn)`**, where `config_fn` takes a `&mut web::ServiceConfig` and registers everything on it.

```rust
use actix_web::{web, App, HttpServer};

fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/articles")
            .route("", web::get().to(list))
            .route("", web::post().to(create))
            .route("/{id}", web::get().to(get_one))
            .route("/{id}", web::delete().to(delete)),
    );
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().app_data(state()).configure(config))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}
```

And the test calls the very same `config`:

```rust
#[actix_web::test]
async fn list_articles_ok() {
    let app = test::init_service(
        App::new().app_data(state()).configure(config)
    ).await;
    let req = test::TestRequest::get().uri("/articles").to_request();
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}
```

*What just happened:* all route registration now lives in one `config` function. `main` builds the `App` and calls `.configure(config)`; the test builds an `App` and calls the *same* `.configure(config)`. There's no second, slightly-different set of routes that "should match production" but quietly drifts — there is one source of truth. If your handlers need state or a database pool, pass it in (`config(pool)` returning a closure, or set `app_data` alongside `configure`) so tests can hand in a fixture. The rule of thumb: the first time you copy-paste route setup into a test, stop and pull out a `.configure()` function.

## Production: workers, graceful shutdown, env config

actix-web is built for production out of the box — a lot of what you'd hand-roll in other stacks is already there. Three things to know.

**Workers.** `HttpServer` runs multiple copies of your `App`, one per worker thread, and load-balances connections across them. By default it spawns **one worker per logical CPU**, which is usually what you want. You only set `.workers(n)` to override it — for example, pinning it lower in a small container.

```rust
HttpServer::new(|| App::new().app_data(state()).configure(config))
    .workers(4)
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
```

*What just happened:* `.workers(4)` tells `HttpServer` to run four worker threads, each with its own copy of the `App` built by your closure. (That's why the `App` is built in a closure — it's constructed once per worker.) Remove the `.workers(4)` line and you get the default: one per CPU. Note `0.0.0.0` rather than `127.0.0.1` — in a container you bind all interfaces so traffic from outside the container reaches you.

**Graceful shutdown — already handled.** This is the big one. actix-web installs signal handlers for you: on `SIGINT` (Ctrl+C) or `SIGTERM` (what your platform sends on a deploy or scale-down), it **stops accepting new connections, lets in-flight requests finish, then exits**. You don't write the goroutine-and-channel dance some stacks require — it's built into `.run()`. The one knob you may tune is how long it waits for stragglers:

```rust
HttpServer::new(|| App::new().configure(config))
    .shutdown_timeout(30) // seconds to let in-flight requests drain
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
```

*What just happened:* `.shutdown_timeout(30)` gives in-flight requests up to 30 seconds to complete after a shutdown signal arrives; past that, remaining connections are force-closed so a stuck request can't block your deploy forever. The default is 30 seconds, so you'd set this only to lengthen it (long-running uploads) or shorten it (you want fast restarts). Everything else about the drain is automatic.

**Env config and logging.** Read anything that changes between environments — `PORT`, `DATABASE_URL`, secrets — from the environment, not hard-coded constants, so the same binary runs unchanged on your laptop and in production. And remember from [Phase 5](05-middleware.md) that the `Logger` middleware writes through the `log` facade, which does nothing until a logger is initialized — so call `env_logger::init()` (or your logger of choice) at the top of `main`, or your access logs go silent in production.

```rust
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init(); // now the Logger middleware actually prints

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    HttpServer::new(|| App::new().app_data(state()).wrap(actix_web::middleware::Logger::default()).configure(config))
        .bind(("0.0.0.0", port))?
        .run()
        .await
}
```

*What just happened:* `env_logger::init()` reads the `RUST_LOG` env var (e.g. `RUST_LOG=info`) and wires up the logger the `Logger` middleware needs — without this line, your access logs are silent. We default `PORT` to `8080` but let the environment override it, so a platform injecting `PORT=10000` works with no code change. The `App` is still built in a closure (once per worker), now with `Logger` wrapped on and `config` registering the routes.

## Deploy shape: release build, a small container, a proxy in front

Three steps take this from "runs on my machine" to "runs in production."

First, build in **release mode**. Debug builds are unoptimized and slow; production wants the optimized binary:

```bash
cargo build --release
# produces target/release/articles-api
```

*What just happened:* `--release` turns on optimizations (and strips debug assertions), producing a much faster binary at `target/release/`. Compilation takes longer, but you do it once at build time, not per request.

Second, package it in a **multi-stage container** — compile in a stage with the full Rust toolchain, then copy *only* the binary into a tiny runtime image:

```bash
# Build stage — full Rust toolchain
FROM rust:1 AS build
WORKDIR /src
COPY . .
RUN cargo build --release

# Run stage — slim image, just the binary
FROM debian:stable-slim
COPY --from=build /src/target/release/articles-api /usr/local/bin/articles-api
ENV RUST_LOG=info
EXPOSE 8080
CMD ["articles-api"]
```

*What just happened:* the first stage has the whole Rust toolchain and compiles the binary; the second stage is a slim Debian image carrying just the executable (plus the few shared libraries a default Rust binary links against — that's why we use `debian:stable-slim` rather than `scratch`). The result is a small image with a tiny attack surface. We bake in `RUST_LOG=info` so logging is on by default in the container.

Third, put a **reverse proxy** in front — nginx, Caddy, or whatever your platform provides (a load balancer, an ingress controller). The proxy terminates TLS (HTTPS), can serve static assets, and load-balances across instances. Your actix-web app speaks plain HTTP on its port; the proxy faces the public internet. You generally don't terminate TLS in actix-web itself — let the proxy do it.

That's the whole deploy shape: a release binary, in a small container, configured by env vars, behind a proxy. Taking it the rest of the way to a live URL — picking a host, wiring CI, the domain and TLS specifics — is covered in [ship your side project](/guides/ship-your-side-project).

## Recap

- A test is **calling your `App` in memory**: `test::init_service(App::new()...)`, build a request with `test::TestRequest`, run it with `test::call_service`, assert on `.status()`. No ports, no network. For JSON POSTs use `.set_json(&body)` and read the response with `test::read_body_json` (or the one-shot `test::call_and_read_body_json`).
- Declare routes **once** in a `fn config(cfg: &mut web::ServiceConfig)` and call `.configure(config)` from both `main` and your tests — one source of truth, no drift.
- `HttpServer` runs **one worker per CPU by default**; override with `.workers(n)` only when you need to.
- **Graceful shutdown is built in** — actix-web handles `SIGINT`/`SIGTERM`, draining in-flight requests before exit. Tune the drain window with `.shutdown_timeout(secs)`; you rarely need to do more.
- Read config (`PORT`, `DATABASE_URL`) from the **environment**, and call `env_logger::init()` so the `Logger` middleware actually prints.
- Ship a **release build** (`cargo build --release`) in a **multi-stage container**, behind a **reverse proxy** that terminates TLS.

## Quick check

Lock in the core fact (testing is in-memory) and the two production must-haves:

```quiz
[
  {
    "q": "How does actix_web::test run a request against your app?",
    "choices": ["It starts a real server on a random port and sends an HTTP request over the loopback interface", "It builds the App into an in-memory service with test::init_service and runs the request through it with test::call_service — no port, no socket", "It mocks the TCP stack at the OS level", "It can only test individual handler functions in isolation, never the full app"],
    "answer": 1,
    "explain": "test::init_service compiles the same App into an in-memory service; test::call_service pushes a TestRequest through the full middleware-routing-handler chain in-process. Nothing binds a port or opens a socket."
  },
  {
    "q": "What does .configure(config_fn) let you do?",
    "choices": ["Enable release-mode optimizations", "Set the number of worker threads", "Register routes once in a fn taking &mut web::ServiceConfig, then call it from both main and tests so they share identical wiring", "Configure TLS certificates"],
    "answer": 2,
    "explain": "A config function registers services/routes on the ServiceConfig. Calling .configure(config) in both main and tests means there's one source of truth for routing — production and tests can't drift apart."
  },
  {
    "q": "What do you have to write yourself to get graceful shutdown in actix-web?",
    "choices": ["A goroutine plus a signal channel that calls server.shutdown() on SIGTERM", "Nothing — it's built in; actix-web handles SIGINT/SIGTERM and drains in-flight requests, and you only optionally tune .shutdown_timeout(secs)", "A custom middleware that intercepts the shutdown signal", "A reverse proxy that drains connections before killing the process"],
    "answer": 1,
    "explain": "HttpServer's .run() installs signal handlers and stops accepting new connections, lets in-flight requests finish, then exits — automatically. The only knob is .shutdown_timeout to lengthen or shorten the drain window."
  }
]
```

[← Phase 6: A REST API with Error Handling](06-rest-api-and-errors.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)