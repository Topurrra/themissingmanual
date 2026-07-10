---
title: "Migrations with Alembic"
guide: "sqlalchemy-from-zero"
phase: 8
summary: "Why create_all can't evolve a live schema, and how Alembic gives you version-controlled migrations: init, autogenerate, review, upgrade, downgrade - the safe loop for changing tables that already hold data."
tags: [sqlalchemy, alembic, migrations, schema, autogenerate, versioning, database]
difficulty: intermediate
synonyms: ["alembic migrations tutorial", "sqlalchemy schema migrations", "alembic autogenerate", "alembic upgrade downgrade", "sqlalchemy create_all not enough", "alembic revision", "database schema versioning python"]
updated: 2026-07-10
---

# Migrations with Alembic

**Your models define what the schema *should* be; Alembic figures out how to *get there* from
whatever the database currently is - one small, reviewable, reversible step at a time.** Your
`Author`, `Book`, and `Tag` classes are the destination. The live database is the starting point. A
migration is the recorded set of turns that drives from one to the other. And because every turn is
written down and applied in order, every environment - your laptop, a teammate's, staging,
production - drives the exact same route and ends up at the exact same place.

Up to now you've been leaning on `create_all`. That was the right tool for getting off the ground.
This phase is about the moment it stops being enough - which arrives the first time you change a
model whose table already exists.

## Why `create_all` isn't enough

⚠️ Cast your mind back to [Phase 3](03-defining-models.md). `Base.metadata.create_all(engine)`
walks your models and issues a `CREATE TABLE` for each one - **but only for tables that don't
already exist.** It creates; it never alters. That's not a bug, it's the whole design. And it's
exactly what leaves you stranded once your schema starts to evolve.

Watch the trap spring. You ship `Book` with a `title` and a `year`. Weeks later you decide every
book needs a `subtitle`, so you add the column to the model and call `create_all` again:

```python
class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    year: Mapped[int | None]
    subtitle: Mapped[str | None]   # newly added

Base.metadata.create_all(engine)   # run again, hoping it adds the column
```

*What just happened:* nothing - and that's the problem. `create_all` sees that a `books` table
already exists, shrugs, and moves on. It does **not** compare your new model to the existing table.
It does **not** add the `subtitle` column. Your code now expects a column the database doesn't have,
and the next query that touches `subtitle` blows up with an "no such column" error. `create_all`
only knows how to go from *nothing* to *something*; it has no idea how to go from *something* to
*something slightly different*.

And even where it *could* help, you wouldn't want it to. ⚠️ Running schema-building code by hand
against a live production database - no record of what ran, no way to undo it, no ordering
guarantees across environments - is precisely the held-breath dread that the
[database migrations guide](/guides/database-migrations) is written to cure. Real schemas evolve:
columns get added, types get widened, tables get renamed. You need a tool that treats each of those
changes as a versioned, ordered, reversible unit. That tool is Alembic.

