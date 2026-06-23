---
title: "Building a REST API"
guide: "gin-from-zero"
phase: 6
summary: "Assemble routing, binding, and responses into full CRUD for the tasks resource: an in-memory store guarded by a mutex, five handlers over one collection, wired to a versioned route group."
tags: [gin, go, rest, api, crud]
difficulty: intermediate
synonyms: ["gin rest api", "gin crud", "gin tasks api", "gin handlers", "gin in-memory store", "go rest api example"]
updated: 2026-06-23
---

# Building a REST API

This is the phase where it all comes together. For five phases you've collected the pieces — the engine and its routes, route groups, binding JSON onto structs, validation tags, `c.JSON` and status codes, middleware. None of those were ends in themselves. They were parts for *this*: a real REST API you can hit with `curl` and watch behave like the services you'll build at work.

We're going to grow the tasks API from "a few scattered handlers" into one complete, coherent resource. By the end you'll have create, read, update, and delete all wired up — and, more importantly, a mental model that makes the next resource you build feel like filling in a template.

## The mental model: a resource is five handlers over one collection

> 💡 A REST **resource** is a *collection of things* plus the five standard operations you can do to it. For our tasks, that's: **list** them all, **get** one by id, **create** a new one, **update** an existing one, and **delete** one. That's the whole shape. Five handlers, one collection. Every resource you ever build — users, orders, invoices, comments — is the same five verbs over a different noun.

Those five operations map onto HTTP methods and paths so predictably that the mapping is practically a law:

| Operation | Method & path | Success status |
|-----------|---------------|----------------|
| List all | `GET /tasks` | `200 OK` |
| Get one | `GET /tasks/:id` | `200 OK` (or `404`) |
| Create | `POST /tasks` | `201 Created` |
| Update | `PUT /tasks/:id` | `200 OK` (or `404`) |
| Delete | `DELETE /tasks/:id` | `204 No Content` (or `404`) |

Notice the symmetry: the *collection* (`/tasks`) is where you list and create; a *single item* (`/tasks/:id`) is where you get, update, and delete. Once you see that, you're not memorizing five unrelated functions — you're filling in a known grid. We'll state the grid, then build it cell by cell.

## The store: shared state, guarded

Before handlers, we need somewhere to keep tasks. We'll use an in-memory store — a plain Go map behind a counter. But there's a trap here that catches people who came from single-threaded backgrounds, so let's name it before we write the code.

