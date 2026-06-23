---
title: "Requests & Responses with the Standard Library"
guide: "chi-from-zero"
phase: 4
summary: "chi gives you a router and nothing else for I/O — so you read JSON with encoding/json, write it with a tiny helper, and set headers, status, and body in the right order."
tags: [chi, go, json, request, response, stdlib]
difficulty: intermediate
synonyms: ["chi json request response", "go json decode encode", "go writeheader content-type", "chi read body", "go http json helper", "encoding/json http"]
updated: 2026-06-23
---

# Requests & Responses with the Standard Library

Here's the deal with chi, stated plainly so it never surprises you: chi is a
router and **nothing else**. It matches a method and path to a handler, and then
it hands you the same `w http.ResponseWriter` and `r *http.Request` you'd get
from the bare standard library. There's no `c.JSON(...)`, no `c.Bind(...)`, no
magic context object with convenience methods bolted on.

So all the request/response work — reading a JSON body, writing a JSON body,
choosing a status code — is done with the standard library, mostly the
`encoding/json` package plus `net/http`. That sounds like more work than Gin or
Echo, and in raw line count it is a little. But it's a small amount of code, you
write it once, and the payoff is that you're learning *Go's* HTTP model, not
chi's. Everything here works in any `net/http` program, framework or not.

> 📝 The mental model for this phase: **the request and response are streams of
> bytes, and `encoding/json` is your translator at both ends.** Reading = decode
> the request body's bytes into a struct. Writing = encode a struct into the
> response body's bytes. chi is not involved in either direction.

We'll keep growing the **articles API**. The data type is the same one from
earlier phases:

```go
type Article struct {
    ID    int    `json:"id"`
    Title string `json:"title"`
    Body  string `json:"body"`
}
```

*What just happened:* `Article` is a plain struct with JSON struct tags. Those
backtick tags tell `encoding/json` what each field is called in JSON
(`"title"`, not `"Title"`). The tags work in **both** directions — decoding and
encoding — which is why we define them once and never think about them again.

## Reading a JSON body

A client sends `POST /articles` with a JSON body. You want to turn those bytes
into a Go value. The tool is `json.NewDecoder`, which reads directly from
`r.Body` (an `io.Reader` — a stream), so you never have to load the whole body
into a string yourself.

A common pattern is to decode into a small **input struct** rather than straight
into `Article`. The input is "what the client is allowed to send" — usually not
the same as your full model (the client doesn't get to pick the `id`, for
instance).

```go
func createArticle(w http.ResponseWriter, r *http.Request) {
    var in struct {
        Title string `json:"title"`
        Body  string `json:"body"`
    }

    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        http.Error(w, "invalid JSON body", http.StatusBadRequest)
        return
    }

    // in.Title and in.Body now hold the decoded values.
    // ... create the article, assign an ID, store it ...
}
```

*What just happened:* `json.NewDecoder(r.Body)` wraps the request body stream.
`.Decode(&in)` reads the JSON and fills in the struct's fields by matching JSON
keys to struct tags — note the `&`, because Decode needs a pointer so it can
write into your variable. The critical part is the error check: **malformed JSON
is the client's fault, so it's a 400, not a 500.** `http.Error` writes a plain
text message and sets the status in one call. The bare `return` after it is
essential — without it, the handler would keep running on garbage data.

