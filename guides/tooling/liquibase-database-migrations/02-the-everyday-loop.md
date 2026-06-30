---
title: "The everyday loop: write, update, status, rollback"
guide: liquibase-database-migrations
phase: 2
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

# The everyday loop: write, update, status, rollback

Phase 1 gave you the nouns. This phase is the verbs, the four-step rhythm you will repeat hundreds of times: add a changeset, preview it, apply it, and undo it when you got something wrong. Once this loop is in your hands, Liquibase stops being a configuration puzzle and becomes a tool you barely think about.

## Telling Liquibase where the database is

Before any command runs, Liquibase needs to know two things: which changelog file to read and which database to talk to. The usual home for that is a `liquibase.properties` file in your project root.

```text
changeLogFile=db/changelog.yaml
url=jdbc:postgresql://localhost:5432/app
username=app
password=secret
```

*What just happened:* you pointed Liquibase at your master changelog and gave it JDBC connection details. With this file present, you run commands with no extra flags. In real projects the password comes from an environment variable or a secrets manager, never committed, but the four keys above are the whole contract.

## Step one: write a changeset

You add new changesets to the *bottom* of the changelog. Never edit one that has already run; append a new one instead. (Phase 3 explains the bruise behind that rule.) Say you need an `email` column on your `author` table.

```yaml
  - changeSet:
      id: 10
      author: alice
      changes:
        - addColumn:
            tableName: author
            columns:
              - column:
                  name: email
                  type: VARCHAR(320)
```

*What just happened:* one new changeset, appended after the existing ones. It has a fresh `id`, so Liquibase treats it as something this database has not seen. The old changesets are untouched, exactly as they should be.

## Step two: preview before you touch anything

The single most reassuring command in Liquibase is `update-sql`. It shows you the exact SQL it *would* run, without running it.

```text
$ liquibase update-sql

-- *********************************************************************
-- Update Database Script
-- *********************************************************************
-- Lock Database
UPDATE databasechangeloglock SET locked = TRUE ...;
-- Changeset db/changelog.yaml::10::alice
ALTER TABLE author ADD email VARCHAR(320);
INSERT INTO databasechangelog (id, author, filename, ...) VALUES ('10', 'alice', ...);
-- Release Database Lock
UPDATE databasechangeloglock SET locked = FALSE ...;
```

*What just happened:* Liquibase generated the actual `ALTER TABLE` plus the bookkeeping it does around every run, take the lock, apply the change, record it in the ledger, release the lock. Reading this output before a production deploy is the difference between confidence and a 2am surprise. Make it a habit.

## Step three: apply it

When the preview looks right, run the real thing.

```text
$ liquibase update

Running Changeset: db/changelog.yaml::10::alice
ALTER TABLE author ADD email VARCHAR(320)

Liquibase command 'update' was executed successfully.
```

*What just happened:* the changeset ran and a new row landed in `DATABASECHANGELOG`. Run `liquibase update` again right now and nothing happens, the ledger already has changeset 10, so there is nothing new to apply. That idempotence is the whole point: the same command is safe to run on every database in every environment, and each only gets what it is missing.

## Step four: rolling back

This is where Liquibase pulls ahead of raw-SQL tools. Many change types know how to undo themselves. An `addColumn` rollback is a `DROP COLUMN`; a `createTable` rollback is a `DROP TABLE`. You did not write that undo logic, Liquibase derived it.

```text
$ liquibase rollback-count 1

Rolling Back Changeset: db/changelog.yaml::10::alice
ALTER TABLE author DROP COLUMN email

Liquibase command 'rollbackCount' was executed successfully.
```

*What just happened:* Liquibase undid the most recent changeset and deleted its row from the ledger, so `status` now reports it as pending again. You can also roll back to a tag (`rollback <tagname>`) or by date. The ledger and the rollback stay in sync automatically.

The catch: auto-rollback only works for changes Liquibase can reverse. Raw SQL it cannot. If a changeset is hand-written SQL, or does something inherently lossy like dropping a column full of data, you must supply the undo yourself with a `rollback` block.

```yaml
  - changeSet:
      id: 11
      author: alice
      changes:
        - sql:
            sql: UPDATE author SET email = LOWER(email)
      rollback:
        - sql:
            sql: SELECT 1
```

*What just happened:* because raw SQL has no automatic inverse, you declared the rollback explicitly. Here the update is not reversible (the old casing is gone), so the rollback is a deliberate no-op, `SELECT 1` does nothing, documenting that this change cannot be undone. Being honest about that in the changelog beats a rollback that silently corrupts data.

> Test your rollbacks. A rollback you have never run is a guess, not a safety net. Many teams run `update` then `rollback` in CI against a throwaway database so every changeset is proven reversible (or proven irreversible on purpose) before it reaches production.

## The whole loop at a glance

```text
write changeset  →  liquibase update-sql   (preview, runs nothing)
                 →  liquibase update        (apply, records in ledger)
                 →  liquibase status        (confirm: 0 pending)
   regret it?    →  liquibase rollback-count 1
```

*What just happened:* that is the entire daily rhythm. Four commands cover almost everything you will do. The connection points to a [migrations workflow](/guides/database-migrations) in general; Liquibase's contribution is making the preview and the rollback first-class instead of files you maintain by hand.

```quiz
[
  {
    "q": "What does `liquibase update-sql` do?",
    "choices": [
      "Applies all pending changesets",
      "Prints the SQL it would run without executing it",
      "Rolls back the last changeset",
      "Updates the Liquibase binary"
    ],
    "answer": 1,
    "explain": "update-sql is a dry run: it generates and prints the exact SQL (and ledger updates) without touching the database."
  },
  {
    "q": "You run `liquibase update`, then run it again immediately. What happens the second time?",
    "choices": [
      "It re-applies every changeset",
      "It errors because the schema already changed",
      "Nothing new runs; the ledger already has those changesets",
      "It rolls everything back"
    ],
    "answer": 2,
    "explain": "update is idempotent. Applied changesets are in DATABASECHANGELOG, so a second run finds nothing pending."
  },
  {
    "q": "For a changeset written as raw SQL, how does rollback work?",
    "choices": [
      "Liquibase auto-generates the inverse SQL",
      "Rollback is impossible for any SQL changeset",
      "You must supply a rollback block yourself",
      "It silently skips the rollback"
    ],
    "answer": 2,
    "explain": "Auto-rollback only works for reversible change types. Raw SQL has no known inverse, so you declare the rollback explicitly."
  }
]
```

[← Phase 1: The mental model](01-the-changelog-and-the-changeset.md) | [Overview](_guide.md) | [Phase 3: When abstraction earns its keep →](03-when-abstraction-earns-its-keep.md)
