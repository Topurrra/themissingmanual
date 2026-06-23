---
title: "Reading Requests, Writing JSON"
guide: "web-services-with-only-net-http"
phase: 3
summary: "Pull data out of a request with PathValue, query, headers, and JSON body decoding, then write JSON back in the right header-status-body order — including the superfluous-WriteHeader trap and validation by hand."
tags: [net-http, go, json, request, response]
difficulty: intermediate
synonyms: ["go read request body json", "go write json response", "r.PathValue query", "go json.NewDecoder Encoder", "go writeheader content-type order", "net/http json"]
updated: 2026-06-23
---

# Reading Requests, Writing JSON

Here's the mental model to hold for this whole phase, because everything else hangs off it: **a handler reads from one thing and writes to another.** It reads from `*http.Request` — the incoming request, with its path, query string, headers, and body. It writes to `http.ResponseWriter` — the outgoing response, where you set headers, a status code, and the body. That's the entire conversation.

Notice what's *not* in that sentence: no framework, no "context object," no magic binding layer. `*http.Request` and `http.ResponseWriter` are plain standard-library types. JSON isn't special either — it's `encoding/json` applied to the body on the way in and to the writer on the way out. Once you see a handler as "read from `r`, write to `w`, with `encoding/json` doing the translation on each side," every Go web handler you'll ever read becomes legible.

> 💡 You already met `r.PathValue` in [Phase 2](02-handlers-and-routing.md). This phase fills in the *other* three sources of input (query, headers, body) and the full story of writing a response. The running example stays the **messages** service: a `Message` is just `{id, text}`.

## Reading from the request

Let's gather every kind of input a handler typically needs. Imagine a route registered as `GET /messages/{id}` — we want the path value, a query flag, and an auth header.

```go
type Message struct {
	ID   string `json:"id"`
	Text string `json:"text"`
}

func getMessage(w http.ResponseWriter, r *http.Request) {
	// 1. Path wildcard — from the {id} in the route pattern.
	id := r.PathValue("id")

	// 2. Query string — /messages/42?verbose=true
	verbose := r.URL.Query().Get("verbose")

	// 3. Header — case-insensitive lookup.
	auth := r.Header.Get("Authorization")

	fmt.Printf("id=%q verbose=%q auth=%q\n", id, verbose, auth)
}
```

*What just happened:* Three different inputs, three different accessors, all from the standard library. `r.PathValue("id")` reads the `{id}` segment the mux captured. `r.URL.Query()` parses the query string into a map-like value and `.Get("verbose")` returns the first value (or `""` if absent — it never panics on a missing key). `r.Header.Get("Authorization")` looks up a header *case-insensitively*, so `authorization` or `AUTHORIZATION` resolve the same. Every one of these returns an empty string when the thing isn't there, so you check for `""` rather than guarding against a nil.

### Decoding a JSON body

For a `POST` or `PUT`, the interesting data lives in the request body — a stream of bytes you decode with `encoding/json`. The idiom is to declare a struct for the shape you expect and decode into it.

```go
type CreateMessage struct {
	Text string `json:"text"`
}

func createMessage(w http.ResponseWriter, r *http.Request) {
	var in CreateMessage
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}
	fmt.Printf("got text: %q\n", in.Text)
}
```

*What just happened:* `json.NewDecoder(r.Body)` wraps the body stream, and `.Decode(&in)` reads it and fills the struct — matching JSON keys to fields via the `json:"text"` tags. The part people skip and then regret: **decoding can fail** (malformed JSON, a number where a string was expected, an empty body), so you check `err` and, when it's non-nil, return `400 Bad Request` and `return` immediately. Forgetting that `return` is a classic bug — without it the handler keeps running on garbage data.

> ⚠️ By default the decoder *silently ignores* JSON keys that don't match any struct field. A client typo like `{"txt": "hi"}` decodes happily into a `Message` with an empty `Text` and no error. If you'd rather reject unknown fields, opt in:
> ```go
> dec := json.NewDecoder(r.Body)
> dec.DisallowUnknownFields()
> if err := dec.Decode(&in); err != nil { /* 400 */ }
> ```
> Now an unexpected key is an error you can catch instead of a confusing empty value later.

## Writing JSON back

Writing a response has three moving parts, and — this is the one thing to burn into memory — **they happen in a fixed order**: set headers, then write the status code, then write the body. Get the order wrong and Go quietly ignores half of what you asked for.

Because you'll do this on every endpoint, write it once as a helper:

```go
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
```

*What just happened:* One function captures the whole ritual. `w.Header().Set(...)` declares the content type so the client parses the body as JSON. `w.WriteHeader(status)` sends the status line (e.g. `201 Created`). `json.NewEncoder(w).Encode(v)` serializes `v` straight to the response stream — no intermediate `[]byte`, no `Marshal` then `Write`. From here on, returning JSON is a one-liner: `writeJSON(w, http.StatusOK, msg)`.

### ⚠️ The #1 net/http gotcha: order matters

This trips up nearly everyone once. The rules, stated plainly:

- `w.Header().Set(...)` must come **before** `w.WriteHeader(...)`.
- `w.WriteHeader(...)` must come **before** you write any body.
- **The first call to `w.Write` (which `Encode` does for you) implicitly sends `200 OK` if you haven't called `WriteHeader` yet.**

That last rule is the trap. Look at this *wrong* version:

```go
func brokenHandler(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"error": "nope"}) // sends 200 NOW
	w.WriteHeader(http.StatusBadRequest)                          // too late — ignored
}
```

