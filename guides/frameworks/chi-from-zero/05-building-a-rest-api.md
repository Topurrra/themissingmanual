---
title: "Building a REST API"
guide: "chi-from-zero"
phase: 5
summary: "Assemble routing, middleware, and stdlib JSON I/O into full CRUD for the articles resource — five plain http.HandlerFuncs over a mutex-guarded in-memory store, mounted on a chi sub-router."
tags: [chi, go, rest, api, crud]
difficulty: intermediate
synonyms: ["chi rest api", "chi crud", "go chi articles api", "chi handlers", "chi.URLParam crud", "go stdlib rest api"]
updated: 2026-07-10
---

# Building a REST API

This is the payoff phase. Everything so far has been a separate piece on the
workbench — the router from Phase 2, the middleware stack from Phase 3, the
JSON read/write helpers from Phase 4. Now we bolt them together into a real,
working REST API for the **articles** resource. By the end you'll have full CRUD
(create, read, update, delete) that you can hit with `curl`.

Here's the thing to hold in your head before any code:

> 📝 **A REST resource is just five plain `http.HandlerFunc`s over one
> collection, mounted on a sub-router.** List, get-one, create, update, delete —
> five functions with the identical signature `func(w http.ResponseWriter, r
> *http.Request)`. There's no framework "context" object, no special base
> class, no magic. It's the same conceptual shape you'd draw for Gin or Echo,
> but here every handler is pure standard library plus chi's router doing the
> method-and-path matching.

Let's build it from the inside out: first the place the data lives, then the five
handlers, then the routing that wires them up.

## The store: where the articles live

Before we can serve articles, we need somewhere to keep them. In a real app this
is a database. To keep this phase about *the API* and not about SQL, we'll use an
in-memory store: a `map` from ID to `Article`, plus a counter for the next ID.

But there's a trap here that catches people, so let's name it loudly.

⚠️ **`net/http` serves every request on its own goroutine.** That means two
requests can hit your store *at the same time* — one creating an article while
another lists them. A plain Go `map` is **not** safe for concurrent
read/write; do it unguarded and you'll get a runtime panic ("concurrent map
writes") under load, the kind of bug that never shows up in local testing and
takes your server down in production. The fix is a `sync.RWMutex` guarding
every access.

```go
type Article struct {
    ID    int    `json:"id"`
    Title string `json:"title"`
    Body  string `json:"body"`
}

type store struct {
    mu       sync.RWMutex
    articles map[int]Article
    nextID   int
}

func newStore() *store {
    return &store{
        articles: map[int]Article{},
        nextID:   1,
    }
}
```

*What just happened:* `Article` is the same struct from Phase 4 — plain fields
with JSON tags. `store` wraps the map together with the mutex that protects it
and the `nextID` counter. Keeping the mutex *next to* the data it guards (rather
than as a loose global) is the idiomatic Go move — it's obvious what the lock
protects. `newStore` hands back a ready-to-use store with an empty map and IDs
starting at 1.

Now the store's methods. The rule of thumb: take a **read** lock (`RLock`) when
you're only looking, take a **write** lock (`Lock`) when you're changing
anything. Read locks can be held by many goroutines at once; a write lock is
exclusive.

```go
func (s *store) list() []Article {
    s.mu.RLock()
    defer s.mu.RUnlock()

    out := make([]Article, 0, len(s.articles))
    for _, a := range s.articles {
        out = append(out, a)
    }
    return out
}

func (s *store) get(id int) (Article, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    a, ok := s.articles[id]
    return a, ok
}

func (s *store) create(title, body string) Article {
    s.mu.Lock()
    defer s.mu.Unlock()

    a := Article{ID: s.nextID, Title: title, Body: body}
    s.articles[a.ID] = a
    s.nextID++
    return a
}

func (s *store) update(id int, title, body string) (Article, bool) {
    s.mu.Lock()
    defer s.mu.Unlock()

    if _, ok := s.articles[id]; !ok {
        return Article{}, false
    }
    a := Article{ID: id, Title: title, Body: body}
    s.articles[id] = a
    return a, true
}

func (s *store) delete(id int) bool {
    s.mu.Lock()
    defer s.mu.Unlock()

    if _, ok := s.articles[id]; !ok {
        return false
    }
    delete(s.articles, id)
    return true
}
```

