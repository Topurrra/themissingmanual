---
title: "Routing, URL Params & Sub-routers"
guide: "chi-from-zero"
phase: 2
summary: "How chi maps method plus pattern to plain http.HandlerFuncs, reads URL params with chi.URLParam, and groups related routes with Route, Mount, and nested sub-routers."
tags: [chi, go, routing, url-params, subrouters]
difficulty: beginner
synonyms: ["chi routing", "chi url param", "chi route mount", "chi subrouter", "chi nested routes", "chi.URLParam"]
updated: 2026-07-10
---

# Routing, URL Params & Sub-routers

Here's the whole mental model, and once it clicks the rest of chi is detail: a chi router is a
lookup table. Each entry is a **method + a URL pattern** on the left, and a plain
`http.HandlerFunc` on the right. When a request arrives, chi reads its method (`GET`, `POST`, …)
and its path (`/articles/42`), finds the matching entry, and calls that function. No magic context
object, no special handler signature - the right-hand side is the exact same
`func(w http.ResponseWriter, r *http.Request)` you'd write for the standard library.

The one thing chi adds on top of a flat lookup table is **placeholders**. A pattern like
`/articles/{id}` matches `/articles/42` and `/articles/hello` alike, and stashes whatever was in
the `{id}` slot so your handler can read it back. And because real apps have dozens of routes,
chi lets you **group** related ones under a shared prefix instead of repeating yourself - that's
what sub-routers are for.

> 📝 We're growing one example through the whole guide: a small **articles API**. An article is
> just `Article{id, title, body}`. By the end of this phase you'll have all the URLs that API
> needs - listing, creating, fetching one, updating, deleting - wired up cleanly.

## Methods: one function per verb

chi gives you a method on the router for each HTTP verb. The pattern is always the same: path
first, handler second.

```go
r := chi.NewRouter()

r.Get("/articles", listArticles)
r.Post("/articles", createArticle)
r.Get("/articles/{id}", getArticle)
r.Put("/articles/{id}", updateArticle)
r.Delete("/articles/{id}", deleteArticle)
```

*What just happened:* we registered five routes. Notice that `/articles` and `/articles/{id}`
are different patterns, and that the *same* path (`/articles/{id}`) can carry different handlers
depending on the verb - `GET` reads an article, `PUT` replaces it, `DELETE` removes it. chi
matches on method **and** path together, so there's no collision.

Beyond these named helpers (`Get`, `Post`, `Put`, `Patch`, `Delete`, `Head`, `Options`), there
are two escape hatches for when the verb is dynamic or unusual:

```go
r.Method("GET", "/health", healthHandler)   // takes an http.Handler
r.MethodFunc("GET", "/ping", pingHandler)    // takes an http.HandlerFunc
```

*What just happened:* `r.Method` and `r.MethodFunc` do exactly what `r.Get` does, except you pass
the verb as a string. Reach for these only when you genuinely need a verb as data - for everyday
routes, the named helpers read better.

## URL params: reading `{id}` back out

The handlers above use `/articles/{id}`, but how does `getArticle` find out *which* id? With
`chi.URLParam`:

```go
func getArticle(w http.ResponseWriter, r *http.Request) {
    idStr := chi.URLParam(r, "id")   // always a string, e.g. "42"
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "id must be a number", http.StatusBadRequest)
        return
    }
    // ... look up article #id and write it back ...
    fmt.Fprintf(w, "you asked for article %d", id)
}
```

*What just happened:* `chi.URLParam(r, "id")` pulls the value that filled the `{id}` slot in the
pattern. The name you pass (`"id"`) must match the name inside the braces. The big gotcha worth
burning into memory: **it always returns a string.** A request to `/articles/42` gives you `"42"`,
not `42`. If you need a number, convert it yourself with `strconv.Atoi` and check the error,
because nothing stops someone from requesting `/articles/banana`.

> ⚠️ A common early bug: comparing `chi.URLParam(r, "id")` directly to an integer, or forgetting
> the conversion can fail. Treat the param as untrusted user input - convert and validate before
> you use it.

If you'd rather reject non-numeric ids at the routing layer instead of inside the handler, chi
lets you constrain a placeholder with a regular expression:

```go
r.Get("/articles/{id:[0-9]+}", getArticle)
```