⚠️ A decode error covers a body that isn't valid JSON at all. It does **not**
catch JSON that's valid but wrong — `{"title": 5}` (number where a string is
expected) errors, but `{"titlee": "oops"}` (typo'd field) silently decodes to an
empty `Title`. By default, unknown fields are just ignored. If you'd rather
reject them — useful for catching client typos early — turn it on explicitly:

```go
dec := json.NewDecoder(r.Body)
dec.DisallowUnknownFields()
if err := dec.Decode(&in); err != nil {
    http.Error(w, "invalid JSON body", http.StatusBadRequest)
    return
}
```

*What just happened:* `DisallowUnknownFields()` flips the decoder into strict
mode, so a body with a key your struct doesn't have now produces an error
instead of being quietly dropped. It's a small line that turns a whole class of
silent client bugs into loud 400s. Use it when you control the clients and want
tight contracts; skip it for public APIs where forward-compatibility (clients
sending fields you don't know yet) is a feature.

## Writing JSON — and the one ordering rule that bites everyone

Now the other direction: you have an `Article` (or any value) and want to send it
back as JSON. There's no built-in `WriteJSON`, so everyone writes a tiny helper.
Here's the canonical one:

```go
func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(v)
}
```

*What just happened:* three steps, in this exact order. First, set the
`Content-Type` header so the client knows it's getting JSON. Second, write the
status line with `w.WriteHeader(status)`. Third, encode the value straight onto
`w` (the `ResponseWriter` is an `io.Writer`, so the encoder streams JSON bytes
into the response body). `any` is Go's alias for `interface{}`, so this helper
takes any value you can marshal.

⚠️ This is the **number-one stdlib HTTP gotcha**, so read it twice. The response
must be built in this order: **headers first, then status, then body.** The
reason is how HTTP works on the wire — the headers and status line are sent
*before* the body, and once any of those go out, they're locked. Concretely:

- `w.Header().Set(...)` must come **before** `w.WriteHeader(...)`. After
  `WriteHeader`, the header block is already on its way; setting a header after
  that is too late and is silently ignored.
- `w.WriteHeader(...)` must come **before** you write the body. The **first**
  call to `w.Write(...)` (which `Encode` does internally) flushes the status
  line — and if you never called `WriteHeader`, that first write implicitly
  sends **`200 OK`**. So if you encode the body and *then* try to set a 201,
  your 201 is ignored and the client already got a 200.

Get the order wrong and there's no crash, no error — just a response with the
wrong status or a missing header, discovered later in a confused debugging
session. Bake the order into the helper (as above) and you never think about it
again.

Using the helper makes handlers read cleanly:

```go
func createArticle(w http.ResponseWriter, r *http.Request) {
    var in struct {
        Title string `json:"title"`
        Body  string `json:"body"`
    }
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        http.Error(w, "invalid JSON body", http.StatusBadRequest)
        return
    }

    a := Article{ID: nextID(), Title: in.Title, Body: in.Body}
    writeJSON(w, http.StatusCreated, a)
}
```

*What just happened:* the handler decodes the input, builds a real `Article`
(assigning the server-controlled `ID` itself), and replies with `201 Created`
plus the new article as JSON. Read it top to bottom and the request/response
shape is obvious — exactly because the ordering complexity is hidden in
`writeJSON`.

## Status codes and the empty-body case

Status codes are just integer constants in `net/http`, and using the named ones
keeps your handlers readable. The ones you'll reach for constantly:

- `http.StatusOK` (200) — a normal successful GET.
- `http.StatusCreated` (201) — you just created a resource (POST).
- `http.StatusNoContent` (204) — success, but there's **nothing to send back**.
- `http.StatusBadRequest` (400) — the client's request was malformed.
- `http.StatusNotFound` (404) — the thing they asked for doesn't exist.

The 204 case is special because the rule is: **204 means no body, so don't write
one.** A `DELETE` that succeeds is the classic example:

```go
func deleteArticle(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    // ... remove the article with that id ...
    w.WriteHeader(http.StatusNoContent)
}
```

*What just happened:* we set the status to 204 and then **stop** — no
`writeJSON`, no `Encode`, nothing. There's no body to send, so we don't reach for
the helper at all. (If you accidentally wrote a body after a 204, you'd be
contradicting the status code, and some clients will complain.)

That snippet also quietly reuses two request-reading tools from earlier phases,
worth a one-line refresher since you'll use them in the same handlers as your
JSON work:

```go
id := chi.URLParam(r, "id")          // path param from a route like /articles/{id}
sort := r.URL.Query().Get("sort")    // query string param from ?sort=title
```

*What just happened:* `chi.URLParam(r, "id")` pulls a value out of the **path**
for routes declared with `{id}` (this is the one helper chi itself provides, and
it reads from data chi stashed on the request). `r.URL.Query().Get("sort")` is
pure stdlib and reads a **query-string** value, returning `""` if it's absent.
Both give you strings — converting `id` to an int with `strconv.Atoi` (and
handling the error as a 400) is on you.

## Validation: there's no net here

This is the honest tradeoff of the stdlib approach. After you decode `in`,
**nothing has checked that the data makes sense.** An empty title, a 50,000-word
body, a missing field — `encoding/json` doesn't care. Validation is your job, by
hand:

```go
if in.Title == "" {
    http.Error(w, "title is required", http.StatusBadRequest)
    return
}
```

*What just happened:* a plain `if`. That's the whole validation story in raw
stdlib — you check the fields you care about and return a 400 when something's
off. For two or three fields this is fine and arguably clearer than anything
fancier. For a large API with many rules, hand-written checks pile up fast, and
that's where a library earns its keep.

> 💡 Two ways to get more help without abandoning the stdlib model. (1) The
> `github.com/go-playground/validator` package lets you declare rules as struct
> tags — `validate:"required,min=1"` — and validate with one call; you opt into
> it, it doesn't take over your handlers. (2) chi ships a companion package,
> `github.com/go-chi/render`, with JSON helpers (`render.JSON`, `render.Bind`,
> `render.Status`) that wrap the decode/encode/order dance for you. Both are
> optional — the plain stdlib shown above is genuinely enough for most APIs, and
> it's the version that teaches you what's actually happening.

And that's the philosophical fork in the road. Gin and Echo come with
batteries — `c.ShouldBindJSON` decodes *and* validates in one call, `c.JSON`
handles the header/status/body order for you. chi deliberately ships none of
that, betting that a `writeJSON` helper and a few `if` statements are a fair
price for staying 100% standard-library-native. Neither choice is wrong; now you
know exactly what each one is trading away.

## Recap

- chi gives you a router and **nothing else** for I/O — you read and write with
  `encoding/json` and `net/http`, the same as bare stdlib.
- **Read** a body with `json.NewDecoder(r.Body).Decode(&in)`; a decode error is a
  client mistake, so return **400** and `return` immediately. Use
  `DisallowUnknownFields()` for strict contracts.
- **Write** JSON with a small helper, and respect the order: **header → status →
  body.** The first body write locks the status (and defaults to 200 if you
  never set one), so headers and `WriteHeader` must come first.
- Use named `net/http` status constants. **204 means no body** — set the status
  and write nothing.
- There's **no built-in validation** — check fields by hand, or opt into
  `go-playground/validator` / `go-chi/render`. That's the deliberate tradeoff
  versus Gin/Echo's batteries.

## Quick check

```quiz
[
  {
    "q": "In the writeJSON helper, what's the correct order of operations?",
    "choices": ["WriteHeader, then Set the Content-Type header, then Encode the body", "Set the Content-Type header, then WriteHeader, then Encode the body", "Encode the body, then WriteHeader, then Set the header", "Set the header and WriteHeader in any order, then Encode"],
    "answer": 1,
    "explain": "Headers must be set before WriteHeader, and WriteHeader before the body — once the body is written the status and headers are locked."
  },
  {
    "q": "A client sends a body that is not valid JSON. What should the handler do?",
    "choices": ["Return 500 Internal Server Error", "Ignore it and continue with zero values", "Return 400 Bad Request and stop processing", "Return 204 No Content"],
    "answer": 2,
    "explain": "A malformed body is the client's fault, so it's a 400, and you must return immediately so the handler doesn't run on garbage data."
  },
  {
    "q": "You want a successful DELETE to return 204 No Content. What do you write?",
    "choices": ["writeJSON(w, http.StatusNoContent, article)", "w.WriteHeader(http.StatusNoContent) and write no body", "json.NewEncoder(w).Encode(nil)", "http.Error(w, \"\", 204)"],
    "answer": 1,
    "explain": "204 means there is no body — set the status and write nothing at all."
  }
]
```

[← Phase 3: Middleware the Standard Way](03-middleware.md) · [Guide overview](_guide.md) · [Phase 5: Building a REST API →](05-building-a-rest-api.md)