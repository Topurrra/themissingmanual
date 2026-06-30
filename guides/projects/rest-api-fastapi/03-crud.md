---
title: "CRUD with an In-Memory Store"
guide: rest-api-fastapi
phase: 3
summary: "Wire up create, read, update, and delete endpoints over a plain Python dictionary, then exercise every one of them with curl."
tags: [python, fastapi, crud, curl, in-memory]
difficulty: intermediate
synonyms:
  - fastapi crud example
  - create read update delete api
  - fastapi dictionary store
  - test api with curl
  - fastapi post put delete
updated: 2026-06-30
---

# CRUD with an In-Memory Store

CRUD is the four things almost every API does: **C**reate, **R**ead,
**U**pdate, **D**elete. This phase wires up all four over a place to keep the
notes. We're using a plain Python dictionary on purpose — it keeps the focus on
the routing and the HTTP, with no database to set up yet. Phase 5 swaps it for
SQLite, and you'll see how little of this code changes.

One catch with an in-memory store: the data lives only while the server runs.
Restart it (or let `--reload` bounce it on a save) and you're back to empty.
That's fine for now — it's exactly why phase 5 exists.

## Replace main.py

We've collected enough pieces to write the whole file cleanly. Replace the
contents of `main.py` with this:

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class NoteIn(BaseModel):
    title: str
    content: str
    pinned: bool = False


# Our "database" for now: a dict of id -> note, plus a counter for new ids.
notes: dict[int, dict] = {}
next_id = 1


@app.get("/notes")
def list_notes():
    return list(notes.values())


@app.get("/notes/{note_id}")
def get_note(note_id: int):
    return notes[note_id]


@app.post("/notes")
def create_note(note: NoteIn):
    global next_id
    record = {"id": next_id, **note.model_dump()}
    notes[next_id] = record
    next_id += 1
    return record


@app.put("/notes/{note_id}")
def update_note(note_id: int, note: NoteIn):
    record = {"id": note_id, **note.model_dump()}
    notes[note_id] = record
    return record


@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    del notes[note_id]
    return {"deleted": note_id}
```

Walk through what each route does:

- **list** returns all the note records as a JSON array.
- **get** looks up one note by its id.
- **create** assigns the next id, stores the record, bumps the counter, and
  returns what it stored — including the new id, which the client needs.
- **update** overwrites the note at that id with the new data.
- **delete** removes the entry and confirms which id went.

The `global next_id` line is there because we reassign that module-level variable
inside the function. It's a little ugly — and it's another reason a real database
is nicer, since the database hands out ids for us. We'll get there.

> Notice `get` and `delete` will blow up if the id doesn't exist — a `KeyError`
> that FastAPI turns into an ugly 500. We're leaving that on purpose. Phase 4 is
> all about turning those into clean 404s.

## Test it with curl

Restart isn't needed — `--reload` already reloaded on save. Open a *second*
terminal (leave the server running in the first) and drive the API by hand.

Windows note: PowerShell aliases `curl` to its own command, so use `curl.exe`
there. On macOS/Linux plain `curl` is fine.

**Create a note:**

```bash
curl -X POST http://127.0.0.1:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk", "content": "2% if they have it"}'
```

You'll get back the stored record with `"id": 1`. Create one more so we have
something to list:

```bash
curl -X POST http://127.0.0.1:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "Call dentist", "content": "book a cleaning", "pinned": true}'
```

**List them:**

```bash
curl http://127.0.0.1:8000/notes
```

You should see both notes in an array.

**Read one:**

```bash
curl http://127.0.0.1:8000/notes/1
```

**Update it** (PUT replaces the whole note):

```bash
curl -X PUT http://127.0.0.1:8000/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy oat milk", "content": "the barista kind", "pinned": true}'
```

List again and you'll see note 1 has changed.

**Delete one:**

```bash
curl -X DELETE http://127.0.0.1:8000/notes/2
```

List one final time — note 2 is gone.

## The map of methods to operations

This pairing is a convention you'll see in nearly every REST API. Worth
committing to memory:

| Operation | HTTP method | Path | What it does |
|-----------|-------------|------|--------------|
| Create | `POST` | `/notes` | add a new note |
| Read (all) | `GET` | `/notes` | list notes |
| Read (one) | `GET` | `/notes/{id}` | fetch a single note |
| Update | `PUT` | `/notes/{id}` | replace a note |
| Delete | `DELETE` | `/notes/{id}` | remove a note |

Two patterns fall out of this. `POST` and `GET-all` act on the *collection*
(`/notes`), while `GET-one`, `PUT`, and `DELETE` act on a *specific member*
(`/notes/{id}`). And the same path serves different operations depending on the
method — `/notes` is both "list" and "create", the method tells them apart.

## Where we are

You have a full CRUD API. You can create notes, read them back, change them, and
remove them — all driven by the right HTTP methods, all testable with curl or the
`/docs` page. It's missing one thing a real API can't skip: it falls apart the
moment someone asks for a note that doesn't exist. That's the next phase.
