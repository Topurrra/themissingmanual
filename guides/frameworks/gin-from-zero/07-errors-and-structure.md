---
title: "Error Handling & Project Structure"
guide: "gin-from-zero"
phase: 7
summary: "Make handlers thin translators between HTTP and your domain, return one consistent JSON error shape with c.Error and a middleware, map sentinel errors to status codes, and split the single-file tasks app into packages."
tags: [gin, go, errors, project-structure, layout]
difficulty: advanced
synonyms: ["gin error handling", "gin c.error", "gin abortwithstatusjson", "gin centralized errors", "gin project structure", "go web project layout", "gin handlers services"]
updated: 2026-06-23
---

# Error Handling & Project Structure

By Phase 6 the tasks API works: create a task, list them, fetch one, update, delete. But look closely
and you'll notice the handlers have quietly turned into a mess. Each one writes errors in its own little
dialect — one returns `gin.H{"error": "..."}`, another `gin.H{"message": "..."}`, a third forgets the
status code and leans on Gin's default. The business logic — "does this task exist?", "is the title
empty?" — is tangled up with the HTTP plumbing. It runs, but you wouldn't want to add a tenth route to it.

This phase fixes both problems at once, because they're the same problem wearing two hats.

## The mental model: a handler is a translator

Here's the idea to hold onto before any code:

> 💡 **A handler translates between HTTP and your domain — and nothing more.** It reads the request
> (params, JSON body), hands the *meaning* down to your logic, takes back a result or an error, and
> translates that into a status code and a JSON body. The decisions — "this title is invalid," "no task
> has that id" — happen *below* the handler, in plain Go that knows nothing about HTTP.

When you internalize that, two things follow naturally. First, handlers get short and boring (a good
thing). Second, errors stop being a per-handler improvisation: your logic raises a plain Go `error`, and
*one* place turns every error into *one* consistent JSON shape. A client should be able to write
`response.error` once and have it work for every endpoint in your API. That consistency is not a nicety —
it's the difference between an API people enjoy and one they reverse-engineer.

The rest of this phase builds toward that, in layers:

1. The basics — returning errors from inside one handler (and the `return` you must not forget).
2. Centralizing — `c.Error` plus a middleware that writes the single error shape.
3. Mapping meaning to status — sentinel errors in a service layer, matched with `errors.Is`.
4. Structure — splitting the one big file so each layer has a home.

## 1. Per-handler errors, and the `return` that bites everyone

The simplest way to report an error is right where you find it. You write a JSON body with a status code
and stop. Here's a handler that fetches one task by id from an in-memory store:

```go
func getTask(c *gin.Context) {
    id := c.Param("id")

    task, ok := tasks[id]
    if !ok {
        c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
        return
    }

    c.JSON(http.StatusOK, task)
}
```

*What just happened:* if the id isn't in the map, we write a `404` with an error body — and then `return`.
That `return` is doing real work, and forgetting it is the single most common Gin bug.

> ⚠️ **`c.JSON` does not stop your handler.** Writing a response does not end the function — Go keeps
> running the next lines. Without the `return`, this handler would write the `404` body *and then* fall
> through to `c.JSON(http.StatusOK, task)`, trying to write a second response. The status is already sent,
> so Gin logs a `headers already written` warning and the client gets a garbled body. Every error branch
> that writes a response must be followed by `return`.

There's a second helper that bundles "write and stop" into one call:

```go
func getTask(c *gin.Context) {
    id := c.Param("id")

    task, ok := tasks[id]
    if !ok {
        c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "task not found"})
        return
    }

    c.JSON(http.StatusOK, task)
}
```

*What just happened:* `AbortWithStatusJSON` writes the body **and** sets the abort flag on the context, so
no *later middleware* in the chain runs its post-`c.Next()` code as if the request succeeded. Note the
`return` is still there — abort flips a flag, it doesn't perform a Go `return` for you. Use
`AbortWithStatusJSON` when you specifically want to halt the middleware chain (auth failures, rate limits);
plain `c.JSON` + `return` is fine for ordinary "not found" type errors inside the final handler.

So far so good — but if you write this in ten handlers, you've hand-rolled the error shape ten times.
That's the problem the next two layers solve.

## 2. Centralized errors: `c.Error` + an error middleware

Gin gives the context a small superpower: every `*gin.Context` carries a slice of errors, `c.Errors`. You
can *attach* an error to it without writing any response:

```go
func getTask(c *gin.Context) {
    id := c.Param("id")

    task, ok := tasks[id]
    if !ok {
        c.Error(errors.New("task not found"))  // attaches; writes nothing
        c.Status(http.StatusNotFound)
        return
    }

    c.JSON(http.StatusOK, task)
}
```

