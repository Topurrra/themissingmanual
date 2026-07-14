---
title: "hyper & tower: The HTTP and Middleware Under axum"
guide: "hyper-and-tower"
phase: 0
summary: "Learn the two libraries every Rust web framework is built on: hyper, the low-level HTTP implementation, and tower, the universal async Service abstraction. The Service trait, Layers and middleware composition, the tower-http toolbox, and exactly how axum is a tower Service over hyper. The bottom of the Rust web stack, made visible."
tags: [hyper, tower, rust, http, middleware, service, axum, framework-internals]
category: frameworks
order: 26
group: "Rust"
difficulty: advanced
synonyms: ["learn hyper", "learn tower", "rust hyper http", "tower service trait", "tower layer middleware", "tower-http", "how axum works", "rust http library", "rust middleware abstraction"]
updated: 2026-06-23
---

# hyper & tower: The HTTP and Middleware Under axum

Underneath [axum](/guides/axum-from-zero) - and a lot of the Rust networking world - sit two libraries
most people never learn directly: **hyper**, a fast, correct, low-level HTTP implementation, and **tower**,
an abstraction for "an async function from a request to a response" that makes middleware composable across
the whole ecosystem. This is the deepest **roots** guide in the Rust set. You'll rarely write hyper or
tower by hand, but understanding them demystifies a stack of things at once: what a `Service` is, why axum
middleware is a `tower::Layer`, how `tower-http` gives you tracing/CORS/timeouts for free, and what
`axum::serve` is really doing.

The mental model is one trait and one wrapper. **`tower::Service`** is the universal shape: *given a
request, asynchronously produce a response* (plus a readiness check for backpressure). Everything - a
whole axum app, a single endpoint, a database client, a rate limiter - can be a `Service`. A **`Layer`**
is a function that wraps one `Service` to make another (that's middleware). hyper, meanwhile, is what
actually speaks HTTP on the socket and calls your top-level `Service` for each request. Hold "a `Service`
turns a request into a response, a `Layer` wraps a `Service`, and hyper drives the whole thing over the
network," and the Rust web stack lays itself out flat.

> 📝 This is the deepest **roots** guide - it assumes **Rust** (traits, generics, `async` - [Rust From
> Zero](/guides/rust-from-zero)) and the runtime beneath it ([Tokio](/guides/tokio-the-async-runtime)).
> It's most rewarding after you've used [axum](/guides/axum-from-zero), so the pieces have somewhere to
> land. Examples run as plain Rust programs.

## How to read this

Read in order - it builds from hyper's HTTP server up through the `Service` trait, `Layer`s, and
`tower-http`, then maps the whole thing back onto axum. Phases carry difficulty badges.

## The phases

1. **[What hyper & tower Are](01-what-hyper-and-tower-are.md)** 🟢 - the HTTP library and the `Service` abstraction, and where they sit in the stack.
2. **[hyper: The HTTP Library](02-hyper-the-http-library.md)** 🟡 - `Request`/`Response`, a bare hyper server, and what it hands your code.
3. **[The Service Trait](03-the-service-trait.md)** 🔴 - `poll_ready` + `call`, the universal "async request → response," and why it's everywhere.
4. **[Layers & Middleware](04-layers-and-middleware.md)** 🔴 - `tower::Layer`, `ServiceBuilder`, and composing middleware as wrapped services.
5. **[The tower-http Toolbox](05-tower-http.md)** 🟡 - tracing, CORS, compression, and timeouts as reusable layers.
6. **[How axum Uses Them](06-how-axum-uses-them.md)** 🟢 - axum's `Router` as a `Service` over hyper, with your layers wrapped around it.
7. **[Where to Go Next](07-where-to-go-next.md)** 🟢 - applying this to gRPC (tonic), clients, and the rest of the tower ecosystem.

> The throughline: a **`Service`** turns a request into a response, a **`Layer`** wraps a `Service`
> (that's middleware), and **hyper** drives it over the socket. axum is a `Service` you assembled.

---

[Phase 1: What hyper & tower Are →](01-what-hyper-and-tower-are.md)
