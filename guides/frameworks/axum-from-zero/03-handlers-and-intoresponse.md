---
title: "Handlers & IntoResponse"
guide: "axum-from-zero"
phase: 3
summary: "How axum handlers really work: arguments extract from the request, the return value becomes the response. Json in and out, IntoResponse, status codes, and reading the trait-bound error."
tags: [axum, rust, handlers, intoresponse, json]
difficulty: intermediate
synonyms: ["axum intoresponse", "axum json extractor", "axum handler return type", "axum json response", "axum status code response", "axum handler trait"]
updated: 2026-06-23
---

# Handlers & IntoResponse

In Phase 2 you pulled pieces out of the URL with `Path` and `Query`. Now we close the loop. A handler
isn't a special kind of function with a magic signature you have to memorize — it's an ordinary `async fn`
that obeys one rule on each side.

📝 **The mental model:** *the arguments extract FROM the request; the return value becomes the response.*
Every parameter is a type that knows how to read part of the incoming request. The return type is a type
that knows how to turn itself into an outgoing HTTP response. That pairing — extractors in, `IntoResponse`
out — is the entire heart of axum. Once it clicks, you stop guessing at signatures and start *deriving*
them: "I need the JSON body, so I take `Json<T>`; I want to send back a created book with a 201, so I
return `(StatusCode, Json<Book>)`." The framework wires the rest.

We'll keep growing the **books API**. The types from earlier:

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct Book {
    id: u64,
    title: String,
    author: String,
}

#[derive(Deserialize)]
struct NewBook {
    title: String,
    author: String,
}
```

*What just happened:* `Book` derives `Serialize` because it travels *out* (we turn it into JSON for the
response). `NewBook` derives `Deserialize` because it comes *in* (we build it from the request body). The
direction of travel decides the derive — that distinction will matter in every handler below.

## Json as an input

To accept a JSON request body, take `Json<T>` as a parameter, where `T` derives `Deserialize`. axum reads
the body, parses it as JSON, and hands you the deserialized value.

```rust
use axum::Json;

async fn create_book(Json(payload): Json<NewBook>) -> String {
    format!("Got a new book: {} by {}", payload.title, payload.author)
}
```

*What just happened:* `Json(payload): Json<NewBook>` destructures the extractor right in the parameter
list, so inside the function `payload` is a plain `NewBook` — no unwrapping. If the body is missing or
isn't valid JSON for `NewBook`, axum rejects the request with a `400 Bad Request` before your code ever
runs. You write the happy path; the extractor guards the door.

⚠️ **`Json<T>` as an extractor must be the *last* parameter.** Reading the body consumes the request, so
it has to come after extractors like `Path` and `Query` that only peek at the headers and URL. This is the
right order:

```rust
use axum::extract::Path;
use axum::Json;

async fn replace_book(
    Path(id): Path<u64>,
    Json(payload): Json<NewBook>,
) -> String {
    format!("Replacing book {id} with {} by {}", payload.title, payload.author)
}
```

*What just happened:* `Path(id)` comes first (it reads from the URL), `Json(payload)` comes last (it
consumes the body). Put `Json` before `Path` and you get a compile error, because axum only lets the final
argument be a body-consuming extractor. When in doubt: body last.

## Json as an output, and IntoResponse

The same `Json` type works in reverse. Return `Json(value)` where `value`'s type derives `Serialize`, and
axum serializes it and sets `Content-Type: application/json` for you.

```rust
use axum::Json;

async fn get_book() -> Json<Book> {
    let book = Book {
        id: 1,
        title: "The Rust Programming Language".into(),
        author: "Klabnik & Nichols".into(),
    };
    Json(book)
}
```

*What just happened:* the return type is `Json<Book>`. axum sees that, serializes `book` to a JSON body,
and adds the JSON content-type header. You never touched the response object directly — you returned a
*value that knows how to become a response*.

That "knows how to become a response" is a real trait: **`IntoResponse`**. A handler's return type has to
implement it, and many common types already do, so you rarely write one yourself:

- `&str` and `String` — a `200 OK` with a plain-text body.
- `Json<T>` — a JSON body (when `T: Serialize`).
- `StatusCode` — an empty response with just that status (e.g. `StatusCode::NO_CONTENT`).
- `(StatusCode, T)` — set the status *and* a body, where `T` is itself `IntoResponse`.
- `(StatusCode, HeaderMap, T)` — status, custom headers, and a body.
- `Html<_>` — an HTML body with the right content-type.
- `Result<T, E>` — succeed with `T` or fail with `E`, when **both** implement `IntoResponse`.

The tuple forms are the workhorses. Here's the canonical "create" handler that returns a `201 Created`
along with the new book as JSON:

```rust
use axum::http::StatusCode;
use axum::Json;

async fn create_book(Json(payload): Json<NewBook>) -> (StatusCode, Json<Book>) {
    let book = Book {
        id: 42,
        title: payload.title,
        author: payload.author,
    };
    (StatusCode::CREATED, Json(book))
}
```

*What just happened:* the return type `(StatusCode, Json<Book>)` is a tuple, and axum implements
`IntoResponse` for it: the first element becomes the status line (`201 Created`), the second becomes the
body (JSON). `StatusCode` lives in `axum::http::StatusCode`. This single pattern — `Json` in, status +
`Json` out — covers most write endpoints you'll ever build.

## When a handler can fail: returning a Result

Real handlers fail. A lookup misses, the input is valid JSON but semantically wrong. Because `Result<T, E>`
implements `IntoResponse` (as long as both `T` and `E` do), you can return one straight from a handler:

```rust
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Json;

