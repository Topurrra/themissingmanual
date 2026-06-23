---
title: "A REST API with Error Handling"
guide: "actix-web-from-zero"
phase: 6
summary: "Build full CRUD over the shared web::Data store, then meet actix's idiomatic error story — the ResponseError trait — so every handler returns Result and varies status without juggling response types."
tags: [actix-web, rust, rest, api, crud, error-handling]
difficulty: advanced
synonyms: ["actix rest api", "actix crud", "actix responseerror trait", "actix custom error", "actix Result handler", "rust actix articles api"]
updated: 2026-06-23
---

# A REST API with Error Handling

This is the phase everything else was building toward. You have an `App`, routing, extractors, responders,
shared state, and middleware. Now we wire them into a real REST resource — full CRUD over the `articles`
store — and along the way we finally fix a pain you've been quietly living with since Phase 3.

## The mental model

Hold two ideas in your head and the rest of this phase writes itself.

**One: a REST resource is just five handlers over the shared store.** "Articles" isn't some special
construct — it's a list endpoint, a show endpoint, a create, an update, and a delete, all reaching through
the same `web::Data<AppState>` you built in [Phase 4](04-shared-state.md). The HTTP method plus the path
decides which handler runs; the body of each handler is a small read or write against that `Mutex<HashMap>`.

**Two: the clean way to vary status is to return a `Result` and let actix render the error.** Back in
Phase 3 you may have hit this wall: one branch wants to return `HttpResponse::Ok().json(...)` and another
wants `HttpResponse::NotFound().finish()`, and Rust complains because — depending how you wrote it — the
branches produce types that don't line up, or you end up matching and rebuilding responses by hand in every
handler. actix's answer is to push the error *out of* the happy path. Your handler returns
`Result<HttpResponse, ApiError>`, the success arm builds the 200, and **a returned `Err` becomes the HTTP
response automatically** — because your error type implements the `ResponseError` trait. One place defines
what a "not found" looks like on the wire; every handler just says `?`.

> 💡 If you've read the [axum guide](/guides/axum-from-zero), this is the same shape under a different name.
> axum has you implement `IntoResponse` on your error type; actix has you implement `ResponseError`. Both
> turn "a value my handler returned" into "an HTTP response." Once you see one, you've seen both.

## The five handlers

Here's the resource. Five functions, mounted on a `web::scope("/api/v1")` so the version prefix lives in one
place. Each reads or writes the shared store and returns `Result<HttpResponse, ApiError>` (we'll define
`ApiError` in the next section — read these first to see *why* we want it):

```rust
use actix_web::{web, App, HttpServer, HttpResponse};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Clone, Serialize, Deserialize)]
struct Article {
    id: u32,
    title: String,
    body: String,
}

// what the client sends on create/update — no id, the server owns that
#[derive(Deserialize)]
struct ArticleInput {
    title: String,
    body: String,
}

struct AppState {
    articles: Mutex<HashMap<u32, Article>>,
    next_id: Mutex<u32>,
}

// GET /api/v1/articles  → 200 with the list
async fn list(state: web::Data<AppState>) -> Result<HttpResponse, ApiError> {
    let map = state.articles.lock().unwrap();
    let articles: Vec<Article> = map.values().cloned().collect();
    Ok(HttpResponse::Ok().json(articles))
}

// GET /api/v1/articles/{id}  → 200, or 404 if missing
async fn show(
    path: web::Path<u32>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let map = state.articles.lock().unwrap();
    let article = map.get(&path).cloned().ok_or(ApiError::NotFound)?;
    Ok(HttpResponse::Ok().json(article))
}

// POST /api/v1/articles  → 201 with the created article
async fn create(
    body: web::Json<ArticleInput>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let input = body.into_inner();
    if input.title.trim().is_empty() {
        return Err(ApiError::BadRequest("title must not be empty".into()));
    }

    let mut id_guard = state.next_id.lock().unwrap();
    let id = *id_guard;
    *id_guard += 1;

    let article = Article { id, title: input.title, body: input.body };
    state.articles.lock().unwrap().insert(id, article.clone());
    Ok(HttpResponse::Created().json(article))
}

// PUT /api/v1/articles/{id}  → 200, or 404 if missing
async fn update(
    path: web::Path<u32>,
    body: web::Json<ArticleInput>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let id = path.into_inner();
    let input = body.into_inner();
    let mut map = state.articles.lock().unwrap();

    let article = map.get_mut(&id).ok_or(ApiError::NotFound)?;
    article.title = input.title;
    article.body = input.body;
    Ok(HttpResponse::Ok().json(article.clone()))
}

// DELETE /api/v1/articles/{id}  → 204, or 404 if missing
async fn delete(
    path: web::Path<u32>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let mut map = state.articles.lock().unwrap();
    map.remove(&path.into_inner()).ok_or(ApiError::NotFound)?;
    Ok(HttpResponse::NoContent().finish())
}
```

