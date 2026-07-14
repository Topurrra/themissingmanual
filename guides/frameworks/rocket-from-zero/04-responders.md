---
title: "Responders"
guide: "rocket-from-zero"
phase: 4
summary: "Your handler's return type IS the HTTP response. Learn Rocket's built-in responders - Json, Option for free 404s, Result, (Status, T) - and how to build your own."
tags: [rocket, rust, responder, json, status]
difficulty: intermediate
synonyms: ["rocket responder", "rocket json response", "rocket status", "rocket result responder", "rocket option 404", "rocket custom responder"]
updated: 2026-07-10
---

# Responders

**In Rocket, the return type of your handler *is* the response.** You don't reach for a `Response` object and start setting status codes and headers by hand. Pick a Rust type that knows how to turn itself into HTTP, return a value of that type, and Rocket does the rest.

The trait that makes this work is **`Responder`**. Any type that implements it can be a handler's return type, and Rocket already implements it for the types you reach for most: `String`, `Json<T>`, `Option<T>`, `Result<T, E>`, tuples like `(Status, T)`, and a handful of `status::*` helpers.

Coming from frameworks where you write `res.status(404).json(...)`, you might expect to *do* something to produce a response. In Rocket you *describe* it with a type. Want a 404 when a book isn't found? Return `Option<Json<Book>>` - `None` becomes a 404 with zero extra code. That's the whole design.

> 📝 We're still growing the same **books API**. Our model is the same as before:
>
> ```rust
> use rocket::serde::Serialize;
>
> #[derive(Serialize)]
> #[serde(crate = "rocket::serde")]
> struct Book {
>     id: u32,
>     title: String,
>     author: String,
> }
> ```
>
> `Serialize` is what lets `Json<Book>` write itself out as JSON.

## The built-in responders, in one tour

Each of these is just a return type. Rocket sees it and produces the matching HTTP response.

```rust
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::response::status;

// Plain text - &str and String are responders (200 OK, text/plain).
#[get("/ping")]
fn ping() -> &'static str {
    "pong"
}

// JSON - Json<T> where T: Serialize (200 OK, application/json).
#[get("/books/first")]
fn first() -> Json<Book> {
    Json(Book { id: 1, title: "Dune".into(), author: "Herbert".into() })
}

// (Status, T) - same body, but you choose the status line.
#[get("/teapot")]
fn teapot() -> (Status, &'static str) {
    (Status::ImATeapot, "no coffee here")
}
```

*What just happened:* three handlers, three different responses, and not one of them touches a response builder. `&'static str` produces a 200 with `text/plain`. `Json(book)` serializes the struct and sets `application/json`. The tuple `(Status, T)` keeps `T`'s body but swaps the status - here a 418. The type carried all the information Rocket needed.

The full cast of built-in responders you'll lean on:

- **`&str` / `String`** - plain text, 200 OK.
- **`Json<T>`** (where `T: Serialize`, from `rocket::serde::json::Json`) - JSON body, 200 OK.
- **`Option<T>`** - `Some(x)` becomes `x`'s response; **`None` becomes a 404**.
- **`Result<T, E>`** - `Ok(x)` becomes `x`'s response; `Err(e)` becomes `e`'s response (if `E: Responder`).
- **`(Status, T)`** - `T`'s body with the status you name.
- **`status::Created`, `status::NoContent`, `status::Custom`, `status::NotFound`** - small wrappers from `rocket::response::status` for common HTTP semantics.

## "Found, or 404" - the most idiomatic Rocket you'll write

Almost every read-by-id endpoint has the same shape: look it up, return it if it exists, 404 if it doesn't. In most frameworks that's an `if` and an early return. In Rocket it's a return type.

```rust
// Pretend this is your data layer.
fn store_get(id: u32) -> Option<Book> {
    // ... look up by id, return Some(book) or None ...
    # None
}

#[get("/books/<id>")]
fn show(id: u32) -> Option<Json<Book>> {
    store_get(id).map(Json)
}
```

*What just happened:* `store_get` already returns `Option<Book>`, so `.map(Json)` turns it into `Option<Json<Book>>` - wrapping the inner `Book` in `Json` only when it's `Some`. Rocket then reads the `Option`: a `Some(Json(book))` serializes to JSON with 200, and a `None` becomes a clean 404 automatically. The "not found" path is handled entirely by the type.

> 💡 `Option<Json<T>>` is the single most Rocket-idiomatic way to express "found or 404." When you catch yourself writing an explicit 404 branch for a lookup, reach for this instead - the framework already speaks it.

## Setting a status on purpose - the create case

Reads are usually 200. Writes often aren't: creating a resource should answer **201 Created**, and a successful delete with no body is **204 No Content**. You have two clean ways to say so.

The plain tuple is the most direct:

```rust
#[post("/books", data = "<book>")]
fn create(book: Json<Book>) -> (Status, Json<Book>) {
    // ... save book.into_inner() somewhere ...
    (Status::Created, book)
}
```

