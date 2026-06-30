---
title: "When the abstraction earns its keep"
guide: liquibase-database-migrations
phase: 3
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

# When the abstraction earns its keep

You now have the model and the loop. This last phase is about judgment, the features that justify Liquibase's extra weight, and the gotchas that turn a calm Tuesday into an incident. The honest framing: Liquibase's abstraction is a cost you pay on every changeset, and the skill is knowing when it buys you something worth more than the cost.

## Database-agnostic changes: the headline feature

The reason to write `createTable` instead of `CREATE TABLE` is portability. One changeset, many engines. The classic case is testing: production runs PostgreSQL, but your test suite spins up an in-memory H2 database for speed. With abstract change types, the *same* changelog builds the schema in both.

```yaml
  - changeSet:
      id: 20
      author: alice
      changes:
        - createTable:
            tableName: session
            columns:
              - column: { name: id, type: UUID, constraints: { primaryKey: true } }
              - column: { name: created_at, type: TIMESTAMP WITH TIME ZONE }
```

*What just happened:* Liquibase translates `UUID` and `TIMESTAMP WITH TIME ZONE` into whatever each target engine actually calls those types. You wrote the intent once; Liquibase emitted the correct dialect for PostgreSQL and for H2. If you had hand-written SQL, you would maintain two copies and pray they stayed in step.

Here is the flip side, and it is the whole decision in one sentence. If you only ever target **one** database, this translation buys you nothing and costs you readability, because a `createTable` block is harder to scan than the `CREATE TABLE` you already know. The abstraction earns its keep when you target more than one engine, or genuinely expect to. Otherwise, Liquibase still lets you write plain SQL changesets, and that is often the wiser choice.

> A useful default: write portable change types for structural changes (tables, columns, indexes) where the translation is reliable, and drop to raw SQL for anything engine-specific (a PostgreSQL `GIN` index, a stored procedure). Mixing is allowed and normal.

## Contexts and labels: shipping a subset

Sometimes you do not want every changeset to run everywhere. Seed data belongs in dev and test, not production. A changeset for a feature still behind a flag should wait. Liquibase gives you two filters.

- **Contexts** describe *where* a changeset should run (an environment-ish tag).
- **Labels** describe *what* a changeset is (a categorization you query at run time).

```yaml
  - changeSet:
      id: 30
      author: alice
      context: "dev,test"
      labels: "seed"
      changes:
        - insert:
            tableName: author
            columns:
              - column: { name: id, value: 1 }
              - column: { name: name, value: "Test Author" }
```

*What just happened:* this insert is tagged with context `dev,test` and label `seed`. Run `liquibase update --contexts=dev` on your laptop and it executes; run `liquibase update --contexts=prod` on production and Liquibase skips it. The seed data never reaches production, from a single shared changelog.

```text
$ liquibase update --contexts=prod --labels='!seed'
```

*What just happened:* you asked for the prod context and explicitly excluded anything labelled `seed`. Contexts and labels both support boolean expressions (`and`, `or`, `!`), which is how teams carve one changelog into per-environment, per-feature deploys without forking files.

## The gotcha that bites everyone: editing applied changesets

Recall the rule from Phase 1: a changeset's identity is `id` + `author` + file, not its content. That rule has teeth. When Liquibase applies a changeset, it also stores a **checksum** of the content. On the next run, it recomputes the checksum and compares.

```text
$ liquibase update

Validation Failed:
     1 changesets check sum
          db/changelog.yaml::10::alice was: 8:a1b2c3... but is now: 8:d4e5f6...
```

*What just happened:* you edited the SQL of changeset 10 *after* it had already run somewhere. The checksum no longer matches the one in the ledger, and Liquibase halts to protect you, the database has the old version of that change, but the file now says something different, and Liquibase refuses to guess which is correct. The fix is almost never to "make the error go away"; it is to add a *new* changeset that alters the schema the way you now want. Treat applied changesets as immutable history.

> If you genuinely need to change an applied changeset's text without changing the database (a typo in a comment, a reformat), `liquibase clear-checksums` makes Liquibase recompute checksums on the next run. Reach for it knowingly, not as a reflex to silence an error, the error usually means your file and your database have actually diverged.

## Preconditions: refuse to run on the wrong database

Liquibase can guard a changeset (or the whole changelog) with a **precondition**, a check that must hold or Liquibase stops. This is how you keep a migration from running against a database it was not meant for.

```yaml
  - changeSet:
      id: 40
      author: alice
      preConditions:
        - onFail: HALT
        - dbms:
            type: postgresql
      changes:
        - sql:
            sql: CREATE INDEX CONCURRENTLY idx_book_title ON book (title)
```

*What just happened:* `CREATE INDEX CONCURRENTLY` is PostgreSQL-specific, so the precondition refuses to run this changeset on any other engine, with `onFail: HALT` stopping the whole update rather than risking a broken index elsewhere. Preconditions turn "this assumes Postgres" from a comment into an enforced contract.

## Where the wheels come off

A short field guide to the failure modes that actually page people:

- **The lock that never released.** If a Liquibase run is killed mid-flight (a crashed CI job, a `kill -9`), the `DATABASECHANGELOGLOCK` row can stay set, and the next run hangs waiting for a lock no one holds. `liquibase release-locks` clears it. Verify no other run is actually live first.
- **Two changesets, same id and author.** Liquibase identifies by `id` + `author` + file. Reuse a pair within a file and behavior gets confusing fast. Keep ids unique per author per file; many teams use sequential numbers or a ticket id.
- **Long-running changes holding a transaction.** A big data backfill inside one changeset can lock tables for the duration. Split large backfills, or run them outside the migration path entirely.
- **`CONCURRENTLY` inside a transaction.** PostgreSQL forbids `CREATE INDEX CONCURRENTLY` in a transaction, but Liquibase wraps changesets in one by default. Set `runInTransaction: false` on that changeset.

In the wild: most Liquibase incidents are not Liquibase bugs, they are someone editing applied history or a lock left behind by a dead process. Both are prevented by discipline, append-only changelogs and clean shutdowns, far more than by any flag. If you came here from [how an ORM works](/guides/how-an-orm-works), note that ORM auto-migration tools share these same hazards; Liquibase is merely explicit about them.

```quiz
[
  {
    "q": "When does Liquibase's database-agnostic change types pay off most?",
    "choices": [
      "When you target a single database engine",
      "When you target more than one engine from one changelog",
      "When you only ever write raw SQL",
      "When you never roll back"
    ],
    "answer": 1,
    "explain": "Portable change types translate to each engine's dialect. With one target engine, they add ceremony without benefit."
  },
  {
    "q": "What is the difference between contexts and labels?",
    "choices": [
      "Contexts describe where a changeset runs; labels categorize what it is",
      "They are identical aliases",
      "Labels run first, contexts run second",
      "Contexts are for rollback only"
    ],
    "answer": 0,
    "explain": "Contexts are environment-ish (where it runs); labels are a categorization you filter on at run time. Both support boolean expressions."
  },
  {
    "q": "Liquibase reports a checksum mismatch on an applied changeset. What is the right fix?",
    "choices": [
      "Always run clear-checksums to silence it",
      "Delete the changeset from the file",
      "Add a new changeset for the change you actually want; treat applied ones as immutable",
      "Re-run update with --force"
    ],
    "answer": 2,
    "explain": "A mismatch usually means the file and the database diverged. Append a new changeset rather than rewriting applied history."
  }
]
```

[← Phase 2: The everyday loop](02-the-everyday-loop.md) | [Overview](_guide.md)
