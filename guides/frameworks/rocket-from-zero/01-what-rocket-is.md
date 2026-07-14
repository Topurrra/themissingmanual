---
title: "What Rocket Is & Your First Server"
guide: "rocket-from-zero"
phase: 1
summary: "Rocket is Rust's ergonomic web framework: write an attribute over a function and you have a route. Install it, write a tiny server, run it, and meet the macros that wire everything together."
tags: [rocket, rust, web, macros, getting-started]
difficulty: beginner
synonyms: ["what is rocket rs", "rocket first server", "rocket launch", "rocket get macro", "rust rocket hello world", "rocket routes"]
updated: 2026-07-10
---

# What Rocket Is & Your First Server

You know [Rust](/guides/rust-from-zero) - ownership, traits, `Result`, and the slightly
uncanny feeling of an attribute macro doing work above your function. Rust web code has a
reputation for verbosity: routers assembled by hand, handler signatures spelled out, types
threaded through builders. Rocket's answer: write `#[get("/")]` over a function, and you're done.

Rocket's whole personality is **ergonomics** - it wants your web code to read almost like Flask
or Express, even though it's Rust underneath. It gets there by leaning hard on **attribute
macros**: annotate a function with a route attribute, list your functions in `routes![...]`,
and Rocket reads those attributes and signatures and wires the whole thing together. The payoff
is concise, readable code. The price is "magic" - behavior that isn't visible on the page. This
guide makes that magic legible, one piece at a time.

## The ergonomic trade

📝 **Rocket** - a Rust web framework built around *attribute-route handlers*. You write a
normal function, put a route attribute like `#[get("/")]` above it, and that function becomes
the code that runs for that path. Routing, request parsing, and response building are all
inferred from the attribute and the function's signature.

Its sibling Rust frameworks mostly favor a *builder* style instead, assembling a router
explicitly in code:

- [**axum**](/guides/axum-from-zero) builds a `Router` and attaches handlers with method calls
  like `.route("/", get(handler))` - ordinary Rust functions and values, no custom attributes.
- [**actix-web**](/guides/actix-web-from-zero) is similar in spirit: register services and
  routes on an `App` builder, with a focus on raw throughput.
- **Rocket** is *attribute-first*: the route lives in an attribute above the function, not in a
  builder call elsewhere. Less wiring on the page, more inference under it.

💡 Attributes give you the most concise, scannable web code in the Rust ecosystem - but they
also hide machinery. When something doesn't compile, the error can point at a macro-generated
thing you never wrote. The fix is a clear mental model of what each macro *does*, which is what
we're building here. Want maximum explicitness with no macro magic? axum is the straightforward
alternative. Want maximum ergonomics? You're in the right place.

Still fuzzy on why a framework calls *your* code instead of the other way around?
[What a framework even is](/guides/what-a-framework-even-is) is worth a detour - Rocket is a
textbook case: *"don't call us, we'll call you."*

## The mental model

Lock in the one sentence that makes every Rocket example readable:

> **The attribute is the route. The function signature is the request. The return type is the
> response.** The macros wire those three together.

When you see a handler, read it in three glances: the attribute tells you *which requests land
here*, the parameters tell you *what gets pulled out of the request*, and the return type tells
you *what gets sent back*. This phase leans on the attribute and return type; the signature
(path params, query, body, and *request guards*) gets its own treatment in Phases 2 and 3.

## Your first server

Start a project and add Rocket as a dependency:

```bash
cargo new books-api
cd books-api
cargo add rocket
```

*What just happened:* `cargo new` scaffolded a normal Rust binary crate, and `cargo add rocket`
wrote Rocket into `Cargo.toml` and fetched it. Rocket 0.5 is the current stable release, fully
async under the hood - but the macros handle the async setup for you, so you won't have to
think about that yet.

Now the smallest server that does something. Replace the contents of `src/main.rs`:

```rust
#[macro_use] extern crate rocket;

#[get("/")]
fn index() -> &'static str {
    "Hello, Rocket"
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![index])
}
```

*What just happened:* read it through the three-part model.

- `#[macro_use] extern crate rocket;` pulls Rocket's macros (`get`, `routes`, `launch`, and
  friends) into scope so you can use them bare. (`use rocket::{get, routes, launch};` works too
  and skips the `extern crate` line - same result. The `#[macro_use]` form is what Rocket's own
  docs lead with.)
- `#[get("/")]` is **the route**: "when a `GET` request arrives for the path `/`, run the
  function below." The attribute *is* the routing - there's no separate router line that
  mentions `index`.
- `fn index() -> &'static str { ... }` is the handler. It takes no parameters (nothing needed
  from the request yet), and its **return type is the response**: Rocket turns a `&'static str`
  into a proper HTTP response with the right `Content-Type`, so you return a plain string and
  Rocket does the wrapping.
- `rocket::build()` creates the application - an empty Rocket instance you then configure.
- `.mount("/", routes![index])` attaches your handlers. `routes![index]` collects the listed
  functions into a list Rocket understands, and `mount` hangs them off a base path (`/` here, so
  `index` answers at `/`). A hundred handlers is the same call with a longer `routes![...]`.
