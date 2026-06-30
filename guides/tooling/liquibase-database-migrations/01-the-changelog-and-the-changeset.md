---
title: "The mental model: changelog and changeset"
guide: liquibase-database-migrations
phase: 1
summary: "Database migrations with Liquibase: changesets in SQL, YAML, or XML, a tracked changelog, and database-agnostic changes when you need to target more than one engine."
tags: [liquibase, database, migrations, changelog, changeset, schema, devops]
difficulty: intermediate
synonyms:
  - liquibase tutorial
  - liquibase changelog
  - liquibase changeset
  - liquibase vs flyway
  - liquibase rollback
  - database migrations liquibase
  - liquibase yaml changelog
updated: 2026-06-30
---

# The mental model: changelog and changeset

Here is the reality Liquibase is built for. Your schema is not a static thing you design once. It grows: a column here, an index there, a table you regret and drop three months later. Five developers make these edits on their own machines, then those edits have to land on staging, then production, in the right order, without anyone running the same `ALTER TABLE` twice. The question Liquibase answers is narrow and important: *which of these changes has this particular database already applied, and which still need to run?*

Everything else, the XML, the YAML, the abstraction, is in service of that one question.

## Two nouns: the changelog and the changeset

A **changeset** is one change. Add a table. Add a column. Create an index. It is the atomic unit, the thing that either has run against a database or has not.

A **changelog** is the ordered list of every changeset, top to bottom. It is a file you commit to source control. It is the master plan of how your schema came to be, from empty database to today.

That is the whole model. A changelog is a list; each item in the list is a changeset; Liquibase walks the list and runs the ones a given database has not seen yet.

```text
changelog (db/changelog.yaml)  ← committed to git, the master list
├── changeset 1   create table "author"
├── changeset 2   create table "book"
├── changeset 3   add column "book.isbn"
└── changeset 4   create index on "book.author_id"
```

*What just happened:* you are looking at the entire conceptual structure. Order matters because changeset 3 cannot add a column to a table that changeset 1 has not created yet. Liquibase runs them top to bottom and never reorders them.

## How a database remembers what it ran

When Liquibase runs against a database for the first time, it creates two tracking tables. You do not write these; Liquibase manages them.

- `DATABASECHANGELOG` — one row per changeset that has been applied. This is the ledger.
- `DATABASECHANGELOGLOCK` — a single-row lock so two Liquibase processes cannot run migrations against the same database at the same time.

When you run an update, Liquibase reads your changelog file, reads the `DATABASECHANGELOG` table, and computes the difference. Anything in the file but not in the table gets run. Anything already in the table gets skipped.

```text
$ liquibase status --verbose

3 changesets have not been applied to app@jdbc:postgresql://localhost/app
     db/changelog.yaml::3::you
     db/changelog.yaml::4::you
     db/changelog.yaml::5::you
```

*What just happened:* Liquibase compared the file to the ledger and told you exactly which changesets this database is missing. The triple `file::id::author` is how every changeset is identified, and you will see that identifier everywhere.

> A changeset's identity is the combination of its `id`, its `author`, and the changelog file path, not the SQL inside it. This is the single most important fact about Liquibase. Change the SQL of an already-applied changeset and Liquibase will *not* notice or re-run it; it only checks whether that `id` + `author` + file has a row in the ledger. We will come back to why this trips people up.

## A changeset is the same idea in three dialects

Liquibase lets you write changesets in SQL, YAML, XML, or JSON. They describe the same thing. Here is "create a `book` table" in three forms so the shape is concrete.

Formatted SQL, the form most people start with:

```sql
--liquibase formatted sql

--changeset alice:1
CREATE TABLE book (
    id     BIGINT PRIMARY KEY,
    title  VARCHAR(255) NOT NULL
);
```

*What just happened:* the comments are not decoration. The `--liquibase formatted sql` header tells Liquibase this `.sql` file is a changelog, and `--changeset alice:1` marks where one changeset begins, with author `alice` and id `1`. The SQL between markers is run verbatim against your database.

The same change in YAML:

```yaml
databaseChangeLog:
  - changeSet:
      id: 1
      author: alice
      changes:
        - createTable:
            tableName: book
            columns:
              - column: { name: id, type: BIGINT, constraints: { primaryKey: true } }
              - column: { name: title, type: VARCHAR(255), constraints: { nullable: false } }
```

*What just happened:* instead of raw SQL you described the change with `createTable`, one of Liquibase's built-in **change types**. Liquibase generates the correct `CREATE TABLE` for whatever database you point it at. This is the abstraction that separates Liquibase from a plain SQL migration tool, and Phase 3 is about when it is worth the extra ceremony.

## The contrast that explains Liquibase

If you have used Flyway (or any "numbered SQL files" tool), the difference is sharp and worth naming early, because it is the whole reason to choose one over the other.

| | Numbered-SQL tools (e.g. Flyway) | Liquibase |
|---|---|---|
| A migration is | a `.sql` file, raw SQL only | a changeset, in SQL **or** an abstract change type |
| Targets one DB engine | SQL is hand-written per engine | abstract change types generate per-engine SQL |
| Rollback | you write a separate "undo" script (or pay for it) | many changes auto-generate their rollback |
| Selective runs | run everything up to a version | tag changesets with **contexts** and **labels** |

*What just happened:* the table is the thesis of this whole guide. Liquibase trades simplicity (raw SQL files) for abstraction (change types, rollback, contexts). That trade is sometimes a gift and sometimes a tax. If you only ever ship to one database and you are comfortable in SQL, the tax can outweigh the gift, and that is a legitimate reason to reach for a simpler tool. The rest of this guide helps you feel where the line is.

For builders: the abstraction earns its keep most clearly when one codebase must run on more than one engine, say PostgreSQL in production and H2 in your tests. A `createTable` change type produces valid SQL for both from a single definition. Hold that example; Phase 3 returns to it.

## What you can ignore for now

The first time you open a Liquibase XML example you will see a `<databaseChangeLog>` element draped in `xmlns` and `xsi:schemaLocation` attributes. That is XML namespace boilerplate, the same for every project, and you can copy it once and never think about it again. It does not affect how migrations behave. Pick the format you find readable, SQL and YAML are the gentlest, and move on.

```quiz
[
  {
    "q": "What identifies a changeset to Liquibase?",
    "choices": [
      "The SQL or change content inside it",
      "Its id plus author plus changelog file path",
      "Its position number in the file",
      "A hash of the whole changelog"
    ],
    "answer": 1,
    "explain": "Identity is id + author + file path. Liquibase checks whether that identifier exists in DATABASECHANGELOG, not whether the content changed."
  },
  {
    "q": "What does the DATABASECHANGELOG table store?",
    "choices": [
      "A backup copy of every table you create",
      "One row per changeset that has been applied to that database",
      "The full text of your changelog file",
      "A lock preventing concurrent runs"
    ],
    "answer": 1,
    "explain": "It is the ledger: one row per applied changeset. The separate DATABASECHANGELOGLOCK table is what prevents concurrent runs."
  },
  {
    "q": "Compared with a numbered-SQL tool, what does Liquibase add?",
    "choices": [
      "Faster raw SQL execution",
      "Abstract change types, auto-rollback, and contexts/labels",
      "Automatic database backups",
      "A required GUI"
    ],
    "answer": 1,
    "explain": "Liquibase trades raw-SQL simplicity for abstraction: DB-agnostic change types, generated rollbacks, and context/label targeting."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday loop →](02-the-everyday-loop.md)
