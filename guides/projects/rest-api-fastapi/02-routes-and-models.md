---
title: "Routes and Pydantic Models"
guide: rest-api-fastapi
phase: 2
summary: "Add path and query parameters, define a request body as a Pydantic model, and let FastAPI validate incoming data for you."
tags: [python, fastapi, pydantic, validation, routing]
difficulty: intermediate
synonyms:
  - fastapi path parameters
  - fastapi query parameters
  - pydantic request body
  - fastapi data validation
  - fastapi model
updated: 2026-06-30
---

# Routes and Pydantic Models

Last phase you served a fixed response. A real API takes input - an ID in the
URL, a filter in the query string, a JSON body on a POST. This phase covers all
three, and shows you the part of FastAPI that does the most work for the least
code: validation driven by type hints.

Keep the server running with `--reload`. Edit `main.py` and watch `/docs` update
as you save.

## Path parameters: data in the URL

A path parameter is a piece of the URL that changes - the `42` in `/notes/42`.
You declare it with curly braces in the route and as an argument to the
function:

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/notes/{note_id}")
def get_note(note_id: int):
    return {"note_id": note_id, "kind": type(note_id).__name__}
```

Notice `note_id: int`. That type hint isn't decoration. Visit
`http://127.0.0.1:8000/notes/42` and you get:

```json
{"note_id": 42, "kind": "int"}
```

FastAPI converted the string `"42"` from the URL into an actual integer. Now try
`http://127.0.0.1:8000/notes/banana`. Instead of crashing, you get a clean
422 response:

```json
{
  "detail": [
    {
      "type": "int_parsing",
      "loc": ["path", "note_id"],
      "msg": "Input should be a valid integer, ...",
      "input": "banana"
    }
  ]
}
```

You wrote zero validation code. The type hint did it. This is the core idea of
FastAPI - you describe the shape of your data with normal Python types, and the
framework enforces it.

## Query parameters: data after the ?

A query parameter is the `?limit=5` part of a URL. FastAPI gives you these for
free: any function argument that *isn't* in the path becomes a query parameter.

```python
@app.get("/notes")
def list_notes(limit: int = 10, q: str | None = None):
    return {"limit": limit, "q": q}
```

Two things to read carefully:

- `limit: int = 10` has a default, so it's optional. Visit `/notes` and you get
  `limit: 10`. Visit `/notes?limit=3` and you get `3`. Pass `/notes?limit=abc`
  and you get a 422 - the `int` hint is doing its job again.
- `q: str | None = None` means "an optional string". It's there when you want a
  search term and absent otherwise.

Path vs query, side by side:

| | Path param | Query param |
|---|---|---|
| Lives in | the URL path: `/notes/42` | after the `?`: `/notes?limit=5` |
| Declared by | `{name}` in the route | a function arg not in the path |
| Optional? | no - it's part of the address | yes, if it has a default |
| Good for | identifying *which* resource | filtering, sorting, paging |

## Request bodies: a Pydantic model

GET requests carry data in the URL. But to *create* a note you need to send a
chunk of JSON - a title and some content - in the request body. For that you
define the expected shape as a Pydantic model.

Add this to the top of `main.py`:

```python
from pydantic import BaseModel


class NoteIn(BaseModel):
    title: str
    content: str
    pinned: bool = False
```

A `BaseModel` subclass is a description of valid input. `title` and `content`
are required strings; `pinned` is an optional boolean that defaults to `False`.

Now write a POST endpoint that takes one:

```python
@app.post("/notes")
def create_note(note: NoteIn):
    return {
        "received": note.model_dump(),
        "title_length": len(note.title),
    }
```

Because `note` is typed as your model, FastAPI knows the data comes from the
request body. It reads the incoming JSON, checks it against `NoteIn`, and hands
you a fully-typed `note` object - `note.title`, `note.pinned`, with editor
autocomplete and everything.

## Try it from the docs

Go to `http://127.0.0.1:8000/docs`. The `POST /notes` endpoint is there, and so
is a schema showing exactly which fields it expects - FastAPI generated that from
your model. Click it, hit **Try it out**, and send this body:

```json
{
  "title": "Buy milk",
  "content": "2% if they have it"
}
```

You'll get back the parsed data plus the title length. Now break it on purpose -
send a body with `title` missing:

```json
{
  "content": "no title here"
}
```

The response is a 422 that points at the exact problem:

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "title"],
      "msg": "Field required"
    }
  ]
}
```

That error message is generated from your model. You didn't write a single
`if "title" not in data` check.

## Why this matters

Most of the validation code in a hand-rolled API is checking that fields exist
and have the right type. Pydantic turns that whole category of code into a class
definition. You declare the shape once, and every endpoint that uses the model
gets the checks, the 422 errors, *and* the docs.

## Where we are

You can now take input three ways - path, query, and body - and FastAPI
validates all of it from your type hints. The data still vanishes the moment the
request ends, though; nothing is stored. Next phase we give the notes a place to
live and wire up all four CRUD operations.