*What just happened:* The `Encode` call writes to the body, and because no status was set yet, Go automatically commits `200 OK` and flushes the headers. The *next* line tries to set `400`, but the status line already went out the door — so the client receives `200`, your `400` is silently dropped, and Go logs a `http: superfluous response.WriteHeader call` warning to stderr. Nothing crashes; you just get the wrong status and a log line that's easy to miss. The fix is always the same order: **header, status, body** — exactly what `writeJSON` enforces.

> 💡 Mnemonic: *headers and status are an envelope, the body is the letter.* You can't change the address after the envelope is sealed and mailed.

## Status codes, and the no-body case

The status constants live in `net/http` — use the named ones (`http.StatusCreated`) over magic numbers (`201`); they read better and the compiler catches typos. A quick map for the messages service:

- `200 OK` — `http.StatusOK`, a successful read.
- `201 Created` — `http.StatusCreated`, you just made a resource.
- `400 Bad Request` — `http.StatusBadRequest`, the client sent something invalid.
- `404 Not Found` — `http.StatusNotFound`, no such message.
- `204 No Content` — `http.StatusNoContent`, success with *nothing to return* (e.g. a delete).

That last one is special: **204 means there is no body.** You send the status and stop.

```go
func deleteMessage(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	delete(store, id) // pretend store is our in-memory map
	w.WriteHeader(http.StatusNoContent) // no Encode, no Write — that's the point
}
```

*What just happened:* For a `204` you call `WriteHeader` and then write *nothing*. No `Content-Type`, no encoder. Writing a body after a `204` contradicts the status (and earns you another superfluous-WriteHeader-style complaint), so resist the urge to be "helpful" with a `{"ok": true}`. Silence is the correct response.

## Validation by hand

Here's a truth that surprises people from framework backgrounds: **net/http has no built-in validation.** Decoding fills the struct; it does not check that `Text` is non-empty, or under some length, or anything else. That's your job, in plain Go, right after the decode.

Let's put the whole pipeline together — decode, check, respond — for creating a message:

```go
func createMessage(w http.ResponseWriter, r *http.Request) {
	var in CreateMessage
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	// Validation is just normal Go — no magic.
	if strings.TrimSpace(in.Text) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "text is required"})
		return
	}

	msg := Message{ID: newID(), Text: in.Text}
	store[msg.ID] = msg

	writeJSON(w, http.StatusCreated, msg)
}
```

*What just happened:* The handler reads top to bottom as the request's life story. **Decode** into `in`, bailing with `400` if the JSON is broken. **Validate** with an ordinary `if` — `strings.TrimSpace(in.Text) == ""` rejects empty or whitespace-only text, again with `400` and an immediate `return`. Only once the input is trustworthy do we build the `Message`, store it, and reply `201 Created` with the new resource as JSON. Notice there's no validation library and no annotations — just `if` statements you can read and reason about. That directness *is* the net/http philosophy: nothing happens that you didn't write.

> 📝 Each guard ends in `return`. Skipping it means the handler keeps going and may write a *second* response — and now you've written headers twice, which produces (you guessed it) the superfluous-WriteHeader warning. "Check, respond, return" is the rhythm.

## Recap

- A handler **reads from `*http.Request`, writes to `http.ResponseWriter`** — both plain stdlib, with `encoding/json` doing the translation on each side.
- Inputs come from four places: path (`r.PathValue("id")`), query (`r.URL.Query().Get("q")`), headers (`r.Header.Get(...)`, case-insensitive), and the body (`json.NewDecoder(r.Body).Decode(&in)`). A failed decode means `400`; add `DisallowUnknownFields()` to reject typos.
- Writing JSON has a **fixed order**: `Header().Set` → `WriteHeader(status)` → `Encode(body)`. Wrap it in a `writeJSON` helper so you never get it wrong.
- The first body write implicitly sends `200 OK`, so a `WriteHeader` *after* writing is ignored and logs `superfluous response.WriteHeader call`. Order is everything.
- Use named status constants; `204 No Content` carries **no body**. There's **no built-in validation** — check fields with ordinary `if` statements and return `400`, always followed by `return`.

## Quick check

```quiz
[
  {
    "q": "In writeJSON, what is the correct order of the three calls?",
    "choices": [
      "WriteHeader, then Header().Set, then Encode",
      "Header().Set, then WriteHeader, then Encode",
      "Encode, then Header().Set, then WriteHeader",
      "Order doesn't matter as long as all three run"
    ],
    "answer": 1,
    "explain": "Headers must be set before the status, and the status before the body. The first body write implicitly commits the status, so anything set afterward is ignored."
  },
  {
    "q": "What does Go do when you call w.Write (or Encode) without having called w.WriteHeader first?",
    "choices": [
      "Returns an error you must handle",
      "Panics with a missing-status error",
      "Implicitly sends 200 OK before writing the body",
      "Buffers the body until you set a status"
    ],
    "answer": 2,
    "explain": "The first write implicitly commits 200 OK. That's why a later WriteHeader is ignored and logs a 'superfluous response.WriteHeader call' warning."
  },
  {
    "q": "A client POSTs {\"text\": \"   \"} (only spaces). How does net/http reject it as invalid?",
    "choices": [
      "json.Decode returns an error for blank fields",
      "It doesn't — you validate by hand with an if and return 400",
      "A required:true struct tag enforces it automatically",
      "The mux rejects it before the handler runs"
    ],
    "answer": 1,
    "explain": "net/http has no built-in validation. Decoding succeeds with an empty Text; you check it yourself (e.g. strings.TrimSpace == \"\") and return 400."
  }
]
```

[← Phase 2: Handlers & Routing by Hand](02-handlers-and-routing.md) · [Guide overview](_guide.md) · [Phase 4: Middleware Is Just a Wrapper →](04-middleware-is-a-wrapper.md)
