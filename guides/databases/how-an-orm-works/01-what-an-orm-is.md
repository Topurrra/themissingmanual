---
title: "What an ORM Is (the Mismatch)"
guide: "how-an-orm-works"
phase: 1
summary: "An ORM translates between your code's objects and a database's rows because the two don't line up - the object-relational impedance mismatch. Meet that mismatch and the four jobs every ORM does."
tags: [orm, database, concepts, impedance-mismatch, mapping]
difficulty: beginner
synonyms: ["what is an orm", "object relational mapping", "impedance mismatch", "orm explained", "why use an orm", "orm four jobs"]
updated: 2026-07-10
---

# What an ORM Is (the Mismatch)

Here's the mental model to carry through this whole guide: an **ORM is a translator** standing between two
worlds that don't speak the same language. On one side is your code, which thinks in **objects**. On the
other side is a relational database, which thinks in **rows and columns**. Those two ways of seeing data
don't line up, so something has to sit in the middle and translate, constantly, in both directions. That
translator is the ORM - whether it's Hibernate/JPA, SQLAlchemy, GORM, or Entity Framework Core, they're all
the same idea wearing different clothes.

> 📝 This phase assumes you know what a relational database is - tables, columns, rows, foreign keys. If
> any of that feels shaky, read [What a Database Is](/guides/what-a-database-is) first; everything below
> leans on it.

## The mismatch: objects vs rows

Your code thinks in **objects**. An object holds fields, points at *other* objects by reference, can be
part of an inheritance hierarchy, and has an **identity** (this `user` in memory is *the same* user as
that one over there). Objects naturally form a **graph** - a `user` that holds a list of `orders`, where
each `order` holds a reference back to its `user`.

A relational database thinks in none of those terms. It has **tables** with **columns**, **rows**
identified by keys, **foreign keys** that link one table to another by storing a number, and it answers
questions with **set-based queries** over those tables. There are no references, no inheritance, no
in-memory identity - there's a `user_id` column holding the value `5`.

This gap has a name:

📝 **The object-relational impedance mismatch.** Objects (references, inheritance, identity, graphs) and
relational tables (columns, foreign keys, sets) are two different shapes for the same data. They don't
naturally fit, so any time data crosses between them, *someone* has to translate. An ORM is that someone.

Here's the same data in both shapes. First, how your code sees it - a graph of objects pointing at each
other:

```text
user(id=5, name="Ada")
  └─ orders ──> [ order(id=101, product="Lamp", user ──> back to user 5),
                  order(id=102, product="Desk", user ──> back to user 5) ]
```

*What just happened:* the `user` object holds a real reference to a list of `order` objects, and each
`order` holds a reference *back* to the user - a web you can walk by following pointers,
`user.orders[0].product`, with no ID numbers in sight.

Now the same data as the database stores it - flat tables joined by a number:

```text
users                          orders
+----+-------+                 +-----+---------+----------+
| id | name  |                 | id  | product | user_id  |
+----+-------+                 +-----+---------+----------+
| 5  | Ada   |                 | 101 | Lamp    | 5        |
+----+-------+                 | 102 | Desk    | 5        |
                               +-----+---------+----------+
```

*What just happened:* the reference disappeared. The link between a user and their orders is now just the
number `5` repeated in the `user_id` column. To walk from a user to their orders, you don't follow a
pointer - you run a query that *matches* `users.id` against `orders.user_id`. Same data, completely
different shape. That distance between the two pictures is the mismatch, and closing it is the ORM's whole
reason to exist.

## What an ORM does: translate, so you stay in objects

To feel why the ORM earns its keep, look at what you'd do **without** one: write the SQL by hand, then
hand-copy each result row, column by column, into an object.

```text
rows = db.query("SELECT id, name FROM users WHERE id = 5")
row  = rows[0]

user = new User()
user.id   = row["id"]
user.name = row["name"]
// ...and you do this for every column, every table, every query, forever
```

*What just happened:* you did two jobs by hand - wrote raw SQL, then **mapped** the result row into a
`User` object field by field. It works, but it's tedious and fragile: add a column and you edit this
mapping code everywhere a user loads.

With an ORM, that round trip is automated. You ask for an object and you get an object:

```text
user = repo.find(5)
print(user.name)       // "Ada"
```

*What just happened:* the ORM generated the `SELECT`, ran it, and built the `User` object for you - the
entire manual dance above collapsed into one line. You asked in objects and got an object back. That's
the trade the ORM offers: it does the translating so you stay in the world your code already thinks in.

