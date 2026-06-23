---
title: "Binding & Validating Input"
guide: "gin-from-zero"
phase: 3
summary: "Decode JSON, query strings, and URI params straight onto typed Go structs and validate them in one step with ShouldBind* and struct tags, so handlers stop poking at raw request data."
tags: [gin, go, binding, validation, json]
difficulty: intermediate
synonyms: ["gin bind json", "gin shouldbindjson", "gin validation", "gin struct tags binding", "gin validator", "gin bind query uri"]
updated: 2026-06-23
---

# Binding & Validating Input

In Phase 2 you pulled values out of the URL one at a time — `c.Param("id")`, `c.Query("done")` — and got back strings you had to massage by hand. That's fine for one parameter. The moment a client POSTs a JSON body with five fields, doing it by hand turns into a pile of `c.GetRawData`, `json.Unmarshal`, and "is this field actually present?" checks. Gin has a better way, and it's the part of the framework you'll reach for in almost every handler.

## The mental model: decode + validate, in one move

> 💡 **Binding** is one step that does two jobs: it *decodes* the incoming request (a JSON body, a query string, the URL path) onto a Go struct you define, and it *validates* that struct against rules you wrote as tags. After it succeeds, your handler works with normal, typed Go values — `in.Title` is a `string`, `in.Done` is a `bool` — not with raw bytes or `map[string]any`.

Think of the struct as a contract. You declare the shape you expect; binding either fills that shape with clean data or hands you an error explaining why it couldn't. Your handler logic never runs on half-parsed garbage, because you return early the instant binding fails.

That single idea — "describe the input as a struct, let Gin fill and check it" — is what this whole phase is about. Everything else is which method to call and which tags to write.

## `ShouldBindJSON` vs `BindJSON`: who handles the error?

Gin gives you two flavors of every binder, and the difference is one decision: *who writes the 400 response when the input is bad?*

- **`c.ShouldBindJSON(&obj)`** decodes and validates, then returns an `error` and **writes nothing**. If it fails, you decide the status code and the response body. This is the idiomatic choice — you stay in control.
- **`c.BindJSON(&obj)`** does the same decode and validate, but on failure it **automatically aborts the request with a `400` and a default error body**. Less typing, less control, and a response shape you didn't choose.

Reach for `ShouldBind*` by default. Here's the create-task handler for our tasks API, written the idiomatic way:

```go
type CreateTask struct {
    Title string `json:"title" binding:"required,min=1,max=120"`
    Done  bool   `json:"done"`
}

func create(c *gin.Context) {
    var in CreateTask
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    // From here on, in.Title and in.Done are clean, typed values.
    task := Task{ID: nextID(), Title: in.Title, Done: in.Done}
    c.JSON(http.StatusCreated, task)
}
```

*What just happened:* We declared a `CreateTask` struct describing the body we expect. `ShouldBindJSON(&in)` read the request body, unmarshalled it onto `in`, and checked the `binding` rules. If anything went wrong — malformed JSON, a missing `title`, a `title` over 120 characters — we got a non-nil `error`, returned `400` with a message *we* chose, and bailed before touching `in`. If it succeeded, the rest of the handler runs on trustworthy data.

> 📝 Note we bind onto a *separate* `CreateTask` struct, not directly onto our stored `Task{id, title, done}`. The input contract and the stored model are different things — the client doesn't get to set the `id`. Keeping them apart is a small habit that saves real bugs later.

## Struct tags: `json` names, `binding` validates

Two different tags do two different jobs on the same field, and mixing them up is a common early stumble:

- **`json:"title"`** tells the decoder *which JSON key maps to this field*. Without it, Gin matches case-insensitively on the field name, but being explicit is clearer and survives renames.
- **`binding:"required,min=1"`** tells the validator *what rules this field must satisfy*. Rules are comma-separated.

Gin's validation is powered by **[go-playground/validator v10](https://github.com/go-playground/validator)**, a mature library with a big rule vocabulary. The ones you'll actually use:

| Rule | Meaning |
|------|---------|
| `required` | Field must be present and non-zero |
| `email` | Must be a valid email address |
| `min` / `max` | String length, or numeric value, bounds |
| `gte` / `lte` | Numeric: greater/less than or equal |
| `oneof=a b c` | Must be exactly one of the listed values |
| `len` | Exact length |
| `numeric` | Must be a numeric string |

A richer input struct for the tasks API shows several at once:

```go
type CreateTaskRich struct {
    Title    string `json:"title" binding:"required,min=1,max=120"`
    Priority string `json:"priority" binding:"omitempty,oneof=low medium high"`
    Owner    string `json:"owner" binding:"omitempty,email"`
    Estimate int    `json:"estimate" binding:"gte=0,lte=40"`
}
```

