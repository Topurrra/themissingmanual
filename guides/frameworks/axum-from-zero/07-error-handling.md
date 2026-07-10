---
title: "Error Handling"
guide: "axum-from-zero"
phase: 7
summary: "A custom AppError type that implements IntoResponse turns errors into return values: handlers return Result, the ? operator propagates and converts them, and From impls fold foreign errors into one JSON shape."
tags: [axum, rust, errors, intoresponse, result]
difficulty: advanced
synonyms: ["axum error handling", "axum custom error intoresponse", "axum result handler", "axum ? operator", "axum apperror enum", "rust web error type"]
updated: 2026-07-10
---

# Error Handling

By Phase 6 the books API works, but the handlers smell. Every one that can fail
spells out its own failure inline: look up a book, and if it's missing, `return
StatusCode::NOT_FOUND`; parse something bad, and build a `(StatusCode::BAD_REQUEST,
"...")` tuple by hand. The happy path and sad path tangle together, and every
handler invents its own error shape.

Here's the thing other frameworks make hard and axum makes beautiful: in axum,
**an error is a return value, not an exception.** There's no `throw`, no
exception unwinding the stack, no global error handler you register and hope
fires. You make *one* type that knows how to turn itself into an HTTP response,
and your handlers just hand that type back. The language does the rest.

> 📝 **Mental model:** a handler returning `Result<T, E>` is a valid axum
> handler **as long as both `T` and `E` implement `IntoResponse`.** You already
> know `IntoResponse` from Phase 3. So define your own `AppError`, implement
> `IntoResponse` for it *once*, and every handler can return `Result<_,
> AppError>`. The `?` operator propagates failures for you, and axum renders
> whatever comes back — success *or* error — through the same machinery.

## One error type, one response shape

Start by naming the ways your API can fail. For the books service that's a small
set: the book doesn't exist, the client sent something invalid, or something
broke on our end. That's an enum.

```rust
use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};

