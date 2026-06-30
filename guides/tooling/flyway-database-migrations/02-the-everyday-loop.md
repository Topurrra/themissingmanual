---
title: "Flyway, From Zero"
guide: flyway-database-migrations
phase: 2
summary: "Version-control your database schema with Flyway: numbered, immutable migration files applied in order, so every environment ends up with the exact same schema."
tags: [flyway, migrations, database, schema, sql, devops]
difficulty: intermediate
synonyms:
  - flyway migrate command
  - flyway info status
  - flyway repeatable migration
  - how to write flyway migration
  - flyway conf configuration
  - flyway validate
updated: 2026-06-30
---

# The Everyday Loop

Phase 1 was the mental model. This is the muscle memory: the small set of commands and habits you'll use every day. The good news is that there are really only a handful, and once you've done the loop two or three times it stops feeling like a tool and starts feeling like saving a file.

The loop is: write a migration file, ask Flyway what's pending, apply it, confirm. That's it. Let's walk it end to end.

## Pointing Flyway at your database

Flyway needs to know three things: where your database is, how to log in, and where your migration files live. With the command-line tool that goes in a config file, conventionally `flyway.conf`:

```text
flyway.url=jdbc:postgresql://localhost:5432/shop
flyway.user=shop_app
flyway.password=devsecret
flyway.locations=filesystem:./db/migration
```

*What just happened:* `url` is a JDBC connection string (the `jdbc:postgresql://...` shape works for Postgres; MySQL, SQL Server, and others have their own). `locations` tells Flyway which folder to scan for migrations — `filesystem:` for a directory on disk. Put real passwords in environment variables or a secrets store for anything but local play; the config file is the same idea regardless of where the value comes from.

> **For builders:** every config key has an environment-variable and command-line-flag equivalent (`FLYWAY_URL`, `-url=...`). In CI you'll usually set them as environment variables rather than committing a config file with credentials in it.

## Step 1: write the migration

A migration is plain SQL. No special syntax, no Flyway-specific dialect — whatever your database understands, you write. The only Flyway part is the filename.

```sql
-- V1__create_users.sql
CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

*What just happened:* this is the first migration. It's ordinary DDL. When Flyway runs it, the SQL goes straight to your database, and on success Flyway writes a `version = 1` row into `flyway_schema_history`. Nothing about the SQL itself knows Flyway exists.

## Step 2: see what's pending with `info`

Before you change anything, `flyway info` shows you the plan — what's applied, what's pending, in what order. Make this your reflex; it's the read-only "what would happen" view.

```console
$ flyway info

+-----------+---------+---------------+------+---------------------+---------+
| Category  | Version | Description   | Type | Installed On        | State   |
+-----------+---------+---------------+------+---------------------+---------+
| Versioned | 1       | create users  | SQL  | 2026-06-28 09:14:02 | Success |
| Versioned | 2       | add email idx | SQL  |                     | Pending |
+-----------+---------+---------------+------+---------------------+---------+
```

*What just happened:* V1 already ran (it has an install date and `Success`). V2 exists on disk but hasn't run yet — `State: Pending`, no install date. Flyway is telling you exactly one migration is waiting. No surprises, no guessing.

## Step 3: apply with `migrate`

`flyway migrate` is the verb that does the work. It reads the history table, finds everything pending, and applies it in order.

```console
$ flyway migrate

Successfully validated 2 migrations (execution time 00:00.041s)
Current version of schema "public": 1
Migrating schema "public" to version "2 - add email idx"
Successfully applied 1 migration to schema "public" (execution time 00:00.018s)
```

*What just happened:* Flyway saw the schema was at version 1, found V2 pending, ran it, and recorded a new history row. The schema is now at version 2. Run `migrate` again right now and it does nothing — there's nothing pending — which is exactly why it's safe to run on every single deploy. Re-running is a no-op, not a duplicate.

> The fact that `migrate` is safe to run repeatedly is called *idempotence*, and it's the property that lets you wire Flyway into automated deploys without fear. "Apply whatever isn't applied yet" is the only thing it ever does.

## Repeatable migrations: for things you want to re-run

Versioned migrations (`V...`) run exactly once. But some database objects you'd rather *redefine* every time they change — views, stored procedures, functions. You don't want a new `V` file each time you tweak a view's definition. That's what repeatable migrations are for. They use the prefix `R` and have **no version number**:

```sql
-- R__active_users_view.sql
CREATE OR REPLACE VIEW active_users AS
SELECT id, email
FROM users
WHERE last_login_at > now() - INTERVAL '30 days';
```

*What just happened:* an `R` migration runs after all pending versioned ones, and it re-runs whenever its checksum changes — that is, whenever you edit the file. So you keep one canonical file for the view, edit it in place, and Flyway re-applies it on the next `migrate`. Notice the `CREATE OR REPLACE`: repeatable migrations must be written to be safe to run again, because that's the entire point of them.

```text
R__active_users_view.sql   ← no version, re-runs when its contents change
V5__backfill_logins.sql    ← versioned, runs exactly once, ever
```

*What just happened:* the two kinds coexist in the same folder. Use `V` for one-time, ordered changes (creating tables, altering columns, backfilling data). Use `R` for definitions you maintain as living files (views, procedures, functions). Versioned migrations always run before repeatable ones in a given `migrate`.

## The full loop, one more time

Put together, your everyday rhythm looks like this:

```console
$ # 1. you create db/migration/V3__add_orders.sql in your editor
$ flyway info      # 2. confirm V3 shows as Pending
$ flyway migrate   # 3. apply it
$ flyway info      # 4. confirm V3 now shows Success
```

*What just happened:* write, inspect, apply, confirm. The `info` calls bracketing `migrate` aren't required, but they turn "I hope that did what I think" into "I watched it do exactly what I expected." Commit the migration file alongside the code that needs it, and every teammate and every environment gets the same change by running the same `migrate`.

> **In the wild:** in a Spring Boot service you rarely type `flyway migrate` at all — Boot runs it for you at startup, so the act of deploying the new app version *is* the act of applying its migrations. The command-line loop here is what's happening under the hood, and it's still how you'd drive Flyway in CI, scripts, or any non-Spring stack.

```quiz
[
  {
    "q": "What is the difference between a V migration and an R migration?",
    "choices": ["V runs on Postgres, R runs on MySQL", "V runs once in version order; R has no version and re-runs whenever its contents change", "V is for data, R is for schema", "There is no difference; both run every time"],
    "answer": 1,
    "explain": "Versioned (V) migrations run exactly once in order. Repeatable (R) migrations have no version and re-apply whenever their checksum changes — ideal for views and procedures."
  },
  {
    "q": "You run flyway migrate, it succeeds, then you immediately run it again. What happens?",
    "choices": ["It re-applies the last migration", "It errors because nothing is pending", "It does nothing, because there is nothing pending to apply", "It drops and rebuilds the schema"],
    "answer": 2,
    "explain": "migrate applies only what is pending. With nothing pending it's a no-op, which is why it's safe to run on every deploy — that's idempotence."
  },
  {
    "q": "Which command shows you what is applied and what is pending, without changing anything?",
    "choices": ["flyway migrate", "flyway info", "flyway clean", "flyway baseline"],
    "answer": 1,
    "explain": "flyway info is the read-only status view: each migration's version, description, and State (Success or Pending). migrate is the one that actually applies changes."
  }
]
```

[← Phase 1: A Schema Is Code](01-schema-is-code.md) · [Overview](_guide.md) · [Phase 3: Production Reality →](03-production-reality.md)
