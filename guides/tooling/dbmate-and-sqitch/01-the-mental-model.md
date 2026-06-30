---
title: "dbmate and Sqitch"
guide: dbmate-and-sqitch
phase: 1
summary: "Lightweight, framework-agnostic database migrations: dbmate's simple timestamped SQL files and Sqitch's dependency-graph approach with verify and revert."
tags: [dbmate, sqitch, migrations, sql, database, tooling]
difficulty: intermediate
synonyms: ["dbmate tutorial", "sqitch tutorial", "plain sql migrations", "framework agnostic migrations", "database migrations without orm", "sqitch deploy revert verify", "dbmate vs sqitch"]
updated: 2026-06-30
---

# Two ways to order change

Here's the situation these tools were built for. You changed your schema on your laptop — added a table, dropped a column, added an index. It works locally. Now that same change has to reach staging and production, in the right order, applied exactly once, with no human pasting SQL into a prod console at 11pm. Multiply that across a team where three people are all changing the schema in the same week, and "remembering what's been applied" stops being a strategy.

A migration tool's whole job is to answer two questions reliably: **what changes exist**, and **which ones has this particular database already seen**. Everything else is detail. dbmate and Sqitch both answer those questions for plain SQL — no ORM, no framework, no code-generated migrations. They differ, deeply, on how they decide the *order* of changes. That one decision shapes everything about how each tool feels.

## The shared idea: SQL files plus a ledger

Every migration tool, framework or not, works the same way underneath. You write the change as SQL. The tool keeps a small **ledger table** inside your database recording which changes have been applied there. When you run the tool, it compares the files on disk against the ledger, and applies whatever's missing.

```text
files on disk          ledger in the database
-------------          ----------------------
add_users              add_users      ✓ applied
add_posts              add_posts      ✓ applied
add_index_on_email     (not present)  ← will run now
```

*What just happened:* The tool saw three change files but a ledger that only knows about two, so it runs the third and writes a new ledger row. Run it again and nothing happens, because now all three are recorded. That idempotence — "apply what's missing, skip what's done" — is the entire point.

The thing to internalize: **the database itself is the source of truth for what's been applied.** Not a config file, not your memory. Each environment carries its own ledger, so prod knows prod's history and staging knows staging's. The files in your repo are the menu; the ledger is the receipt.

## dbmate: order by timestamp

dbmate's answer to "what order?" is the simplest one that works: **a timestamp in the filename.** When you create a migration, dbmate prefixes it with the current UTC time down to the second.

```text
db/migrations/
  20260615120301_create_users.sql
  20260615142200_add_email_index.sql
  20260620090145_create_posts.sql
```

*What just happened:* Three migrations, ordered by the moment they were created. dbmate applies them in ascending filename order, which is the same as chronological order. The ledger (a table called `schema_migrations`) stores just the timestamp portion of each applied file.

Each file holds both directions of the change, separated by magic comments:

```sql
-- migrate:up
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

-- migrate:down
DROP TABLE users;
```

*What just happened:* One file describes how to apply the change (`up`) and how to undo it (`down`). dbmate reads the markers to know which block to run. The `down` block is what makes rollback possible — and if you leave it empty, rollback for that step does nothing.

dbmate is a single small binary, written in Go, with no runtime dependency on your application's language. The same tool migrates a Rails app, a Python service, and a Rust service identically. That language-agnosticism is the reason people reach for it over a framework's built-in migrator.

## Sqitch: order by dependency graph

Sqitch makes the opposite choice, and it's the more interesting one. It says: **timestamps are a lie about ordering.** Two teammates working in parallel both create a migration "after" the current tip, but neither's change actually depends on the other. A timestamp forces a false order. What actually matters is *real* dependencies — this change needs that table to exist first.

So Sqitch has no timestamps and no version numbers. Each change is a **named change** with explicitly declared dependencies, and the changes form a directed graph. Sqitch deploys them in an order that respects the graph (recorded in a plain-text file called `sqitch.plan`).

```text
users  ──requires──>  posts  ──requires──>  comments
                        │
                        └──requires──>  post_tags
```

*What just happened:* `comments` and `post_tags` both declare they require `posts`, which requires `users`. Sqitch reads these declared dependencies and deploys in an order that never violates them. There's no "what time was this made" — there's only "what does this need to already exist."

And Sqitch splits each change into **three scripts**, not two:

```text
deploy/add_users.sql    -- make the change
revert/add_users.sql    -- undo the change
verify/add_users.sql    -- prove the change worked
```

*What just happened:* `deploy` and `revert` mirror dbmate's up/down. The third script, `verify`, is Sqitch's signature feature: a script that fails if the change didn't actually take. We'll use it for real in Phase 3 — for now, hold the idea that Sqitch can *check its own work*, not assume the deploy succeeded.

Sqitch is heavier than dbmate — a Perl application, configured per project, with its own vocabulary (`add`, `deploy`, `revert`, `verify`, `tag`). You pay that weight for the dependency graph and the verify step.

## The mental model, side by side

| | dbmate | Sqitch |
|---|---|---|
| Orders changes by | timestamp in filename | declared dependencies (a graph) |
| Files per change | one (`up` + `down`) | three (`deploy`, `revert`, `verify`) |
| Identity of a change | its timestamp | a human-given name |
| Can verify a deploy? | no | yes, via verify scripts |
| Footprint | tiny single binary | full app, per-project config |

> Neither is "better." dbmate is right when you want the smallest possible tool and your changes naturally come in a line. Sqitch is right when changes branch and merge across a team, or when "did this actually apply correctly?" is a question you need the tool to answer, not you.

Hold both pictures: **a line of timestamps** versus **a graph of named, verifiable changes.** Everything in the next two phases is the commands that make each picture real.

```quiz
[
  {
    "q": "What is the ultimate source of truth for which migrations have already been applied to a given database?",
    "choices": ["A config file in the repo", "A ledger table inside that database", "The newest filename in the migrations folder", "The developer's memory"],
    "answer": 1,
    "explain": "Each environment carries its own ledger table recording applied changes, so prod and staging each know their own history."
  },
  {
    "q": "How does dbmate decide the order in which to apply migrations?",
    "choices": ["By a dependency graph", "By alphabetical change name", "By the timestamp prefix in the filename", "By a manually edited version file"],
    "answer": 2,
    "explain": "dbmate prefixes each migration with a UTC timestamp and applies them in ascending order, which is chronological."
  },
  {
    "q": "What does Sqitch's third script per change — the verify script — do?",
    "choices": ["Re-runs the deploy to be safe", "Fails if the change did not actually take effect", "Generates the revert automatically", "Records a timestamp in the plan"],
    "answer": 1,
    "explain": "Verify scripts let Sqitch check its own work: they fail when the deploy didn't truly succeed, rather than assuming it did."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday loop →](02-the-everyday-loop.md)
