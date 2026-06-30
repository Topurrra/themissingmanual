---
title: "Build an Expense Analytics Report (SQL)"
guide: sql-expense-analytics
phase: 0
summary: "Go from a raw expenses table to a real monthly report in SQL — grouping, aggregates, and window functions — all runnable in your browser."
tags: [sql, project, analytics, window-functions, sqlite]
category: projects
group: "Run-Along Projects"
order: 4
difficulty: intermediate
synonyms:
  - sql analytics project
  - expense report sql
  - window functions tutorial
  - group by and sum
  - running total sql
  - monthly spend report
updated: 2026-06-30
---

# Build an Expense Analytics Report (SQL)

You have a pile of expenses. A few dozen rows: groceries, rent, the streaming
subscription you keep meaning to cancel. Someone — your future self, a manager,
a spouse — wants to know where the money went. Not the raw list. The story.
How much per category. How each month compares to the last. Whether spending is
creeping up.

That story is a SQL report, and over this weekend you're going to build it from
nothing. By the last phase you'll have one query that answers all of those
questions at once, and you'll understand every line of it.

## What you'll build

A single expense analytics report, assembled in four steps:

1. A `expenses` table with realistic seed data you can query.
2. Spend broken down by category and by month, using `GROUP BY` and `SUM`.
3. A running total and a month-over-month change, using window functions
   (`SUM() OVER` and `LAG`).
4. One final report query that ties the pieces together — category share of
   total, plus the monthly trend — that you could drop into a real dashboard.

## The stack

SQLite. That's it. No server to install, no account to create, no schema
migrations. **This whole project runs in your browser** — every code block on
these pages has a Run button. Press it and the SQL executes against a fresh,
in-memory SQLite database right on the page, and you see the rows it returns.

Because each block runs in isolation, every runnable block on every page
re-creates the table and re-inserts the data before it queries. That's
deliberate. It means you can run any block on its own, in any order, and always
get a result — and it means you can change a number, re-run, and immediately
see what moved.

## Roughly how long

A focused weekend afternoon — two to three hours if you run every block and
poke at the queries, which you should. None of the phases are long. The point
isn't volume; it's that each one leaves you with a working piece you understand.

## What you'll learn

| Phase | The technique | Why it matters |
|-------|---------------|----------------|
| 1 | `CREATE TABLE`, `INSERT`, `SELECT` | Get data in and look at it |
| 2 | `GROUP BY`, `SUM`, `ORDER BY` | Collapse rows into totals |
| 3 | `SUM() OVER`, `LAG`, frames | Compute across rows without losing them |
| 4 | Subqueries + the pieces combined | Turn techniques into a real report |

If you've written a `SELECT * FROM` before but `GROUP BY` still feels fuzzy and
window functions feel like wizardry, this is aimed squarely at you. By the end,
neither one will.

## How to use these pages

Read a phase, then run the block. Then change something — add an expense, swap a
category, shift a date into a different month — and run it again. SQL clicks
when you watch the output move in response to the input. The browser makes that
loop instant, so use it.

Let's build the table.
