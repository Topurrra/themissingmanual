---
title: "Responses & Rendering"
guide: "echo-from-zero"
phase: 4
summary: "How Echo sends data back: every response helper returns an error you return - JSON with status codes, String/Blob/File/Redirect/NoContent, HTML templates via a Renderer, and serving static files."
tags: [echo, go, responses, json, templates, static]
difficulty: intermediate
synonyms: ["echo c.json", "echo response", "echo nocontent", "echo templates renderer", "echo static files", "echo c.string c.file"]
updated: 2026-07-10
---

# Responses & Rendering

In [Phase 3](03-binding-and-validation.md) you learned to read input safely. Now the other direction:
getting data back out to the client.

## The mental model: a response is something you *return*

In Echo, every helper that sends a response **also returns an `error`** - and you `return` that value
straight out of your handler. You don't call `c.JSON(...)` and then keep going; you `return c.JSON(...)`.

Think of it as: *pick a helper, pick a status code, return it.* That's the whole shape of a handler's
last line. The framework writes the response and propagates any write error up to Echo's error handler
(which you'll meet properly in [Phase 6](06-rest-api-and-errors.md)). Forgetting that little `return` is
the single most common Echo beginner bug - the response doesn't get sent, or your code runs past the
point where it should have stopped.

> 📝 The status code is always the **first argument** to these helpers, and it always comes from the
> `net/http` constants - `http.StatusOK` (200), `http.StatusCreated` (201), `http.StatusNotFound` (404),
> and friends. Use the named constants, not bare numbers; they read better and they're impossible to
> typo into a wrong-but-valid number.

We'll keep growing the **books API** from earlier phases. Our model stays the same:

```go
type Book struct {
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Author string `json:"author"`
}
```

*What just happened:* the `json:"..."` struct tags decide the field names Echo writes in the JSON output.
Without them you'd get `ID`, `Title`, `Author` (Go's exported-field casing); with them you get clean
lowercase keys.

## JSON: the workhorse

Most of what you return from an API is JSON, and `c.JSON(status, value)` is how. Echo marshals the value
and sets `Content-Type: application/json` for you. Here are the three status codes you'll reach for most:

```go
// GET /books/:id  → 200 with one book, or 404 if it's missing
e.GET("/books/:id", func(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	book, ok := store[id]
	if !ok {
		return c.JSON(http.StatusNotFound, map[string]string{
			"message": "book not found",
		})
	}
	return c.JSON(http.StatusOK, book)
})

// POST /books  → 201 with the created book
e.POST("/books", func(c echo.Context) error {
	var b Book
	if err := c.Bind(&b); err != nil {
		return err
	}
	b.ID = nextID()
	store[b.ID] = b
	return c.JSON(http.StatusCreated, b)
})
```

*What just happened:* notice every branch ends in `return c.JSON(...)`. The 404 path returns a small
JSON object so the client gets a parseable body, not an empty 404. The create path returns **201 Created**
(not 200) with the new book, including its freshly assigned `ID` - the main reason clients want the
created object echoed back.

Returning a **list** is the same call - just hand it a slice:

```go
// GET /books  → 200 with all books as a JSON array
e.GET("/books", func(c echo.Context) error {
	books := make([]Book, 0, len(store))
	for _, b := range store {
		books = append(books, b)
	}
	return c.JSON(http.StatusOK, books)
})
```

*What just happened:* we build the slice with `make([]Book, 0, ...)` rather than a `nil` slice. That
matters: a `nil` slice marshals to `null`, but an empty initialized slice marshals to `[]` - clients
iterating the response would rather get an empty array than `null`.

> 💡 During development, `c.JSONPretty(status, value, "  ")` indents the output so you can read it in a
> terminal. In production, stick with plain `c.JSON` - the extra whitespace is wasted bytes over the wire.

## The other response helpers

JSON isn't the only way to answer. Each of these follows the same return-an-error rule:

```go
// Plain text
return c.String(http.StatusOK, "pong")

// Raw HTML string (not a template - just a string of HTML)
return c.HTML(http.StatusOK, "<h1>Books</h1>")

// Raw bytes with a content type you choose
return c.Blob(http.StatusOK, "text/csv", []byte("id,title\n1,Dune\n"))

// Stream a file from disk (sets content type from the extension)
return c.File("reports/books.pdf")

// Redirect the browser elsewhere
return c.Redirect(http.StatusFound, "/books")

// Empty body - perfect for DELETE
return c.NoContent(http.StatusNoContent)
```

*What just happened:* each helper picks the right `Content-Type` for its job (`c.String` → text/plain,
`c.Blob` → whatever you pass, `c.File` → guessed from the extension) and writes the status. `c.NoContent`
is the one to remember: it sends a status with **no body at all**, exactly what a successful `DELETE`
should return.

Here's the clean DELETE that ties it together:

```go
// DELETE /books/:id  → 204 on success, 404 if it wasn't there
e.DELETE("/books/:id", func(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if _, ok := store[id]; !ok {
		return c.JSON(http.StatusNotFound, map[string]string{"message": "book not found"})
	}
	delete(store, id)
	return c.NoContent(http.StatusNoContent)
})
```

*What just happened:* on success there's nothing meaningful to send back - the resource is gone - so
`c.NoContent(http.StatusNoContent)` returns **204** with an empty body.

### Setting your own headers

Sometimes you need to add a header before you send the body - a cache directive, a custom `X-` header, a
location. You reach through to the underlying response writer:

```go
e.GET("/books/:id", func(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	book, ok := store[id]
	if !ok {
		return c.NoContent(http.StatusNotFound)
	}
	c.Response().Header().Set("X-Resource-Version", "1")
	return c.JSON(http.StatusOK, book)
})
```