*What just happened:* five small methods, each locking before it touches the
map and `defer`-ing the unlock so it always releases even if something returns
early. `list` and `get` use `RLock` (read-only); `create`, `update`, and
`delete` use `Lock` (they mutate). Notice the **`(value, bool)` pattern** on
`get`, `update`, and `delete`: the `bool` says "did it exist?" — how the
handlers know whether to return a 404. `create` builds the `Article` with the
server-assigned ID, never trusting the client to pick one.

> 💡 The methods returning `bool` instead of an `error` is deliberate: "not
> found" isn't really an error here, it's a normal outcome the handler maps to a
> 404.

## The five handlers

Now the heart of it. Each handler is a closure over the store so it can reach the
data, and each one is a plain `func(w http.ResponseWriter, r *http.Request)`. We
reuse the `writeJSON` helper from Phase 4 verbatim — here it is again so this
phase stands alone:

```go
func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(v)
}
```

*What just happened:* exactly the Phase 4 helper — set the header, write the
status, encode the body, in that locked order. All five handlers respond
*through* it and never repeat that dance.

We'll also need one tiny shared step: pulling the `id` out of the URL and turning
it into an int. Three of the five handlers do this, so look at it once here and
recognize it when it reappears:

```go
idStr := chi.URLParam(r, "id")
id, err := strconv.Atoi(idStr)
if err != nil {
    http.Error(w, "id must be a number", http.StatusBadRequest)
    return
}
```

