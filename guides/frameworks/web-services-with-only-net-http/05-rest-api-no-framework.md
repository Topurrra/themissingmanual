---
title: "A JSON REST API With No Framework"
guide: "web-services-with-only-net-http"
phase: 5
summary: "Assemble routing, JSON I/O, and middleware into a full CRUD messages API on the Go 1.22 mux - five handlers over one in-memory store, mutex-guarded, no framework anywhere."
tags: [net-http, go, rest, api, crud]
difficulty: advanced
synonyms: ["go rest api no framework", "net/http crud", "go stdlib rest api", "go messages api", "go 1.22 rest api", "go http handlers crud"]
updated: 2026-06-23
---

# A JSON REST API With No Framework

This is the phase where the pieces click together. You've met the [mux and Go 1.22 routing](02-handlers-and-routing.md), [reading requests and writing JSON](03-requests-and-json.md), and [middleware as a plain wrapper](04-middleware-is-a-wrapper.md). Now we build a complete CRUD API - a real **messages** service you can `curl` - using only the standard library.

Here's the mental model to anchor on, because it cuts through all the ceremony: **a REST resource is five plain handlers over one collection.** List, get-one, create, update, delete - that's the whole CRUD vocabulary. Each handler is an ordinary `func(w http.ResponseWriter, r *http.Request)`. The Go 1.22 mux maps a method-plus-path pattern to each one. That's it. When you reach for Gin or Echo later, what they hand you is *these same five handlers* with some boilerplate shaved off. Today you write them by hand, and afterward no framework's "REST controller" will ever look like magic again.

> 💡 We're not introducing new net/http concepts here - we're *composing* the ones you already have. If a line surprises you, it's almost certainly explained in Phase 2, 3, or 4. This phase is the payoff for reading those.

## The store: shared state needs a guard

Before the handlers, we need somewhere to keep messages. For a learning API, an in-memory map is perfect - no database to set up. A `Message` is just an ID and some text:

```go
type Message struct {
	ID   int    `json:"id"`
	Text string `json:"text"`
}

type Store struct {
	mu     sync.Mutex
	data   map[int]Message
	nextID int
}

func NewStore() *Store {
	return &Store{data: make(map[int]Message), nextID: 1}
}
```

*What just happened:* `Store` bundles three things: the `data` map keyed by ID, a `nextID` counter for handing out fresh IDs, and - the part you cannot skip - a `sync.Mutex`. We hold the mutex in every method that touches `data` or `nextID`.

> ⚠️ This is the single most important line in the phase. **The Go HTTP server runs every request in its own goroutine**, so two clients can hit your handlers *at the same time*. If both write to the map concurrently, Go doesn't quietly corrupt it - it panics outright with `fatal error: concurrent map writes` and kills the whole process. A plain `map` is not safe for concurrent writes. The `sync.Mutex` makes each operation atomic: one goroutine at a time. Forget it and your API works perfectly in testing, then dies the first time two real users overlap.

Now the store methods, each one locking before it touches shared state:

```go
func (s *Store) List() []Message {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Message, 0, len(s.data))
	for _, m := range s.data {
		out = append(out, m)
	}
	return out
}

func (s *Store) Get(id int) (Message, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	m, ok := s.data[id]
	return m, ok
}

func (s *Store) Create(text string) Message {
	s.mu.Lock()
	defer s.mu.Unlock()
	m := Message{ID: s.nextID, Text: text}
	s.data[m.ID] = m
	s.nextID++
	return m
}

func (s *Store) Update(id int, text string) (Message, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.data[id]; !ok {
		return Message{}, false
	}
	m := Message{ID: id, Text: text}
	s.data[id] = m
	return m, true
}

func (s *Store) Delete(id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.data[id]; !ok {
		return false
	}
	delete(s.data, id)
	return true
}
```

*What just happened:* Every method follows the same rhythm - `Lock()`, `defer Unlock()`, then do the work. The `defer` guarantees the mutex is released even if the function returns early (as `Update` and `Delete` do when the ID is missing), so you can never accidentally leave the store locked. Notice `List` returns a freshly built slice and `Get`/`Update`/`Delete` return a `bool` saying whether the message existed - that boolean is what lets the *handlers* decide between `200` and `404`. The store knows nothing about HTTP; it's plain Go. That separation is deliberate and it's exactly what Phase 6 builds on.

## The five handlers

Now the HTTP layer. Each handler reads from `r`, calls a store method, and writes a response with the `writeJSON` helper from [Phase 3](03-requests-and-json.md):

```go
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
```

We'll hang the handlers off the store so they have something to read and write. A tiny `parseID` helper turns the `{id}` path wildcard into an `int`:

```go
func parseID(r *http.Request) (int, error) {
	return strconv.Atoi(r.PathValue("id"))
}
```

