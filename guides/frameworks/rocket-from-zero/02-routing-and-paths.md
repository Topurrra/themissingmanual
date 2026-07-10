---
title: "Routing & Dynamic Paths"
guide: "rocket-from-zero"
phase: 2
summary: "How Rocket maps URLs to functions: method attributes, dynamic path segments with FromParam, multi-segment PathBuf, optional query params, and why a route must live in routes! to ever run."
tags: [rocket, rust, routing, dynamic-paths, query]
difficulty: beginner
synonyms: ["rocket routing", "rocket dynamic path", "rocket path params", "rocket query params", "rocket fromparam", "rocket route attribute"]
updated: 2026-07-10
---

# Routing & Dynamic Paths

Phase 1 stood up a server that answered one fixed URL. Real APIs aren't fixed — `/books/42` and `/books/99` go to the same handler, with `42` and `99` riding along as data. This phase is about that wiring: how a URL turns into a function call with the right arguments already filled in.

**The path string declares the shape of the URL, and the function parameters receive the pieces.** Write `#[get("/books/<id>")]` and `<id>` is a hole in the path; the function needs a parameter literally named `id` to catch what lands there. Two rules fall out: the **names must line up** (matched by name, not position), and the **type does the parsing** — Rocket takes the raw text from the URL and tries to turn it into whatever type you declared, via a trait called `FromParam`.

> 📝 We're building a **books API** all the way through this guide. The data shape is a simple `Book { id, title, author }`. This phase focuses purely on *routing* — getting the right values into the right handlers. Real JSON comes in [Phase 4](04-responders.md); for now handlers return plain strings so the wiring stays visible.

## Method attributes: the verb and the path together

A Rocket route attribute carries two things at once — the HTTP method and the URL path. The method is the attribute *name*; the path is its argument.

```rust
#[get("/books")]
fn list() -> &'static str {
    "all books"
}

#[post("/books")]
fn create() -> &'static str {
    "created a book"
}

#[get("/books/<id>")]
fn show(id: u32) -> String {
    format!("book #{id}")
}

#[put("/books/<id>")]
fn update(id: u32) -> String {
    format!("updated book #{id}")
}

#[delete("/books/<id>")]
fn delete(id: u32) -> String {
    format!("deleted book #{id}")
}
```

*What just happened:* Five handlers, five HTTP verbs. `/books` appears twice — once for `#[get]` (list them), once for `#[post]` (create one) — and that's not a conflict: Rocket keys on **method + path together**, so `GET /books` and `POST /books` are entirely separate routes. The three `/books/<id>` routes likewise differ by verb. This is the REST shape you'll grow over the rest of the guide.

## Dynamic path segments: `<id>` to `id: u32`

`#[get("/books/<id>")] fn show(id: u32)`: the `<id>` says "this segment is a variable, call it `id`," and the function declares `id: u32`. When a request for `/books/42` arrives, Rocket pulls the text `"42"` out of that segment and asks: *can this become a `u32`?* It can, so `show` runs with `id = 42`.

That question is the whole game. The parameter type must implement **`FromParam`** — the trait that knows how to build a value from one URL segment. `u32`, `i64`, `String`, `bool`, and many more already implement it. `String` accepts anything, while `u32` only accepts digits that fit.

```rust
// /books/42   -> id = 42, show() runs
// /books/9999 -> id = 9999, show() runs
// /books/abc  -> "abc" is not a u32, so this route does NOT match
```

*What just happened:* That last line is the part people trip on. When `FromParam` parsing **fails**, Rocket doesn't error out — it decides this route **doesn't match** and moves on to try the next route. If nothing else matches `/books/abc`, the request ends in a 404. Your `id: u32` does double duty: it extracts the number *and* quietly rejects non-numbers, before a single line of your handler body runs.

> 💡 This is a feature, not a quirk. Parsing happens at the routing layer, so your handler body only ever sees a valid `u32` — no defensive `if let Ok(n) = id.parse()`. Let the signature be your validation.

### More than one segment, and "catch the rest"

Nothing stops you from having several dynamic segments. Match them all by name:

```rust
#[get("/order/<a>/<b>")]
fn order(a: u32, b: String) -> String {
    format!("a={a}, b={b}")
}
```

*What just happened:* `/order/7/express` gives `a = 7` (parsed as a number) and `b = "express"` (any text). Each `<...>` lines up with the parameter of the same name; mixing types per segment is fine.

To swallow *everything* after a point — serving files under a folder, say — use the trailing **multi-segment** form `<name..>`, which collects the rest of the path into a `PathBuf`:

```rust
use std::path::PathBuf;

#[get("/files/<path..>")]
fn files(path: PathBuf) -> String {
    format!("you asked for {}", path.display())
}
```

*What just happened:* `/files/covers/2024/rust.png` puts `covers/2024/rust.png` into `path` as a single `PathBuf`. The `..` makes it greedy across multiple segments; without it, `<path>` only matches one segment.

> ⚠️ `<path..>` hands you a `PathBuf` built from untrusted URL input. If you use it to read real files, guard against `../` directory-traversal tricks — Rocket has helpers for serving static files safely, pointed at in [Phase 8](08-where-to-go-next.md). Treat the segment as raw user input.

## Query params: the part after the `?`

Path segments are the URL's skeleton. The **query string** — everything after `?` — is for optional extras: pagination, search terms, filters. Declare query params in the attribute with `?<name>` and receive them as parameters, just like path segments. The difference is they're usually **optional**, expressed with `Option<T>`.

```rust
#[get("/books?<page>&<q>")]
fn list_books(page: Option<u32>, q: Option<String>) -> String {
    let page = page.unwrap_or(1);
    match q {
        Some(term) => format!("page {page}, searching for {term}"),
        None => format!("page {page}, no search"),
    }
}
```

