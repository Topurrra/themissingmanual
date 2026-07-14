---
title: "GORM From Zero"
guide: "gorm-from-zero"
phase: 0
summary: "Learn Go's most popular ORM: connecting and the model, auto-migration, create and read, querying, update and delete with soft deletes, associations, preloading and the N+1 trap, transactions and hooks and real migrations. The data layer most Go web services use, made plain - including where to drop back to SQL."
tags: [gorm, go, golang, orm, database, sql, associations, migrations]
category: frameworks
order: 19
group: "Go"
difficulty: intermediate
synonyms: ["learn gorm", "gorm tutorial", "go gorm orm", "gorm models migrations", "gorm associations preload", "gorm n+1", "gorm transactions hooks", "gorm soft delete", "golang database orm"]
updated: 2026-06-23
---

# GORM From Zero

Most Go web services that talk to a SQL database talk to it through GORM. It's the de-facto ORM for Go:
you define your tables as plain structs, and GORM handles the SQL for create, read, update, delete,
relationships, and migrations. If you've used an ORM in another language, GORM will feel familiar; if you
haven't, it's the gentlest way into "describe your data as Go types, let the library write the SQL." And
because Go developers value knowing what's really happening, the most useful thing about learning GORM is
seeing exactly which SQL each call produces - so you can drop to raw SQL the moment the ORM gets in your way.

The mental model is three pieces. A **model** is a Go struct that maps to a table (often embedding
`gorm.Model` for `ID`/timestamps/soft-delete). The **`*gorm.DB`** value is your handle to the database
and the thing you chain methods on (`db.Where(...).Order(...).Find(...)`). And a **session/chain** is how
those calls build one query. Hold "struct = table, `*gorm.DB` = the query builder you chain," and GORM
stops being magic and becomes a SQL generator you can reason about.

> 📝 This teaches the **library** - it assumes you know **Go** (structs, methods, pointers, slices - 
> [Go From Zero](/guides/go-from-zero)) and basic **databases** (tables, keys, joins - 
> [What a Database Is](/guides/what-a-database-is)). The ORM concepts transfer directly from
> [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero) and [SQLAlchemy](/guides/sqlalchemy-from-zero).
> GORM needs a real database (the examples use SQLite for zero setup) and runs as a Go program, so
> examples are shown with their output.

## How to read this

Read in order - it builds one schema (a small **blog**: users, posts, comments) from a bare connection up
to associations, the N+1 trap, and migrations. Phases carry difficulty badges.

## The phases

**Part 1 - Foundations (🟢 → 🟡)**
1. **[What GORM Is & Connecting](01-what-gorm-is.md)** 🟢 - the ORM idea, opening a `*gorm.DB`, and seeing the SQL it logs.
2. **[Models & Auto-Migration](02-models-and-migration.md)** 🟡 - structs as tables, tags, `gorm.Model`, and `AutoMigrate`.
3. **[Create & Read](03-create-and-read.md)** 🟡 - `Create`, `First`/`Find`/`Take`, and how records round-trip.

**Part 2 - Real queries (🟡 → 🔴)**
4. **[Querying](04-querying.md)** 🟡 - `Where`, `Order`, `Limit`/`Offset`, `Select`, and reusable scopes.
5. **[Update & Delete](05-update-and-delete.md)** 🟡 - `Save`/`Updates`, the zero-value trap, and soft vs hard deletes.
6. **[Associations](06-associations.md)** 🔴 - has-one, has-many, belongs-to, and many-to-many with join tables.
7. **[Preloading & the N+1 Trap](07-preloading-and-n-plus-1.md)** 🔴 - lazy vs `Preload`/`Joins`, and the query explosion that bites everyone.

**Part 3 - Real projects (🔴 → 🟢)**
8. **[Transactions, Hooks & Migrations](08-transactions-hooks-migrations.md)** 🔴 - `Transaction`, lifecycle hooks, and why `AutoMigrate` isn't enough in production.
9. **[GORM in the Real World & Where to Go Next](09-where-to-go-next.md)** 🟢 - when to drop to raw SQL, GORM vs sqlc/sqlx, and what to build.

> The throughline: a **struct is a table**, and **`*gorm.DB` is a query you chain**. Keep an eye on the
> SQL it generates and you stay in command of your database instead of fighting the ORM.

---

[Phase 1: What GORM Is & Connecting →](01-what-gorm-is.md)
