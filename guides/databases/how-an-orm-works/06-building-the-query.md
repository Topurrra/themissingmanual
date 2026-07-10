---
title: "Building the Query (to SQL)"
guide: "how-an-orm-works"
phase: 6
summary: "The ORM's fourth job: you describe a query in objects — a method chain, criteria, LINQ, or QuerySet — and it compiles that to parameterized SQL, runs nothing until you enumerate, and stays injection-safe by default."
tags: [orm, database, query-builder, sql-translation, deferred-execution]
difficulty: intermediate
synonyms: ["orm query builder", "orm to sql", "orm query translation", "deferred execution", "orm criteria linq queryset", "orm parameterized query"]
updated: 2026-07-10
---

# Building the Query (to SQL)

Here's the mental model to carry through this whole phase: **you describe a query in your language's objects, and the ORM compiles that description into parameterized SQL.** You never write `SELECT ... WHERE ... ORDER BY` yourself — you call methods, chain criteria, write a LINQ expression, or build a QuerySet. The ORM reads what you built and emits the SQL. That's the fourth job: **translating**.

You've already met the other three — mapping objects to tables, keeping an identity map and unit of work, loading related data. This one is the part most people *think* the ORM is, since it's the part you touch on every read path.

Look at the shape of it. You write something like this:

```text
q = repo.where(status = "active")
        .order_by(created_at desc)
        .limit(10)
results = q.all()
```

And the ORM turns it into roughly this:

```sql
SELECT * FROM customers WHERE status = ? ORDER BY created_at DESC LIMIT 10
```

*What just happened:* every method on your chain became a clause in the SQL. `.where(...)` became
`WHERE`, `.order_by(...)` became `ORDER BY`, `.limit(10)` became `LIMIT 10`, and `"active"` became a
bound parameter (`?`) instead of being pasted into the string. You described the *what*; the ORM produced
the *how*.

## The clause mapping

Once you see one ORM do this, you see all of them do it. The names differ, the pieces line up the same way:

| You build (objects) | ORM emits (SQL) |
|---|---|
| `.where(...)` / filter / criteria | `WHERE` |
| `.order_by(...)` | `ORDER BY` |
| `.limit(n)` / `.offset(n)` | `LIMIT` / `OFFSET` |
| traverse a relation in the query | `JOIN` |
| pick specific fields | a narrower `SELECT` (a *projection*) |

That last one is worth a name: a **projection** is when you ask for only some columns instead of the
whole row — a smaller `SELECT` list and less data over the wire.

The four ORMs you'll actually meet each have their own front-end for building this description, but all
compile to the same kind of SQL: **Hibernate** (HQL or the Criteria API), **SQLAlchemy** (the `select()`
construct), **GORM** (chained methods — `.Where(...).Order(...).Limit(...)`), **EF Core** (LINQ
expressions over the entity set). Different vocabulary, identical idea: an object-shaped description in,
parameterized SQL out. For the SQL clauses themselves, [Querying Basics: SELECT & WHERE](/guides/querying-basics-select-where)
is the ground floor.

## Building a query runs no SQL

> ⚠️ This is the one that trips people: **constructing a query does not touch the database.** Each `.where(...)` or `.order_by(...)` only adds to a *description*. The SQL fires only when you ask for results — when you enumerate the query, or call `.all()`, `.first()`, `.count()`, or iterate it in a loop.

This is called **deferred** (or **lazy**) **execution**, and it's why you can compose a query in steps:

```text
q = repo.all_customers()          # no SQL yet — just a base query

if filter_active:
    q = q.where(status = "active")  # still no SQL — refining the description

if newest_first:
    q = q.order_by(created_at desc) # still nothing has run

page = q.limit(20).all()           # NOW the SQL is built and sent, once
```

*What just happened:* the first three lines built up a query object across several `if` branches without
ever hitting the database. The single `.all()` at the end is the moment of truth — that's when the ORM
compiles everything you assembled into one `SELECT` and sends it. One round trip, not four.

The flip side is the gotcha: if a query object looks "done" but you never enumerate it, no query ran —
and if you accidentally enumerate it twice (iterate it, then call `.count()` on it), some ORMs run the
SQL twice. When in doubt whether something hit the database, look at the query log.

## Parameterization is free, and it's why you're safe

> 💡 Notice that `"active"` in the first example became `?` in the SQL, not `'active'` spliced into the string. That's **parameterization**, and every ORM does it automatically: your values travel to the database as **bound parameters**, separate from the SQL text.

This is the single biggest security win of using an ORM. Because the value is never concatenated into the query string, there's nothing for malicious input to "break out" into — an ORM query is **injection-safe by default**. Compare:

```sql
-- What a naive string-concat would build (DANGEROUS):
SELECT * FROM customers WHERE status = 'active'; DROP TABLE customers; --'

-- What the ORM actually sends (safe — the value is bound, not parsed as SQL):
SELECT * FROM customers WHERE status = ?
-- parameter 1: active'; DROP TABLE customers; --
```

*What just happened:* in the safe version, the entire hostile string — semicolons, `DROP TABLE`, and
all — arrives as the *value* of parameter 1. The database compares it against `status` as plain text; it
is never parsed as SQL, so it can't do anything. You get this for free by using `.where(...)` instead of
building strings yourself. The mechanics of `WHERE` and the injection trap it avoids are covered in
[Querying Basics: SELECT & WHERE](/guides/querying-basics-select-where).

## The leaky abstraction (read the SQL anyway)

So far this sounds like a clean wall between your objects and the SQL. It isn't, and pretending it is will eventually cost you a slow page or a baffling bug.

> ⚠️ The translation is a **leaky abstraction**: the same object-query can compile to *very different* SQL depending on small choices, and some expressions can't be translated at all.

Two ways it leaks:

1. **Same query, different SQL.** Whether you eager-load a relation, how you express a filter, whether
   you select whole entities or a projection — each can change the generated SQL from one tidy join into
   a pile of extra queries (the N+1 problem from [Phase 5](05-lazy-loading-and-n-plus-1.md)), or from an
   indexed lookup into a full scan. The object code looks innocent; the SQL tells the real story.
2. **Untranslatable expressions.** Put logic in your query that the ORM can't express in SQL — a call to
   one of your own language functions, an operation with no SQL equivalent — and it has two unhappy
   options: some ORMs (older EF, for instance) silently fall back to pulling rows into memory and
   filtering there (**client-side evaluation**), which can drag your whole table across the wire; others
   throw an error and make you rewrite it. "It compiled in my language" does not mean "it became
   efficient SQL."

The takeaway isn't "don't trust ORMs." It's that **the ORM does not free you from understanding SQL.** On
a cold path, fine — let it generate whatever. On a hot path, turn on the query log, read the SQL it
produced, and judge it like you'd judge SQL you wrote by hand. When a query is mysteriously slow,
[Why Is My Query Slow?](/guides/why-is-my-query-slow) is where you go next.

## Recap

- The ORM's fourth job is **translating**: you describe a query in objects (method chain, criteria, LINQ, QuerySet) and it compiles that to **parameterized SQL**.
- The pieces map cleanly — `.where` → `WHERE`, `.order_by` → `ORDER BY`, `.limit/.offset` → `LIMIT/OFFSET`, relation traversal → `JOIN`, picking fields → a narrower `SELECT` (a projection).
- **Building a query runs no SQL.** Execution is deferred until you enumerate (`.all()`, `.first()`, `.count()`, iteration) — which is exactly why you can compose a query across several steps.
- **Parameterization is automatic**, so ORM queries are **injection-safe by default**: values travel as bound parameters, never spliced into the SQL text.
- The translation is a **leaky abstraction**: the same object-query can produce wildly different SQL, and some expressions force client-side evaluation or an error. You still have to read the generated SQL on hot paths.

## Quick check

```quiz
[
  {
    "q": "When does an ORM actually send SQL to the database for a query you've been building with .where(...) and .order_by(...)?",
    "choices": ["As soon as you call .where(...)", "On each chained method call", "Only when you enumerate it — .all(), .first(), .count(), or iteration", "When the program exits"],
    "answer": 2,
    "explain": "Building a query just constructs a description (deferred/lazy execution). The SQL is compiled and sent only when you ask for results — which is why you can compose a query in steps."
  },
  {
    "q": "Why are ORM queries injection-safe by default?",
    "choices": ["The ORM scans values for the word DROP", "Values become bound parameters, sent separately from the SQL text rather than concatenated into it", "The database refuses any query with a semicolon", "The ORM runs every query inside a transaction"],
    "answer": 1,
    "explain": "Parameterization is automatic: a value like \"active\" becomes ? in the SQL and travels as a bound parameter, so hostile input arrives as data and is never parsed as SQL."
  },
  {
    "q": "What does it mean that ORM query translation is a 'leaky abstraction'?",
    "choices": ["The ORM leaks memory on large queries", "The same object-query can compile to very different SQL, and some expressions can't be translated — so you still must read the generated SQL", "ORMs always generate slower SQL than hand-written queries", "You can never use raw SQL once you adopt an ORM"],
    "answer": 1,
    "explain": "Small choices change the emitted SQL dramatically, and untranslatable expressions force client-side evaluation or an error. The ORM doesn't free you from understanding SQL on hot paths."
  }
]
```

[← Phase 5: Lazy Loading & the N+1 Trap](05-lazy-loading-and-n-plus-1.md) · [Guide overview](_guide.md) · [Phase 7: When Not to Use an ORM →](07-when-not-to-use-an-orm.md)
