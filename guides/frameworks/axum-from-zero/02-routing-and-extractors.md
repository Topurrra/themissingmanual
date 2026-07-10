---
title: "Routing & Extractors"
guide: "axum-from-zero"
phase: 2
summary: "Routes are method + path → handler, and a handler's parameters are extractors that pull typed data from the request. Path, Query, and nesting routers for versioned APIs."
tags: [axum, rust, routing, extractors, path, query]
difficulty: beginner
synonyms: ["axum routing", "axum path extractor", "axum query extractor", "axum nested router", "axum methods get post", "axum Path Query"]
updated: 2026-07-10
---

# Routing & Extractors

Phase 1 gave you a single route answering a single path. Real APIs branch: `GET /books` lists, `POST
/books` creates, `GET /books/42` shows one. This phase covers how axum picks *which* handler runs, and how
a handler reaches into the request and pulls out exactly the data it wants.

📝 **The mental model, and it's the whole framework:** a route is **method + path → handler**. A handler's
**parameters are extractors** — each one a type that knows how to pull a specific piece out of the
incoming request. `Path<u32>` pulls a URL segment, `Query<T>` pulls the query string; later you'll meet
`Json<T>` (the body) and `State<T>` (shared data). You don't parse the request yourself — you *declare what
you need by type*, and axum fills it in before your function body runs.

## Methods: one path, many verbs

A route ties an HTTP method to a handler. The method helpers live in `axum::routing`: `get`, `post`, `put`, `delete`, `patch`. You can chain them on a single path, which is exactly what you want for a REST resource.

We're growing a small **books API** this whole guide. Each book is just:

```rust
struct Book {
    id: u32,
    title: String,
    author: String,
}
```

Here's the router for it:

```rust
use axum::{
    Router,
    routing::get,
};

async fn list_books() -> &'static str {
    "all books"
}

async fn create_book() -> &'static str {
    "created a book"
}

async fn show_book() -> &'static str {
    "one book"
}

fn app() -> Router {
    Router::new()
        .route("/books", get(list_books).post(create_book))
        .route("/books/{id}", get(show_book))
}
```

*What just happened:* the first `route` maps **two** verbs to the same path — `get(list_books).post(create_book)`. A `GET /books` runs `list_books`; a `POST /books` runs `create_book`; anything else on that path gets an automatic `405 Method Not Allowed`. The second route introduces a **path parameter**: `{id}` is a capture, a placeholder matching any single segment, so `/books/42` and `/books/abc` both match `/books/{id}` — but the handler hasn't read that segment yet. That's the extractor's job, next.

💡 **A version note that will save you a confusing afternoon:** the `{id}` curly-brace syntax is **axum 0.8**. If you're reading older blog posts or a 0.7 codebase, captures looked like `:id` (`"/books/:id"`). Same idea, different punctuation. This guide uses `{id}` throughout; if your compiler complains about the braces, check your axum version in `Cargo.toml`.

## The `Path` extractor: reading the URL

A capture in the route is only half the deal. To actually *use* `42`, you add a `Path` parameter to the handler:

```rust
use axum::extract::Path;

async fn show_book(Path(id): Path<u32>) -> String {
    format!("showing book {id}")
}
```

*What just happened:* `Path<u32>` is the extractor. axum looks at the matched route, finds the `{id}` segment, tries to parse it as a `u32`, and hands it to your function. The `Path(id)` part is just Rust pattern-matching — `Path` is a tuple struct wrapping one value, so `Path(id)` destructures it and binds the inner `u32` to `id`. (If you find that line noisy, you could write `path: Path<u32>` and use `path.0` instead — same thing, less idiomatic.)

The parse is real and it matters: a request to `/books/42` gives you `id = 42`. A request to `/books/abc` can't parse as `u32`, so axum rejects it with `400 Bad Request` *before your handler runs*. You never see the bad input — the type *is* the validation.

When a path has **multiple** captures, `Path` extracts a tuple, in order:

```rust
use axum::extract::Path;

// route: .route("/authors/{author}/books/{id}", get(show_authored_book))
async fn show_authored_book(Path((author, id)): Path<(String, u32)>) -> String {
    format!("book {id} by {author}")
}
```

