---
title: "Defining Models"
guide: "sqlalchemy-from-zero"
phase: 3
summary: "Turn plain Python classes into database tables with SQLAlchemy 2.0 declarative models: DeclarativeBase, Mapped + mapped_column, column types and options, and create_all to build the schema."
tags: [sqlalchemy, models, declarative, mapped-column, declarative-base, columns, orm]
difficulty: intermediate
synonyms: ["sqlalchemy declarative models", "sqlalchemy mapped_column Mapped", "sqlalchemy DeclarativeBase", "sqlalchemy model columns types", "sqlalchemy create_all", "sqlalchemy 2.0 model style", "sqlalchemy primary key"]
updated: 2026-07-10
---

# Defining Models

In [Phase 2](02-the-engine-and-connecting.md) you built an `engine` — the thing that knows how to talk
to your database. But the engine alone doesn't know what your data *looks like*. It can run raw SQL, and
that's it. This phase is where you teach SQLAlchemy the shape of your world: what an `Author` is, what a
`Book` is, what columns they have, and how they become real tables.

**A model class is a two-way map between a Python object and a database row.** On one side, an `Author`
instance living in memory. On the other, a row in an `authors` table. Everything in this phase is you
drawing that map once, in one place — and SQLAlchemy following it in both directions forever after.

We're keeping the domain small and concrete: `Author`, `Book`, and `Tag`. Relationships between them
(who wrote what, which tags a book carries) arrive in [Phase 6](06-relationships.md). For now each model
stands alone — just its own columns, mapped to its own table.

## The declarative base

📝 **`DeclarativeBase`** — the shared parent class that turns your subclasses into mapped tables. Every
model you write inherits from one common `Base`, and that's what wires each class into SQLAlchemy's
machinery (its metadata registry, its mapping logic). You define it exactly once, near the top of your
project:

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

*What just happened:* you created an empty class that does nothing visible — but by subclassing
`DeclarativeBase`, your `Base` now carries a `metadata` object (a catalog of every table it knows about)
and the declarative engine that reads your future classes. Each model subclasses `Base`, registers
itself in that catalog, and becomes something SQLAlchemy can load and save. One `Base` per application is
the norm; all your models share it.

## A mapped class (2.0 style)

Now the real thing. Here's `Author`, mapped to a table:

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Author(Base):
    __tablename__ = "authors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    bio: Mapped[str | None]
```

*What just happened:* `__tablename__` names the table (`authors`). Each attribute is a column, and the
**type annotation drives the column type**: `Mapped[int]` becomes an integer column, `Mapped[str]` a
string column. `mapped_column(primary_key=True)` marks `id` as the primary key. The annotation also
controls nullability — `Mapped[str]` is `NOT NULL`, while `Mapped[str | None]` (the `| None` part) is
nullable. So `bio` is an optional string column; `name` is required. Notice `name` and `bio` don't even
need a `mapped_column(...)` call — when there's nothing to configure, the annotation alone is enough.

💡 The `Mapped[...]` annotation isn't just a type hint for your editor (though it gives you that too).
SQLAlchemy reads it at class-definition time to decide the column's SQL type and nullability. The
annotation and the column are the same decision, written once.

Here's `Book` alongside it:

```python
class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    year: Mapped[int | None]
```

*What just happened:* same pattern. `title` is a required string, `year` is an optional integer (some
books in your shelf might not have a known publication year, so `int | None` lets the column hold `NULL`).

Those two classes describe two real tables. This is the SQL SQLAlchemy would generate from them:

```sql
CREATE TABLE authors (
    id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    bio VARCHAR,
    PRIMARY KEY (id)
);

