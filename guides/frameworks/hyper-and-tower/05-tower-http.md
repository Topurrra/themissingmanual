---
title: "The tower-http Toolbox"
guide: "hyper-and-tower"
phase: 5
summary: "tower-http is a box of ready-made Layers — tracing, CORS, compression, timeouts, body limits, static files — that snap onto any HTTP tower service. The concrete payoff of the Service/Layer abstraction."
tags: [tower-http, rust, middleware, tracing, cors, compression]
difficulty: intermediate
synonyms: ["tower-http", "tower TraceLayer", "tower CorsLayer", "tower CompressionLayer", "tower TimeoutLayer", "tower reusable middleware"]
updated: 2026-07-10
---

# The tower-http Toolbox

Here's the mental model for the whole phase: **`tower-http` is a box of ready-made `Layer`s.** In Phases 3 and 4 you learned the abstract machinery — a `Service` turns a request into a response, a `Layer` wraps a `Service` to make a new one. That was the theory. `tower-http` is where you cash it in. It's a crate full of pre-built `Layer`s that do the things every real HTTP service needs — log requests, handle CORS, compress responses, enforce timeouts — and because they're plain tower `Layer`s, they snap onto *any* HTTP tower service. Your axum app, a tonic gRPC server, a bare hyper service, even an HTTP *client*: same layers, same `.layer(...)` move.

That's the dividend the `Service`/`Layer` abstraction was paying toward the whole time. You don't write a tracing middleware or a CORS handler — you add a crate and hang a layer.

> 📝 This phase is the *applied* counterpart to Phase 4. Phase 4 showed you how `Layer` and `ServiceBuilder` compose middleware in the abstract; here you get the concrete, production-grade layers you'll actually reach for. The exact same crate, and the exact same layers, are what axum users add with `.layer` — see [axum's middleware phase](/guides/axum-from-zero). We're looking at it from underneath.

## Why tower-http works everywhere

`tower-http` is built on the `http` and `http-body` crates — the shared vocabulary types (`Request`, `Response`, body streams) that the whole Rust HTTP ecosystem agrees on. It is *not* built on axum, or hyper, or tonic specifically. It targets the lowest common denominator: "a tower `Service` whose request and response are `http::Request` / `http::Response`."

That's why one `TimeoutLayer` can wrap an axum router today and a hyper-based HTTP client tomorrow. The layer doesn't know or care what's inside — it only speaks `http`.

You add layers à la carte, enabling a Cargo feature per family of layers you want:

```bash
cargo add tower-http --features trace,cors,compression,timeout,limit,fs
```

*What just happened:* each feature flag (`trace`, `cors`, `compression`, …) pulls in one group of layers and nothing else. `tower-http` is heavily feature-gated so you only compile the middleware you actually use. Forgetting the feature is the usual "why won't `tower_http::trace` resolve?" — the module is gated off until you enable its flag.

## The key layers

Here's the toolbox, layer by layer. Each one is a `Layer` you construct and wrap around a service.

- **`TraceLayer::new_for_http()`** — emits request and response events (method, path, status, latency) through the `tracing` crate. The single most useful layer in the box.
- **`CorsLayer`** — adds CORS headers and handles preflight `OPTIONS` requests. `CorsLayer::permissive()` allows everything (fine for local dev); the builder (`CorsLayer::new().allow_origin(...)`) locks it down for production.
- **`CompressionLayer`** — compresses response bodies (gzip, brotli, deflate, zstd) based on the client's `Accept-Encoding`. Its mirror, **`DecompressionLayer`**, transparently decompresses *request* bodies.
- **`TimeoutLayer`** — aborts a request that runs longer than a set `Duration`, returning a `408`-style response instead of hanging forever. (`tower` itself also ships a generic `timeout`; the `tower-http` one is HTTP-aware.)
- **`RequestBodyLimitLayer`** — rejects requests whose body exceeds a byte limit, so a client can't exhaust your memory by streaming a giant upload.
- **`SetResponseHeaderLayer`** — sets (or overrides) a response header on every response, e.g. a `cache-control` or a custom `x-powered-by`.
- **`ServeDir`** — not a layer but a ready-made `Service` that serves static files from a directory. You mount it as a route's service rather than wrapping something.

```rust
use std::time::Duration;
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    limit::RequestBodyLimitLayer,
    timeout::TimeoutLayer,
    trace::TraceLayer,
};

let trace = TraceLayer::new_for_http();
let cors = CorsLayer::permissive();
let compress = CompressionLayer::new();
let timeout = TimeoutLayer::new(Duration::from_secs(10));
let body_limit = RequestBodyLimitLayer::new(2 * 1024 * 1024); // 2 MiB
```

*What just happened:* every line constructs a `Layer` value — and nothing more. Constructing a layer does no work; it's just a recipe for how to wrap a service. None of these are attached to anything yet. That's the next step.

## Composing the stack with ServiceBuilder

A real service wants several of these at once, in a deliberate order. As you saw in Phase 4, **`ServiceBuilder`** stacks layers so they read top-to-bottom — the first `.layer(...)` becomes the **outermost** wrapper, the one a request hits first on the way in.

```rust
use tower::ServiceBuilder;
use tower_http::{trace::TraceLayer, compression::CompressionLayer, cors::CorsLayer};

let service = ServiceBuilder::new()
    .layer(TraceLayer::new_for_http())   // outermost: logs everything inside it
    .layer(CompressionLayer::new())
    .layer(CorsLayer::permissive())
    .service(inner);                     // your app / hyper service
```

