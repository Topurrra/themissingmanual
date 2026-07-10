---
title: "Querying with select()"
guide: "sqlalchemy-from-zero"
phase: 5
summary: "Read data the SQLAlchemy 2.0 way: build a select() statement, execute it through the Session, pull objects with scalars/scalar/get, and filter, order, limit, and join — watching the SQL the whole time."
tags: [sqlalchemy, select, query, filtering, scalars, where, order-by]
difficulty: intermediate
synonyms: ["sqlalchemy select query", "sqlalchemy 2.0 query api", "sqlalchemy where filter", "sqlalchemy scalars all", "sqlalchemy order_by", "sqlalchemy session.execute", "sqlalchemy query vs select"]
updated: 2026-07-10
---

# Querying with select()

In [Phase 4](04-the-session-and-unit-of-work.md) the Session learned to save your `Author`, `Book`, and
`Tag` objects and track their changes. Now you want them back. This is the half of the round-trip you'll
spend most of your life in: reading. Adding a book happens once; *finding* books happens constantly.

**A query is a sentence you build up, then hand to the Session to say out loud.** You construct a
`select(...)` statement — a Python object that *describes* what you want, piece by piece — and the Session
executes it against the database and brings back the rows. The statement itself runs nothing; it's just a
recipe. Building and running are two separate steps, and keeping them separate is what makes SQLAlchemy
queries composable.

Everything you write here maps to SQL you already know. If `WHERE`, `ORDER BY`, and `JOIN` feel shaky,
keep [/guides/sql-joins-explained](/guides/sql-joins-explained) open in a tab — this phase is mostly
those same ideas, expressed in Python instead of a string.

## The select() construct

📝 **`select(Model)`** — the modern way to describe a read. You build the statement with `select(Book)`,
then run it through the Session with `session.execute(stmt)` or, more commonly, `session.scalars(stmt)`.
Here's the simplest possible query — every book in the table:

```python
from sqlalchemy import select

stmt = select(Book)
books = session.scalars(stmt).all()

for book in books:
    print(book.title)
```

*What just happened:* `select(Book)` built a statement object — nothing touched the database yet. Passing
it to `session.scalars(...)` is what actually ran the query; `.all()` collected the results into a list of
`Book` instances. You can build the statement on one line and execute it on another, store it in a
variable, pass it to a function — it's an ordinary Python object until the Session runs it.

That tiny statement generated this SQL:

```sql
SELECT books.id, books.title, books.year
FROM books
```

*What just happened:* `select(Book)` expands to "select every column of the `books` table." SQLAlchemy
read the column list straight off your model (the source of truth from [Phase 3](03-defining-models.md))
and wrote the `SELECT`. Reading the Python and the SQL side by side is the habit to build now — every
construct in this phase corresponds to a clause you can point at.

⚠️ **You'll see `session.query(Book)` everywhere — it's the old way.** Pre-2.0 SQLAlchemy queried with
`session.query(Book).filter(...).all()`, and a huge amount of tutorial and StackOverflow code still uses
it. It isn't deleted and it still runs, but the 2.0 style is `select()` + `session.execute`/`scalars`. When
you copy a snippet built on `session.query(...)`, you've found a pre-2.0 example — translate it to
`select(...)` before pasting, the same way you translate bare `Column(...)` into `mapped_column(...)`.

## Getting results back

The statement is the same; how you *pull* results depends on what you want. Four tools cover almost
everything:

```python
# A list of objects
all_books = session.scalars(select(Book)).all()

# Just the first object, or None if there are no rows
first_book = session.scalars(select(Book)).first()

# Exactly one scalar value (one object, or one column)
the_book = session.scalar(select(Book).where(Book.id == 1))

# By primary key — the fast path
same_book = session.get(Book, 1)
```

*What just happened:* `session.scalars(stmt)` returns a stream of single objects (the "scalar" part means
"unwrap each row to its one entity, don't hand me a row tuple"); `.all()` makes a list, `.first()` takes
one or `None`. `session.scalar(stmt)` (singular) is the shortcut for "I expect one value" — it runs the
statement and returns the first scalar directly. And `session.get(Book, 1)` is special: it's the
**primary-key lookup**. It can serve the object straight from the Session's identity map ([Phase
4](04-the-session-and-unit-of-work.md)) without hitting the database at all if it's already loaded — so
reach for `get` whenever you're fetching by id.

