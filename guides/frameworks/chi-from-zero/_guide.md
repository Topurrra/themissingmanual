---
title: "chi From Zero"
guide: "chi-from-zero"
phase: 0
summary: "Learn chi, the lightweight idiomatic Go router: why it stays compatible with net/http, routing and URL params, sub-routers, the stdlib-style middleware stack, reading and writing requests with the standard library, building a REST API, and structuring and testing it. The framework that's barely a framework - and the clearest bridge to plain net/http."
tags: [chi, go, golang, web, router, rest, api, net-http, middleware]
category: frameworks
order: 18
group: "Go"
difficulty: intermediate
synonyms: ["learn chi", "go-chi tutorial", "chi router go", "go chi rest api", "chi middleware", "chi url params", "chi vs gin echo", "idiomatic go router", "net/http compatible router"]
updated: 2026-06-23
---

# chi From Zero

chi is the framework for people who like `net/http` and only want the one thing the standard library
doesn't give you: a real router. Its whole philosophy is **stay compatible with the standard library**.
A chi handler is a plain `http.HandlerFunc`. chi middleware is a plain `func(http.Handler) http.Handler`.
A chi router *is* an `http.Handler`. That means everything you learn in chi transfers straight to the
broader Go ecosystem, and any stdlib-compatible middleware works with it unchanged. If Gin and Echo are
"frameworks with their own context," chi is "the standard library, plus routing."

The mental model is one router built from standard pieces. The **router** (`chi.NewRouter()`) maps method
+ path to ordinary `http.HandlerFunc`s, supports **URL parameters** (`/tasks/{id}`) the stdlib mux long
lacked, and lets you compose **sub-routers** and a **middleware stack** out of plain `http.Handler`
wrappers. There's no special context value to learn - you use `r *http.Request` and `w http.ResponseWriter`
like always, and pull URL params with `chi.URLParam(r, "id")`.

> 📝 This teaches the **framework** - it assumes you know **Go** ([Go From Zero](/guides/go-from-zero))
> and the shape of `net/http` (a quick read of the [net/http roots guide](/guides/web-services-with-only-net-http)
> makes chi feel obvious). Compare it with [Gin](/guides/gin-from-zero) and [Echo](/guides/echo-from-zero)
> to see the "own-context" vs "stdlib-native" split. chi runs as a Go program, so examples are shown with
> the commands to run them.

## How to read this

Read in order - it grows one service (a small **articles API**) using only `net/http` types plus chi's
router. Phases carry difficulty badges.

## The phases

1. **[What chi Is](01-what-chi-is.md)** 🟢 - the "just a router" philosophy and why staying net/http-compatible matters.
2. **[Routing, URL Params & Sub-routers](02-routing-and-subrouters.md)** 🟢 - methods, `{id}` params, `Route`/`Mount`, and nested routers.
3. **[Middleware the Standard Way](03-middleware.md)** 🟡 - `func(http.Handler) http.Handler`, chi's built-in middlewares, and per-route stacks.
4. **[Requests & Responses with the Standard Library](04-requests-and-responses.md)** 🟡 - decoding JSON, writing JSON, status codes, and small helpers.
5. **[Building a REST API](05-building-a-rest-api.md)** 🟡 - full CRUD for the articles resource with chi + the stdlib.
6. **[Structuring & Testing](06-structure-and-testing.md)** 🔴 - handlers/services layout, `context` values, and `httptest`.
7. **[Where to Go Next](07-where-to-go-next.md)** 🟢 - chi vs Gin/Echo, the improved stdlib mux, and what to build.

> The throughline: chi adds a **router** to the standard library and gets out of the way. Learn chi and
> you've mostly learned idiomatic `net/http` - which is exactly the point.

---

[Phase 1: What chi Is →](01-what-chi-is.md)
