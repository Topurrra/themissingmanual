---
title: "Structuring & Testing"
guide: "chi-from-zero"
phase: 6
summary: "Grow the articles API into packages with a dependency-holding Handler struct, pass request-scoped values through context safely, and test the whole router with net/http/httptest."
tags: [chi, go, structure, testing, context, httptest]
difficulty: advanced
synonyms: ["chi project structure", "chi testing httptest", "go context values", "chi handlers package", "chi http handler test", "go web project layout"]
updated: 2026-06-23
---

# Structuring & Testing

You've built the whole articles API in one file. That's the right way to start — one file you can read top to bottom beats a maze of folders you have to keep jumping between. But around the time you add a second resource, or your fourth handler reaches for the same store, the single-file version starts to creak. This phase is about the move that happens next, done in the way that won't bite you later.

The mental model to hold onto: **handlers stay thin, and their dependencies are explicit.** A handler's job is to read the request, call something that does the real work, and write a response. The "something" — your store, a logger, a config — should be handed to the handler on purpose, not reached for through a package-level global. The idiom Go reaches for here is a **struct that holds the dependencies, with methods that *are* your handlers**. Wire it once in `main`, and every handler gets what it needs through the receiver. No globals, no magic.

## Handlers as methods on a struct

Here's the shape. A `Handler` struct holds whatever the handlers need — for the articles API, that's the store. The handlers become methods on it.

```go
// handlers/handlers.go
package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/go-chi/chi/v5"
    "yourmodule/store"
)

type Handler struct {
    Store *store.ArticleStore
}

func New(s *store.ArticleStore) *Handler {
    return &Handler{Store: s}
}

func (h *Handler) GetArticle(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    a, ok := h.Store.Get(id)
    if !ok {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(a)
}
```

*What just happened:* `GetArticle` is a method on `*Handler`, but its signature is still exactly `func(http.ResponseWriter, *http.Request)` — a plain `http.HandlerFunc`. The receiver `h` is how the handler reaches the store. There's no package-level `var store` anywhere; the dependency arrived through `h.Store`, which we set when we built the `Handler`. That's dependency injection, minus the ceremony.

💡 Why a method instead of a free function that takes the store as an argument? Because `http.HandlerFunc` is fixed at `(w, r)` — you can't add a `store` parameter and still satisfy the interface. Hanging the handler off a struct gives it access to dependencies *without* changing its signature. That's the whole trick.

Now wire it in `main`:

```go
// main.go
package main

import (
    "log"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "yourmodule/handlers"
    "yourmodule/store"
)

func newRouter(s *store.ArticleStore) http.Handler {
    h := handlers.New(s)

    r := chi.NewRouter()
    r.Use(middleware.Logger)

    r.Route("/api/v1/articles", func(r chi.Router) {
        r.Get("/", h.ListArticles)
        r.Post("/", h.CreateArticle)
        r.Get("/{id}", h.GetArticle)
        r.Put("/{id}", h.UpdateArticle)
        r.Delete("/{id}", h.DeleteArticle)
    })
    return r
}

func main() {
    s := store.New()
    log.Println("listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", newRouter(s)))
}
```

*What just happened:* `main` does the wiring and nothing else — create the store, build the router, start the server. We pulled the router construction into its own `newRouter(s)` function that returns an `http.Handler`. That looks like a small thing, but it's the single most important move in this phase: because `newRouter` builds the *entire* application and hands you back an `http.Handler`, your tests can call it too and exercise the real thing. Hold that thought — we'll cash it in shortly.

📝 Notice `newRouter` returns `http.Handler`, not `*chi.Mux`. Callers (including `main` and your tests) only need the `http.Handler` behavior, so that's all you promise them. A chi router *is* an `http.Handler`, so this costs nothing.

## A layout that scales

You don't need a folder for everything on day one. But once you split, a conventional Go web layout looks like this:

```
articles-api/
  go.mod
  main.go            ← build the router, wire dependencies, start the server
  handlers/
    handlers.go      ← the Handler struct + its method handlers
  store/
    store.go         ← ArticleStore: Get/List/Create/Update/Delete
  models/
    article.go       ← the Article struct (shared shape)
```

The dependency arrows all point one way: `main` imports `handlers` and `store`; `handlers` imports `store` and `models`; `store` imports `models`; `models` imports nothing. Keep it acyclic and Go stays happy (it refuses to compile import cycles anyway, which is a feature).

