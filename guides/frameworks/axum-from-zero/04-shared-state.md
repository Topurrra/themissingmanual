---
title: "Shared State"
guide: "axum-from-zero"
phase: 4
summary: "How axum hands shared dependencies — a store, a config, a database pool — to stateless handlers via State<T> and with_state, why the state type must be Clone, and why mutable data lives behind Arc<Mutex>."
tags: [axum, rust, state, shared-data, arc]
difficulty: intermediate
synonyms: ["axum state", "axum with_state", "axum State extractor", "axum shared data", "axum app state arc", "axum database pool"]
updated: 2026-06-23
---

# Shared State

So far every handler you've written has been a closed little world. It takes a
request apart with extractors, builds a response, and forgets everything. That's
fine for an echo endpoint, but a real books API needs to *remember things*: the
books themselves, a database connection, maybe a config loaded at boot. Where
does that live?

The instinct from other languages is a global — a static variable, a singleton,
a module-level dict the handlers all reach into. In Rust that fights you hard:
globals have to be `'static`, thread-safe, and usually `unsafe` or wrapped in a
macro to even compile. axum's answer is cleaner and it's the whole point of this
phase.

> 📝 **Mental model:** handlers stay **stateless**. Anything shared lives in a
> **state value** that you hand to the router with **`.with_state(state)`**.
> Each handler that needs it asks for it back through the **`State` extractor** —
> the same "argument extracts from the request" idea you already know, except
> this argument extracts from the *application*, not the HTTP request. No
> globals, no `unsafe`, fully type-checked.

## Defining and attaching state

State is just a type you define. Wire it up in three moves: declare the type,
attach an instance with `.with_state(...)`, and pull it into handlers with the
`State` extractor.

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use axum::{Json, Router, extract::State, routing::get};

#[derive(Clone)]
struct AppState {
    books: Arc<Mutex<HashMap<u32, Book>>>,
}

async fn list(State(state): State<AppState>) -> Json<Vec<Book>> {
    let books = state.books.lock().unwrap();
    Json(books.values().cloned().collect())
}

let state = AppState { books: Arc::new(Mutex::new(HashMap::new())) };
let app = Router::new().route("/books", get(list)).with_state(state);
```

*What just happened:* `AppState` is a plain struct holding our in-memory book
store. We built one instance, handed it to the router with `.with_state(state)`,
and the `list` handler asked for it back by taking `State(state): State<AppState>`
as an argument. Inside, `state.books.lock()` gives temporary exclusive access to
the `HashMap`, and we clone the values into a `Vec` to return as JSON. Notice the
handler never touched a global — the state came in the front door like any other
extractor.

The `State(state)` in the argument list is a destructuring pattern: `State` is a
wrapper tuple struct, and `State(state)` unwraps it so `state` is your bare
`AppState`. You'll see the same shape for `Path(id)` and `Json(payload)` — it's a
consistent axum idiom, not special syntax for state.

Writing works the same way. Here's the insert side of the books API:

```rust
use axum::http::StatusCode;

async fn create(
    State(state): State<AppState>,
    Json(book): Json<Book>,
) -> StatusCode {
    let mut books = state.books.lock().unwrap();
    books.insert(book.id, book);
    StatusCode::CREATED
}

let app = Router::new()
    .route("/books", get(list).post(create))
    .with_state(state);
```

*What just happened:* `create` takes **two** extractors. Order matters here:
`State` (and any other non-body extractor) comes first, and the body-consuming
`Json` comes **last** — axum only lets one extractor consume the request body,
and it has to be the final argument. We `lock()` the store, this time binding it
`mut` so we can `insert`, and return `201 Created`. Both handlers share the *same*
store because they share the same state.

## Why `Arc<Mutex<...>>` and not just a `HashMap`

Here's the insight that trips everyone up the first time. Why isn't `AppState`
this?

```rust
#[derive(Clone)]
struct AppState {
    books: HashMap<u32, Book>, // looks simpler — but it's a trap
}
```

⚠️ The state type **must be `Clone`**, because axum clones it once per request
before handing it to your handler. If `books` were a bare `HashMap`, each request
would get its own *copy* of the map. Insert a book in one request, and the next
request — working off a fresh clone of the original — wouldn't see it. You'd have
a store that silently forgets everything. It compiles; it just doesn't work.

`Arc<Mutex<HashMap<...>>>` fixes this by separating the two things `Clone` could
mean:

- **`Arc`** (atomically reference-counted pointer) makes cloning *cheap and
  shared*. Cloning an `Arc` doesn't copy the `HashMap` — it bumps a reference
  count and hands back another pointer to the **same** map. Every request's clone
  of `AppState` points at one underlying store.
- **`Mutex`** makes that shared access *safe*. Many requests run concurrently on
  different threads; without a lock, two of them writing to the same `HashMap` at
  once is a data race. `.lock()` grants one-at-a-time access and blocks the rest
  until the guard is dropped.

```rust
// Cloning AppState clones the Arc, NOT the HashMap behind it.
let a = state.clone();
let b = state.clone();
// a.books and b.books are two Arc handles to ONE shared Mutex<HashMap<...>>.
```

*What just happened:* every clone is just another pointer to the same data. That
is exactly what you want — shared, not copied. Read it for write access with
`RwLock` instead of `Mutex` (`Arc<RwLock<...>>`) when reads vastly outnumber
writes, since `RwLock` lets many readers in at once.

> 💡 You won't usually do this dance for a real database. A `sqlx::PgPool` is
> *already* `Clone` and internally an `Arc`, so you store it **directly** — no
> `Mutex` needed: `struct AppState { db: PgPool }`. The pool manages its own
> connections and concurrency. The `Arc<Mutex<...>>` pattern is for plain
> in-memory data you own, like our `HashMap` toy store.

## `State` vs `Extension`

There's an older way to share data: `Extension`. You attach a value as a layer
with `.layer(Extension(value))` and pull it out with the `Extension` extractor.

```rust
// The older Extension approach — works, but prefer State.
let app = Router::new()
    .route("/books", get(list_ext))
    .layer(Extension(state));

