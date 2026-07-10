---
title: "SQL Joins, Finally Explained"
guide: "sql-joins-explained"
phase: 0
summary: "What a JOIN actually is, why your data lives in separate tables in the first place, and how INNER, LEFT, and the others stitch those tables back together without surprising you."
tags: [sql, joins, inner-join, left-join, databases, relational]
category: databases
order: 4
difficulty: beginner
synonyms: ["what is a sql join", "inner join vs left join", "how do joins work", "why use a join", "sql join explained for beginners", "join two tables sql"]
updated: 2026-07-10
---

# SQL Joins, Finally Explained

You learned to split your data into separate tables — users in one place, orders in another, linked by an id. That was the right call. But now every real question you want to ask ("which customer placed this order?") lives across *two* tables, and you're stuck. A `JOIN` is how you put them back together for a single query.

Joins confuse almost everyone at first, and it's not because you're slow — it's because nobody draws you the picture: a join is just **matching rows from one table to rows in another, using a shared key**. Once you can see that picture, INNER, LEFT, and the rest stop being magic words and become choices you make on purpose.

## How to read this
- **Need the difference between INNER and LEFT right now?** Jump to [Phase 2: INNER vs LEFT (and the Others)](02-inner-vs-left.md) — it leads with annotated queries and result tables.
- **Want joins to finally make sense?** Read in order. Phase 1 installs the mental model, Phase 2 shows the everyday joins, and Phase 3 covers the gotchas that bite people.

## The phases
1. **[Why Joins Exist](01-why-joins-exist.md)** — you split data into linked tables on purpose; a JOIN matches rows across them on the shared key. The core picture, with two tables becoming one result.
2. **[INNER vs LEFT (and the Others)](02-inner-vs-left.md)** — INNER (only matching rows), LEFT (every left row, NULLs where there's no match), plus a calm note on RIGHT and FULL. Each shown with a query and a result table side by side.
3. **[Join Gotchas](03-join-gotchas.md)** — the accidental cartesian explosion, NULLs from outer joins quietly breaking your `WHERE`, joining on the wrong columns, and how to sanity-check a join's row count.

> This guide is about *getting the right rows*. Making a slow join *fast* — indexes on join keys, how the database actually executes a join — is its own topic, covered in [Why Is My Query Slow?](/guides/why-is-my-query-slow).

> Related: [Relationships and Keys](/guides/relationships-and-keys) · [Querying Basics: SELECT & WHERE](/guides/querying-basics-select-where) · [Why Is My Query Slow?](/guides/why-is-my-query-slow)