⚠️ Don't over-split early. A `services/`, `repository/`, `dto/`, `interfaces/` tower of folders for a CRUD app with one resource is cosplay, not architecture. Start with the four above, and only add a layer when a real second use forces it. The article in the [testing in CI guide](/guides/testing-in-ci) makes the same point about test structure: the layout should follow the code, not lead it.

## Request-scoped values through context, done right

Some data isn't part of the URL or the body — it belongs to *this request* and needs to travel from a middleware down to a handler. The authenticated user. A request ID for tracing. The standard library's answer is `context.Context`, which rides along on every `*http.Request`.

A middleware computes the value and stashes it; the handler reads it back out. Here's a request-ID example:

```go
// middleware/requestid.go
package mw

import (
    "context"
    "net/http"

    "github.com/google/uuid"
)

type ctxKey int

const requestIDKey ctxKey = 0

func RequestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := uuid.NewString()
        ctx := context.WithValue(r.Context(), requestIDKey, id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// RequestIDFrom pulls the request ID back out, in a handler.
func RequestIDFrom(ctx context.Context) (string, bool) {
    id, ok := ctx.Value(requestIDKey).(string)
    return id, ok
}
```

*What just happened:* `context.WithValue` returns a *new* context carrying the value, and `r.WithContext(ctx)` returns a *new* request wrapping it — contexts and requests are immutable, so you always build a new one and pass it forward via `next.ServeHTTP`. Downstream handlers call `r.Context().Value(requestIDKey)` (wrapped here in the tidy `RequestIDFrom` helper) to read it back.

⚠️ The trap that bites everyone: **never use a bare string as the context key.** If you write `context.WithValue(ctx, "user", u)` and some library you import also writes `context.WithValue(ctx, "user", somethingElse)`, the keys collide and silently clobber each other — no compile error, just a baffling runtime bug. The fix is an **unexported custom key type**: `type ctxKey int` lives only in your package, so no other package can ever produce a value equal to your `requestIDKey`. Make the key type unexported, make the key constant unexported, and expose getters/setters instead. That makes collisions impossible by construction.

Here's the handler side reading the value:

```go
func (h *Handler) GetArticle(w http.ResponseWriter, r *http.Request) {
    if id, ok := mw.RequestIDFrom(r.Context()); ok {
        w.Header().Set("X-Request-ID", id)
    }
    // ... rest of the handler
}
```

*What just happened:* the handler never knew or cared *how* the request ID got there — it just asks the context. That's the payoff of the pattern: middleware and handler are decoupled, talking only through a typed, collision-proof key.

💡 Context carries more than your values. `r.Context()` also propagates **cancellation and deadlines**. If the client hangs up, or you wrap a route in `middleware.Timeout(2 * time.Second)`, the context's `Done()` channel fires — and any database driver or `http.Client` call that respects `context` will abort instead of running forever. Passing `r.Context()` down into your store and outbound calls is what makes that work. Free request-scoped cancellation, as long as you thread the context through.

## Testing the whole router with httptest

Now collect on the promise from `newRouter`. Because it returns an `http.Handler`, and because the standard library ships `net/http/httptest`, you can test the *entire* stack — routing, middleware, and handler — without ever opening a real socket.

```go
// handlers/handlers_test.go
package handlers_test

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestGetArticle(t *testing.T) {
    r := newRouter(seedStore())   // your real router builder, seeded store
    req := httptest.NewRequest(http.MethodGet, "/api/v1/articles/1", nil)
    rec := httptest.NewRecorder()

    r.ServeHTTP(rec, req)

    if rec.Code != http.StatusOK {
        t.Fatalf("got %d", rec.Code)
    }
}
```

*What just happened:* `httptest.NewRequest` builds a `*http.Request` in memory, `httptest.NewRecorder` is a fake `http.ResponseWriter` that captures what the handler writes, and `r.ServeHTTP(rec, req)` runs the request through the real router exactly as a live server would. Afterward, `rec.Code`, `rec.Body`, and `rec.Header()` hold everything the handler produced. No port, no network, no flakiness.

