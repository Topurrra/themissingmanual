---
title: "A Schema Is Code"
guide: flyway-database-migrations
phase: 1
summary: "Version-control your database schema with Flyway: numbered, immutable migration files applied in order, so every environment ends up with the exact same schema."
tags: [flyway, migrations, database, schema, sql, devops]
difficulty: intermediate
synonyms:
  - flyway tutorial
  - database schema versioning
  - sql migrations flyway
  - flyway V1 V2 naming
  - flyway history table
  - what is flyway
updated: 2026-06-30
---

# A Schema Is Code

Here's the thing nobody tells you when you start: your database schema is one of the most important pieces of code you own, and for years you probably treated it like it wasn't code at all. Your application lives in Git. Every line is reviewed, versioned, reproducible. Meanwhile the shape of your data — the tables, columns, indexes, constraints that your whole app depends on — got changed by people typing `ALTER TABLE` into a console and hoping.

That asymmetry is where the pain comes from. Two developers add a column with slightly different types. Staging has an index prod doesn't. A "quick fix" run by hand in production never makes it into the script other people run. The schema drifts, environment by environment, until "works on my machine" becomes a daily fact of life.

Flyway's entire reason to exist is to close that gap. It says: a change to your schema is a change to your code, so treat it like one. Put it in a file. Give it a version. Commit it. Apply it the same way everywhere. That's the whole idea, and everything else is mechanics.

## The mental model: an ordered list of changes

Don't think of Flyway as a tool that "manages your database." Think of it as something much simpler: a list of changes, in order, that it walks down.

Each change is a plain SQL file with a name like `V1__create_users.sql`. The number is the version. Flyway sorts these files by version, then applies them one at a time, top to bottom. Your database isn't a thing you describe — it's the *result* of replaying every change in sequence, exactly like rebuilding state by replaying a log.

```text
db/migration/
├── V1__create_users.sql      -- runs first
├── V2__add_email_to_users.sql -- runs second
└── V3__create_orders.sql      -- runs third
```

*What just happened:* a brand-new empty database, pointed at this folder, becomes a database with a `users` table (with an email column) and an `orders` table — because Flyway ran V1, then V2, then V3, in that order. Any empty database pointed at the same folder ends up identical. That convergence is the entire promise.

The filename format matters because Flyway parses it. A versioned migration is `V`, then the version, then two underscores, then a description, then `.sql`:

```text
V2__add_email_to_users.sql
│ │  │
│ │  └─ description (underscores show as spaces in logs)
│ └──── two underscores — the separator (one won't work)
└────── prefix V = "versioned migration", version 2
```

*What just happened:* that double underscore is a real rule, not a style choice. `V2_add_email.sql` with one underscore is not a valid migration name and Flyway will skip or reject it. Versions sort numerically and can have dots (`V2.1`, `V2.10`), so order is unambiguous.

## The history table: how Flyway remembers

The piece that makes all of this trustworthy is a table Flyway creates inside *your* database the first time it runs, called `flyway_schema_history`. This is its memory. Every migration that successfully applies gets a row.

```text
+---------+-------------+----------------------+---------+--------------------+---------+
| version | description | script               | success | installed_on       | checksum|
+---------+-------------+----------------------+---------+--------------------+---------+
| 1       | create users| V1__create_users.sql | true    | 2026-06-28 09:14   | -8821…  |
| 2       | add email   | V2__add_email...sql  | true    | 2026-06-28 09:14   | 1190…   |
+---------+-------------+----------------------+---------+--------------------+---------+
```

*What just happened:* before running anything, Flyway reads this table to learn what's already been applied. It sees versions 1 and 2 are done, so on the next run it only considers V3 and up. The history table is why Flyway never runs the same migration twice, and why it's safe to run on every deploy — it figures out what's left, applies only that, and stops.

That `checksum` column is doing quiet, important work, which leads us to the rules.

## The three rules

Flyway is opinionated, and its opinions are the source of its reliability. There are really three.

**Rule one: migrations run in order.** Versions are applied lowest to highest. You don't get to reorder history; the sequence that built your prod database is the sequence everyone replays.

**Rule two: applied migrations are immutable.** Once V2 has run somewhere, you must never edit `V2__...sql`. This is what the checksum enforces — Flyway hashes each migration file and stores it. If you change an already-applied file, the checksum no longer matches what's recorded, and Flyway stops with a validation error before touching anything.

```text
ERROR: Validate failed: Migrations have failed validation
Migration checksum mismatch for migration version 2
-> Applied to database : 1190837465
-> Resolved locally    : -2003918277
```

*What just happened:* someone edited a migration that had already run on this database. Flyway refused to continue, because it can't know whether the database reflects the old file or the new one. The fix is never to silently force it — it's to make your change a *new* migration (V4) instead of mutating an old one. This error is Flyway protecting you from drift, not getting in your way.

**Rule three: a migration that hasn't run yet is fair game.** Until V4 has been applied anywhere, you can edit it freely — it's still a draft on your branch. The immutability rule only kicks in once a migration has actually run against a database.

> Internalize this one line and most of Flyway makes sense: **the past is read-only, the future is yours to write.** You change the schema by adding the next file, never by rewriting an old one.

## Why this beats hand-run scripts

You could, in principle, keep a folder of SQL files and a discipline of running them carefully by hand. People do. It falls apart because humans forget which ones ran, run them out of order, run one twice, or skip the one that was added while they were on vacation. The history table and the three rules take all of that off your plate — Flyway is the discipline, enforced.

> **In the wild:** Flyway is effectively the default schema-migration tool in the JVM ecosystem. Spring Boot detects it on the classpath and runs your migrations automatically at application startup, so the app and its schema deploy as one unit. But Flyway is also a standalone command-line tool that works with plain SQL and any supported database — you do not need Java or Spring to use it, and this guide uses it that way.

If you want the broader picture of why schema migrations exist as a discipline across all tools and languages, see [/guides/database-migrations]. If you're coming at this from an ORM and wondering how Flyway relates, [/guides/how-an-orm-works] is worth a look — many ORMs generate migrations that a tool like Flyway then applies.

```quiz
[
  {
    "q": "What does Flyway use to know which migrations have already been applied to a given database?",
    "choices": ["The filenames on disk alone", "A row per migration in the flyway_schema_history table inside that database", "A lockfile committed to your repo", "Environment variables set at deploy time"],
    "answer": 1,
    "explain": "Flyway records each successful migration as a row in flyway_schema_history inside the target database, then reads that table to decide what still needs to run."
  },
  {
    "q": "You already ran V2 in production. You now need a different column type. What do you do?",
    "choices": ["Edit V2 and re-run it", "Delete the V2 history row and re-run V2", "Write a new migration, V3, that alters the column", "Force a checksum repair and edit V2"],
    "answer": 2,
    "explain": "Applied migrations are immutable. The past is read-only; you change the schema by adding the next versioned migration, not by editing an old one."
  },
  {
    "q": "Which filename is a valid Flyway versioned migration?",
    "choices": ["V3_add_index.sql", "v3-add-index.sql", "V3__add_index.sql", "migration_3.sql"],
    "answer": 2,
    "explain": "A versioned migration is V, the version, two underscores, a description, then .sql. A single underscore or a different prefix is not valid."
  }
]
```

[← Overview](_guide.md) · [Phase 2: The Everyday Loop →](02-the-everyday-loop.md)
