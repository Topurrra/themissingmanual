---
title: "Request Guards & Data"
guide: "rocket-from-zero"
phase: 3
summary: "How a handler reads the request body with Json and Form, and how request guards turn auth into a type in your function signature — checked before the handler ever runs."
tags: [rocket, rust, request-guards, data, json, forms]
difficulty: intermediate
synonyms: ["rocket request guard", "rocket fromrequest", "rocket json data", "rocket forms", "rocket auth guard", "rocket data attribute"]
updated: 2026-06-23
---

# Request Guards & Data

Here is the mental model that makes the rest of Rocket click into place. Look at any handler's
parameter list and ask of each parameter one question: **is this the request body, or is this a
guard?**

- **Data** is the request body — the JSON or form a client `POST`s. There is exactly **one** data
  parameter per route, and you mark it with the `data = "<name>"` attribute.
- **A request guard** is everything else. Any non-data parameter whose type knows how to build itself
  from the incoming request — a path segment, a query value, an authenticated user, a database
  connection. Each guard must **succeed** before the handler body runs. If one fails, Rocket never
  calls your function; it forwards to another route or returns an error like `401`.

That second bullet is Rocket's signature trick. Authentication, authorization, "is this user logged
in" — they all become a **type in your signature**. You do not write `if not authenticated: return
401` at the top of every handler. You add a parameter of type `User`, and Rocket guarantees the body
only runs once that `User` exists. We will build exactly that below.

> 📝 You met one guard already without us naming it: in Phase 2, `id: usize` in
> `#[get("/books/<id>")]` was a guard backed by `FromParam`. Same machinery — a type that must
> succeed before the handler runs.

## Reading the body: `Json<T>`

Most REST work is "client sends JSON, we deserialize it." Rocket does this with `Json<T>`, where `T`
derives `Deserialize`. Json needs a feature flag, so enable it first:

```
cargo add rocket --features json
```

Now a `POST` that accepts a new book. Recall our running types — a stored `Book` has an `id`, but the
client creating one does not know the id yet, so they send a `NewBook`:

```rust
use rocket::serde::{Deserialize, Serialize};
use rocket::serde::json::Json;

#[derive(Deserialize)]
#[serde(crate = "rocket::serde")]
struct NewBook {
    title: String,
    author: String,
}

#[derive(Serialize)]
#[serde(crate = "rocket::serde")]
struct Book {
    id: usize,
    title: String,
    author: String,
}

#[post("/books", data = "<book>")]
fn create(book: Json<NewBook>) -> Json<Book> {
    let new = book.into_inner();           // unwrap Json<NewBook> -> NewBook
    let stored = Book { id: 1, title: new.title, author: new.author };
    Json(stored)
}
```

*What just happened:* The attribute `data = "<book>"` tells Rocket "the parameter named `book` is the
request body." Rocket reads the body, deserializes the JSON into `NewBook`, and hands you
`Json<NewBook>`. `.into_inner()` peels off the `Json` wrapper to get the plain struct. Returning
`Json<Book>` serializes back to JSON on the way out (more on responders in Phase 4). The
`#[serde(crate = "rocket::serde")]` line is bookkeeping — it points the derive at Rocket's re-exported
serde so you do not need serde as a separate dependency.

> ⚠️ **One data parameter per route.** A route can have many guards but only a single `data`
> parameter. A handler cannot read two bodies — there is only one request body to read.

## Reading a form: `Form<T>`

HTML forms send `application/x-www-form-urlencoded`, not JSON. Same idea, different wrapper: use
`Form<T>` with a type that derives `FromForm`.

```rust
use rocket::form::Form;

#[derive(FromForm)]
struct NewBook {
    title: String,
    author: String,
}

#[post("/books", data = "<form>")]
fn create_from_form(form: Form<NewBook>) -> String {
    let book = form.into_inner();
    format!("Got: {} by {}", book.title, book.author)
}
```

*What just happened:* Structurally this is identical to the Json version — `data = "<form>"` marks the
body, `Form<NewBook>` parses it, `.into_inner()` unwraps. The only differences are the wrapper type
(`Form` instead of `Json`) and the derive (`FromForm` instead of `Deserialize`). `FromForm` also
supports validation attributes — you can write `#[field(validate = len(1..))]` to reject an empty
title before your handler ever sees it.

## Request guards: auth as a type

