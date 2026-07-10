---
title: "Pydantic Models & Validation"
guide: "fastapi-from-zero"
phase: 3
summary: "Pydantic turns a class of typed fields into a runtime gate that validates and coerces incoming data — and it's pure Python, so you can run it right here. It's the engine behind FastAPI request bodies and automatic 422 errors."
tags: [fastapi, pydantic, basemodel, validation, request-body, data-models, type-coercion]
difficulty: beginner
synonyms: ["fastapi pydantic models", "pydantic basemodel validation", "fastapi request body", "pydantic field constraints", "fastapi automatic validation", "pydantic vs dataclass", "fastapi 422 error body"]
updated: 2026-07-10
---

# Pydantic Models & Validation

[Phase 2](02-path-operations-and-parameters.md) showed a type hint on a path or query parameter quietly
doing real work: FastAPI reads the hint and parses, validates, and converts the value for you. That
trick has a name, and it's a whole library — **Pydantic**. Path and query parameters are the small
version; the full power shows up when a client sends a JSON *body* you need to trust before you touch it.

The mental model for this phase: a Pydantic model is a **typed gate**. You describe the shape of the
data once — a class with typed fields — and Pydantic stands at the door, checking every piece of data
that tries to come in. Good data passes through as a clean, typed Python object. Bad data gets turned
away with a precise error. You stop writing `if not isinstance(...)` checks by hand; the shape *is* the
check.

## What Pydantic actually is

📝 **Pydantic** is a data-validation library. You define a class that extends `BaseModel`, give it typed
fields, and Pydantic validates and coerces any data you build it from against those types — **at
runtime**. This is the crucial difference from the [type hints](/guides/python-from-zero) you met in
Python: a plain hint like `age: int` is a note for humans and tools that the interpreter ignores while
running. Pydantic *enforces* the same hint when the object is constructed.

**Pydantic is separate from FastAPI.** It's its own library, usable in any Python program — config
loading, parsing files, cleaning data. FastAPI just leans on it hard: every request body you'll define
is a Pydantic model. That means the examples below are **pure Python and run on this page** — no
server, no `uvicorn` — so you can watch validation succeed and fail, live.

> 💡 **Key point.** A Pydantic model is the same *describe-the-fields* idea as a dataclass
> ([Python From Zero, Phase 15](/guides/python-from-zero)), with one decisive addition: it **checks and
> converts the data** at construction time instead of trusting it. Dataclass for data you already trust;
> Pydantic at the boundary where untrusted data arrives.

## Your first model — and watch it reject bad data

Model a `Book` for our book service: a title, an author, a year, and a price. Extending `BaseModel` and
listing typed fields is the whole definition. This block runs — build a book from a dict, print it, then
feed it garbage and see what Pydantic does.

```python runnable
from pydantic import BaseModel, ValidationError

class Book(BaseModel):
    title: str
    author: str
    year: int
    price: float

# Good data — Pydantic builds a clean, typed object:
data = {"title": "Dune", "author": "Frank Herbert", "year": 1965, "price": 14.99}
book = Book(**data)
print(book)
print(book.title, "costs", book.price)

# Bad data — year isn't a number, price is missing entirely:
try:
    Book(title="Bad Book", author="Nobody", year="not-a-year")
except ValidationError as e:
    print(e)
```
*What just happened:* the first `Book(**data)` sailed through — Pydantic checked each field against its
type and handed you a real `Book` object with `.title`, `.author`, `.year`, and `.price` attributes. The
second attempt raised a `ValidationError`, and it's specific: it tells you `year` couldn't be parsed as
an integer **and** that `price` is required but missing — both problems, in one report, pointing at the
exact fields. You didn't write a single validation check. The class *is* the validation.

Contrast that with a plain dataclass, which trusts whatever you give it:

```python runnable
from dataclasses import dataclass

@dataclass
class Book:
    title: str
    author: str
    year: int
    price: float

# The dataclass happily stores nonsense — the `: int` hint is never enforced:
book = Book(title="Junk", author="?", year="not-a-year", price="free")
print(book)
print(type(book.year))   # it's a str, not an int — the bug is now inside your object
```
*What just happened:* the dataclass accepted `year="not-a-year"` and `price="free"` without complaint
and stored them as strings. The `: int` and `: float` hints were ignored at runtime, as Python type hints
always are. The bad data now sits *inside* your object, waiting to blow up later when you try arithmetic
on a string. That's the gap Pydantic closes: it moves the failure to the *boundary*, where it's cheap to
diagnose, instead of letting it leak deep into your code.

## Field constraints — rules that live with the type

Type-correct isn't the same as *valid*. A price of `-5.0` is a perfectly good `float` and a perfectly
absurd price. A year of `99` parses as an `int` but no book was printed then. Pydantic lets you attach
**constraints** to a field with `Field(...)`, so the rule lives right next to the type it guards.