*What just happened:* `c.Error(err)` appends the error onto `c.Errors` and returns — it does **not** touch
the response body. The handler's job shrinks to "decide the status, attach the error, get out." Something
else will turn that attached error into JSON. That "something else" is a middleware.

A middleware can run code *after* the handler by calling `c.Next()` first, then inspecting what the handler
left behind. So we write an `ErrorHandler` that, once the chain is done, checks `c.Errors` and — if there's
anything there — writes one consistent body:

```go
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        if len(c.Errors) > 0 {
            c.JSON(http.StatusInternalServerError, gin.H{"error": c.Errors.Last().Error()})
        }
    }
}
```

*What just happened:* `c.Next()` runs the rest of the chain (other middleware, then the handler). When it
returns, the handler has finished and may have attached errors. If `c.Errors` is non-empty we write the
single, canonical error shape — `{"error": "..."}` — using the last attached error. Now *every* endpoint
that calls `c.Error` produces identical JSON. Register it once, in front of everything:

```go
r := gin.Default()
r.Use(ErrorHandler())
```

*What just happened:* `r.Use` installs the middleware globally, so it wraps every route. Because it's the
one writing error responses, changing the error format for your whole API is now a one-line edit in one
place — the dream we were chasing.

> 📝 The version above always writes `500`, which is too blunt — a "not found" is a `404`, not a server
> error. The status needs to depend on *what kind* of error it is. That's exactly what the next layer adds.

## 3. Sentinel errors: mapping meaning to status

Right now the middleware can't tell a "not found" from a real crash, because `errors.New("task not
found")` is just a string. The fix is to give errors an *identity* your code can test for. A **sentinel
error** is a package-level error value you compare against:

```go
package store

import "errors"

var (
    ErrNotFound = errors.New("task not found")
    ErrEmptyTitle = errors.New("title must not be empty")
)
```

*What just happened:* these are single, shared values. Your logic returns `ErrNotFound`, and anyone holding
the error can ask "is this *that* error?" with `errors.Is(err, store.ErrNotFound)` — even if the error has
been wrapped on the way up. They're the vocabulary your domain speaks in.

Your logic returns them instead of ad-hoc strings:

```go
func (s *Store) Get(id string) (Task, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    task, ok := s.tasks[id]
    if !ok {
        return Task{}, ErrNotFound
    }
    return task, nil
}
```

*What just happened:* `Get` knows nothing about HTTP status codes — it speaks pure domain. "I couldn't find
it" is `ErrNotFound`, full stop. That's the whole point: this code is testable and reusable without dragging
a `*gin.Context` through it.

Now the handler attaches whatever the store returns, and the middleware does the translation:

```go
func getTask(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        task, err := s.Get(c.Param("id"))
        if err != nil {
            c.Error(err)
            return
        }
        c.JSON(http.StatusOK, task)
    }
}
```

```go
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        if len(c.Errors) == 0 {
            return
        }

        err := c.Errors.Last().Err
        switch {
        case errors.Is(err, store.ErrNotFound):
            c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        case errors.Is(err, store.ErrEmptyTitle):
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        default:
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
        }
    }
}
```

