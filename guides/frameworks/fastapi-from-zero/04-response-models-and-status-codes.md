---
title: "Response Models & Status Codes"
guide: "fastapi-from-zero"
phase: 4
summary: "Shape what your endpoints return with response_model, split input from output models so clients can't set or see internal fields, and return honest HTTP status codes including clean 404s via HTTPException."
tags: [fastapi, response-model, status-code, serialization, http-status, pydantic, output-filtering]
difficulty: intermediate
synonyms: ["fastapi response_model", "fastapi status code", "fastapi hide field response", "fastapi input vs output model", "fastapi 201 created", "fastapi serialization", "fastapi response schema"]
updated: 2026-07-10
---

# Response Models & Status Codes

Phase 3 used Pydantic models to describe what comes *in* — the request body — and FastAPI validated it
for free. This phase is the mirror image: describing what goes *out*. The mental model: **the shape of
what you send is not the same as the shape of what you return, and pretending they're the same is the
single most common way APIs leak data or accept things they shouldn't.**

Think of an endpoint as having two contracts. The **input contract** is what a client is allowed to send
you (a new book's title and author — but not its database id, and definitely not your private notes
about it). The **output contract** is what you promise to hand back (the id you assigned, the public
fields — but again, not your private notes). Those two contracts are *different*, so they deserve
*different models* — this phase is FastAPI's clean way to declare both.

## `response_model` — declaring the shape of what you return

📝 **`response_model`** — a parameter you pass to a path operation that tells FastAPI the Pydantic model
your endpoint's return value should conform to. FastAPI then does three things with it: validates that your
return value fits the shape, **serializes** it to JSON in exactly that shape, and **documents** it in the
auto-generated `/docs` page. One declaration, three jobs.

Here's the Book domain from Phase 3, now with an output model declared on the endpoint:

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class BookPublic(BaseModel):
    id: int
    title: str
    author: str


@app.get("/books/{book_id}", response_model=BookPublic)
def get_book(book_id: int):
    # Imagine this came from a database.
    return {"id": book_id, "title": "Dune", "author": "Frank Herbert"}
```

*What just happened:* the `response_model=BookPublic` on the decorator is the whole point. Even though
`get_book` returns a plain `dict`, FastAPI runs that dict *through* `BookPublic` on the way out — checking
the fields exist and have the right types, then producing JSON shaped exactly like `BookPublic`. Your
function can return a dict, a Pydantic object, or an ORM row; the response model is what the client
actually sees. `/docs` now shows the precise response schema, so the documentation can't drift from
reality.

💡 The return type annotation (`def get_book(...) -> BookPublic:`) works too and is increasingly the
preferred style. `response_model=` is shown here because it's explicit and has a couple of extra powers
(like `response_model=None` to opt out). Pick one; don't use both on the same endpoint with conflicting types.

## Input vs output models — the key pattern

This is the idea the whole phase is built around. You want two models:

- **`BookCreate`** — what a client *sends* to create a book. No `id` (the server assigns that), no internal
  fields.
- **`BookPublic`** — what you *return*. Has the `id`, has the public fields, but hides anything internal.

Why bother with two when one "Book" model would compile fine?

⚠️ Two reasons, both bugs waiting to happen if you ignore them. **First, a single model lets clients set
fields they have no business setting** — like the `id`, or an `is_admin` flag, or `created_by`. If your
input model has an `id` field, a client can pick its own id. **Second, returning your internal object
leaks fields** — a `secret_notes` column, a password hash, an internal cost. The response model is your
filter: it strips the output down to exactly the fields it declares, no matter what extra junk the source
object carries.

Prove the stripping with a runnable example. Pydantic does the filtering, so this works without a
running server — exactly what FastAPI does internally with your return value:

```python runnable
from pydantic import BaseModel


# What clients send — notice: no id, no internal fields.
class BookCreate(BaseModel):
    title: str
    author: str


# What we store internally — has server-controlled and private fields.
class BookInDB(BaseModel):
    id: int
    title: str
    author: str
    secret_notes: str        # internal! must never reach the client
    acquisition_cost: float  # also internal


# What we return to clients — public fields only.
class BookPublic(BaseModel):
    id: int
    title: str
    author: str


# Simulate the full round trip.
incoming = BookCreate(title="Dune", author="Frank Herbert")

stored = BookInDB(
    id=1,
    title=incoming.title,
    author=incoming.author,
    secret_notes="bought cheap at an estate sale",
    acquisition_cost=2.50,
)

# This is what response_model=BookPublic does: filter the internal object
# down to exactly the public model's fields.
public = BookPublic.model_validate(stored.model_dump())