```python runnable
from pydantic import BaseModel, Field, ValidationError

class Book(BaseModel):
    title: str = Field(min_length=1)         # no empty titles
    author: str = Field(min_length=1)
    year: int = Field(ge=1450, le=2100)      # between 1450 and 2100 inclusive
    price: float = Field(gt=0)               # strictly greater than 0

# Valid — every constraint satisfied:
good = Book(title="Dune", author="Frank Herbert", year=1965, price=14.99)
print("OK:", good)

# Invalid — empty title, year too early, price not positive:
try:
    Book(title="", author="Frank Herbert", year=1200, price=0)
except ValidationError as e:
    print(e)
```
*What just happened:* the valid book passed because it cleared every rule. The invalid one tripped three
constraints at once — `title` was empty (`min_length=1`), `year` of `1200` fell below `ge=1450`, and
`price` of `0` failed `gt=0` (greater than, not greater-or-equal) — and Pydantic reported all three with
the limits it expected. `gt` is "greater than," `ge` is "greater than or equal," `le` is "less than or
equal" (and `lt` exists too); `min_length` works on strings and lists.

💡 This is **declarative validation**: you *declare* what valid looks like as part of the field, and
Pydantic figures out *how* to check it. The rule and the data it protects never drift apart — change the
field, the constraint moves with it. Compare that to scattering hand-written `if price <= 0: raise ...`
checks across every function that touches a book.

## Using a model as a request body

Now the payoff for FastAPI. In [Phase 2](02-path-operations-and-parameters.md), a parameter typed as a
simple type (`int`, `str`) became a path or query parameter. The rule that completes the picture: **when
you type a parameter as a Pydantic model, FastAPI reads it from the JSON request body.** It pulls the raw
JSON, hands it to your model for validation, and — if it passes — gives your function a fully typed
object. If it fails, FastAPI never even calls your function; it returns a `422 Unprocessable Entity`
automatically, with the same precise error detail you saw above.

This endpoint code needs a running server, so it's shown as plain Python (run it yourself with the commands
from Phase 1):

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class Book(BaseModel):
    title: str = Field(min_length=1)
    author: str = Field(min_length=1)
    year: int = Field(ge=1450, le=2100)
    price: float = Field(gt=0)

@app.post("/books")
def create_book(book: Book):        # typed as the model → comes from the JSON body
    # `book` is already validated. No checks needed here.
    return {"message": f"Added {book.title} by {book.author}", "price": book.price}
```
*What just happened:* the single line `book: Book` did everything. FastAPI saw a parameter typed as a
`BaseModel`, so it knew to read the request body, validate it against `Book`, and pass you a ready-to-use
object. Inside `create_book` there are **zero** validation checks — by the time your code runs, the data
is guaranteed valid. The gate is at the door, not scattered through the house.

A valid request — this JSON body sails through and your function runs:

```json
{
  "title": "Dune",
  "author": "Frank Herbert",
  "year": 1965,
  "price": 14.99
}
```

An invalid one — `year` is below the allowed range and `price` isn't positive — never reaches your function.
FastAPI returns `422` with a body like this:

```json
{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": ["body", "year"],
      "msg": "Input should be greater than or equal to 1450",
      "input": 1200
    },
    {
      "type": "greater_than",
      "loc": ["body", "price"],
      "msg": "Input should be greater than 0",
      "input": 0
    }
  ]
}
```
*What just happened:* FastAPI turned your model's `ValidationError` into a clean HTTP `422` response.
Each entry in `detail` points at the offending field via `loc` (`["body", "year"]` means "the `year`
field in the request body"), explains what was expected, and echoes the bad `input`. The client gets a
genuinely useful error, and you wrote none of it — it fell straight out of the model definition.

## Coercion, optionals, and nesting

A few behaviors round out the mental model.

📝 **Coercion.** Pydantic doesn't just check types — it *converts* compatible ones. Hand it the string
`"2020"` for an `int` field and it gives you the integer `2020`. This is why JSON works smoothly: numbers
arriving as strings get tidied up. But it only coerces what's *sensibly* convertible — `"not-a-year"` has
no integer meaning, so it's rejected rather than guessed at.

```python runnable
from pydantic import BaseModel

class Book(BaseModel):
    title: str
    year: int
    price: float

# Strings that *look* like numbers get coerced to the declared type:
book = Book(title="Dune", year="1965", price="14.99")
print(book)
print(type(book.year), type(book.price))   # int and float — converted, not stored as str
```
*What just happened:* you passed `year` and `price` as strings, and Pydantic coerced them to a real `int`
and `float` because those strings have an unambiguous numeric meaning. The printed types confirm the
conversion. Try changing `"1965"` to `"nineteen"` and you'll get a `ValidationError` instead — coercion
has limits, and gibberish hits them.

⚠️ **Coercion can surprise you.** Lax coercion is convenient but occasionally too generous — depending on
configuration, things like `"1"` might slip into a `bool`, or a float might be quietly truncated. If you
need exact-type-only behavior (no string-to-int favors), Pydantic offers **strict mode** to turn coercion
off per-field or per-model. The default is *lax* and helpful; strict mode exists for when it isn't.

**Optional fields with defaults.** Give a field a default value and it becomes optional — callers can leave
it out. Use `X | None = None` for "might genuinely be absent."

```python runnable
from pydantic import BaseModel