💡 The naming trips people up, so anchor it: **`scalars` (plural) → many objects, `scalar` (singular) →
one value, `get` → one object by primary key.** When you find yourself writing
`select(Book).where(Book.id == ...)`, stop — that's exactly what `session.get` is for.

## Filtering with where()

A query with no filter returns the whole table, which is rarely what you want. `.where(...)` narrows it,
and it maps directly to SQL's `WHERE`:

```python
# Books published after 2000
recent = session.scalars(
    select(Book).where(Book.year > 2000)
).all()

# Two conditions — chained .where() calls are ANDed together
recent_pythons = session.scalars(
    select(Book)
    .where(Book.year > 2000)
    .where(Book.title.ilike("%python%"))
).all()

# OR — combine with | and wrap each side in parens
classics_or_new = session.scalars(
    select(Book).where((Book.year < 1950) | (Book.year > 2020))
).all()

# Membership — IN a set of values
picks = session.scalars(
    select(Book).where(Book.id.in_([1, 4, 7]))
).all()
```

*What just happened:* the comparison `Book.year > 2000` doesn't compute a Python boolean — it builds a SQL
condition object, because `Book.year` is a mapped column, not a plain number. Stacking `.where(...)` calls
**ANDs** them (both must hold). For **OR**, combine conditions with `|` and wrap each in parentheses —
Python's operator precedence will bite you otherwise, so the parens are mandatory, not stylistic.
`.ilike("%python%")` is a case-insensitive `LIKE` (the `i`), matching any title containing "python" in any
casing. `.in_([...])` matches a column against a list — far cleaner than OR-ing a dozen equalities.

Here's the SQL behind the two-condition query, so you can see the `AND`:

```sql
SELECT books.id, books.title, books.year
FROM books
WHERE books.year > 2000 AND books.title ILIKE '%python%'
```

*What just happened:* the two chained `.where(...)` calls became `year > 2000 AND title ILIKE ...`. This
is the same filtering you'd write by hand in SQL ([/guides/sql-joins-explained](/guides/sql-joins-explained)
leans on the same `WHERE` semantics) — SQLAlchemy is just letting you build the condition out of Python
expressions instead of a string, which means your editor and type checker can help you.

## Ordering, limiting, and picking columns

Three more clauses round out everyday reads: sort the results, take a slice, and (when you don't need full
objects) fetch just the columns you care about.

```python
# Newest first, then take 10 — classic pagination
page = session.scalars(
    select(Book)
    .order_by(Book.year.desc())
    .limit(10)
    .offset(0)
).all()
```

*What just happened:* `.order_by(Book.year.desc())` sorts by year, descending (`.asc()` for the other
direction). `.limit(10)` caps the result at 10 rows; `.offset(0)` skips none — bump it to `.offset(10)`
for the next page, `.offset(20)` for the page after. `limit` + `offset` is the standard pagination pair.

When you only need a couple of fields — say, a dropdown of titles and years — selecting whole `Book`
objects is wasteful. Ask for specific columns instead:

```python
rows = session.execute(
    select(Book.title, Book.year).order_by(Book.title)
).all()

for title, year in rows:
    print(title, year)
```

*What just happened:* notice two changes. First, `select(Book.title, Book.year)` lists columns, not the
whole model. Second, we used `session.execute(...)`, **not `scalars`** — because the result isn't single
objects anymore, it's **rows of tuples** like `("Fluent Python", 2022)`. Each row unpacks into
`title, year`. Use `scalars` when you want objects; use `execute` when you select individual columns and
want the row tuples. That's the dividing line between the two methods.

💡 Reach for column selects when you're reading a lot of rows but only displaying a field or two — you skip
the cost of building full mapped objects. Reach for `select(Book)` (with `scalars`) when you actually need
the objects: to read several attributes, to modify them, or to follow their relationships.

## Joins and aggregates (a taste)

Real questions span tables — "books by Ursula K. Le Guin," "how many books per author." That's
`.join(...)` and aggregate functions. We'll keep this to a taste; the relationship machinery that makes
joins effortless lands in [Phase 6](06-relationships.md).

```python
from sqlalchemy import func

# Books written by a specific author — join books to authors
le_guin_books = session.scalars(
    select(Book)
    .join(Author)
    .where(Author.name == "Ursula K. Le Guin")
).all()

# How many books each author has — count + group_by
counts = session.execute(
    select(Author.name, func.count(Book.id))
    .join(Book)
    .group_by(Author.name)
).all()

for name, n in counts:
    print(name, n)
```

