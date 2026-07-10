---
title: "A REST API with Error Handling"
guide: "echo-from-zero"
phase: 6
summary: "Build full CRUD for the books API — five handlers over one collection — and wire Echo's centralized HTTPErrorHandler so every failure path returns one consistent JSON error shape."
tags: [echo, go, rest, api, crud, error-handling]
difficulty: advanced
synonyms: ["echo rest api", "echo crud", "echo httperror", "echo central error handler", "echo httperrorhandler", "go echo books api"]
updated: 2026-07-10
---

# A REST API with Error Handling

This is the phase where everything from the last five clicks into place. You've got routing, groups,
binding, validation, responses, and middleware. Now we assemble them into a real REST resource — and
lean hard on a feature that's been quietly waiting since Phase 3: Echo's centralized error handling.

Here's the mental model to carry through this whole phase, two ideas held together:

1. **A REST resource is five handlers over one collection.** For `books`, that's: list them all, get
   one, create one, update one, delete one. Five verbs, one slice of the world. Every CRUD API you'll
   ever write is this same shape repeated.
2. **In Echo, every failure path is "return an error."** A handler doesn't write a 404 by hand. It
   `return`s an error, and *one* place — the `HTTPErrorHandler` — decides how that error looks to the
   client. Your handlers describe *what went wrong*; the central handler decides *how it's rendered*.

Hold both at once and the code almost writes itself: five small functions, each doing its work and
either returning JSON on success or returning an error on failure. No handler ever hand-rolls an error
response.

We'll keep building the **books API**, where a book is `Book{id, title, author}`.

## The in-memory store

Before the handlers, we need somewhere to keep books. We'll use a plain map for now — no database, no
file, just memory. That keeps the focus on Echo instead of SQL.

```go
type Book struct {
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Author string `json:"author"`
}

type Store struct {
	mu     sync.RWMutex
	books  map[int]Book
	nextID int
}

func NewStore() *Store {
	return &Store{books: make(map[int]Book), nextID: 1}
}
```

*What just happened:* `Book` is the resource as the client sees it — note the `json:"..."` tags so it
serializes with lowercase keys. `Store` holds a `map[int]Book` keyed by ID, a `nextID` counter for
assigning new IDs, and — the important part — a `sync.RWMutex`. `NewStore` hands back a ready-to-use,
empty store with IDs starting at 1.

⚠️ That mutex is not optional, and this is the trap that bites people who skip it. **Echo serves
requests concurrently** — each request runs in its own goroutine. If two requests touch `books` at the
same moment (one reading while another writes), Go's map will panic with `fatal error: concurrent map
read and map write`, unrecoverable — not even the Recover middleware from Phase 5 catches it. The fix
is to guard every access: a *read* lock (`RLock`) when only reading, a full *write* lock (`Lock`) when
modifying. We'll do exactly that in each handler below.

## The five handlers

Now the heart of it. Each handler hangs off a versioned group — `g := e.Group("/api/v1")` — so all five
live under `/api/v1/books`. Each one does its work and ends one of two ways: `return c.JSON(...)` on
success, or `return echo.NewHTTPError(...)` on failure. Watch how that single rule plays out five times.

### List — `GET /api/v1/books`

```go
func (s *Store) list(c echo.Context) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]Book, 0, len(s.books))
	for _, b := range s.books {
		out = append(out, b)
	}
	return c.JSON(http.StatusOK, out)
}
```

*What just happened:* we take a read lock (`RLock`) because we're only reading — multiple list requests
can run at once without blocking each other, the whole point of `RWMutex`. We build a slice from the
map's values and return it as JSON with `200 OK`. `make([]Book, 0, ...)` matters: it guarantees an
empty store serializes to `[]`, not `null`.

### Get one — `GET /api/v1/books/:id`

```go
func (s *Store) get(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "id must be a number")
	}

	s.mu.RLock()
	book, ok := s.books[id]
	s.mu.RUnlock()

	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "book not found")
	}
	return c.JSON(http.StatusOK, book)
}
```

*What just happened:* we pull `:id` from the path (always a string) and convert it with `strconv.Atoi`.
A non-numeric id is the client's mistake, so we return a `400`. Then we look the book up under a read
lock. The comma-ok idiom (`book, ok := s.books[id]`) tells us whether it existed — if not, we
`return echo.NewHTTPError(http.StatusNotFound, "book not found")` rather than writing the 404 ourselves.
On a hit, `200` with the book.

### Create — `POST /api/v1/books`

This is where Phase 3 comes back. Bind, validate, *then* act.

```go
type CreateBook struct {
	Title  string `json:"title"  validate:"required,min=1"`
	Author string `json:"author" validate:"required"`
}

