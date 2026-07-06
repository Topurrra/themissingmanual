---
title: "Responders"
guide: "actix-web-from-zero"
phase: 3
summary: "How handlers turn into HTTP responses: the Responder trait, the HttpResponse builder for status control, web::Json shorthand, the different-branches type trap, and when to reach for impl Responder."
tags: [actix-web, rust, responder, httpresponse, json]
difficulty: intermediate
synonyms: ["actix responder", "actix httpresponse", "actix impl responder", "actix json response", "actix status code", "actix return type"]
updated: 2026-06-23
---

# Responders

The whole chapter in one sentence: **a handler returns a value, and actix-web only accepts that value if its type knows how to become an HTTP response.** That "knows how to become a response" is a trait called `Responder`. You don't call it yourself — you return a type that implements it, and the framework does the conversion.

The question for every handler isn't "how do I write a response?" but "what type do I return, and does it implement `Responder`?" From there, pick the right type for the job:

- Need full control over status, headers, and body? Return **`HttpResponse`** — the workhorse.
- Just shipping some JSON with a 200? Return **`web::Json<T>`** and let it serialize for you.
- Returning one consistent shape and want to stay terse? Return **`impl Responder`**.

> 📝 [Phase 2](02-routing-and-extractors.md) covered the *input* half of a handler — extractors pull `Path`, `Query`, and `Json` out of the request. This chapter is the *output* half. Input by extractor, output by `Responder`: that symmetry is the heart of how actix handlers are shaped.

Throughout we'll keep growing the **articles API**. Here's the model we're returning:

```rust
use serde::Serialize;

#[derive(Serialize)]
struct Article {
    id: u32,
    title: String,
    body: String,
}
```

*What just happened:* `#[derive(Serialize)]` is from `serde`, and it's the one prerequisite for sending a struct as JSON — it teaches `Article` how to turn itself into a JSON object. Without it, none of the `.json()` calls below would compile. Everything in this chapter assumes that derive is present.

## HttpResponse: the workhorse

`HttpResponse` is a builder. Start with a status, optionally attach a body, and you're done. The status comes from a named method (`Ok()`, `Created()`, `NotFound()`, and friends), then you finish the response one of three ways: `.json(&value)` to serialize a body as JSON, `.body("…")` to send a raw body, or `.finish()` to send no body at all.

```rust
use actix_web::{get, HttpResponse, Responder};

#[get("/articles/{id}")]
async fn get_article() -> impl Responder {
    let article = Article {
        id: 1,
        title: "Hello, actix".to_string(),
        body: "An article from our API.".to_string(),
    };

    HttpResponse::Ok().json(&article)
}
```

*What just happened:* `HttpResponse::Ok()` starts a `200 OK` response, and `.json(&article)` serializes the struct into the body and sets the `Content-Type: application/json` header for you. The return type is `impl Responder` because `HttpResponse` implements `Responder` (more on that phrase at the end of the chapter) — read it as "this function returns *something that can become a response*."

Returning a list is the same move — serde serializes a `Vec<Article>` into a JSON array:

```rust
use actix_web::{get, HttpResponse, Responder};

#[get("/articles")]
async fn list_articles() -> impl Responder {
    let articles = vec![
        Article { id: 1, title: "First".to_string(), body: "…".to_string() },
        Article { id: 2, title: "Second".to_string(), body: "…".to_string() },
    ];

    HttpResponse::Ok().json(&articles)
}
```

*What just happened:* `.json()` serializes *anything* that's `Serialize`, including a `Vec` — a list of articles becomes a JSON array with no extra ceremony.

`HttpResponse` earns "workhorse" status from its other status methods. Each is a different status code, pairing naturally with `.json()`, `.body()`, or `.finish()`:

```rust
use actix_web::HttpResponse;

// 201 Created — return the thing you just made.
HttpResponse::Created().json(&article);

// 204 No Content — success, nothing to send back (e.g. a DELETE).
HttpResponse::NoContent().finish();

// 404 Not Found — no body needed.
HttpResponse::NotFound().finish();

// 400 Bad Request — a plain-text explanation.
HttpResponse::BadRequest().body("id must be a positive integer");
```

