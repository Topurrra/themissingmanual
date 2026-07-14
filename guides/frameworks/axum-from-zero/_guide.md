---
title: "axum From Zero"
guide: "axum-from-zero"
phase: 0
summary: "Learn the Tokio team's Rust web framework - the one this very platform runs on: the router and your first server, routing and extractors, handlers and IntoResponse, shared state, middleware with Tower, a full REST API, error handling that uses Rust's type system, and testing and production. Built on hyper and tower, ergonomic without macros."
tags: [axum, rust, web, framework, tokio, tower, async, rest]
category: frameworks
order: 22
group: "Rust"
difficulty: intermediate
synonyms: ["learn axum", "axum tutorial", "rust axum web framework", "axum extractors", "axum state", "axum tower middleware", "axum intoresponse", "axum rest api", "axum vs actix"]
updated: 2026-06-23
---

# axum From Zero

axum is the web framework from the Tokio team, and it has quietly become the default for new Rust web
services - including the one serving this very page. Its appeal is that it leans entirely on Rust's type
system instead of macros or magic: you write plain `async fn` handlers, and axum figures out how to call
them based on their argument and return types. It sits on top of **hyper** (the HTTP implementation) and
**tower** (a universal middleware abstraction), so learning axum also teaches you the layer the rest of
the async Rust ecosystem shares.

The mental model is two ideas. A **`Router`** maps paths to handlers (and can be nested and layered). And
a handler is **an `async fn` whose arguments are *extractors*** - types like `Path`, `Query`, `Json`, and
`State` that pull pieces out of the request - **and whose return value implements `IntoResponse`**. Once
you see "arguments extract from the request, the return value becomes the response," axum stops looking
clever and starts looking inevitable.

> 📝 This teaches the **framework** - it assumes you know **Rust**: ownership, traits, `Result`, and
> `async`/`await` ([Rust From Zero](/guides/rust-from-zero)). It builds on **Tokio** and **hyper/tower**,
> which have their own roots guides ([Tokio](/guides/tokio-the-async-runtime),
> [hyper & tower](/guides/hyper-and-tower)) - read those to remove the last of the magic. Compare with
> [actix-web](/guides/actix-web-from-zero) and [Rocket](/guides/rocket-from-zero). axum compiles and runs
> as a Rust program, so examples are shown with the commands to run them.

## How to read this

Read in order - it grows one service (a small **books API**) from a single route to a tested, deployable
REST API. Phases carry difficulty badges.

## The phases

**Part 1 - The core (🟢 Basic → 🟡)**
1. **[What axum Is & Your First Server](01-what-axum-is.md)** 🟢 - the `Router`, the async handler, and a running server on Tokio.
2. **[Routing & Extractors](02-routing-and-extractors.md)** 🟢 - methods, `Path`/`Query`, nesting and merging routers.
3. **[Handlers & IntoResponse](03-handlers-and-intoresponse.md)** 🟡 - `Json` in and out, what makes a valid handler, and how return types become responses.

**Part 2 - A real API (🟡 → 🔴)**
4. **[Shared State](04-shared-state.md)** 🟡 - `State<T>`, `with_state`, and giving handlers a database pool without globals.
5. **[Middleware with Tower](05-middleware-and-tower.md)** 🔴 - `Layer`/`Service`, `ServiceBuilder`, and `tower-http` (tracing, CORS, timeouts).
6. **[Building a REST API](06-building-a-rest-api.md)** 🟡 - full CRUD wired through extractors, state, and `IntoResponse`.
7. **[Error Handling](07-error-handling.md)** 🔴 - a custom error type that implements `IntoResponse`, and the `?` operator in handlers.

**Part 3 - Ship it (🟡 → 🟢)**
8. **[Testing & Production](08-testing-and-production.md)** 🟡 - `oneshot` handler tests, graceful shutdown, and deployment.
9. **[Where to Go Next](09-where-to-go-next.md)** 🟢 - axum vs actix/Rocket, sqlx/SeaORM for data, and the tokio/hyper/tower roots.

> The throughline: a **`Router`** sends a request to an **`async fn` whose arguments extract from it and
> whose return value becomes the response**, with tower layers wrapped around the whole thing. Hold that
> and axum is plain Rust.

---

[Phase 1: What axum Is & Your First Server →](01-what-axum-is.md)
