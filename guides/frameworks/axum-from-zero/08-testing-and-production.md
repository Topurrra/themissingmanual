---
title: "Testing & Production"
guide: "axum-from-zero"
phase: 8
summary: "Test an axum app in memory with tower's oneshot (no ports), structure it as a fn app() shared by main and tests, then ship it with graceful shutdown, a distroless container, env config, and real tracing logs."
tags: [axum, rust, testing, production, graceful-shutdown]
difficulty: intermediate
synonyms: ["axum testing", "axum oneshot test", "tower ServiceExt oneshot", "axum graceful shutdown", "axum production", "rust web testing", "axum deploy"]
updated: 2026-07-10
---

# Testing & Production

You've grown the books API from a single route into a real REST service — extractors, shared state, tower middleware, CRUD, an error type that turns into responses. Now comes the part that decides whether anyone *trusts* it: proving it works, and running it somewhere real without falling over at 3am during a deploy. Both turn out to be small, once you see the one fact that makes them small.

## The mental model: your `Router` is a `tower::Service`, so testing is calling it in memory

Here's the fact that makes axum a joy to test. A `Router` **is a `tower::Service`** — the same abstraction every tower layer speaks. A service is, at heart, a thing you hand a `Request` and get back a `Response`, and your whole app is one of those.

> 💡 If the router is a service, a test is nothing more than handing it a request and awaiting the response — directly, in your own process. No network, no port, no `tokio::spawn` running a server in the background. You build a fake request, the router runs the *entire* chain (middleware, routing, extractors, your handler), and you read the response back — all in memory, in microseconds.

The tool is `oneshot`, an extension method from `tower::ServiceExt`: it takes ownership of the service, drives one request through it, and gives you the response.

```bash
cargo add tower --features util
```

The `util` feature brings in `ServiceExt` (and `.oneshot`). A test for `GET /books`:

```rust
use tower::ServiceExt; // brings .oneshot into scope
use axum::{body::Body, http::{Request, StatusCode}};

#[tokio::test]
async fn list_books_ok() {
    let app = app(); // your Router-building fn — see the next section

    let res = app
        .oneshot(Request::builder().uri("/books").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK);
}
```

*What just happened:* `#[tokio::test]` gives the test an async runtime, like `#[tokio::main]` does for `main`. We built the same router the real app uses, then `oneshot` drove a hand-built `GET /books` request through it — `body(Body::empty())` because a GET needs none. `res` comes back a real `Response`; `res.status()` is whatever your handler set. Runs in under a millisecond, no socket opened. `oneshot` *consumes* `app`, which is fine since each test builds its own.

Testing a **POST** with a JSON body is the same shape with two additions: attach the body and set the `Content-Type` header so axum's `Json` extractor knows to parse it.

```rust
#[tokio::test]
async fn create_book_returns_201() {
    let app = app();

    let body = r#"{"title":"Dune","author":"Herbert"}"#;
    let req = Request::builder()
        .method("POST")
        .uri("/books")
        .header("content-type", "application/json")
        .body(Body::from(body))
        .unwrap();

    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::CREATED);
}
```

*What just happened:* method `POST`, URI `/books`, and — this part matters — the `content-type` header set to `application/json`. Without it, `Json<T>` rejects the request before your handler runs, and you'd be testing the wrong path (`415`, not your create logic). `Body::from(body)` becomes the request body; we assert `201 Created`. For inputs you *expect* to fail, send the bad payload and assert the `400`/`422` your `AppError` produces (Phase 7).

To check the *body* of a response, not the status, you pull the bytes out. axum's body is a stream, so you collect it with `to_bytes`:

```rust
use axum::body::to_bytes;

let bytes = to_bytes(res.into_body(), usize::MAX).await.unwrap();
let book: Book = serde_json::from_slice(&bytes).unwrap();
assert_eq!(book.title, "Dune");
```

*What just happened:* `res.into_body()` takes ownership of the response body, and `to_bytes` reads the whole stream into a byte buffer. The second argument is a size cap — `usize::MAX` means "no limit," fine in a test where you control the input, but you'd pass a real ceiling in request-handling code so a giant body can't exhaust memory. `serde_json::from_slice` deserializes those bytes into your `Book` struct, and you assert on real fields — a full round trip: request in, typed value out, no network in sight.

That's the heart of testing an axum app. The rest — table-driven cases, fixtures, running it on every push — is general Rust testing, covered in [testing in CI](/guides/testing-in-ci).

