---
title: "Responses & Rendering"
guide: "gin-from-zero"
phase: 4
summary: "Pick one render helper and one status code to answer a request: c.JSON for APIs, plus String, Data, File, and Redirect, HTML templates with auto-escaping, and serving static files."
tags: [gin, go, responses, json, templates, static]
difficulty: intermediate
synonyms: ["gin c.json", "gin response status", "gin html templates", "gin static files", "gin render", "gin c.string c.file"]
updated: 2026-07-10
---

# Responses & Rendering

By now you can route a request and read what the client sent. This phase is the other half of the
conversation: writing the answer back.

Here's the mental model that keeps the whole topic small. The context (`*gin.Context`) is your **one
writer**. For each request you make exactly two decisions - *what status code* and *which render
helper* - and the helper does the rest: it sets the right `Content-Type` header, serializes your value,
and writes the bytes. `c.JSON` turns a struct into JSON. `c.String` writes plain text. `c.HTML` renders
a template. `c.File` streams a file from disk. Pick one, give it a status, and that's the entire
response.

> 📝 One response per request. Once you've called a render helper, the body is written and the status is
> locked in - you can't call `c.JSON` and then `c.String` for the same request. Decide, then write once.

## JSON: the helper you'll reach for 95% of the time

Most Gin services are JSON APIs, so `c.JSON` is the one to know cold. It takes a status code and any Go
value, marshals the value to JSON, sets `Content-Type: application/json`, and writes it.

The status code is the *other* half of a good response, and Gin makes you use real HTTP semantics for it.
Use the constants from the standard `net/http` package - `http.StatusOK` (200), `http.StatusCreated`
(201), `http.StatusNotFound` (404) - never bare numbers like `200`. The constants read as English and
stop typos.

We'll keep growing the **tasks API** from the earlier phases. A task is this struct:

```go
type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}
```

Here are the three response shapes you'll write over and over - a single item, a list, and the
two-status pattern (200 when found, 404 when not):

```go
package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

var tasks = []Task{
	{ID: 1, Title: "Write the guide", Done: false},
	{ID: 2, Title: "Drink coffee", Done: true},
}

func main() {
	r := gin.Default()

	// A list of tasks → 200 OK
	r.GET("/tasks", func(c *gin.Context) {
		c.JSON(http.StatusOK, tasks)
	})

	// One task by id → 200 if found, 404 if not
	r.GET("/tasks/:id", func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		for _, t := range tasks {
			if t.ID == id {
				c.JSON(http.StatusOK, t)
				return
			}
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
	})

	// Create a task → 201 Created, echo back the new resource
	r.POST("/tasks", func(c *gin.Context) {
		var in Task
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		in.ID = len(tasks) + 1
		tasks = append(tasks, in)
		c.JSON(http.StatusCreated, in)
	})

	r.Run(":8080")
}
```

*What just happened:* Each handler ends in exactly one `c.JSON` call. `GET /tasks` returns the whole
slice as a JSON array. `GET /tasks/:id` returns the matched `Task` (200) or an error object (404) - note
the `return` after writing, so the loop doesn't fall through and try to write twice. `POST /tasks`
returns **201 Created** because a new resource was made, and echoes the created task back so the client
learns its assigned `ID`. That `gin.H{...}` is just Gin's shorthand for `map[string]interface{}` - a
quick way to build a small JSON object inline.

> 💡 Status codes carry meaning that clients, proxies, and your future monitoring all rely on. **201**
> for a successful create, **404** for a missing resource, **400** for bad input. Returning **200** for
> everything technically works but throws away free, standard signal.

A few JSON variants exist for when you need them, but reach for them rarely:

- `c.IndentedJSON(code, obj)` - pretty-printed with indentation. Handy for human-read debug endpoints; wasteful for production traffic.
- `c.PureJSON(code, obj)` - does **not** escape HTML characters like `<`, `>`, `&`. Plain `c.JSON` escapes them by default (safer); use `PureJSON` only when you specifically need the raw characters.
- `c.AsciiJSON(code, obj)` - escapes non-ASCII characters to `\uXXXX`, for transports that choke on UTF-8.

Default to `c.JSON`. The variants are there when a real requirement shows up, not before.

## The other response helpers

Not every response is JSON - the context has a writer for each common case, all following the same
"status + payload" shape:

```go
r.GET("/ping", func(c *gin.Context) {
	c.String(http.StatusOK, "pong")
})

r.GET("/greet/:name", func(c *gin.Context) {
	c.String(http.StatusOK, "Hello, %s!", c.Param("name"))
})

r.GET("/raw", func(c *gin.Context) {
	c.Data(http.StatusOK, "text/plain; charset=utf-8", []byte("raw bytes here"))
})

r.GET("/report.pdf", func(c *gin.Context) {
	c.File("./files/report.pdf")
})

r.GET("/old-path", func(c *gin.Context) {
	c.Redirect(http.StatusFound, "/tasks")
})
```

*What just happened:* `c.String` writes plain text and accepts `fmt`-style formatting - `"%s"` gets
filled by the `c.Param("name")` argument, same as `fmt.Sprintf`. `c.Data` is the escape hatch: you
hand it the exact `Content-Type` and a `[]byte`, and it writes them verbatim - useful for content you've
already serialized or generated. `c.File` streams a file straight from disk and figures out the
content type from the extension. `c.Redirect` sends a 302 (`http.StatusFound`) with a `Location`
header pointing at `/tasks`; the browser follows it.

If you need to set a response header yourself, do it **before** the render helper writes the body:

```go
r.GET("/tasks.json", func(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	c.Header("X-Total-Count", strconv.Itoa(len(tasks)))
	c.JSON(http.StatusOK, tasks)
})
```