*What just happened:* five handlers, one shared store. `show`, `update`, and `delete` all share the same
"look it up, `?` away the `NotFound`" move — `map.get(...).ok_or(ApiError::NotFound)?` reads as "give me the
article or bail out with a 404," and the bail-out *is* the response. `create` mints an id from the `next_id`
counter (a second `Mutex` so the counter and the map lock independently) and returns `201 Created` with the
new record. `delete` returns `204 No Content` — `.finish()` because there's no body. Notice what's *not*
here: no `match` rebuilding error responses, no juggling `HttpResponse` types across branches. The error
arm left the building via `?`.

Now mount them. The five handlers live on a scope, and the state is built once and cloned in per worker —
exactly the pattern from Phase 4:

```rust
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let state = web::Data::new(AppState {
        articles: Mutex::new(HashMap::new()),
        next_id: Mutex::new(1),
    });

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .service(
                web::scope("/api/v1")
                    .route("/articles", web::get().to(list))
                    .route("/articles", web::post().to(create))
                    .route("/articles/{id}", web::get().to(show))
                    .route("/articles/{id}", web::put().to(update))
                    .route("/articles/{id}", web::delete().to(delete)),
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

*What just happened:* `web::scope("/api/v1")` prefixes every route inside it, so `/articles` becomes
`/api/v1/articles` without you repeating the version on each line. The same path string carries multiple
methods — `web::get()` and `web::post()` on `/articles` are two distinct routes. `state.clone()` hands each
worker a handle to the *one* `AppState`, the load-bearing detail from Phase 4.

## The error type: one shape, defined once

Everything above leaned on `ApiError`. Here's the whole thing — an enum of the failures this API can
produce, plus the two trait impls that teach actix how to turn it into an HTTP response:

```rust
use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use std::fmt;

#[derive(Debug)]
enum ApiError {
    NotFound,
    BadRequest(String),
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        match self {
            ApiError::NotFound => StatusCode::NOT_FOUND,
            ApiError::BadRequest(_) => StatusCode::BAD_REQUEST,
        }
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code())
            .json(serde_json::json!({ "error": self.to_string() }))
    }
}
```

*What just happened:* `ResponseError` is the whole trick. When a handler returns `Err(ApiError::NotFound)`,
actix calls `error_response()` on it and sends back whatever that produces — here, the right status code with
a consistent `{"error": "..."}` JSON body. `status_code()` maps each variant to its HTTP status; the default
`error_response()` would use that status with a plain-text body, but we override it so *every* error in the
API speaks the same JSON dialect. `Display` is required by the trait (it's a supertrait of `ResponseError`),
and we derive it cheaply off `Debug` here. Define this once and every handler that returns
`Result<_, ApiError>` gets it for free — that's the payoff for the `?` calls scattered through the five
handlers.

> ⚠️ `ResponseError` requires your type to be `Display + Debug`. If the compiler complains that your error
> "doesn't implement `ResponseError`," check that you actually impl'd `Display` — that's the usual missing
> piece, and the error message can point at the wrong line.

## `?`, `From`, and foreign errors

The `?` operator is doing quiet, important work. When a handler returns `Result<HttpResponse, ApiError>`,
`?` on a `Result<T, ApiError>` is a clean early return. But `?` has a superpower: it will convert error types
*on the way out* if there's a `From` impl connecting them. That's how you let `?` swallow errors from
libraries that know nothing about your `ApiError`.

Say a handler parses something and gets a `std::num::ParseIntError`. Teach `ApiError` how to absorb it:

```rust
impl From<std::num::ParseIntError> for ApiError {
    fn from(_: std::num::ParseIntError) -> Self {
        ApiError::BadRequest("invalid number".into())
    }
}

