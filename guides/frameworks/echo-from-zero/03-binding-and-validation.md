---
title: "Binding & Validation"
guide: "echo-from-zero"
phase: 3
summary: "Decode request bodies into structs with c.Bind, then check them with a validator you wire up yourself — Echo keeps binding and validation as two deliberate, separate steps."
tags: [echo, go, binding, validation, json]
difficulty: intermediate
synonyms: ["echo bind", "echo c.bind json", "echo validation", "echo custom validator", "echo struct tags", "echo validate"]
updated: 2026-06-23
---

# Binding & Validation

So far your handlers have read input piece by piece — a path param here, a query string there. That's
fine for a couple of values. But the moment a client `POST`s a JSON body with five fields, picking them
apart by hand gets old fast. This is where **binding** earns its keep: hand Echo a struct, and it fills
it in for you.

Here's the mental model to hold before you touch any code. In Echo, getting data from a request into a
trustworthy struct is **two separate steps**:

1. **Bind** — decode the raw request body into a Go struct. This is purely *shape*: does the JSON parse,
   do the fields line up?
2. **Validate** — check that the now-populated struct actually makes *sense*. Is `Title` non-empty? Is
   the email a real email?

📝 This split is a real difference from Gin. In [Gin](/guides/gin-from-zero), one call with a `binding`
struct tag does both at once. Echo deliberately keeps them apart: `c.Bind` does decoding, and validation
is something *you opt into*. That means a bit more wiring up front — and a lot more clarity about which
step failed when something goes wrong.

We'll keep growing the **books API**, where a book is `Book{id, title, author}`.

## Step one: `c.Bind` decodes the body

`c.Bind(&obj)` reads the request body and decodes it into the struct you point it at. The clever part:
it picks the decoder based on the request's `Content-Type` header. JSON in? It uses the JSON decoder.
A form post? The form decoder. XML? You get the idea. You write one line and Echo handles the format.

The fields it fills come from struct tags — `json:"title"` tells the JSON decoder which key maps to which
field.

```go
type CreateBook struct {
	Title  string `json:"title"`
	Author string `json:"author"`
}

func create(c echo.Context) error {
	var in CreateBook
	if err := c.Bind(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	return c.JSON(http.StatusOK, in)
}
```

*What just happened:* We declared a struct describing the shape we expect, then called `c.Bind(&in)` —
note the `&`, because Bind needs a pointer to write into. If the body is malformed JSON (or the wrong
content type), `Bind` returns an error and we bail out with a 400. On success, `in` is populated and we
echo it back. Send `{"title":"Dune","author":"Herbert"}` with `Content-Type: application/json` and it
round-trips cleanly.

⚠️ One trap worth naming early: `Bind` succeeding does **not** mean the data is good. An empty body that
parses to a zero-value struct, or a JSON object with `{"title":""}`, both bind without error. Bind checks
the envelope, not the contents. That's exactly why the second step exists.

## Step two: wiring up a validator