func (s *Store) create(c echo.Context) error {
	var in CreateBook
	if err := c.Bind(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	if err := c.Validate(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	s.mu.Lock()
	book := Book{ID: s.nextID, Title: in.Title, Author: in.Author}
	s.books[book.ID] = book
	s.nextID++
	s.mu.Unlock()

	return c.JSON(http.StatusCreated, book)
}
```

*What just happened:* same two-step gate from Phase 3 — `c.Bind` decodes the JSON, `c.Validate` runs
the `validate:"..."` rules, and either failure returns a `400` describing what broke. Only once both
pass do we take a full **write** lock (`Lock`, not `RLock` — we're mutating the map *and* the counter),
build the `Book` with the next ID, store it, bump the counter, and unlock. Success returns `201 Created`
with the new resource so the client learns its assigned ID.

### Update — `PUT /api/v1/books/:id`

```go
func (s *Store) update(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "id must be a number")
	}

	var in CreateBook
	if err := c.Bind(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	if err := c.Validate(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.books[id]; !ok {
		return echo.NewHTTPError(http.StatusNotFound, "book not found")
	}
	updated := Book{ID: id, Title: in.Title, Author: in.Author}
	s.books[id] = updated
	return c.JSON(http.StatusOK, updated)
}
```

*What just happened:* update is get-and-create fused. We parse the id, bind+validate the new values
(reusing the same `CreateBook` struct — no second type needed), then take a write lock. We check the
book exists first; missing means `404`. If it's there, we overwrite it — keeping the original `id` so
it stays addressable — and return `200` with the updated record. `defer s.mu.Unlock()` is safe here
even on an early return; `defer` runs on every exit path, including the 404.

### Delete — `DELETE /api/v1/books/:id`

```go
func (s *Store) delete(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "id must be a number")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.books[id]; !ok {
		return echo.NewHTTPError(http.StatusNotFound, "book not found")
	}
	delete(s.books, id)
	return c.NoContent(http.StatusNoContent)
}
```

*What just happened:* parse the id, take a write lock, confirm the book exists (`404` if not), then
`delete(s.books, id)`. The success response is `c.NoContent(http.StatusNoContent)` — a `204` with an
empty body, the conventional answer to a successful delete.

### Wiring them up

All five mount on the `/api/v1` group in `main`:

```go
func main() {
	e := echo.New()
	e.Validator = &CustomValidator{v: validator.New()} // from Phase 3

	s := NewStore()
	g := e.Group("/api/v1")
	g.GET("/books", s.list)
	g.GET("/books/:id", s.get)
	g.POST("/books", s.create)
	g.PUT("/books/:id", s.update)
	g.DELETE("/books/:id", s.delete)

	e.Logger.Fatal(e.Start(":8080"))
}
```

*What just happened:* one group, five routes, each pointing at a method on the shared `Store`. Because
the handlers are methods on `*Store`, they all close over the same map and mutex — that's how five
independent functions cooperate on one collection. We register the Phase 3 validator so `c.Validate`
works. Notice what's *not* here yet: any error-handling code. Echo already turns returned `HTTPError`s
into JSON by default — but the default shape isn't quite what we want, so let's take control.

## The payoff: a centralized `HTTPErrorHandler`

This is Echo's signature feature, the thing that makes all that `return echo.NewHTTPError(...)`
discipline pay off. Every error your handlers return — plus any error Echo itself raises (a 404 for an
unknown route, a 405 for the wrong method) — funnels through **one function**: `e.HTTPErrorHandler`.
Change that one function and you've changed how *every* error in the entire API looks.

By default, Echo's handler renders an `*echo.HTTPError` as `{"message": "..."}` with the right status,
and turns any *other* error into a generic `500`. That's fine, but say your API has standardized on
`{"error": "..."}` instead. Rather than touch thirty handlers, you write the shape once:

```go
e.HTTPErrorHandler = func(err error, c echo.Context) {
	code := http.StatusInternalServerError
	msg := "internal error"
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		msg = fmt.Sprintf("%v", he.Message)
	}
	c.JSON(code, map[string]string{"error": msg})
}
```

*What just happened:* this function receives every error a handler returns. We start with safe defaults
— `500` and a vague `"internal error"`, because an *unexpected* error (a nil-pointer deref, a failed
DB call later) should never leak its guts to the client. Then we type-assert: if the error is an
`*echo.HTTPError` (what `echo.NewHTTPError` produces), we trust its `Code` and `Message`, because *we*
chose those deliberately. Finally we render one consistent JSON body: `{"error": "..."}`, every time. A
`book not found`, a malformed `id`, and a deep `500` all come out the same shape — only status and
message differ. Register it in `main` alongside the validator:

```go
e.HTTPErrorHandler = customErrorHandler // the function above
```

💡 Across five handlers we wrote `return echo.NewHTTPError(...)` maybe eight times, and *zero* lines of
response-formatting code in any of them. The handlers stayed pure business logic — look up, check, act.
All the "what does an error look like on the wire" logic lives in one ten-line function. That's the
difference between an API that stays clean at fifty endpoints and one that rots into copy-pasted
`c.JSON(400, ...)` calls everywhere.

## Taking it for a spin

Start the server, then exercise the books API with a few `curl` calls:

```bash
# Create a book → 201
curl -s -X POST localhost:8080/api/v1/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"Dune","author":"Herbert"}'
# {"id":1,"title":"Dune","author":"Herbert"}