async fn show_by_str(
    path: web::Path<String>,
    state: web::Data<AppState>,
) -> Result<HttpResponse, ApiError> {
    let id: u32 = path.parse()?; // ParseIntError → ApiError via From, then ? returns it
    let map = state.articles.lock().unwrap();
    let article = map.get(&id).cloned().ok_or(ApiError::NotFound)?;
    Ok(HttpResponse::Ok().json(article))
}
```

*What just happened:* `path.parse()` returns `Result<u32, ParseIntError>`. Because `From<ParseIntError>` for
`ApiError` exists, the `?` converts the foreign error into an `ApiError::BadRequest` and returns it — which
`ResponseError` then renders as a 400. You wrote one `From` impl and now *every* `?` on a `ParseIntError`
maps to a sensible HTTP response. This is how real handlers stay short: database errors, parse errors, and
your own errors all funnel through `?` into one error type.

> 💡 Writing `Display` and `From` impls by hand gets tedious as the enum grows. The **`thiserror`** crate
> generates both from attributes — you annotate each variant with a `#[error("...")]` message and add
> `#[from]` to a field to auto-derive the conversion. The mental model is identical; `thiserror` just deletes
> the boilerplate. It's the standard choice once an API has more than a couple of error variants.

## ⚠️ Extractor failures are already errors — don't panic

One thing the framework handles before your code even runs: if a client POSTs malformed JSON, the
`web::Json<ArticleInput>` extractor fails *during extraction* and actix returns a `400 Bad Request` on its
own. You never see a bad body inside your handler. That's the principle to internalize: **a handler that
can't proceed should return an error, never panic.** A `.unwrap()` on something a client controls is a 500
and a crashed request waiting to happen.

If you want the default extractor error to match your JSON error shape, configure it with `app_data`:

```rust
use actix_web::web::JsonConfig;

// inside the App builder, alongside .app_data(state.clone()):
.app_data(JsonConfig::default().error_handler(|err, _req| {
    let msg = err.to_string();
    actix_web::error::InternalError::from_response(
        err,
        HttpResponse::BadRequest().json(serde_json::json!({ "error": msg })),
    )
    .into()
}))
```

*What just happened:* `JsonConfig`'s `error_handler` intercepts extractor-level JSON failures and lets you
return a custom response — here, the same `{"error": "..."}` shape your `ResponseError` produces, so a
malformed body and a missing article look consistent to the client. Without this, you still get a 400 on bad
JSON; this just makes the body match your house style.

## Take it for a spin

With the server running, exercise the full lifecycle with `curl`:

```bash
# create one → 201 with the new article (including its server-assigned id)
curl -s -X POST http://127.0.0.1:8080/api/v1/articles \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello","body":"first post"}'

# list them → 200 with a JSON array
curl -s http://127.0.0.1:8080/api/v1/articles

# fetch one that doesn't exist → 404 {"error":"NotFound"}
curl -s http://127.0.0.1:8080/api/v1/articles/999

# update it → 200 with the new values
curl -s -X PUT http://127.0.0.1:8080/api/v1/articles/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello (edited)","body":"updated"}'

# delete it → 204, empty body
curl -s -i -X DELETE http://127.0.0.1:8080/api/v1/articles/1
```

