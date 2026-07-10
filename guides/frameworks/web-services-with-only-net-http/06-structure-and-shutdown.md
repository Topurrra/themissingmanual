---
title: "Structure, Context & Graceful Shutdown"
guide: "web-services-with-only-net-http"
phase: 6
summary: "Wire dependencies onto a struct with handler methods and a routes() seam, carry cancellation and request-scoped values through context, harden http.Server with timeouts, and shut down cleanly by draining in-flight requests."
tags: [net-http, go, structure, context, graceful-shutdown, http-server]
difficulty: advanced
synonyms: ["go http server struct", "go dependency injection handlers", "go context values ctxkey", "go graceful shutdown", "http.Server timeouts", "signal.NotifyContext"]
updated: 2026-07-10
---

# Structure, Context & Graceful Shutdown

You've got a working messages API now. It handles requests, decodes JSON, runs through middleware. And if you wrote it the way most tutorials do, it leans on package-level globals - a `var store *Store` sitting at the top of the file that every handler reaches into. That works right up until you want to write a test, run two configurations side by side, or reason about what a handler actually depends on.

The mental model for this phase: **your dependencies live on a struct, your handlers are methods on that struct, and a single `routes()` method assembles the mux.** No package globals, no `init()` magic. The struct *is* your application - you build one, hand it everything it needs, and ask it for an `http.Handler`. That one move makes the whole service testable and explicit. Then we'll make requests carry cancellation through `context`, harden the server against slow clients with timeouts, and teach it to stop without dropping the requests already in flight.

> 📝 This phase assumes you've built the messages service from [Phase 5: A JSON REST API With No Framework](05-rest-api-no-framework.md) - same handlers, same `Store`. We're not adding features; we're changing how it's *wired and run* so it survives contact with production.

## Dependencies on a struct, handlers as methods

Here's the shape. Define a `server` struct that holds everything your handlers need - the store, a logger, maybe config. Then write each handler as a *method* on `*server`, so it reaches its dependencies through `s.` instead of a global. Finally, one `routes()` method builds the mux and returns it as an `http.Handler`.

```go
type server struct {
    store  *Store
    logger *log.Logger
}

func (s *server) routes() http.Handler {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /messages", s.handleList)
    mux.HandleFunc("POST /messages", s.handleCreate)
    mux.HandleFunc("GET /messages/{id}", s.handleGet)
    return Logging(mux) // wrap the whole mux in middleware
}

func (s *server) handleList(w http.ResponseWriter, r *http.Request) {
    msgs := s.store.All() // dependency reached through the struct, not a global
    writeJSON(w, http.StatusOK, msgs)
}
```

*What just happened:* `handleList` is a method, so it has `s` - and through `s` it has the store. No global lookup. To wire the whole thing in `main`, you construct the struct once and ask it for its handler:

```go
func main() {
    s := &server{
        store:  NewStore(),
        logger: log.New(os.Stdout, "", log.LstdFlags),
    }
    http.ListenAndServe(":8080", s.routes()) // we'll improve this line below
}
```

*What just happened:* every dependency is created in one place and handed to the `server`. A handler can't secretly depend on something - if it needs it, it's a field on the struct, visible in one definition.

> 💡 This is the seam that makes testing trivial. A test builds `s := &server{store: NewStore()}`, calls `s.routes()` to get an `http.Handler`, and drives it with `httptest.NewServer(s.routes())` or `httptest.NewRecorder()` - no network, no globals, a fresh isolated store per test. That single `routes()` method is the entire wiring surface, so what your test exercises is exactly what `main` runs.

## context done right

Every request carries a `context.Context`, reachable via `r.Context()`. It's two things at once: a **cancellation signal** (the client hung up, or a deadline passed) and a **carrier for request-scoped values**. Both matter in real services.

The cancellation half is the important half. When a client disconnects, `r.Context()` is cancelled - and if you thread that context into your database and outbound HTTP calls, *they* get cancelled too, so you stop doing work nobody's waiting for:

```go
func (s *server) handleGet(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    // Pass the request context down. If the client disconnects,
    // the query is cancelled instead of running to completion for nobody.
    msg, err := s.store.db.QueryContext(r.Context(), "SELECT ... WHERE id = ?", id)
    if err != nil {
        // a cancelled request surfaces here as context.Canceled
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    writeJSON(w, http.StatusOK, msg)
}
```