*What just happened:* `c.Header(key, value)` adds a header to the response. Once `c.JSON` runs, the
status and headers are flushed with the body, so setting headers afterward is too late. Order matters:
headers first, then the body. (There's also `c.Status(code)` if you want to set just the status with no
body - for example a `204 No Content` after a successful delete.)

## HTML templates: server-rendered pages

Sometimes you're not returning data - you're returning a *page*. Gin renders HTML using Go's standard
`html/template` package. The flow is two steps: load your templates into the engine once at startup, then
render one by name inside a handler.

Say you have a file `templates/tasks.tmpl`:

```html
<!DOCTYPE html>
<html>
<head><title>{{ .title }}</title></head>
<body>
  <h1>{{ .title }}</h1>
  <ul>
    {{ range .tasks }}
      <li>{{ .Title }} {{ if .Done }}(done){{ end }}</li>
    {{ end }}
  </ul>
</body>
</html>
```

Wire it up and render it:

```go
func main() {
	r := gin.Default()
	r.LoadHTMLGlob("templates/*.tmpl")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "tasks.tmpl", gin.H{
			"title": "My Tasks",
			"tasks": tasks,
		})
	})

	r.Run(":8080")
}
```

*What just happened:* `r.LoadHTMLGlob("templates/*.tmpl")` parses every matching template file once when
the server starts and registers each by its filename. (`r.LoadHTMLFiles("a.tmpl", "b.tmpl")` does the
same for an explicit list.) In the handler, `c.HTML` takes a status, the template **name**, and the data.
Inside the template, `{{ .title }}` reads the `"title"` key from the `gin.H` map, and `{{ range .tasks }}`
loops over the slice - note `.Title` and `.Done` are the struct's exported fields, so they're capitalized.

> ⚠️ `html/template` **auto-escapes** by default. If a task title were `<script>alert(1)</script>`, the
> template renders it as harmless text, not a running script - that's your built-in defense against XSS.
> Don't reach for tricks to disable escaping unless you fully understand the security cost; the safe
> default is doing real work for you.

## Static files: assets and built frontends

The last piece is files you don't generate per-request - CSS, images, JavaScript, fonts, or the compiled
output of a frontend build. You point a URL prefix at a directory and Gin serves whatever's inside:

```go
func main() {
	r := gin.Default()

	r.Static("/assets", "./assets")              // GET /assets/app.css → ./assets/app.css
	r.StaticFile("/favicon.ico", "./favicon.ico") // one specific file at a fixed path

	r.Run(":8080")
}
```

*What just happened:* `r.Static("/assets", "./assets")` maps the URL prefix `/assets` to the local
`./assets` directory - a request for `/assets/img/logo.png` serves `./assets/img/logo.png`, with content
types and caching handled for you. `r.StaticFile` is the single-file version, perfect for a favicon or a
`robots.txt` that lives at one exact URL. (There's also `r.StaticFS` if you're serving from an embedded
`fs.FS` rather than the real filesystem - common when you bundle assets into the binary.)

> 💡 In practice most Gin services are pure JSON APIs, and templates and static files barely come up. They
> matter for two cases: small server-rendered pages (an admin panel, a status page), or serving a built
> single-page app's files alongside its API from one binary. If you're building an API consumed by a
> separate frontend, you may never touch this section - and that's normal.

## Recap

- The context is your **one writer**: choose a status code and one render helper, and that's the whole response. One response per request.
- `c.JSON(status, value)` is the workhorse - it marshals, sets `Content-Type`, and writes. Use it for nearly everything.
- Use `net/http` status constants with meaning: **201** on create, **404** when missing, **400** for bad input - not 200 for everything.
- Other helpers cover the rest: `c.String` (text, with formatting), `c.Data` (raw bytes), `c.File` (stream from disk), `c.Redirect` (302 + Location). Set headers with `c.Header` *before* writing the body.
- `r.LoadHTMLGlob` + `c.HTML` render server-side pages with Go's `html/template`, which auto-escapes to block XSS by default.
- `r.Static` / `r.StaticFile` serve assets and built frontends - but most real services are JSON-only and rarely need them.

## Quick check

Test the two decisions every response comes down to:

```quiz
[
  {
    "q": "A handler successfully creates a new task. Which response is most correct?",
    "choices": ["c.JSON(http.StatusOK, task)", "c.JSON(http.StatusCreated, task)", "c.String(http.StatusOK, \"created\")", "c.Status(http.StatusNoContent)"],
    "answer": 1,
    "explain": "A successful create should return 201 Created (http.StatusCreated) and echo the new resource so the client learns its assigned ID."
  },
  {
    "q": "You want to add an X-Total-Count header to a JSON response. When must you call c.Header?",
    "choices": ["After c.JSON, since the body comes first", "Before c.JSON, because the render helper flushes status and headers with the body", "It doesn't matter, order is irrelevant", "Only inside middleware, never in a handler"],
    "answer": 1,
    "explain": "Render helpers write the status, headers, and body together. Set headers before the body is written, or they're too late."
  },
  {
    "q": "Why does c.HTML render a task title of \"<script>alert(1)</script>\" as visible text instead of running it?",
    "choices": ["Gin strips all HTML tags from data", "Go's html/template auto-escapes output by default", "Browsers ignore scripts inside <li>", "You must manually call c.Escape first"],
    "answer": 1,
    "explain": "html/template auto-escapes interpolated values by default, which is your built-in XSS protection."
  }
]
```

---

[← Phase 3: Binding & Validating Input](03-binding-and-validation.md) · [Guide overview](_guide.md) · [Phase 5: Middleware →](05-middleware.md)