*What just happened:* `ServiceBuilder::new()` starts an empty stack; each `.layer(...)` wraps another ring around whatever comes after it; `.service(inner)` plugs your actual service in at the center. The result is a *new* `Service` — `inner` wrapped in CORS, wrapped in compression, wrapped in tracing. A request flows in `trace → compress → cors → inner`, and the response unwinds back out in reverse. The ordering matters for real reasons: tracing is outermost so it times and logs *everything*, including the work compression does, and it sees responses *before* they're compressed into an opaque blob. (This is exactly the Phase 4 ordering rule — `ServiceBuilder` reads in execution order; bare chained `.layer()` calls read bottom-up.)

> 💡 Step back and feel the payoff. You wrote zero middleware. You got request tracing, response compression, and CORS — three things every production HTTP service needs — by adding a crate and stacking three values. *That* is what the `Service`/`Layer` abstraction from Phases 3 and 4 buys you: an ecosystem of drop-in, composable middleware that works on anything shaped like an HTTP service.

## ⚠️ TraceLayer logs nothing on its own

The most common surprise with `TraceLayer` — and with any `tracing`-based layer — is that you add it, run your server, hit it with requests, and see **no logs at all**. Nothing is broken.

> ⚠️ `TraceLayer` *emits* `tracing` events; it does not *print* them. The `tracing` crate splits those two jobs deliberately. Until you install a **subscriber** to receive and render events, they go nowhere. The fix is one line at startup:
>
> ```rust
> tracing_subscriber::fmt::init();
> ```
>
> Put that at the top of `main`, before you start serving, and your `TraceLayer` events appear on stderr. No subscriber, no output — every Rust web developer hits this once.

*What just happened:* `tracing_subscriber::fmt::init()` registers a global subscriber that formats events and writes them out. `TraceLayer` was doing its job all along — emitting structured events into the `tracing` system — but with no subscriber listening, there was nobody on the other end of the line. This separation is a feature: the same layer can feed a pretty dev console, structured JSON in production, or an OpenTelemetry pipeline, just by swapping the subscriber.

## The same layers axum hands you

If you've used axum's middleware, none of this is new — and that's the point.

> 💡 When an axum guide tells you to `cargo add tower-http --features trace` and write `.layer(TraceLayer::new_for_http())`, *this is the crate it means*. axum has no middleware of its own. `TraceLayer`, `CorsLayer`, `CompressionLayer`, `TimeoutLayer` — they're `tower-http` layers, and they work on an axum `Router` for one reason only: a `Router` is a tower `Service`, so a tower `Layer` wraps it like any other. The skill transfers in both directions. Anything you learned reaching for layers in axum applies to a bare hyper service here; anything here applies straight back to [axum](/guides/axum-from-zero). One abstraction, one toolbox, everywhere.

## Recap

- **`tower-http` is a box of ready-made `Layer`s** — the concrete payoff of the `Service`/`Layer` abstraction. You add a crate and hang a layer instead of writing middleware.
- It's built on the shared `http`/`http-body` types, not on any one framework, so its layers work on **any HTTP tower service**: axum, tonic, a raw hyper service, even a client.
- The staples: **`TraceLayer`** (request/response tracing), **`CorsLayer`** (CORS + preflight), **`CompressionLayer`**/`DecompressionLayer`, **`TimeoutLayer`**, **`RequestBodyLimitLayer`**, `SetResponseHeaderLayer`, and `ServeDir` for static files. Enable each with a `cargo add tower-http --features ...` flag.
- Compose them with **`ServiceBuilder`** (top-to-bottom = outermost-first, per Phase 4's ordering rule) or, on axum, with `.layer(...)`.
- ⚠️ **`TraceLayer` prints nothing without a `tracing_subscriber`** — install one (`tracing_subscriber::fmt::init()`) at startup, or you'll see no logs.
- 💡 These are the exact layers axum users add with `.layer` — same crate, because a `Router` is just another tower `Service` (see [axum](/guides/axum-from-zero)).

## Quick check

```quiz
[
  {
    "q": "Why can a tower-http layer like TimeoutLayer wrap an axum app, a tonic gRPC server, AND an HTTP client?",
    "choices": ["It has special-cased code for each framework", "It's built on the shared http/http-body types, so it works on any HTTP tower Service", "axum, tonic, and the client all re-export it", "It only works on axum; the others reimplement it"],
    "answer": 1,
    "explain": "tower-http targets the lowest common denominator: a tower Service over http::Request/http::Response. It doesn't know what's inside, so it wraps anything shaped that way."
  },
  {
    "q": "You add TraceLayer::new_for_http(), send requests, and see no logs. What's wrong?",
    "choices": ["TraceLayer is broken; use a different layer", "You forgot to call .layer()", "No tracing_subscriber is installed — TraceLayer emits events but a subscriber must render them", "Tracing only works in release builds"],
    "answer": 2,
    "explain": "TraceLayer emits tracing events; it doesn't print them. Without a subscriber (e.g. tracing_subscriber::fmt::init()) listening, the events go nowhere."
  },
  {
    "q": "In a ServiceBuilder stack, which layer is the outermost — the one a request hits first on the way in?",
    "choices": ["The last .layer() added", "The first .layer() added", "Whichever calls .service()", "Ordering is undefined in ServiceBuilder"],
    "answer": 1,
    "explain": "ServiceBuilder reads top-to-bottom: the first .layer() is the outermost wrapper and runs first inbound. (Bare chained .layer() calls are the reverse — bottom-up.)"
  }
]
```

[← Phase 4: Layers & Middleware](04-layers-and-middleware.md) · [Guide overview](_guide.md) · [Phase 6: How axum Uses Them →](06-how-axum-uses-them.md)