⚠️ Here's the part people get wrong, and it's specific to routed frameworks like chi: **route through `r.ServeHTTP`, not by calling the handler directly.** It's tempting to write `h.GetArticle(rec, req)` and skip the router. Don't — because `chi.URLParam(r, "id")` reads the `id` from chi's *route context*, which only gets attached when the request passes through the router that matched the pattern `/{id}`. Call the handler directly and that context is missing: `chi.URLParam` returns an empty string and your test exercises a code path that never happens in production. Sending the request through `r.ServeHTTP` is what makes `{id}` resolve to `1`. Test the router, not the bare function.

Testing a POST is the same shape, with a body and a header:

```go
import "strings"

func TestCreateArticle(t *testing.T) {
    r := newRouter(seedStore())
    body := `{"title":"Hello","body":"World"}`
    req := httptest.NewRequest(http.MethodPost, "/api/v1/articles", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    r.ServeHTTP(rec, req)

    if rec.Code != http.StatusCreated {
        t.Fatalf("got %d, body: %s", rec.Code, rec.Body.String())
    }
}
```

*What just happened:* `strings.NewReader(body)` gives the request a JSON body to read, and `req.Header.Set("Content-Type", "application/json")` mirrors what a real client sends — if your handler checks the content type, the test now satisfies it. The router runs the full POST path: middleware, JSON decode, store write, `201 Created`. When the assertion includes `rec.Body.String()` in the failure message, a broken test tells you *why* instead of just *what*.

💡 Step back and notice what you *didn't* have to learn. There's no chi-specific test harness, no special `TestClient`, no framework mock. Because your handlers are plain `net/http` handlers and your router is a plain `http.Handler`, your tests are plain `net/http` too — `httptest` is the standard library testing the standard library. Everything you know about testing `net/http` services applies here unchanged. That's the dividend chi pays for staying compatible: the skills transfer in both directions. When you wire these tests into a pipeline, the [testing in CI guide](/guides/testing-in-ci) covers running them on every push.

## Recap

- **Thin handlers, explicit dependencies:** a `Handler` struct holds the store; its methods *are* your `http.HandlerFunc`s, getting dependencies through the receiver instead of globals.
- **Wire once in `main`**, and pull router construction into a `newRouter(s) http.Handler` function so tests can build the real application too.
- **A small package layout** — `main.go`, `handlers/`, `store/`, `models/` — scales fine; don't add layers until a real second use demands them.
- **Context carries request-scoped values** set in middleware and read in handlers — always with an **unexported custom key type** (`type ctxKey int`), never a bare string, to make collisions impossible.
- **`r.Context()` also carries cancellation and deadlines**, so threading it down into stores and outbound calls gives you free timeout propagation.
- **Test through the real router** with `httptest`: `r.ServeHTTP(rec, req)` exercises routing + middleware + handler, and is the only way `chi.URLParam` resolves — calling the handler directly leaves chi's route context empty.

## Quick check

```quiz
[
  {
    "q": "Why hang handlers off a Handler struct as methods instead of using package-level globals for the store?",
    "choices": ["chi requires handlers to be methods", "It injects dependencies through the receiver without changing the http.HandlerFunc signature", "Methods run faster than functions in Go", "Globals are not allowed in Go programs"],
    "answer": 1,
    "explain": "http.HandlerFunc is fixed at (w, r), so you can't add a store parameter. A method gets the dependency via its receiver while keeping the required signature."
  },
  {
    "q": "What's the danger of using a bare string as a context.WithValue key?",
    "choices": ["Strings are too slow as map keys", "Another package using the same string key silently collides and clobbers your value", "context.WithValue rejects string keys at compile time", "Strings can't be read back with Value()"],
    "answer": 1,
    "explain": "Two packages using the same string key collide with no compile error. An unexported custom key type (type ctxKey int) makes collisions impossible by construction."
  },
  {
    "q": "Why test through r.ServeHTTP rather than calling h.GetArticle(rec, req) directly?",
    "choices": ["Calling the handler directly panics", "Only r.ServeHTTP can use httptest.NewRecorder", "Routing through the real router attaches chi's route context, so chi.URLParam resolves the {id}", "Direct calls skip JSON encoding"],
    "answer": 2,
    "explain": "chi.URLParam reads from the route context that only gets attached when the request passes through the matching router. Call the handler directly and URLParam returns an empty string."
  }
]
```

[← Phase 5: Building a REST API](05-building-a-rest-api.md) · [Guide overview](_guide.md) · [Phase 7: Where to Go Next →](07-where-to-go-next.md)