*What just happened:* each builder picks a status, and the finisher decides the body. Use `.json()` for a serializable value, `.body()` for plain text or raw bytes, `.finish()` when the status *is* the whole message (a `204` or bare `404` carries no payload). Named helpers cover the common codes; for anything exotic reach for `HttpResponse::build(StatusCode::IM_A_TEAPOT)` and build from a raw status.

> 💡 A useful instinct: the moment you want to control the status code, that's your cue to use `HttpResponse`. The other return types are conveniences that pin the status for you — great until you need to say `201` or `404`.

## web::Json: the shorthand

If your handler always returns a 200 with a JSON body, `HttpResponse::Ok().json(…)` is a touch verbose. `web::Json` is the shortcut: wrap your value in `web::Json(...)`, return it, and actix serializes it as a 200 automatically.

```rust
use actix_web::{get, web, Responder};

#[get("/articles/latest")]
async fn latest_article() -> impl Responder {
    let article = Article {
        id: 7,
        title: "Latest".to_string(),
        body: "The newest article.".to_string(),
    };

    web::Json(article)
}
```

*What just happened:* `web::Json(article)` is a responder that serializes its inner value and responds with `200 OK` — exactly what `HttpResponse::Ok().json(&article)` does, with less typing. You hand it the value by ownership (`article`), not by reference, since the wrapper takes it over.

You met `web::Json` in [Phase 2](02-routing-and-extractors.md) as an *extractor* pulling a JSON body out of the request. The same type works in both directions: as a parameter it's input, as a return value it's output.

> ⚠️ The tradeoff is real: `web::Json` *always* responds with 200. Need a `201 Created` after a POST, or a `404` when the article doesn't exist? `web::Json` can't express it — go back to `HttpResponse::Ok().json(...)` / `HttpResponse::Created().json(...)` to choose the status. Reach for `web::Json` on read paths where 200 is genuinely always correct; use `HttpResponse` everywhere the status varies.

## The trap: different branches, different types

This one bites everyone exactly once. Write a handler that returns 200 when it finds the article and 404 when it doesn't, and the compiler refuses to build it:

```rust
use actix_web::{get, web, HttpResponse, Responder};

// ⚠️ This does NOT compile.
#[get("/articles/{id}")]
async fn get_article(path: web::Path<u32>) -> impl Responder {
    let id = path.into_inner();

    if id == 0 {
        HttpResponse::NotFound().finish()   // one type…
    } else {
        web::Json(Article {                 // …a DIFFERENT type
            id,
            title: "Found".to_string(),
            body: "…".to_string(),
        })
    }
}
```

*What just happened:* the two branches return *different concrete types* — one `HttpResponse`, the other `web::Json<Article>`. `impl Responder` means "some single type that implements `Responder`," and a Rust function can only return one concrete type — even if both implement `Responder`. The compiler error, "expected `HttpResponse`, found `Json<Article>`," is its way of saying "pick one type."

The fix: make every branch produce the *same* concrete type. Easiest choice is `HttpResponse` for both, since it can represent any status:

```rust
use actix_web::{get, web, HttpResponse, Responder};

#[get("/articles/{id}")]
async fn get_article(path: web::Path<u32>) -> impl Responder {
    let id = path.into_inner();

    if id == 0 {
        HttpResponse::NotFound().finish()
    } else {
        HttpResponse::Ok().json(&Article {
            id,
            title: "Found".to_string(),
            body: "…".to_string(),
        })
    }
}
```

*What just happened:* both branches now return `HttpResponse`, so the function has a single, consistent return type and the compiler is happy. The `.finish()` path and the `.json()` path are both `HttpResponse` — status and body differ, but the type is identical, and that's all Rust cares about.