> ⚠️ Gin handles requests **concurrently**. Every incoming request runs its handler in its own goroutine, and two of them can hit your map at the *exact same moment*. Go maps are not safe for concurrent read+write — a concurrent map write will crash your program with a `fatal error: concurrent map writes` (and it won't be a recoverable panic; it kills the process). Any state shared across requests must be guarded. We'll use a `sync.RWMutex`: many readers at once, one writer alone.

```go
package main

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

type store struct {
	mu     sync.RWMutex
	tasks  map[int]Task
	nextID int
}

func newStore() *store {
	return &store{
		tasks:  make(map[int]Task),
		nextID: 1,
	}
}
```

*What just happened:* `Task` is our stored model — `ID`, `Title`, `Done`, each with a `json` tag so it serializes with lowercase keys. The `store` bundles three things that belong together: the `map[int]Task` of tasks keyed by id, a `nextID` counter for assigning fresh ids, and an `RWMutex` that guards both. `newStore` hands back a ready-to-use store with an initialized map (a nil map panics on write) and the counter starting at 1. Every handler will reach for the mutex before touching `tasks` or `nextID` — that discipline is what keeps concurrent requests from corrupting each other.

> 📝 An `RWMutex` distinguishes read locks (`RLock`/`RUnlock`) from write locks (`Lock`/`Unlock`). Reads can overlap each other freely; a write blocks everyone until it's done. For a read-heavy API that's a nice fit. If this feels like overkill for now, a plain `sync.Mutex` (one lock for everything) would also be correct — just less concurrent on reads.

## The five handlers

We'll hang the handlers as methods on `*store`, so each one has direct access to the map and the lock. Method-on-store keeps the wiring tidy and means we don't reach for package-level globals. Here they are, one per operation.

### List — `GET /tasks`

```go
func (s *store) list(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]Task, 0, len(s.tasks))
	for _, t := range s.tasks {
		out = append(out, t)
	}
	c.JSON(http.StatusOK, out)
}
```

*What just happened:* We took a *read* lock (`RLock`) because we're only looking, `defer`-ing the unlock so it releases no matter how the function exits. We copy the map's values into a slice and return it with `200`. The `make([]Task, 0, ...)` detail matters: an empty slice serializes to `[]`, but a `nil` slice serializes to `null` — and clients much prefer an empty array to a surprise `null`. Pre-sizing with `len(s.tasks)` is a small efficiency, not a requirement.

### Get one — `GET /tasks/:id`

```go
func (s *store) getOne(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be an integer"})
		return
	}

	s.mu.RLock()
	t, ok := s.tasks[id]
	s.mu.RUnlock()

	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	c.JSON(http.StatusOK, t)
}
```

*What just happened:* We pulled `:id` from the path with `c.Param("id")` and converted it with `strconv.Atoi` — a non-numeric id like `/tasks/abc` fails the conversion and earns a `400` before we ever touch the store. Then a quick read-locked map lookup. The `t, ok := s.tasks[id]` comma-ok idiom is the whole game: `ok` is `false` when the key is absent, which is exactly our `404` case. Found means `200` with the task. (You could bind `:id` with `ShouldBindUri` as in Phase 3; `strconv.Atoi` is the lighter-weight choice for a single param.)

### Create — `POST /tasks`

```go
type CreateTask struct {
	Title string `json:"title" binding:"required,min=1,max=120"`
	Done  bool   `json:"done"`
}

func (s *store) create(c *gin.Context) {
	var in CreateTask
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s.mu.Lock()
	id := s.nextID
	s.nextID++
	t := Task{ID: id, Title: in.Title, Done: in.Done}
	s.tasks[id] = t
	s.mu.Unlock()

	c.JSON(http.StatusCreated, t)
}
```

*What just happened:* This is Phase 3's binding plus Phase 4's responses, fused. We bind onto a separate `CreateTask` input struct — the client doesn't get to set the `id`, so the input contract differs from the stored `Task`. Binding fails on bad input and returns `400` with the validator's message. On success we take a *write* lock (`Lock`, not `RLock` — we're mutating), grab and bump `nextID`, build the `Task`, and store it. Crucially, both the id-bump and the map-write happen inside one lock, so two simultaneous creates can never grab the same id. We return `201 Created` with the new task, id and all, so the client learns what id it got.

### Update — `PUT /tasks/:id`

```go
func (s *store) update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be an integer"})
		return
	}

	var in CreateTask
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.tasks[id]; !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	t := Task{ID: id, Title: in.Title, Done: in.Done}
	s.tasks[id] = t
	c.JSON(http.StatusOK, t)
}
```

*What just happened:* `PUT` is "replace the whole thing at this id," so we do both jobs the create and get-one did: parse `:id`, then bind the new body. We reuse `CreateTask` as the input shape since a full replace wants the same fields. Under a write lock, we check the task exists — `404` if it doesn't, because `PUT` to a missing id is a not-found, not a silent create here — then overwrite it with a fresh `Task` carrying the original `id`. We return the updated task with `200`. Note the `defer s.mu.Unlock()` this time: with two early-return paths inside the lock, `defer` is the safe way to guarantee the unlock fires on every branch.

### Delete — `DELETE /tasks/:id`

```go
func (s *store) remove(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be an integer"})
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.tasks[id]; !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	delete(s.tasks, id)
	c.Status(http.StatusNoContent)
}
```

*What just happened:* We parse and validate the id, take a write lock, and confirm the task exists — `404` if not, so a delete tells you honestly whether there was anything to delete. If it's there, Go's built-in `delete` removes the key, and we reply `204 No Content`. We use `c.Status` rather than `c.JSON` because `204` means "success, and there's deliberately no body" — sending JSON with a `204` is contradictory. (We named the method `remove`, not `delete`, because `delete` is a Go built-in and shadowing it would be asking for confusion.)

## Wiring it to a route group

Handlers do nothing until they're registered. Here's `main`, mapping each handler to its method and path inside a versioned group — the `/api/v1` prefix from Phase 2, so a future `/api/v2` can live alongside it without breaking clients.

```go
func main() {
	r := gin.Default()
	s := newStore()

	v1 := r.Group("/api/v1")
	{
		v1.GET("/tasks", s.list)
		v1.POST("/tasks", s.create)
		v1.GET("/tasks/:id", s.getOne)
		v1.PUT("/tasks/:id", s.update)
		v1.DELETE("/tasks/:id", s.remove)
	}

	r.Run(":8080")
}
```

*What just happened:* `gin.Default()` gives us an engine with the Logger and Recovery middleware from Phase 5 already attached. We create one `store` and share it across all handlers — that single shared state is exactly why the mutex earned its keep. `r.Group("/api/v1")` returns a group whose routes all carry the `/api/v1` prefix; the `{ }` braces are just a Go block for visual grouping (they have no special meaning to Gin, but they read nicely). Each `v1.METHOD(path, handler)` call binds one cell of our five-cell grid. `r.Run(":8080")` starts serving. That's the entire API — five lines of routing over a store and five handlers.

> 📝 The full paths are `/api/v1/tasks` and `/api/v1/tasks/:id`. Gin routes `GET /api/v1/tasks` and `GET /api/v1/tasks/:id` to different handlers even though they share a prefix, because the trailing `/:id` segment distinguishes them — that's the router doing exactly what Phase 2 promised.

## Driving it with curl

Theory's done. Let's hit the running server and watch the grid behave. Start it with `go run .`, then in another terminal:

**Create a task:**

```bash
curl -s -X POST localhost:8080/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title": "write the phase 6 guide"}'
```

```json
{"id":1,"title":"write the phase 6 guide","done":false}
```

*What just happened:* We POSTed a JSON body with just a `title`. Binding filled `Title`, left `Done` at its zero value (`false`), the store assigned `id: 1`, and we got `201` with the created task — including the id we now know to use for the next calls.

**Create another, then list them all:**

```bash
curl -s -X POST localhost:8080/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title": "ship it", "done": true}'

curl -s localhost:8080/api/v1/tasks
```

```json
[{"id":1,"title":"write the phase 6 guide","done":false},{"id":2,"title":"ship it","done":true}]
```

*What just happened:* The second create got `id: 2` from the counter. The `GET /api/v1/tasks` returned both as a JSON array with `200`. (Map iteration order in Go is randomized, so the order across calls isn't guaranteed — if you need a stable order, sort the slice before returning it.)

**Get one by id, then delete it:**

```bash
curl -s localhost:8080/api/v1/tasks/1

curl -s -i -X DELETE localhost:8080/api/v1/tasks/1
```

```json
{"id":1,"title":"write the phase 6 guide","done":false}
```

```
HTTP/1.1 204 No Content
```

*What just happened:* The `GET /tasks/1` returned task 1 with `200`. The `DELETE /tasks/1` returned `204` with an empty body — we used `-i` to show the status line, since there's no body to print. Ask for it again with `curl localhost:8080/api/v1/tasks/1` now and you'll get `404 {"error":"task not found"}`, because it's gone.

## The store is a stand-in

> 💡 Look back at the five handlers and notice what they *don't* depend on: nothing in them cares that the data lives in a map. They take input, validate it, call `s.something(id)`, and shape a response. That map is a placeholder for a real database. When you later swap it for [GORM](/guides/gorm-from-zero) talking to Postgres, the handler bodies barely change — `s.tasks[id]` becomes `db.First(&task, id)`, `s.tasks[id] = t` becomes `db.Save(&t)`, and the `RWMutex` disappears entirely because the database handles concurrency for you. The routing, binding, validation, status codes, and response shapes — everything this phase built — stay exactly as they are. That's the payoff of keeping the store behind a small interface in your head: the web layer and the data layer are separable.

## Recap

- **A resource is five handlers over one collection**: list (`GET /tasks`), get-one (`GET /tasks/:id`), create (`POST`), update (`PUT`), delete (`DELETE`) — a grid you fill in, not five unrelated functions.
- **Shared state must be guarded**: Gin runs handlers concurrently, so any state touched by multiple requests needs a `sync.Mutex`/`RWMutex` — read-lock for lookups, write-lock for mutations — or your map will crash the process.
- **Match status codes to operations**: `200` for reads and updates, `201` for create (return the new item with its id), `204` with no body for delete, `404` when an id isn't found, `400` when input is bad.
- **Keep input and stored models separate**: bind onto a `CreateTask` struct so the client can't set the `id`; the stored `Task` carries the id the server assigns.
- **The store is a database stand-in**: handlers depend on operations, not on the map — swap in GORM later and the routing, binding, and responses stay put.

## Quick check

```quiz
[
  {
    "q": "Why does the in-memory store need a sync.Mutex (or RWMutex)?",
    "choices": ["To make handlers run faster", "Because Gin handles requests concurrently and concurrent map read+write crashes the program", "Because Go maps require a lock to be created", "To enable JSON serialization of the map"],
    "answer": 1,
    "explain": "Gin runs each request in its own goroutine. Two goroutines writing the same map concurrently triggers a fatal 'concurrent map writes' error, so shared state must be guarded."
  },
  {
    "q": "Which status code does the create handler (POST /tasks) return on success, and why?",
    "choices": ["200 OK, because the request succeeded", "204 No Content, because nothing was returned", "201 Created, because a new resource was made and the new task (with its id) is returned", "302 Found, to redirect to the new task"],
    "answer": 2,
    "explain": "201 Created is the standard for a successful POST that makes a new resource, and returning the created task lets the client learn the assigned id."
  },
  {
    "q": "Why does the delete handler use c.Status(http.StatusNoContent) instead of c.JSON?",
    "choices": ["Because c.JSON does not support 204", "Because 204 means success with deliberately no body, so sending JSON would contradict it", "Because delete is faster without serialization", "Because the deleted task must not be revealed"],
    "answer": 1,
    "explain": "204 No Content signals success with no response body. Attaching a JSON body to a 204 is contradictory, so c.Status is the right call."
  }
]
```

[← Phase 5: Middleware](05-middleware.md) · [Guide overview](_guide.md) · [Phase 7: Error Handling & Project Structure →](07-errors-and-structure.md)