## Structure: one `fn app() -> Router` that `main` and tests both build

Every test above started with `let app = app();`. That's the structural move that makes this clean: **factor router construction into one function** returning the fully-wired `Router`. Both `main` and your tests call it, so they exercise the *exact same* routing, middleware, and state.

```rust
use axum::{routing::{get, post}, Router};

fn app() -> Router {
    Router::new()
        .route("/books", get(list_books).post(create_book))
        .route("/books/{id}", get(get_book).delete(delete_book))
        .layer(tower_http::trace::TraceLayer::new_for_http())
}

#[tokio::main]
async fn main() {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app()).await.unwrap();
}
```

*What just happened:* all route registration and layering lives in one place. `main` binds a TCP listener and serves `app()`; a test builds the *same* `app()` and drives it with `oneshot`. There's no second, slightly-different set of routes that quietly drifts out of sync — one source of truth. The moment you find yourself copy-pasting route setup into a test, stop and pull out an `app()`.

> 📝 Handlers needing shared state — a database pool, config (Phase 4) — make it `fn app(state: AppState) -> Router` ending in `.with_state(state)`. `main` builds the real pool; tests pass a fake or in-memory one.

## Graceful shutdown: drain in-flight requests instead of dropping them

`axum::serve(listener, app()).await` runs forever — until the process is killed. For learning that's perfect. For a real deploy it has a gap: when your platform restarts the service (a deploy, a scale-down, a `SIGTERM`), the process is cut off mid-flight and clients see broken connections.

What you want instead is a **graceful shutdown**: on a shutdown signal, *stop accepting new connections, finish the requests already in progress, then exit.* axum has this built in — hand `serve` a future that resolves when it's time to stop:

```rust
use tokio::signal;

#[tokio::main]
async fn main() {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c().await.expect("failed to install Ctrl-C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
```

*What just happened:* `with_graceful_shutdown` takes a future — `shutdown_signal()` — and watches it while serving. The moment that future resolves, axum stops accepting new connections and waits for in-flight requests to drain before `serve` returns. Inside `shutdown_signal`, we build two futures: one completing on Ctrl-C (`SIGINT`, what you press locally), one on `SIGTERM` (what orchestrators like Kubernetes send on a restart). The `#[cfg(unix)]` pair handles `SIGTERM` not existing on Windows — there, `terminate` never resolves, so only Ctrl-C triggers shutdown. `tokio::select!` waits for *whichever* fires first and starts the drain.

## Deploy shape: release binary, tiny container, env config, real logs

Rust ships like Go: compile to a **single native binary**, no interpreter, no `node_modules`, no virtualenv. Build the optimized version:

```bash
cargo build --release
```

*What just happened:* `--release` turns on optimizations (and off debug assertions), producing a binary in `target/release/` dramatically faster than the debug build. It compiles slower — that's the trade — so keep using plain `cargo run` for development and only build `--release` for what you ship.

Read configuration — at minimum the **port** and your **database URL** — from the environment, not hard-coded constants. This is the 12-factor convention, and it's what platforms expect:

```rust
let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
let addr = format!("0.0.0.0:{port}");
let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
```

*What just happened:* we read `PORT` from the environment and fall back to `3000` for local dev, so the *same binary* runs unchanged whether it's on your laptop or a platform that injects `PORT=10000`. Bind to `0.0.0.0`, not `127.0.0.1` — inside a container, `127.0.0.1` is only reachable from within the container, so nothing outside can connect. The same principle applies to `DATABASE_URL` and any secrets: configuration comes from the environment so the artifact stays identical across environments.

A minimal **multi-stage Dockerfile** compiles the binary in one stage and copies *only* it into a near-empty final image:

```bash
# Build stage — has the full Rust toolchain
FROM rust:1 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

# Run stage — distroless: no shell, no package manager, just enough to run a binary
FROM gcr.io/distroless/cc-debian12
COPY --from=builder /app/target/release/books-api /usr/local/bin/books-api
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["/usr/local/bin/books-api"]
```

*What just happened:* the first stage has the whole Rust toolchain and compiles the binary; the second is a `distroless/cc` image — just the C runtime your binary dynamically links against, no shell, no package manager — and we copy in only the one executable. (`cc-debian12` rather than `static` because a default `cargo build` links libc dynamically.) The result is a container measured in tens of megabytes with a tiny attack surface — no shell means no shell for an attacker to drop into.

