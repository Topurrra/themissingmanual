---
title: "The Hard Part - Migrations and Health"
guide: "zero-downtime-deploys"
phase: 3
summary: "The database is what actually bites you: backward-compatible expand-then-contract migrations, plus health checks and connection draining that let the balancer route safely."
tags: [deployment, database-migration, expand-contract, health-check, connection-draining, backward-compatible, devops]
difficulty: intermediate
synonyms: ["zero downtime database migration", "expand and contract migration", "backward compatible schema change", "what is a readiness probe", "connection draining explained", "rename a column without downtime"]
updated: 2026-06-30
---

# The Hard Part - Migrations and Health

You picked a strategy. Traffic moves smoothly from old to new. And then a release still takes the site down - because the *code* deployed cleanly but the *database* didn't get the memo. This is where most real outages live, and it's the part the shiny deploy tools can't do for you. Two topics: making schema changes that two code versions can survive, and making sure the balancer only ever sends traffic to instances that can actually answer.

## The trap: your migration and your code can't both win

Remember from Phase 2 that rolling and canary have old and new code running *at the same time*. Now add a schema change to the mix. Say the new version renames a column `name` to `full_name`. You write one migration: `ALTER TABLE users RENAME COLUMN name TO full_name`.

Watch what happens during the rollout:

```text
migration runs ──► column is now `full_name`
                   but old (v1) code still running, still doing SELECT name ...
                   v1 query: ERROR - column "name" does not exist
```

*What just happened:* the instant the rename lands, every still-running v1 instance starts throwing errors, because it's asking for a column that no longer exists. You didn't deploy zero-downtime; you deployed an outage with extra steps. Reverse it (migrate after the code) and now *new* code asks for `full_name` before it exists. There is no single ordering of "one big migration + swap the code" that avoids a broken window. The premise is wrong, not the order.

## The fix: expand, then contract

The way out is to stop thinking of a schema change as one step. Split it so that **at every moment, the database supports both the old code and the new code at once.** This is the expand-contract pattern (also called parallel change), and the rename above becomes a sequence of *separately deployed* steps:

1. **Expand** - add the new thing without removing the old. Add a `full_name` column; keep `name`. Deploy this migration alone. Old code still uses `name` and is perfectly happy.
2. **Migrate code (and backfill)** - deploy code that *writes to both* columns and reads the new one. Backfill `full_name` from existing `name` values. Now both columns are populated and current.
3. **Contract** - once no running code reads or writes `name`, deploy a final migration that drops it.

```sql
-- Step 1 (deploy alone): expand. Old code untouched, still uses `name`.
ALTER TABLE users ADD COLUMN full_name TEXT;

-- Step 2 (with the new code release): backfill existing rows.
UPDATE users SET full_name = name WHERE full_name IS NULL;
-- ...and the new code writes BOTH name and full_name on every save,
--    while reading full_name. Old code, if any is still up, still reads name.

-- Step 3 (a later, separate deploy): contract, once nothing reads `name`.
ALTER TABLE users DROP COLUMN name;
```

*What just happened:* no single step ever breaks a running version. During step 1 only `name` is read; during step 2 both columns are valid and kept in sync; by step 3 nothing touches `name` anymore, so dropping it harms no one. The cost is being upfront about the calendar: a "rename" is now three deploys spread over time, not one. That patience is the entire price of zero downtime on a schema change.

> The rule to carry everywhere: **a migration must be backward-compatible with the code already running.** Adding a column, adding a nullable field, adding a new table - safe, because old code ignores what it doesn't know about. Removing or renaming a column, making a column `NOT NULL`, narrowing a type - destructive, because old code breaks. Destructive changes always become expand → migrate → contract.

A few more moves in the same spirit:

- **Adding a `NOT NULL` column?** Add it nullable with a default first, backfill, *then* add the constraint. A bare `NOT NULL` add fails on existing rows.
- **Renaming a table?** Same as a column: new table, dual-write, backfill, switch reads, drop old.
- **Big backfills?** Do them in batches so you don't lock the table and cause the very downtime you're avoiding.

## Health checks: how the balancer knows who's ready

Back in Phase 1 we saw the gap between "process is up" and "app is ready." Health checks are how the load balancer learns the difference. Your app exposes an endpoint the balancer polls; only instances that answer healthy get traffic. There are two flavors, and conflating them causes its own outages:

- **Liveness** - "is this process alive, or wedged and needing a restart?" If liveness fails, the orchestrator kills and restarts the instance.
- **Readiness** - "can this instance serve a request *right now*?" If readiness fails, the balancer stops sending it traffic but leaves it running.

