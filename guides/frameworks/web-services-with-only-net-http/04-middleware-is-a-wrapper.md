---
title: "Middleware Is Just a Wrapper"
guide: "web-services-with-only-net-http"
phase: 4
summary: "Middleware in net/http is a function that takes an http.Handler and returns a new one. Build logging and auth middleware, chain them by wrapping, and pass data down with context."
tags: [net-http, go, middleware, wrapper, handler]
difficulty: intermediate
synonyms: ["go http middleware", "func(http.Handler) http.Handler", "go middleware chain", "go logging middleware", "go auth middleware", "net/http middleware pattern"]
updated: 2026-07-10
---

# Middleware Is Just a Wrapper

The secret that takes the word "middleware" from intimidating to boring: in net/http,
**middleware is a handler that wraps another handler.** That's the whole thing. There is no special
middleware type, no registration system, no framework magic. It's a function that takes an
`http.Handler`, holds onto it in a closure, and hands you back a *new* `http.Handler` that does
something extra before or after calling the one you gave it.

The mental model, in one line: **middleware is `func(next http.Handler) http.Handler`** - a function
that takes the "next" handler and returns a wrapped version of it. The wrapper runs your code, then
calls `next.ServeHTTP(w, r)` to let the real work happen, then optionally runs more code on the way
back out. It's an onion: each layer wraps the one inside it, the request travels inward through every
layer, and the response travels back outward through them in reverse.

> 📝 You already know everything you need for this. A `Handler` is anything with `ServeHTTP(w, r)`
> (Phase 1), and a closure is a function that remembers a variable from where it was created (Go From
> Zero). Middleware is just those two ideas shaken together. If "closure over `next`" feels fuzzy,
> that's the only new thing here - everything else you've seen.

## The shape of every middleware

Let's build the canonical example: logging. We want to print the method, path, and how long each
request took. Watch the shape carefully, because *every* middleware you ever write looks like this.

```go
func Logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}
```

*What just happened:* `Logging` takes one handler (`next`) and returns a brand-new one built with
`http.HandlerFunc`. Inside that new handler, we record the start time, call `next.ServeHTTP(w, r)` to
run whatever was wrapped (the mux, another middleware, your actual route handler - we don't care
which), and *then*, after it returns, we log how long it took. The returned function is a closure: it
"remembers" `next` and `start` even though `Logging` has long since returned. Code before
`next.ServeHTTP` runs on the way *in*; code after it runs on the way *out*. That before/after split is
the entire vocabulary of middleware - auth checks go before, timing and cleanup go after.

## Applying it: wrap the mux

A handler that wraps a handler is useless until you actually wrap something. Your router (the
`ServeMux` from Phase 2) is an `http.Handler` - so you wrap *it*, and hand the wrapped result to the
server instead of the bare mux.

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /messages", listMessages)

var h http.Handler = mux   // the mux is a Handler
h = Logging(h)             // now h is "logging, then the mux"

http.ListenAndServe(":8080", h)
```

*What just happened:* We declared `h` as an `http.Handler` and started it as the mux. Then
`h = Logging(h)` replaced it with the logging wrapper, which still has the mux tucked inside it as
`next`. When a request arrives, the server calls `h.ServeHTTP` - that's the logging layer, which logs
and then calls the mux, which routes to `listMessages`. We pass `h`, not `mux`, to `ListenAndServe`.
The mux didn't change at all; we just put a coat on it.

## Chaining: wrappers around wrappers

One middleware is wrapping; several is *nesting*. Because each middleware takes a handler and returns
a handler, the output of one is valid input to the next. You stack them by nesting the calls:

```go
var h http.Handler = mux
h = Logging(Auth(mux))   // Auth wraps the mux; Logging wraps Auth

http.ListenAndServe(":8080", h)
```

*What just happened:* Read it inside-out. `Auth(mux)` produces a handler that does auth and then calls
the mux. `Logging(...)` wraps *that*, producing a handler that logs and then calls the auth layer. So a
request flows: **Logging → Auth → mux → your handler**, and the response unwinds back the same way in
reverse. The **outermost wrapper runs first** on the way in. That ordering matters: putting `Logging`
outermost means it times the *whole* request including auth; swapping them would exclude auth from the
timing. Nesting reads backwards, which is exactly why people reach for a helper.

That nesting gets ugly fast with four or five middlewares. A tiny helper flattens it into a readable
list:

```go
func Chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
    for i := len(mws) - 1; i >= 0; i-- {
        h = mws[i](h)
    }
    return h
}

