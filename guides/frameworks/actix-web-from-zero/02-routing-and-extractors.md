---
title: "Routing & Extractors"
guide: "actix-web-from-zero"
phase: 2
summary: "How actix-web matches a request to a handler: routes as method + path, builder vs attribute-macro registration, web::scope for versioning, and the Path/Query/Json extractors that turn a request into typed handler arguments."
tags: [actix-web, rust, routing, extractors, scope]
difficulty: beginner
synonyms: ["actix routing", "actix scope", "actix web::path query json", "actix extractors", "actix attribute macros get post", "actix route"]
updated: 2026-06-23
---

# Routing & Extractors

In Phase 1 you stood up an `App`, handed it to an `HttpServer`, and wrote a single handler that
answered one path. This phase covers how actix-web decides *which* handler runs for an incoming
request, and how that handler gets the pieces of the request it cares about without you ever
touching the raw bytes.

Two mental models cover everything else.

> 📝 **Mental model #1 — a route is a tiny rule: `method + path → handler`.** When a request
> arrives, actix-web walks its list of registered rules looking for the first one whose HTTP
> method *and* path pattern match. `GET /articles` and `POST /articles` are two different routes
> even though the path is identical, because the method is part of the key.

> 📝 **Mental model #2 — a handler's parameters are extractors.** You don't reach into the request
> object. Instead you declare what you want as typed arguments — `web::Path<u32>`,
> `web::Query<Pagination>`, `web::Json<NewArticle>` — and actix-web *extracts* those values from
> the request before your function body ever runs. If extraction fails (bad path segment,
> malformed JSON), your handler isn't called at all; the framework returns an error response for
> you. Your function body only ever sees already-valid, already-typed data.

We'll keep growing the **articles API** from Phase 1 — same familiar shape:

```rust
struct Article {
    id: u32,
    title: String,
    body: String,
}
```

## Registering routes: two styles, same idea

actix-web gives you two ways to attach a handler to a route, producing identical behavior — the
difference is purely *where the route lives in your source*. You'll see both in the wild.

### Style 1: the builder

You spell out the route on the `App` itself with `.route(path, method().to(handler))`:

```rust
use actix_web::{web, App, HttpServer, HttpResponse, Responder};

async fn list() -> impl Responder {
    HttpResponse::Ok().body("all articles")
}

async fn show() -> impl Responder {
    HttpResponse::Ok().body("one article")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/articles", web::get().to(list))
            .route("/articles/{id}", web::get().to(show))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

*What just happened:* `web::get()` builds a route guard that only matches `GET` requests; `.to(list)`
says "when it matches, call `list`." Chaining two `.route(...)` calls gives the routing table two
rules. The `{id}` in the second path is a **placeholder** — it matches any single path segment
(`/articles/7`, `/articles/42`) and captures it for an extractor to read later. Routes are checked
top to bottom, and the first match wins.

### Style 2: attribute macros

The same routes, but the method and path move *up onto the handler* as an attribute, and you
register the handler with `.service(...)`:

```rust
use actix_web::{get, App, HttpServer, HttpResponse, Responder};

#[get("/articles")]
async fn list() -> impl Responder {
    HttpResponse::Ok().body("all articles")
}