*What just happened:* the `Context`-suffixed methods (`QueryContext`, `ExecContext`, `http.NewRequestWithContext`) take a context and abort if it's cancelled. Threading `r.Context()` through means a dropped client connection unwinds your whole call chain instead of leaving a query grinding away.

The other half is stashing request-scoped values - say, a request ID or an authenticated user that middleware computed and a handler later reads. You attach with `context.WithValue` and a *new* request, then read with `.Value`:

```go
type ctxKey int // unexported key type - the whole point

const userKey ctxKey = 0

func (s *server) withUser(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        user := lookupUser(r) // however you authenticate
        ctx := context.WithValue(r.Context(), userKey, user)
        next.ServeHTTP(w, r.WithContext(ctx)) // pass the enriched request down
    })
}

func (s *server) handleList(w http.ResponseWriter, r *http.Request) {
    user, _ := r.Context().Value(userKey).(*User) // read it back, type-assert
    s.logger.Printf("listing for %v", user)
    // ...
}
```

*What just happened:* middleware put a value on the context and called the next handler with `r.WithContext(ctx)` (contexts are immutable - you derive a new one and a new request). The handler reads it back with `.Value`. Note the type assertion: `Value` returns `any`, so you assert to the type you stored.

> ⚠️ Use an **unexported key type** (`type ctxKey int`), never a bare string. If you write `context.WithValue(ctx, "user", ...)`, any other package - including a library you imported - can use the string `"user"` too and silently clobber your value, or read yours. An unexported type defined in *your* package is impossible for anyone else to name, so collisions can't happen. This is the single most common context bug. Also: context values are for request-scoped data that crosses middleware boundaries, not a backdoor for passing your store around - that's what the struct is for.

## http.Server with timeouts

Look at that `main` again: `http.ListenAndServe(":8080", s.routes())`. Convenient, but it builds an `http.Server` with **no timeouts** under the hood. That's a real liability in production. A `Server` with no `ReadTimeout` will let a client open a connection, send one byte of a request header, and then... wait. Forever. Hold open enough of those and you exhaust the server's connections and memory without ever sending a complete request. That's the classic **Slowloris** attack, and bare `ListenAndServe` is wide open to it.

The fix is to construct the `http.Server` yourself and set the timeouts:

```go
srv := &http.Server{
    Addr:         ":8080",
    Handler:      s.routes(),
    ReadTimeout:  5 * time.Second,   // max time to read the full request (incl. body)
    WriteTimeout: 10 * time.Second,  // max time to write the response
    IdleTimeout:  120 * time.Second, // max time a keep-alive connection sits idle
}
srv.ListenAndServe()
```

*What just happened:* `ReadTimeout` caps how long a slow client can dribble in a request - kill the Slowloris. `WriteTimeout` caps a slow or stuck response. `IdleTimeout` reaps keep-alive connections that aren't doing anything. These are the three you almost always want; pick numbers that fit your real request shapes (big uploads need a longer read window). The point is the same: an unbounded server is a resource-exhaustion bug waiting to happen, and the fix is four extra lines.

## Graceful shutdown

When your service gets a shutdown signal - a `Ctrl+C` locally, or `SIGTERM` from your container orchestrator on a deploy - the naive behavior is to die instantly. Any request being served mid-flight just gets dropped: a half-written response, a transaction that never committed, a confused user. **Graceful shutdown** means: stop accepting *new* connections, but let the requests already in flight finish, then exit.

`http.Server.Shutdown` does exactly that. The pattern is to run the server in a goroutine, wait for a signal, then call `Shutdown` with a deadline:

```go
srv := &http.Server{
    Addr:         ":8080",
    Handler:      s.routes(),
    ReadTimeout:  5 * time.Second,
    WriteTimeout: 10 * time.Second,
}

go func() {
    // ListenAndServe blocks until the server stops. When Shutdown is called,
    // it returns http.ErrServerClosed - which is the *expected* exit, not a crash.
    if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        log.Fatal(err)
    }
}()

// Block until we get an interrupt or SIGTERM. NotifyContext cancels its
// context when one of those signals arrives.
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()
<-ctx.Done() // wait here for the signal

// Give in-flight requests up to 10s to finish before forcing the exit.
shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
if err := srv.Shutdown(shutdownCtx); err != nil {
    log.Printf("graceful shutdown failed: %v", err)
}
```

