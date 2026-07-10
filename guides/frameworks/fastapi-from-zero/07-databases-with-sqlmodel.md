---
title: "Databases with SQLModel"
guide: "fastapi-from-zero"
phase: 7
summary: "Make the get_db yield-dependency real with SQLModel — one class that's both your Pydantic model and your table — and wire create, read, update, and delete into the Book endpoints."
tags: [fastapi, sqlmodel, sqlalchemy, database, orm, session, crud, dependency]
difficulty: intermediate
synonyms: ["fastapi sqlmodel tutorial", "fastapi database crud", "fastapi sqlalchemy session", "sqlmodel pydantic sqlalchemy", "fastapi db dependency get_db", "fastapi orm", "fastapi postgres sqlite"]
updated: 2026-07-10
---

# Databases with SQLModel

Every Book your service has handled so far has lived in a Python list that vanishes the moment the
process restarts. That was fine while we learned routing, validation, response models, and dependency
injection — but a real service has to *remember* things. [Phase 5](05-dependency-injection.md) built a
`get_db` dependency that opened a fake session, handed it to the endpoint, and closed it afterward. This
phase makes that real: a genuine database, a genuine session, and the four operations every app
eventually needs — create, read, update, delete.

## The mental model: one class, two jobs

📝 A database is a separate program that stores your data as **rows in tables** and guards it — types,
uniqueness, many callers at once. If that's fuzzy, [What a Database Actually Is](/guides/what-a-database-is)
is the gentle version. Your Python code doesn't speak to it in objects; the database speaks **SQL** and
stores **rows**. Something has to translate between "a `Book` object in memory" and "a row in the `book`
table." That translator is an **ORM** (Object-Relational Mapper): it maps objects ↔ rows so you write
Python and it writes the SQL.

If you've met an ORM before — say Java's JPA — the *concepts* transfer almost one-for-one: entities, a
session/persistence context, lazy loading, the N+1 trap. [Hibernate & JPA From
Zero](/guides/hibernate-and-jpa-from-zero) covers those ideas in depth. SQLModel is the same playbook,
Python-flavored.

📝 **SQLModel** — written by Sebastián Ramírez, the same person who wrote FastAPI — sits on top of two
libraries you'd otherwise wire together by hand:

- **Pydantic** gives you validation and serialization (the model layer from [Phase 3](03-pydantic-models-and-validation.md) and [Phase 4](04-response-models-and-status-codes.md)).
- **SQLAlchemy** gives you the ORM and the actual database talking.

SQLModel fuses them so that **one class can be both your API model *and* your database table.** No
duplicating fields across a Pydantic schema and a separate ORM model. The class you validate requests
with can be the same class that maps to a table. That's the whole pitch.

## Defining a table model

Here's `Book` as a real table. This needs a database engine and can't run in the browser sandbox, so
it's plain Python — copy it into a file and run it locally:

```python
from sqlmodel import SQLModel, Field, create_engine

class Book(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    author: str
    year: int
    price: float

# the engine is the connection factory to the database
engine = create_engine("sqlite:///books.db", echo=True)

# create the table(s) for every table-model SQLModel knows about
SQLModel.metadata.create_all(engine)
```

*What just happened:* `class Book(SQLModel, table=True)` declares a model that is *also* a table. Each
annotated attribute becomes a column with a real SQL type (`title` → `TEXT`, `year` → `INTEGER`, `price`
→ `REAL`). `id: int | None = Field(default=None, primary_key=True)` marks `id` as the **primary key** —
the unique handle for each row — and `None` by default because the database fills it in on insert.
`create_engine(...)` builds the object that knows how to reach your database (here a local SQLite file;
swap the URL for Postgres in production and nothing else changes). `metadata.create_all` issues the
`CREATE TABLE` statements; `echo=True` prints the SQL it runs.

⚠️ The `table=True` is load-bearing. **With** it, the class maps to a real table. **Without** it,
SQLModel treats the class as a plain Pydantic model — a request/response schema, no table behind it.
You'll use both flavors in this guide: `table=True` means "this is a table"; no `table=True` means "this
is just a shape."

## The session as a dependency

📝 You never talk to the engine directly for ordinary work. You open a **Session** — a short-lived
workspace bound to one unit of work. You add objects to it, query through it, and `commit()` to flush
your changes to the database. Then you close it. That open → use → close lifecycle is *exactly* the
setup/teardown shape the `yield` dependency from Phase 5 was built for.

Make `get_db` real. It was a placeholder printing "session opened" — now it opens an actual `Session`:

```python
from sqlmodel import Session
from fastapi import Depends

def get_session():
    with Session(engine) as session:   # setup: open a session bound to the engine
        yield session                  # hand it to the endpoint
    # teardown: the `with` block closes the session when the request finishes
```

