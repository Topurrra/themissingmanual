---
title: "SQLAlchemy From Zero"
guide: "sqlalchemy-from-zero"
phase: 0
summary: "Learn Python's premier database toolkit — the ORM under Flask-SQLAlchemy and SQLModel: Core vs ORM, the engine and connections, declarative models, the Session and unit of work, the modern select() query API, relationships, loading strategies and the N+1 trap, and Alembic migrations. The library those wrappers wrap, made plain."
tags: [sqlalchemy, python, orm, database, session, alembic, core, framework]
category: frameworks
order: 13
group: "Python"
difficulty: intermediate
synonyms: ["learn sqlalchemy", "sqlalchemy tutorial", "sqlalchemy 2.0", "sqlalchemy core vs orm", "sqlalchemy session unit of work", "sqlalchemy select query", "sqlalchemy relationships", "sqlalchemy n+1 selectinload", "alembic migrations"]
updated: 2026-06-23
---

# SQLAlchemy From Zero

SQLAlchemy is the database toolkit most serious Python talks to a database through. If you used
Flask-SQLAlchemy in [Flask From Zero](/guides/flask-from-zero) or SQLModel in
[FastAPI From Zero](/guides/fastapi-from-zero), you used SQLAlchemy without meeting it — those are thin
layers over this. Learning it directly is doubly worth it: it's the most powerful, flexible ORM in the
Python world, and understanding it turns those wrappers from magic into "oh, that's SQLAlchemy, configured
for me."

The mental model that makes it click is that SQLAlchemy is really **two libraries stacked**: **Core** (a
Pythonic way to build and run SQL — the foundation) and the **ORM** (maps Python classes to tables, built
on Core). Most app code lives in the ORM, but knowing Core is there — and that you can always drop down to
it — is what makes SQLAlchemy feel like a tool you command rather than fight. We build it idea-first the
whole way, including the two ideas that govern every ORM: the **Session** (the unit of work) and how it
decides what SQL to send.

> 📝 This assumes **Python** (classes, decorators — [Python From Zero](/guides/python-from-zero)) and
> basic **databases** (tables, keys, joins — [What a Database Is](/guides/what-a-database-is)). The ORM
> concepts transfer directly from [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero) — this is the
> Python equivalent. SQLAlchemy needs a real database engine, so examples are shown with their output.

## How to read this

Read in order — it builds one schema (authors, books, tags) from a bare engine up to relationships and
migrations. Uses modern SQLAlchemy 2.0 style throughout. Phases carry difficulty badges.

## The phases

**Part 1 — Foundations (🟢 Basic → 🟡)**
1. **[What SQLAlchemy Is (Core vs ORM)](01-what-sqlalchemy-is.md)** 🟢 — the two-layer design and where it sits under the frameworks.
2. **[The Engine & Connecting](02-the-engine-and-connecting.md)** 🟢 — `create_engine`, connections, transactions, and running SQL with Core.
3. **[Defining Models](03-defining-models.md)** 🟡 — declarative classes, `Mapped`/`mapped_column`, and the table they imply.

**Part 2 — The ORM in action (🔴 → 🟡)**
4. **[The Session & Unit of Work](04-the-session-and-unit-of-work.md)** 🔴 — the heart: the identity map, flush, and dirty tracking.
5. **[Querying with select()](05-querying-with-select.md)** 🟡 — the modern 2.0 query API: filtering, ordering, and fetching results.
6. **[Relationships](06-relationships.md)** 🔴 — `relationship()`, foreign keys, one-to-many, many-to-many, `back_populates`.
7. **[Loading Strategies & the N+1 Trap](07-loading-strategies-and-n-plus-1.md)** 🔴 — lazy vs eager, `selectinload`/`joinedload`, and the trap that bites everyone.

**Part 3 — Real projects (🟡 → 🟢)**
8. **[Migrations with Alembic](08-migrations-with-alembic.md)** 🟡 — versioned schema changes, autogenerate, and why `create_all` isn't enough.
9. **[SQLAlchemy in the Real World & Where to Go Next](09-where-to-go-next.md)** 🟢 — Core vs ORM choices, async SQLAlchemy, and what to build.

> After this, Flask-SQLAlchemy and SQLModel read as conveniences over a Session, mapped classes, and
> `select()` — the things you now understand directly.

---

[Phase 1: What SQLAlchemy Is (Core vs ORM) →](01-what-sqlalchemy-is.md)
