---
title: "The everyday loop"
guide: prisma-migrate
phase: 2
summary: "Schema-first migrations in the Node world: edit your Prisma schema, generate a migration, and keep dev and production in sync without drift."
tags: [prisma, migrations, node, typescript, database, orm, schema]
difficulty: intermediate
synonyms:
  - prisma migrate dev
  - prisma migrate deploy
  - prisma schema migrations
  - shadow database prisma
  - prisma drift detection
  - how to use prisma migrate
  - prisma migration workflow
updated: 2026-06-30
---

# The everyday loop

You'll spend almost all your Prisma time in one short loop: change the schema, make a migration, keep coding. There are really only two commands you need to internalize, and the most common mistake is using the wrong one in the wrong place. So let's nail down which is which.

## `migrate dev` — your machine, your loop

On your laptop, you run `prisma migrate dev`. It does three things in one shot, and understanding all three is what makes it feel less like magic:

```console
$ npx prisma migrate dev --name add_user_bio

Applying migration `20260630131500_add_user_bio`

The following migration(s) have been created and applied:
  migrations/
    └─ 20260630131500_add_user_bio/
        └─ migration.sql

✔ Generated Prisma Client (v5) in 84ms
```

*What just happened:* three steps, in order. (1) Prisma diffed your edited `schema.prisma` against the recorded migration history and wrote a new `migration.sql`. (2) It applied that SQL to your dev database. (3) It regenerated the Prisma Client so your TypeScript types match the new schema immediately. That third step is why your editor knows about the new column the moment the command finishes.

The `--name` is a human label, not a requirement — leave it off and Prisma will prompt you for one. Pick names that read like a changelog: `add_user_bio`, `make_email_required`, `drop_legacy_orders`.

> `migrate dev` is for development databases only. It is allowed to be destructive and will reset your dev database if history and database have diverged. Pointing it at production is the classic, painful mistake. Production gets `migrate deploy`, which we'll cover next.

## The actual daily rhythm

Here's the loop, start to finish, for adding a field:

```bash
# 1. Edit prisma/schema.prisma — add `bio String?` to model User

# 2. Create + apply the migration, regenerate the client
npx prisma migrate dev --name add_user_bio

# 3. Use the new field in code — types already updated
#    await prisma.user.update({ data: { bio: "..." } })

# 4. Commit the schema AND the new migration folder together
git add prisma/schema.prisma prisma/migrations
git commit -m "Add bio to User"
```

*What just happened:* the schema change and the generated migration travel together in one commit. This is non-negotiable — a teammate who pulls your branch runs the same migration and lands on the same database shape. If you commit the schema but forget the migration folder, their database and yours silently diverge.

## `migrate deploy` — every other environment

In CI, staging, and production, you never generate migrations. They already exist in your repo. You only *apply* the ones that haven't run yet:

```console
$ npx prisma migrate deploy

3 migrations found in prisma/migrations

Applying migration `20260630131500_add_user_bio`

All migrations have been successfully applied.
```

*What just happened:* `migrate deploy` looked at the database's record of which migrations it has already run, found the ones it hasn't, and applied them in order. It never creates a migration, never prompts, never resets anything. It is safe to run on every deploy — if there's nothing new, it does nothing.

How does the database know what it has run? Prisma keeps a bookkeeping table called `_prisma_migrations`:

```sql
SELECT migration_name, finished_at FROM "_prisma_migrations";

       migration_name          |        finished_at
-------------------------------+----------------------------
 20260630120000_init           | 2026-06-30 12:00:01.2+00
 20260630131500_add_user_bio   | 2026-06-30 13:15:02.9+00
```

*What just happened:* every successful migration writes a row here. `migrate deploy` reads this table to decide what's left to run. This is how the database remembers its own history, and it's what makes re-running deploy harmless.

## dev versus deploy, side by side

```text
                  migrate dev            migrate deploy
  Where           your laptop            CI / staging / prod
  Creates SQL?    yes                    no — only applies existing
  Applies SQL?    yes                    yes
  Regen client?   yes                    no
  Can reset DB?   yes (destructive)      no, never
  Prompts you?    yes (for a name)       no
```

*What just happened:* one command for authoring (dev), one for shipping (deploy). If you remember nothing else: you *make* migrations on your machine and *apply* them everywhere else.

## In the wild

A typical deploy pipeline runs `npx prisma migrate deploy` as a release step *before* the new app code starts serving traffic. That ordering matters: the schema must be in place before code that depends on it runs. Many teams make it a dedicated step in their deploy script so a migration failure stops the release instead of half-deploying. The companion guide [/guides/database-migrations](/guides/database-migrations) digs into the general patterns for sequencing migrations with deploys.

```quiz
[
  {
    "q": "Which command do you run on production to apply migrations?",
    "choices": ["prisma migrate dev", "prisma migrate deploy", "prisma db push", "prisma generate"],
    "answer": 1,
    "explain": "migrate deploy only applies existing migrations, never creates or resets — safe for prod. migrate dev is for your laptop."
  },
  {
    "q": "What are the THREE things `prisma migrate dev` does in one run?",
    "choices": ["Lint, test, deploy", "Create the migration, apply it, regenerate the client", "Backup, migrate, restart", "Pull, diff, push"],
    "answer": 1,
    "explain": "It diffs the schema to create a new migration.sql, applies it to the dev DB, and regenerates the Prisma Client."
  },
  {
    "q": "How does the database know which migrations it has already applied?",
    "choices": ["By comparing file timestamps", "From a _prisma_migrations bookkeeping table", "It re-runs all of them every time", "From schema.prisma comments"],
    "answer": 1,
    "explain": "Each applied migration writes a row to _prisma_migrations; migrate deploy reads it to find what's left to run."
  }
]
```

[← Phase 1: Schema is the source of truth](01-schema-is-the-source-of-truth.md) | [Overview](_guide.md) | [Phase 3: Drift, shadows, and production →](03-drift-shadows-and-production.md)