*What just happened:* you drove all five handlers and saw all four status codes (200, 201, 204, 404) without
a single hand-built error branch in your handler bodies — the `Result` + `ResponseError` machinery rendered
the 404s for you. Hit a route with a bad JSON body and you'll see the 400 the extractor (or your
`JsonConfig`) produces.

> 💡 The `Mutex<HashMap>` is a teaching prop, not a database. To go to a real store you swap the handler
> bodies for `sqlx` queries against the `PgPool` from Phase 4 — and add a `From<sqlx::Error>` impl so DB
> failures `?` straight into your `ApiError` as 500s. The error *model* doesn't change at all; only what
> happens between the lock and the response does. This is the same place the [axum guide](/guides/axum-from-zero)
> lands with `IntoResponse`, which is no accident — both frameworks converged on "return a typed error, let
> the framework render it."

## Recap

- A **REST resource is five handlers over the shared store** — list, show, create, update, delete — mounted
  on a `web::scope("/api/v1")`, each reaching through the `web::Data<AppState>` from Phase 4.
- Handlers return **`Result<HttpResponse, ApiError>`** and use **`?`**; a returned `Err` becomes the HTTP
  response, so you stop juggling response types across branches (the Phase 3 pain, solved).
- The **`ResponseError` trait** (with `Display`) defines status and body in **one place** — `status_code()`
  maps variants to codes, `error_response()` gives every error the same JSON shape.
- **`From<E>` impls** let `?` convert foreign errors (parse, DB) into your `ApiError`; **`thiserror`**
  generates the `Display` and `From` boilerplate once the enum grows.
- ⚠️ Extractor failures (bad JSON) already produce **400s automatically** — return errors, never panic;
  customize the extractor's response with `JsonConfig::error_handler` if you want it to match your shape.

## Quick check

```quiz
[
  {
    "q": "A handler returns Result<HttpResponse, ApiError> and returns Err(ApiError::NotFound). How does that become a 404 response?",
    "choices": [
      "actix checks the variant name and guesses the status",
      "ApiError implements ResponseError, so actix calls its status_code/error_response to render the Err",
      "The ? operator sets the status code directly",
      "You must add a match in the handler to convert it"
    ],
    "answer": 1,
    "explain": "Implementing ResponseError on your error type teaches actix how to turn a returned Err into an HTTP response — status_code() and error_response() define the status and body once, for every handler."
  },
  {
    "q": "Why does writing impl From<std::num::ParseIntError> for ApiError help in a handler?",
    "choices": [
      "It makes ParseIntError print nicer in logs",
      "It lets the ? operator auto-convert a ParseIntError into your ApiError on the way out",
      "It is required before you can call .parse()",
      "It changes the HTTP status of every response to 400"
    ],
    "answer": 1,
    "explain": "The ? operator converts error types when a From impl connects them. With From<ParseIntError> for ApiError, a ? on a parse result returns your ApiError, which ResponseError then renders."
  },
  {
    "q": "A client POSTs malformed JSON to your create handler. What happens by default?",
    "choices": [
      "Your handler runs with an empty struct",
      "The web::Json extractor fails during extraction and actix returns a 400 before your handler runs",
      "The request panics and the server crashes",
      "actix returns a 500 because there is no body"
    ],
    "answer": 1,
    "explain": "Extractor failures are handled before your handler body — bad JSON makes web::Json fail and actix returns a 400 on its own. You can customize that response with JsonConfig::error_handler, but you should never panic on client input."
  }
]
```

[← Phase 5: Middleware](05-middleware.md) · [Guide overview](_guide.md) · [Phase 7: Testing & Production →](07-testing-and-production.md)