*What just happened:* the handler no longer decides status codes at all — it attaches the error and leaves.
The middleware uses `errors.Is` to recognize each sentinel and pick the right HTTP status: `ErrNotFound` →
`404`, `ErrEmptyTitle` → `400`, anything unrecognized → a generic `500` (and notice it does *not* leak the
raw internal error string to the client for the unknown case — you log those, you don't expose them). All
the HTTP knowledge lives here; all the domain knowledge lives in the store. Each layer does one job.

> 💡 This is the payoff of the mental model. "What does this mean?" is decided once, in the store, as a
> typed value. "What HTTP status does that meaning deserve?" is decided once, in the middleware. Handlers
> stop carrying either decision and become the thin translators they were always supposed to be.

## 4. Project structure: splitting the one big file

A single `main.go` was fine when the whole app fit on a screen. With handlers, a store, models, sentinel
errors, and middleware, it's time to give each its own package. The goal isn't ceremony — it's that you
can open the right file by name and that the compiler enforces the layering.

Here's a layout that scales without being heavy:

```
tasks-api/
  go.mod
  main.go              # wire the router + dependencies, then Run
  models/
    task.go            # the Task struct, no logic
  store/
    store.go           # in-memory store + the sentinel errors (business logic + data)
  handlers/
    tasks.go           # HTTP in, HTTP out — thin translators
  middleware/
    errors.go          # the ErrorHandler
```

*What just happened:* the dependency arrow points one way. `handlers` import `store`; `store` imports
`models`; nothing imports `handlers`. `main` is the only place that knows about all of them — it's the
wiring closet. If you ever feel tempted to import `gin` inside `store`, that's the structure telling you a
decision is in the wrong layer.

The piece that ties it together is **dependency injection** — `main` creates the store and *hands* it to
the handlers, rather than the handlers reaching for a global. That's why the handlers in step 3 were
written as `func getTask(s *store.Store) gin.HandlerFunc` — they're closures that capture the store:

```go
// main.go
package main

import (
    "os"

    "github.com/gin-gonic/gin"
    "yourmodule/handlers"
    "yourmodule/middleware"
    "yourmodule/store"
)

func main() {
    s := store.New()                  // create the one shared store

    r := gin.Default()
    r.Use(middleware.ErrorHandler())

    tasks := r.Group("/tasks")
    {
        tasks.GET("", handlers.ListTasks(s))
        tasks.POST("", handlers.CreateTask(s))
        tasks.GET("/:id", handlers.GetTask(s))
        tasks.PUT("/:id", handlers.UpdateTask(s))
        tasks.DELETE("/:id", handlers.DeleteTask(s))
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    r.Run(":" + port)
}
```

*What just happened:* `main` builds the store once and passes `s` into each handler factory, so every
request shares the same data. The handlers never see a global — they only know the store they were handed,
which makes them trivial to test (in Phase 8 you'll hand them a store you control). The route group keeps
the URLs tidy, and the middleware is registered before the routes so it wraps them all.

> 📝 **Config via the environment.** `os.Getenv("PORT")` reads the port from the environment, falling back
> to `8080` for local dev. This is the [twelve-factor](https://12factor.net/config) habit: anything that
> changes between your laptop and production — port, database URL, log level — comes from env vars or
> flags, never hard-coded. Phase 8 leans on this when you containerize and deploy.

That's the whole refactor. The app does exactly what it did at the end of Phase 6, but now a new endpoint
is a small handler in `handlers/`, a method on the store, and one line in `main` — and its errors come out
in the same shape as everything else, for free.

## Recap

- A **handler is a translator**: read HTTP in, hand meaning to your logic, translate the result or error
  back out. Validation and business decisions live *below* it.
- `c.JSON`/`c.AbortWithStatusJSON` write per-handler errors, but you must `return` after writing —
  `c.JSON` does **not** stop the handler, and falling through writes a second, broken response.
- `c.Error(err)` attaches an error to `c.Errors` without writing anything; an **error middleware** calls
  `c.Next()` then inspects `c.Errors` and writes **one consistent JSON shape** for the whole API.
- **Sentinel errors** (`var ErrNotFound = errors.New(...)`) in your service/store layer give errors an
  identity; the middleware maps them to status codes with `errors.Is`.
- Split the single file into `main` (wiring), `handlers` (HTTP), `store`/`service` (logic + data), and
  `models` — with `main` injecting the store into handlers and config coming from env vars.

## Quick check

```quiz
[
  {
    "q": "After writing an error response with c.JSON inside a handler, why must you call return?",
    "choices": ["c.JSON is asynchronous and return waits for it", "c.JSON does not stop the handler, so without return Go falls through and tries to write a second response", "return is what actually sends the body to the client", "It frees the gin.Context memory"],
    "answer": 1,
    "explain": "c.JSON only writes a response; the handler keeps running. Without return it falls through to later code and writes a second response, causing a 'headers already written' error."
  },
  {
    "q": "What does c.Error(err) do?",
    "choices": ["Immediately writes a 500 JSON response", "Appends the error to c.Errors and writes nothing, leaving the response to a later middleware", "Aborts the request and skips all remaining handlers", "Logs the error to stderr and returns"],
    "answer": 1,
    "explain": "c.Error attaches the error to the context's c.Errors slice without touching the response body. An error-handling middleware inspects c.Errors after c.Next() and writes the response."
  },
  {
    "q": "How does the error middleware turn a store's ErrNotFound into a 404 instead of a 500?",
    "choices": ["By string-matching err.Error() against 'not found'", "By checking the HTTP status the store already set", "By comparing the attached error with errors.Is(err, store.ErrNotFound) and choosing the status", "Gin maps sentinel errors to status codes automatically"],
    "answer": 2,
    "explain": "The store returns the sentinel value ErrNotFound; the middleware uses errors.Is to recognize it (even if wrapped) and picks 404. The HTTP status decision lives in one place."
  }
]
```

[← Phase 6: Building a REST API](06-building-a-rest-api.md) · [Guide overview](_guide.md) · [Phase 8: Testing & Production →](08-testing-and-production.md)