*What just happened:* Two captures (`{author}`, `{id}`) map to a two-element tuple `(String, u32)`, **positionally** — first segment to the first type, second to the second. So `/authors/tolkien/books/7` gives `author = "tolkien"`, `id = 7`. Note `author` is a `String` (any text is valid) while `id` is still a `u32` (must parse as a number, or it's a `400`). Order is everything here; the names in the URL don't matter to a tuple, only the position does.

## The `Query` extractor: reading the query string

URLs carry data after the `?` too — `/books?page=2&limit=20`. That's the **query string**, and `Query<T>` extracts it into a struct of your own design. This one needs **serde**, the Rust serialization library, because axum deserializes the raw `page=2&limit=20` text into your typed struct.

Add serde with the `derive` feature:

```bash
cargo add serde --features derive
```

Then define a struct describing the parameters you expect, and extract it:

```rust
use axum::extract::Query;
use serde::Deserialize;

#[derive(Deserialize)]
struct Pagination {
    page: Option<u32>,
    limit: Option<u32>,
}

async fn list_books(Query(params): Query<Pagination>) -> String {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(20);
    format!("books page {page}, {limit} per page")
}
```

*What just happened:* `#[derive(Deserialize)]` teaches `Pagination` how to be built from the query string. `Query<Pagination>` then parses `?page=2&limit=20` into `Pagination { page: Some(2), limit: Some(20) }`. The two fields being `Option<u32>` makes both parameters **optional** — a bare `GET /books` still succeeds, both fields come back `None`, and `unwrap_or` supplies defaults. Type them as plain `u32` instead and a request missing `page` gets rejected with a `400`: `Option` vs. required encodes "optional vs. mandatory" directly in the type.

💡 The same pattern handles filters and flags: a field `author: Option<String>` lets `/books?author=tolkien` flow straight into a typed field. The struct *is* your query API.

## Nesting and merging: structure for a growing API

One flat `Router` works until you have a dozen routes and want to version them, or split them across files. Two methods compose routers:

- **`nest("/prefix", other)`** mounts a sub-router *under a path prefix*. Everything inside `other` gains that prefix. This is your versioning tool.
- **`merge(other)`** folds another router's routes into this one *at the same level*, no prefix. Good for splitting routes across modules without changing their paths.

Here's the books API mounted under `/api/v1`:

```rust
use axum::{Router, routing::get};

fn books_router() -> Router {
    Router::new()
        .route("/books", get(list_books).post(create_book))
        .route("/books/{id}", get(show_book))
}

fn app() -> Router {
    Router::new()
        .nest("/api/v1", books_router())
}
```

*What just happened:* `books_router()` defines paths as if they lived at the root — `/books`, `/books/{id}`. `nest("/api/v1", ...)` prefixes them all, so the reachable URLs become `/api/v1/books` and `/api/v1/books/{id}`. When v2 arrives, write a `books_router_v2()` and `.nest("/api/v2", ...)` it alongside — v1 keeps working untouched, because the prefix lives in *one* place, not sprinkled across every route string. Reach for `merge` instead when combining routers that should share the same prefix level, like a `users_router()` and `books_router()` both under `/api/v1`.

⚠️ **A rule that'll bite you in Phase 3, so plant it now:** an extractor that **consumes the request body** — like `Json<T>`, which you'll meet next phase for reading POST payloads — can appear **only once per handler, and it must be the last parameter.** The body is a stream you can read exactly once, so axum enforces this at compile time. `Path` and `Query` don't touch the body, so they can come in any order and any number. The moment you add a body extractor, it goes at the end: `async fn create_book(Path(id): Path<u32>, Json(body): Json<NewBook>)`. Get the order wrong and you'll get a trait-bound error that looks scary but means exactly this. (Full story in Phase 3.)

## Recap

- A route is **method + path → handler**; chain verbs on one path with `get(h).post(h2)`, and unmatched methods auto-return `405`.
- Path captures use **`{id}`** in axum 0.8 (older `:id` in 0.7); a capture in the route only matches a segment — an **extractor** reads it.
- **`Path<T>`** pulls URL segments by type (a tuple `Path<(A, B)>` for multiple, positionally); a parse failure is an automatic `400`.
- **`Query<T>`** deserializes the query string into a `#[derive(Deserialize)]` struct (needs serde); `Option<_>` fields make parameters optional.
- **`nest("/prefix", r)`** mounts a sub-router under a prefix (use it for versioning like `/api/v1`); **`merge(r)`** combines routers at the same level.
- Body-consuming extractors (e.g. `Json`) must be the **last** parameter and appear **once** — non-body extractors like `Path`/`Query` have no such limit.

## Quick check

```quiz
[
  {
    "q": "In axum 0.8, how do you declare a path that captures a book id?",
    "choices": ["\"/books/:id\"", "\"/books/{id}\"", "\"/books/<id>\"", "\"/books/[id]\""],
    "answer": 1,
    "explain": "axum 0.8 uses curly braces: \"/books/{id}\". The colon form \":id\" was the 0.7 syntax."
  },
  {
    "q": "A handler takes Query(params): Query<Pagination> where page is Option<u32>. What happens on a request to /books with no query string?",
    "choices": ["It returns 400 Bad Request", "It succeeds and page is None", "It panics", "It returns 404 Not Found"],
    "answer": 1,
    "explain": "Because page is Option<u32>, the parameter is optional. Missing it yields None and the handler runs normally. A plain u32 field would have forced a 400."
  },
  {
    "q": "Which statement about extractor order in a handler is true?",
    "choices": ["Path must always come first", "A body extractor like Json must be the last parameter and appear only once", "Query must be the last parameter", "Order never matters for any extractor"],
    "answer": 1,
    "explain": "The request body can be read only once, so a body-consuming extractor (Json) must be last and singular. Non-body extractors like Path and Query can appear in any order."
  }
]
```

---

[← Phase 1: What axum Is & Your First Server](01-what-axum-is.md) · [Guide overview](_guide.md) · [Phase 3: Handlers & IntoResponse →](03-handlers-and-intoresponse.md)