*What just happened:* the server runs in its own goroutine so `main` is free to wait. `signal.NotifyContext` gives you a context that's cancelled the moment `Ctrl+C` (`os.Interrupt`) or `SIGTERM` lands, so `<-ctx.Done()` is "block until someone asks us to stop." Then `srv.Shutdown(shutdownCtx)` stops the listener accepting new connections and waits for active requests to drain - bounded by the 10-second `shutdownCtx` so a stuck request can't hang the process forever.

> ⚠️ Two things people trip on. First: the `err != http.ErrServerClosed` check. `ListenAndServe` *always* returns a non-nil error, and after a clean `Shutdown` that error is `http.ErrServerClosed` - the normal, expected exit. If you don't special-case it, `log.Fatal` will scream about a "failure" every time you shut down cleanly. Second: `signal.NotifyContext` (Go 1.16+) replaces the older hand-rolled `signal.Notify` + channel dance - fewer moving parts, harder to get wrong.

This is the difference between "deploys cause a blip of 502s" and "deploys are invisible to users." When you wire this service up for real - behind a process manager, in a container, fronted by a load balancer - graceful shutdown is what lets the orchestrator rotate instances without dropping traffic. The deployment side of that story (health checks, rolling restarts, signal handling in containers) is covered in [Ship Your Side Project](/guides/ship-your-side-project); this is the server-side half that makes it work.

## Recap

- **Dependencies on a struct, handlers as methods.** A `server`/`app` struct holds the store, logger, and config; handlers reach them through `s.` instead of globals. One `routes()` method assembles the mux and returns an `http.Handler`.
- **That `routes()` method is the test seam.** Tests build a fresh `server`, call `routes()`, and drive it with `httptest` - no globals, no network, perfect isolation, and the same handler `main` runs.
- **`r.Context()` carries cancellation and request-scoped values.** Thread it into `QueryContext`/`NewRequestWithContext` so a dropped client unwinds your call chain. Stash values with `context.WithValue` + `r.WithContext`, read with `.Value`.
- **Always use an unexported `ctxKey` type for context keys** - never a bare string, which collides across packages.
- **Never ship bare `ListenAndServe`.** Build an `http.Server` with `ReadTimeout`, `WriteTimeout`, and `IdleTimeout` to close the door on slow-client (Slowloris) resource exhaustion.
- **Graceful shutdown drains in-flight requests.** Run the server in a goroutine, wait on `signal.NotifyContext`, call `srv.Shutdown(ctx)` with a deadline, and treat `http.ErrServerClosed` as a clean exit.

Test yourself on the two ideas that bite hardest:

```quiz
[
  {
    "q": "Why hold your dependencies on a struct with handlers as methods, instead of package-level globals?",
    "choices": ["It makes handlers run faster", "Handlers can reach deps through the struct, making the service explicit and testable with a fresh isolated server per test", "Go forbids global variables in web servers", "It is required for context to work"],
    "answer": 1,
    "explain": "Methods on a struct reach dependencies through s. instead of globals. A test builds its own server and calls routes(), getting full isolation and exercising exactly what main runs - globals make that impossible."
  },
  {
    "q": "Why must a context value key be an unexported type like `type ctxKey int` rather than a plain string?",
    "choices": ["Strings are slower as map keys", "context.WithValue rejects string keys at compile time", "A bare string key can collide with keys set by other packages, silently overwriting or leaking your value; an unexported type can't be named elsewhere", "Unexported types use less memory"],
    "answer": 2,
    "explain": "Any package can use the same string, so string keys risk silent collisions. An unexported type defined in your package can't be named by anyone else, making collisions impossible."
  },
  {
    "q": "After a clean graceful shutdown, what does srv.ListenAndServe() return, and how should you treat it?",
    "choices": ["nil - treat it as success", "http.ErrServerClosed - the expected exit; special-case it so you don't log a false failure", "A panic you must recover from", "context.Canceled - retry the server"],
    "answer": 1,
    "explain": "ListenAndServe always returns a non-nil error; after Shutdown it's http.ErrServerClosed, the normal exit. Check for it explicitly or log.Fatal will report a 'failure' on every clean shutdown."
  }
]
```

---

[← Phase 5: A JSON REST API With No Framework](05-rest-api-no-framework.md) · [Guide overview](_guide.md) · [Phase 7: What the Frameworks Add →](07-what-frameworks-add.md)
