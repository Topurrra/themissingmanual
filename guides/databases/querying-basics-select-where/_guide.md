---
title: "SELECT, WHERE & Friends: Querying Basics"
guide: "querying-basics-select-where"
phase: 0
summary: "How to read and change data with SQL: the SELECT query shape, filtering and sorting with WHERE/ORDER BY/LIMIT, and adding/changing/removing rows with INSERT/UPDATE/DELETE — without the career-defining accidents."
tags: [sql, select, where, insert, update, delete, queries, databases, beginner-friendly]
category: databases
order: 2
difficulty: beginner
synonyms: ["how to write a sql query", "sql select for beginners", "what does WHERE do in sql", "how to filter rows in sql", "sql insert update delete explained", "learn sql querying"]
updated: 2026-06-19
---

# SELECT, WHERE & Friends: Querying Basics

You've got a database. Somewhere in it are the rows you actually need — the user who can't log in,
the orders from last Tuesday, the one record someone asked you to fix "real quick." SQL is how you
ask for them. But staring at a blank query window, it's easy to feel like you're supposed to already
know the magic words.

There aren't magic words. There's a small, learnable shape that almost every query follows, and once
you can see that shape, you can reason your way to the data instead of guessing. This guide walks you
through it calmly: how to ask for data, how to narrow it down to exactly what you want, and how to
change it — including the one mistake that has ended a few people's afternoons (and we'll make sure it
never ends yours).

We'll use one small example table the whole way through — a `users` table — so you're always learning
the idea, not re-learning a new dataset.

## How to read this
- **Need to grab some data right now?** Start with [Phase 1: Asking for Data](01-asking-for-data.md) —
  it's the core query shape and you'll be productive by the end of it.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: ask for data,
  then narrow it, then change it.

## The phases
1. **[Asking for Data: SELECT ... FROM](01-asking-for-data.md)** — the shape every query starts from,
   picking columns vs. grabbing everything, and how to read the result set.
2. **[Filtering & Sorting: WHERE, ORDER BY, LIMIT](02-filtering-and-sorting.md)** — narrowing down to
   the rows you want (`=`, `>`, `LIKE`, `IN`, `AND`/`OR`), ordering them, and taking only the top few.
   Includes the `NULL` trap that confuses everyone.
3. **[Changing Data: INSERT, UPDATE, DELETE](03-changing-data.md)** — adding rows, modifying them, and
   removing them — and the missing-`WHERE` accident that rewrites or erases your whole table, plus how
   to never let it stick.

> This guide is about the day-one querying you'll reach for constantly. Joining data across multiple
> tables, grouping and counting with `GROUP BY`, and subqueries are their own topics — they live in
> follow-up guides like [SQL Joins, Explained](/guides/sql-joins-explained), so this one stays focused
> and finishable.

Related reading: [What a Database Actually Is](/guides/what-a-database-is) ·
[Relationships & Keys](/guides/relationships-and-keys) ·
[SQL Joins, Explained](/guides/sql-joins-explained)