*What just happened:* the `:[0-9]+` part says "only match if this segment is one or more digits."
Now `/articles/42` reaches `getArticle`, but `/articles/banana` doesn't match this route at all
and falls through to a 404. You still read the value with `chi.URLParam(r, "id")` (the regex part
isn't included in the name). Handy, but don't overdo it - for anything beyond simple shapes,
validating inside the handler is usually clearer.

> 💡 Query strings (`/articles?q=go`) are *not* URL params and chi doesn't wrap them. They come
> from the standard library: `r.URL.Query().Get("q")`. More on that at the end of this phase.

## Sub-routers: grouping routes with `Route`

Writing `/articles` and `/articles/{id}` over and over gets noisy, and it scatters related routes
across your file. `r.Route` fixes both. It carves out a prefix and gives you a fresh router scoped
to it, so every route you register inside is relative to that prefix:

```go
r.Route("/articles", func(r chi.Router) {
    r.Get("/", listArticles)            // GET    /articles
    r.Post("/", createArticle)          // POST   /articles
    r.Route("/{id}", func(r chi.Router) {
        r.Get("/", getArticle)          // GET    /articles/{id}
        r.Put("/", updateArticle)       // PUT    /articles/{id}
        r.Delete("/", deleteArticle)    // DELETE /articles/{id}
    })
})
```

*What just happened:* this registers the exact same five routes as our flat list earlier, but now
they're visually grouped by resource. Inside `r.Route("/articles", ...)`, the path `"/"` means
"the prefix itself" (`/articles`), and the nested `r.Route("/{id}", ...)` stacks another segment
on top, so `"/"` inside *it* means `/articles/{id}`. The `id` param is still read the same way. This
nesting is the idiomatic chi way to organize a resource - all the "things you can do to articles"
live in one block.

> 📝 The `r` inside the callback shadows the outer `r` on purpose. It's a new sub-router whose
> routes are automatically prefixed. Reusing the name keeps the calls looking identical at every
> level - `r.Get`, `r.Post`, and so on - which is exactly the point.

## `Mount`: bolting a whole router onto a path

`Route` is for grouping routes inline. `Mount` is for attaching an *entire pre-built router* - 
with its own routes and its own middleware - at a path. This is how you compose an app out of
self-contained modules:

```go
func adminRouter() chi.Router {
    r := chi.NewRouter()
    // r.Use(requireAdmin)   // its own middleware (next phase)
    r.Get("/articles", listAllArticles)
    r.Delete("/articles/{id}", forceDeleteArticle)
    return r
}

func main() {
    r := chi.NewRouter()
    r.Get("/articles", listArticles)
    r.Mount("/admin", adminRouter())   // GET /admin/articles, DELETE /admin/articles/{id}
    http.ListenAndServe(":3000", r)
}
```

*What just happened:* `adminRouter()` builds a complete, independent router. `r.Mount("/admin", …)`
hangs it off the `/admin` prefix, so its `/articles` route becomes `/admin/articles`. The admin
router can declare its own middleware that applies only to its routes, and `main` doesn't need to
know any of its internals. As an app grows, this lets each feature own a file and a router, and
`main` stays a short list of mounts.

> 💡 Rule of thumb: use `Route` to group routes that share a prefix in the same place; use `Mount`
> to plug in a router that was built somewhere else (often in its own package or file).

## Query params come from the standard library

One last thing, because people expect chi to have a helper for it and it doesn't - on purpose.
Query string values aren't part of the route, so chi leaves them to `net/http`:

```go
func listArticles(w http.ResponseWriter, r *http.Request) {
    q := r.URL.Query().Get("q")        // /articles?q=go  ->  "go"
    if q == "" {
        fmt.Fprint(w, "all articles")
        return
    }
    fmt.Fprintf(w, "articles matching %q", q)
}
```

*What just happened:* `r.URL.Query()` parses the query string into a map-like value, and `.Get("q")`
reads one key (returning `""` if it's absent). This is plain standard library - the same code works
without chi at all. It's a perfect little illustration of chi's whole philosophy: it adds the router
and the URL params the stdlib lacked, and for everything else it gets out of your way.

## Recap

- A chi router is a lookup table mapping **method + pattern** to a plain `http.HandlerFunc` - no special handler signature, no magic context.
- Use the named verb helpers (`r.Get`, `r.Post`, `r.Put`, `r.Delete`, …); `r.Method`/`r.MethodFunc` take the verb as a string for dynamic cases.
- `{id}` in a pattern is a placeholder; read it with `chi.URLParam(r, "id")`, which **always returns a string** - convert with `strconv.Atoi` and validate. Constrain with regex like `{id:[0-9]+}` when you want routing to reject bad shapes.
- `r.Route` groups routes under a shared prefix with a scoped sub-router (nest them for `/articles/{id}`); `r.Mount` attaches a whole pre-built router (with its own middleware) at a path.
- Query params aren't routing - read them with the standard library: `r.URL.Query().Get("q")`.

## Quick check

Test the mental model before moving on.

```quiz
[
  {
    "q": "A request hits GET /articles/42 on a route registered as \"/articles/{id}\". What does chi.URLParam(r, \"id\") return?",
    "choices": ["The integer 42", "The string \"42\"", "An error, because id isn't numeric", "nil until you call strconv.Atoi"],
    "answer": 1,
    "explain": "chi.URLParam always returns a string. You convert it yourself (e.g. strconv.Atoi) when you need a number."
  },
  {
    "q": "You built a complete, self-contained adminRouter() in its own file and want to attach it under /admin. Which call do you use?",
    "choices": ["r.Route(\"/admin\", adminRouter)", "r.Mount(\"/admin\", adminRouter())", "r.Get(\"/admin\", adminRouter())", "r.Group(adminRouter())"],
    "answer": 1,
    "explain": "r.Mount attaches an entire pre-built router (with its own routes and middleware) at a path. r.Route is for grouping routes inline."
  },
  {
    "q": "How do you read the value of q in a request to /articles?q=go?",
    "choices": ["chi.URLParam(r, \"q\")", "r.URL.Query().Get(\"q\")", "chi.QueryParam(r, \"q\")", "r.FormParam(\"q\")"],
    "answer": 1,
    "explain": "Query strings aren't route params, so chi doesn't wrap them. You use the standard library: r.URL.Query().Get(\"q\")."
  }
]
```

---

[← Phase 1: What chi Is](01-what-chi-is.md) · [Guide overview](_guide.md) · [Phase 3: Middleware the Standard Way →](03-middleware.md)