💡 Reframe it once and it sticks: `create_all` is the **zero-to-one** tool (build the schema the
first time, great for a fresh dev database). Alembic is the **one-to-many** tool (evolve a schema
that already exists and may already hold data you can't afford to lose).

## What Alembic is

📝 **Alembic** is SQLAlchemy's migration tool - written by Mike Bayer, the same author as
SQLAlchemy itself, so it understands your models natively. It gives you exactly the thing
`create_all` lacks: a sequence of **migration scripts**, each one a small Python file with an
`upgrade()` function (apply this change) and a `downgrade()` function (undo it). Alembic records
which scripts have run in a dedicated version table inside your database, and applies any
outstanding ones **in order**.

💡 The cleanest way to think about it: **Alembic is version control for your schema.** Each
migration is a commit. The version table is the equivalent of "which commit am I currently on."
`upgrade` moves you forward through history; `downgrade` rewinds. Just as Git lets a whole team
converge on the same source code, Alembic lets every environment converge on the same schema.

You wire it up once, per project, with `alembic init`:

```bash
alembic init alembic
```

*What just happened:* Alembic scaffolds a folder (here called `alembic/`) plus an `alembic.ini`
config file at your project root. Inside the folder are an `env.py` (the script Alembic runs on
every migration), a `script.py.mako` template, and an empty `versions/` directory where your
migration scripts will live. Nothing has touched your database yet - this is pure setup.

The one edit that makes autogenerate work is pointing `env.py` at your models' metadata. Open
`alembic/env.py` and set the `target_metadata`:

```python
# alembic/env.py
from myapp.models import Base   # wherever your DeclarativeBase lives

target_metadata = Base.metadata
```

*What just happened:* you handed Alembic the same `Base.metadata` catalog that `create_all` reads -
the registry of every table your `Author`, `Book`, and `Tag` models describe. Now Alembic can
compare *that* (what your models say) against the *actual* database (what currently exists) and
work out the difference. That comparison is the foundation of the next section.

## Autogenerate: let Alembic write the migration

📝 Here's the feature that makes Alembic a joy rather than a chore. `alembic revision --autogenerate`
**diffs your models against the current database** and writes a migration script that closes the
gap - you don't hand-write the `CREATE TABLE` or `ADD COLUMN` yourself. Give the database a fresh
start and create the books table:

```bash
alembic revision --autogenerate -m "add books table"
```

*What just happened:* Alembic connected to the database, read its current state (no `books` table
yet), compared it to `Base.metadata` (which has a `Book` model), saw the difference, and wrote a new
file into `alembic/versions/`. The `-m` message becomes part of the filename and a human-readable
label, exactly like a commit message. The script is generated but **not yet applied** - it's just
sitting there waiting for you to review and run it.

Open the generated file and you'll see something like this:

```python
"""add books table

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-06-23 10:14:02.118
"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = None


def upgrade() -> None:
    op.create_table(
        "books",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("books")
```

*What just happened:* read it top to bottom. The header carries this migration's own `revision` id
and its `down_revision` (the one it builds on - `None` here because it's the first). `upgrade()` is
the change applied going forward: `op.create_table(...)` builds `books`, with one `sa.Column` per
field of your `Book` model - and notice it faithfully translated your annotations (`Mapped[str]` →
`nullable=False`, `Mapped[int | None]` → `nullable=True`), the same mapping you saw produce SQL in
Phase 3. `downgrade()` is the exact inverse: `op.drop_table("books")` undoes it. Every migration
carries both directions, which is what makes rollbacks possible.

Later, when you add that `subtitle` column to the model and autogenerate again, you'd get a much
smaller script - just the delta:

```python
def upgrade() -> None:
    op.add_column("books", sa.Column("subtitle", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("books", "subtitle")
```

*What just happened:* this is the difference that `create_all` could never produce. Alembic saw the
`books` table already existed, diffed it against the model, found one missing column, and emitted a
single `op.add_column` (with the matching `op.drop_column` to reverse it). Small, surgical, and
reversible - one step on the route.

⚠️ **Always read the autogenerated script before you trust it.** Autogenerate is a brilliant first
draft, not a final answer. It reliably catches added/dropped tables and columns and many type
changes, but it has real blind spots: a **column rename looks like a drop-plus-add** to the differ
(it would delete the old column - and its data - and create an empty new one, which is almost never
what you want); some **type changes and constraint tweaks** it misses or gets subtly wrong; and it
can't see **data migrations** at all. Treat the generated file as a pull request from a fast but
literal-minded colleague: review every line, and edit it before you apply it.

## Applying and reverting

Once you've reviewed the script, you apply it. `alembic upgrade head` runs every migration that
hasn't run yet, in order, up to the latest:

```bash
alembic upgrade head
```

```console
INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Running upgrade  -> a1b2c3d4e5f6, add books table
```

*What just happened:* "head" means the newest revision, the same way it does in Git. Alembic checked
its version table, saw that revision `a1b2c3d4e5f6` hadn't been applied, ran that migration's
`upgrade()`, and stamped the version table to record it. The `books` table now exists. Run
`upgrade head` again and it does nothing - there's nothing newer than head, so it's safe to repeat.

Made a mistake, or want to back out the last change? `downgrade -1` rewinds one step by running that
migration's `downgrade()`:

```bash
alembic downgrade -1
```

*What just happened:* Alembic looked at the current revision, ran its `downgrade()` function
(here, `op.drop_table("books")`), and moved the version pointer back one. This is why both functions
matter: a migration is only as reversible as its `downgrade()` is honest. `-1` means "one step
back"; you can also downgrade to a specific revision id, or all the way to `base` (the very
beginning).

Two commands keep you oriented - where am I, and how did I get here:

```bash
alembic current      # which revision the database is on right now
alembic history      # the full ordered list of migrations
```

*What just happened:* `current` prints the revision the database's version table is stamped with -
your "you are here" marker. `history` lists every migration in order, newest to oldest, so you can
see the whole route and which revisions sit ahead of or behind your current position. Reach for
these any time you're unsure what state an environment is in.

## The real workflow (and the gotchas that bite)

💡 Put it all together and the day-to-day loop is just four beats, repeated forever:

1. **Change your models** → verify: the model classes describe the schema you want.
2. **`alembic revision --autogenerate -m "..."`** → verify: a new file appears in `versions/`.
3. **Review the generated script** → verify: every `op.*` line is what you actually intended (watch for the rename-as-drop trap).
4. **`alembic upgrade head`** → verify: `alembic current` shows the new revision; the change is live.

Then - crucially - **commit the migration file to Git alongside the model change.** The migration is
source code. When a teammate pulls your branch, their `alembic upgrade head` replays your exact
script against their database; staging and production do the same on deploy. Everyone applies the
same changes in the same order and lands on the same schema. That's the entire payoff: no more "works
on my machine, broken on yours" for the database.

A handful of gotchas separate smooth Alembic users from the ones who get burned:

- ⚠️ **Never edit a migration that's already been applied or shared.** Once a script has run anywhere
  beyond your own machine - or been pushed to the shared branch - it's history. Editing it means some
  environments ran the old version and some run the new, and they silently diverge. The fix for "I
  got that migration wrong" is always a **new** migration on top, never a retroactive edit.
- ⚠️ **Data migrations are hand-written.** Autogenerate only ever touches structure (DDL). If a change
  needs you to *move or transform existing rows* - backfill a new column, split a field, normalize
  values - you write those `op.execute(...)` / bulk-update steps into `upgrade()` yourself. The differ
  cannot infer intent about data.
- ⚠️ **Coordinate on a team to avoid two heads.** If two people each autogenerate a migration off the
  same parent, you end up with two "head" revisions and Alembic refuses to pick one. It's the schema
  equivalent of a merge conflict; resolve it with `alembic merge` (or by rebasing one revision onto
  the other) before deploying.

💡 **Your models define the schema; Alembic evolves it safely.** `create_all` got you to version one.
From here on, every change to your `Author`, `Book`, or `Tag` tables flows through a reviewed,
ordered, reversible migration - and your database stops being the scary part of shipping.

## Recap

1. **`create_all` only creates missing tables** - it never alters an existing one. Add a column to a
   model whose table already exists and `create_all` does nothing; your code and schema drift apart.
   It's the zero-to-one tool, not the one-to-many tool.
2. **Alembic is version control for your schema.** Each migration is a script with `upgrade()` and
   `downgrade()`; a version table tracks which have run; outstanding ones apply in order.
3. **Set up once** with `alembic init`, then point `env.py`'s `target_metadata` at your
   `Base.metadata` so Alembic can diff models against the live database.
4. **Autogenerate writes the migration for you** (`alembic revision --autogenerate -m "..."`) by
   diffing models vs. database - but always **review** it: renames look like drop+add, some type
   changes are missed, and data migrations aren't detected at all.
5. **Apply and revert** with `alembic upgrade head` (run all pending) and `alembic downgrade -1`
   (undo one); `alembic current` and `alembic history` tell you where you are and how you got there.
6. **The loop:** change models → autogenerate → review → upgrade head; **commit migrations to Git**
   so every environment converges. Never edit an applied/shared migration (write a new one),
   hand-write data migrations, and coordinate to avoid conflicting heads.

## Quick check

Lock in the ideas most likely to save you from a production scare:

```quiz
[
  {
    "q": "You added a `subtitle` column to your Book model whose table already exists, then ran Base.metadata.create_all(engine) again. What happens?",
    "choices": [
      "create_all adds the subtitle column to the existing table",
      "Nothing changes - create_all only creates missing tables and never alters existing ones, so the column won't appear; you need a migration",
      "create_all drops and recreates the books table with the new column",
      "create_all raises an error because the table already exists"
    ],
    "answer": 1,
    "explain": "create_all is build-only: it skips tables that already exist and never alters them. The new column won't appear, and queries touching it will fail. Evolving an existing schema is exactly what Alembic migrations are for."
  },
  {
    "q": "What is the safest mental model for the relationship between your models and Alembic?",
    "choices": [
      "Alembic generates your models from the database automatically",
      "Your models define what the schema should be; Alembic figures out the ordered, reversible steps to get the live database there",
      "Alembic replaces your models entirely once migrations exist",
      "Models and migrations are unrelated; you maintain each by hand separately"
    ],
    "answer": 1,
    "explain": "Models are the destination (the schema you want); the live database is the starting point; a migration is the recorded, reversible route between them. autogenerate diffs the two to write that route."
  },
  {
    "q": "Why must you ALWAYS review an autogenerated migration before applying it?",
    "choices": [
      "Autogenerate is usually wrong about adding and dropping tables",
      "It has blind spots - a column rename looks like a drop-plus-add (losing data), some type changes are missed, and data migrations aren't detected at all",
      "Reviewing is only needed the very first time you run Alembic",
      "Alembic refuses to apply a migration until you manually rewrite every line"
    ],
    "answer": 1,
    "explain": "Autogenerate is a strong first draft, not a final answer. It reliably handles added/dropped tables and columns, but renames look like drop+add (which would delete data), certain type/constraint changes are missed, and it can't infer data migrations. Treat it as a PR to review and edit."
  }
]
```

---

[← Phase 7: Loading Strategies & the N+1 Trap](07-loading-strategies-and-n-plus-1.md) · [Guide overview](_guide.md) · [Phase 9: SQLAlchemy in the Real World & Where to Go Next →](09-where-to-go-next.md)