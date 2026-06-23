---
title: "EF Core From Zero"
guide: "efcore-from-zero"
phase: 0
summary: "Learn Entity Framework Core, .NET's flagship ORM: the DbContext and connecting, entity models and migrations, create and read, LINQ querying, change tracking and SaveChanges, relationships, loading strategies and the N+1 trap, and transactions. The data layer most ASP.NET Core apps use — including where to drop to SQL."
tags: [efcore, csharp, dotnet, orm, database, linq, migrations]
category: frameworks
order: 28
group: "C#"
difficulty: intermediate
synonyms: ["learn ef core", "entity framework core tutorial", "dotnet orm", "dbcontext", "ef core migrations", "ef core linq query", "ef core relationships include", "ef core n+1", "ef core change tracking"]
updated: 2026-06-23
---

# EF Core From Zero

Entity Framework Core is the ORM most ASP.NET Core apps reach for. You define your tables as C# classes,
and EF Core writes the SQL for create, read, update, delete, relationships, and schema migrations. If
you've used an ORM elsewhere it'll feel familiar; if you haven't, it's a comfortable way into "describe
your data as types, let the library talk to the database." And because good engineers like to know what's
really happening, the most valuable habit you'll build here is watching the SQL EF Core generates — so you
can drop to raw SQL the moment the ORM gets in your way.

The mental model is two pieces plus a query language. A **`DbContext`** is your session with the database:
it holds **`DbSet<T>`** properties (one per table), **tracks the changes** you make to the objects it
hands you, and pushes them all to the database when you call **`SaveChanges`**. And you query with
**LINQ** — C#'s built-in query syntax — which EF Core translates into SQL. Hold "the DbContext is a
change-tracking session, DbSets are your tables, LINQ becomes SQL," and EF Core stops being magic and
becomes a tool you direct.

> 📝 This teaches the **library** — it assumes you know **C#** (classes, generics, LINQ basics,
> `async`/`await` — [C# From Zero](/guides/csharp-from-zero)) and basic **databases** (tables, keys,
> joins — [What a Database Is](/guides/what-a-database-is)). The ORM concepts transfer directly from
> [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero), [SQLAlchemy](/guides/sqlalchemy-from-zero), and
> [GORM](/guides/gorm-from-zero). It pairs with [ASP.NET Core](/guides/aspnet-core-from-zero) as its data
> layer. Examples use SQLite for zero setup and are shown with their output.

## How to read this

Read in order — it builds one schema (a **blog**: blogs, posts, tags) from a bare `DbContext` up to
relationships, the N+1 trap, and migrations. Phases carry difficulty badges.

## The phases

**Part 1 — Foundations (🟢 → 🟡)**
1. **[What EF Core Is & the DbContext](01-what-efcore-is.md)** 🟢 — the ORM idea, the `DbContext`/`DbSet` model, and seeing the SQL.
2. **[Entity Models & Migrations](02-models-and-migrations.md)** 🟡 — classes as tables, conventions, and `dotnet ef` migrations.
3. **[Create & Read](03-create-and-read.md)** 🟡 — `Add` + `SaveChanges`, `Find`/`First`/`Single`, and how records round-trip.

**Part 2 — Real queries (🟡 → 🔴)**
4. **[Querying with LINQ](04-querying-with-linq.md)** 🟡 — `Where`/`OrderBy`/`Select`, deferred execution, and `AsNoTracking`.
5. **[Change Tracking & SaveChanges](05-change-tracking.md)** 🔴 — the unit of work: how EF detects edits and batches the writes.
6. **[Relationships](06-relationships.md)** 🔴 — navigation properties, one-to-many, many-to-many, and the fluent API.
7. **[Loading Strategies & the N+1 Trap](07-loading-and-n-plus-1.md)** 🔴 — `Include` vs lazy loading, and the query explosion that bites everyone.

**Part 3 — Real projects (🔴 → 🟢)**
8. **[Transactions & Migrations in Production](08-transactions-and-migrations.md)** 🔴 — transactions, concurrency, and applying migrations safely.
9. **[EF Core in the Real World & Where to Go Next](09-where-to-go-next.md)** 🟢 — when to drop to SQL, EF Core vs Dapper, and what to build.

> The throughline: a **`DbContext` is a change-tracking session**, **`DbSet`s are your tables**, and
> **LINQ becomes SQL**. Watch that SQL and you stay in command of the database.

---

[Phase 1: What EF Core Is & the DbContext →](01-what-efcore-is.md)