Here's the thing nobody tells you up front: **Echo has no built-in validator.** There's no magic tag that
rejects empty strings for you. Echo gives you a *hook* — `e.Validator` — and expects you to plug something
into it. The near-universal choice is [go-playground/validator v10](https://github.com/go-playground/validator).

The hook is an interface with a single method, `Validate(i any) error`. You write a tiny adapter that
satisfies it:

```go
import "github.com/go-playground/validator/v10"

type CustomValidator struct {
	v *validator.Validate
}

func (cv *CustomValidator) Validate(i any) error {
	return cv.v.Struct(i)
}
```

*What just happened:* `CustomValidator` wraps a `*validator.Validate` instance. Its `Validate` method just
forwards the struct to `cv.v.Struct(i)`, which inspects the struct's `validate:"..."` tags and returns an
error if any rule fails. This is the entire bridge between Echo and the validator library — small on
purpose. You write it once and forget it.

Now register it on your Echo instance in `main`:

```go
func main() {
	e := echo.New()
	e.Validator = &CustomValidator{v: validator.New()}

	e.POST("/books", create)
	e.Logger.Fatal(e.Start(":8080"))
}
```

*What just happened:* Setting `e.Validator` is what makes `c.Validate(...)` work inside handlers. Skip
this line and every call to `c.Validate` will fail at runtime complaining that no validator is registered.
The `validator.New()` call builds the underlying engine that reads your tags.

With the hook in place, the rules themselves live in `validate:"..."` struct tags. The validator v10 ones
you'll reach for constantly:

- `required` — the field must not be its zero value (empty string, `0`, `nil`).
- `email` — must look like an email address.
- `min` / `max` — for strings, length bounds; for numbers, value bounds (`min=1`).
- `gte` / `lte` — greater/less than or equal, for numbers.
- `oneof` — must be one of a fixed set, e.g. `oneof=fiction nonfiction`.

You can stack them comma-separated: `validate:"required,min=1,max=200"`.

## Putting it together: the create handler

Now the two steps live side by side. Bind, then validate, then act. Here's the full create handler for
the books API:

```go
type CreateBook struct {
	Title  string `json:"title" validate:"required,min=1"`
	Author string `json:"author" validate:"required"`
}

func create(c echo.Context) error {
	var in CreateBook
	if err := c.Bind(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	if err := c.Validate(&in); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	book := Book{ID: nextID(), Title: in.Title, Author: in.Author}
	// ... persist book ...
	return c.JSON(http.StatusCreated, book)
}
```

*What just happened:* The flow reads top to bottom like a checklist. `c.Bind(&in)` decodes the JSON — fail
here means the body was unparseable, so 400. `c.Validate(&in)` runs the tag rules — fail here means the
body parsed but `Title` was empty or some other rule broke, so also 400, and we hand back the validator's
own message so the client knows *what* was wrong. Only once both pass do we build the real `Book`, assign
it an ID, save it, and return `201 Created` with the new resource. Notice we never trusted the input until
both gates were cleared.

💡 Look closely at how every failure path ends: `return echo.NewHTTPError(...)`. We're not writing the
error response by hand — no `c.JSON(400, ...)` with a hand-rolled error body. We just *return* the error
and let Echo's central error handler turn it into a response. This is Echo's whole personality, the thing
that keeps handlers clean: handlers describe *what went wrong*, and one place decides *how it looks* to the
client. We'll build that central `HTTPErrorHandler` properly in [Phase 6](06-rest-api-and-errors.md) —
for now, just trust that returning an `HTTPError` produces a sensible JSON error with the right status.

## Recap

- In Echo, **binding and validation are two distinct steps** — unlike Gin, which fuses them. Bind decodes;
  validate checks.
- **`c.Bind(&obj)`** decodes the request body into a struct, choosing the decoder from the `Content-Type`
  header, and maps fields via `json:"..."` tags. Pass a pointer.
- A successful `Bind` only means the body *parsed* — it says nothing about whether the data is valid.
- **Echo ships no validator.** You wire one up: a small `CustomValidator` adapter, register it as
  `e.Validator = ...`, then call `c.Validate(...)` in handlers. Rules live in `validate:"..."` tags
  (`required`, `email`, `min`/`max`, `gte`/`lte`, `oneof`).
- Report bad input by **returning `echo.NewHTTPError(...)`**, letting Echo's central handler render it —
  don't write error responses by hand.

## Quick check

```quiz
[
  {
    "q": "What does c.Bind(&obj) actually do?",
    "choices": ["Decodes the request body into the struct, picking a decoder from Content-Type", "Decodes the body AND validates it against struct tags", "Only validates the struct, never decodes", "Reads query parameters into the struct"],
    "answer": 0,
    "explain": "c.Bind decodes the body into the struct, choosing JSON/XML/form based on the Content-Type header. It does not validate — that's a separate step in Echo."
  },
  {
    "q": "How do you enable c.Validate(...) in an Echo app?",
    "choices": ["It works automatically; Echo has a built-in validator", "Add a validate: tag to your struct and Echo handles the rest", "Set e.Validator to your own type that implements Validate(i any) error", "Call validator.New() inside every handler"],
    "answer": 2,
    "explain": "Echo has no built-in validator. You implement the Validator interface (a Validate(i any) error method) and register it as e.Validator, commonly wrapping go-playground/validator."
  },
  {
    "q": "When validation fails in the create handler, what's the recommended way to respond?",
    "choices": ["Call c.JSON(400, ...) with a hand-built error body", "panic so Recover middleware catches it", "return echo.NewHTTPError(http.StatusBadRequest, ...) and let the central handler render it", "Ignore it and return 201 anyway"],
    "answer": 2,
    "explain": "Echo's style is to return an HTTPError and let the centralized error handler turn it into a response — keeping handlers focused on what went wrong, not how it looks."
  }
]
```

[← Phase 2: Routing & Groups](02-routing-and-groups.md) · [Guide overview](_guide.md) · [Phase 4: Responses & Rendering →](04-responses-and-rendering.md)
