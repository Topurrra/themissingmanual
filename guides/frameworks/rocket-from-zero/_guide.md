---
title: "Rocket From Zero"
guide: "rocket-from-zero"
phase: 0
summary: "Learn Rust's most ergonomic web framework: attribute-route handlers and launch, dynamic paths, request guards and data, responders, managed state and fairings, a full REST API with error catchers, and testing and config. The framework that makes Rust web code read almost like Flask — powered by macros."
tags: [rocket, rust, web, framework, macros, rest, api]
category: frameworks
order: 24
group: "Rust"
difficulty: intermediate
synonyms: ["learn rocket", "rocket rs tutorial", "rust rocket framework", "rocket request guards", "rocket managed state", "rocket fairings", "rocket responders", "rocket rest api", "rocket vs axum actix"]
updated: 2026-06-23
---

# Rocket From Zero

Rocket is the Rust web framework that prizes ergonomics above all. Where axum and actix-web ask you to
assemble routers and handlers, Rocket lets you write `#[get("/books/<id>")]` above a function and be done —
the framework reads your attributes and function signature and wires everything up. It leans hard on Rust
**macros** to do that, which is the trade: the code is wonderfully concise and readable (close to what a
Flask or Express developer expects), at the cost of more "magic" happening behind the attributes. If you've
found other Rust frameworks verbose, Rocket is the antidote.

The mental model is "attributes describe routes, the function signature describes inputs." A handler is a
function annotated with **`#[get(...)]`/`#[post(...)]`**; its **parameters are pulled from the path,
query, body, and *request guards*** (types that must succeed for the handler to run, like an authenticated
user); and its **return type is a `Responder`**. You register handlers with `routes![...]` and start with
`#[launch]`. Shared dependencies are **managed state**, and **fairings** are Rocket's middleware. Hold
"the attribute is the route, the signature is the request," and Rocket's magic becomes legible.

> 📝 This teaches the **framework** — it assumes you know **Rust** (ownership, traits, `Result`,
> and a comfort with how attribute macros feel — [Rust From Zero](/guides/rust-from-zero)). Compare it
> with [axum](/guides/axum-from-zero) and [actix-web](/guides/actix-web-from-zero) to see the
> macros-vs-builders split; all three sit on async Rust ([Tokio](/guides/tokio-the-async-runtime)).
> Rocket compiles and runs as a Rust program, so examples are shown with the commands to run them.

## How to read this

Read in order — it grows one service (a small **books API**) from a single attribute route to a tested,
configured REST API. Phases carry difficulty badges.

## The phases

**Part 1 — The core (🟢 Basic)**
1. **[What Rocket Is & Your First Server](01-what-rocket-is.md)** 🟢 — `#[get]`, `routes!`, `#[launch]`, and a running server.
2. **[Routing & Dynamic Paths](02-routing-and-paths.md)** 🟢 — path segments `<id>`, query params, and `FromParam`.
3. **[Request Guards & Data](03-guards-and-data.md)** 🟡 — `Json<T>` data, forms, and request guards (the auth pattern).

**Part 2 — A real API (🟡 → 🔴)**
4. **[Responders](04-responders.md)** 🟡 — `Json`, status, custom responders, and returning `Result`.
5. **[Managed State & Fairings](05-state-and-fairings.md)** 🔴 — `State<T>`, `.manage(...)`, and fairings as middleware.
6. **[A REST API with Error Catchers](06-rest-api-and-catchers.md)** 🔴 — full CRUD plus `#[catch(404)]` error catchers.

**Part 3 — Ship it (🟡 → 🟢)**
7. **[Testing & Configuration](07-testing-and-config.md)** 🟡 — the local test client and `Rocket.toml`.
8. **[Where to Go Next](08-where-to-go-next.md)** 🟢 — Rocket vs axum/actix, data layers, and what to build.

> The throughline: an **attribute is the route**, the **function signature is the request** (params +
> guards), the **return type is the response**, and macros wire it together. Concise Rust web code, with
> the magic now explained.

---

[Phase 1: What Rocket Is & Your First Server →](01-what-rocket-is.md)