# List them → 200
curl -s localhost:8080/api/v1/books
# [{"id":1,"title":"Dune","author":"Herbert"}]

# Get one that doesn't exist → 404, your custom shape
curl -s localhost:8080/api/v1/books/999
# {"error":"book not found"}

# Create with an empty title → 400, validator's message
curl -s -X POST localhost:8080/api/v1/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"","author":"Nobody"}'
# {"error":"Key: 'CreateBook.Title' Error:Field validation for 'Title' failed on the 'required' tag"}

# Delete it → 204, empty body
curl -s -i -X DELETE localhost:8080/api/v1/books/1 | head -n 1
# HTTP/1.1 204 No Content
```

*What just happened:* the happy paths return the resource as JSON with the right status. The two failure
paths — a missing book and a validation miss — both come back in your `{"error": ...}` shape, even
though one originated in a handler's `NewHTTPError` and the other in the validator. That uniformity is
the centralized handler doing its job.

💡 Notice the store was the *only* part tied to memory. Every handler talks to `Store`, never to a map
directly — so when you outgrow in-memory storage, you swap `Store`'s guts for a database and the five
handlers don't change a line. [GORM From Zero](/guides/gorm-from-zero) shows how to back this exact API
with a real SQL table. Same handlers, same error handling, real persistence underneath.

## Recap

- **A REST resource is five handlers over one collection**: list (`200`), get (`200`/`404`), create
  (`201`), update (`200`/`404`), delete (`204`). The books API is this shape, mounted on a
  `g := e.Group("/api/v1")`.
- The in-memory `Store` is a `map[int]Book` plus a `sync.RWMutex` and a `nextID`. ⚠️ Echo serves
  requests concurrently — guard reads with `RLock` and writes with `Lock`, or an unguarded map will
  panic unrecoverably.
- Handlers stay clean by following one rule: **bind → validate → do work → `return c.JSON(...)` or
  `return echo.NewHTTPError(...)`**. They never hand-roll an error response.
- The **centralized `HTTPErrorHandler`** is Echo's signature feature: one function turns every returned
  error into one consistent shape (here `{"error": ...}`), with safe `500` defaults for unexpected
  errors and trusted codes/messages for `*echo.HTTPError`.
- Because every handler talks to `Store` and never to a map directly, you can swap the store for a real
  database ([GORM From Zero](/guides/gorm-from-zero)) without touching a single handler.

## Quick check

```quiz
[
  {
    "q": "Why does the in-memory Store need a sync.RWMutex?",
    "choices": ["To make the JSON serialize faster", "Because Echo serves requests concurrently, and an unguarded map read+write panics", "Because echo.NewHTTPError requires a locked store", "It's optional; maps are already concurrency-safe in Go"],
    "answer": 1,
    "explain": "Echo runs each request in its own goroutine. Concurrent read and write on a plain Go map causes an unrecoverable fatal error, so shared state must be guarded with a mutex — RLock for reads, Lock for writes."
  },
  {
    "q": "In an Echo handler, how should you report that a book wasn't found?",
    "choices": ["Call c.JSON(404, ...) with a hand-built error body", "panic(\"not found\") and let Recover handle it", "return echo.NewHTTPError(http.StatusNotFound, \"book not found\")", "Return nil and set the status separately"],
    "answer": 2,
    "explain": "The Echo style is to return an HTTPError. Handlers describe what went wrong; the centralized HTTPErrorHandler decides how it's rendered — so handlers never hand-roll error responses."
  },
  {
    "q": "What does customizing e.HTTPErrorHandler give you?",
    "choices": ["One place that turns every returned error into one consistent response shape for the whole API", "Automatic validation of every request body", "Per-route error formatting that each handler configures itself", "Faster routing for the /api/v1 group"],
    "answer": 0,
    "explain": "The HTTPErrorHandler is a single function every error funnels through. Change it once and every error in the API — from handlers and from Echo itself — comes out in the same shape, with safe 500 defaults for unexpected errors."
  }
]
```

[← Phase 5: Middleware](05-middleware.md) · [Guide overview](_guide.md) · [Phase 7: Testing & Production →](07-testing-and-production.md)
