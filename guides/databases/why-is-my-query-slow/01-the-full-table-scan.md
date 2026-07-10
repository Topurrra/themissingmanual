---
title: "The Full-Table Scan"
guide: "why-is-my-query-slow"
phase: 1
summary: "A database with no help reads every single row to find your matches — a full-table scan. That's invisible on 100 rows and brutal on 10 million, which is why a query is fast on your laptop and dying in prod."
tags: [databases, full-table-scan, seq-scan, query-performance, sql]
difficulty: intermediate
synonyms: ["what is a full table scan", "what is a sequential scan", "why does my query get slower with more rows", "why is my query slow in production", "why does the database read every row"]
updated: 2026-07-10
---

# The Full-Table Scan

Let's name the feeling first, because it's a specific kind of betrayal. You tested the query. It worked. It was *fast*. Then the same query, untouched, falls over in production. It's easy to suspect the database is broken, or that prod is "just slow," or that you did something subtly wrong. None of those is the real story.

Here's the real story: the query was always doing the same expensive thing. On your laptop that expense was too small to notice. In production it isn't. Once you can see *what* expensive thing it's doing, the surprise disappears — and so does the fear.

## What the database actually does to find a row

When you ask for specific rows — say, the user whose email is `ada@example.com` — the database has to *find* them. If you haven't given it any help, it has exactly one strategy: start at the first row of the table, look at it, check if it matches, move to the next, and repeat until it has checked **every single row**. This is called a **full-table scan** (PostgreSQL calls it a *sequential scan* or *seq scan*; MySQL calls it a *full table scan*). Same idea everywhere: read the whole table, top to bottom, because it has no faster way to know where your row lives.

📝 **Terminology.** A *full-table scan* (a.k.a. *sequential scan* / *seq scan*) means the database reads every row in the table to answer your query. It's not a bug — it's the database's fallback when it has no shortcut to your data.

**Why people get this wrong.** The intuitive picture is that the database "knows where things are," like looking up a word in a dictionary. It doesn't — not by default. A plain table is an unordered pile of rows. Asking an unordered pile "which of you has email `ada@example.com`?" has no clever answer. You have to ask each row, one at a time. The database is doing the dumbest possible thing not because it's dumb, but because nothing has told it where to look.

## Why 100 rows lies to you

**What it does in real life.** A full-table scan costs roughly one unit of work *per row*. So the cost grows in a straight line with the size of the table:

```text
   Finding one matching row, no index — work grows with the table:

   table size        rows the DB must read        feels like
   ----------        ---------------------        ----------
   100 rows          up to 100                     instant
   10,000 rows       up to 10,000                  still fine
   1,000,000 rows    up to 1,000,000               a noticeable pause
   10,000,000 rows   up to 10,000,000              timeout / 2am page
```

(The row counts are exact; the "feels like" column is a rough illustration, not a benchmark — actual timing depends on your hardware, row size, and caching.)

On your laptop, scanning 100 rows is so fast it's indistinguishable from instant. That's the trap: **small data hides the scan.** The query and the production query are doing the identical thing — reading the whole table — but "the whole table" went from 100 rows to ten million. Nothing got slower. The table got bigger, and the cost was always proportional to the table.

```text
   The same query, two table sizes:

   LAPTOP (100 rows)
   [r][r][r] ... [r]                    ← scan all 100, done before you blink
    ▲──────── checked every row ───────▲

   PRODUCTION (10,000,000 rows)
   [r][r][r][r][r][r][r][r] ... ... ... [r][r][r]
    ▲──────────── checked every one of ten million rows ────────────▲
                                                         (this is the hang)
```

## Seeing it with your own eyes

You don't have to take this on faith. Every major database can tell you its plan for a query — we'll cover that tool properly in [Phase 3](03-reading-explain.md), but here's a first taste so you can connect the idea to something concrete:

```sql
EXPLAIN SELECT * FROM users WHERE email = 'ada@example.com';
```

```console
                          QUERY PLAN
-----------------------------------------------------------------
 Seq Scan on users  (cost=0.00..189431.00 rows=1 width=124)
   Filter: (email = 'ada@example.com'::text)
```

*What just happened:* The database told you its plan in the first two words: **`Seq Scan`**. That means "I'm going to read the whole `users` table and filter as I go." The `cost=...189431.00` is the planner's own estimate of how much work that is (an abstract unit, not seconds, and the exact number here is illustrative) — and it's large *because the table is large*. The `rows=1` at the end is how many rows it expects to *return*. Read that line again: it expects to return **one** row, but its plan is to **read the entire table to find it**. That gap — read millions, return one — is the whole problem in a single line.

⚠️ **Gotcha.** A full-table scan isn't always wrong. If your query genuinely needs *most* of the rows (`SELECT * FROM users` with no filter, or `WHERE status = 'active'` when 90% of users are active), reading the whole table really is the fastest plan — jumping around to fetch nearly everything is slower than a clean sweep. The scan only becomes a problem when you're reading millions of rows to return a handful. "Read a lot, return a little" is the smell.

**Why this saves you later.** Once "fast on my laptop, dying in prod" has a name — *the table grew and the scan grew with it* — you stop blaming the database, the network, or yourself. You start asking the one productive question: *how do I let the database find these rows without reading all of them?* That's exactly what an index is for, and it's next.

## Recap

1. **To find rows, a database with no help reads every row** — a full-table scan (a.k.a. sequential scan / seq scan).
2. **A plain table is an unordered pile.** There's no shortcut to a specific row unless you build one.
3. **Scan cost grows with table size**, roughly one unit of work per row — so it's invisible on 100 rows and brutal on 10 million.
4. **Small test data hides the scan.** "Fast on my laptop, slow in prod" is almost always the same query meeting a much bigger table.
5. **The smell is "read a lot, return a little."** A scan that reads millions to return a handful is the thing to fix. A scan that returns most of the table is often fine.

The fix is to give the database a shortcut — a separate, sorted structure it can jump around in instead of reading everything. That's an index, and it's the heart of the next phase.

---

[← Guide overview](_guide.md) · [Phase 2: Indexes →](02-indexes.md)
