---
title: "The N+1 Query Problem"
guide: n-plus-one-queries
phase: 2
summary: "The ORM trap that is fast on seed data and dead in production: one query quietly becomes N+1. How to spot it and fix it."
tags: [databases, orm, performance, n+1, queries, eager-loading]
difficulty: intermediate
synonyms:
  - n+1 query problem
  - n plus one queries
  - orm fires too many queries
  - why is my orm slow
  - eager loading vs lazy loading
  - loop firing one query per row
updated: 2026-06-30
---

# Seeing it in your logs

You can't fix what you can't see, and N+1 is built to stay unseen. The whole point of an ORM is to hide SQL from you — which is wonderful right up until the hidden SQL is the bug. So the single most useful skill here isn't memorizing fixes. It's learning to make the database *show its work*, then recognizing the telltale pattern in what it shows.

Once you've caught N+1 in the act even once, you'll never un-see it. The pattern is loud and unmistakable. You have to turn the lights on.

## Step one: turn on query logging

Every ORM can be told to print the SQL it runs. The setting has a different name in each one, but the idea is universal: log every query to the console. Flip it on in development and reload the page you're suspicious of.

```text
# the setting is named differently per stack, e.g.:
#   Rails / ActiveRecord  -> on by default in the dev log
#   Django                -> log the 'django.db.backends' logger at DEBUG
#   SQLAlchemy            -> create_engine(url, echo=True)
#   Hibernate             -> hibernate.show_sql = true
#   Prisma / Sequelize    -> log: ['query']
```

*What just happened:* you told the ORM to stop hiding. From now on, every query it runs appears in your console as real SQL. This is the one switch that converts N+1 from an invisible mystery into something you can literally count.

## Step two: read the pattern

Now reload your suspicious page and watch the log. N+1 has a fingerprint you cannot mistake for anything else — **the same query, repeated, with only the ID changing.**

```sql
SELECT * FROM orders WHERE status = 'open';     -- the +1

SELECT * FROM customers WHERE id = 17;          -- N begins...
SELECT * FROM customers WHERE id = 4;
SELECT * FROM customers WHERE id = 91;
SELECT * FROM customers WHERE id = 23;
SELECT * FROM customers WHERE id = 17;          -- note: 17 again!
SELECT * FROM customers WHERE id = 56;
-- ... 200 more lines exactly like these ...
```

*What just happened:* the wall of near-identical `SELECT ... WHERE id = ?` lines IS the N+1. One outer query, then a long stutter of single-row lookups that differ only in the number. That repetition is the signature — when your log scrolls with the same statement over and over, you've found it. Bonus tell: notice `id = 17` shows up twice. The lazy loader doesn't even remember it already fetched customer 17; it asks again. That's pure waste on top of the waste.

> The fingerprint is repetition. One unique query repeated 200 times is N+1. Two hundred genuinely different queries is a different (and rarer) problem.

## Step three: count, don't eyeball

On a real page you might have several relations and several loops, and the log becomes a blur. Don't try to read every line — **count the queries instead.** Most stacks give you a query counter for exactly this.

```text
Page rendered. Database: 1 + 247 queries in 1,830 ms.
```

*What just happened:* this is the smoking gun in numeric form. A page that should need a small, fixed handful of queries instead ran 248. The number to watch is whether query count grows when your data grows. The honest test: load the page with 10 rows, note the count; load it with 50 rows, note it again. If the count jumped roughly fivefold, your queries scale with rows — that's N+1, confirmed. A healthy page's query count barely moves when the row count changes.

## In production: lean on your APM

You can't tail a console in production, and that's where N+1 actually hurts. This is what an **APM** (Application Performance Monitoring tool — think Datadog, New Relic, Sentry, Scout) is for. It records every request and breaks down where the time went, including how many database queries each endpoint fired and how long they took in total.

The N+1 signature in an APM is visual and as obvious as in the log: a request's timeline shows a dense ladder of dozens or hundreds of tiny, identical database spans stacked one after another. Each bar is short; the stack of them is enormous. Many APMs will even flag it for you with a literal "N+1 queries detected" warning on the endpoint — they pattern-match the same repetition you learned to read by eye.

The workflow that actually works in practice:

```text
1. APM flags a slow endpoint, mostly "time in database".
2. The trace shows 1 list query + a tall stack of identical row lookups.
3. Reproduce it locally with query logging on.
4. Count queries before; apply a fix (Phase 3); count after.
5. The count should drop to a small constant. Ship.
```

*What just happened:* you closed the loop from symptom to confirmation. Production told you *where* (which endpoint), local logging told you *what* (the repeated query), and the before/after count proves the fix worked instead of you just hoping it did.

For builders: if your APM says the time is in the database but you *don't* see the repetition fingerprint — it's one query that's genuinely slow, not N+1 — that's a different diagnosis. Head to [why is my query slow](/guides/why-is-my-query-slow) instead; the fix there is indexes and query shape, not eager loading.

```quiz
[
  {
    "q": "What is the unmistakable fingerprint of N+1 in a query log?",
    "choices": [
      "One enormous query with many JOINs",
      "The same query repeated many times, differing only by an ID",
      "Queries that each take several seconds",
      "Errors about too many open connections"
    ],
    "answer": 1,
    "explain": "N+1 shows up as a long stutter of near-identical single-row lookups — same statement, only the ID changes."
  },
  {
    "q": "You load a page with 10 rows (12 queries), then with 50 rows (52 queries). What does this tell you?",
    "choices": [
      "The database needs a bigger connection pool",
      "Query count scales with rows — classic N+1",
      "The queries are slow and need an index",
      "Nothing; query count always grows with data"
    ],
    "answer": 1,
    "explain": "Count growing in step with row count is the confirmation. A healthy page's query count stays roughly constant."
  },
  {
    "q": "Your APM says an endpoint is slow and spends its time in the database, but the trace shows ONE long query, not a stack of identical small ones. What is this?",
    "choices": [
      "Still N+1, just hidden",
      "A connection leak",
      "A single slow query — an indexing/query-shape problem, not N+1",
      "A caching misconfiguration"
    ],
    "answer": 2,
    "explain": "No repetition fingerprint means it isn't N+1. One genuinely slow query is solved by indexes and query shape instead."
  }
]
```

[← Phase 1: What N+1 actually is](01-what-n-plus-one-is.md) | [Overview](_guide.md) | [Phase 3: Fixing it without over-fetching →](03-fixing-it.md)