print("Stored object has secrets:", stored.model_dump())
print("Public response is clean: ", public.model_dump())
```
```console
Stored object has secrets: {'id': 1, 'title': 'Dune', 'author': 'Frank Herbert', 'secret_notes': 'bought cheap at an estate sale', 'acquisition_cost': 2.5}
Public response is clean:  {'id': 1, 'title': 'Dune', 'author': 'Frank Herbert'}
```

*What just happened:* the internal `BookInDB` object carries `secret_notes` and `acquisition_cost`. Fed
through `BookPublic`, those fields vanished — `BookPublic` only knows about `id`, `title`, and `author`,
so that's all that survives. In a real FastAPI app you don't write the `model_validate` line yourself;
declaring `response_model=BookPublic` makes FastAPI do precisely this filtering on every response. The
client *cannot* see what the output model doesn't declare.

The same split wired into real endpoints — `BookCreate` going in, `BookPublic` coming out:

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class BookCreate(BaseModel):
    title: str
    author: str


class BookPublic(BaseModel):
    id: int
    title: str
    author: str


@app.post("/books", response_model=BookPublic)
def create_book(book: BookCreate):
    # The server assigns the id — the client never gets to.
    new_id = 1  # pretend the database generated this
    return {"id": new_id, "title": book.title, "author": book.author}
```

*What just happened:* the request body is parsed as `BookCreate`, which has no `id` — so there's no way
for a client to smuggle one in; the server is fully in control of that. The response is shaped by
`BookPublic`, which *does* include `id`. Two models making the input and output contracts explicit is the
entire pattern — you'll see it everywhere in well-built FastAPI code.

## Status codes — saying what actually happened

An HTTP response isn't just a body; it carries a **status code** that tells the client what happened in
one number. By default FastAPI returns `200 OK` from every successful endpoint, but `200` isn't always
the honest answer. A freshly created resource deserves `201`. A successful delete with nothing to return
deserves `204`. Using the right code is part of a clean API contract — clients (and other tools) read
these codes to decide what to do next.

The ones you'll reach for constantly:

| Code | Means | Use it when |
|------|-------|-------------|
| `200 OK` | Success, here's the body | A normal `GET` or update returning data |
| `201 Created` | A new resource was created | A `POST` that creates something |
| `204 No Content` | Success, deliberately no body | A `DELETE` that succeeded |
| `404 Not Found` | The thing you asked for doesn't exist | Looking up a book id that isn't there |
| `422 Unprocessable Entity` | The request body failed validation | FastAPI returns this for you automatically when Pydantic validation fails |

For the full tour of what each status code family means and why, see
[HTTP Explained](/guides/http-explained) — it covers the 2xx/4xx/5xx logic that this table only summarizes.

You set the success code with `status_code` on the decorator. A `POST` that creates a book should say so:

```python
from fastapi import FastAPI, status
from pydantic import BaseModel

app = FastAPI()


class BookCreate(BaseModel):
    title: str
    author: str


class BookPublic(BaseModel):
    id: int
    title: str
    author: str


@app.post("/books", response_model=BookPublic, status_code=status.HTTP_201_CREATED)
def create_book(book: BookCreate):
    new_id = 1
    return {"id": new_id, "title": book.title, "author": book.author}
```

*What just happened:* `status_code=status.HTTP_201_CREATED` (just the integer `201` with a readable name)
makes a successful create respond with `201 Created` instead of the default `200`. You could write
`status_code=201` directly; the `status` constants exist so your code reads as intent, not magic numbers.
The `/docs` page picks this up too, so the documented success code matches what the endpoint really sends.

📝 The `422` is special: you almost never set it yourself. When a request body fails Pydantic validation
— wrong type, missing required field — FastAPI automatically rejects it with `422` and a detailed JSON
explanation. That's the validation from Phase 3 showing up as an HTTP status.

## Raising errors with `HTTPException`

So far our endpoints assume the happy path. But what about looking up a book that doesn't exist? You
don't `return` an error — you **raise** one. FastAPI gives you `HTTPException` for exactly this: raise
it, and FastAPI catches it and turns it into a clean JSON error response with the status code you chose.

📝 **`HTTPException`** — an exception you `raise` to short-circuit a request with a specific HTTP status
and message. FastAPI converts it into a proper error response; you never build the response by hand.

```python
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

app = FastAPI()


class BookPublic(BaseModel):
    id: int
    title: str
    author: str


# Pretend this is our database.
books = {1: {"id": 1, "title": "Dune", "author": "Frank Herbert"}}


@app.get("/books/{book_id}", response_model=BookPublic)
def get_book(book_id: int):
    if book_id not in books:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return books[book_id]
```

