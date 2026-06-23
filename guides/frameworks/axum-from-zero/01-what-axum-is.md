---
title: "What axum Is & Your First Server"
guide: "axum-from-zero"
phase: 1
summary: "axum maps paths to plain async fn handlers and turns their return values into responses — no macros. Install it, write a first server on Tokio, run it, and meet the Router and the books API."
tags: [axum, rust, web, tokio, getting-started]
difficulty: beginner
synonyms: ["what is axum", "axum first server", "axum router handler", "axum tokio", "rust axum hello world", "axum serve"]
updated: 2026-06-23
---

# What axum Is & Your First Server

You know [Rust](/guides/rust-from-zero), and you want to put something on the web. The honest news is
that the Rust web ecosystem can feel intimidating from the outside — async, runtimes, a tower of crates
with names like hyper and tower. axum's whole pitch is to make that disappear and leave you writing
something that looks like ordinary Rust.

Here's the move that makes axum different from a lot of frameworks in other languages: it leans on
**Rust's type system** instead of macros or magic strings. A handler is a plain `async fn`. There's no
`#[route("/users")]` annotation hanging over it, no decorator, no registration macro. You write a normal
function, and axum figures out how to call it from its argument and return types. That's the trick, and
once you see it the rest of the framework stops looking clever and starts looking obvious.

💡 This very platform — The Missing Manual — runs on axum. It has quietly become the default for new Rust
web services. It comes from the **Tokio** team and sits on two layers you'll meet later: **hyper** (the
actual HTTP implementation) and **tower** (a shared middleware abstraction). You don't need either to
start, but it's worth knowing axum isn't a walled garden — it's a thin, ergonomic skin over crates the
whole async-Rust world shares. (New to what a "web framework" even buys you over raw sockets? See
[What a Framework Even Is](/guides/what-a-framework-even-is).)

## The mental model: a Router maps paths to handlers

Before any code, hold one picture in your head. It is the whole framework.

📝 A **`Router`** maps **paths** to **handlers**. You build it once at startup, registering routes on it,
and hand it to the server to run.

📝 A **handler** is an **`async fn` whose return value becomes the response**. Return a `&'static str` and
axum sends it as text. Return a `String`, same thing. Return JSON, and it serializes it and sets the
header for you. The return type *is* the response — axum knows how to turn it into one because it
implements a trait called **`IntoResponse`** (more on that in Phase 3).

Say it once: **the Router routes the request to a handler, and the handler's return value is the
response.** That's the spine of every axum app you'll ever write.

What about a handler's *arguments*? Those are the other half — **extractors** that pull pieces out of the
request (the path, the query string, the JSON body). They're the star of the next two phases. For your
first server, the handler takes no arguments at all.

```mermaid
flowchart LR
  R[Router<br/>maps paths to handlers] --> M["route<br/>GET /"]
  M --> H["handler<br/>async fn root()"]
  H --> RESP["return value<br/>becomes the response"]
```

*One idea:* a request comes in, the Router matches it to a route, calls that route's handler, and
whatever the handler returns is sent back. Every endpoint you build flows along that arrow.

## Your first server

First, add the two dependencies. From inside your Cargo project:

```bash
cargo add axum
cargo add tokio --features full
```

*What just happened:* `cargo add axum` pulls in the framework and writes it into your `Cargo.toml`. The
second line adds **Tokio**, the async runtime axum runs on, with its `full` feature so you get
everything (the TCP listener, the multi-threaded scheduler, the macros). Your `Cargo.toml` now lists both
under `[dependencies]`. Two commands, and you're ready to write a server.

Now the smallest server that does something real. Put this in `src/main.rs`:

```rust
use axum::{routing::get, Router};

async fn root() -> &'static str {
    "Hello from axum"
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(root));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

*What just happened:* walk it from the top —
- `async fn root() -> &'static str` is the **handler**. It takes no arguments and returns a string slice.
  Because `&'static str` implements `IntoResponse`, axum knows how to send it back as a `200 OK` with that
  text as the body. No annotation on the function — it's a plain `async fn`.
- `#[tokio::main]` is the one macro you'll use. It rewrites your `async fn main` so it can run on the Tokio
  runtime — Rust's `main` can't normally be `async`, and this bridges that gap (more on *why* below).
- `Router::new().route("/", get(root))` builds the **Router** and registers one route: a `GET` request to
  `/` runs the `root` handler. `get` comes from `axum::routing` — there's a `post`, `put`, `delete`, and
  so on for the other methods. We name the finished router `app`.