> 💡 Rule of thumb: **the moment a handler can return more than one status, return `HttpResponse` from every branch.** Save `web::Json` and bare `impl Responder` for handlers with exactly one outcome shape. (There's an even cleaner way to vary status — returning a `Result` and letting the `ResponseError` trait map errors to status codes, covered in [Phase 6](06-rest-api-and-errors.md). For now, a single `HttpResponse` type in branchy handlers is the honest, working answer.)

## impl Responder vs HttpResponse: which to write

You've now seen both in the wild — here's how to choose.

`impl Responder` in the return position means "I'm returning *some* type that implements `Responder`, and I'd rather not spell out which." It's ergonomic when there's a single, obvious response shape — a handler that always returns a `web::Json<Article>`, or always an `HttpResponse`. You let the type stay implied and keep the signature short.

`HttpResponse` is the explicit, flexible choice. Write it when you need control over the status, when different branches must agree on a type (the trap above), or when you want the signature to state plainly "this returns an HTTP response."

```rust
use actix_web::{get, web, HttpResponse, Responder};

// Single shape, terse: impl Responder is a fine fit.
#[get("/ping")]
async fn ping() -> impl Responder {
    web::Json(serde_json::json!({ "status": "ok" }))
}

// Status varies / branches: be explicit with HttpResponse.
#[get("/articles/{id}/exists")]
async fn exists(path: web::Path<u32>) -> HttpResponse {
    if path.into_inner() == 0 {
        HttpResponse::NotFound().finish()
    } else {
        HttpResponse::Ok().finish()
    }
}
```

*What just happened:* the first handler has one outcome, so `impl Responder` keeps it clean. The second can return two statuses, so it names `HttpResponse` outright — and since the return type is already concrete, both branches line up with no fuss. Both signatures are valid; the difference is flexibility (name `HttpResponse`) versus brevity (`impl Responder` for a single shape).

> 📝 Strings work too: returning a `&'static str` or `String` from a handler sends it as a `200 OK` text body — they implement `Responder` as well. Handy for a quick health-check route, rarely what you want for a real API. The articles API speaks JSON, so `HttpResponse` and `web::Json` are your day-to-day tools.

## Recap

- A handler's return type must implement **`Responder`**; the framework calls into that trait to turn your value into an HTTP response. Your job is to return the right type.
- **`HttpResponse`** is the workhorse: a builder with status helpers (`Ok`, `Created`, `NotFound`, `NoContent`, `BadRequest`) finished by `.json(&value)`, `.body("…")`, or `.finish()`. Reach for it whenever you need to control the status.
- **`web::Json(value)`** is the shorthand for "200 + JSON body" — terse, but locked to status 200. The same wrapper is an extractor on input and a responder on output.
- **Different branches must return the same concrete type.** Mixing `HttpResponse` and `web::Json` across `if` branches won't compile; use one `HttpResponse` type everywhere a handler can vary its status (or wait for [Phase 6](06-rest-api-and-errors.md)'s `Result` / `ResponseError`).
- Choose **`impl Responder`** for single-shape, terse handlers; choose **`HttpResponse`** for control and branchy handlers.

## Quick check

```quiz
[
  {
    "q": "A handler needs to return 200 with an article on success and 404 when it's missing. What return type keeps both branches compiling cleanly?",
    "choices": ["web::Json from one branch, HttpResponse from the other", "HttpResponse from both branches", "impl Responder with the two different wrapper types", "String from both branches"],
    "answer": 1,
    "explain": "Both branches must produce the same concrete type. HttpResponse can represent any status, so returning it from every branch compiles and lets you send 200 or 404."
  },
  {
    "q": "What status does returning web::Json(value) produce?",
    "choices": ["Whatever you set with .status()", "201 Created", "200 OK, always", "204 No Content"],
    "answer": 2,
    "explain": "web::Json is the shorthand for a 200 OK JSON response. To choose a different status you must switch to HttpResponse::Ok().json(...) / HttpResponse::Created().json(...)."
  },
  {
    "q": "You want a 204 No Content response after a successful delete. Which finisher fits?",
    "choices": ["HttpResponse::NoContent().json(&article)", "HttpResponse::NoContent().finish()", "web::Json(())", "HttpResponse::NoContent().body(\"deleted\")"],
    "answer": 1,
    "explain": "A 204 carries no body, so .finish() is the right finisher — it sends the status with no payload. .json() and .body() would attach a body the status says shouldn't exist."
  }
]
```

[← Phase 2: Routing & Extractors](02-routing-and-extractors.md) · [Guide overview](_guide.md) · [Phase 4: Shared State with web::Data →](04-shared-state.md)