class Book(BaseModel):
    title: str
    author: str
    in_stock: bool = True            # optional: defaults to True if omitted
    discount: float | None = None    # optional and nullable

print(Book(title="Dune", author="Frank Herbert"))
print(Book(title="Dune", author="Frank Herbert", in_stock=False, discount=2.50))
```
*What just happened:* `in_stock` and `discount` both have defaults, so the first `Book(...)` — supplying
only `title` and `author` — is completely valid; Pydantic filled in `in_stock=True` and `discount=None`.
The second call overrode both. Required fields are the ones *without* a default.

**Nesting.** A model field can be typed as *another model*. Pydantic validates the whole tree — outer object,
inner object, all the way down.

```python runnable
from pydantic import BaseModel

class Author(BaseModel):
    name: str
    country: str

class Book(BaseModel):
    title: str
    author: Author          # a field whose type is another model
    year: int

data = {
    "title": "Dune",
    "author": {"name": "Frank Herbert", "country": "USA"},
    "year": 1965,
}
book = Book(**data)
print(book)
print(book.author.name)     # nested object, fully typed
```
*What just happened:* `author: Author` told Pydantic the `author` field is itself a model, so it
validated the nested `{"name": ..., "country": ...}` dict against `Author` and gave you `book.author` as
a real `Author` object — hence `book.author.name` works with full typing. Mistype anything inside the
nested dict and you'd get a `ValidationError` pointing at the nested path, like `["author", "country"]`.

💡 **The payoff, stated plainly.** Define the shape once as a model, and *everything* follows from it:
validation (this phase), automatic `422` errors, the interactive docs that show the exact schema, and —
next phase — serialization of your *responses*. One definition, many free features: **types are the
contract.**

## Recap

1. **Pydantic is a runtime data-validation library** — define a class extending `BaseModel` with typed
   fields, and it validates and coerces data against those types when the object is built. It's separate from
   FastAPI and pure Python, so its examples run anywhere.
2. **A `ValidationError` is precise** — it names every bad field at once, says what was expected, and (in
   FastAPI) becomes an automatic `422` with the same detail.
3. **Constraints live with the field** via `Field(...)`: `gt`/`ge`/`lt`/`le` for numbers, `min_length` for
   strings and lists. Declarative — the rule never drifts from the data it guards.
4. **A parameter typed as a model = the request body.** FastAPI reads the JSON, validates it against the
   model, and hands your function a clean typed object — or returns `422` and never calls you.
5. **Coercion converts compatible types** (`"2020"` → `2020`) but rejects nonsense; the default is lax, and
   strict mode exists when you need exact types.
6. **Optional fields** get defaults (`in_stock: bool = True`, or `X | None = None`); **nested models** let
   one model contain another, validated all the way down.

Next phase flips the direction: instead of validating data coming *in*, use models to shape and control
data going *out* — response models, hidden fields, and honest status codes.

## Quick check

Three questions on the ideas that have to stick — what Pydantic enforces, where a model body comes from, and
what coercion does.

```quiz
[
  {
    "q": "You define `class Book(BaseModel)` with `price: float` and call `Book(title=\"X\", author=\"Y\", year=2000, price=\"oops\")`. What happens?",
    "choices": [
      "It builds the object and stores \"oops\" as the price",
      "It raises a ValidationError — \"oops\" can't be coerced to a float",
      "Python raises a TypeError before Pydantic sees it",
      "It silently sets price to 0.0"
    ],
    "answer": 1,
    "explain": "Unlike a plain dataclass (which would store the string), Pydantic enforces the type at construction. \"oops\" has no sensible float meaning, so coercion fails and a ValidationError is raised — pointing at the price field."
  },
  {
    "q": "In FastAPI, what makes a function parameter come from the JSON request body rather than the path or query string?",
    "choices": [
      "Naming the parameter `body`",
      "Adding `@app.post` instead of `@app.get`",
      "Typing the parameter as a Pydantic BaseModel",
      "Wrapping it in `Body(...)` — there's no other way"
    ],
    "answer": 2,
    "explain": "FastAPI's rule: a parameter typed as a Pydantic model is read from the request body, validated against the model, and passed in as a typed object (or it auto-returns 422). The HTTP method and parameter name don't determine this."
  },
  {
    "q": "A field is declared `year: int`. A client sends the JSON value `\"1965\"` (a string). With Pydantic's default behavior, what does your object's `year` end up as?",
    "choices": [
      "The string \"1965\" — Pydantic never changes types",
      "A ValidationError, because a string isn't an int",
      "The integer 1965 — Pydantic coerces compatible types",
      "None, because the value didn't match exactly"
    ],
    "answer": 2,
    "explain": "By default Pydantic is lax: it coerces sensibly-convertible values, so the string \"1965\" becomes the integer 1965. (Gibberish like \"nineteen\" would still raise. Strict mode exists if you want to forbid the conversion.)"
  }
]
```

---

[← Phase 2: Path Operations & Parameters](02-path-operations-and-parameters.md) · [Guide overview](_guide.md) · [Phase 4: Response Models & Status Codes →](04-response-models-and-status-codes.md)
