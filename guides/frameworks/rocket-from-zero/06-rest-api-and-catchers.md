---
title: "A REST API with Error Catchers"
guide: "rocket-from-zero"
phase: 6
summary: "Wire five attribute-routed handlers over managed state into a full CRUD books API, then add #[catch(404)] error catchers for a consistent JSON error shape across the whole service."
tags: [rocket, rust, rest, api, crud, catchers]
difficulty: advanced
synonyms: ["rocket rest api", "rocket crud", "rocket catchers", "rocket catch 404", "rocket error handling", "rust rocket books api"]
updated: 2026-07-10
---

# A REST API with Error Catchers

This is the payoff phase. Everything you've built - attribute routes, dynamic paths, `Json` data, responders, managed state - comes together into a real REST resource, plus the one piece that's been missing: a single place to define what an *error* looks like across the API.

**A REST resource is five attribute-routed handlers over the managed store.** List, show one, create, update, delete - the whole vocabulary of CRUD over HTTP. Each handler pulls what it needs from the signature (`&State<AppState>` for the store, `id: u32` from the path, `Json<NewBook>` from the body), and each handler's **return type carries the per-request outcome** - an `Option` that 404s when a book is missing, a `(Status, Json<Book>)` that says "201 Created."

There's a second layer: **responders handle outcomes your handler produces; catchers handle failures the framework produces.** A typo'd URL that matches no route, a malformed JSON body that never reaches your function, a guard that rejects the request - your handler never runs for those, so it can't shape the response. That's a catcher's job.

> 📝 We're still growing the same **books API**. From Phase 5 we have the managed store, and the model from Phase 4 plus an input type for writes:
>
> ```rust
> use std::collections::HashMap;
> use std::sync::Mutex;
> use rocket::serde::{Serialize, Deserialize};
>
> #[derive(Serialize, Clone)]
> #[serde(crate = "rocket::serde")]
> struct Book {
>     id: u32,
>     title: String,
>     author: String,
> }
>
> // The shape clients send on create/update - no id, the server owns that.
> #[derive(Deserialize)]
> #[serde(crate = "rocket::serde")]
> struct NewBook {
>     title: String,
>     author: String,
> }
>
> struct AppState {
>     books: Mutex<HashMap<u32, Book>>,
> }
> ```
>
> `Book` gains `Clone` so we can hand a copy out of the lock; `NewBook` is `Deserialize` because it arrives as a JSON body.

## The five handlers

Here's the whole resource. Read it once top to bottom - notice how little ceremony there is per endpoint, and how each return type does the talking.

```rust
use rocket::State;
use rocket::http::Status;
use rocket::serde::json::Json;

// READ all - GET /books
#[get("/books")]
fn list(state: &State<AppState>) -> Json<Vec<Book>> {
    let books = state.books.lock().unwrap();
    Json(books.values().cloned().collect())
}

// READ one - GET /books/<id>
#[get("/books/<id>")]
fn show(id: u32, state: &State<AppState>) -> Option<Json<Book>> {
    let books = state.books.lock().unwrap();
    books.get(&id).cloned().map(Json)
}

// CREATE - POST /books
#[post("/books", data = "<new>")]
fn create(new: Json<NewBook>, state: &State<AppState>) -> (Status, Json<Book>) {
    let mut books = state.books.lock().unwrap();
    let id = books.keys().max().copied().unwrap_or(0) + 1;
    let book = Book { id, title: new.title.clone(), author: new.author.clone() };
    books.insert(id, book.clone());
    (Status::Created, Json(book))
}

// UPDATE - PUT /books/<id>
#[put("/books/<id>", data = "<upd>")]
fn update(id: u32, upd: Json<NewBook>, state: &State<AppState>) -> Option<Json<Book>> {
    let mut books = state.books.lock().unwrap();
    if !books.contains_key(&id) {
        return None;
    }
    let book = Book { id, title: upd.title.clone(), author: upd.author.clone() };
    books.insert(id, book.clone());
    Some(Json(book))
}

// DELETE - DELETE /books/<id>
#[delete("/books/<id>")]
fn delete(id: u32, state: &State<AppState>) -> Status {
    let mut books = state.books.lock().unwrap();
    if books.remove(&id).is_some() {
        Status::NoContent
    } else {
        Status::NotFound
    }
}
```

*What just happened:* five handlers, one per CRUD operation, all reading the shared store through `&State<AppState>` and all locking the `Mutex` before they touch the map.

