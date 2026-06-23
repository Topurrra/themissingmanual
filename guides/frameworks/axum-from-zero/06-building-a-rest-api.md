---
title: "Building a REST API"
guide: "axum-from-zero"
phase: 6
summary: "Wire the books API into full CRUD — five async handlers over one shared store, each composing State, Path, and Json, returning status codes and JSON through IntoResponse."
tags: [axum, rust, rest, api, crud]
difficulty: intermediate
synonyms: ["axum rest api", "axum crud", "axum books api", "axum state handlers", "rust axum crud example", "axum json crud"]
updated: 2026-06-23
---

# Building a REST API

This is the phase where the pieces click together. You've met every part already:
the `Router` and routing (Phase 2), `Path`/`Query` extractors (Phase 2),
`Json` in and out and `IntoResponse` (Phase 3), and the shared `AppState` store
(Phase 4). A REST API is nothing more than those four things, assembled.

So before any code, hold this picture in your head.

> 📝 **Mental model:** a REST *resource* — here, books — is **five handlers over
> one shared store**. Each handler is an `async fn` whose arguments are extractors
> (`State` for the store, `Path` for an id, `Json` for a request body) and whose
> return value implements `IntoResponse` (a status code, some JSON, or both). The
> five map onto HTTP verbs: **list** (GET all), **show** (GET one), **create**
> (POST), **update** (PUT), **delete** (DELETE). That's the same shape you'd write
> in Gin, Express, or Spring — axum just expresses it through Rust's type system
> instead of decorators or annotations.

If you've built a CRUD endpoint in any language, you already know the *job*. The
rest of this phase is watching that job land in idiomatic axum.

## The store, recapped

We keep the in-memory store from Phase 4, and add one thing: a way to mint new
ids. When a client POSTs a new book it doesn't send an id — the server assigns
one. We'll keep a counter inside the same `Mutex` as the map, so a single lock
covers both reading the next id and inserting.

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize)]
struct Book {
    id: u32,
    title: String,
    author: String,
}

// What the client sends to create a book — no id; the server assigns it.
#[derive(Deserialize)]
struct NewBook {
    title: String,
    author: String,
}

// One Mutex guards both the map and the id counter, so each handler
// takes exactly one lock.
struct Store {
    books: HashMap<u32, Book>,
    next_id: u32,
}

#[derive(Clone)]
struct AppState {
    store: Arc<Mutex<Store>>,
}
```

*What just happened:* `Book` derives `Serialize` so it can go out as JSON, and
`NewBook` derives `Deserialize` so it can come in as JSON. `Store` bundles the
map with a `next_id` counter, and `AppState` wraps it in `Arc<Mutex<...>>` for the
same reason as Phase 4: the clone axum makes per request must *share* the store,
not copy it. ⚠️ The `Mutex` lock is held only for the few lines inside each
handler — lock, read or mutate, then let the guard drop. Don't hold a lock across
an `.await`; here we never do, because the work between `lock()` and the end of
scope is synchronous. And notice every read clones a `Book` *out* of the map
(`.clone()`), so we hand JSON an owned value and the lock can release immediately.

## The five handlers

Each handler is small. Read them as variations on one theme: take what you need
via extractors, touch the store under a brief lock, return a status plus (maybe)
JSON.

```rust
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};

// GET /books  → 200 with the full list
async fn list(State(state): State<AppState>) -> Json<Vec<Book>> {
    let store = state.store.lock().unwrap();
    Json(store.books.values().cloned().collect())
}