// usage:
h := Chain(mux, Logging, Auth)   // same as Logging(Auth(mux))
```

*What just happened:* `Chain` takes the base handler plus a variadic list of middlewares. It applies
them **back to front** (the loop counts down from the last index) so that the *first* one you list ends
up as the outermost wrapper - matching how you'd read it: "Logging, then Auth, then the mux." Now
adding a middleware is appending a name to the list, not re-nesting parentheses. This is the same
helper, give or take, that every Go middleware library ships under names like `Use` or `With`.

## Auth middleware: when *not* to call next

Logging always calls `next` - it never blocks a request, it just observes. Auth is the interesting
case, because its whole job is to *sometimes refuse*. The rule is simple: if the request fails the
check, write an error response and **`return` without calling `next`.** That short-circuits the onion -
the inner layers never run.

```go
func Auth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "missing Authorization header", http.StatusUnauthorized)
            return // stop here - do NOT call next
        }
        next.ServeHTTP(w, r) // authorized: let the request continue
    })
}
```

*What just happened:* We read the `Authorization` header. If it's empty, we write a `401 Unauthorized`
and `return` immediately - the wrapped handler never runs, so the protected route is never reached.
That bare `return` is load-bearing: forget it, and after writing the 401 you'd *also* call `next`,
running the real handler and writing a second response on top of the error. Only when the header is
present do we fall through to `next.ServeHTTP(w, r)`.

> ⚠️ Once you've written to `w` (status or body), you can't un-write it. After `http.Error` the
> response is committed, so the `return` isn't optional politeness - it prevents a corrupt
> double-response. The pattern "write the error, then `return`" is one you'll repeat constantly.

Real auth doesn't just check that a token *exists* - it validates it and figures out *who* the user is.
You'll want to pass that identity down to the handlers inside. You can't add a field to `*http.Request`,
but you *can* attach values to its `context`. Here's the shape (Phase 6 goes deep on context):

```go
ctx := context.WithValue(r.Context(), userKey, user)
next.ServeHTTP(w, r.WithContext(ctx))
```

*What just happened:* `context.WithValue` produces a new context carrying `user` under a key, and
`r.WithContext(ctx)` makes a copy of the request using that context. We pass the copy down, so any
inner handler can call `r.Context().Value(userKey)` to retrieve the user the middleware authenticated.
This is how middleware talks to the handlers it wraps - not by mutating the request, but by enriching
its context on the way in. We'll do this properly, with a typed key and a getter, in
[Phase 6](06-structure-and-shutdown.md).

> 💡 Look back at that `func(http.Handler) http.Handler` signature. It is *exactly* what
> [chi](/guides/chi-from-zero) uses - chi middleware is plain net/http middleware, no translation
> needed, which is why chi feels like "net/http with a nicer router." [Gin](/guides/gin-from-zero) and
> Echo wrap the same before/after idea around their *own* context type (`c.Next()` is their version of
> `next.ServeHTTP`), but it's the identical onion. Learn it once here and every framework's middleware
> chapter is review.

## Recap

- **Middleware is `func(next http.Handler) http.Handler`** - a function that takes a handler and
  returns a new handler wrapping it. No special type, just a closure over `next`.
- Code **before** `next.ServeHTTP` runs on the way in; code **after** it runs on the way out. The
  request travels inward through the layers and the response unwinds back outward.
- **Apply** middleware by wrapping your mux (`h = Logging(mux)`) and passing the wrapper, not the bare
  mux, to the server. **Chain** by nesting (`Logging(Auth(mux))`) or with a small `Chain` helper; the
  outermost wrapper runs first.
- An **auth** middleware that rejects a request must write its error and **`return` without calling
  `next`** - otherwise the protected handler runs anyway and you write two responses.
- Pass data (like the authenticated user) to inner handlers via `context.WithValue` +
  `r.WithContext`, not by mutating the request - expanded in Phase 6.

## Quick check

Three quick ones to make sure the wrapper model stuck.

```quiz
[
  {
    "q": "What is the type signature of a net/http middleware?",
    "choices": [
      "func(w http.ResponseWriter, r *http.Request)",
      "func(next http.Handler) http.Handler",
      "type Middleware interface { Use() }",
      "func(mux *http.ServeMux) error"
    ],
    "answer": 1,
    "explain": "Middleware takes the next http.Handler and returns a new http.Handler that wraps it. It's a plain function over a closure - no special type involved."
  },
  {
    "q": "In an auth middleware, what must you do when the request is unauthorized?",
    "choices": [
      "Call next.ServeHTTP anyway so the handler can decide",
      "Write the error response and return WITHOUT calling next",
      "Panic so the server recovers and sends a 500",
      "Delete the Authorization header and retry"
    ],
    "answer": 1,
    "explain": "Write the 401 and return immediately. If you don't return, you'll call next after writing the error, running the protected handler and writing a second, corrupt response."
  },
  {
    "q": "Given Logging(Auth(mux)), which layer sees the request first?",
    "choices": [
      "mux, because it's innermost",
      "Auth, because authentication always goes first",
      "Logging, because the outermost wrapper runs first on the way in",
      "They run in parallel"
    ],
    "answer": 2,
    "explain": "Read it inside-out: Logging wraps Auth wraps mux. The outermost wrapper (Logging) runs first on the way in, then Auth, then the mux - and the response unwinds in reverse."
  }
]
```

---

[← Phase 3: Reading Requests, Writing JSON](03-requests-and-json.md) · [Guide overview](_guide.md) · [Phase 5: A JSON REST API With No Framework →](05-rest-api-no-framework.md)