async fn list_ext(Extension(state): Extension<AppState>) -> Json<Vec<Book>> {
    let books = state.books.lock().unwrap();
    Json(books.values().cloned().collect())
}
```

*What just happened:* functionally this does the same job. The crucial
difference is **when mistakes are caught**. With `State`, the router won't
compile unless its state type matches what every handler asks for — wire up the
wrong type and the build fails at your desk. `Extension` is looked up by type at
**runtime**: forget to add the layer, or ask for the wrong type, and the request
panics with `500` only when that endpoint is actually hit.

> 💡 Prefer **`State`**. It's type-checked at compile time, reads cleaner, and is
> the modern axum default. Reach for `Extension` only when you genuinely can't
> know the state type at the router's construction site — for instance, when
> middleware injects per-request values further down the stack. For app-wide
> dependencies like our store or a DB pool, `State` is the right tool.

## Recap

- Handlers are **stateless**; shared dependencies live in a **state value**
  attached to the router with **`.with_state(state)`** and extracted via
  **`State<T>`**.
- The state type **must be `Clone`** — axum clones it per request. Mutable data
  must sit behind a shared pointer, or each request mutates a throwaway copy.
- **`Arc`** makes the clone *share* rather than *copy*; **`Mutex`** (or
  `RwLock`) makes that shared access thread-safe.
- A real `sqlx::PgPool` is already `Clone`/`Arc`, so you store it directly — no
  `Mutex` wrapper.
- Body-consuming extractors like `Json` go **last** in a handler's argument list;
  `State` and other non-body extractors come first.
- Prefer **`State`** (compile-time checked) over **`Extension`** (runtime
  lookup that panics if missing).

## Quick check

Lock these in before moving on to middleware.

```quiz
[
  {
    "q": "Why must your AppState type derive Clone?",
    "choices": [
      "So you can compare two states for equality",
      "Because axum clones the state once per request before handing it to the handler",
      "So Rust can store it in a global static",
      "It doesn't have to — Clone is optional on state"
    ],
    "answer": 1,
    "explain": "axum clones the state value for each request. That's why mutable data must be behind an Arc so the clone shares one store instead of copying it."
  },
  {
    "q": "What does cloning an Arc<Mutex<HashMap<...>>> actually copy?",
    "choices": [
      "The whole HashMap, deeply",
      "Nothing — it just bumps a reference count and returns another pointer to the same data",
      "Only the Mutex, but not the map inside it",
      "A snapshot of the map at clone time"
    ],
    "answer": 1,
    "explain": "Arg::clone increments a reference count and returns another handle to the same underlying Mutex<HashMap>. All clones see one shared store — exactly what shared state needs."
  },
  {
    "q": "Why prefer State over Extension for app-wide dependencies?",
    "choices": [
      "Extension is faster at runtime",
      "State is checked at compile time, while a missing or mistyped Extension panics at runtime when the endpoint is hit",
      "Extension can't hold a database pool",
      "State allows globals and Extension does not"
    ],
    "answer": 1,
    "explain": "State ties the router's state type to what handlers request, so mismatches fail to compile. Extension is resolved by type at runtime and panics with a 500 only when that route runs."
  }
]
```

[← Phase 3: Handlers & IntoResponse](03-handlers-and-intoresponse.md) · [Guide overview](_guide.md) · [Phase 5: Middleware with Tower →](05-middleware-and-tower.md)