*What just happened:* `.join(Author)` stitches `books` to `authors` on their relationship (once you've
defined it in Phase 6, SQLAlchemy figures out the join condition for you), and the `.where(...)` filters
on a column from the *joined* table. The second query introduces `func.count(Book.id)` — an aggregate —
with `.group_by(Author.name)` to count books per author. Because it selects columns (`name` and a count),
it's `session.execute` returning tuples, not `scalars`.

💡 Every query here is the **same `select(...)` object, built up by chaining methods** — `.where`,
`.order_by`, `.join`, `.group_by` — and then handed to the Session to run. This is SQLAlchemy Core's
expression language surfaced inside the ORM; the composability is the whole point.

⚠️ **Count your queries as you go.** Every example above is *one* `SELECT`. The danger arrives in Phase 6:
once books have an `.author` relationship, it's tempting to loop over books and read `book.author.name`
each time — and that quietly fires a *separate* query per book. That's the **N+1 problem**, and it's the
single most common SQLAlchemy performance trap. We name it here so the habit — watch the SQL your code
generates — is already in place when [Phase 7](07-loading-strategies-and-n-plus-1.md) shows you how to
kill it.

## Recap

1. **`select(Model)`** builds a statement (it runs nothing); the Session executes it via
   **`session.scalars(stmt)`** (for objects) or **`session.execute(stmt)`** (for column/row tuples).
2. **`session.query(...)` is the pre-2.0 style** — common in old tutorials, still works, but translate it
   to `select()` for new code.
3. Pull results with **`.all()`** (list), **`.first()`** (one or `None`), **`session.scalar(stmt)`** (one
   value), and **`session.get(Model, pk)`** (primary-key lookup, the fast path that can skip the database).
4. **`.where(...)`** filters; chained `.where` calls are **AND**, `|` with parentheses is **OR**, plus
   `.ilike("%x%")` for case-insensitive matching and `.in_([...])` for membership.
5. **`.order_by(col.desc())`**, **`.limit()`**/**`.offset()`** (pagination), and **`select(Book.title,
   Book.year)`** for lightweight column reads that come back as **tuples** (use `execute`, not `scalars`).
6. **`.join(...)`**, **`func.count()`**, and **`.group_by(...)`** give a taste of cross-table queries —
   and the rule to carry forward is **count the SQL you generate**, because relationships set up the N+1
   trap (Phase 7).

## Quick check

Test yourself on the distinctions most likely to trip you up when querying:

```quiz
[
  {
    "q": "You write `select(Book.title, Book.year)` and want the results. Which method fits, and what comes back?",
    "choices": [
      "session.scalars(stmt).all() — a list of Book objects",
      "session.execute(stmt).all() — a list of row tuples like ('Fluent Python', 2022)",
      "session.get(stmt) — a single Book by primary key",
      "session.scalar(stmt) — the title string only"
    ],
    "answer": 1,
    "explain": "Selecting specific columns returns rows of tuples, not mapped objects, so you use session.execute(...). Use scalars only when you select whole entities like select(Book) and want them unwrapped to single objects."
  },
  {
    "q": "You want books where year < 1950 OR year > 2020. Which is correct?",
    "choices": [
      "select(Book).where(Book.year < 1950).where(Book.year > 2020)",
      "select(Book).where(Book.year < 1950 or Book.year > 2020)",
      "select(Book).where((Book.year < 1950) | (Book.year > 2020))",
      "select(Book).where(Book.year < 1950, Book.year > 2020)"
    ],
    "answer": 2,
    "explain": "OR uses | with each condition wrapped in parentheses (the parens are required because of Python operator precedence). Chained .where() calls are ANDed, and Python's `or` keyword doesn't build a SQL condition the way | does."
  },
  {
    "q": "You need the Book with id 5, and it may already be loaded in this Session. What's the best call?",
    "choices": [
      "session.get(Book, 5) — the primary-key lookup that can serve it from the identity map without hitting the database",
      "session.scalars(select(Book)).all() then search the list in Python",
      "session.query(Book).get(5) — the modern 2.0 way",
      "session.execute(select(Book.id)) and match on 5"
    ],
    "answer": 0,
    "explain": "session.get(Model, pk) is the dedicated primary-key fetch. It can return the object straight from the Session's identity map if it's already loaded, avoiding a database round-trip — exactly the case described."
  }
]
```

---

[← Phase 4: The Session & Unit of Work](04-the-session-and-unit-of-work.md) · [Guide overview](_guide.md) · [Phase 6: Relationships →](06-relationships.md)