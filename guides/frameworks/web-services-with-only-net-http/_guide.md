---
title: "Web Services With Only net/http"
guide: "web-services-with-only-net-http"
phase: 0
summary: "Build real Go web services using nothing but the standard library: the Handler/ServeMux/Server mental model, routing by hand, reading requests and writing JSON, middleware as plain wrappers, a full JSON REST API with no framework, project structure with context and graceful shutdown, and exactly what Gin/Echo/chi add on top. The foundation every Go framework is built on."
tags: [net-http, go, golang, stdlib, web, rest, api, handler, middleware]
category: frameworks
order: 20
group: "Go"
difficulty: intermediate
synonyms: ["go net/http", "net http tutorial", "go web service no framework", "go http handler servemux", "go stdlib rest api", "go http middleware", "graceful shutdown go", "go 1.22 routing", "what gin echo are built on"]
updated: 2026-06-23
---

# Web Services With Only net/http

Here's a thing that surprises people coming to Go: you often don't need a web framework at all. The
standard library's `net/http` already gives you a production-grade HTTP server, a router, and everything
to read requests and write responses. [Gin](/guides/gin-from-zero), [Echo](/guides/echo-from-zero), and
[chi](/guides/chi-from-zero) are conveniences *over this* — and once you've built a real JSON API with
only the standard library, every one of them reads as "net/http with some boilerplate removed." This is
the **roots** guide: learn it and the frameworks stop being magic.

The mental model is three standard types. A **`Handler`** is anything with `ServeHTTP(w, r)` — your code
that handles one request (a plain function becomes one via `http.HandlerFunc`). A **`ServeMux`** is the
router: it maps URL patterns to handlers. And the **`Server`** ties an address to a handler and listens.
That's the whole architecture: *the mux routes a request to a handler, the handler writes the response.*
Middleware? Just a function that wraps a `Handler` and returns a new one. Hold those, and you can read any
Go web codebase — framework or not.

> 📝 This teaches the **standard library** — it assumes you know **Go** (functions, interfaces, structs,
> `error` — [Go From Zero](/guides/go-from-zero)) and basic **HTTP** (methods, status, headers —
> [HTTP, Explained](/guides/http-explained)). It's the Go parallel to
> [WSGI & ASGI Explained](/guides/wsgi-and-asgi-explained) (Python's foundation) and is best read before
> or alongside the framework guides so you can see what each one adds. Examples run as plain Go programs.

## How to read this

Short and foundational — read in order. It builds a bare server, then a full JSON API (a small
**messages** service), then maps it onto the frameworks. Uses modern Go (1.22+) routing. Phases carry
difficulty badges.

## The phases

1. **[The net/http Mental Model](01-the-mental-model.md)** 🟢 — `Handler`, `ServeMux`, `Server`, and how one request flows through them.
2. **[Handlers & Routing by Hand](02-handlers-and-routing.md)** 🟡 — `HandlerFunc`, registering routes, and the Go 1.22 method+path patterns.
3. **[Reading Requests, Writing JSON](03-requests-and-json.md)** 🟡 — params, query, body decoding, and writing JSON responses with the right status.
4. **[Middleware Is Just a Wrapper](04-middleware-is-a-wrapper.md)** 🟡 — `func(http.Handler) http.Handler`, chaining, and logging/auth examples.
5. **[A JSON REST API With No Framework](05-rest-api-no-framework.md)** 🔴 — full CRUD for the messages resource using only the standard library.
6. **[Structure, Context & Graceful Shutdown](06-structure-and-shutdown.md)** 🔴 — dependency wiring, `context`, timeouts, and shutting down cleanly.
7. **[What the Frameworks Add](07-what-frameworks-add.md)** 🟢 — mapping Gin/Echo/chi back onto this, and when you genuinely don't need them.

> The throughline: **mux routes to handler, handler writes response, middleware wraps handlers.** That's
> net/http, and that's the skeleton inside every Go web framework.

---

[Phase 1: The net/http Mental Model →](01-the-mental-model.md)
