---
title: "The Engine & Connecting"
guide: "sqlalchemy-from-zero"
phase: 2
summary: "Meet the Engine — SQLAlchemy's central source of DB connectivity and its connection pool. Connect, run raw SQL safely with text(), manage transactions with begin(), and read Result objects."
tags: [sqlalchemy, engine, connection, create-engine, core, transactions, dbapi]
difficulty: beginner
synonyms: ["sqlalchemy create_engine", "sqlalchemy connection", "sqlalchemy core execute sql", "sqlalchemy transactions commit", "sqlalchemy connection pool", "sqlalchemy text() raw sql", "sqlalchemy database url"]
updated: 2026-07-10
---

# The Engine & Connecting

Before SQLAlchemy can map a single `Author` to a row, something has to actually *talk to the database* —
open a connection, send SQL, read rows back, and clean up afterward. That something is the **Engine**.
Everything else in this guide — models, the Session, `select()` — sits on top of the machinery you'll meet
here.

The mental model in one sentence: **the Engine is the thing that knows how to reach your database and hands
out connections from a pool, and a Connection is a single live conversation with that database.** You make
one Engine for your whole app, and you borrow short-lived connections from it whenever you need to run SQL.

## The Engine — your single source of DB connectivity

📝 You create an Engine with `create_engine(...)`, passing a **database URL** that says *what kind* of
database, *who* you are, and *where* it lives.

```python
from sqlalchemy import create_engine

# SQLite, stored in a local file called app.db
engine = create_engine("sqlite:///app.db")

# A real server would look like this instead:
# engine = create_engine("postgresql+psycopg://user:pass@localhost:5432/library")
```

*What just happened:* We built one `Engine` object. Notice what we did *not* do — nothing connected to the
database. ⚠️ `create_engine()` is **lazy**: it parses the URL and gets ready, but the first real connection
isn't opened until you actually ask to run something. That's why creating an Engine never fails because the
DB is down — the failure comes later, when you connect.

📝 The **database URL** decodes like this:

```console
postgresql+psycopg://user:pass@localhost:5432/library
└────────┬───────┘   └──┬──┘ └────┬───┘ └─┬─┘ └──┬──┘
   dialect+driver     credentials   host   port  database
```

- **dialect** — which database (`sqlite`, `postgresql`, `mysql`).
- **driver** (optional, after the `+`) — the actual Python library that does the talking (the DBAPI), e.g.
  `psycopg`. Leave it off and SQLAlchemy picks a default.
- The rest is the usual *who / where / which database*. SQLite is the odd one out: it's just a file, so
  there's no host or login — `sqlite:///app.db` (three slashes, then a relative path) or
  `sqlite:///:memory:` for a throwaway in-memory DB.

💡 The Engine is meant to be **created once and shared**. Make it at startup, hand the same object to your
whole app. More on *why* in a moment — it's the single most common Engine mistake.

## Connections & executing SQL (Core)

To run SQL, you borrow a `Connection` from the Engine. The clean way is a `with` block, which guarantees the
connection is returned (back to the pool) when you're done — even if an error is raised mid-way.

```python
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, name FROM author"))
    for row in result:
        print(row.id, row.name)
```

*What just happened:* `engine.connect()` checked out one connection. We ran a query with
`conn.execute(...)`, got back a `Result`, and iterated it row by row. Each `row` is a lightweight named
tuple — `row.name` and `row[1]` both work. When the `with` block ends, the connection is released
automatically; you never call `.close()` yourself.

📝 We wrapped the SQL string in `text(...)`. SQLAlchemy doesn't run bare strings — `text()` marks "this is
literal SQL I want sent as-is." It also gives you the *one* thing you must never skip: **bound parameters**.

⚠️ **Never** build SQL by gluing user input into the string. This is how SQL injection happens:

```python
# 🚨 NEVER do this — a malicious name can rewrite your query
name = user_input
conn.execute(text(f"SELECT * FROM author WHERE name = '{name}'"))
```

Instead, leave a named placeholder (`:name`) and pass the value separately. The database driver keeps the
value and the SQL apart, so input is always treated as *data*, never as code:

```python
with engine.connect() as conn:
    result = conn.execute(
        text("SELECT id, name FROM author WHERE name = :name"),
        {"name": "Ursula K. Le Guin"},
    )
    author = result.fetchone()
    print(author)
```

*What just happened:* `:name` is a placeholder; the dict `{"name": ...}` fills it safely. You can also bind
values fluently with `text("... :name").bindparams(name="...")` — same effect. Either way, the actual string
sent to the DB never contains the user's text. This is non-negotiable: bound params on every query that
touches input.

## Transactions — commit, or it didn't happen

Here's a trap that catches everyone once. 📝 `engine.connect()` gives you a connection that does **not**
commit on its own. If you `INSERT` and then just let the block end, SQLAlchemy rolls back — your write
vanishes. You have to call `conn.commit()` yourself.

```python
with engine.connect() as conn:
    conn.execute(
        text("INSERT INTO author (name) VALUES (:name)"),
        {"name": "N. K. Jemisin"},
    )
    conn.commit()   # ← without this line, the insert is silently discarded
```

*What just happened:* We inserted a row, then explicitly committed to make it permanent. Forget the
`commit()` and the row never lands — no error, just nothing. (This is "commit as you go" style.)

The pattern you should reach for by default is `engine.begin()` instead. It opens a connection **and** a
transaction, then commits automatically if the block finishes cleanly — or rolls back if any exception is
raised:

```python
with engine.begin() as conn:
    conn.execute(
        text("INSERT INTO book (title, author_id) VALUES (:title, :aid)"),
        {"title": "The Fifth Season", "aid": 1},
    )
    conn.execute(
        text("INSERT INTO tag (book_id, label) VALUES (:bid, :label)"),
        {"bid": 1, "label": "fantasy"},
    )
    # no commit() needed — leaving the block commits both inserts together
```

*What just happened:* Both inserts run inside one transaction. If the second one blows up, the first is
rolled back too — you never end up with a book and no tag. This all-or-nothing behavior is the **atomicity**
in ACID; for the full picture of what a transaction guarantees, see
[/guides/transactions-and-acid](/guides/transactions-and-acid).

💡 Rule of thumb: use `engine.begin()` when you're writing, `engine.connect()` when you're only reading.
`begin()` is the recommended default because it makes "did I remember to commit?" a non-question.

## The connection pool — why you make ONE Engine

Opening a brand-new database connection is genuinely expensive — a TCP handshake, authentication, server-side
setup. Doing that per query would crush a busy app.

📝 So the Engine keeps a **connection pool**: a small set of already-open connections it lends out and takes
back. When you write `with engine.connect()`, you're usually grabbing a connection that's already warm, and
returning it to the pool (not closing it) when the block ends. You don't manage any of this — it's the
Engine's whole job.

This is exactly why the Engine is a **share-one-for-the-whole-app** object. The pool only helps if everyone
draws from the *same* pool.

⚠️ The classic mistake: calling `create_engine()` inside a request handler, a function, or a loop. Each call
spins up a *fresh* pool, so connections are never reused, the pool can't do its job, and under load you'll
exhaust the database's connection limit. Create the Engine **once** at startup and pass it around. One Engine
per application (or per database), not per request.

## Result objects — reading rows your way

`conn.execute(...)` returns a `Result`, and how you pull data out of it depends on the shape you want:

```python
with engine.connect() as conn:
    result = conn.execute(text("SELECT id, name FROM author"))

    rows = result.all()          # list of all rows (named tuples)
    # one_row = result.fetchone()  # the next single row, or None
    # first_id = result.scalar()   # first column of the first row

    for row in rows:
        print(row.id, row.name)
```