*What just happened:* this is the same yield-dependency you already understand, with the fake dict
swapped for a real `Session`. `with Session(engine) as session` opens a session; `yield session` injects
it into whatever endpoint asked for it; and when the request finishes, the `with` block runs the
session's teardown — closing it, releasing the connection — **even if the endpoint raised.** That's the
whole reason sessions are done this way: an errored request still cleans up and you never leak
connections.

💡 This is *the* clean per-request DB-session pattern, and it's why we spent a phase on `yield`
dependencies before touching a database. One session is born when a request arrives and dies when the
response is sent. Endpoints just declare `session: Session = Depends(get_session)` and receive a
ready-to-use session — they never open or close one themselves.

## CRUD: the four operations

Now the payoff. The Book endpoints, each receiving an injected session and doing real database work:

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select

app = FastAPI()

@app.post("/books")
def create_book(book: Book, session: Session = Depends(get_session)):
    session.add(book)       # stage the new row
    session.commit()        # write it to the database
    session.refresh(book)   # reload it so book.id is populated
    return book

@app.get("/books")
def list_books(session: Session = Depends(get_session)):
    books = session.exec(select(Book)).all()   # SELECT * FROM book
    return books

@app.get("/books/{book_id}")
def get_book(book_id: int, session: Session = Depends(get_session)):
    book = session.get(Book, book_id)   # fetch by primary key
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book
```

*What just happened:* three operations, all through the injected session.
- **Create** — `session.add(book)` stages the object, `session.commit()` writes it, and
  `session.refresh(book)` reloads it from the database so the auto-generated `id` is filled in before you
  return it. (Skip the refresh and `book.id` is still `None` in your response.)
- **Read all** — `select(Book)` builds a query, `session.exec(...).all()` runs it and returns a list of
  `Book` objects.
- **Read one or 404** — `session.get(Book, book_id)` looks a row up by primary key; if it's missing, raise
  the honest `404` from [Phase 4](04-response-models-and-status-codes.md) instead of returning `null`.

Update and delete round out the set:

```python
@app.put("/books/{book_id}")
def update_book(book_id: int, new_price: float, session: Session = Depends(get_session)):
    book = session.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    book.price = new_price   # mutate the tracked object
    session.add(book)
    session.commit()
    session.refresh(book)
    return book

@app.delete("/books/{book_id}")
def delete_book(book_id: int, session: Session = Depends(get_session)):
    book = session.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    session.delete(book)
    session.commit()
    return {"deleted": book_id}
```

*What just happened:* update *fetches* the existing row first (so you only change real records), mutates
the attribute, and commits — the session tracks the object, so changing `book.price` and committing is
enough to issue the `UPDATE`. Delete fetches, calls `session.delete(book)`, and commits. Both 404
cleanly when the id doesn't exist. The rhythm across all four: fetch or build → change → `commit`. CRUD.

When `list_books` runs, `select(Book)` becomes a real query. With `echo=True` you'd see SQLModel emit
something like:

```sql
SELECT book.id, book.title, book.author, book.year, book.price
FROM book;
```

And `session.get(Book, 7)` becomes a primary-key lookup:

```sql
SELECT book.id, book.title, book.author, book.year, book.price
FROM book
WHERE book.id = 7;
```

```console
INFO     sqlalchemy.engine.Engine BEGIN (implicit)
INFO     sqlalchemy.engine.Engine SELECT book.id, book.title, book.author, book.year, book.price FROM book
INFO     sqlalchemy.engine.Engine [generated in 0.00018s] ()
```

*What just happened:* you wrote Python (`select(Book)`), the ORM wrote SQL — the whole job of an ORM,
made visible. To read those queries fluently — joins especially — [SQL Joins
Explained](/guides/sql-joins-explained) is the companion.

## Input/output models — and the gotchas

You *can* accept a `Book` table model straight off the request, like `create_book` does above, and it
works. But 💡 keep the same discipline from [Phase 4](04-response-models-and-status-codes.md): use
**separate input and output schemas** even with SQLModel. Make them plain models (no `table=True`):

```python
class BookCreate(SQLModel):           # input: what a client may send
    title: str
    author: str
    year: int
    price: float

class BookPublic(SQLModel):           # output: what you promise to return
    id: int
    title: str
    author: str
    year: int
    price: float

@app.post("/books", response_model=BookPublic)
def create_book(data: BookCreate, session: Session = Depends(get_session)):
    book = Book.model_validate(data)   # build the table object from validated input
    session.add(book)
    session.commit()
    session.refresh(book)
    return book                        # filtered through BookPublic on the way out
