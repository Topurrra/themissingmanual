---
title: "actix-web From Zero"
guide: "actix-web-from-zero"
phase: 0
summary: "Learn one of the fastest Rust web frameworks: the App and HttpServer, routing and extractors, responders, shared state with web::Data, middleware, a full REST API with the ResponseError trait, and testing and production. Mature, batteries-included, and a perennial benchmark leader."
tags: [actix-web, rust, web, framework, async, rest, api]
category: frameworks
order: 23
group: "Rust"
difficulty: intermediate
synonyms: ["learn actix web", "actix-web tutorial", "rust actix framework", "actix extractors", "actix web::data state", "actix middleware", "actix responder", "actix rest api", "actix vs axum"]
updated: 2026-06-23
---

# actix-web From Zero

actix-web is one of the oldest, fastest, and most battle-tested web frameworks in Rust - it sits at or
near the top of the TechEmpower benchmarks year after year, and a lot of production Rust runs on it. Where
[axum](/guides/axum-from-zero) is the newer, tower-native option, actix-web is the mature, feature-packed
one: routing, extractors, middleware, websockets, and more, all included. The name carries a bit of
history - it grew out of an actor framework - but day to day you write plain `async fn` handlers and rarely
touch actors at all.

The mental model is three pieces. An **`App`** holds your routes and shared state; an **`HttpServer`**
runs one or more copies of that `App` across worker threads; and a **handler** is an `async fn` whose
arguments are **extractors** (`Path`, `Query`, `Json`, `web::Data`) and whose return value is a
**`Responder`**. If that sounds like axum, it is - the big Rust frameworks converged on "extract from the
request, return something that becomes a response." The differences are in the details, and this guide
walks them.

> 📝 This teaches the **framework** - it assumes you know **Rust** (ownership, traits, `Result`,
> `async`/`await` - [Rust From Zero](/guides/rust-from-zero)). It's most useful read alongside
> [axum](/guides/axum-from-zero) (the closest comparison) and on top of [Tokio](/guides/tokio-the-async-runtime).
> actix-web compiles and runs as a Rust program, so examples are shown with the commands to run them.

## How to read this

Read in order - it grows one service (a small **articles API**) from a single route to a tested,
deployable REST API. Phases carry difficulty badges.

## The phases

**Part 1 - The core (🟢 Basic)**
1. **[What actix-web Is & Your First Server](01-what-actix-web-is.md)** 🟢 - `App`, `HttpServer`, the async handler, and a running server.
2. **[Routing & Extractors](02-routing-and-extractors.md)** 🟢 - methods, scopes, `Path`/`Query`/`Json`, and how extractors work.
3. **[Responders](03-responders.md)** 🟡 - `HttpResponse`, `impl Responder`, returning JSON and status codes.

**Part 2 - A real API (🟡 → 🔴)**
4. **[Shared State with web::Data](04-shared-state.md)** 🟡 - `web::Data<T>`, `app_data`, and sharing a pool across workers.
5. **[Middleware](05-middleware.md)** 🔴 - `wrap`, the built-in `Logger`, `from_fn`, and writing your own.
6. **[A REST API with Error Handling](06-rest-api-and-errors.md)** 🔴 - full CRUD plus the `ResponseError` trait for clean error responses.

**Part 3 - Ship it (🟡 → 🟢)**
7. **[Testing & Production](07-testing-and-production.md)** 🟡 - `actix_web::test`, workers, and deployment.
8. **[Where to Go Next](08-where-to-go-next.md)** 🟢 - actix-web vs axum/Rocket, data layers, and what to build.

> The throughline: an **`App`** of routes, run by an **`HttpServer`**, with handlers that **extract from
> the request and return a `Responder`**. Mature, fast, and more familiar than its actor heritage suggests.

---

[Phase 1: What actix-web Is & Your First Server →](01-what-actix-web-is.md)
