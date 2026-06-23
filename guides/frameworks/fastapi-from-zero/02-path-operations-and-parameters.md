---
title: "Path Operations & Parameters"
guide: "fastapi-from-zero"
phase: 2
summary: "How routes work in FastAPI: the decorator picks the HTTP method and path, path and query parameters come from your function signature, and the type hints parse and validate everything for free."
tags: [fastapi, path-operation, path-parameter, query-parameter, type-hints, validation, routing]
difficulty: beginner
synonyms: ["fastapi path parameters", "fastapi query parameters", "fastapi get post route", "fastapi type hint validation", "fastapi optional query param", "fastapi path converter", "fastapi 422 validation error"]
updated: 2026-06-22
---

# Path Operations & Parameters

In Phase 1 you got an app running and saw the headline trick: write a typed function, get a validated,
documented endpoint. This phase zooms in on the part you'll touch most — the routes themselves. How do you
say "this function handles `GET /books`"? How do you grab the `42` out of `/books/42`? How do you read
`?limit=10` off the URL? And how does a single `int` annotation turn into a real validation rule that
rejects garbage before your code ever runs?

The mental model to hold onto: **a route in FastAPI is just a normal Python function, and its signature is
the spec.** The decorator says *which* requests reach the function. The parameters — and their type hints —
say *what those requests must look like*. You don't write parsing or validation; you describe the shape,
and FastAPI enforces it. Everything below is that one idea, made concrete.

## Path operations — a route is a decorated function

📝 **Path operation** — FastAPI's name for a route. "Path" is the URL path (`/books`); "operation" is the
HTTP method (`GET`, `POST`, ...). Together they're "the function that runs for `GET /books`." You declare
one by decorating a function: the decorator *is* the method-plus-path.

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/books")
def list_books():
    return [{"id": 1, "title": "Dune"}]

@app.post("/books")
def create_book():
    return {"message": "a book would be created here"}
```

*What just happened:* `@app.get("/books")` registers `list_books` as the handler for `GET /books`.
`@app.post("/books")` registers a *different* function for `POST /books` — same path, different method, so
it's a separate path operation. The decorator name (`get`, `post`, `put`, `delete`, `patch`) maps one-to-one
onto the HTTP verb, which lines up exactly with the REST model from
[REST APIs Explained](/guides/rest-apis-explained): the URL names the resource, the method is the verb you
apply to it. Whatever you `return` becomes the JSON response body.

💡 You'll almost always use `get` (read), `post` (create), `put`/`patch` (update), and `delete` (remove).
There's a decorator per method; pick the one that matches what the request *does* to the resource.

## Path parameters — pulling values out of the URL

A `GET /books` lists every book. But `GET /books/42` should return *one* book — the one with id `42`. That
`42` is part of the path, and it changes per request, so you can't hard-code it into the route string. You
mark it as a **path parameter** with curly braces, then receive it as a function argument.

```python
@app.get("/books/{book_id}")
def get_book(book_id: int):
    return {"id": book_id, "title": "Dune"}
```

*What just happened:* `{book_id}` in the path is a placeholder. FastAPI matches `/books/42`, pulls out
`"42"`, and passes it to your function as the `book_id` argument. The name in the braces must match the
parameter name exactly — that's how FastAPI wires them together.

But look at the annotation: `book_id: int`. The value in a URL is always *text* — `"42"` is a string. That
`int` hint tells FastAPI to convert it to a real integer before handing it over, so inside your function
`book_id` is the number `42`, not the string `"42"`. And here's the part that does the heavy lifting: if
the conversion *fails* — say someone requests `/books/banana` — FastAPI doesn't run your function at all.
It returns a `422 Unprocessable Entity` with a precise error:

```json
{
  "detail": [
    {
      "type": "int_parsing",
      "loc": ["path", "book_id"],
      "msg": "Input should be a valid integer, unable to parse string as an integer",
      "input": "banana"
    }
  ]
}
```

*What just happened:* `banana` can't be an `int`, so FastAPI rejected the request before your code saw it.
The error names exactly *where* it went wrong (`["path", "book_id"]`), *what* was expected, and *what* it
got. You wrote zero validation code to make this happen.

💡 This is the Phase 1 idea made concrete: **the type hint is doing validation, not just documentation.**
One word — `int` — bought you parsing, a guaranteed-correct type inside your function, and an automatic,
descriptive `422` for bad input. Change it to `str` and `/books/banana` would sail right through. The hint
*is* the rule.

## Query parameters — everything after the `?`

Path parameters identify *which* resource. **Query parameters** tune *how* you want it — filtering, paging,
sorting. They're the `?skip=0&limit=10` part of a URL. The rule for declaring them is delightfully simple:
**any function parameter that isn't in the path becomes a query parameter.**

```python
@app.get("/books")
def list_books(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit, "books": ["..."]}
```

*What just happened:* `skip` and `limit` don't appear in the path string `"/books"`, so FastAPI treats them
as query parameters read from the URL's query string. Because they have **default values** (`= 0`,
`= 10`), they're *optional* — a plain `GET /books` uses the defaults. And they're typed `int`, so they get
the same parse-and-validate treatment as path parameters: `?limit=abc` earns a `422`.

You'd call it like this:

```http
GET /books?skip=20&limit=5 HTTP/1.1
Host: localhost:8000
```

Or from the terminal:

```bash
curl "http://localhost:8000/books?skip=20&limit=5"
```

```console
{"skip":20,"limit":5,"books":["..."]}
```

*What just happened:* FastAPI matched `?skip=20&limit=5` to your two parameters by name, converted both to
`int`, and passed them in. Leave them off (`curl http://localhost:8000/books`) and you'd get back the
defaults, `skip=0` and `limit=10`. Default present means optional; default absent means required (and a
missing required query param is — you guessed it — a `422`).