- `#[launch]` sits on a function that *returns the built Rocket*, turning it into the program's
  entry point. Note the return type is a bare `-> _` - the macro fills in the real (long, async)
  type for you. That underscore isn't a typo.

Now run it:

```bash
cargo run
```

```console
$ cargo run
🚀 Rocket has launched from http://127.0.0.1:8000
```

*What just happened:* `cargo run` compiled and started your server. On launch, Rocket prints its
configuration and the address it bound to - by default **port 8000** on localhost. Hit it from
another terminal:

```bash
curl localhost:8000
```

```console
$ curl localhost:8000
Hello, Rocket
```

*What just happened:* the request for `/` matched your `#[get("/")]` route, Rocket called
`index()`, took the `&'static str` it returned, and sent it back as the response body. A
working Rust web server in a handful of lines - none of them a hand-assembled router.

## `#[launch]` vs. writing `main` yourself

`#[launch]` is a convenience. Rocket is async, so the "real" entry point is an async `main`
running on Rocket's runtime - you *can* write it out by hand:

```rust
#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    rocket::build()
        .mount("/", routes![index])
        .launch()
        .await?;
    Ok(())
}
```

*What just happened:* `#[rocket::main]` sets up the async runtime so you can write an
`async fn main`, and you explicitly `.launch().await?` the built app yourself - exactly what
`#[launch]` generates under the hood.

💡 Use `#[launch]` unless you need to run code *before* the server starts (opening a database
connection, reading a startup file with `?` error handling). It's the right default here - it
keeps the entry point to a single expression.

## Our running example: a books API

Throughout this guide we grow one small service: a **books API**. The thing we're serving is a
book:

```rust
struct Book {
    id: u32,
    title: String,
    author: String,
}
```

*What just happened:* nothing yet - just a plain Rust struct. But it's the spine of every phase
ahead: route to individual books by `id` (Phase 2), accept new ones as JSON bodies (Phase 3),
return them as JSON (Phase 4), store them in shared state (Phase 5), and wrap it all in a real
CRUD API with error handling (Phase 6). Next up: the part we skipped - the signature - starting
with paths that carry data, like `/books/<id>`.

## Recap

1. **Rocket is the ergonomic Rust web framework:** you write a function, put a route attribute
   like `#[get("/")]` above it, and that function becomes the handler. The code reads close to
   Flask or Express.
2. The trade vs. siblings: **axum** and **actix-web** favor explicit *builders*
   (`Router::new().route(...)`), while **Rocket** is *attribute-first* - concise and scannable,
   at the cost of macro "magic" this guide makes legible.
3. The mental model that unlocks everything: **the attribute is the route, the function signature
   is the request, and the return type is the response** - macros wire them together.
4. A first server is tiny: `#[get("/")]` over a handler, `rocket::build().mount("/", routes![index])`,
   and `#[launch]` as the entry point. Run with `cargo run`; Rocket prints its config and binds
   to **port 8000** by default.
5. **`#[launch]`** is shorthand for a hand-written `#[rocket::main] async fn main` that builds and
   `.launch().await`s the app. Use `#[launch]` unless you need setup code before the server starts.
6. The running example is a **books API** built around a `Book { id, title, author }` struct,
   which we'll grow across the guide.

## Quick check

Three questions on the ideas that have to stick - what makes Rocket *Rocket*, what the core
macros do, and how the entry point works:

```quiz
[
  {
    "q": "What is Rocket's defining design choice compared to axum and actix-web?",
    "choices": [
      "It defines routes with attribute macros placed above handler functions, rather than assembling a router with explicit builder calls",
      "It is the only Rust web framework that is synchronous instead of async",
      "It ships a built-in ORM and admin panel like a batteries-included framework",
      "It compiles to JavaScript so it can run in the browser"
    ],
    "answer": 0,
    "explain": "Rocket is attribute-first: #[get(\"/\")] above a function declares the route. axum and actix-web favor explicit builders like Router::new().route(...). The trade is ergonomic, concise code at the cost of macro magic."
  },
  {
    "q": "In the minimal server, what does `.mount(\"/\", routes![index])` do?",
    "choices": [
      "Attaches the handlers listed in routes![...] to the application at the base path \"/\"",
      "Starts the web server and blocks waiting for requests",
      "Declares that index() responds to POST requests instead of GET",
      "Reads the Rocket.toml config file and applies it"
    ],
    "answer": 0,
    "explain": "routes![index] is a macro that collects the listed handler functions, and .mount(\"/\", ...) hangs them off a base path on the built Rocket instance. The route attribute (#[get]) is what sets the method and path; #[launch] is what starts the server."
  },
  {
    "q": "What does the `#[launch]` attribute do?",
    "choices": [
      "It turns a function that returns the built Rocket into the program's entry point and runs the app - shorthand for a manual #[rocket::main] async fn main that builds then .launch().await's it",
      "It launches a separate browser window to preview the API",
      "It marks a handler as the default route when no other path matches",
      "It is required on every handler function, not just the entry point"
    ],
    "answer": 0,
    "explain": "#[launch] sits on a function returning the built Rocket (note the bare -> _, which the macro fills in). It generates the async entry point that builds and launches the app, so you don't write #[rocket::main] async fn main yourself."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Routing & Dynamic Paths →](02-routing-and-paths.md)