- **`list`** clones every value out of the map and wraps the `Vec` in `Json` - a 200 with a JSON array. The clone leaves the lock as soon as the function returns.
- **`show`** is the Phase-4 idiom over real state: `.get(&id).cloned().map(Json)` is `Some(Json(book))` when it exists, `None` otherwise - and `None` becomes a free 404.
- **`create`** computes the next id, builds the `Book` from the `NewBook` body, inserts a clone, and returns `(Status::Created, Json(book))` - a 201 with the created record. The server assigns the id, not the client.
- **`update`** checks existence first and returns `None` (→ 404) for a missing book, otherwise replaces the record and returns it with a 200.
- **`delete`** returns the bare `Status` responder: `204 No Content` when something was removed, `404 Not Found` when there was nothing to remove.

Each "not found" here is a **responder-level outcome** - your handler ran, looked, and decided. The catchers below handle a different category of miss. Now mount them - same `routes!` you already know, just longer:

```rust
#[launch]
fn rocket() -> _ {
    rocket::build()
        .manage(AppState { books: Mutex::new(HashMap::new()) })
        .mount("/", routes![list, show, create, update, delete])
}
```

*What just happened:* `.manage(...)` registers the store so every `&State<AppState>` parameter resolves to it (Phase 5), and `routes![...]` lists all five handlers. That's a complete, working CRUD API. The next section adds the error layer.

## Error catchers: one place for what failure looks like

Try requesting `GET /bookz` (a typo). No route matches, so **none of your handlers run** - Rocket itself produces a 404, by default its generic HTML error page. For a JSON API, an HTML error in the middle of JSON responses is jarring and breaks clients that always parse the body as JSON.

This is what **catchers** are for. A catcher is a function annotated with `#[catch(<status>)]` that produces the response for a given error status when no responder did. Register catchers separately from routes, with `.register(...)`.

```rust
use rocket::serde::json::{json, Value};
use rocket::Request;

#[catch(404)]
fn not_found(req: &Request) -> Value {
    json!({ "error": "not found", "path": req.uri().path().to_string() })
}

#[catch(422)]
fn unprocessable(_req: &Request) -> Value {
    json!({ "error": "unprocessable entity", "hint": "check your JSON body and field types" })
}

#[catch(500)]
fn server_error(_req: &Request) -> Value {
    json!({ "error": "internal server error" })
}
```

*What just happened:* three catchers, one per status we care about. The `&Request` parameter gives a catcher access to the failed request - `not_found` reads `req.uri().path()` so the error body tells the client *which* path missed. The return type is `rocket::serde::json::Value`, and `json!({ ... })` builds it inline - how each catcher emits JSON instead of HTML. The status code is already decided by `#[catch(N)]`; the function only supplies the body.

> ⚠️ That **422** catcher is doing more than it looks. When a client `POST`s a body that isn't valid JSON, or is valid JSON but missing a field `NewBook` requires, the `Json<NewBook>` data guard *fails before your handler is ever called* - and Rocket signals that with **422 Unprocessable Entity**, not 400. Your `create` function never runs, so it can't shape that response. The 422 catcher is the only place you get to.

Now register them. Catchers go through `.register(base, catchers![...])`, parallel to how routes go through `.mount`:

```rust
#[launch]
fn rocket() -> _ {
    rocket::build()
        .manage(AppState { books: Mutex::new(HashMap::new()) })
        .mount("/", routes![list, show, create, update, delete])
        .register("/", catchers![not_found, unprocessable, server_error])
}
```

*What just happened:* `.register("/", catchers![...])` attaches the catchers at the `/` base, so they apply to the whole app - `catchers!` is the catcher counterpart to `routes!`. Now every framework-level 404, 422, and 500, whatever tripped it, comes back as your consistent JSON shape instead of HTML. Catchers can also be **scoped to a path** by registering them under a different base (e.g. `.register("/api", ...)`).

## Catchers vs. responder-level errors - use both

These two mechanisms are not competitors; they cover different failures, and a real API wires up both.

- **Responder-level errors** (`Option`, `Result`) - your handler *ran* and decided the outcome. "I looked up book 99, it doesn't exist, return `None`." This is a *domain* decision, and it belongs in the handler because only the handler knows the domain. (Phase 4.)
- **Catchers** (`#[catch(...)]`) - the request *failed before or outside* any handler's decision: no route matched, a data guard rejected a malformed body (→ 422), a request guard rejected the caller, or a handler panicked (→ 500). The handler can't shape these because, for most of them, it never ran.

The clean rule: **let handlers express domain outcomes with `Option`/`Result`; let catchers express framework failures with `#[catch]`.** When `show` returns `None`, Rocket turns it into a 404 - and your `#[catch(404)]` then renders the *body* for it. So the two even cooperate: the handler decides "this is a 404," the catcher decides "here's what a 404 looks like." Define the shape once, reuse it everywhere.