*What just happened:* when the requested `book_id` isn't in our `books` store, we `raise
HTTPException(...)` with `404` and a `detail` message. FastAPI stops processing the request right there
and sends back a `404` response — it doesn't apply the `response_model`, because we never returned a
value. Raising (not returning) cleanly aborts the endpoint.

If a client requests `GET /books/999`, the response status is `404 Not Found` and the body is:

```json
{
  "detail": "Book not found"
}
```

*What just happened:* FastAPI wrapped your `detail` string in a consistent JSON shape — always a
`detail` key — and set the HTTP status to `404`. Every error in your API comes out in this same
predictable envelope: one place to look for what went wrong.

## Why this matters

💡 The input/output-model split is *the* FastAPI way to keep your API contract clean and safe. Separate
models mean clients can't set server-controlled fields (no rogue `id`s), and your internal objects can't
leak private fields (no `secret_notes` in the wild). Pair that with `response_model` and your `/docs`
page is always honest — the documented response shape *is* the real response shape, generated from the
same source. Add honest status codes (`201` on create, a clean `404` via `HTTPException`) and your API
communicates clearly to every client and tool that talks to it.

⚠️ The classic beginner mistake is using **one model for everything** — a single `Book` class for input,
output, and storage. It feels simpler on day one and turns into a liability by week two: either you
expose fields you didn't mean to, or you accept fields you shouldn't, or both. Start with the split. As
the API grows you'll often add a third model for the database/internal shape (like `BookInDB` above) —
three models, three contracts, zero leaks.

Next up: **dependency injection with `Depends()`** — how FastAPI lets you pull shared logic (database
sessions, the current user, common parameters) into reusable functions your endpoints ask for.

## Recap

1. **`response_model`** declares the shape an endpoint returns; FastAPI validates the return value against
   it, serializes to exactly that shape, and documents it in `/docs`.
2. **Split input from output models** — `BookCreate` (what clients send, no `id`) vs `BookPublic` (what you
   return, with `id`). Different contracts deserve different models.
3. The response model **filters output**: any field your internal object has but the output model doesn't
   declare (like `secret_notes`) is stripped before it reaches the client.
4. **Status codes** say what happened: `200` (default success), `201` (created), `204` (no content), `404`
   (not found), `422` (validation failed, set automatically). Set the success code with `status_code=`.
5. **`HTTPException`** is how you signal errors — `raise` it (don't return) with a status and `detail`, and
   FastAPI sends a clean, consistent JSON error.
6. ⚠️ One model for everything leaks data and accepts bad input — separate them from the start and your API
   contract stays safe and honest as it grows.

## Quick check

Test yourself on the one idea that anchors this phase — input and output are different contracts:

```quiz
[
  {
    "q": "You return an internal object that has a `secret_notes` field, but your endpoint declares `response_model=BookPublic` (which has no `secret_notes`). What does the client receive?",
    "choices": [
      "The response with `secret_notes` stripped out — response_model filters the output to only its declared fields",
      "The full object including `secret_notes`, because you returned it",
      "A 500 error, because the object has an extra field",
      "A 422 error, because the output failed validation"
    ],
    "answer": 0,
    "explain": "response_model is a filter. FastAPI runs your return value through BookPublic, which only declares id/title/author, so secret_notes never reaches the client. This is exactly why you split output models from internal ones."
  },
  {
    "q": "Why use a separate `BookCreate` (no `id`) for input instead of one shared `Book` model that includes `id`?",
    "choices": [
      "So clients can't set the `id` themselves — the server controls server-assigned fields",
      "Because Pydantic can't validate a model that has an `id` field",
      "Because FastAPI requires every endpoint to use a different model",
      "Because it makes the JSON response smaller"
    ],
    "answer": 0,
    "explain": "If the input model has an `id`, a client can choose its own id. Keeping `id` out of BookCreate means the server is fully in control of it. That's the safety half of the input/output split."
  },
  {
    "q": "A client requests a book id that doesn't exist. What's the right way to respond with a 404?",
    "choices": [
      "`raise HTTPException(status_code=404, detail=\"Book not found\")`",
      "`return {\"error\": 404, \"message\": \"Book not found\"}`",
      "`return None` and let FastAPI figure out it's missing",
      "Set `status_code=404` on the decorator so every response is a 404"
    ],
    "answer": 0,
    "explain": "You raise HTTPException, not return an error dict. Raising short-circuits the endpoint and FastAPI converts it into a clean JSON error with the right status. Returning a dict would send a 200 with an error-shaped body, and decorator status_code would wrongly apply to all responses."
  }
]
```

---

[← Phase 3: Pydantic Models & Validation](03-pydantic-models-and-validation.md) · [Guide overview](_guide.md) · [Phase 5: Dependency Injection with Depends() →](05-dependency-injection.md)