*What just happened:* The path is still `/books`, but the attribute also declares two query params, joined with `&` exactly like a real URL. `GET /books` gives both as `None`. `GET /books?page=3` gives `page = Some(3)`, `q = None`. `GET /books?q=rust&page=2` fills both. Because they're `Option<T>`, a missing param isn't an error — it's `None`, and you decide the default (here, page 1).

> 💡 A plain `u32` instead of `Option<u32>` makes a query param **required** — a request missing it won't match the route. Use plain types only for params you truly always need.

When you have a *bunch* of related query params, listing them one by one gets noisy. Group them into a struct that derives **`FromForm`**, then receive the whole struct with the trailing `<params..>` form:

```rust
use rocket::form::FromForm;

#[derive(FromForm)]
struct Filter {
    page: Option<u32>,
    author: Option<String>,
}

#[get("/books?<params..>")]
fn filtered(params: Filter) -> String {
    format!("page={:?}, author={:?}", params.page, params.author)
}
```

*What just happened:* Same query string (`?page=2&author=hopper`), but collected into one tidy `Filter` value instead of a long parameter list. `FromForm` maps query (and HTML form) fields onto struct fields by name — you'll meet it again for POST bodies in [Phase 3](03-guards-and-data.md), same machinery.

## The trap: a route that exists but never runs

The single most common "why is my endpoint 404-ing?" in Rocket has nothing to do with the path. Writing `#[get(...)] fn whatever()` does **not** put the route into your application — it only *defines* it. You still have to register every handler in `routes![...]` and `mount` it onto Rocket.

```rust
#[launch]
fn rocket() -> _ {
    rocket::build().mount(
        "/",
        routes![list, create, show, update, delete, files, list_books],
    )
}
```

*What just happened:* Every handler we wrote is named in `routes![...]`. Add a new `#[get]` and forget to list it here, and Rocket compiles cleanly and starts fine — but that URL just 404s, with no error pointing at the cause.

> ⚠️ A handler missing from `routes!` fails **silently**. No compile error, no warning, no log line. When an endpoint mysteriously 404s, check `routes![...]` *first*, before touching the path string. This catches more people than any actual routing bug.

### When two routes could both match: ranking

Sometimes more than one route fits a URL, and Rocket chooses by **ranking**: more specific routes (static segments like `/books/new`) outrank less specific ones (dynamic segments like `/books/<id>`). A request to `/books/new` prefers the literal `new` route over the `<id>` catch-all — almost always what you want.

```rust
#[get("/books/new")]      // static -> ranked ahead
fn new_form() -> &'static str { "new book form" }

#[get("/books/<id>")]     // dynamic -> ranked behind
fn show(id: u32) -> String { format!("book #{id}") }
```

*What just happened:* `/books/new` hits `new_form` (the literal match wins); `/books/42` falls through to `show`. Rocket worked this ordering out for you. To override it, add `rank = N` to the attribute (lower numbers tried first) — reach for that only when the defaults genuinely don't fit.

## Recap

- A route attribute names both the **method and the path**: `#[get("/books")]`, `#[post("/books")]`, `#[put("/books/<id>")]`. Same path, different verb = different route.
- A dynamic segment `<id>` pairs with a same-named function parameter; the type implements **`FromParam`**, which parses the text and, on failure, makes the route **not match** (eventually a 404) instead of erroring.
- Use multiple `<...>` segments by name; use the trailing `<path..>` to capture the rest of the URL into a `PathBuf` (treat it as untrusted input).
- Query params go in the attribute as `?<page>&<q>` and arrive as parameters — `Option<T>` for optional, a plain type for required, or a `#[derive(FromForm)]` struct via `<params..>` to group them.
- Every handler must be listed in `routes![...]` and `mount`ed, or it **silently** won't serve. Overlapping routes are resolved by ranking (specific beats dynamic), overridable with `rank`.

## Quick check

```quiz
[
  {
    "q": "A request hits /books/abc but your only matching route is #[get(\"/books/<id>\")] fn show(id: u32). What happens?",
    "choices": ["show() runs with id set to 0", "Rocket panics at runtime", "The route doesn't match (abc isn't a u32), so it falls through — likely a 404", "It compiles but returns a 500 error"],
    "answer": 2,
    "explain": "FromParam parsing of \"abc\" into u32 fails, so the route does not match. Rocket tries other routes and, finding none, returns 404. Your handler body never runs."
  },
  {
    "q": "You added #[get(\"/health\")] fn health() but it 404s in the running app. The path is correct. What's the most likely cause?",
    "choices": ["You forgot to add `health` to routes![...] and mount it", "You need a semicolon after the attribute", "Rocket requires health checks to use #[post]", "The function name must match the path"],
    "answer": 0,
    "explain": "Defining a handler doesn't register it. It must be named in routes![...] and mounted. This omission fails silently — no compile error — so it's the first thing to check on a mystery 404."
  },
  {
    "q": "Which signature makes a `page` query param optional, defaulting to your own value when it's missing?",
    "choices": ["fn list(page: u32)", "fn list(page: Option<u32>)", "fn list(page: PathBuf)", "fn list(page: bool)"],
    "answer": 1,
    "explain": "Option<u32> means the param may be absent (None) without breaking the match, letting you supply a default. A plain u32 would make the param required, so a request without it wouldn't match the route."
  }
]
```

---

[← Phase 1: What Rocket Is & Your First Server](01-what-rocket-is.md) · [Guide overview](_guide.md) · [Phase 3: Request Guards & Data →](03-guards-and-data.md)