*What just happened:* the tuple `(Status::Created, Json<Book>)` says "201, with this JSON body." `Status::Created` is `rocket::http::Status::Created` (201). The body is the same `Json<Book>` you'd return on a 200 - only the status line changed. Rocket reads the tuple left-to-right: status first, responder second.

When you also want to advertise *where* the new resource lives, `status::Created` carries a `Location` header for you:

```rust
use rocket::response::status;

#[post("/books", data = "<book>")]
fn create_located(book: Json<Book>) -> status::Created<Json<Book>> {
    status::Created::new("/books/1").body(book)
}
```

*What just happened:* `status::Created::new("/books/1")` builds a 201 response and sets the `Location: /books/1` header to point at the freshly created book; `.body(book)` attaches the JSON. Callers that follow `Location` (and plenty of clients do) land directly on the new resource. Same 201 as the tuple, plus the header - pick this when the location matters.

## The other `status::*` helpers, and rolling your own

Two more helpers cover the common cases:

- **`status::NoContent`** - a 204 with no body, the right answer for a successful `DELETE` or an update that returns nothing.
- **`status::Custom(Status, T)`** - any status you want paired with any responder body, when none of the named helpers fit. Think of it as the tuple's more explicit sibling.

When your own type needs a specific HTTP shape, you don't have to hand-assemble a response - you can **derive** `Responder`:

```rust
use rocket::serde::json::Json;

#[derive(rocket::response::Responder)]
#[response(status = 201, content_type = "json")]
struct NewBook(Json<Book>);
```

*What just happened:* `#[derive(Responder)]` reads the `#[response(...)]` attribute and teaches `NewBook` to render as a 201 with a JSON content type, using the wrapped `Json<Book>` as the body. Now any handler can return `NewBook` and get that exact response - the HTTP semantics live with the type instead of being repeated at every return site. Reach for this once a particular response shape shows up in more than one handler.

## A teaser: `Result` for clean errors

Because `Result<T, E>` is a responder whenever both `T` and `E` are, you can already express success-or-error in a signature:

```rust
#[get("/books/<id>")]
fn show_or_status(id: u32) -> Result<Json<Book>, Status> {
    store_get(id)
        .map(Json)
        .ok_or(Status::NotFound)
}
```

*What just happened:* `Ok(Json(book))` becomes a 200 JSON response; `Err(Status::NotFound)` becomes a 404, because `Status` is itself a responder. This works today - but returning a bare `Status` on every error gets repetitive, and the error bodies are empty. In Phase 6 we'll pair `Result` with **error catchers** (`#[catch(404)]`) so a single place defines what a 404 (or 500) actually looks like across the whole API. For now, just notice that the door is open: errors are responses too.

## Recap

- **The return type *is* the response.** Pick a type that implements `Responder`; Rocket turns it into HTTP. You describe the response, you don't build it.
- Built-in responders cover the essentials: `&str`/`String` (text), `Json<T>` (JSON), `Option<T>`, `Result<T, E>`, `(Status, T)`, and the `status::*` helpers.
- **`Option<Json<T>>` is the idiomatic "found or 404"** - `None` becomes a 404 with no extra code.
- Set a status with `(Status::Created, Json(book))`, or use `status::Created::new(...).body(...)` to also send a `Location` header; `status::NoContent` is your 204.
- `#[derive(Responder)]` lets your own type own its HTTP shape (status + content type) once, instead of repeating it at every handler.
- `Result<T, E>` already expresses success/error as a response - the foundation for clean error handling with catchers in Phase 6.

## Quick check

Make sure the core ideas stuck:

```quiz
[
  {
    "q": "A handler returns Option<Json<Book>> and the value is None. What does Rocket send?",
    "choices": ["A 200 with an empty body", "A 404 Not Found", "A 500 Internal Server Error", "A compile error - Option isn't a responder"],
    "answer": 1,
    "explain": "Option<T> is a responder: Some(x) yields x's response, and None automatically becomes a 404. That's why Option<Json<T>> is the idiomatic 'found or 404' pattern."
  },
  {
    "q": "You want a create endpoint to return 201 Created with a JSON body. Which return value works?",
    "choices": ["Json(book) - it defaults to 201 for POST", "(Status::Created, Json(book))", "Status::Created alone", "Created(book) with no import"],
    "answer": 1,
    "explain": "The tuple (Status, T) keeps T's body but sets the status you name. (Status::Created, Json(book)) gives a 201 with the JSON body. status::Created::new(...).body(...) is the alternative that also adds a Location header."
  },
  {
    "q": "Why does returning Result<Json<Book>, Status> compile and work as a handler?",
    "choices": ["Rocket special-cases Result in the routing macro", "Result is a responder when both the Ok and Err types are responders - and Status is one", "Status implements Serialize", "It only works inside an async handler"],
    "answer": 1,
    "explain": "Result<T, E> implements Responder when both T and E do. Json<Book> is a responder and Status is a responder, so Ok yields the JSON (200) and Err(Status::NotFound) yields a 404."
  }
]
```

[← Phase 3: Request Guards & Data](03-guards-and-data.md) · [Guide overview](_guide.md) · [Phase 5: Managed State & Fairings →](05-state-and-fairings.md)