*What just happened:* `.all()` materializes every row into a list; `.fetchone()` pulls one at a time;
`.scalar()` is the shortcut for "I just want the single value in the first column of the first row" (great
for `SELECT COUNT(*)`).

Two more you'll use constantly:

```python
with engine.connect() as conn:
    # .scalars() → just the first column of every row, not whole tuples
    names = conn.execute(text("SELECT name FROM author")).scalars().all()
    print(names)   # ['Ursula K. Le Guin', 'N. K. Jemisin', ...]

    # .mappings() → each row as a dict-like {column: value}
    for row in conn.execute(text("SELECT id, name FROM author")).mappings():
        print(row["id"], row["name"])
```

*What just happened:* `.scalars()` strips each row down to a single column — perfect when you selected one
thing and want a plain list. `.mappings()` hands back dict-style rows so you can index by column name. Same
`Result`, different lenses.

💡 Everything in this phase — the Engine, connections, the pool, `Result` — *is the Core layer*. When you
start using the ORM in [Phase 4](04-the-session-and-unit-of-work.md), the Session uses an Engine and runs
its SQL through exactly this machinery; it just builds the SQL from your Python classes and turns rows back
into objects for you. You're not leaving Core behind — you're putting a friendlier layer on top of it. Next
up, [Phase 3](03-defining-models.md): describing your `Author`, `Book`, and `Tag` tables as Python classes.

## Recap

- `create_engine(url)` builds the **Engine** — your app's single source of DB connectivity. It's **lazy**: no
  connection opens until you actually run something.
- The **database URL** is `dialect+driver://user:pass@host:port/database` (SQLite is just a file path).
- Borrow a connection with `with engine.connect() as conn:` and run SQL via `conn.execute(text("..."))`.
  Use **bound parameters** (`:name` + a dict), never f-strings — that's SQL injection.
- `engine.connect()` does **not** auto-commit (call `conn.commit()`); `engine.begin()` commits on success
  and rolls back on error — use it by default for writes.
- The Engine holds a **connection pool**, so make **one** Engine for the whole app — never per request.
- `Result` gives you rows many ways: `.all()`, `.fetchone()`, `.scalar()`, `.scalars()`, `.mappings()`.

## Quick check

```quiz
[
  {
    "q": "What does create_engine(\"sqlite:///app.db\") do at the moment you call it?",
    "choices": [
      "Opens a connection to the database immediately",
      "Creates the Engine but connects lazily — no connection opens yet",
      "Runs a test query to confirm the database is reachable"
    ],
    "answer": 1,
    "explain": "create_engine() is lazy: it sets up the Engine and pool config, but the first real connection isn't opened until you execute something."
  },
  {
    "q": "You run an INSERT inside `with engine.connect() as conn:` and the block ends without calling conn.commit(). What happens?",
    "choices": [
      "The row is saved automatically when the block exits",
      "SQLAlchemy raises an error forcing you to commit",
      "The insert is rolled back — the row never lands"
    ],
    "answer": 2,
    "explain": "engine.connect() doesn't auto-commit. Without conn.commit() the transaction rolls back. Use engine.begin() to commit automatically on success."
  },
  {
    "q": "Why should you create just ONE Engine and share it across your whole app?",
    "choices": [
      "The Engine holds a connection pool; one Engine means connections get reused instead of re-opened",
      "SQLAlchemy forbids more than one Engine per process",
      "Each Engine can only run one query at a time"
    ],
    "answer": 0,
    "explain": "The Engine manages a pool of reusable connections. Creating one per request spawns a new pool each time, defeating reuse and exhausting the DB's connection limit."
  }
]
```

---

[← Phase 1: What SQLAlchemy Is (Core vs ORM)](01-what-sqlalchemy-is.md) · [Guide overview](_guide.md) · [Phase 3: Defining Models →](03-defining-models.md)
