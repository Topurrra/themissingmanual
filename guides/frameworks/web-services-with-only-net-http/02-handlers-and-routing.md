---
title: "Handlers & Routing by Hand"
guide: "web-services-with-only-net-http"
phase: 2
summary: "Map URL patterns to handlers with HandlerFunc and the Go 1.22 method+path router - GET/POST/{id} patterns, r.PathValue, the old switch-on-method way, subtrees, and conflict panics."
tags: [net-http, go, handlers, routing, servemux]
difficulty: intermediate
synonyms: ["go servemux routing", "go 1.22 method path patterns", "r.PathValue", "go http handlefunc", "go route by method", "net/http router"]
updated: 2026-06-23
---

# Handlers & Routing by Hand

Here's the mental model to hold before any code: **a router is a lookup table from patterns to handlers.** A request comes in carrying a method and a path - `GET /messages/42` - and the router's whole job is to find the one handler that claims that combination and hand the request to it. Nothing more mystical than that.

For years in Go this lookup table was deliberately dumb. The standard `http.ServeMux` matched on the *path* and nothing else - no methods, no path parameters. That's exactly why the ecosystem grew routers like chi, gorilla/mux, and the ones baked into Gin and Echo: people needed `GET` vs `POST` on the same path, and they needed `/messages/{id}` to pull `42` out for them.

> ⚠️ Then **Go 1.22 (early 2024) upgraded `http.ServeMux`** to understand **method + wildcard patterns** directly. The dumb table got smart. For routing alone - the thing most apps actually need - you rarely reach for a third-party router anymore. This phase teaches the new way as the default, then shows you the old way so legacy code stops looking foreign.

We'll keep building the **messages** service from Phase 1: each message is a `Message{id, text}`, and we want to list them, create one, and fetch one by id.

## Registering routes: `Handle` and `HandleFunc`

A `ServeMux` gives you two ways to register:

- `mux.Handle(pattern, handler)` - `handler` is anything satisfying the `http.Handler` interface (it has `ServeHTTP(w, r)`).
- `mux.HandleFunc(pattern, fn)` - `fn` is a plain `func(http.ResponseWriter, *http.Request)`, and the mux wraps it into a handler for you.

You'll use `HandleFunc` ninety percent of the time because writing a function is less ceremony than declaring a type with a method. Reach for `Handle` when you already *have* a value that implements `Handler` (a struct with dependencies attached, which we'll do in a later phase).

## The Go 1.22 way: method + path patterns

This is the part to internalize. A pattern can now start with an HTTP method and embed `{name}` wildcards in the path:

```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /messages", listMessages)
	mux.HandleFunc("POST /messages", createMessage)
	mux.HandleFunc("GET /messages/{id}", getMessage)

	http.ListenAndServe(":8080", mux)
}

func listMessages(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "here are all the messages")
}

func createMessage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "created a new message")
}

func getMessage(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	fmt.Fprintf(w, "you asked for message %s\n", id)
}
```

*What just happened:* We registered three routes that all share the `/messages` path family, but the mux now tells them apart. `GET /messages` and `POST /messages` are two *different* entries - same path, different method, different handler. And `GET /messages/{id}` declares a wildcard segment named `id`. When a request hits `GET /messages/42`, the mux matches that third route and the handler reads the captured value with **`r.PathValue("id")`**, which returns the string `"42"`. No request body parsing, no manual string splitting on `/`. The method that doesn't match anything (say `DELETE /messages`) gets an automatic `405 Method Not Allowed` - the mux handles that for you now too.

> 💡 `r.PathValue` always returns a `string`. If you need an `int` for a database lookup, you convert it yourself with `strconv.Atoi` - and that conversion is also your validation: a non-numeric id fails the parse, and you return `400 Bad Request`. We'll wire that into the real handlers in [Reading Requests, Writing JSON](03-requests-and-json.md).

## The old way (pre-1.22): one path, `switch` on the method

Before Go 1.22, the mux only saw the path. To handle `GET` and `POST` on `/messages`, you registered **one** handler for the path and branched inside it on `r.Method`:

```go
// Pre-1.22 style - you still see this everywhere in older code.
mux.HandleFunc("/messages", func(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		listMessages(w, r)
	case http.MethodPost:
		createMessage(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
})
```

*What just happened:* The path `/messages` mapped to a single function, and that function did the method dispatch by hand with a `switch`. Notice you also had to write the `405` yourself in the `default` case - the old mux wouldn't do it for you. And getting an id out of `/messages/42` was worse: you'd register `/messages/` (with a trailing slash to match the subtree), then chop the path apart with `strings.TrimPrefix(r.URL.Path, "/messages/")` and hope the format was what you expected.