// GET /books/{id}  → 200 with one book, or 404
async fn show(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> impl IntoResponse {
    let store = state.store.lock().unwrap();
    match store.books.get(&id) {
        Some(book) => (StatusCode::OK, Json(book.clone())).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

// POST /books  → 201 with the created book (now carrying its id)
async fn create(
    State(state): State<AppState>,
    Json(new): Json<NewBook>,
) -> impl IntoResponse {
    let mut store = state.store.lock().unwrap();
    let id = store.next_id;
    store.next_id += 1;
    let book = Book { id, title: new.title, author: new.author };
    store.books.insert(id, book.clone());
    (StatusCode::CREATED, Json(book))
}

// PUT /books/{id}  → 200 with the updated book, or 404
async fn update(
    State(state): State<AppState>,
    Path(id): Path<u32>,
    Json(new): Json<NewBook>,
) -> impl IntoResponse {
    let mut store = state.store.lock().unwrap();
    match store.books.get_mut(&id) {
        Some(book) => {
            book.title = new.title;
            book.author = new.author;
            (StatusCode::OK, Json(book.clone())).into_response()
        }
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

// DELETE /books/{id}  → 204 No Content, or 404
async fn remove(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> impl IntoResponse {
    let mut store = state.store.lock().unwrap();
    match store.books.remove(&id) {
        Some(_) => StatusCode::NO_CONTENT,
        None => StatusCode::NOT_FOUND,
    }
}
```

*What just happened:* every handler followed the same recipe. `list` and `show`
only read, so they lock without `mut`; `create`, `update`, and `remove` mutate, so
they bind the guard `mut`. The body-consuming `Json` extractor always comes
**last** in the argument list (axum allows only one body extractor, and it must be
final) — that's why `create` and `update` put `State`/`Path` first and `Json`
last. The return types are where `IntoResponse` earns its keep: `list` returns a
plain `Json<Vec<Book>>` (which becomes a 200), while the handlers with two outcomes
return `impl IntoResponse` and use `(StatusCode, Json<...>)` tuples — a status code
*and* a body in one value. Where a branch returns only a status (the 404s, the 204)
we call `.into_response()` so both arms of the `match` produce the same concrete
type. `create` builds the `Book` *after* taking the lock so it can read and bump
`next_id` atomically under that one lock.

> ⚠️ Notice how much of this code is the 404 plumbing — every `match` repeats the
> `None => StatusCode::NOT_FOUND` arm, and we sprinkle `.into_response()` to make
> branches line up. It works, but it's noisy. Phase 7 replaces all of it with a
> custom error type and the `?` operator, so a missing book becomes one short line.
> For now, see the pattern plainly; we clean it up next.

## Wiring the router

Five handlers, two routes, one `.with_state`. The collection path (`/books`)
carries GET and POST; the item path (`/books/{id}`) carries GET, PUT, and DELETE.

```rust
use axum::{Router, routing::get};

fn app(state: AppState) -> Router {
    Router::new()
        .route("/books", get(list).post(create))
        .route("/books/{id}", get(show).put(update).delete(remove))
        .with_state(state)
}

#[tokio::main]
async fn main() {
    let state = AppState {
        store: Arc::new(Mutex::new(Store { books: HashMap::new(), next_id: 1 })),
    };
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app(state)).await.unwrap();
}
```

*What just happened:* `get(list).post(create)` chains two method handlers onto the
same path — axum routes by verb, so GET and POST on `/books` reach different
functions. The `{id}` segment is a path parameter that feeds the `Path<u32>`
extractor in `show`, `update`, and `remove`. `.with_state(state)` hands every
handler the shared store; because we pulled the router into its own `app()`
function, Phase 8 can reuse it in tests without spinning up a real server.

## Driving it with curl

Start it (`cargo run`) and exercise each verb. The responses below show what the
handlers above produce.

```bash
# Create two books — note the 201 and the server-assigned id
curl -s -X POST localhost:3000/books \
  -H 'content-type: application/json' \
  -d '{"title":"The Rust Programming Language","author":"Klabnik & Nichols"}'
# {"id":1,"title":"The Rust Programming Language","author":"Klabnik & Nichols"}

curl -s -X POST localhost:3000/books \
  -H 'content-type: application/json' \
  -d '{"title":"Programming Rust","author":"Blandy & Orendorff"}'
# {"id":2,"title":"Programming Rust","author":"Blandy & Orendorff"}

# List them all
curl -s localhost:3000/books
# [{"id":1,...},{"id":2,...}]

# Show one
curl -s localhost:3000/books/1
# {"id":1,"title":"The Rust Programming Language","author":"Klabnik & Nichols"}

# Update it
curl -s -X PUT localhost:3000/books/1 \
  -H 'content-type: application/json' \
  -d '{"title":"The Rust Programming Language, 2nd Ed.","author":"Klabnik & Nichols"}'
# {"id":1,"title":"The Rust Programming Language, 2nd Ed.","author":"Klabnik & Nichols"}

# Delete it — 204, empty body
curl -s -i -X DELETE localhost:3000/books/1 | head -n 1
# HTTP/1.1 204 No Content

# Ask for a book that no longer exists — 404
curl -s -i localhost:3000/books/1 | head -n 1
# HTTP/1.1 404 Not Found
```

*What just happened:* the full lifecycle of a resource. POST returned `201` with
the created body (id and all), the reads came back `200`, DELETE returned a bodyless
`204`, and the follow-up GET on the deleted id returned `404` — exactly the status
codes the handlers chose. The `-i` flag prints the status line so you can see the
codes the JSON body alone wouldn't reveal.

> 💡 The `HashMap` store is a stand-in for a database. When you swap in `sqlx` or
> SeaORM (Phase 9), the handlers keep this exact shape — extractors in, status +
> JSON out — only the body changes: `store.books.get(&id)` becomes a `SELECT`,
> `insert` becomes an `INSERT`. The `State` already holds a `PgPool` instead of an
> `Arc<Mutex<...>>` (recall from Phase 4 that a pool is already `Clone`), so the
> wiring doesn't move. That stability is the payoff of the mental model: once the
> *shape* is right, the storage backend is a detail.

## Recap

- A REST resource is **five `async fn` handlers over one shared `State`**, mapped
  to verbs: list (GET all), show (GET one), create (POST), update (PUT), delete
  (DELETE).
- Handlers compose the extractors you already know — **`State`** for the store,
  **`Path<u32>`** for the id, **`Json<NewBook>`** for the body — with the
  body-consuming `Json` always **last**.
- Return **`(StatusCode, Json<...>)`** to send a status and a body together;
  return a bare `StatusCode` for empty responses; use **`impl IntoResponse`** and
  `.into_response()` when a handler has multiple outcome types.
- The store wraps the map and an **id counter** in one `Mutex`, so a handler takes
  a single brief lock; clone values **out** of the map and never hold a lock across
  an `.await`.
- The repetitive `404` and `.into_response()` plumbing is the verbose part — Phase
  7 collapses it with a custom error type and the `?` operator.
- Keeping the router in its own `app()` function lets Phase 8 test it without a
  live server, and swapping the store for a real database (Phase 9) leaves the
  handler shape untouched.

## Quick check

Lock these in before we tackle error handling.

```quiz
[
  {
    "q": "In the create handler, why does the Json<NewBook> extractor come last in the argument list?",
    "choices": [
      "Alphabetical ordering of extractor types",
      "axum allows only one body-consuming extractor, and it must be the final argument",
      "Json is slower, so it runs last for performance",
      "It's a stylistic preference with no effect"
    ],
    "answer": 1,
    "explain": "Json consumes the request body. axum permits exactly one body extractor and requires it to be the last argument, so non-body extractors like State and Path go first."
  },
  {
    "q": "What does returning (StatusCode::CREATED, Json(book)) from a handler produce?",
    "choices": [
      "A 200 response with no body",
      "A 201 response whose body is the book serialized as JSON",
      "A compile error — you can't return a tuple",
      "A 201 response with the book as a plain-text string"
    ],
    "answer": 1,
    "explain": "A (StatusCode, Json<T>) tuple implements IntoResponse: the status sets the response code and the Json part sets the JSON body. Here that's 201 Created with the new book."
  },
  {
    "q": "When a book id isn't in the store, what does the show handler return, and what makes both match arms type-check?",
    "choices": [
      "It panics; the arms type-check because panics are never values",
      "StatusCode::NOT_FOUND, and calling .into_response() on both arms gives them the same concrete type",
      "An empty Json([]) with status 200",
      "It returns Result::Err, which axum converts automatically"
    ],
    "answer": 1,
    "explain": "The None arm returns StatusCode::NOT_FOUND (404). Because the Some arm returns a tuple and the None arm a bare status, both call .into_response() so the function's two branches share one return type behind impl IntoResponse."
  }
]
```

[← Phase 5: Middleware with Tower](05-middleware-and-tower.md) · [Guide overview](_guide.md) · [Phase 7: Error Handling →](07-error-handling.md)
