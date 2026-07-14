---
title: "Managed State & Fairings"
guide: "rocket-from-zero"
phase: 5
summary: "Share dependencies across handlers with managed state and the &State<T> guard, then hook into the whole request/response lifecycle with fairings - Rocket's middleware."
tags: [rocket, rust, state, fairings, middleware]
difficulty: advanced
synonyms: ["rocket managed state", "rocket State", "rocket manage", "rocket fairing", "rocket middleware", "rocket adhoc fairing"]
updated: 2026-07-10
---

# Managed State & Fairings

So far every handler in the books API has been an island. Phase 3 taught request guards (per-route inputs that can reject), Phase 4 taught responders (the shape of what you send back). A real service needs two more things: a place to keep **shared stuff** every handler touches - the book store, a database pool, a config value - and a way to run logic **for every request**, like logging or attaching a header. Rocket has one tool for each.

**A shared dependency is *managed state*: register it once on the builder with `.manage(value)` and pull it into any handler through the `&State<T>` guard. A cross-cutting lifecycle behavior is a *fairing*: attach it once with `.attach(...)` and it runs on every request and/or response.** State is "give me the thing." Fairings are "do this thing, always."

> 📝 This is the 🔴 advanced part of the guide because both features lean on Rust concepts you now need at the same time: shared references and interior mutability for state, and the async trait dance for fairings. Take it slowly; the payoff is that the books API stops being a toy.

## Managed state: one source of truth

Until now our handlers had nowhere to keep the books between requests. Define a struct that holds the data, hand it to Rocket with `.manage(...)`, and any handler can ask for it by adding a `&State<AppState>` parameter.

```rust
use rocket::serde::json::Json;
use rocket::State;
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Clone)]
struct Book {
    id: u32,
    title: String,
}

struct AppState {
    books: Mutex<HashMap<u32, Book>>,
}

#[get("/books")]
fn list(state: &State<AppState>) -> Json<Vec<String>> {
    let books = state.books.lock().unwrap();
    let titles = books.values().map(|b| b.title.clone()).collect();
    Json(titles)
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .manage(AppState { books: Mutex::new(HashMap::new()) })
        .mount("/", routes![list])
}
```

*What just happened:* `.manage(AppState { ... })` stored one `AppState` value inside Rocket's state registry, keyed by its type. The `list` handler asked for it by writing `state: &State<AppState>` - a request guard, exactly like Phase 3's, except this one never fails as long as you registered the type. `&State<AppState>` derefs to `&AppState`, so `state.books` reaches the field directly. Every request to `/books` sees the *same* `AppState`, so anything one handler writes, the next one reads.

### The shared-reference catch

⚠️ Look closely at that signature: `&State<AppState>` is a **shared** (`&`) reference. Rocket may run handlers concurrently, so it can only ever hand you a read-only borrow of your state - there is no `&mut State`. That's why the `books` field is a `Mutex<HashMap<...>>` and not a bare `HashMap`. To *change* the data you need **interior mutability**: you take the lock, mutate through the guard, and the lock makes concurrent access safe.

```rust
#[post("/books", data = "<book>")]
fn add(book: Json<Book>, state: &State<AppState>) -> Json<Book> {
    let mut books = state.books.lock().unwrap();
    let stored = book.into_inner();
    books.insert(stored.id, stored.clone());
    Json(stored)
}
```

*What just happened:* even though `state` is a shared reference, `state.books.lock()` returns a `MutexGuard` we can treat as `&mut HashMap`, so `insert` mutates the real, shared map. The lock is held only for the body of this function and released when `books` drops. If two requests `POST` at once, one waits for the other's lock - no torn writes. For read-heavy workloads reach for `RwLock` instead of `Mutex`; the principle is the same.

> 💡 A `Mutex<HashMap>` is fine for a demo, not how you'd store real data. For a real database you manage a **connection pool** instead - typically [`rocket_db_pools`](/guides/rocket-from-zero), which sets up the pool as managed state and gives handlers a connection through the same `&State`-style guard. Same pattern; only the type inside changes.

### You can manage more than one type

State is keyed by type, so you can `.manage(...)` several different values and ask for whichever ones a handler needs:

```rust
struct Config {
    site_name: String,
}

#[get("/about")]
fn about(config: &State<Config>) -> String {
    format!("Welcome to {}", config.site_name)
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .manage(AppState { books: Mutex::new(HashMap::new()) })
        .manage(Config { site_name: "The Stacks".into() })
        .mount("/", routes![list, add, about])
}
```

*What just happened:* we registered two distinct types - `AppState` and `Config`. The `about` handler only needs the config, so it asks for just `&State<Config>`; `list` and `add` ask for `&State<AppState>`. Rocket matches each request by the type inside `State<...>`. ⚠️ The flip side of type-keying: if a handler asks for a type you never `.manage`d, the guard fails and Rocket rejects the request (a 500 in dev), with a log line naming the missing type. The fix is always "you forgot to `.manage` it."

## Fairings: middleware for the whole lifecycle

Managed state answers "what do my handlers share?" Fairings answer "what should happen on *every* request or response, regardless of which handler runs?" Logging each request, stamping a header onto every response, setting up a resource at startup, wiring CORS - none of that belongs in any single handler. **Fairings are Rocket's middleware**: callbacks that hook into the request/response lifecycle and run globally.

The full-power way implements the `Fairing` trait: an `info()` method (a name plus which lifecycle stages you want), then async callbacks for those stages - commonly `on_request` and `on_response`, with `on_ignite`/`on_liftoff` for startup work.

