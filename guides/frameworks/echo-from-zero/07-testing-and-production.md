---
title: "Testing & Production"
guide: "echo-from-zero"
phase: 7
summary: "Test Echo in-memory with net/http/httptest (no ports) using NewContext or ServeHTTP, then ship it: HideBanner/HidePort, real server timeouts, graceful shutdown, and a static-binary container behind a proxy."
tags: [echo, go, testing, httptest, production, graceful-shutdown]
difficulty: intermediate
synonyms: ["echo testing", "echo httptest", "echo newcontext", "echo graceful shutdown", "echo production", "echo deploy", "go server timeouts"]
updated: 2026-07-10
---

# Testing & Production

You've grown the books API from a single route into a real CRUD service with a centralized error handler. Two questions are left, and they decide whether anyone runs this in anger: can you *prove* it works, and can you run it somewhere real without it dying during a 3am deploy? Both answers are smaller than you'd expect, because both rest on the same fact about what Echo actually is.

## The mental model: your router is an `http.Handler`, so testing is calling it in memory

Here's the fact that makes everything in this phase easy. An `*echo.Echo` — the instance you get from `echo.New()` — satisfies Go's `http.Handler` interface. It has a `ServeHTTP(w, r)` method — the *exact* same interface the standard library's `http.Server` uses to feed it live requests off a socket.

> 💡 If your router is an `http.Handler`, a test is nothing more than calling `ServeHTTP` yourself with a fake request and a fake response writer. No network. No port. No goroutine running a server in the background. You hand Echo a request, it fills in a response, you read it back — all in memory, in microseconds.

The standard library hands you the two fakes you need in `net/http/httptest`:

- `httptest.NewRequest(method, target, body)` builds a `*http.Request` without a real connection.
- `httptest.NewRecorder()` gives you a `*httptest.ResponseRecorder` — a response writer that records the status, headers, and body into fields you can inspect (`rec.Code`, `rec.Body`).

Wire those together with the same router your `main` uses, and you've tested a route end to end without opening a socket.

```go
package main

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestListBooks(t *testing.T) {
    e := setupRouter()

    req := httptest.NewRequest(http.MethodGet, "/api/v1/books", nil)
    rec := httptest.NewRecorder()
    e.ServeHTTP(rec, req)

    if rec.Code != http.StatusOK {
        t.Fatalf("got %d, want 200", rec.Code)
    }

    var got []Book
    if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
        t.Fatalf("response wasn't valid JSON: %v", err)
    }
}
```

*What just happened:* we built the same router the real app uses (`setupRouter()` — more in a second), made a recorder and a GET request for `/api/v1/books`, and called `e.ServeHTTP(rec, req)`. That one call runs the *entire* chain — middleware, routing, your handler, and Echo's error handler — exactly as a live request would, except nothing left the process. Afterward `rec.Code` holds the status and `rec.Body` is a `*bytes.Buffer` with the response body, which we unmarshal to confirm the JSON shape.

Testing a **POST** is the same shape with two additions: pass a body, and set the content type so Echo's `c.Bind` knows it's JSON.

```go
func TestCreateBook(t *testing.T) {
    e := setupRouter()

    body := `{"title":"The Go Programming Language","author":"Donovan & Kernighan"}`
    req := httptest.NewRequest(http.MethodPost, "/api/v1/books", strings.NewReader(body))
    req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
    rec := httptest.NewRecorder()
    e.ServeHTTP(rec, req)

    if rec.Code != http.StatusCreated {
        t.Fatalf("got %d, want 201", rec.Code)
    }
}
```

*What just happened:* `strings.NewReader(body)` turns our JSON string into an `io.Reader`, which is what the request body wants. Setting the content type via Echo's own constants (`echo.HeaderContentType` and `echo.MIMEApplicationJSON` — just `"Content-Type"` and `"application/json"` spelled safely) matters — without it, `c.Bind` won't treat the body as JSON, and you'd be testing the wrong path. We assert `201 Created`. (To test inputs you *expect* to fail — a missing title, a malformed body — send the bad payload and assert the `400` and error message your validation produces.)

This is the heart of testing an Echo app. The rest — table-driven cases, golden files, running it all on every push — is general Go testing, covered in [testing in CI](/guides/testing-in-ci).

## Two test styles, and the `setupRouter()` you build once

There are two ways to drive Echo in a test, and it's worth knowing both because they answer different questions.

The **full-router style** is what you saw above: `e.ServeHTTP(rec, req)`. It exercises the *real* path — routing matches the URL, every middleware runs, the error handler fires. This is what you want most of the time, because it tests the wiring, not just the function.

The **handler-level style** skips routing and middleware and calls one handler directly. You build a context by hand with `e.NewContext`, invoke the handler, and inspect the recorder:

```go
func TestGetBookHandler(t *testing.T) {
    e := echo.New()
    req := httptest.NewRequest(http.MethodGet, "/", nil)
    rec := httptest.NewRecorder()
    c := e.NewContext(req, rec)
    c.SetParamNames("id")
    c.SetParamValues("1")

    if err := getBook(c); err != nil {
        t.Fatalf("handler returned error: %v", err)
    }
    if rec.Code != http.StatusOK {
        t.Fatalf("got %d, want 200", rec.Code)
    }
}
```

*What just happened:* `e.NewContext(req, rec)` builds an `echo.Context` wired to our fake request and recorder, without going through the router — so we set the path param ourselves with `SetParamNames`/`SetParamValues` (the router would normally fill those in). Then we call `getBook(c)` straight and check both its returned `error` and `rec.Code`. Because a handler is `func(c echo.Context) error`, check the *return value too*, not only the recorder. Use this style for focused unit tests; reach for `ServeHTTP` when you want to know the route and middleware actually line up.

Both styles need one structural discipline to stay clean: **factor your router construction into a function**, conventionally `setupRouter()`, that returns the configured `*echo.Echo`. Both `main` and your tests call it, so they exercise the *same* wiring.

```go
func setupRouter() *echo.Echo {
    e := echo.New()
    e.HTTPErrorHandler = customErrorHandler // from Phase 6

    v1 := e.Group("/api/v1")
    v1.GET("/books", listBooks)
    v1.POST("/books", createBook)
    v1.GET("/books/:id", getBook)
    v1.PUT("/books/:id", updateBook)
    v1.DELETE("/books/:id", deleteBook)

    return e
}

func main() {
    e := setupRouter()
    e.Logger.Fatal(e.Start(":8080"))
}
```

*What just happened:* all route and middleware registration lives in one place. `main` builds the instance and starts it; a test builds the *same* instance and pokes it with `httptest` — one source of truth, no second, slightly-different route set quietly drifting. (If your handlers need a database or config, have `setupRouter(deps)` take them as parameters so tests can pass fakes.)

## Production niceties: quiet the banner, set real timeouts

Echo prints a friendly startup banner and a "server started on..." line by default. Lovely in dev, noise in production logs. Turn both off on the instance:

```go
e := echo.New()
e.HideBanner = true
e.HidePort = true
```

*What just happened:* `HideBanner` suppresses the ASCII Echo logo at startup, and `HidePort` drops the "⇨ http server started on [::]:8080" line. Neither touches your application logging or the Recover/Logger middleware — you're silencing Echo's cosmetic chatter, not going dark.

The more important production setting is **server timeouts**. Echo exposes the underlying `*http.Server` as `e.Server`, so you set them directly:

```go
e.Server.ReadTimeout = 5 * time.Second
e.Server.WriteTimeout = 10 * time.Second
```

*What just happened:* by default an `http.Server` has *no* timeouts, so a client that opens a connection and sends bytes slowly — or never finishes — can tie up a server goroutine indefinitely. With enough of them (accidental or malicious) you run out of resources. `ReadTimeout` caps how long reading the request is allowed to take; `WriteTimeout` caps the response. This is a baseline defense every real server makes.

## Graceful shutdown: why `e.Start()` alone isn't enough

`e.Start(":8080")` blocks and serves forever, exactly right for learning. For a real deploy it has one gap: when your platform restarts the service (a deploy, a scale-down, a `SIGTERM`), `e.Start()` just gets killed mid-flight — requests in progress are cut off and clients see broken connections. You want the server to *stop accepting new requests, finish the ones in flight, then exit* — a **graceful shutdown**.

Echo gives you `e.Shutdown(ctx)` for exactly this. The pattern: start the server in a goroutine so `main` is free to wait, block until an OS signal arrives, then call `Shutdown` with a deadline.

```go
func main() {
    e := setupRouter()
    e.HideBanner = true

    go func() {
        if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
            e.Logger.Fatal(err)
        }
    }()

    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer stop()
    <-ctx.Done()

    sctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if err := e.Shutdown(sctx); err != nil {
        e.Logger.Fatal(err)
    }
}
```

*What just happened:* a few small, deliberate pieces. We start `e.Start` in a goroutine so `main` doesn't block on it — note the `err != http.ErrServerClosed` check, because a *clean* shutdown makes `Start` return that exact error and we don't want to treat success as a crash. `signal.NotifyContext` hands us a context that cancels when the OS sends `SIGINT` (Ctrl+C) or `SIGTERM` (what platforms send on restart); `<-ctx.Done()` blocks `main` until that fires. Once it does, `e.Shutdown(sctx)` stops accepting new connections and waits for in-flight requests to finish, up to the 5-second deadline set with `context.WithTimeout` — past that it gives up so a stuck request can't block the deploy forever.

> ⚠️ The `http.ErrServerClosed` check is not optional decoration. `Shutdown` causes `Start` to return `http.ErrServerClosed`. If your goroutine does a blanket `e.Logger.Fatal` on *any* error, every clean shutdown looks like a crash and exits non-zero — which your orchestrator may then report as a failed restart. Treat that one error as success.

