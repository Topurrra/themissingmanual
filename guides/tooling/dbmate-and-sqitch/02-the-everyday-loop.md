---
title: "dbmate and Sqitch"
guide: dbmate-and-sqitch
phase: 2
summary: "Lightweight, framework-agnostic database migrations: dbmate's simple timestamped SQL files and Sqitch's dependency-graph approach with verify and revert."
tags: [dbmate, sqitch, migrations, sql, database, tooling]
difficulty: intermediate
synonyms: ["dbmate tutorial", "sqitch tutorial", "plain sql migrations", "framework agnostic migrations", "database migrations without orm", "sqitch deploy revert verify", "dbmate vs sqitch"]
updated: 2026-06-30
---

# The everyday loop

The loop is the same shape for both tools: make a change, apply it, and — when you're wrong, which you will be — undo it. What differs is the vocabulary and the number of files you touch. We'll run each tool through the same small story: create a `users` table, then add an index, then walk a rollback. Do this once with each and the commands stick.

## dbmate: create, up, down

dbmate finds your database through a connection URL. It reads `DATABASE_URL` from the environment (and from a `.env` file in the current directory if present), so set it once.

```bash
export DATABASE_URL="postgres://app:secret@localhost:5432/myapp?sslmode=disable"
```

*What just happened:* dbmate now knows which database to talk to. The scheme (`postgres://`, `mysql://`, `sqlite:`) is also how dbmate picks the right driver — there's no separate config for "what database am I using."

Create your first migration:

```bash
$ dbmate new create_users
Creating migration: db/migrations/20260615120301_create_users.sql
```

*What just happened:* dbmate stamped the current UTC time onto the name and dropped an empty file with `migrate:up` / `migrate:down` markers already in it. The name after `new` is just a human label; the timestamp is what orders it.

Fill it in:

```sql
-- migrate:up
CREATE TABLE users (
  id    SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

-- migrate:down
DROP TABLE users;
```

Apply everything pending:

```bash
$ dbmate up
Applying: 20260615120301_create_users.sql
Writing: ./db/schema.sql
```

*What just happened:* dbmate ran the `up` block, recorded the timestamp in the `schema_migrations` ledger table, and then dumped the full current schema to `db/schema.sql`. That schema dump is a feature, not noise — it's a single file showing the database's *current* shape, useful for code review and for spinning up a fresh database fast.

Add a second migration the same way, then check where you stand:

```bash
$ dbmate status
[X] 20260615120301_create_users.sql
[ ] 20260615142200_add_email_index.sql

Applied: 1
Pending: 1
```