```

*What just happened:* `BookCreate` has no `id`, so a client physically *cannot* set the primary key — the
database owns that. `Book.model_validate(data)` turns the validated input into a real table object.
`response_model=BookPublic` filters the response so you control exactly what goes out the door, even
though you returned the full table object. Three layers, one source of truth, no field duplication pain
because they're all SQLModel.

A few traps worth naming before you ship:

⚠️ **Don't return the raw table object if it has fields you don't want exposed.** The moment your table
grows a column like `internal_notes` or, later, a `hashed_password`, returning the bare `Book` leaks it.
`response_model=BookPublic` above is your guarantee that only the public shape escapes — that discipline
matters a lot more in [Phase 8: Authentication & Security](08-authentication-and-security.md).

⚠️ **One session per request — never share one across requests.** A `Session` is a short-lived unit of
work, not a global you create once at startup. Sharing a session between concurrent requests corrupts
state and produces baffling bugs. The `get_session` dependency exists precisely so each request gets its
own fresh session and gives it back. Resist the urge to make `session` a module-level singleton.

⚠️ **The N+1 query trap is still here.** Loop over 100 books and touch a related object (say each book's
reviews) lazily, and the ORM can quietly fire 1 query for the list plus 100 more — one per book. This is
the *same* trap every ORM has, and the fix is the same: load what you need up front (eager loading / a
join) instead of one row at a time. The deep treatment is in [Hibernate & JPA From
Zero](/guides/hibernate-and-jpa-from-zero) — the lesson is portable, only the syntax differs.

💡 A database in FastAPI is the same DB discipline as any serious ORM — sessions as units of work,
separate input/output shapes, watch your queries — wearing Python's clothes. You already knew the
dependency mechanism from Phase 5; this phase just plugged a real session into it.

## Recap

1. An **ORM** maps Python objects ↔ database rows so you write Python and it writes SQL. **SQLModel**
   (by FastAPI's author) fuses **Pydantic** (validation) and **SQLAlchemy** (ORM) so one class can be
   both your API model and your table.
2. `class Book(SQLModel, table=True)` defines a table; each attribute is a column and
   `Field(primary_key=True)` marks the key. `create_engine(...)` connects, `metadata.create_all`
   builds the tables. **Without `table=True`** the class is just a Pydantic schema, no table.
3. The **session** is a short-lived unit of work. Make `get_session` a `yield` dependency that opens a
   `Session`, yields it, and closes it after the request — even on error. Endpoints inject it with
   `session: Session = Depends(get_session)`.
4. **CRUD**: create = `add` + `commit` + `refresh`; read = `session.get(Book, id)` or
   `session.exec(select(Book)).all()`; update = fetch, mutate, `commit`; delete = fetch, `delete`,
   `commit`. Missing rows raise an honest `404`.
5. Keep **separate `BookCreate`/`BookPublic`** schemas so clients can't set `id` and `response_model`
   controls output. Never return a raw table object with secret fields.
6. **One session per request** (never share across requests), and the **N+1 trap** still applies —
   load related data up front. Same ORM discipline as everywhere, Python-flavored.

## Quick check

Lock in the database fundamentals before we add auth:

```quiz
[
  {
    "q": "What does adding `table=True` to `class Book(SQLModel)` do?",
    "choices": ["Makes the class faster to validate", "Makes the class map to a real database table (instead of being a plain Pydantic schema)", "Automatically creates the database file", "Marks every field as a primary key"],
    "answer": 1,
    "explain": "With table=True the class maps to a real table; without it, SQLModel treats it as an ordinary Pydantic model used as a request/response schema."
  },
  {
    "q": "After `session.add(book)` and `session.commit()`, why call `session.refresh(book)` before returning it?",
    "choices": ["To open a new session", "To validate the input again", "To reload the object so database-generated fields like the auto-incremented id are populated", "To roll back the transaction"],
    "answer": 2,
    "explain": "The database fills in id on insert. Without refresh, book.id is still None in memory, so your response would omit the real id."
  },
  {
    "q": "Why keep a separate `BookCreate` model (no id) for the request body even though SQLModel lets you accept the table model directly?",
    "choices": ["It runs faster", "So clients can't set the primary key and you control what's accepted vs returned", "Because table models can't be used in POST bodies", "To avoid importing Pydantic"],
    "answer": 1,
    "explain": "A BookCreate without an id means a client physically can't set the database-owned primary key, and paired with response_model you control exactly what goes in and what comes out."
  }
]
```

---

[← Phase 6: Async & Concurrency](06-async-and-concurrency.md) · [Guide overview](_guide.md) · [Phase 8: Authentication & Security →](08-authentication-and-security.md)