*What just happened:* `Title` must be present and 1–120 characters. `Priority` is optional (`omitempty` skips validation when it's empty), but if supplied it must be exactly `low`, `medium`, or `high` — anything else is a `400`. `Owner` is optional but must look like an email when present. `Estimate` must land between 0 and 40 inclusive. All of that enforcement is declarative: no `if` statements in your handler, just tags.

## Binding query strings and URI params

JSON isn't the only thing you can bind. The same struct-driven approach works for the query string and for the path parameters from your routes — they just use different tags.

**Query string** uses `form` tags and `ShouldBindQuery`. This is the clean way to handle the list-with-filters endpoint:

```go
type ListQuery struct {
    Done  *bool `form:"done"`
    Limit int   `form:"limit" binding:"omitempty,gte=1,lte=100"`
}

func list(c *gin.Context) {
    var q ListQuery
    if err := c.ShouldBindQuery(&q); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    // q.Limit is an int; q.Done is *bool (nil = "not filtered").
}
```

*What just happened:* A request to `/tasks?done=true&limit=20` gets decoded onto `q` — Gin parses `"true"` into a real `bool` and `"20"` into a real `int`, with the `limit` bounds enforced. No more `strconv.Atoi` by hand. (We'll come back to why `Done` is a `*bool` in a second.)

**URI params** use `uri` tags and `ShouldBindUri`. Remember the `/tasks/:id` route from Phase 2 — here's how to bind and validate that `:id`:

```go
type TaskURI struct {
    ID int `uri:"id" binding:"required"`
}

func getOne(c *gin.Context) {
    var u TaskURI
    if err := c.ShouldBindUri(&u); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "id must be an integer"})
        return
    }
    // u.ID is an int parsed from the :id path segment.
}
```

*What just happened:* The `uri:"id"` tag wires the struct field to the `:id` route parameter. `ShouldBindUri` pulls the path segment and converts it to an `int`; a request to `/tasks/abc` fails the conversion and returns `400`, so your handler never sees a bad id. There's also **`c.ShouldBind`**, which picks the binder automatically based on the request's `Content-Type` (JSON body for `application/json`, form data otherwise) — handy when a handler accepts more than one input format.

## ⚠️ The zero-value gotcha

Here's the trap that bites everyone once. Go has no concept of "absent" for a plain `bool` or `int` — a missing field decodes to the type's **zero value**: `false` for `bool`, `0` for `int`, `""` for `string`.

That collides with validation in two ways:

```go
type UpdateTask struct {
    Done bool `json:"done" binding:"required"` // ⚠️ broken intent
}
```

*What just happened:* You wanted "`done` must be provided." But `required` rejects the **zero value**, and `false` *is* the zero value for `bool`. So a client sending `{"done": false}` — a perfectly valid, deliberate "mark it not done" — gets rejected as if the field were missing. `required` works well for strings and pointers (where empty/`nil` genuinely means absent); it does **not** distinguish "the client sent `false`" from "the client sent nothing" for a bare `bool`.

The fix when *absent* must differ from *false/0* is a **pointer**:

```go
type UpdateTask struct {
    Title *string `json:"title"` // nil = client didn't send it
    Done  *bool   `json:"done"`  // nil = absent; &false = explicit false
}

func update(c *gin.Context) {
    var in UpdateTask
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if in.Done != nil {
        // Client explicitly set done — apply *in.Done (could be false).
    }
    if in.Title != nil {
        // Client wants to change the title.
    }
}
```

*What just happened:* With `*bool`, a missing `done` decodes to `nil` and an explicit `{"done": false}` decodes to a pointer to `false`. Now you can tell them apart with a simple `nil` check — exactly what a PATCH-style partial update needs. The cost is a little pointer-dereferencing in the handler; the payoff is that "don't touch this field" and "set this field to false" stop being the same thing. When you don't need that distinction (a full create where every field is meant to be provided), plain values plus `required` on the strings is simpler and fine.

## Recap

- **Binding = decode + validate in one step**: describe the input as a struct, and Gin fills it with typed values and checks your rules, so handlers never run on raw or half-parsed data.
- **Prefer `ShouldBind*` over `Bind*`**: `ShouldBindJSON` returns an `error` and lets you choose the status and body; `BindJSON` auto-aborts with a default `400`.
- **Two tags, two jobs**: `json:"..."` (or `form:`/`uri:`) names the field; `binding:"..."` declares validation rules via go-playground/validator v10 (`required`, `email`, `min`/`max`, `oneof`, `gte`/`lte`, …).
- **One struct shape per source**: `ShouldBindJSON` for bodies, `ShouldBindQuery` (with `form` tags) for the query string, `ShouldBindUri` (with `uri` tags) for path params like `:id`.
- **Watch the zero value**: `required` rejects `false`/`0`/`""`, so it can't tell "absent" from "explicitly false" on bare `bool`/`int` — use pointers when that difference matters.

## Quick check

```quiz
[
  {
    "q": "What's the practical difference between c.ShouldBindJSON and c.BindJSON?",
    "choices": ["ShouldBindJSON validates but BindJSON does not", "ShouldBindJSON returns an error and writes nothing; BindJSON auto-aborts with a 400 on failure", "BindJSON is faster because it skips struct tags", "They are identical aliases for the same function"],
    "answer": 1,
    "explain": "ShouldBindJSON hands you the error so you control the response; BindJSON automatically aborts with a default 400."
  },
  {
    "q": "Which struct tag declares a validation rule (as opposed to naming the JSON field)?",
    "choices": ["json:\"title\"", "form:\"title\"", "binding:\"required,min=1\"", "uri:\"id\""],
    "answer": 2,
    "explain": "binding:\"...\" holds the go-playground/validator rules. json/form/uri just map a field to a source key."
  },
  {
    "q": "Why does binding:\"required\" on a plain bool field cause trouble for a 'mark as not done' update?",
    "choices": ["bool fields can't be bound at all", "required rejects the zero value, and false IS the zero value, so a deliberate {\"done\": false} is rejected as if absent", "required only works on query parameters", "bool fields always default to true"],
    "answer": 1,
    "explain": "A missing field and false both decode to the zero value, so required can't tell them apart. Use *bool when absent must differ from false."
  }
]
```

[← Phase 2: Routing & Route Groups](02-routing-and-groups.md) · [Guide overview](_guide.md) · [Phase 4: Responses & Rendering →](04-responses-and-rendering.md)