One easy-to-miss detail: **your `TraceLayer` logs nothing until you install a subscriber.** The `tracing` ecosystem separates *emitting* events (what `TraceLayer` does) from *printing* them (what a subscriber does). Add `tracing-subscriber` and initialize it once at startup:

```rust
fn main() {
    tracing_subscriber::fmt::init();
    // ...build runtime / serve...
}
```

*What just happened:* `tracing_subscriber::fmt::init()` installs a subscriber that formats events and writes them to stdout, honoring the `RUST_LOG` env var (e.g. `RUST_LOG=info`) for level filtering. Without this one line, the `TraceLayer` from Phase 5 emits per-request spans into the void and you see nothing. With it, requests show up in your logs — and in a container, stdout is exactly where your platform collects them.

Finally, put a **reverse proxy** in front — nginx, Caddy, or whatever your platform provides. It terminates TLS, can serve static assets, and load-balances across instances of your binary. Your axum app speaks plain HTTP on its port; the proxy faces the public internet — you generally don't terminate TLS in axum itself.

That's the whole deploy shape: one release binary, configured by env vars, in a small container, logging to stdout, behind a proxy. Taking it the rest of the way to a live URL — picking a host, wiring CI, the domain and TLS specifics — is covered in [ship your side project](/guides/ship-your-side-project).

## Recap

- A `Router` **is a `tower::Service`**, so you **test it in memory** with no network: add `tower` with the `util` feature, bring `tower::ServiceExt` into scope, and `app.oneshot(request).await` drives one request through the entire chain. Assert on `res.status()`; read the body with `axum::body::to_bytes(res.into_body(), usize::MAX)`.
- For a POST, set `method`, the `content-type: application/json` header (or the `Json` extractor rejects it), and a `Body::from(json)`.
- Factor router construction into one `fn app() -> Router` (or `fn app(state) -> Router`) that both `main` and tests build — one source of truth, no drift.
- Add a **graceful shutdown** with `axum::serve(listener, app()).with_graceful_shutdown(shutdown_signal())`, where `shutdown_signal()` uses `tokio::signal` to await Ctrl-C / `SIGTERM` and `tokio::select!` to fire on whichever comes first.
- Ship a `cargo build --release` binary in a small multi-stage container (builder → `distroless/cc`), read `PORT`/`DATABASE_URL` from the environment, call `tracing_subscriber::fmt::init()` so `TraceLayer` actually logs, and put a reverse proxy in front for TLS and load balancing.

## Quick check

Lock in the core fact (the router is a service) and the two production must-haves:

```quiz
[
  {
    "q": "Why can you test an axum router with oneshot and no real network?",
    "choices": ["axum spins up a hidden test server on a random port", "A Router is a tower::Service, so a test hands it a Request and awaits the Response directly in-process", "oneshot mocks the TCP stack at the OS level", "You can't — axum tests always need a running server"],
    "answer": 1,
    "explain": "A Router is a tower::Service. ServiceExt::oneshot drives a single hand-built Request through the entire middleware-and-handler chain in memory and returns the Response — nothing touches a socket."
  },
  {
    "q": "When testing a POST that uses the Json extractor, what must you set on the request besides the body?",
    "choices": ["Nothing — Json parses any body", "The content-type: application/json header, or the Json extractor rejects the request before your handler runs", "A Content-Length header you compute by hand", "An Authorization header"],
    "answer": 1,
    "explain": "Without content-type: application/json, the Json<T> extractor rejects the request (415) before your handler executes, so you'd be testing the wrong path. Set the header so the body is parsed as JSON."
  },
  {
    "q": "What does with_graceful_shutdown(shutdown_signal()) give you over a plain axum::serve(...).await?",
    "choices": ["Faster request handling", "On Ctrl-C / SIGTERM it stops accepting new connections and drains in-flight requests before exiting, instead of being cut off mid-flight", "Automatic TLS termination", "It restarts the server on panic"],
    "answer": 1,
    "explain": "with_graceful_shutdown watches a future (built from tokio::signal for Ctrl-C and SIGTERM). When it resolves, axum stops accepting connections and lets in-progress requests finish, so a deploy or restart doesn't sever live requests."
  }
]
```

[← Phase 7: Error Handling](07-error-handling.md) · [Guide overview](_guide.md) · [Phase 9: Where to Go Next →](09-where-to-go-next.md)
