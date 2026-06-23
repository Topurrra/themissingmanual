---
title: "How an ORM Works"
guide: "how-an-orm-works"
phase: 0
summary: "Understand the pattern under every ORM — Hibernate, SQLAlchemy, GORM, EF Core — instead of memorizing one library's API: the object-relational mismatch, mapping objects to tables, the identity map and unit of work, change tracking and dirty checking, lazy loading and the N+1 trap, how a query builder becomes SQL, and when not to use an ORM at all. Language-agnostic, concept-first."
tags: [orm, database, sql, change-tracking, identity-map, n-plus-1, concepts]
category: databases
order: 10
difficulty: intermediate
synonyms: ["how an orm works", "what is an orm", "object relational mapping", "orm under the hood", "identity map unit of work", "orm change tracking", "orm n+1 problem", "orm lazy loading", "when not to use an orm"]
updated: 2026-06-23
---

# How an ORM Works

You've probably used an ORM — Hibernate in Java, SQLAlchemy in Python, GORM in Go, Entity Framework Core in
C# — or you will soon. Each has its own API, but they're all solving the *same* problem the same way, and
once you understand the underlying pattern, every one of them reads as "oh, that's the same idea, named
differently." That's the goal here: not a tour of one library, but the **concepts every ORM shares**, so the
next ORM you meet is mostly vocabulary.

The core problem is the **object-relational impedance mismatch**: your code thinks in objects with references
to other objects, but a relational database thinks in rows, columns, and foreign keys. An **Object-Relational
Mapper** is the layer that translates between those two worlds — turning objects into rows and back, tracking
what you changed, and generating the SQL. The mental model to hold is that an ORM is doing four jobs:
**mapping** (objects ↔ tables), **identity & tracking** (remembering which objects came from where and what
changed), **loading** (deciding when to fetch related data), and **translating** (turning your queries into
SQL). Hold those four jobs and any ORM's behavior — including its surprises — becomes predictable.

> 📝 This is a **concept** guide, deliberately language-agnostic — code samples are short pseudocode, and
> each idea links to where you've seen it concretely: [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero),
> [SQLAlchemy](/guides/sqlalchemy-from-zero), [GORM](/guides/gorm-from-zero), and
> [EF Core](/guides/efcore-from-zero). It assumes basic **databases** — tables, keys, joins, transactions
> ([What a Database Is](/guides/what-a-database-is), [Relationships & Keys](/guides/relationships-and-keys)).

## How to read this

Read in order — each phase is one of the jobs an ORM does, building from the mismatch up to the trade-offs.
Phases carry difficulty badges.

## The phases

1. **[What an ORM Is (the Mismatch)](01-what-an-orm-is.md)** 🟢 — objects vs rows, and the four jobs an ORM does.
2. **[Mapping Objects to Tables](02-mapping-objects-to-tables.md)** 🟡 — classes↔tables, fields↔columns, references↔foreign keys.
3. **[The Identity Map & Unit of Work](03-identity-map-and-unit-of-work.md)** 🔴 — one object per row, and batching changes into one commit.
4. **[Change Tracking & Dirty Checking](04-change-tracking.md)** 🔴 — how the ORM knows what to UPDATE without you telling it.
5. **[Lazy Loading & the N+1 Trap](05-lazy-loading-and-n-plus-1.md)** 🔴 — when related data loads, and the query explosion every ORM can cause.
6. **[Building the Query (to SQL)](06-building-the-query.md)** 🟡 — how a query builder / object query becomes parameterized SQL.
7. **[When Not to Use an ORM](07-when-not-to-use-an-orm.md)** 🟢 — the honest limits, raw SQL, and where to go next.

> The throughline: an ORM **maps** objects to rows, keeps an **identity map** + **unit of work** to track
> them, **loads** related data on some strategy, and **translates** your queries to SQL. Four jobs — learn
> them once, recognize them everywhere.

---

[Phase 1: What an ORM Is (the Mismatch) →](01-what-an-orm-is.md)