CREATE TABLE books (
    id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    year INTEGER,
    PRIMARY KEY (id)
);
```

*What just happened:* read it side by side with the classes and it clicks. `Mapped[int]` +
`primary_key=True` became `INTEGER NOT NULL` plus a `PRIMARY KEY`. `Mapped[str]` became `VARCHAR NOT
NULL`. The `| None` annotations (`bio`, `year`) became nullable columns — no `NOT NULL`. The class and
the table are two views of the same thing.

⚠️ **Older 1.x tutorials look different — don't mix them up.** Pre-2.0 SQLAlchemy wrote columns like
`name = Column(String)`, with no `Mapped[...]` annotation and a capital-C `Column`. That style still
works for backwards compatibility, but it's the old way: it doesn't give you typed attributes, and it
infers nothing from annotations. If you're starting fresh, use `Mapped[...]` + `mapped_column(...)`
everywhere. When you copy a snippet from a blog and it uses bare `Column(...)`, you've found a pre-2.0
example — translate it before pasting.

## Column types & options

The annotation handles the common cases (`int`, `str`, `bool`, `datetime`). When you need more control —
a length limit, a uniqueness constraint, a default value, or a SQL type the annotation can't infer — you
pass arguments to `mapped_column(...)`.

Here's `Book` with the mapping spelled out, and a `Tag` model showing a few more options:

```python
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    isbn: Mapped[str | None] = mapped_column(String(13), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    is_featured: Mapped[bool] = mapped_column(default=False)
```

*What just happened:* `String(200)` caps `title` at 200 characters (a plain `Mapped[str]` gives an
unbounded `VARCHAR`, which some databases dislike). `unique=True` on `isbn` and `name` adds a uniqueness
constraint — no two books share an ISBN, no two tags share a name. `Text` is for long, unbounded content
where a length limit makes no sense. `default=False` on `is_featured` is a *Python-side* default: when
you create a `Tag` without setting it, SQLAlchemy fills in `False`. `server_default=func.now()` is a
*database-side* default: the database stamps `created_at` with the current time on insert.

The types you'll reach for most:

| You want | Annotation / type |
|----------|-------------------|
| Whole number | `Mapped[int]` (→ `Integer`) |
| Short text | `Mapped[str]` or `mapped_column(String(n))` |
| Long text | `mapped_column(Text)` |
| True/false | `Mapped[bool]` (→ `Boolean`) |
| Timestamp | `Mapped[datetime]` (→ `DateTime`) |

💡 The rule of thumb: let the annotation pick the type when the default is fine (`Mapped[int]`,
`Mapped[bool]`), and reach into `mapped_column(...)` only when you need a length, a constraint, or a
specific SQL type like `Text`. Don't pass `String` redundantly when `Mapped[str]` already says "string"
— add it only when you want the length limit.

## Creating the schema

You've defined the classes. The tables don't exist yet — your models are still just Python. To actually
build them in the database, you ask `Base`'s metadata to create everything it knows about, using the
engine from Phase 2:

```python
from sqlalchemy import create_engine

engine = create_engine("sqlite:///library.db")

Base.metadata.create_all(engine)
```

*What just happened:* `Base.metadata` is the catalog of every model that subclassed `Base` —
`Author`, `Book`, `Tag`. `create_all(engine)` walks that catalog and issues a `CREATE TABLE` for each one
through the engine's connection. Run this once and your `library.db` now has three real tables matching
your models. It's also smart enough to skip tables that already exist, so running it again is safe — it
won't error or duplicate.

⚠️ **`create_all` builds, it doesn't alter.** It's perfect for getting started and for dev: define
models, call `create_all`, start querying. But it only ever *creates missing* tables — it will not change
a table that already exists. Add a column to your `Book` model after the table's been created, and
`create_all` quietly does nothing to that table; your new column never appears. For evolving a schema
that already has data — adding columns, changing types, renaming things — you need real migrations, which
we cover in [Phase 8](08-migrations-with-alembic.md) with Alembic. Think of `create_all` as the
zero-to-one tool, and Alembic as the one-to-many tool.

## `__repr__` & the model as source of truth

One small quality-of-life addition. By default, printing a model instance gives you something useless
like `<__main__.Author object at 0x7f3c...>`. A `__repr__` fixes that:

```python
class Author(Base):
    __tablename__ = "authors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    bio: Mapped[str | None]

    def __repr__(self) -> str:
        return f"Author(id={self.id!r}, name={self.name!r})"
```

*What just happened:* now an `Author` prints as `Author(id=1, name='Ursula K. Le Guin')` — readable in
the REPL, in logs, in debugger output. It changes nothing about how the model maps to the table; it's
purely for your eyes. Add a short `__repr__` to every model and your debugging sessions get much friendlier.

💡 That `Author` class is now the **single source of truth** for everything downstream. It defines the
`authors` table's structure, it's the type your queries return in [Phase 5](05-querying-with-select.md),
and it's the anchor relationships hang off of in [Phase 6](06-relationships.md).

If you've come from Java's Hibernate/JPA, this will feel familiar: there, an `@Entity` class with
`@Id` and `@Column` annotations plays the exact same role — one class that *is* the table, in both
directions. SQLAlchemy's `Mapped[...]` + `mapped_column(...)` is the same idea wearing Python clothes.
The concepts transfer cleanly; if you want the Java framing of mapping, see
[/guides/hibernate-and-jpa-from-zero](/guides/hibernate-and-jpa-from-zero). Either way, the lesson is the
same: nail the model, and everything else follows.

Next, in [Phase 4](04-the-session-and-unit-of-work.md), you'll meet the **Session** — the object that
takes these models and actually saves, loads, and tracks them.

## Recap

1. **`class Base(DeclarativeBase): pass`** is the shared parent every model subclasses; it carries the
   `metadata` catalog that knows about all your tables. Define it once.
2. A model is a class with **`__tablename__`** and columns written as **`Mapped[...]` + `mapped_column(...)`**.
   The type annotation drives the column's SQL type, and **`Mapped[str | None]`** makes a column nullable.
3. The **2.0 declarative style** (`Mapped[...]` / `mapped_column(...)`) replaces the old 1.x
   `Column(...)` style — recognize old snippets and translate them before reusing.
4. **`mapped_column(...)`** takes options when the annotation isn't enough: `String(200)`, `Text`,
   `nullable`, `unique`, Python `default=`, and DB-side `server_default=`.
5. **`Base.metadata.create_all(engine)`** builds every mapped table through your Phase 2 engine — great
   for dev, but it only *creates* missing tables; it won't alter existing ones (use Alembic, Phase 8).
6. A **`__repr__`** makes instances readable, and the model class is the **single source of truth** that
   drives the table, queries, and relationships — the same role a JPA `@Entity` plays in Java.

## Quick check

Test yourself on the ideas most likely to trip you up when writing models:

```quiz
[
  {
    "q": "In SQLAlchemy 2.0, what makes a column nullable?",
    "choices": [
      "Passing nullable=True is the only way; the annotation is ignored",
      "Annotating it as Mapped[str | None] — the `| None` tells SQLAlchemy the column can be NULL",
      "Leaving out the type annotation entirely",
      "Setting primary_key=False"
    ],
    "answer": 1,
    "explain": "The Mapped[...] annotation drives nullability. Mapped[str] is NOT NULL; Mapped[str | None] is nullable. SQLAlchemy reads the `| None` at class-definition time to decide the column's NOT NULL constraint."
  },
  {
    "q": "You've already created the `books` table with create_all, then you add a new `subtitle` column to the Book model and call create_all again. What happens to the table?",
    "choices": [
      "create_all adds the subtitle column automatically",
      "create_all drops and recreates the table with the new column",
      "Nothing changes — create_all only creates missing tables, it never alters existing ones; you need a migration (Alembic)",
      "create_all raises an error because the table already exists"
    ],
    "answer": 2,
    "explain": "create_all is build-only and idempotent: it skips tables that already exist and never alters them. The new column won't appear. Changing a schema that already exists is what Alembic migrations (Phase 8) are for."
  },
  {
    "q": "You see a tutorial that writes `name = Column(String)` with no `Mapped[...]` annotation. What is this?",
    "choices": [
      "A syntax error — that style never worked",
      "The pre-2.0 (1.x) declarative style; the modern equivalent is `name: Mapped[str] = mapped_column(...)`",
      "A way to define a column that is automatically the primary key",
      "The only correct way to declare a non-nullable column"
    ],
    "answer": 1,
    "explain": "Bare `Column(...)` with no annotation is the older 1.x style. It still works for compatibility, but the 2.0 style uses `Mapped[...]` + `mapped_column(...)`, which gives typed attributes and infers type/nullability from the annotation. Translate old snippets before reusing them."
  }
]
```

---

[← Phase 2: The Engine & Connecting](02-the-engine-and-connecting.md) · [Guide overview](_guide.md) · [Phase 4: The Session & Unit of Work →](04-the-session-and-unit-of-work.md)