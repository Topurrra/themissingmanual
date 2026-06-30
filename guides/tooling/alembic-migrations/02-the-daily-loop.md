---
title: "The daily loop: autogenerate, review, upgrade"
guide: alembic-migrations
phase: 2
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

# The daily loop: autogenerate, review, upgrade

Once Alembic is wired up, almost every schema change you ever make follows the same four beats: change a model, generate a migration, read the migration, apply it. The whole loop takes a minute when nothing surprises you. The one beat people skip is "read the migration," and that is exactly the beat Phase 3 is about. For now, let's make the loop a habit.

## One-time setup

You run this once per project. `alembic init` creates the folder structure from Phase 1.

```bash
pip install alembic
alembic init alembic
```

*What just happened:* Alembic created an `alembic/` directory and an `alembic.ini` file. The directory has the `env.py`, the template, and an empty `versions/` folder. Nothing touched your database yet.

Two edits make autogenerate work. First, point Alembic at your database. The simplest place is `alembic.ini`:

```ini
# alembic.ini
sqlalchemy.url = postgresql://user:pass@localhost/myapp
```

Second, give `env.py` your models' metadata so autogenerate has something to compare the database against. Open `env.py` and set `target_metadata`:

```python
# alembic/env.py
from myapp.models import Base   # your SQLAlchemy declarative Base
target_metadata = Base.metadata
```

*What just happened:* you handed Alembic both pictures. The URL is the live database; `target_metadata` is the shape your models declare. Autogenerate is nothing more than the difference between these two. Without this line, autogenerate sees no models and generates empty migrations.

> Real projects rarely hardcode credentials in `alembic.ini`. A common pattern is to leave `sqlalchemy.url` blank and set it in `env.py` from an environment variable, so the same config works in dev, CI, and production. Keep secrets out of the repo.

## Beat 1: change a model

You decide users need a `created_at` timestamp. You change the Python, as you would for any feature.

```python
# myapp/models.py
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)   # the new column
```

*What just happened:* your model now describes a column the database does not have. The two pictures disagree. Your job for the rest of the loop is to write that disagreement down as a migration.

## Beat 2: autogenerate the migration

This is the command you will type most. The `-m` is a human label that becomes part of the filename.

```bash
alembic revision --autogenerate -m "add created_at to users"
```

```text
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.autogenerate.compare] Detected added column 'users.created_at'
  Generating alembic/versions/9f3b2c7d1e08_add_created_at_to_users.py ... done
```

*What just happened:* Alembic connected to the database, compared its real tables to your `target_metadata`, found one difference, and wrote a new migration file. The line `Detected added column` is Alembic narrating what it noticed. It did **not** change the database — it only wrote a file.

Compare this with plain `alembic revision -m "..."` (no `--autogenerate`), which writes an empty migration with blank `upgrade()`/`downgrade()` bodies for you to fill in by hand. You'll want that for changes autogenerate can't see; Phase 3 covers which ones.

## Beat 3: read what it wrote

Open the generated file. This is the beat that separates people who trust Alembic from people who get burned by it.

```python
# alembic/versions/9f3b2c7d1e08_add_created_at_to_users.py
revision = "9f3b2c7d1e08"
down_revision = "7c2e1a9b3f04"

def upgrade():
    op.add_column("users", sa.Column("created_at", sa.DateTime(), nullable=False))

def downgrade():
    op.drop_column("users", "created_at")
```

*What just happened:* Alembic turned the detected difference into `op.add_column` (forward) and `op.drop_column` (reverse). Read both. Ask: is the forward change what I meant? Does the downgrade truly reverse it? Here, both are correct.

But notice the trap already: `nullable=False` on a table that already has rows will fail, because every existing row would have a NULL `created_at`. Autogenerate wrote what your model says, not what your data needs. You'd fix this by adding a `server_default` or doing it in two steps. The lesson is permanent — **autogenerate drafts, you decide.** Phase 3 catalogs the rest of its blind spots.

## Beat 4: apply it

When the migration reads correctly, run it.

```bash
alembic upgrade head
```

```text
INFO  [alembic.runtime.migration] Running upgrade 7c2e1a9b3f04 -> 9f3b2c7d1e08, add created_at to users
```

*What just happened:* Alembic ran your migration's `upgrade()` against the database and then updated the `alembic_version` row to `9f3b2c7d1e08`. The two pictures now match. `head` means "the newest revision in the chain"; you almost always upgrade to head.

## The commands you'll actually use

A handful covers nearly everything. Keep this list close.

```bash
alembic upgrade head          # apply everything up to the newest revision
alembic upgrade +1            # apply just the next one revision
alembic downgrade -1          # undo the most recent revision
alembic downgrade base        # undo everything, back to empty
alembic current               # which revision is this DB on right now?
alembic history               # the full ordered chain of revisions
```

*What just happened:* you saw the full daily vocabulary. `current` reads the `alembic_version` table from Phase 1; `history` prints the chain. `downgrade -1` is your undo button when you applied something wrong locally — though on production, undoing a migration that already dropped data does not bring the data back.

> Downgrade is for recovering from a mistake you catch quickly, mostly in development. In production, treat a deployed migration as one-way unless you've thought hard about it: `downgrade` of an `add_column` is a `drop_column`, and dropping a column is destroying data. The reverse path exists; it is not free.

## For builders

Wire this into your workflow so the loop is automatic. Most teams run `alembic upgrade head` as a deploy step before the new app code starts, so the schema is always ready when the code that needs it boots. In CI, a useful check is to autogenerate against a fresh database and assert that it produces *no* changes — if it does, someone changed a model without writing a migration, and the build should catch that before it reaches production.

```quiz
[
  {
    "q": "What does `alembic revision --autogenerate -m \"...\"` actually do?",
    "choices": [
      "Applies the schema change directly to the database",
      "Compares your models to the database and writes a migration file, without changing the database",
      "Deletes the alembic_version table and rebuilds it",
      "Downgrades the database by one revision"
    ],
    "answer": 1,
    "explain": "Autogenerate only writes a file describing the detected diff. Nothing hits the database until you run upgrade."
  },
  {
    "q": "Why must you read an autogenerated migration before applying it?",
    "choices": [
      "Because the file is encrypted until you open it",
      "Because Alembic writes what your models say, which may not match what your data or intent needs (e.g. NOT NULL on a populated table)",
      "Because upgrade won't run until the file has been opened in an editor",
      "Because the revision id is wrong until you fix it manually"
    ],
    "answer": 1,
    "explain": "Autogenerate drafts from the model definition; it can produce changes that fail or aren't what you meant, like a non-null column on an existing populated table."
  },
  {
    "q": "After `alembic upgrade head` succeeds, what changed in the database besides the schema?",
    "choices": [
      "Nothing else changed",
      "The alembic_version row was updated to the newly applied revision id",
      "All previous migrations were deleted",
      "The models file was rewritten to match"
    ],
    "answer": 1,
    "explain": "Upgrade runs the migration and then records the new revision id in alembic_version, so the database knows where it now sits."
  }
]
```

[← Phase 1](01-the-version-table-is-the-whole-idea.md) · [Overview](_guide.md) · [Phase 3: The autogenerate trap, heads, and merges →](03-the-autogenerate-trap-and-heads.md)