> 📝 That boilerplate - method switches and manual path-slicing in every handler - is precisely the pain routers like **chi** and **gorilla/mux** were born to remove. When you read a codebase that pulls in chi *just for routing*, it was very likely written before 1.22 (or by someone who hasn't noticed the stdlib caught up). Recognizing this pattern tells you a lot about a project's age.

## Pattern features worth knowing

The new mux has a few more rules that matter once your routes grow:

**Trailing slash matches a subtree.** A pattern ending in `/` matches the path *and everything under it*:

```go
mux.HandleFunc("GET /static/", serveStaticFiles)
// matches /static/, /static/logo.png, /static/css/app.css, ...
```

*What just happened:* The trailing slash on `/static/` turns it into a subtree match - every path that starts with `/static/` lands here. Without the trailing slash, `GET /static` would match *only* the exact path `/static`. This is how you serve a whole directory tree from one handler.

**Trailing `{name...}` captures the rest of the path.** If you want the remaining segments as one value, end the pattern with `{name...}`:

```go
mux.HandleFunc("GET /files/{path...}", func(w http.ResponseWriter, r *http.Request) {
	rest := r.PathValue("path") // "docs/2026/report.pdf" for /files/docs/2026/report.pdf
	fmt.Fprintf(w, "serving %s\n", rest)
})
```

*What just happened:* The `...` makes `{path}` greedy - it swallows every segment after `/files/`, slashes and all, into a single `PathValue`. A plain `{path}` (no dots) only captures *one* segment and would not match a path with extra slashes in it.

**More specific wins, and real conflicts panic.** When two patterns could both match, the more specific one takes the request: `GET /messages/{id}` beats a broad `GET /messages/`, and a method-specific pattern beats a method-less one for the same path. But if two patterns are genuinely ambiguous - neither is more specific than the other - the mux **panics at registration time**, when you call `Handle`/`HandleFunc`, not at request time.

> 💡 That registration-time panic is a feature, not a footgun. You find out about a conflicting route the instant your server tries to start, with a clear message naming both patterns - never as a silent wrong-handler bug that ships to production and confuses you at 2am.

## So where do the frameworks fit?

Step back and look at what you just learned. Method matching, path parameters, subtree mounts, precedence rules, conflict detection - that's the entire routing feature set that Gin, Echo, and chi advertise. For *routing*, the standard library now covers it.

> 💡 The frameworks still add real things on top - grouped routes with shared prefixes, a slicker middleware chain, built-in JSON/validation helpers, and nicer context objects. We'll map each of those back onto net/http in [What the Frameworks Add](07-what-frameworks-add.md). But the routing core they wrap? You're already holding it. When someone says "chi has a great router," what they mean is "chi wraps `r.PathValue` and method patterns in a fluent API" - and now you can read straight through that to what's underneath.

## Recap

- A router is just **patterns → handlers**: it looks up the request's method+path and calls the one handler that claims it.
- Register with **`mux.HandleFunc(pattern, fn)`** (a plain function) or **`mux.Handle(pattern, handler)`** (anything implementing `http.Handler`).
- **Go 1.22** taught `ServeMux` method+wildcard patterns: `"GET /messages"`, `"POST /messages"`, `"GET /messages/{id}"` - and you read the wildcard with **`r.PathValue("id")`** (always a string).
- The **pre-1.22 way** registered one handler per path and did `switch r.Method` plus manual path-slicing by hand - the boilerplate that gave us chi and gorilla/mux.
- A trailing `/` matches a **subtree**, `{name...}` captures the **rest of the path**, more specific patterns win, and ambiguous patterns **panic at registration**.
- For routing alone you rarely need a third-party router now - the frameworks wrap exactly these features.

Quick gut check before moving on:

```quiz
[
  {
    "q": "In Go 1.22+, how do you read the value captured by the wildcard in the pattern \"GET /messages/{id}\"?",
    "choices": ["r.URL.Query().Get(\"id\")", "r.PathValue(\"id\")", "strings.TrimPrefix(r.URL.Path, \"/messages/\")", "r.FormValue(\"id\")"],
    "answer": 1,
    "explain": "r.PathValue(\"id\") returns the captured segment (as a string). Query() is for ?id=... query params, and the TrimPrefix approach is the old manual workaround."
  },
  {
    "q": "Before Go 1.22, how did you serve both GET and POST on the same /messages path?",
    "choices": ["Register two patterns: \"GET /messages\" and \"POST /messages\"", "Register one handler for \"/messages\" and switch on r.Method inside it", "It was impossible without a third-party router", "Use r.PathValue(\"method\")"],
    "answer": 1,
    "explain": "The old mux ignored the method, so you registered one handler for the path and branched on r.Method with a switch - writing the 405 yourself in the default case."
  },
  {
    "q": "What happens when you register two route patterns that are genuinely ambiguous (neither more specific)?",
    "choices": ["The first one registered always wins", "The last one registered wins", "The mux panics at registration time", "Requests return 500 at runtime"],
    "answer": 2,
    "explain": "The Go 1.22 mux panics the moment you register a conflicting pattern, naming both - so you catch the bug at startup, not as a silent wrong-handler in production."
  }
]
```

---

[← Phase 1: The net/http Mental Model](01-the-mental-model.md) · [Guide overview](_guide.md) · [Phase 3: Reading Requests, Writing JSON →](03-requests-and-json.md)
