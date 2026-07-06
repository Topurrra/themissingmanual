---
title: "Shared State with web::Data"
guide: "actix-web-from-zero"
phase: 4
summary: "How handlers share a database pool or in-memory store via web::Data — and the per-worker closure trap that hands each worker its own copy unless you build state once and clone it in."
tags: [actix-web, rust, state, web-data, shared-data]
difficulty: intermediate
synonyms: ["actix web::data", "actix shared state", "actix app_data", "actix state across workers", "actix data arc", "actix database pool"]
updated: 2026-06-23
---

# Shared State with web::Data

So far our articles API has been stateless — each handler builds its response from the request and nothing
else. Real services need *shared* things: a database connection pool, a cache, a config struct, a counter.
The question that trips everyone up isn't "how do I store it" but "how do I make sure every request, on
every worker thread, sees the *same* thing." That's this phase.

## The mental model

In actix-web, a shared dependency lives in **`web::Data<T>`**. You register it on the `App` with
`.app_data(...)`, and any handler that wants it lists `web::Data<T>` as an argument — extraction is **by
type**. The framework looks up the registered value whose type matches and hands it over.

> 💡 `web::Data<T>` is an **`Arc<T>`** under the hood. An `Arc` is a thread-safe, reference-counted pointer:
> cloning it doesn't copy the `T`, it just bumps a counter and hands back another pointer to the *same* `T`.
> We lean on that property hard below.

The subtlety to hold from the start: **`HttpServer` doesn't run one copy of your `App` — it runs one per
worker thread.** The closure you pass to `HttpServer::new` runs *once per worker*. Where you create your
state relative to that closure decides whether your workers share one brain or each get a private one.

## ⚠️ The per-worker closure trap

This is the single most common actix-web state bug, so let's name it precisely. As flagged in
[Phase 1](01-what-actix-web-is.md), the closure passed to `HttpServer::new(...)` is the **app factory**, and
actix-web calls it once on *each* worker thread to build that worker's own `App`. So this looks fine and is
quietly broken:

```rust
// ⚠️ BROKEN: state is built INSIDE the closure
HttpServer::new(|| {
    let state = web::Data::new(AppState {
        articles: Mutex::new(HashMap::<u32, Article>::new()),
    });
    App::new()
        .app_data(state)
        .route("/articles", web::get().to(list))
})
```

*What just happened:* because `web::Data::new(...)` sits *inside* the factory closure, every worker runs it
and gets a **separate, fresh** `HashMap`. Write an article on the thread serving worker A, then read on
worker B, and it's gone. With four workers you effectively have four independent databases, and which one
you hit depends on which thread the OS scheduled your request onto. It'll even look like it works in tests
with a single worker.

The fix is to build the `web::Data` **once, outside** the closure, then `move` it in and `.clone()` it into
each `App`. Cloning a `web::Data` clones the inner `Arc` — so all workers point at the *same* state:

```rust
use actix_web::{web, App, HttpServer, Responder, HttpResponse};
use std::collections::HashMap;
use std::sync::Mutex;

struct AppState {
    articles: Mutex<HashMap<u32, Article>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // built ONCE, before any worker exists
    let state = web::Data::new(AppState {
        articles: Mutex::new(HashMap::<u32, Article>::new()),
    });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())            // share the SAME state across workers
            .route("/articles", web::get().to(list))
            .route("/articles", web::post().to(create))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

*What just happened:* `state` is created before `HttpServer::new`, so there's exactly one `Arc<AppState>`.
The closure is now `move`, capturing `state` by value; on each worker it calls `state.clone()`, and an `Arc`
clone is just another handle to that one `AppState`. Four workers, one `HashMap`. The `move` keyword is
load-bearing — without it the closure can't capture an owned value to clone from.

## Reading and writing the state

To get at the state, list `web::Data<AppState>` as a handler argument and actix-web extracts it by type:

```rust
async fn list(state: web::Data<AppState>) -> impl Responder {
    let map = state.articles.lock().unwrap();
    let articles: Vec<&Article> = map.values().collect();
    HttpResponse::Ok().json(articles)
}

