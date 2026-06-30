---
title: "Alembic, From Zero"
guide: alembic-migrations
phase: 1
summary: "Schema migrations for Python and SQLAlchemy with Alembic: autogenerate from your models, review the diff, and apply with upgrade/downgrade."
tags: [alembic, sqlalchemy, migrations, python, database, schema]
difficulty: intermediate
synonyms:
  - alembic tutorial
  - sqlalchemy migrations
  - alembic autogenerate
  - alembic revision upgrade downgrade
  - how to use alembic
  - alembic multiple heads
updated: 2026-06-30
---

# The version table is the whole idea

You have two pictures of your schema and they keep drifting apart. One is in your Python code: the SQLAlchemy models, the `Column` definitions, the relationships. The other is the actual database on disk, with its real tables and types. When you write code you change the first picture. The second picture does not change until something runs SQL against it. Alembic is that something, and it does the job in a way you can trust because it never loses track of where the database currently is.

## The problem before the tool

Without a migration tool, you keep the two pictures in sync by hand. You add a column to a model, then you open a SQL client and type `ALTER TABLE users ADD COLUMN ...`. This works exactly once, on your machine. Your teammate pulls your code, their database does not have the column, and their app breaks. Production is a third copy with its own history. Now you are tracking, in your head, which `ALTER` statements have run on which database. That memory is the bug.

A migration is the fix: a single, ordered, version-controlled change to the schema, written down as a file. Each migration knows how to apply itself (`upgrade`) and how to undo itself (`downgrade`). The set of migrations, run in order, builds any database from empty to current. The companion guide [Database Migrations](/guides/database-migrations) makes this case in full and tool-neutral; here we make it concrete with Alembic.

## How Alembic knows where you are

Here is the one mechanism that makes everything else work. Alembic writes a tiny table into your database called `alembic_version`. It has one column and (usually) one row, holding the id of the last migration that was applied.

```sql
SELECT * FROM alembic_version;
-- version_num
-- -------------
-- 7c2e1a9b3f04
```

*What just happened:* the database told you, in its own words, exactly which migration it is sitting at. The id `7c2e1a9b3f04` matches a filename in your migrations folder. Alembic does not guess from the schema shape; it reads this row.

This is why migrations are safe to run on any copy. Alembic reads `alembic_version`, looks at your chain of migration files, and runs only the ones that come *after* the recorded id. Run `upgrade` on a fresh database and it runs all of them. Run it on production and it runs only the new ones. The version table is the source of truth for "where is this particular database."

## Each migration points at its parent

Migration files are not only an alphabetical list. Each one records its own id and the id of the migration it follows. That forms a chain (a linked list, if you like), and the most recent migration in a chain is called the **head**.

```python
# inside a migration file: alembic/versions/7c2e1a9b3f04_add_email.py
revision = "7c2e1a9b3f04"        # this migration's id
down_revision = "5982c6f1a2bd"   # the one it comes after
```

*What just happened:* the file declared its place in the chain. `revision` is "I am this version," `down_revision` is "I come right after that version." Alembic walks `down_revision` pointers to figure out the order, never the filenames or timestamps.

Because the order lives inside the files, two people can write migrations at the same time and Git will merge the files cleanly. The catch is that you can end up with two migrations both pointing at the same parent, which means two heads. That is a normal team situation, not an error, and Phase 3 shows you how to merge them.

## The pieces, named once

A few terms you will see constantly. Learn them now and the rest reads easily.

- **Revision** — one migration. A file in `alembic/versions/` with an `upgrade()` and a `downgrade()`.
- **`upgrade()`** — the function that moves the schema forward (create a table, add a column).
- **`downgrade()`** — the function that reverses that exact change. You write both, even when you doubt you'll downgrade.
- **Head** — the newest revision in a chain; the one you upgrade *to* by default.
- **`alembic_version`** — the table in your database holding the currently-applied revision id.
- **`env.py`** — Alembic's config script. It knows your database URL and your models' metadata, so autogenerate has both pictures to compare.

```text
alembic/
  env.py              # config: DB URL + your models' MetaData
  script.py.mako      # template for new migration files
  versions/
    5982c6f1a2bd_create_users.py
    7c2e1a9b3f04_add_email.py   <- head
alembic.ini           # the .ini Alembic reads first
```

*What just happened:* you saw the standard layout `alembic init` creates. The `versions/` folder is your migration history; `env.py` is where Alembic learns about your specific database and models. Everything in Phase 2 happens in this structure.

> The pairing with SQLAlchemy matters: Alembic does not invent its own model system. It reads the same `MetaData` your app already defines. That shared metadata is what makes autogenerate possible — and, as Phase 3 explains, what bounds its blind spots. If the ORM side feels fuzzy, [How an ORM works](/guides/how-an-orm-works) is the companion for that.

## In the wild

On a real team, the migrations folder becomes a readable history of the schema. You can open any old revision and see what the database looked like at that point, and `git blame` tells you who changed it and when. New engineers run one `upgrade` command and their local database matches everyone else's. That is the payoff: the schema stops being tribal knowledge in someone's head and becomes a reviewed, ordered, reversible record in the repo.

```quiz
[
  {
    "q": "How does Alembic know which migrations still need to run on a given database?",
    "choices": [
      "It compares the schema shape to your models and infers what's missing",
      "It reads the recorded revision id from the alembic_version table and runs anything after it",
      "It runs every migration every time and ignores duplicates",
      "It checks the file modification timestamps in the versions folder"
    ],
    "answer": 1,
    "explain": "Alembic reads the current revision id from the alembic_version table and runs only the migrations that follow it in the chain."
  },
  {
    "q": "What does down_revision inside a migration file record?",
    "choices": [
      "The id of the migration this one comes right after",
      "Instructions for how to downgrade this migration",
      "The database URL to downgrade against",
      "The timestamp when the migration was created"
    ],
    "answer": 0,
    "explain": "down_revision points at the parent revision, forming the ordered chain Alembic walks; the order lives in the files, not the filenames."
  },
  {
    "q": "Why is it safe to run the same upgrade command on a fresh local DB and on production?",
    "choices": [
      "Alembic always wipes and rebuilds the database first",
      "Each runs all migrations because Alembic is stateless",
      "Each DB records its own current revision, so Alembic runs only the migrations that DB is missing",
      "Production migrations are stored separately from local ones"
    ],
    "answer": 2,
    "explain": "Because alembic_version is per-database, Alembic applies only the revisions that particular database hasn't reached yet."
  }
]
```

[← Overview](_guide.md) · [Phase 2: The daily loop →](02-the-daily-loop.md)