enum AppError {
    NotFound,
    BadRequest(String),
    Internal,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, msg) = match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "not found".to_string()),
            AppError::BadRequest(m) => (StatusCode::BAD_REQUEST, m),
            AppError::Internal => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal error".to_string())
            }
        };
        (status, Json(serde_json::json!({ "error": msg }))).into_response()
    }
}
```

*What just happened:* `AppError` enumerates the failure modes, with
`BadRequest(String)` carrying a message so callers know *what* was wrong. The
`impl IntoResponse` is the whole trick — the single place that decides how an
error becomes HTTP. We `match` the variant into a `(status, message)` pair, then
build the response from a tuple: `(StatusCode, Json<...>)` already implements
`IntoResponse` (Phase 3), so wrapping the message in `serde_json::json!` gives
every error the same JSON envelope — `{"error": "..."}`. Change that shape here,
once, and every endpoint's errors change with it.

## Rewriting the handlers with `?`

Now the payoff. Compare the Phase 6 style — manual `StatusCode` returns — with
what `AppError` lets you write. Here's a `show` handler, before:

```rust
// Phase 6 style: failure handling tangled into the handler.
async fn show(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<Book>, StatusCode> {
    let books = state.books.lock().unwrap();
    match books.get(&id) {
        Some(book) => Ok(Json(book.clone())),
        None => Err(StatusCode::NOT_FOUND),
    }
}
```

And after, with `AppError` and `?`:

```rust
use axum::extract::{Path, State};

async fn show(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<Book>, AppError> {
    let books = state.books.lock().unwrap();
    let book = books.get(&id).cloned().ok_or(AppError::NotFound)?;
    Ok(Json(book))
}
```

*What just happened:* the `match` collapsed into one line. `books.get(&id)`
returns an `Option<&Book>`; `.cloned()` turns it into `Option<Book>`; and
`.ok_or(AppError::NotFound)` converts that into a `Result<Book, AppError>` —
`Some` becomes `Ok`, `None` becomes `Err(AppError::NotFound)`. `?` then says "if
this is an `Err`, return it right now; otherwise unwrap the `Ok`." Because
`AppError: IntoResponse`, that `Err` is a complete, valid response — axum
renders it as our `404` JSON. The handler now reads as the happy path with
failure points marked by `?`.

Validation gets the same treatment. Suppose creating a book requires a non-empty
title:

```rust
async fn create(
    State(state): State<AppState>,
    Json(book): Json<Book>,
) -> Result<StatusCode, AppError> {
    if book.title.trim().is_empty() {
        return Err(AppError::BadRequest("title must not be empty".into()));
    }
    state.books.lock().unwrap().insert(book.id, book);
    Ok(StatusCode::CREATED)
}
```

*What just happened:* a plain `return Err(...)` short-circuits with a `400` and
our message; the success path returns `201 Created`. Both arms are values of the
same `Result<StatusCode, AppError>`, both implement `IntoResponse`, so axum
handles either without you wiring up anything extra. The error *is* the return
value.

## Folding foreign errors in with `From`

The `?` operator has a second superpower you haven't used yet: it doesn't just
propagate an error, it *converts* it. When you write `something?` and the error
type doesn't match your function's error type, Rust looks for a `From` impl to
bridge them. That's how you let `?` swallow errors from libraries — a database
driver, a JSON parser — that know nothing about your `AppError`.

Say a future version of the books API talks to a real database via `sqlx`. Its
calls return `Result<_, sqlx::Error>`. Teach `AppError` how to absorb that:

```rust
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => AppError::NotFound,
            other => {
                tracing::error!("db error: {other}");
                AppError::Internal
            }
        }
    }
}
```

*What just happened:* this `From<sqlx::Error>` impl maps a missing row to our
`NotFound` and treats every other database failure as `Internal` — logging the
real cause with `tracing` while sending the client only a generic `500`. Now a
handler can use `?` directly on a `sqlx` call:

```rust
async fn show_db(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<Book>, AppError> {
    let book = sqlx::query_as::<_, Book>("SELECT * FROM books WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?; // sqlx::Error -> AppError, automatically
    Ok(Json(book))
}
```

*What just happened:* `fetch_one` yields `Result<Book, sqlx::Error>`, but the
function returns `Result<_, AppError>`. The `?` sees the mismatch, finds your
`From<sqlx::Error> for AppError`, and converts on the way out — a `RowNotFound`
becomes a clean `404`, anything else a logged `500`. One `?` does propagation
*and* conversion *and* the correct status code, with zero boilerplate in the
handler.

> 💡 Writing `impl IntoResponse` and a pile of `From` impls by hand gets old. The
> **`thiserror`** crate generates them from a derive: annotate each variant with a
> `#[from]` and a display message and it writes the `From`/`Display` impls for
> you, leaving just the `IntoResponse`. For quick app code that doesn't need a
> typed enum, **`anyhow`** gives you one catch-all error type (`anyhow::Error`)
> and an ergonomic `?` everywhere. Reach for `thiserror` when callers need to
> distinguish variants; reach for `anyhow` when they don't.

## Let the framework handle what it already handles

One trap worth naming: don't reinvent error handling axum already does for you.

⚠️ axum's built-in extractors reject bad input *before your handler runs*, with
sensible defaults. Send a malformed JSON body to a handler taking `Json<Book>`
and you get a `400 Bad Request` with a useful message, unwritten by you. Same
for a missing path segment, a bad `Query`, an oversized body. You *can*
customize these rejections, but the defaults are good — only override them when
you genuinely need a different shape.

⚠️ And the cardinal rule: **don't panic in a handler — return an error.** A
`.unwrap()` on a failing `Result`, an out-of-bounds index, an `expect()` that
fires — these unwind the task instead of producing a tidy response. axum
catches it and returns a bare `500`, but you've lost the chance to log context,
choose a status, or shape the body. Every fallible step should be a `?` into
your `AppError`, not a panic. (The one `.unwrap()` surviving in this guide is
`state.books.lock().unwrap()` — a poisoned `Mutex` means another thread already
panicked holding it, so the process is arguably doomed anyway.)

> 💡 The shape to keep in your head: **extractor rejections** guard the door
> (bad input never reaches you), **`?` with `AppError`** handles everything your
> logic can hit, and **panics are bugs**, not a control-flow tool. Get those
> three straight and your error handling is both correct and almost invisible.

## Recap

- In axum an **error is a return value, not an exception**: a handler returning
  `Result<T, E>` is valid whenever **both `T` and `E` implement `IntoResponse`**.
- Define **one `AppError` enum** and implement **`IntoResponse` for it once** so
  every endpoint shares a single JSON error shape — change it in one place.
- Handlers return `Result<_, AppError>` and use **`?`** with helpers like
  **`.ok_or(AppError::NotFound)`**, collapsing tangled `match`es into the happy
  path with marked failure points.
- The **`?` operator also converts**: an **`impl From<E> for AppError`** lets `?`
  fold foreign errors (e.g. `sqlx::Error`) into your type — mapping to the right
  status and logging the real cause while hiding internals.
- Use **`thiserror`** to derive the `From`/`Display` boilerplate, or **`anyhow`**
  for a catch-all app error when callers don't need to distinguish variants.
- Lean on axum's **built-in extractor rejections** for bad input, and **never
  panic in a handler** — return an error so you control the status, body, and
  logs.

## Quick check

Lock in the error model before moving on to testing and production.

```quiz
[
  {
    "q": "What makes a handler returning Result<Json<Book>, AppError> a valid axum handler?",
    "choices": [
      "AppError is registered in a global error handler",
      "Both Json<Book> and AppError implement IntoResponse",
      "The handler is wrapped in a try/catch layer",
      "AppError derives Clone"
    ],
    "answer": 1,
    "explain": "axum accepts any Result handler as long as both the Ok type and the Err type implement IntoResponse — then it renders whichever one is returned."
  },
  {
    "q": "Why does `let b = books.get(&id).cloned().ok_or(AppError::NotFound)?;` work?",
    "choices": [
      "ok_or turns the Option into a Result, and ? returns the Err (an IntoResponse) or unwraps the Ok",
      "? catches a panic raised by get()",
      "ok_or logs the error and returns 200 anyway",
      "It only compiles if AppError implements Clone"
    ],
    "answer": 0,
    "explain": "ok_or maps None to Err(AppError::NotFound); ? then early-returns that Err (which is an IntoResponse, so a complete response) or unwraps the Some."
  },
  {
    "q": "How does `?` let a handler call a sqlx function that returns sqlx::Error and still return AppError?",
    "choices": [
      "sqlx::Error and AppError are the same type",
      "? silently discards the sqlx error and returns Internal",
      "An impl From<sqlx::Error> for AppError lets ? convert the error as it propagates",
      "axum auto-converts any error into AppError"
    ],
    "answer": 2,
    "explain": "When the error types differ, ? looks for a From impl. Implementing From<sqlx::Error> for AppError makes ? convert and propagate in one step."
  }
]
```

[← Phase 6: Building a REST API](06-building-a-rest-api.md) · [Guide overview](_guide.md) · [Phase 8: Testing & Production →](08-testing-and-production.md)