async fn create(
    state: web::Data<AppState>,
    body: web::Json<Article>,
) -> impl Responder {
    let mut map = state.articles.lock().unwrap();
    let article = body.into_inner();
    map.insert(article.id, article);
    HttpResponse::Created().finish()
}
```

*What just happened:* `list` locks the `Mutex`, borrows the map read-only, and serializes the values to JSON.
`create` locks it `mut` and inserts. The `web::Json<Article>` extractor pulling the request body is
extraction-by-type again, sitting right next to the state extractor. Both handlers reach through the *same*
`Arc` to the *same* map — exactly what the previous section bought us.

> ⚠️ Why the `Mutex`? `web::Data<T>` is an `Arc<T>`, and an `Arc` only ever gives you a **shared** (`&T`)
> reference — never `&mut T`. `T` itself has to allow mutation through a shared reference, which is what
> **interior mutability** types like `Mutex<...>` (or `RwLock<...>` when reads vastly outnumber writes)
> provide. Forget the `Mutex` and the compiler won't let you write to the map.

### For a real database, you don't need the Mutex

The in-memory `HashMap` is a teaching prop. In a real service your shared state is usually a connection pool
— and a pool like `sqlx::Pool` is **already** internally synchronized and cheaply cloneable (`Arc`-backed
itself). Wrap it in `web::Data` and use it directly, no `Mutex` in sight:

```rust
struct AppState {
    db: sqlx::PgPool,   // already cloneable + thread-safe; no Mutex needed
}

async fn list(state: web::Data<AppState>) -> impl Responder {
    let rows = sqlx::query_as::<_, Article>("SELECT id, title FROM articles")
        .fetch_all(&state.db)
        .await
        .unwrap();
    HttpResponse::Ok().json(rows)
}
```

*What just happened:* the pool manages its own concurrency, so handlers borrow `&state.db` and run queries
concurrently without any explicit locking. The pool hands out connections, waits when they're all busy, and
returns them after — all thread-safe by design. You still build the pool **once, outside** the closure and
clone the `web::Data` in, exactly as before; the per-worker trap is identical whether your state is a
`HashMap` or a `PgPool`.

## ⚠️ "App data is not configured"

One more sharp edge: if a handler extracts `web::Data<T>` for a type you never registered with
`.app_data(...)`, there's nothing to look up, and actix-web **panics at runtime** with a message like:

```
App data is not configured, to configure use App::app_data()
```

*What just happened:* extraction-by-type means the framework matches your handler's `web::Data<AppState>`
against the registered data by *type*. Register a `web::Data<AppState>` but ask for `web::Data<PgPool>` (or
forget `.app_data` entirely) and the lookup fails. This isn't a compile error — the types are individually
valid — so it surfaces as a 500 and a panic in the logs on the first request that hits that handler. The fix
is almost always "register the exact type the handler asks for."

## Recap

- Shared dependencies live in **`web::Data<T>`**, registered with `.app_data(...)` and extracted by **type**
  as a handler argument.
- `web::Data<T>` is an **`Arc<T>`**; cloning it shares one underlying value rather than copying it.
- ⚠️ The closure passed to `HttpServer::new` runs **once per worker**. Build state **outside** it, then
  `move` + `.clone()` inside, or each worker gets a private copy.
- Because `Data` is an `Arc` (shared `&T` only), mutable in-memory state needs **interior mutability** —
  a `Mutex<...>` or `RwLock<...>` field. A real `sqlx::Pool` is already shareable, so no `Mutex` needed.
- ⚠️ Extracting a `web::Data<T>` you never registered panics at runtime with **"App data is not configured"** —
  register the exact type the handler asks for.

## Quick check

```quiz
[
  {
    "q": "Why must web::Data be created outside the HttpServer::new closure?",
    "choices": [
      "The closure won't compile if Data is created inside it",
      "The closure runs once per worker thread, so state built inside gives each worker a separate copy",
      "web::Data can only be created in an async context",
      "It's a style preference with no functional effect"
    ],
    "answer": 1,
    "explain": "HttpServer::new calls its closure once per worker. Building state inside means every worker gets its own copy; build it once outside and clone the Arc in so all workers share one value."
  },
  {
    "q": "Your AppState holds an in-memory HashMap you need to write to. What does the field need?",
    "choices": [
      "Nothing — web::Data already allows mutation",
      "An interior-mutability wrapper like Mutex<...> or RwLock<...>",
      "The #[mut] attribute on the field",
      "A second web::Data registration"
    ],
    "answer": 1,
    "explain": "web::Data<T> is an Arc<T>, which only hands out shared &T references. To mutate through a shared reference you need interior mutability — a Mutex or RwLock field."
  },
  {
    "q": "A handler extracts web::Data<PgPool> but you only registered web::Data<AppState>. What happens?",
    "choices": [
      "A compile error pointing at the mismatch",
      "The handler receives a default-constructed PgPool",
      "A runtime panic: 'App data is not configured'",
      "The request silently returns 404"
    ],
    "answer": 2,
    "explain": "Extraction is by type. With no matching registered type, actix-web panics at runtime ('App data is not configured') on the first request — it's not caught at compile time."
  }
]
```

[← Phase 3: Responders](03-responders.md) · [Guide overview](_guide.md) · [Phase 5: Middleware →](05-middleware.md)