#[get("/articles/{id}")]
async fn show() -> impl Responder {
    HttpResponse::Ok().body("one article")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(list)
            .service(show)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

*What just happened:* `#[get("/articles")]` bundles the method + path *with* the function. The
function now *is* a service, registered with `.service(list)` instead of a `.route(...)` call.
There's a macro for each verb — `#[post(...)]`, `#[put(...)]`, `#[delete(...)]`, and so on.
Behaviorally this is the same routing table as Style 1; many codebases prefer it because each
handler carries its own route declaration right above it instead of a central list elsewhere.

> 💡 Pick one style and stay consistent within a project — a reader shouldn't have to check two
> places to learn where routes are defined. Macros read nicely for CRUD-style apps; the builder
> shines when composing routes programmatically.

## Grouping routes with `web::scope`

Real APIs version their endpoints and share common prefixes — `/api/v1/articles`,
`/api/v1/authors`, and so on. Typing `/api/v1/...` in front of every route is noisy and error-prone.
`web::scope` mounts a whole group of routes under a shared prefix:

```rust
use actix_web::{web, App, HttpServer, HttpResponse, Responder};

async fn list() -> impl Responder {
    HttpResponse::Ok().body("all articles")
}

async fn show() -> impl Responder {
    HttpResponse::Ok().body("one article")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new().service(
            web::scope("/api/v1")
                .route("/articles", web::get().to(list))
                .route("/articles/{id}", web::get().to(show)),
        )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

*What just happened:* `web::scope("/api/v1")` creates a sub-router whose prefix is `/api/v1`. Every
route registered inside it is *relative* to that prefix, so `/articles` actually answers
`GET /api/v1/articles` and `/articles/{id}` answers `GET /api/v1/articles/7`. To cut a v2 of the
API, add a second scope and leave v1 untouched. Scopes can also carry their own state and
middleware (Phases 4 and 5), making them the natural seam for "everything under this prefix
behaves this way."

## Extractors: turning a request into typed arguments

A handler's parameters are how it asks for pieces of the request. The three you'll reach for
constantly are `Path`, `Query`, and `Json`.

### `web::Path` — values from the URL

That `{id}` placeholder captures a path segment. `web::Path<T>` pulls it out and parses it into the
type you ask for:

```rust
use actix_web::{web, HttpResponse, Responder};

async fn show(path: web::Path<u32>) -> impl Responder {
    let id = path.into_inner();
    HttpResponse::Ok().body(format!("you asked for article {id}"))
}
```

*What just happened:* the handler declared `path: web::Path<u32>`. actix-web took the `{id}` segment
from the URL, parsed it as a `u32`, and only then called `show`. `path.into_inner()` unwraps the
`Path` wrapper to give you the plain `u32` inside. If the URL had been `/articles/banana`, the parse
would fail, `show` would never run, and the client would get a `400 Bad Request` automatically — zero
validation code needed for "is this segment actually a number."

When a route has several placeholders, ask for a tuple and destructure it:

```rust
use actix_web::{web, HttpResponse, Responder};

// route registered as "/authors/{name}/articles/{id}"
async fn show_by_author(path: web::Path<(String, u32)>) -> impl Responder {
    let (name, id) = path.into_inner();
    HttpResponse::Ok().body(format!("article {id} by {name}"))
}
```

*What just happened:* with two placeholders, `web::Path<(String, u32)>` captures both in order —
`{name}` becomes the `String`, `{id}` becomes the `u32`. `into_inner()` hands back the tuple to
destructure in one line. The tuple's *order* matches the order the placeholders appear in the path,
not their names, so keep them lined up.

### `web::Query` — values from the query string

Query parameters (`?page=2&per_page=20`) come in through `web::Query<T>`, where `T` is a struct that
derives serde's `Deserialize`:

```rust
use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;

#[derive(Deserialize)]
struct Pagination {
    page: u32,
    per_page: u32,
}

async fn list(q: web::Query<Pagination>) -> impl Responder {
    HttpResponse::Ok().body(format!("page {} of {} per page", q.page, q.per_page))
}
```

*What just happened:* `#[derive(Deserialize)]` on `Pagination` tells serde how to build it from
key/value pairs. `web::Query<Pagination>` reads the query string, matches each field by name, and
parses the values into the field types. A request to `/articles?page=2&per_page=20` gives you
`q.page == 2` and `q.per_page == 20`. As with `Path`, a missing or unparseable field means the
handler is never called and the client gets a `400`. (Add `serde` to `Cargo.toml` with
`features = ["derive"]`; we lean on it heavily from here on.)

### `web::Json` — the request body

For `POST`/`PUT` bodies sent as JSON, `web::Json<T>` deserializes the body into your type:

```rust
use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;

#[derive(Deserialize)]
struct NewArticle {
    title: String,
    body: String,
}

async fn create(body: web::Json<NewArticle>) -> impl Responder {
    let article = body.into_inner();
    HttpResponse::Ok().body(format!("creating '{}'", article.title))
}
```

*What just happened:* `web::Json<NewArticle>` read the raw request body, parsed it as JSON, and
deserialized it into a `NewArticle` before `create` ran. `body.into_inner()` (or field access like
`body.title`) gets at the data. A malformed body or missing required field produces a `400`
automatically — your handler only ever sees a fully-formed `NewArticle`.

## Combining extractors — and the one body rule

Extractors compose: a handler can ask for several at once, and actix-web fills them all in before
calling you. A create-under-an-author handler might want the author from the path *and* the article
from the body:

```rust
use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;

#[derive(Deserialize)]
struct NewArticle {
    title: String,
    body: String,
}

// route: "/authors/{name}/articles"
async fn create_for_author(
    path: web::Path<String>,
    body: web::Json<NewArticle>,
) -> impl Responder {
    let author = path.into_inner();
    let article = body.into_inner();
    HttpResponse::Ok().body(format!("'{}' by {author}", article.title))
}
```

*What just happened:* the handler declared two extractors as separate parameters. actix-web ran both
— pulled `{name}` from the URL into `path`, deserialized the JSON body into `body` — and only then
called `create_for_author`. List as many extractors as you need; they're just function parameters.

> ⚠️ One real constraint: **only one extractor may read the request body.** `web::Json` consumes
> the body stream, and a body can only be read once. A handler can have many `Path` and `Query`
> extractors but effectively **one** body extractor (`Json`, `Form`, or `Bytes`). Asking for two
> body extractors won't give you the data twice — it's a design error. We lean harder on `Json` for
> both requests *and* responses in [Phase 3: Responders](03-responders.md).

## Recap

- A route is `method + path → handler`. `GET /articles` and `POST /articles` are distinct routes;
  the method is part of the match.
- Register routes two ways: the **builder** (`.route("/articles", web::get().to(list))`) or
  **attribute macros** (`#[get("/articles")]` + `.service(list)`). Same behavior — pick one and
  stay consistent.
- `web::scope("/api/v1")` mounts a group of routes under a shared prefix, which is how you version
  and organize an API.
- Extractors turn a request into typed arguments: `web::Path` (URL segments, `.into_inner()`),
  `web::Query` (query string into a `Deserialize` struct), and `web::Json` (the request body).
- Failed extraction means your handler never runs — the client gets a `400` automatically, so your
  function body only sees valid, typed data.
- You can combine many extractors as parameters, but only **one** of them may read the body.

## Quick check

```quiz
[
  {
    "q": "What two things together make up a route in actix-web?",
    "choices": ["The path and the handler's return type", "The HTTP method and the path pattern", "The query string and the body", "The scope prefix and the port"],
    "answer": 1,
    "explain": "actix-web matches an incoming request by both its HTTP method and its path pattern, which is why GET /articles and POST /articles are different routes."
  },
  {
    "q": "Which extractor reads values out of the URL path, like the 7 in /articles/7?",
    "choices": ["web::Query", "web::Json", "web::Path", "web::Data"],
    "answer": 2,
    "explain": "web::Path<T> captures the {id} placeholder from the path and parses it into T; you unwrap it with .into_inner()."
  },
  {
    "q": "How many extractors in a single handler may read the request body?",
    "choices": ["As many as you want", "Exactly one", "Two, one for JSON and one for form data", "Zero — the body is never extracted"],
    "answer": 1,
    "explain": "The body stream can only be read once, so a handler can have many Path/Query extractors but effectively only one body extractor such as web::Json."
  }
]
```

---

[← Phase 1: What actix-web Is & Your First Server](01-what-actix-web-is.md) · [Guide overview](_guide.md) · [Phase 3: Responders →](03-responders.md)