## Optional & constrained parameters — richer rules than "is it an int"

Sometimes a query parameter is genuinely optional with *no* default value — "filter by author, but only if
the caller asked." That's an `Optional` (or `| None`) annotation with a default of `None`:

```python
@app.get("/books")
def list_books(author: str | None = None):
    if author is None:
        return {"books": "all books"}
    return {"books": f"books by {author}"}
```

*What just happened:* `author: str | None = None` says "a string, or nothing." With no `?author=...` in the
URL, `author` is `None` and you return everything; with `?author=Herbert`, it's `"Herbert"`. The
`= None` default is what makes it optional — without a default, FastAPI would *require* it. (`str | None`
is the modern syntax; older code writes `Optional[str]` from `typing` — they mean the same thing.)

But "it's a string" is often too loose. You might want "a string, but no longer than 50 characters," or "an
id that must be at least 1." For that, FastAPI gives you `Query()` and `Path()` — helpers that attach extra
validation rules to a parameter:

```python
from fastapi import FastAPI, Query, Path

app = FastAPI()

@app.get("/books/{book_id}")
def get_book(
    book_id: int = Path(ge=1),
    q: str | None = Query(default=None, max_length=50),
):
    return {"book_id": book_id, "q": q}
```

*What just happened:* `Path(ge=1)` adds the rule "**g**reater than or **e**qual to 1" to the path parameter
— so `/books/0` is now invalid. `Query(default=None, max_length=50)` keeps `q` optional but caps its length
at 50 characters. These constraints become part of the same validation pass: violate one and you get a
`422` describing it, exactly like a type mismatch. Now request `/books/0`:

```json
{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": ["path", "book_id"],
      "msg": "Input should be greater than or equal to 1",
      "input": "0"
    }
  ]
}
```

*What just happened:* `0` parsed fine as an `int` but failed the `ge=1` rule, so FastAPI rejected it with a
`422` that names the broken constraint. ⚠️ Don't confuse the helper's argument with its job: `Query(default=None, ...)`
sets the default, while `max_length`/`ge`/`le`/`min_length`/`pattern` set the *rules*. The default decides
"required or optional"; the rules decide "what counts as valid."

## How it works + the ordering gotcha

Step back and notice what you never did: you never parsed a string, never wrote an `if not isinstance(...)`,
never hand-built an error response. You *described* each parameter with a type and maybe a constraint, and
FastAPI did the rest.

💡 Here's the machinery. **At startup, FastAPI inspects every path-operation function's signature** — reading
the parameter names, their type hints, and any `Query`/`Path` rules. From that it builds a schema for the
route. That one schema then powers three things at once: **parsing** the incoming request, **validating** it
(and generating the `422` when it fails), and **documenting** it in the auto-generated interactive docs you
met in Phase 1. The signature is the single source of truth — which is why the docs are always in sync with
the actual behavior. They're built from the same description.

⚠️ **The ordering gotcha.** FastAPI matches routes **in the order you declare them**, top to bottom, and
stops at the first match. So a *fixed* path that looks like it could be a path parameter must come **first**.
Imagine you want `GET /books/featured` to return a curated list:

```python
@app.get("/books/{book_id}")
def get_book(book_id: int):
    return {"id": book_id}

@app.get("/books/featured")          # unreachable!
def featured_books():
    return {"books": "the good ones"}
```

*What just happened:* This is broken. A request for `/books/featured` hits `@app.get("/books/{book_id}")`
*first*, because it's declared first and `/books/featured` matches the `{book_id}` pattern. FastAPI then
tries to parse `"featured"` as an `int`, fails, and returns a `422` — your `featured_books` function never
runs. The fix is to declare the literal route **before** the dynamic one:

```python
@app.get("/books/featured")          # specific path first
def featured_books():
    return {"books": "the good ones"}

@app.get("/books/{book_id}")         # dynamic catch-all second
def get_book(book_id: int):
    return {"id": book_id}
```

*What just happened:* Now `/books/featured` matches the literal route and stops there, while
`/books/42` falls through to the parameterized one. Rule of thumb: **specific before general.**

So far every endpoint reads data from the *URL*. But creating a book needs a whole payload — title, author,
year, price — and that doesn't belong in the path or query string. That's the request **body**, and it's
where Pydantic models take over. Next phase.

## Recap

1. A **path operation** is a route: the decorator (`@app.get`, `@app.post`, ...) sets the HTTP method and
   the path, and the decorated function handles those requests.
2. **Path parameters** (`/books/{book_id}` + `book_id: int`) pull a value out of the URL; the type hint
   parses it *and* validates it, returning an automatic `422` for bad input.
3. **Query parameters** are any function parameter not in the path. A default value makes them optional
   (`limit: int = 10`); no default makes them required.
4. For optional-with-no-default use `str | None = None`; for richer rules use `Query(...)` / `Path(...)`
   with constraints like `max_length` and `ge`, which produce constraint-specific `422`s.
5. 💡 FastAPI reads each function's signature **at startup** and builds one schema that drives parsing,
   validation, and the auto docs — so the docs can never drift from the behavior.
6. ⚠️ Routes match **in declaration order**: put literal paths (`/books/featured`) **before** dynamic ones
   (`/books/{book_id}`), or the dynamic route swallows them.

You can now route requests and validate everything that arrives in the URL. Next we handle data that arrives
in the request *body* — with Pydantic models doing the same type-driven validation, for whole objects.

## Quick check

Make sure the core idea stuck — that the signature drives everything:

```quiz
[
  {
    "q": "In `@app.get(\"/books/{book_id}\")` with `def get_book(book_id: int):`, what happens when a client requests `/books/banana`?",
    "choices": [
      "FastAPI returns a 422 error and never runs get_book, because \"banana\" can't be parsed as an int",
      "get_book runs with book_id set to the string \"banana\"",
      "FastAPI silently converts it to 0 and runs the function",
      "The server crashes with an unhandled exception"
    ],
    "answer": 0,
    "explain": "The `int` hint is a validation rule. \"banana\" can't become an int, so FastAPI rejects the request with a descriptive 422 before your function is ever called."
  },
  {
    "q": "How do you make a function parameter a *query* parameter rather than a path parameter?",
    "choices": [
      "Include it as a function argument but NOT in the path string — anything not in the path becomes a query parameter",
      "Wrap it in curly braces in the path string",
      "Decorate it with @query above the function",
      "Give it the type hint `Query` instead of `int`"
    ],
    "answer": 0,
    "explain": "Path parameters appear in the path with `{braces}`. Any other function parameter is read from the query string. A default value (like `limit: int = 10`) makes it optional."
  },
  {
    "q": "You declare `@app.get(\"/books/{book_id}\")` first and `@app.get(\"/books/featured\")` second. What goes wrong?",
    "choices": [
      "`/books/featured` matches the {book_id} route first, FastAPI tries to parse \"featured\" as an int, and returns a 422 — the featured route never runs",
      "Both routes work fine; FastAPI picks the more specific one automatically",
      "FastAPI refuses to start because of the conflict",
      "`/books/featured` returns featured books, but `/books/42` breaks"
    ],
    "answer": 0,
    "explain": "Routes match in declaration order. The dynamic `/books/{book_id}` is declared first, so it captures `/books/featured` before the literal route is ever considered. Declare literal paths before dynamic ones."
  }
]
```

---

[← Phase 1: What FastAPI Is & Your First App](01-what-fastapi-is.md) · [Guide overview](_guide.md) · [Phase 3: Pydantic Models & Validation →](03-pydantic-models-and-validation.md)