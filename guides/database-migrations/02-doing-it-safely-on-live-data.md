---
title: "Doing It Safely on Live Data"
guide: "database-migrations"
phase: 2
summary: "The golden pattern for live schema changes: add new structure first, backfill the data, then switch the app over — and the expand/contract (parallel-change) approach that keeps the running app working through a rename or type change with zero downtime."
tags: [databases, migrations, zero-downtime, expand-contract, parallel-change, backfill, rename-column]
difficulty: intermediate
synonyms: ["zero downtime schema change", "how to rename a column without downtime", "expand contract migration", "parallel change pattern", "backfill data migration", "change column type live database", "additive migration first"]
updated: 2026-06-19
---

# Doing It Safely on Live Data

On your laptop, a schema change is one command and you're done. There's no traffic, so it doesn't
matter that for a moment the column existed but was empty, or that the old code and new code disagreed
about the table shape. On a live system, those moments are exactly where things break — because the
*old* version of your app is still running and serving users at the instant your migration lands.

The fear here is real but the cure is a single discipline: **never make a change that requires the
app and the schema to switch over in the same instant.** Let's build that into a repeatable pattern.

## Why the naive way bites: the deploy gap

Picture the obvious approach to renaming a column from `name` to `full_name`: write one migration that
renames it, deploy it alongside the code that uses the new name. The problem is timing. A deploy is
never instantaneous — for a window of seconds or minutes, you have a mix:

```text
   time ───────────────────────────────────────────────►

   schema:   name ──────────────[RENAME]────────► full_name
   app:      ▓▓▓ old code (reads `name`) ▓▓▓
                            │
                            ▼ migration runs here, mid-deploy
                     old code now queries `name`  ✗ column gone → errors
```

*What just happened:* The rename took effect while old app instances were still live. Those instances
keep asking for `name`, the column no longer exists, and every one of those requests throws an error
until the deploy finishes. Even a "fast" rename causes a burst of 500s. The schema and the code tried
to switch in the same instant, and they couldn't.

The fix is to stop trying to switch in one instant.

## The golden pattern: add, backfill, switch

Almost every safe live migration follows the same three-beat shape. Hold this and you can reason your
way through most changes:

```text
   1. ADD       create the new structure, additively — old app keeps working, untouched
   2. BACKFILL  copy/compute data into the new structure — in safe batches, no rush
   3. SWITCH    deploy app code that uses the new structure — only now does it matter
              (4. CLEAN UP, later: remove the old structure once nothing reads it)
```

The genius of this order is that **every step is safe on its own.** Adding nullable structure breaks
nothing. Backfilling only writes data; readers don't care. Switching the app happens *after* the new
structure already exists and is full. Nothing has to line up to the second.

💡 **Key point.** Each step can be its own deploy, hours or days apart. You're trading one scary
all-at-once change for a few boring, individually-safe ones. Boring is the goal.

## Expand/contract: keeping the app alive through a rename

That golden pattern has a name when you apply it to renames and type changes: **expand/contract**,
also called **parallel change**. The idea is to run the old and new shapes *side by side* for a while,
so there's never a moment when the app can only use one of them.

📝 **Terminology.** *Expand* = add the new thing without removing the old (the schema temporarily
holds both). *Contract* = once everything uses the new thing, remove the old. The safe middle is the
period where both exist.

Let's rename `users.name` to `users.full_name` on a live table, step by step.

### Step 1 — Expand: add the new column (additive, safe)

```sql
-- migration: 0010_add_full_name.sql  (UP)
ALTER TABLE users ADD COLUMN full_name text;   -- nullable; existing rows get NULL
```
*What just happened:* You added `full_name` alongside the still-present `name`. The running app doesn't
know or care that this column exists — it's still reading and writing `name`. Zero impact on traffic.
This is a deploy you can ship in the middle of a Tuesday.

### Step 2 — Write to both columns (dual-write)

Deploy app code that writes to **both** `name` and `full_name` whenever a user is created or updated.
Reads still come from `name`.

```text
   app writes ──► name        (old, still the source of truth for reads)
            └───► full_name   (new, being kept in sync from now on)
   app reads  ──► name
```

*What just happened:* From this deploy onward, any new or changed row keeps the two columns identical.
You've stopped the new column from falling further behind. What's left is the rows that existed
*before* this code shipped — they still have `full_name = NULL`. That's the backfill's job.

### Step 3 — Backfill the old rows (in batches)

Now copy the existing data across. The instinct is one big `UPDATE`; resist it (Phase 3 explains why a
single huge `UPDATE` is dangerous). Do it in bounded batches:

```sql
-- backfill: copy name into full_name where it hasn't been set yet
UPDATE users
   SET full_name = name
 WHERE full_name IS NULL
   AND id BETWEEN 1 AND 10000;        -- one batch; repeat with the next id range
```
```console
UPDATE 10000
```
*What just happened:* You filled in 10,000 rows where `full_name` was still empty. You'd run this
repeatedly over successive `id` ranges (a loop, or a small script) until no rows remain with
`full_name IS NULL`. Batching keeps each statement short, so it never holds locks long or strains the
database while real users are working. Because Step 2 is already keeping new rows in sync, the
backfill only ever has to catch up the *old* rows — and once it's done, the two columns match
everywhere.

### Step 4 — Switch reads to the new column

Now — and only now — deploy app code that **reads** from `full_name`. The data is all there, so this
flips cleanly.

```text
   app writes ──► name
            └───► full_name
   app reads  ──► full_name   ← switched
```

*What just happened:* The app now treats `full_name` as the real column. `name` is still being written
(by the dual-write from Step 2) but nothing reads it anymore. The rename is, for all user-facing
purposes, complete — and at no single moment did the app ask for a column that wasn't ready.

### Step 5 — Contract: drop the old column (later, deliberately)

After the new code has been running long enough that you're confident you won't need to roll back to
the old reads, remove the leftovers:

```sql
-- migration: 0014_drop_name.sql  (UP)
ALTER TABLE users DROP COLUMN name;
```
*What just happened:* You removed the old column and the dual-write code that fed it (in the same
deploy). The expansion is contracted; the table is now in its clean, final shape. This is the *only*
destructive step, and you took it last, on purpose, well after the switch — when nothing reads `name`
and you've stopped needing it as a safety net.

⚠️ **Gotcha — don't contract too soon.** The whole safety of expand/contract comes from the overlap
period. If you drop `name` in the same deploy that switches reads to `full_name`, you've recreated the
deploy-gap problem from the top of this phase *and* thrown away your fallback. Let the dust settle
between switch and contract. A day is cheap; an incident is not.

## The same shape works for type changes

Changing a column's type (say, an `integer` id to a `bigint`, or a `varchar` to `text`) is the same
dance: add a new column of the new type, dual-write, backfill, switch reads, drop the old. You don't
mutate the column in place while the app depends on it — you stand up its replacement beside it and
move over calmly.

## Recap

1. The danger in live migrations is the **deploy gap** — old app code running against a schema that
   already changed. Don't make the app and schema switch in the same instant.
2. The **golden pattern** is *add → backfill → switch* (then clean up later). Each step is safe on its
   own and can be a separate deploy.
3. **Expand/contract** (parallel change) applies that to renames and type changes: add the new column,
   **dual-write** to both, backfill old rows in **batches**, switch reads, then drop the old column
   last.
4. **Contract late.** The overlap period is your safety net and your rollback path — don't collapse it
   early.

---

[← Guide overview](_guide.md) · [Phase 3: The Dangerous Migrations →](03-the-dangerous-migrations.md)
