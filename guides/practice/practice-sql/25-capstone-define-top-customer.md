---
title: "Capstone: define \"top customer\" before you query it"
guide: practice-sql
phase: 25
summary: "COUNT and SUM both produce a perfectly correct query - and a different winner. The bug isn't in your SQL. It's in the question nobody pinned down."
tags: [sql, group-by, aggregate, ambiguity, capstone, order-by]
difficulty: advanced
synonyms:
  - sql count vs sum group by
  - top customer by orders vs revenue
  - ambiguous business question sql
  - group by order by limit 1
updated: 2026-07-16
---

# Capstone: define "top customer" before you query it

Every earlier lesson in this module had one right answer and your job was to
find the SQL that produced it. This one is different, and it's the most
important trap in the whole ladder: **two queries can both be flawless SQL
and still answer different questions.**

A stakeholder asks: "who's our #1 customer?" You open `orders` and see two
customers. `Ana` placed one order worth `500`. `Luka` placed five smaller
orders - `20`, `15`, `18`, `22`, `25` - that add up to `100`.

Run the number of orders per customer, and `Luka` wins, 5 orders to 1. Run
total money spent per customer, and `Ana` wins, `500` to `100`. Nobody wrote
a bug. Both queries are correct SQL. They're just correct answers to two
different questions that both sound like "who's our #1 customer?" in casual
English.

This is why the task below doesn't say "top customer" and leave it there. It
pins the definition down first: **top customer means the one who generated
the most total revenue.** Once the question is that specific, there's only
one right query - the ambiguity was never in the syntax, it was in the
sentence before you ever opened an editor.

**Your task:** find the top customer by **total revenue** (sum of `amount`
across their orders). Return their `name` and their `total`. The answer is
`Ana`, `500`.

**You'll practice:**

- Recognizing when two aggregate queries (`COUNT` vs `SUM`) are both correct SQL for different questions
- Treating a vague requirement as something to pin down, not something to guess at
- Using `ORDER BY ... LIMIT 1` to pick a single winner from a `GROUP BY`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, amount INTEGER);\nINSERT INTO orders (id, customer, amount) VALUES\n  (1, 'Ana', 500),\n  (2, 'Luka', 20),\n  (3, 'Luka', 15),\n  (4, 'Luka', 18),\n  (5, 'Luka', 22),\n  (6, 'Luka', 25);",
  "starterCode": "-- \"Who's our #1 customer?\" This counts orders, not revenue - it picks the wrong customer. Fix it to rank by total revenue.\nSELECT customer AS name, COUNT(*) AS total FROM orders GROUP BY customer ORDER BY total DESC LIMIT 1;",
  "solution": "SELECT customer AS name, SUM(amount) AS total FROM orders GROUP BY customer ORDER BY total DESC LIMIT 1;",
  "hints": [
    "Run the starter query and look at what it picked, then look at the orders table yourself and add up what each customer actually spent. Do those two things agree?",
    "COUNT(*) counts rows - how many orders someone placed. That's not the same question as how much money they spent. The task asks for total revenue.",
    "Swap COUNT(*) for SUM(amount): SELECT customer AS name, SUM(amount) AS total FROM orders GROUP BY customer ORDER BY total DESC LIMIT 1;"
  ]
}
```