## Drive it from the terminal

With the server running (`cargo run`), exercise the whole resource with `curl`:

```bash
# Create a book - expect 201 Created and the new record with an id
curl -i -X POST http://127.0.0.1:8000/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"Dune","author":"Herbert"}'

# List all - expect 200 and a JSON array
curl http://127.0.0.1:8000/books

# Show one - expect 200; try a missing id for a 404 with your JSON body
curl -i http://127.0.0.1:8000/books/1
curl -i http://127.0.0.1:8000/books/999

# Update - expect 200 and the updated record
curl -i -X PUT http://127.0.0.1:8000/books/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Dune Messiah","author":"Herbert"}'

# Delete - expect 204 No Content; deleting again gives 404
curl -i -X DELETE http://127.0.0.1:8000/books/1

# Trip a catcher: a route that doesn't exist, and a malformed body
curl -i http://127.0.0.1:8000/bookz
curl -i -X POST http://127.0.0.1:8000/books \
  -H 'Content-Type: application/json' -d '{"title":"oops"'
```

*What just happened:* the first six calls walk a single book through its whole lifecycle - created (201), listed and shown (200), the missing-id show returning your catcher's JSON 404, updated (200), deleted (204), then a second delete proving the handler's own `Status::NotFound` path. The last two trip catchers: `/bookz` matches no route (framework 404), and the truncated body fails the `Json<NewBook>` guard before `create` runs (framework 422). Same JSON error shape for both, courtesy of `.register(...)`.

> 💡 This API keeps its data in a `Mutex<HashMap>`, which lives in memory and vanishes on restart. Everything above - the handlers, responders, catchers - stays the same when you swap that store for a real database via `rocket_db_pools` and a driver like `sqlx`; the route shapes and error handling don't move. The store is the detail; the resource is the design.

## Recap

- **A REST resource is five attribute-routed handlers over the managed store:** `list`, `show`, `create`, `update`, `delete` - each pulling `&State<AppState>`, path `id`, and `Json` bodies from its signature.
- **The return type carries the per-request outcome:** `Json<Vec<Book>>` and `Json<Book>` for reads, `Option<Json<Book>>` for free 404s, `(Status::Created, Json<Book>)` for a 201, and a bare `Status` for delete's 204/404.
- **Catchers handle framework-level failures** - no route matched, a data guard rejected the body, a guard rejected the caller, a panic. Define them with `#[catch(404)]`/`#[catch(422)]`/`#[catch(500)]` returning a JSON `Value`, and `.register("/", catchers![...])` them.
- **422, not 400, is Rocket's signal for a malformed or incomplete JSON body** - the `Json<T>` data guard fails before your handler runs, so only a `#[catch(422)]` can shape that response.
- **Use both layers, by their jobs:** handlers express domain outcomes with `Option`/`Result`; catchers express framework failures and standardize the error body. They cooperate - handler decides "this is a 404," catcher decides what a 404 looks like.

## Quick check

```quiz
[
  {
    "q": "A client POSTs a body that's valid JSON but missing the required \"author\" field. What status does Rocket return, and where do you shape that response?",
    "choices": ["400, inside the create handler", "422, with a #[catch(422)] catcher", "500, with a #[catch(500)] catcher", "404, with a #[catch(404)] catcher"],
    "answer": 1,
    "explain": "The Json<NewBook> data guard fails before create runs, and Rocket signals that with 422 Unprocessable Entity. Because the handler never runs, only a #[catch(422)] catcher can shape the response body."
  },
  {
    "q": "Your show handler returns None for a missing book and also has a #[catch(404)] registered. What does the client receive?",
    "choices": ["A 200 with an empty body - None means no error", "A compile error - you can't have both a None and a catcher for 404", "A 404 whose body is rendered by your #[catch(404)] catcher", "Two responses, one from each layer"],
    "answer": 2,
    "explain": "The handler's None tells Rocket 'this is a 404' (the domain decision); the #[catch(404)] catcher then renders the body for that 404. The two layers cooperate - outcome from the handler, error shape from the catcher."
  },
  {
    "q": "How do you attach catchers to a Rocket app?",
    "choices": [".mount(\"/\", catchers![...])", ".register(\"/\", catchers![...])", "Adding them to the routes![...] list", ".manage(catchers![...])"],
    "answer": 1,
    "explain": "Catchers are registered with .register(base, catchers![...]), parallel to how routes are added with .mount(base, routes![...]). The base path can scope catchers to a sub-tree of the app."
  }
]
```

[← Phase 5: Managed State & Fairings](05-state-and-fairings.md) · [Guide overview](_guide.md) · [Phase 7: Testing & Configuration →](07-testing-and-config.md)