*What just happened:* `r.PathValue("id")` pulls the `{id}` segment the mux captured (Phase 2), and `strconv.Atoi` parses it to an `int`. It returns an error for garbage like `/messages/abc`, which the handlers translate into a `400`. One helper, reused by three handlers.

### List - `GET /messages` → 200

```go
func (s *Store) handleList(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.List())
}
```

*What just happened:* The simplest handler in the API. Ask the store for everything, write it as JSON with `200 OK`. Because `List` returns a non-nil empty slice when there are no messages, the client gets `[]`, not `null` - a small kindness that keeps JSON parsers on the other end happy.

### Get one - `GET /messages/{id}` → 200 or 404

```go
func (s *Store) handleGet(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	m, ok := s.Get(id)
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "message not found"})
		return
	}
	writeJSON(w, http.StatusOK, m)
}
```

*What just happened:* Two guards, then the happy path. A bad ID is the client's fault → `400`. A well-formed ID that doesn't exist → `404`, driven entirely by the `ok` boolean the store returned. Only when both checks pass do we send the message with `200`. Each guard ends in `return` - the "check, respond, return" rhythm from Phase 3 - so we never fall through and write a second response.

### Create - `POST /messages` → 201

```go
type createInput struct {
	Text string `json:"text"`
}

func (s *Store) handleCreate(w http.ResponseWriter, r *http.Request) {
	var in createInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if strings.TrimSpace(in.Text) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "text is required"})
		return
	}
	m := s.Create(in.Text)
	writeJSON(w, http.StatusCreated, m)
}
```

*What just happened:* The full intake pipeline from Phase 3, now wired to the store. **Decode** the body into `createInput`, bailing with `400` on broken JSON. **Validate** by hand - `strings.TrimSpace(in.Text) == ""` rejects empty or whitespace-only text, because net/http has no built-in validation; that `if` *is* your validation layer. Then `s.Create` assigns the next ID and stores the message, and we reply `201 Created` with the new resource (including its server-assigned `id`) so the client learns what to address it by.

### Update - `PUT /messages/{id}` → 200 or 404

```go
func (s *Store) handleUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	var in createInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if strings.TrimSpace(in.Text) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "text is required"})
		return
	}
	m, ok := s.Update(id, in.Text)
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "message not found"})
		return
	}
	writeJSON(w, http.StatusOK, m)
}
```

*What just happened:* Update is get-one and create fused together - it parses the ID *and* decodes a body *and* validates *and* checks existence. Four guards, each with its own status and `return`. The store's `Update` returns `false` when the ID is missing, so a `PUT` to a non-existent message is a clean `404` rather than a silent create. On success it's `200` with the updated message.

### Delete - `DELETE /messages/{id}` → 204

```go
func (s *Store) handleDelete(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid id"})
		return
	}
	if !s.Delete(id) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "message not found"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
```

*What just happened:* Delete the message, or `404` if it wasn't there. The success case is the `204 No Content` special case from Phase 3: call `WriteHeader(http.StatusNoContent)` and write *nothing* - no `writeJSON`, no body. A `204` means "done, and there's nothing to tell you," so resist the urge to return `{"ok": true}`; a body after `204` contradicts the status.

## Wiring it up

Five handlers, one mux, mapped by the Go 1.22 method+path patterns, wrapped in the Logging middleware from [Phase 4](04-middleware-is-a-wrapper.md):

```go
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func main() {
	store := NewStore()
	mux := http.NewServeMux()

	mux.HandleFunc("GET /messages", store.handleList)
	mux.HandleFunc("POST /messages", store.handleCreate)
	mux.HandleFunc("GET /messages/{id}", store.handleGet)
	mux.HandleFunc("PUT /messages/{id}", store.handleUpdate)
	mux.HandleFunc("DELETE /messages/{id}", store.handleDelete)

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", Logging(mux)))
}
```

*What just happened:* This is the whole API in one screen. Each `mux.HandleFunc` line reads like a routing table: a method, a path pattern, and the handler that serves it. The mux dispatches `GET /messages/{id}` and `PUT /messages/{id}` to *different* handlers even though the paths look identical, because in Go 1.22 the **method is part of the pattern** - that's the feature that makes hand-rolled CRUD pleasant. We pass `Logging(mux)` (not bare `mux`) to `ListenAndServe`, so every request flows through the middleware first and gets logged. The store is created once and shared across all handlers via the method receiver - and because it's mutex-guarded, that sharing is safe under the concurrent goroutines the server spawns.

## Driving it with curl

Start the server (`go run .`), then exercise every endpoint:

```bash
# Create two messages
$ curl -s -X POST localhost:8080/messages -d '{"text":"hello"}'
{"id":1,"text":"hello"}
$ curl -s -X POST localhost:8080/messages -d '{"text":"world"}'
{"id":2,"text":"world"}

# List them
$ curl -s localhost:8080/messages
[{"id":1,"text":"hello"},{"id":2,"text":"world"}]

# Get one
$ curl -s localhost:8080/messages/1
{"id":1,"text":"hello"}

# Update it
$ curl -s -X PUT localhost:8080/messages/1 -d '{"text":"hi there"}'
{"id":1,"text":"hi there"}

# Delete it (note -i to see the status - 204 has no body)
$ curl -s -i -X DELETE localhost:8080/messages/1 | head -1
HTTP/1.1 204 No Content

# A missing message is a clean 404
$ curl -s localhost:8080/messages/999
{"error":"message not found"}
```

*What just happened:* Every status code path you wrote, exercised from the outside. Create returns `201` with the server-assigned ID; list returns the array; update mutates in place; delete sends a bodiless `204` (the `-i` flag prints the status line so you can see it); and a request for a non-existent ID returns the `404` JSON your `handleGet` produces. This is a working REST API - and there isn't a framework import anywhere in the file.

## So... do you need a framework?

Now the honest comparison, because you've earned it by building the thing.

> 💡 For *basic CRUD over one resource*, this is roughly the same amount of code a framework would have you write. The five handlers, the validation, the status codes - Gin or Echo don't make those disappear; they're inherent to the job. So where does a framework actually pay for itself? Three places: **validation** (declarative tag-based binding instead of hand-written `if` checks, which matter once you have ten fields per request), **many routes** (route groups, shared prefixes, and per-group middleware get unwieldy by hand at thirty endpoints), and **ecosystem** (off-the-shelf middleware for auth, CORS, rate limiting, request IDs that you'd otherwise write yourself). For a handful of endpoints, the stdlib is genuinely enough - and now you can tell *when* you've crossed the line. [Phase 7](07-what-frameworks-add.md) maps each of these conveniences back onto exactly the net/http code you just wrote.

## Recap

- A REST resource is **five plain handlers over one collection**: list, get-one, create, update, delete - the same five a framework gives you, written by hand.
- The in-memory `Store` must be **mutex-guarded**: the server runs each request in its own goroutine, and concurrent writes to a bare map panic with `concurrent map writes`. `Lock()` + `defer Unlock()` in every method.
- Handlers read with `r.PathValue("id")` → `strconv.Atoi`, decode bodies with `json.NewDecoder`, validate by hand (no built-in validation), and respond with `writeJSON` - using the store's `bool` return to choose `200` vs `404`.
- Status codes map to intent: `200` read, `201` create, `204` delete (no body), `400` bad input, `404` missing. Each guard ends in `return`.
- The Go 1.22 mux routes by **method+path** (`"GET /messages/{id}"` vs `"PUT /messages/{id}"`), and you wrap the whole mux in Logging middleware when starting.
- For basic CRUD this is about as much code as a framework; frameworks earn their keep with heavy validation, many routes, and middleware ecosystems - see [Phase 7](07-what-frameworks-add.md).

## Quick check

```quiz
[
  {
    "q": "Why does the in-memory Store need a sync.Mutex?",
    "choices": [
      "To make JSON encoding thread-safe",
      "Because the HTTP server handles each request in its own goroutine, and concurrent writes to a plain map panic",
      "Maps are slow without a lock around them",
      "The Go 1.22 mux requires handlers to be synchronized"
    ],
    "answer": 1,
    "explain": "Go's HTTP server runs every request in a separate goroutine. A plain map isn't safe for concurrent writes - two overlapping requests trigger a 'fatal error: concurrent map writes' panic. The mutex serializes access."
  },
  {
    "q": "How does the mux send GET /messages/{id} and PUT /messages/{id} to different handlers despite identical paths?",
    "choices": [
      "It inspects the request body to decide",
      "In Go 1.22 the HTTP method is part of the route pattern, so each method+path pair maps to its own handler",
      "You register one handler and switch on r.Method inside it",
      "It can't - you need a third-party router for that"
    ],
    "answer": 1,
    "explain": "Go 1.22 added method-prefixed patterns. 'GET /messages/{id}' and 'PUT /messages/{id}' are distinct patterns, so the mux dispatches each to a different handler - no manual r.Method switch needed."
  },
  {
    "q": "What does handleDelete write on a successful delete?",
    "choices": [
      "200 OK with {\"ok\": true}",
      "201 Created with the deleted message",
      "204 No Content with no body at all",
      "404 Not Found"
    ],
    "answer": 2,
    "explain": "A successful delete returns 204 No Content: call w.WriteHeader(http.StatusNoContent) and write nothing. A 204 means there's no body, so returning JSON would contradict the status."
  }
]
```

[← Phase 4: Middleware Is Just a Wrapper](04-middleware-is-a-wrapper.md) · [Guide overview](_guide.md) · [Phase 6: Structure, Context & Graceful Shutdown →](06-structure-and-shutdown.md)