```rust
use rocket::{Request, Response, Data};
use rocket::fairing::{Fairing, Info, Kind};

struct RequestLogger;

#[rocket::async_trait]
impl Fairing for RequestLogger {
    fn info(&self) -> Info {
        Info { name: "Request logger", kind: Kind::Request | Kind::Response }
    }

    async fn on_request(&self, req: &mut Request<'_>, _data: &mut Data<'_>) {
        println!("--> {} {}", req.method(), req.uri());
    }

    async fn on_response<'r>(&self, req: &'r Request<'_>, res: &mut Response<'r>) {
        println!("<-- {} for {}", res.status(), req.uri());
    }
}
```

*What just happened:* `info()` declares the fairing's name (shown in startup logs) and its `Kind` - here `Request | Kind::Response`, telling Rocket to call both callbacks. `on_request` fires before the matched handler runs and can read or tweak the incoming request; `on_response` fires after, with mutable access to the outgoing `Response`. `#[rocket::async_trait]` is what lets a trait have `async fn` methods. This single fairing now logs every request and response across the entire app - no handler had to opt in.

### Ad-hoc fairings for the quick ones

Writing a whole struct + trait impl is overkill for one tiny hook. Rocket gives you **ad-hoc fairings** via `AdHoc`: pass a name and a closure, get a fairing back.

```rust
use rocket::fairing::AdHoc;

#[launch]
fn rocket() -> _ {
    rocket::build()
        .manage(AppState { books: Mutex::new(HashMap::new()) })
        .mount("/", routes![list, add])
        .attach(RequestLogger)
        .attach(AdHoc::on_response("Server header", |_req, res| Box::pin(async move {
            res.set_raw_header("X-Server", "Rocket");
        })))
}
```

*What just happened:* `.attach(...)` registers a fairing - both `RequestLogger` and the ad-hoc one - and Rocket runs them in attach order. `AdHoc::on_response` takes a name and a closure; because the closure is async, its body is wrapped in `Box::pin(async move { ... })`. This one stamps an `X-Server: Rocket` header onto *every* response, in about four lines. CORS works the same way and is the textbook fairing use case - attach a configured `rocket_cors::Cors` fairing once and every response gains the right headers, no per-handler code.

## Guards or fairings? The deciding question

These two tools overlap enough to confuse, so here's the clean split.

> 💡 **Request guards are per-route, type-driven, and can reject.** They run only for the handler they're added to, and if one fails (bad token, missing state, malformed input) the request stops there. Use them for *inputs and access control*. **Fairings are global lifecycle hooks that run for every request/response and don't gate individual routes.** Use them for *cross-cutting concerns* - logging, response headers, CORS, startup initialization.

The litmus test: if the logic should be able to **block one specific route**, it's a guard (Phase 3). If it should **happen everywhere and just observe or decorate**, it's a fairing. Authentication that rejects unauthorized callers → guard. A header on every response → fairing. Reaching for a fairing to do per-route work means re-checking which route you're on inside a global hook - the signal you wanted a guard all along.

With shared state and lifecycle hooks in hand, the books API has a real spine. Next: full CRUD, and failing gracefully with error catchers.

## Recap

- **Managed state** is shared data registered once with `.manage(value)` and pulled into handlers via the `&State<T>` request guard. Every request sees the same value.
- `&State<T>` is a **shared** reference, so changing the data needs **interior mutability** - a `Mutex` (or `RwLock`) field. Take the lock, mutate, release.
- State is **keyed by type**: you can manage several distinct types, but asking for a type you never managed fails the request.
- For real databases you manage a **connection pool** (e.g. `rocket_db_pools`) rather than a `Mutex<HashMap>` - same pattern, production-grade type.
- **Fairings** are Rocket's middleware: implement the `Fairing` trait (`info()` + `on_request`/`on_response`, plus `on_ignite`/`on_liftoff`) or use **ad-hoc fairings**, and attach them with `.attach(...)`. They run globally.
- **Guards = per-route, can reject; fairings = global hooks (logging, headers, CORS, init).** Pick by whether the logic should block a single route.

## Quick check

```quiz
[
  {
    "q": "Why does writable managed state usually wrap its data in a Mutex?",
    "choices": ["Rocket requires every managed value to be a Mutex", "The &State<T> guard gives only a shared reference, so mutation needs interior mutability", "Mutex makes handlers run faster", "Without it the state would not be shared between requests"],
    "answer": 1,
    "explain": "Handlers receive &State<T>, a shared reference, and Rocket may run them concurrently. To mutate shared data safely you need interior mutability such as a Mutex or RwLock."
  },
  {
    "q": "A handler asks for &State<Config>, but you never called .manage(Config). What happens?",
    "choices": ["Rocket auto-creates a default Config", "It compiles but silently passes None", "The State guard fails and Rocket rejects the request", "The server refuses to start"],
    "answer": 2,
    "explain": "Managed state is keyed by type. Extracting a type you never managed makes the guard fail, so Rocket rejects that request (a 500 in dev) and logs the missing type."
  },
  {
    "q": "You want to add an X-Server header to every response your app sends. Which tool fits?",
    "choices": ["A request guard on each handler", "An ad-hoc fairing attached with .attach", "A new managed state value", "A custom responder per route"],
    "answer": 1,
    "explain": "A header on every response is a cross-cutting, global concern with no per-route gating - exactly what a fairing is for. AdHoc::on_response attached with .attach does it in a few lines."
  }
]
```

[← Phase 4: Responders](04-responders.md) · [Guide overview](_guide.md) · [Phase 6: A REST API with Error Catchers →](06-rest-api-and-catchers.md)