*What just happened:* `c.Response().Header().Set("X-Resource-Version", "1")` sets a header. The order
matters - set headers **before** the response helper, since that helper writes the status line and
flushes headers. Set one after `c.JSON(...)` and it's too late; the bytes are already going out.

## HTML templates: the Renderer interface

Not every Echo app is an API - sometimes you render server-side HTML. Unlike some frameworks, Echo
doesn't ship a built-in template engine. Instead it defines a small interface and lets you plug in
whatever you like (almost always Go's standard `html/template`).

The interface is one method:

```go
type Renderer interface {
	Render(w io.Writer, name string, data any, c echo.Context) error
}
```

So you write a tiny type that satisfies it by wrapping `html/template`, assign it to `e.Renderer`, and
then call `c.Render(...)` in handlers. Here's the whole setup:

```go
import (
	"html/template"
	"io"

	"github.com/labstack/echo/v4"
)

// Template wraps a parsed set of html/template files and satisfies echo.Renderer.
type Template struct {
	templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data any, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func main() {
	e := echo.New()

	// Parse every .html file in views/ once at startup.
	e.Renderer = &Template{
		templates: template.Must(template.ParseGlob("views/*.html")),
	}

	e.GET("/books", func(c echo.Context) error {
		books := []Book{
			{ID: 1, Title: "Dune", Author: "Herbert"},
			{ID: 2, Title: "Neuromancer", Author: "Gibson"},
		}
		return c.Render(http.StatusOK, "books.html", books)
	})

	e.Logger.Fatal(e.Start(":1323"))
}
```

*What just happened:* `template.Must(template.ParseGlob(...))` parses all your templates once at boot and
panics if any fail to parse - a broken template should stop startup, not surface as a runtime surprise.
We hang that on `e.Renderer`. From then on `c.Render(status, "books.html", data)` runs `Render`, which
calls `ExecuteTemplate` with the data - here, our slice of books.

And the template file itself:

```html
<!-- views/books.html -->
<h1>Books</h1>
<ul>
  {{range .}}
    <li>{{.Title}} - {{.Author}}</li>
  {{end}}
</ul>
```

*What just happened:* the `data` you passed to `c.Render` arrives as `.` (dot) inside the template.
`{{range .}}` loops the slice; inside the loop, `.` is each `Book`, so `{{.Title}}` and `{{.Author}}`
pull its fields. Crucially, `html/template` **auto-escapes** these values - a title of
`<script>alert(1)</script>` renders as harmless text, not executable script. That's the whole reason to
use `html/template` and not string concatenation for HTML.

## Static files

For CSS, JavaScript, images, and other on-disk assets, Echo serves directories and single files directly:

```go
// Serve everything in the local "assets" dir under the /assets URL prefix.
// A request for /assets/app.css returns ./assets/app.css.
e.Static("/assets", "assets")

// Serve one specific file at one specific URL.
e.File("/favicon.ico", "images/favicon.ico")
```

*What just happened:* `e.Static(prefix, root)` maps a URL prefix to a folder on disk - great for a whole
`assets/` tree. `e.File(path, file)` wires a single URL to a single file, for one-offs like a favicon
that doesn't live where the URL implies.

> 💡 Most Echo services in the wild are pure JSON APIs - they use `c.JSON` and little else, and never
> touch a Renderer or static files at all. Templates and static serving are there when you need a
> server-rendered page or a small bundled front-end, but don't feel you must reach for them. Reach for
> the response helper that fits the job.

## Recap

- Every response helper **returns an `error` you return** - the handler's last line is
  `return c.Something(...)`. Forgetting the `return` is the classic Echo bug.
- `c.JSON(status, value)` is the API workhorse: **201** for creates, **404** for missing,
  and pair an empty initialized slice with 200 so lists serialize as `[]`, not `null`.
- `c.NoContent(http.StatusNoContent)` is the clean **204** answer for a successful `DELETE` - status, no body.
- Other helpers - `c.String`, `c.HTML`, `c.Blob`, `c.File`, `c.Redirect` - each set the right content type;
  set custom headers via `c.Response().Header().Set(...)` **before** sending.
- HTML rendering needs a Renderer: implement `echo.Renderer`, assign `e.Renderer`, call `c.Render`;
  `html/template` auto-escapes your data. Serve assets with `e.Static` / `e.File`.

## Quick check

```quiz
[
  {
    "q": "What's the idiomatic Echo response for a successful DELETE that has nothing to return?",
    "choices": ["c.JSON(http.StatusOK, nil)", "c.String(http.StatusOK, \"\")", "c.NoContent(http.StatusNoContent)", "return nil with no helper call"],
    "answer": 2,
    "explain": "c.NoContent(http.StatusNoContent) sends a 204 status with an empty body - exactly right for a successful delete."
  },
  {
    "q": "Why must you write `return c.JSON(...)` rather than just `c.JSON(...)`?",
    "choices": ["c.JSON returns an error that Echo expects you to propagate", "It runs faster", "Go requires return on the last line", "Without return the JSON is double-encoded"],
    "answer": 0,
    "explain": "Every response helper returns an error; returning it lets Echo's error handling work and stops the handler at the right point."
  },
  {
    "q": "How do you enable HTML template rendering in Echo?",
    "choices": ["Call e.EnableTemplates()", "Implement echo.Renderer, assign it to e.Renderer, then call c.Render", "Pass templates to echo.New()", "Use c.HTML with a file path"],
    "answer": 1,
    "explain": "Echo has no built-in engine: you implement the Renderer interface (usually wrapping html/template), set e.Renderer, and call c.Render."
  }
]
```

---

[← Phase 3: Binding & Validation](03-binding-and-validation.md) · [Guide overview](_guide.md) · [Phase 5: Middleware →](05-middleware.md)