*What just happened:* `chi.URLParam(r, "id")` reads the `{id}` segment from the
path (chi's one I/O helper). It always hands back a **string**, so
`strconv.Atoi` converts it to an int. If the URL had `/articles/abc`, `Atoi`
fails and we return **400** — a non-numeric id is the client's mistake, not the
server's.

Now the handlers themselves.

### list — GET the whole collection (200)

```go
func listArticles(s *store) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        writeJSON(w, http.StatusOK, s.list())
    }
}
```

*What just happened:* the simplest one. `listArticles` is a function that
*returns* a handler (a closure capturing `s`). The handler asks the store for
every article and writes them as a JSON array with **200 OK**. Even when the list
is empty, `list()` returns a non-nil empty slice, so the client gets `[]`, not
`null` — a small kindness against special-casing the empty case.

### get — GET one by id (200 or 404)

```go
func getArticle(s *store) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        id, err := strconv.Atoi(chi.URLParam(r, "id"))
        if err != nil {
            http.Error(w, "id must be a number", http.StatusBadRequest)
            return
        }

        a, ok := s.get(id)
        if !ok {
            http.Error(w, "article not found", http.StatusNotFound)
            return
        }

        writeJSON(w, http.StatusOK, a)
    }
}
```

*What just happened:* parse the id (400 if it's not a number), then ask the
store. The store's `bool` does the work: if `ok` is false, the article doesn't
exist and we return **404** and stop; otherwise we write the single article with
**200**. The canonical get-one shape — two ways to fail, one way to succeed.

### create — POST a new one (201, with decode + manual validation)

```go
func createArticle(s *store) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var in struct {
            Title string `json:"title"`
            Body  string `json:"body"`
        }
        if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
            http.Error(w, "invalid JSON body", http.StatusBadRequest)
            return
        }

        if in.Title == "" {
            http.Error(w, "title is required", http.StatusBadRequest)
            return
        }

        a := s.create(in.Title, in.Body)
        writeJSON(w, http.StatusCreated, a)
    }
}
```

*What just happened:* the busiest handler, and it earns it. First, decode the
request body into an **input struct** (`in`) — note it has no `ID` field, because
the client doesn't get to choose the id. A decode failure is malformed JSON, so
**400**. Next, the part the stdlib won't do for you: **validation by hand.** We
check `in.Title == ""` and reject empty titles with a 400 (add more checks here
as your rules grow). Finally, `s.create` stores it with a fresh server-assigned
ID and we reply **201 Created** with the full new article, so the client learns
the id it was given.

### update — PUT to replace one (200 or 404)

```go
func updateArticle(s *store) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        id, err := strconv.Atoi(chi.URLParam(r, "id"))
        if err != nil {
            http.Error(w, "id must be a number", http.StatusBadRequest)
            return
        }

        var in struct {
            Title string `json:"title"`
            Body  string `json:"body"`
        }
        if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
            http.Error(w, "invalid JSON body", http.StatusBadRequest)
            return
        }
        if in.Title == "" {
            http.Error(w, "title is required", http.StatusBadRequest)
            return
        }

        a, ok := s.update(id, in.Title, in.Body)
        if !ok {
            http.Error(w, "article not found", http.StatusNotFound)
            return
        }

        writeJSON(w, http.StatusOK, a)
    }
}
```

*What just happened:* update is "get-one and create had a baby" — it parses the
id *and* decodes a body, validating both. The store's `update` returns the same
`(value, bool)`: if the id doesn't exist, **404**; otherwise the article is
replaced and we return the updated version with **200**. We use `PUT` here,
meaning "replace the whole article with this." (A partial update would be
`PATCH`, which is fiddlier because you must distinguish "field omitted" from
"field set to empty"; PUT sidesteps that.)

### delete — DELETE one (204 or 404)

```go
func deleteArticle(s *store) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        id, err := strconv.Atoi(chi.URLParam(r, "id"))
        if err != nil {
            http.Error(w, "id must be a number", http.StatusBadRequest)
            return
        }

        if !s.delete(id) {
            http.Error(w, "article not found", http.StatusNotFound)
            return
        }

        w.WriteHeader(http.StatusNoContent)
    }
}
```

*What just happened:* parse the id, ask the store to delete. If it wasn't there,
**404**. If it was, we set **204 No Content** and write **nothing** — no
`writeJSON`, no body at all, because 204 means "success, and there's nothing to
send back" (the empty-body rule from Phase 4; deletes are its textbook use).

## Wiring it up with a sub-router

Five handlers, and now the routing that connects HTTP methods and paths to them.
This is where Phase 2's `r.Route` shines: we mount the whole resource under one
path prefix and nest the per-id routes inside it.

```go
func main() {
    s := newStore()

    r := chi.NewRouter()
    r.Use(middleware.Logger)

    r.Route("/api/v1/articles", func(r chi.Router) {
        r.Get("/", listArticles(s))
        r.Post("/", createArticle(s))

        r.Route("/{id}", func(r chi.Router) {
            r.Get("/", getArticle(s))
            r.Put("/", updateArticle(s))
            r.Delete("/", deleteArticle(s))
        })
    })

    http.ListenAndServe(":3000", r)
}
```

*What just happened:* one store, one router, and the resource laid out as a tree.
The outer `r.Route("/api/v1/articles", ...)` groups everything under that prefix.
Inside it, `Get("/")` and `Post("/")` handle the **collection** (`/api/v1/articles`
itself) — list and create. The nested `r.Route("/{id}", ...)` handles a **single
item** (`/api/v1/articles/42`), with `Get`/`Put`/`Delete` mapping to get/update/
delete. Read the registration top to bottom and it *is* the REST table — methods
on the left, handlers on the right, paths from the nesting. `middleware.Logger`
wraps the whole thing so every request gets logged. Each handler is called with
`s` to produce the actual `http.HandlerFunc`, threading the shared store into
all five.

> 💡 The version prefix `/api/v1/` is a cheap insurance policy. When you
> eventually ship a breaking change, you add `/api/v2/` alongside it and old
> clients keep working. Costs you nothing today; saves you a migration headache
> later.

## Driving it with curl

Start the server and exercise the whole lifecycle. Here's the tour, request and
response side by side:

```bash
# Create an article -> 201
$ curl -s -X POST localhost:3000/api/v1/articles \
    -H 'Content-Type: application/json' \
    -d '{"title":"Hello chi","body":"My first article."}'
{"id":1,"title":"Hello chi","body":"My first article."}

# List them all -> 200
$ curl -s localhost:3000/api/v1/articles
[{"id":1,"title":"Hello chi","body":"My first article."}]

# Get one by id -> 200
$ curl -s localhost:3000/api/v1/articles/1
{"id":1,"title":"Hello chi","body":"My first article."}

# Update it -> 200
$ curl -s -X PUT localhost:3000/api/v1/articles/1 \
    -H 'Content-Type: application/json' \
    -d '{"title":"Hello chi (edited)","body":"Now with edits."}'
{"id":1,"title":"Hello chi (edited)","body":"Now with edits."}

# Delete it -> 204 (no body). Show the status code to prove it:
$ curl -s -o /dev/null -w '%{http_code}\n' -X DELETE localhost:3000/api/v1/articles/1
204

# Ask for it again -> 404
$ curl -s localhost:3000/api/v1/articles/1
article not found
```

*What just happened:* the full CRUD cycle, every status code from our handlers
showing up exactly where designed. Create gave a 201 and echoed back the id the
server assigned. List returned a JSON array. The DELETE returns no body, so we
used `-w '%{http_code}'` to print the bare status (204) and confirm it. The
final GET after the delete returns the 404 plain-text message from
`http.Error` — proof the article is really gone. POST a body with no title and
you get a 400 ("title is required"); GET `/api/v1/articles/abc` and you get a
400 ("id must be a number").

## The store is a stand-in

One last point, and it's the important one for where you're headed.

> 💡 **That in-memory store is a database stand-in.** We used a map + mutex so
> this phase could be about the *API shape* without dragging in SQL. But look at
> the five handlers: not one of them knows or cares that the data lives in a map.
> They call `s.list()`, `s.get(id)`, `s.create(...)`, `s.update(...)`,
> `s.delete(id)` — five methods. Swap the store's *insides* for real persistence
> with [GORM](/guides/gorm-from-zero) and those five methods become database
> queries, while the handlers, the routing, and the validation **barely change.**
> The mutex disappears (the database handles concurrency), but the seams you've
> drawn here are exactly the seams a real app uses.

The next phase makes that separation official: how to lay out handlers and
services in real files, how to pass dependencies cleanly with `context`, and how
to test all of this with `httptest` so you never have to `curl` by hand again.

## Recap

- A REST resource is **five plain `http.HandlerFunc`s over one collection**,
  mounted on a sub-router — same shape as Gin/Echo, but pure stdlib + chi
  routing, no framework context.
- The in-memory store is a `map[int]Article` guarded by a `sync.RWMutex`.
  ⚠️ `net/http` serves requests concurrently, so an unguarded map will panic —
  `RLock` to read, `Lock` to write.
- Read the id with `chi.URLParam(r, "id")` then `strconv.Atoi` (400 if it's not
  a number); decode bodies with `json.NewDecoder(r.Body).Decode`; reply through
  the Phase-4 `writeJSON` helper.
- Status codes map cleanly: list/get/update **200**, create **201**, delete
  **204** (no body), missing item **404**, bad input **400**. Validation is by
  hand — the stdlib won't do it for you.
- The `(value, bool)` pattern from the store methods is what drives the 404
  decision in the handlers.
- The store is a **database stand-in** — swap in [GORM](/guides/gorm-from-zero)
  later and the handlers barely change, because the store/handler seam is the
  real one.

## Quick check

```quiz
[
  {
    "q": "Why must the in-memory map be guarded by a sync.RWMutex?",
    "choices": ["Maps are slow without a lock", "net/http serves each request on its own goroutine, so concurrent map writes would panic", "chi requires a mutex on every handler", "It makes JSON encoding thread-safe"],
    "answer": 1,
    "explain": "net/http handles requests concurrently on separate goroutines. A plain Go map is not safe for concurrent read/write and will panic, so every access is guarded — RLock to read, Lock to write."
  },
  {
    "q": "A successful DELETE handler should return which status, and with what body?",
    "choices": ["200 OK with the deleted article as JSON", "404 Not Found with no body", "204 No Content with no body at all", "201 Created with an empty object"],
    "answer": 2,
    "explain": "A successful delete returns 204 No Content and writes nothing — 204 means success with no body, so you set the status and stop (no writeJSON)."
  },
  {
    "q": "In createArticle, why decode into a small input struct with only Title and Body instead of straight into Article?",
    "choices": ["Article has too many fields to decode", "encoding/json can't decode into a struct with an int field", "The client doesn't get to pick the id — the server assigns it, so ID isn't accepted from the body", "It makes the response faster"],
    "answer": 2,
    "explain": "The input struct is 'what the client may send.' Leaving ID out means the client can't set it; the server assigns the id in s.create, keeping it authoritative."
  }
]
```

[← Phase 4: Requests & Responses with the Standard Library](04-requests-and-responses.md) · [Guide overview](_guide.md) · [Phase 6: Structuring & Testing →](06-structure-and-testing.md)