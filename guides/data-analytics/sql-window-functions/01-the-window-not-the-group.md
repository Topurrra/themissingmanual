---
title: "The window, not the group"
guide: sql-window-functions
phase: 1
summary: "The analyst superpower: running totals, rankings, and row-to-row comparisons without collapsing rows. OVER, PARTITION BY, and lag and lead."
tags: [sql, window-functions, analytics, ranking, running-total]
difficulty: intermediate
synonyms: [sql window functions, sql running total, partition by, row_number vs rank, lag lead sql, moving average sql, top n per group sql, over clause sql]
updated: 2026-07-11
---

# The window, not the group

Picture the wall you keep hitting. You have a table of sales, one row per order, and your boss asks three questions in a row:

- "What was each salesperson's total?" - fine, `GROUP BY` handles that.
- "Now show me *every* order, but next to each one, that salesperson's running total so far." - and you freeze.

The second question is different in kind: you still want all the orders on screen, and you also want a calculation that spans many rows. `GROUP BY` can't do both at once, because doing the calculation is exactly how it destroys the rows.

## What GROUP BY actually does to your rows

`GROUP BY` is a meat grinder. Many rows go in; one row per group comes out. That's the whole point of it, and it's the right tool when you genuinely want a summary.

```sql
SELECT salesperson, SUM(amount) AS total
FROM sales
GROUP BY salesperson;
```

```text
salesperson | total
------------+------
Ana         |  900
Ben         |  500
```

*What just happened:* six order rows became two summary rows. The individual orders - their dates, amounts, IDs - are gone. You can't ask "what was Ana's third order?" anymore, because there's no third order in the result. The detail was the price of the summary.

That tradeoff is fine until you need the detail *and* the math together. Then you need a different tool.

## What a window function does instead

A window function does the same family of math - `SUM`, `COUNT`, `AVG`, ranking, comparisons - but it computes each row's answer by looking at a *window* of related rows, and then it **writes the answer onto that row and keeps the row**. Nothing collapses. The row count of your result is the row count you started with.

```sql
SELECT
  salesperson,
  amount,
  SUM(amount) OVER (PARTITION BY salesperson) AS person_total
FROM sales;
```

```text
salesperson | amount | person_total
------------+--------+-------------
Ana         |    400 |          900
Ana         |    300 |          900
Ana         |    200 |          900
Ben         |    250 |          500
Ben         |    250 |          500
```

*What just happened:* every original order is still here - five rows in, five rows out. But each row now carries its salesperson's total in a new column. The `SUM` looked across each person's whole window and stamped the answer onto every row in it. That single word - `OVER` - is the line between grouping and windowing: it tells SQL not to fold the rows away, just compute over them.

> The mental model in one sentence: **`GROUP BY` removes rows to make a summary; a window function adds a column without removing a row.**

## The window is "the rows related to this one"

The word *window* is doing real work. For each row, SQL opens a window onto a set of other rows, and you decide which rows belong in it. In the example above, the window for any Ana row was "all the Ana rows," because we said `PARTITION BY salesperson`. The function ran over that window and reported back.

That's the entire idea. The rest of this guide is about controlling the window precisely:

- Which rows share a window? (`PARTITION BY`)
- In what order does the window count? (`ORDER BY` - this is what makes a *running* total run)
- How wide is the window around the current row? (the frame - phase 3)

Get those three knobs right and you can answer almost any "compare across rows but keep the rows" question.

## Why analysts care so much about this

Before window functions were widely supported, these questions were genuinely painful to answer: self-joins that ran slowly and read like a riddle, or exporting to a spreadsheet and dragging formulas. Rankings, running totals, "compared to last month," "top 3 per category" - all of it was awkward. Window functions turned a category of hard problems into readable, single-pass SQL.

For builders: this matters beyond reporting. Deduplication ("keep the newest row per key"), sessionization ("group events into sessions"), and gap detection ("find the missing sequence numbers") are all window-function patterns hiding in everyday application data work. If you've ever written a tangled subquery to keep "the latest record per user," phase 3 has a cleaner answer waiting.

A window function and a `GROUP BY` are not rivals - they answer different questions. Want a smaller table of summaries? Group. Want your full table with extra computed columns? Window. Knowing which question you're being asked is half the skill.

```quiz
[
  {
    "q": "What is the key difference between GROUP BY and a window function?",
    "choices": [
      "Window functions are faster than GROUP BY in every case",
      "GROUP BY collapses rows into summaries; a window function keeps every row and adds a computed column",
      "Window functions can only compute SUM, while GROUP BY can do AVG and COUNT",
      "GROUP BY works on numbers; window functions work on text"
    ],
    "answer": 1,
    "explain": "GROUP BY reduces many rows to one per group. A window function computes over related rows but leaves every original row in place."
  },
  {
    "q": "Which clause signals that you want a calculation done over a window rather than collapsing rows?",
    "choices": ["GROUP BY", "HAVING", "OVER", "DISTINCT"],
    "answer": 2,
    "explain": "OVER is the keyword that turns an aggregate into a window function. It tells SQL to compute across related rows without folding them away."
  },
  {
    "q": "You run SELECT amount, SUM(amount) OVER (PARTITION BY person) FROM sales on a 5-row table. How many rows come back?",
    "choices": ["1", "One per person", "5", "It depends on the SUM value"],
    "answer": 2,
    "explain": "Window functions never reduce the row count. Five rows in means five rows out, each with the windowed sum attached."
  }
]
```

[← Overview](_guide.md) | [Phase 2: OVER, PARTITION BY, ORDER BY →](02-over-partition-order.md)