## Deploy shape: a static binary, env config, a small container, a proxy

Go's superpower for shipping is the **static binary**. A Go program compiles to a single executable with no runtime to install — no interpreter, no `node_modules`, no virtualenv. For a Linux container, build it fully static:

```bash
CGO_ENABLED=0 GOOS=linux go build -o books-api .
```

*What just happened:* `CGO_ENABLED=0` disables cgo so the binary doesn't dynamically link against the system C library — fully self-contained, runs on a bare `scratch` or `distroless` image with nothing else installed. `GOOS=linux` cross-compiles for Linux even from a Mac or Windows machine. The output is one file, `books-api`, that you copy somewhere and run.

Read configuration — at minimum the **port** — from the environment, not a hard-coded constant. Most platforms (and the 12-factor convention) tell your app which port to bind via a `PORT` env var:

```go
addr := ":8080"
if p := os.Getenv("PORT"); p != "" {
    addr = ":" + p
}
e.Start(addr)
```

*What just happened:* we default to `:8080` for local dev but let `PORT` override it, so the same binary runs unchanged on your laptop or a platform that injects `PORT=10000`. The same principle applies to database URLs and secrets — configuration comes from the environment so the build artifact stays identical across environments.

Put that binary in a tiny multi-stage container and stand a **reverse proxy** in front — nginx, Caddy, or whatever your platform provides (a load balancer, an ingress controller). The proxy terminates TLS (HTTPS), can serve static assets, and load-balances across multiple instances of your binary. Your Echo app speaks plain HTTP on its port; the proxy faces the public internet.

That's the whole deploy shape: one static binary, configured by env vars, in a small container, behind a proxy. Taking it to a live URL — host, CI, domain, TLS specifics — is covered in [ship your side project](/guides/ship-your-side-project).

## Recap

- An `*echo.Echo` is an `http.Handler`, so you **test it in memory** with `net/http/httptest`: build a request with `httptest.NewRequest`, a recorder with `httptest.NewRecorder`, call `e.ServeHTTP(rec, req)`, then inspect `rec.Code` and `rec.Body`. No network, no ports.
- Two styles: **`ServeHTTP`** runs the full chain (routing + middleware + error handler), while **`e.NewContext(req, rec)`** calls one handler directly — and since handlers return an `error`, check that return value too.
- Factor route setup into a **`setupRouter()`** that both `main` and tests call, so there's one source of truth and no drift.
- For production, set `e.HideBanner = true` / `e.HidePort = true` to quiet Echo's chatter, and set real `e.Server.ReadTimeout` / `WriteTimeout` (the default is none).
- For a clean exit, start `e.Start` in a goroutine, wait for `SIGINT`/`SIGTERM` via `signal.NotifyContext`, then call `e.Shutdown(ctx)` with a deadline — treating `http.ErrServerClosed` as success.
- Ship a **static binary** (`CGO_ENABLED=0 go build`) in a small container, read config like `PORT` from the environment, and put a reverse proxy in front to terminate TLS and load-balance.

## Quick check

Lock in the core fact (the handler interface) and the two production must-haves:

```quiz
[
  {
    "q": "Why can you test an Echo router with net/http/httptest and no real network?",
    "choices": ["Echo spins up a hidden test server on a random port", "An *echo.Echo implements http.Handler, so a test just calls its ServeHTTP method directly in memory", "httptest mocks the TCP stack at the OS level", "You can't — Echo tests always need a running server"],
    "answer": 1,
    "explain": "Because the instance satisfies http.Handler, ServeHTTP(rec, req) runs the entire middleware-and-handler chain in-process. httptest gives you a fake request and a recording response writer; nothing touches a socket."
  },
  {
    "q": "When testing a single Echo handler directly with e.NewContext, what should you check that you don't with the ServeHTTP style?",
    "choices": ["The TCP connection state", "The error value the handler returns, since a handler is func(c echo.Context) error", "Nothing extra — both styles are identical", "The server's read timeout"],
    "answer": 1,
    "explain": "Calling a handler directly via e.NewContext bypasses routing and the error handler, so the handler's returned error isn't rendered for you. Check both the returned error and rec.Code."
  },
  {
    "q": "During a graceful shutdown, e.Start() returns a specific error. How should you treat it?",
    "choices": ["As a fatal crash — Logger.Fatal and exit non-zero", "As http.ErrServerClosed, which signals a clean shutdown and should NOT be treated as a failure", "Ignore the return value of e.Start entirely", "Retry e.Start in a loop"],
    "answer": 1,
    "explain": "e.Shutdown causes e.Start to return http.ErrServerClosed. Check for it explicitly; a blanket Logger.Fatal on any error would make every clean shutdown look like a crash and exit non-zero."
  }
]
```

[← Phase 6: A REST API with Error Handling](06-rest-api-and-errors.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)