## 📝 The four jobs every ORM does

Every ORM - no matter the language - does the same four jobs. These are the spine of this guide; each later
phase takes one apart in detail. Hold them in your head and any ORM's behavior, including its surprises,
becomes predictable.

1. **Mapping** - connecting objects to tables: which class is which table, which field is which column, and
   how a reference becomes a foreign key. *(Phase 2: [Mapping Objects to Tables](02-mapping-objects-to-tables.md).)*
2. **Identity & tracking** - keeping exactly one object per row in memory, and remembering which objects
   came from where and what you changed. *(Phases 3–4: [The Identity Map & Unit of Work](03-identity-map-and-unit-of-work.md)
   and [Change Tracking & Dirty Checking](04-change-tracking.md).)*
3. **Loading** - deciding *when* to fetch related data: the moment you load the user, or later when you
   first touch their orders. *(Phase 5: [Lazy Loading & the N+1 Trap](05-lazy-loading-and-n-plus-1.md).)*
4. **Translating** - turning the queries you write in object terms into real, parameterized SQL the
   database can run. *(Phase 6: [Building the Query](06-building-the-query.md).)*

⚠️ Different ORMs use different words for these - "session," "context," "entity manager," "tracking,"
"eager vs lazy." Don't let the vocabulary fool you. Underneath, every one of them is doing these four
jobs. When a new ORM confuses you, ask "which of the four is this?" and the fog usually lifts.

## The trade-off, named plainly

An ORM buys you convenience: you write in objects, it handles the SQL and the mapping. But it isn't free
magic. It's a **layer of abstraction** sitting between you and your database - and like every abstraction,
it leaks. The ORM will sometimes generate SQL you didn't expect, fetch more (or less) than you wanted, or
turn one innocent line of code into a hundred queries. Understanding what it's doing underneath is exactly
why this guide exists, and why the last phase is [When Not to Use an ORM](07-when-not-to-use-an-orm.md).

To see these four jobs in a real library - actual code, not pseudocode - each of these is the same idea
made concrete: [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero) (Java),
[SQLAlchemy](/guides/sqlalchemy-from-zero) (Python), [GORM](/guides/gorm-from-zero) (Go), and
[EF Core](/guides/efcore-from-zero) (C#). For now, stay at the concept level - get the mismatch and the
four jobs solid here, and every one of those libraries will feel like review.

## Recap

1. **An ORM is a translator** between your code's objects and a relational database's rows and columns.
2. **The reason it exists is the impedance mismatch** - objects (references, inheritance, identity,
   graphs) and tables (columns, foreign keys, sets) are two different shapes for the same data.
3. **Without an ORM you do two jobs by hand:** write the SQL *and* map each result row into objects. An
   ORM automates that whole round trip so you stay in objects.
4. **Every ORM does four jobs:** mapping, identity & tracking, loading, and translating - the spine of
   this guide.
5. **The trade is convenience for a leaky layer** you still have to understand; that understanding is what
   the rest of this guide builds.

## Quick check

```quiz
[
  {
    "q": "What is the 'object-relational impedance mismatch'?",
    "choices": [
      "A bug where the database returns the wrong rows",
      "The fact that objects (references, inheritance, identity, graphs) and relational tables (columns, foreign keys, sets) are different shapes for the same data",
      "A slowdown caused by writing too much SQL by hand",
      "The difference between two database vendors' SQL dialects"
    ],
    "answer": 1,
    "explain": "Code thinks in objects and graphs; the database thinks in tables and foreign keys. They don't line up, so something must translate - and that something is the ORM."
  },
  {
    "q": "Without an ORM, what two jobs do you have to do by hand to load data into objects?",
    "choices": [
      "Open a connection and close a connection",
      "Write the SQL query and map each result row into objects field by field",
      "Define the table and define the index",
      "Validate the input and log the result"
    ],
    "answer": 1,
    "explain": "You write the raw SQL, then hand-copy each column of each row into your object. An ORM automates both halves of that round trip."
  },
  {
    "q": "Which set is the four jobs every ORM does?",
    "choices": [
      "Connecting, authenticating, encrypting, logging",
      "Indexing, caching, sharding, replicating",
      "Mapping, identity & tracking, loading, and translating",
      "Parsing, compiling, optimizing, executing"
    ],
    "answer": 2,
    "explain": "Mapping (objects ↔ tables), identity & tracking (one object per row + what changed), loading (when to fetch related data), and translating (queries to SQL). These four are the spine of every ORM."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Mapping Objects to Tables →](02-mapping-objects-to-tables.md)