*What just happened:* `[X]` means applied (it's in the ledger), `[ ]` means pending. `status` is a read-only diff between disk and ledger — run it any time you're unsure what `up` would do.

Now undo. `dbmate down` rolls back the **single most recent** applied migration:

```bash
$ dbmate down
Rolling back: 20260615120301_create_users.sql
```

*What just happened:* dbmate ran that file's `migrate:down` block (`DROP TABLE users`) and removed its row from the ledger. One `down` = one step back. There's no "down to a specific version" — you call `down` repeatedly, newest first. This is why the `down` block matters: an empty one means `dbmate down` succeeds but changes nothing, leaving you stuck.

The everyday dbmate loop, in full:

```text
dbmate new <name>   create a timestamped up/down file
edit the file       write the SQL for both directions
dbmate up           apply all pending, refresh schema.sql
dbmate status       see applied vs pending
dbmate down         roll back the newest applied migration
```

## Sqitch: add, deploy, verify, revert

Sqitch is project-based. You initialize once, naming your engine and a project name:

```bash
$ sqitch init myapp --engine pg
Created sqitch.conf
Created sqitch.plan
Created deploy/
Created revert/
Created verify/
```

*What just happened:* Sqitch wrote a config (`sqitch.conf`), an empty plan file (`sqitch.plan`, the ordered list of changes), and the three script directories. Nothing has touched your database yet — this is purely project scaffolding.

Add a change. Note you name it, you don't get a timestamp:

```bash
$ sqitch add users -n "Add users table"
Created deploy/users.sql
Created revert/users.sql
Created verify/users.sql
Added "users" to sqitch.plan
```

*What just happened:* Sqitch created all three scripts and appended a line to `sqitch.plan`. The `-n` is the change note (like a commit message). The change is now in the plan but **not yet deployed** — the plan is intent, the database is reality.

Fill in the three scripts. Deploy makes it, revert unmakes it, verify proves it:

```sql
-- deploy/users.sql
CREATE TABLE users (
  id    SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);
```

```sql
-- revert/users.sql
DROP TABLE users;
```

```sql
-- verify/users.sql
SELECT id, email FROM users WHERE false;
```

*What just happened:* The verify script does a harmless query that *only succeeds if the table and columns exist*. `WHERE false` returns no rows but still errors out if `users` or its columns are missing. That's the trick of a verify script — make a query that's cheap when correct and throws when not.

Now deploy. You point Sqitch at a target database:

```bash
$ sqitch deploy db:pg://app:secret@localhost:5432/myapp
Adding registry tables to database myapp
Deploying changes to db:pg://...
  + users .. ok
```

*What just happened:* On first run Sqitch created its own registry (its ledger — a `sqitch` schema with tables tracking deployed changes), then ran `deploy/users.sql` and recorded it. The `+ users .. ok` is one deployed change. Tip: define this target once in `sqitch.conf` (e.g. a target named `prod`) so you type `sqitch deploy prod` instead of the full URL.

Add a second change that *depends on the first*, and that dependency is the whole reason to use Sqitch:

```bash
$ sqitch add email_index --requires users -n "Index users.email"
```

*What just happened:* `--requires users` writes the dependency into the plan. Sqitch will refuse to deploy `email_index` to a database that doesn't already have `users` deployed — the graph is enforced, not advisory.

Check your work and walk a rollback:

```bash
$ sqitch verify db:pg://app:secret@localhost:5432/myapp
  * users ........ ok
  * email_index .. ok
Verify successful

$ sqitch revert --to users db:pg://app:secret@localhost:5432/myapp
Revert all changes after "users" from myapp? [Yes] yes
  - email_index .. ok
```

*What just happened:* `verify` ran every verify script against the live database and confirmed each change actually took. Then `revert --to users` undid everything deployed *after* `users`, in reverse order, leaving `users` itself in place. Unlike dbmate's one-step `down`, Sqitch reverts **to a named point** — you say where to land, not how many steps.

The everyday Sqitch loop, in full:

```text
sqitch add <name> [--requires X]   create deploy/revert/verify, add to plan
edit the three scripts             write make / unmake / prove SQL
sqitch deploy <target>             apply pending changes in graph order
sqitch verify <target>             run all verify scripts against the DB
sqitch revert --to <name> <target> roll back to a named change
```

## For builders: pick the loop that matches your team

If you're solo or your schema changes come in a tidy line, dbmate's two-file, timestamp-ordered loop is less to think about and a smaller binary to install in CI. If multiple people change the schema in parallel, or you genuinely want the tool to verify deploys (think compliance, think "prove the migration worked before the app starts"), Sqitch's three-file graph earns its extra ceremony. You can wire either into the same place in your pipeline — Phase 3 is about making sure that pipeline survives the bad days.

```quiz
[
  {
    "q": "What does a single `dbmate down` command do?",
    "choices": ["Rolls back to a chosen version", "Rolls back every applied migration", "Rolls back only the most recently applied migration", "Rolls back nothing unless you pass a count"],
    "answer": 2,
    "explain": "dbmate down reverts exactly one step — the newest applied migration. To go further you run it repeatedly."
  },
  {
    "q": "In Sqitch, what does `--requires users` on a new change accomplish?",
    "choices": ["Copies the users deploy script", "Declares a dependency so Sqitch won't deploy this change unless users is already deployed", "Runs the users verify script first", "Adds a timestamp linking the two"],
    "answer": 1,
    "explain": "Dependencies are written into the plan and enforced: Sqitch refuses to deploy a change whose required predecessors aren't present."
  },
  {
    "q": "How does Sqitch's revert differ from dbmate's down?",
    "choices": ["Sqitch reverts to a named change you specify; dbmate steps back one migration at a time", "They are identical", "dbmate reverts to a version; Sqitch only undoes the last change", "Neither tool can revert"],
    "answer": 0,
    "explain": "Sqitch revert --to <name> lands at a named point, undoing everything after it; dbmate down undoes a single newest step."
  }
]
```

[← Phase 1](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: Production reality →](03-production-reality.md)
