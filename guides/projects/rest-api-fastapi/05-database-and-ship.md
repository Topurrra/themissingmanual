---
title: "A Database, then Ship It"
guide: rest-api-fastapi
phase: 5
summary: "Swap the in-memory dict for a SQLite database so data survives restarts, then run, test, and learn how you'd deploy the finished API."
tags: [python, fastapi, sqlite, database, deploy]
difficulty: intermediate
synonyms:
  - fastapi sqlite database
  - persist data fastapi
  - python sqlite3 api
  - deploy fastapi
  - fastapi production
updated: 2026-06-30
---

# A Database, then Ship It

The API works, but every restart wipes it clean. Real data has to outlive the
process, so this phase swaps the dictionary for SQLite. SQLite is a full SQL
database that stores everything in one file, and it ships with Python as the
`sqlite3` module — nothing to install, no server to run. Perfect for this.

The thing worth noticing as we go: your routes barely change. That's the payoff
of having kept the storage logic small. We'll put the database code in its own
file, and the routes will call it the same way they called the dict.

## A database module

Create a new file, `db.py`, next to `main.py`:

```python
import sqlite3

DB_PATH = "notes.db"


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # rows behave like dicts
    return conn


def init_db():
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                pinned INTEGER NOT NULL DEFAULT 0
            )
            """
        )
```

Two details to call out:

- `conn.row_factory = sqlite3.Row` makes each result row act like a dictionary,
  so `dict(row)` gives you `{"id": 1, "title": ...}` — the same shape your API
  already returns.
- `id INTEGER PRIMARY KEY AUTOINCREMENT` means SQLite hands out the ids itself.
  That `global next_id` counter from earlier? Gone. The database owns ids now.

## Rewrite main.py to use the database

Replace `main.py` with this. The models and the error handling are unchanged —
only the storage swaps from a dict to SQL calls:

```python
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from db import connect, init_db

app = FastAPI()


@app.on_event("startup")
def startup():
    init_db()


class NoteIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1)
    pinned: bool = False


def get_or_404(note_id: int) -> dict:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM notes WHERE id = ?", (note_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Note {note_id} not found")
    return dict(row)


@app.get("/notes")
def list_notes():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM notes ORDER BY id").fetchall()
    return [dict(r) for r in rows]


@app.get("/notes/{note_id}")
def get_note(note_id: int):
    return get_or_404(note_id)


@app.post("/notes", status_code=status.HTTP_201_CREATED)
def create_note(note: NoteIn):
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO notes (title, content, pinned) VALUES (?, ?, ?)",
            (note.title, note.content, int(note.pinned)),
        )
        new_id = cur.lastrowid
    return get_or_404(new_id)


@app.put("/notes/{note_id}")
def update_note(note_id: int, note: NoteIn):
    get_or_404(note_id)
    with connect() as conn:
        conn.execute(
            "UPDATE notes SET title = ?, content = ?, pinned = ? WHERE id = ?",
            (note.title, note.content, int(note.pinned), note_id),
        )
    return get_or_404(note_id)


@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    get_or_404(note_id)
    with connect() as conn:
        conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    return {"deleted": note_id}
```

A few things to take away from this:

- **The routes look the same.** Same paths, same methods, same status codes, same
  404s. Callers can't tell the storage changed — which is the whole point.
- **Those `?` placeholders matter.** Never build SQL by pasting values into the
  string. The `?` lets SQLite insert the value safely, which is what stops SQL
  injection. Always pass values as the tuple, never with f-strings.
- **`@app.on_event("startup")`** runs `init_db()` once when the server boots, so
  the table exists before the first request. `CREATE TABLE IF NOT EXISTS` makes
  that safe to run every time.
- **`int(note.pinned)`** because SQLite has no boolean type — we store `True`/
  `False` as `1`/`0`.

## Run and test it

Start the server the same way as before:

```bash
uvicorn main:app --reload
```

On the first request a file called `notes.db` appears in your folder — that's
your database. Run the same curl commands from phase 3 to create and read notes:

```bash
curl -X POST http://127.0.0.1:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk", "content": "2% if they have it"}'

curl http://127.0.0.1:8000/notes
```

Now the real test. Stop the server with `Ctrl+C`, start it again, and list the
notes:

```bash
curl http://127.0.0.1:8000/notes
```

Your note is still there. The data survived the restart. That's the line between
a demo and something you could actually use.

## A note on SQLAlchemy

We used the built-in `sqlite3` module because it's already there and the SQL is
short. On a bigger project you'll likely reach for **SQLAlchemy**, an ORM that
lets you work with Python objects instead of writing SQL by hand, and lets you
switch from SQLite to PostgreSQL by changing a connection string. It's the right
tool once your queries grow — but the concepts you learned here (a connection, a
table, the CRUD statements, parameterized values) are exactly what it wraps. You
haven't learned a throwaway version; you've learned the layer underneath.

## Getting it ready to ship

A few things stand between this and a deployed service. Quick tour so you know
what's next:

| Concern | What to do |
|---------|------------|
| **Pin your deps** | Run `pip freeze > requirements.txt` so anyone (or any server) can recreate your environment with `pip install -r requirements.txt`. |
| **Production server** | `--reload` is for development. In production you run something like `uvicorn main:app --host 0.0.0.0 --port 8000` (no reload), often behind a process manager. |
| **A real database** | SQLite is great for one machine. For a service that scales, move to PostgreSQL — this is where SQLAlchemy earns its keep. |
| **Containerize** | A small `Dockerfile` makes the app run the same everywhere. |

A minimal `Dockerfile` for this project looks like:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run it with:

```bash
docker build -t notes-api .
docker run -p 8000:8000 notes-api
```

Hosts like Railway, Render, Fly.io, or any cloud that runs containers will take
this image and put it on the internet. Each has its own steps, but they all want
the same thing you now have: an app that starts with one command and listens on a
port.

## Where we are — and what you built

Step back and look at the folder. Two files, `main.py` and `db.py`, and you have:

- five REST endpoints covering full CRUD
- input validated from type hints and Pydantic `Field` rules
- proper status codes — 201 on create, 404 on missing, 422 on bad input
- a SQLite database that keeps your data across restarts
- auto-generated interactive docs at `/docs`
- a `Dockerfile` and a clear path to deployment

That's a real REST API, built the way you'd build one at work — start small, add
validation, separate the storage, and only then worry about shipping. The
"notes" subject was an excuse; swap it for tasks, users, products, or anything
else and the same five-phase shape holds. You've got the pattern now.