async fn find_book(Path(id): Path<u64>) -> Result<Json<Book>, StatusCode> {
    if id == 1 {
        Ok(Json(Book {
            id: 1,
            title: "The Rust Programming Language".into(),
            author: "Klabnik & Nichols".into(),
        }))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}
```

*What just happened:* the success arm returns `Ok(Json(book))` → a `200` with a JSON body; the failure arm
returns `Err(StatusCode::NOT_FOUND)` → a bare `404`. axum unwraps the `Result` and turns whichever side
you returned into the response. This is the seed of real error handling — in **Phase 7** you'll replace
`StatusCode` with your own error *type* that implements `IntoResponse`, so `?` inside a handler maps your
domain errors to clean HTTP responses. For now, the takeaway is just: a fallible handler returns a
`Result`, and both arms have to be response-able.

## What actually makes something a handler

📝 You may have noticed you never *registered* your functions as handlers or implemented any interface.
That's because axum implements its `Handler` trait *automatically* for any `async fn` whose arguments all
implement the extractor traits (`FromRequest` / `FromRequestParts`) and whose return type implements
`IntoResponse`. You don't think about `Handler` directly — you just satisfy the two conditions on each end,
and the function *is* a handler. That's the whole trick: the type system, not a macro, decides what
`.route()` will accept.

⚠️ **The error you'll eventually hit.** When an argument or the return type *doesn't* satisfy those traits,
the compiler doesn't point at your function. It points at the `.route(...)` call and emits a long, scary
message like:

```text
the trait bound `fn(...) -> ...: Handler<_, _>` is not satisfied
   the following other types implement trait `Handler<T, S>` ...
   required by a bound introduced by this call
```

The first time you see it, it looks like axum is broken. It isn't. It's saying: *"this function doesn't
qualify as a handler."* Resist the urge to debug the router — the real fix is almost always in the function
signature. Run down this checklist:

1. **Is every argument an extractor?** A stray `&str` or a custom struct that isn't an extractor will break
   it.
2. **Does the return type implement `IntoResponse`?** Returning, say, a bare `Book` (when it isn't an
   extractor/response) won't compile — wrap it in `Json`.
3. **Is the body-consuming extractor (`Json<T>`, `String`, `Bytes`) the *last* argument?**
4. **Is the function `async`?**

Nine times out of ten, fixing the arguments or the return type makes the `.route()` error vanish. Read the
signature, not the router.

## Recap

- A handler is just an `async fn`: **arguments extract from the request, the return value becomes the
  response.** Memorize that, not signatures.
- `Json<T>` is bidirectional — an extractor for the request body (`T: Deserialize`, must be the **last**
  parameter) and a response for the body (`T: Serialize`).
- The return type must implement **`IntoResponse`**. `&str`/`String`, `Json<T>`, `StatusCode`, tuples like
  `(StatusCode, Json<T>)`, `Html<_>`, and `Result<T, E>` all do.
- The everyday create pattern is `(StatusCode::CREATED, Json(book))`; `StatusCode` lives in
  `axum::http::StatusCode`.
- A fallible handler returns `Result<T, E>` where both sides are `IntoResponse` — the on-ramp to Phase 7's
  custom error type.
- A "trait bound ... `Handler` is not satisfied" error on `.route(...)` means the *function signature* is
  wrong (a non-extractor arg, a non-response return, or `Json` not last) — fix the handler, not the router.

## Quick check

```quiz
[
  {
    "q": "Why must a Json<T> extractor be the last parameter in a handler?",
    "choices": ["Rust requires generic parameters to come last", "It consumes the request body, so it must come after extractors that only read the URL and headers", "axum reads parameters right-to-left", "Json is alphabetically last among extractors"],
    "answer": 1,
    "explain": "Reading the body consumes the request, so body-consuming extractors must come after non-consuming ones like Path and Query."
  },
  {
    "q": "Which return type gives a 201 with the new book serialized as JSON?",
    "choices": ["Book", "(StatusCode, Json<Book>) returning (StatusCode::CREATED, Json(book))", "Json<StatusCode>", "String"],
    "answer": 1,
    "explain": "axum implements IntoResponse for (StatusCode, T) tuples: the StatusCode sets the status and the Json<Book> becomes the body."
  },
  {
    "q": "You get \"the trait bound ...: Handler<_, _> is not satisfied\" on a .route() call. Where is the real problem?",
    "choices": ["The router configuration", "The handler's argument or return types don't satisfy the extractor / IntoResponse traits", "A missing dependency in Cargo.toml", "The Tokio runtime isn't started"],
    "answer": 1,
    "explain": "That error means the function doesn't qualify as a handler. Check the signature: every arg an extractor, the return IntoResponse, and the body extractor last."
  }
]
```

[← Phase 2: Routing & Extractors](02-routing-and-extractors.md) · [Guide overview](_guide.md) · [Phase 4: Shared State →](04-shared-state.md)
