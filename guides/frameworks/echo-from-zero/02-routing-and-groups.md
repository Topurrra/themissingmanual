---
title: "Routing & Groups"
guide: "echo-from-zero"
phase: 2
summary: "How Echo matches requests: methods and paths to handlers, path and query params via the context, and route groups that share a prefix and middleware."
tags: [echo, go, routing, groups, params]
difficulty: beginner
synonyms: ["echo routing", "echo path params", "echo query params", "echo route groups", "echo http methods", "echo c.param"]
updated: 2026-07-10
---

# Routing & Groups

In Phase 1 you stood up one route and watched Echo answer it. Real APIs have many routes, and the
first thing that bites people is *which* route answered *which* request.

## A route is method + path → handler

📝 A route in Echo is three things glued together: an **HTTP method** (`GET`, `POST`, …), a **path**
(`/books`, `/books/:id`), and a **handler** (`func(c echo.Context) error`). When a request arrives, Echo
looks at the method *and* the path, finds the one handler registered for that pair, and calls it. Nothing
more mysterious than that.

That "method *and* path" part matters. `GET /books` and `POST /books` are two different routes with two
different handlers, even though the path text is identical. People coming from frameworks that only key on
the path get tripped up here — Echo treats the verb as part of the address.

Under the hood Echo stores all your routes in a **radix tree** (a prefix tree). You never touch it, but
it's why matching stays fast even with hundreds of routes, and why a literal path like `/books/new` can
coexist with a parameter path like `/books/:id` without a linear scan.

A **group** is the second idea: a set of routes that share a common path prefix (and, later, shared
middleware). `/api/v1/books` and `/api/v1/authors` clearly belong together; a group lets you say
"`/api/v1`" once instead of typing it on every route.

We'll grow the **books API** from Phase 1 — the same `Book{id, title, author}` shape — into a small set
of real routes.

## Registering methods

Echo gives you one function per HTTP method, each with the same `(path, handler)` signature:

```go
package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Book struct {
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Author string `json:"author"`
}

// Our "database" for now: a slice in memory.
var books = []Book{
	{ID: 1, Title: "The Go Programming Language", Author: "Donovan & Kernighan"},
	{ID: 2, Title: "Go in Action", Author: "Kennedy"},
}

func main() {
	e := echo.New()

	e.GET("/books", listBooks)    // read the collection
	e.POST("/books", createBook)  // add to the collection

	e.Logger.Fatal(e.Start(":1323"))
}

func listBooks(c echo.Context) error {
	return c.JSON(http.StatusOK, books)
}

func createBook(c echo.Context) error {
	return c.JSON(http.StatusCreated, Book{ID: 3, Title: "TODO", Author: "TODO"})
}
```