```text
new instance boots ──► readiness = NO  (still opening DB pool, warming)
                       balancer sends it ZERO traffic
pool open, warm ─────► readiness = YES
                       balancer adds it to rotation
```

*What just happened:* readiness is what closes the Phase 1 gap. The instance starts, but the balancer holds traffic back until the app says "I'm actually ready," so no request lands on a half-booted process. A rolling deploy *relies* on this: it won't move to the next batch until the new instances report ready. A readiness check that returns OK too early - before the DB pool is open - reintroduces the exact downtime you're trying to kill.

> Make readiness mean it. A check that always returns `200 OK` regardless of whether the app can reach its database is theater - it tells the balancer "send traffic" to an instance that will then fail every request. Check the things you actually need to serve (DB reachable, critical deps up), but keep it cheap; the balancer hits it constantly.

## Draining: let the old instance finish what it started

The last gap is on the *way out*. When you take an instance down, it's probably in the middle of serving requests. Kill it instantly and those in-flight requests die. **Connection draining** (graceful shutdown) fixes this: the instance is removed from the balancer's rotation so it gets *no new* requests, but it's given a window to finish the ones already in progress before it actually stops.

```console
$ # orchestrator wants to stop instance A
1. mark A "not ready"     -> balancer stops routing NEW requests to A
2. A keeps serving the requests already in flight
3. wait for them to finish (up to a drain timeout)
4. only now: send SIGTERM, A exits cleanly
```

*What just happened:* nothing in flight got dropped. New traffic moved to other instances the moment A left rotation, and A's existing requests got to complete. Skip draining and even a perfect rolling deploy sheds a burst of errors on every instance you cycle - small, easy to miss in testing, very real to the users who hit it. Most orchestrators do this for you *if* your app handles `SIGTERM` by finishing work and closing cleanly instead of dying on the spot.

## Putting it together

A genuinely zero-downtime release is the strategy from Phase 2 *plus* this phase's discipline:

1. Ship schema changes expand-first, backward-compatible - never break the running version.
2. Roll/flip/canary the new code, with readiness checks gating each instance into rotation.
3. Drain old instances so in-flight requests finish.
4. Later, in a separate deploy, contract - drop what nothing uses anymore.

*What just happened:* every gap from Phase 1 is now closed - boot gap by readiness, shutdown gap by draining, and the data gap by expand-contract. The deploy stops being an event. It becomes a Tuesday.

**For builders:** before your next deploy, ask one question of every migration - "would the code currently in production survive this change?" If the answer is no, it's a destructive change and needs the expand → migrate → contract split. Then confirm your readiness check actually pings the database, and that your app finishes in-flight work on `SIGTERM`. Those three habits prevent the large majority of "but the deploy tool said it was zero-downtime" outages. For where this sits in the pipeline, see [Your First Pipeline (GitHub Actions)](/guides/your-first-pipeline-github-actions).

```quiz
[
  {
    "q": "Why is a single 'rename column name to full_name' migration unsafe during a rolling deploy?",
    "choices": [
      "Renames are always slow",
      "While both code versions run, one of them will reference a column that no longer exists (or doesn't exist yet), causing errors",
      "Databases cannot rename columns at all",
      "It locks the table forever"
    ],
    "answer": 1,
    "explain": "With old and new code live at once, a hard rename breaks whichever version expects the other name. The fix is expand-contract, where both names coexist during the transition."
  },
  {
    "q": "What is the correct order of the expand-contract pattern?",
    "choices": [
      "Drop the old column, then add the new one, then deploy code",
      "Add the new column (keep old), deploy code that dual-writes and backfills, then later drop the old column",
      "Rename the column, then deploy code, then backfill",
      "Add a NOT NULL column immediately, then deploy code"
    ],
    "answer": 1,
    "explain": "Expand (add new, keep old) → migrate (dual-write, backfill, read new) → contract (drop old once nothing uses it). Every step stays compatible with the code that's running."
  },
  {
    "q": "What does connection draining (graceful shutdown) accomplish when removing an instance?",
    "choices": [
      "It speeds up the database",
      "It stops new requests from going to the instance while letting in-flight requests finish before the process exits",
      "It returns 200 OK from the health check no matter what",
      "It makes the instance boot faster"
    ],
    "answer": 1,
    "explain": "Draining takes the instance out of rotation so it gets no new traffic, then gives it a window to complete requests already in progress before SIGTERM - so nothing in flight is dropped."
  }
]
```

[← Phase 2: The Three Strategies](02-the-three-strategies.md) | [Overview](_guide.md)