- `TcpListener::bind("0.0.0.0:3000")` opens a socket on port 3000. The `.await` waits for the bind to
  finish (it's an async operation), and `.unwrap()` says "if binding fails, crash" — fine for now; Phase 7
  handles errors properly.
- `axum::serve(listener, app).await` is the engine starting. It takes the listener and your router and
  runs the accept loop forever, handing each incoming request to the router. It blocks here until you stop
  the program.

Run it like any Rust binary:

```bash
cargo run
```

axum prints nothing by default and just waits for requests. Leave it running, and in another terminal hit
the route:

```bash
curl localhost:3000
```

```console
$ curl localhost:3000
Hello from axum
```

*What just happened:* `curl` sent a `GET /`. The Router matched it to your `root` handler, called it, and
the handler's return value — `"Hello from axum"` — came back as the response body. You have a working
HTTP server in a dozen lines, and not one of them is a macro-decorated route.

## Why async, and why a runtime?

You might be wondering why `root` is `async fn` and why we needed Tokio at all. Here's the short version.

📝 A web server spends most of its life *waiting* — for a request to arrive, for a database to answer, for
another service to respond. **Async** lets one thread juggle thousands of those waits at once instead of
blocking a whole OS thread on each one. That's how a single small server handles many connections
concurrently.

But Rust's `async`/`await` is just *syntax* — it describes work that can pause and resume, and nothing
more. Something has to actually *drive* that work: poll the paused tasks, wake them when their data is
ready, and spread them across threads. That something is a **runtime**, and in axum's world it's **Tokio**.
That's why `#[tokio::main]` wraps your `main` (it starts the runtime) and why `cargo add tokio` was step
one. You don't have to understand Tokio's internals to use axum — but when you want to,
[Tokio: The Async Runtime](/guides/tokio-the-async-runtime) removes the rest of the mystery.

## The running example: a books API

We won't keep returning `"Hello from axum"`. Across this guide we'll grow one real service: a small
**books API**. The core of it is a single type — a book with an id, a title, and an author:

```rust
struct Book {
    id: u32,
    title: String,
    author: String,
}
```

*What just happened:* we declared the `Book` struct the rest of the guide builds on. Right now it's just
a plain struct. In Phase 3 we'll derive `Serialize` and `Deserialize` on it so axum can turn it into JSON
on the way out and parse it from a request body on the way in — that's how a struct becomes a real API
resource. For now you've met the cast: a **`Router`**, a **handler**, its **return value** as the
response, and the **`Book`** we'll spend the next eight phases turning into a proper REST API.

Next up: routing — multiple methods, path and query parameters (your first extractors), and nesting
routers so a growing API doesn't sprawl into one giant list.

## Recap

- **axum leans on Rust's type system, not macros.** A handler is a plain `async fn` — no route
  annotations, no decorators. axum calls it based on its argument and return types.
- **The mental model is one sentence:** a **`Router`** maps paths to handlers, and a handler is an
  **`async fn` whose return value becomes the response** (because that value implements `IntoResponse`).
  Its arguments — the extractors — come in Phases 2–3.
- **A first server is small:** `cargo add axum` and `cargo add tokio --features full`, build a
  `Router::new().route("/", get(root))`, bind a `TcpListener`, and call `axum::serve(listener, app)`. Run
  with `cargo run`, test with `curl`.
- **`#[tokio::main]` starts the runtime** so your `async main` can run. axum is async because servers
  spend their lives waiting, and **Tokio** is the runtime that drives that async work.
- **axum sits on Tokio plus hyper/tower** — it's a thin, ergonomic layer, not a walled garden. This very
  platform runs on it.
- **The throughline:** Router → handler → return value → response. We'll grow one **books API** along
  that arrow for the rest of the guide.

## Quick check

Three questions on the ideas that have to stick — what makes axum different, the Router/handler model,
and how a first server fits together:

```quiz
[
  {
    "q": "What makes an axum handler different from route definitions in many other frameworks?",
    "choices": [
      "It's a plain async fn with no route annotation — axum calls it based on its argument and return types",
      "It must be decorated with a #[route] macro that declares its path and method",
      "It has to be registered in a global config file before it can be called",
      "It must return a special Response object built by hand every time"
    ],
    "answer": 0,
    "explain": "axum leans on Rust's type system instead of macros. A handler is an ordinary async fn; you wire it to a path with Router::new().route(...), and axum figures out how to call it and how to turn its return value into a response."
  },
  {
    "q": "In `Router::new().route(\"/\", get(root))`, what does the return value of the `root` handler become?",
    "choices": [
      "The HTTP response sent back to the client, because the return type implements IntoResponse",
      "A log line printed to the server console",
      "An argument passed into the next handler in the chain",
      "Nothing — you must call a separate function to send the response"
    ],
    "answer": 0,
    "explain": "A handler's return value becomes the response. Types like &'static str, String, and Json<T> implement IntoResponse, so axum knows how to turn them into a full HTTP response automatically."
  },
  {
    "q": "Why does the first server use `#[tokio::main]` and depend on Tokio?",
    "choices": [
      "Tokio is the async runtime that drives axum's async work; #[tokio::main] starts it so main can be async",
      "Tokio is a database that axum requires to store routes",
      "Tokio compiles the handlers to machine code at startup",
      "Tokio is only needed in production, never during local development"
    ],
    "answer": 0,
    "explain": "Rust's async/await is just syntax — something has to poll and wake paused tasks. That's the runtime, Tokio. #[tokio::main] starts the runtime and lets your main function be async, which axum::serve needs."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Routing & Extractors →](02-routing-and-extractors.md)