This is the idea worth slowing down for. A request guard is any type that implements **`FromRequest`**
and appears as a non-data parameter. Rocket runs each guard's `from_request` against the incoming
request; if it returns `Success`, the handler runs with that value; if it returns `Error` or
`Forward`, the handler is skipped.

Let us build a tiny API-key guard. We want `/admin` to run only when the request carries the header
`x-api-key`:

```rust
use rocket::request::{self, FromRequest, Request};
use rocket::http::Status;

struct ApiKey(String);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for ApiKey {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        match req.headers().get_one("x-api-key") {
            Some(k) => request::Outcome::Success(ApiKey(k.to_string())),
            None => request::Outcome::Error((Status::Unauthorized, ())),
        }
    }
}

#[get("/admin")]
fn admin(_key: ApiKey) -> &'static str {
    "secret"  // this line only runs if the guard succeeded
}
```

*What just happened:* `ApiKey` taught Rocket how to build itself from a request — read the header, and
return `Success` with the key, or `Error((Status::Unauthorized, ()))` when it is missing. Because
`admin` takes an `ApiKey` parameter, Rocket calls `from_request` **before** the body. No header? The
handler never executes and the client gets `401 Unauthorized`. The `_key` underscore just says "I
need the guard to pass but I am not using the value here."

> 💡 This is the elegant payoff. The presence of `ApiKey` in the signature is the entire auth check.
> Swap it for a real `User` guard that validates a session cookie and looks the user up, and every
> handler that takes `user: User` is automatically logged-in-only — no boilerplate `if` at the top of
> each function, and impossible to forget, because forgetting means deleting a parameter you need.

## You don't write every guard yourself

Many guards ship with Rocket. You will meet `&State<T>` in Phase 5 — it is a guard that hands your
handler shared application state (a database pool, a config). Cookies, the client's `IpAddr`, content
types, and more are all guards too. The pattern is uniform: if a type can be derived from the request,
it can sit in your signature and be checked before your code runs.

> ⚠️ **Guard order is parameter order.** Rocket runs guards left to right. If one guard depends on
> another having already succeeded (say, a `User` guard that assumes a `Db` connection guard ran),
> list the dependency first. And remember the one rule from earlier: the single `data` parameter can
> sit anywhere in the list, but there is only ever one.

## Recap

- A handler parameter is **either the body** (one `data = "<x>"` parameter) **or a request guard**
  (every other parameter — a type that must succeed first).
- **`Json<T>`** (with `#[derive(Deserialize)]` and `cargo add rocket --features json`) reads a JSON
  body; **`Form<T>`** (with `#[derive(FromForm)]`) reads an HTML form. Unwrap either with
  `.into_inner()`.
- A **request guard** is any type implementing **`FromRequest`**; if `from_request` returns `Error`
  or `Forward`, the handler never runs (e.g. a missing API key yields `401`).
- Guards make **auth a type in the signature** — add a `User` parameter and the handler is
  logged-in-only, checked automatically, impossible to forget.
- Built-in guards exist too (`&State<T>`, cookies, and more); **guard order follows parameter order**,
  and there is **only one data parameter** per route.

## Quick check

Make sure the core idea stuck before moving on:

```quiz
[
  {
    "q": "How many `data` parameters can a single Rocket route have?",
    "choices": ["As many as you declare", "Exactly one", "One per guard", "Zero — bodies use guards"],
    "answer": 1,
    "explain": "There is only one request body, so a route has at most one data parameter. Everything else in the signature is a request guard."
  },
  {
    "q": "A handler takes an ApiKey guard whose from_request returns an Unauthorized error when the header is missing. A request arrives without the header. What happens?",
    "choices": ["The handler runs with an empty ApiKey", "The handler body runs, then returns 401", "The handler never runs; the client gets 401", "Rocket panics"],
    "answer": 2,
    "explain": "Guards run before the handler body. A failing guard means the handler is never called — Rocket returns the guard's error (401 here)."
  },
  {
    "q": "Which trait must a type implement to be usable as a request guard?",
    "choices": ["Deserialize", "FromForm", "FromRequest", "Responder"],
    "answer": 2,
    "explain": "FromRequest defines how a type builds itself from the incoming request. Deserialize and FromForm are for body data; Responder is for return types."
  }
]
```

---

[← Phase 2: Routing & Dynamic Paths](02-routing-and-paths.md) · [Guide overview](_guide.md) · [Phase 4: Responders →](04-responders.md)