*What just happened:* `e.GET` and `e.POST` each registered a route on the **same path** `/books` but for
different verbs, pointing at different handlers. A `GET /books` request runs `listBooks`; a `POST /books`
runs `createBook`. (`createBook`'s response is hard-coded for now — reading the request body is Phase 3.)

The full set is `e.GET`, `e.POST`, `e.PUT`, `e.PATCH`, `e.DELETE`, `e.HEAD`, and `e.OPTIONS` — all
`(path, handler)`. There's also `e.Any(path, handler)`, which registers the handler for *every* method at
that path. Reach for `e.Any` rarely; being explicit about verbs is usually clearer and safer.

## Path params: capturing pieces of the URL

You don't want a separate route per book ID. Instead you declare a **path parameter** with a `:name`
segment, and read it back inside the handler with `c.Param("name")`.

```go
func main() {
	e := echo.New()

	e.GET("/books", listBooks)
	e.GET("/books/:id", getBook) // :id is a path parameter

	e.Logger.Fatal(e.Start(":1323"))
}

func getBook(c echo.Context) error {
	id := c.Param("id") // always a string, e.g. "2" from /books/2

	for _, b := range books {
		// strconv.Itoa converts the int ID to a string to compare.
		if id == strconv.Itoa(b.ID) {
			return c.JSON(http.StatusOK, b)
		}
	}

	return c.JSON(http.StatusNotFound, map[string]string{"error": "book not found"})
}
```

*What just happened:* the route `/books/:id` matches any single segment after `/books/` and stashes it
under the name `id`. A request to `/books/2` makes `c.Param("id")` return the string `"2"`. ⚠️ Path
params are **always strings** — convert them yourself (here with `strconv.Itoa`; you'll more often parse
with `strconv.Atoi`). Remember to add `"strconv"` to your imports.

There's also a **wildcard** segment, `*`, for "match the rest of the path, slashes and all." It's mostly
used for serving files:

```go
e.GET("/files/*", func(c echo.Context) error {
	path := c.Param("*") // e.g. "docs/intro.pdf" for /files/docs/intro.pdf
	return c.String(http.StatusOK, "you asked for: "+path)
})
```

*What just happened:* unlike `:id`, which captures exactly one segment, `*` captures everything after
`/files/` including any `/`, read with `c.Param("*")`. Use it sparingly — static assets or catch-alls,
not normal API routes, where named params read better.

## Query params: the bit after the `?`

Path params identify *which* resource. **Query params** — the `?key=value` pairs at the end of a URL —
usually *filter* or *modify* a request. Think `GET /books?author=Kennedy`. They're optional by nature, so
Echo reads them differently: `c.QueryParam("name")` returns the value, or an empty string `""` if it
wasn't supplied.

```go
func listBooks(c echo.Context) error {
	author := c.QueryParam("author") // "" if ?author= was not in the URL

	if author == "" {
		return c.JSON(http.StatusOK, books) // no filter: return all
	}

	var filtered []Book
	for _, b := range books {
		if b.Author == author {
			filtered = append(filtered, b)
		}
	}
	return c.JSON(http.StatusOK, filtered)
}
```

*What just happened:* `GET /books` returns everything, while `GET /books?author=Kennedy` returns only the
matching ones. `c.QueryParam("author")` never errors on a missing param — it just hands back `""`. ⚠️
That's a footgun if you treat `""` as "no books matched" instead of "no filter requested," so we check
for the empty string *first*.

Need everything at once? `c.QueryParams()` returns a `url.Values` (a `map[string][]string`) holding every
query key and its value(s):

```go
func searchBooks(c echo.Context) error {
	params := c.QueryParams() // url.Values, e.g. {"author": ["Kennedy"], "sort": ["title"]}
	return c.JSON(http.StatusOK, params)
}
```

*What just happened:* `c.QueryParams()` gives you the whole bag of query values, handy when a single key
can repeat (`?tag=go&tag=web`) or you want to loop over unknown filters. For one known key, stick with
`c.QueryParam` — it's simpler.

## Groups: say the prefix once

As the API grows you'll want a version prefix like `/api/v1` so you can ship `/api/v2` later without
breaking existing clients. Typing `/api/v1/...` on every route is tedious and easy to get wrong. A
**group** fixes that.

```go
func main() {
	e := echo.New()

	v1 := e.Group("/api/v1") // every route below is prefixed with /api/v1

	v1.GET("/books", listBooks)        // -> GET /api/v1/books
	v1.GET("/books/:id", getBook)      // -> GET /api/v1/books/:id
	v1.POST("/books", createBook)      // -> POST /api/v1/books

	e.Logger.Fatal(e.Start(":1323"))
}
```

*What just happened:* `e.Group("/api/v1")` returns a group value (`v1`) that carries the prefix. Calling
`v1.GET("/books", ...)` registers the route at the **combined** path `/api/v1/books`. The group has the
same method functions as the instance — `v1.GET`, `v1.POST`, and so on — so routes read cleanly with the
shared prefix factored out.

💡 The bigger payoff is middleware. A group can attach middleware that runs only for its routes — for
example, requiring auth on everything under `/admin`:

```go
// authMiddleware is defined in Phase 5 — shown here only to make the shape concrete.
admin := e.Group("/admin", authMiddleware)   // middleware as a second argument
admin.GET("/stats", adminStats)              // protected: auth runs first

// You can also attach it after creating the group:
admin.Use(authMiddleware)
```

*What just happened:* passing `authMiddleware` as the second argument to `e.Group` (or calling
`admin.Use(...)`) means every route in that group runs the middleware before its handler — so `/admin/*`
is protected without repeating the check in each handler. **What middleware actually is, and how to
write `authMiddleware`, is Phase 5.** For now, hold the shape: groups bundle a prefix *and* shared middleware.

## Recap

- A route is **method + path → handler**; `GET /books` and `POST /books` are distinct routes that share a
  path but not a handler.
- Register routes with `e.GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS(path, handler)`, or `e.Any` for every
  method at once.
- **Path params** (`/books/:id`) are read with `c.Param("id")` and are **always strings** — convert them
  yourself. The wildcard `*` captures the rest of the path via `c.Param("*")`.
- **Query params** are read with `c.QueryParam("author")` (returns `""` when absent) or
  `c.QueryParams()` for the whole `url.Values` bag.
- **Groups** (`e.Group("/api/v1")`) factor out a shared prefix, and can carry shared middleware via a
  second argument or `g.Use(...)`.

## Quick check

```quiz
[
  {
    "q": "You register e.GET(\"/books\", listBooks). A request comes in as POST /books. What happens?",
    "choices": ["listBooks runs anyway", "Echo returns 405 Method Not Allowed because no handler matches that method+path", "Echo runs the first route in the tree", "The server panics"],
    "answer": 1,
    "explain": "A route is method AND path. GET /books and POST /books are different routes; with no POST handler registered, Echo responds 405 Method Not Allowed."
  },
  {
    "q": "For the route /books/:id, what does c.Param(\"id\") return for a request to /books/42?",
    "choices": ["The integer 42", "The string \"42\"", "nil", "An error you must handle"],
    "answer": 1,
    "explain": "Path params are always strings. c.Param(\"id\") returns \"42\"; convert it yourself with strconv.Atoi if you need a number."
  },
  {
    "q": "A request to GET /api/v1/books has no query string. What does c.QueryParam(\"author\") return?",
    "choices": ["An error", "nil", "An empty string \"\"", "It panics on a missing key"],
    "answer": 2,
    "explain": "c.QueryParam never errors on a missing key — it returns \"\". Check for the empty string to decide whether a filter was actually requested."
  }
]
```

[← Phase 1: What Echo Is & Your First Server](01-what-echo-is.md) · [Guide overview](_guide.md) · [Phase 3: Binding & Validation →](03-binding-and-validation.md)
