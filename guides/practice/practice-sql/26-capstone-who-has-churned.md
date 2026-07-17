---
title: "Capstone: who has churned"
guide: practice-sql
phase: 26
summary: "The module's hardest question, three traps stacked into one: aggregate-only queries erase customers with zero orders, HAVING has to look at the newest order, and the LEFT JOIN it needs brings back NULL that HAVING must catch too."
tags: [sql, join, left-join, group-by, having, null, aggregate, capstone]
difficulty: advanced
synonyms:
  - sql find customers who churned
  - group by having max date
  - left join with having null
  - customers with no recent orders
  - churn query sql
updated: 2026-07-16
---

# Capstone: who has churned

Every lesson in this module has taught you one trap at a time. This one asks
a single, ordinary-sounding business question and makes you use three of
those lessons at once, because leaving any one of them out gives you a wrong
answer that still looks plausible.

**Churned** means: no order on or after **2026-04-01**, including a customer
who has never placed an order at all. That reporting date is fixed - treat it
as "today" for this exercise, not something to compute. A live `date('now')`
would make the right answer drift depending on when the query happens to run,
so the date is spelled out as a literal string instead.

Here's why each trap matters on its own. Group by `customer_id` and join
`orders` normally, and a customer with zero rows in `orders` never enters the
grouped result at all - they're not "not churned", they simply don't exist in
the output, so the report undercounts churn without any error to notice. Use
`MIN(order_date)` instead of `MAX(order_date)`, and a customer who ordered
constantly but stopped in March reads as active because their very first
order was recent. And once you fix the first trap with a `LEFT JOIN`, the
customer with no orders shows up with `order_date` as `NULL` on every column
- so `MAX(order_date)` for them is `NULL`, and `NULL < '2026-04-01'` is
`NULL`, not `true`. `HAVING` keeps only `true`, so that customer quietly
drops right back out unless you check for `NULL` explicitly.

`customers`: five people. `orders`: `Ana` ordered recently, `Luka` only ever
ordered back in January, `Marta` ordered twice - once in November and once in
June, and only the June order should count - `Elin`'s only order is from last
October, and `Ben` has never placed one.

**Your task:** return the `name` of every churned customer - no order on or
after `2026-04-01`, including anyone with no orders at all. The answer is
`Luka`, `Elin`, and `Ben`.

**You'll practice:**

- Using `LEFT JOIN` so customers with zero matching rows survive a `GROUP BY`
- Aggregating with `MAX()` to judge recency instead of first activity
- Handling the `NULL` a `LEFT JOIN` produces inside `HAVING`, not just `WHERE`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO customers (id, name) VALUES\n  (1, 'Ana'),\n  (2, 'Luka'),\n  (3, 'Marta'),\n  (4, 'Ben'),\n  (5, 'Elin');\n-- Reporting date is frozen at 2026-04-01 - do not replace it with date('now').\nCREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, amount INTEGER);\nINSERT INTO orders (id, customer_id, order_date, amount) VALUES\n  (1, 1, '2026-06-20', 40),\n  (2, 2, '2026-01-15', 60),\n  (3, 3, '2026-06-01', 25),\n  (4, 3, '2025-11-01', 90),\n  (5, 5, '2025-10-01', 15);",
  "starterCode": "-- Reporting date is frozen at 2026-04-01. Return the name of every churned customer (no order on or after that date, including customers with no orders at all).\nSELECT c.name\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nHAVING MAX(o.order_date) < '2026-04-01';",
  "solution": "SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nHAVING MAX(o.order_date) < '2026-04-01' OR MAX(o.order_date) IS NULL;",
  "hints": [
    "Run the starting query and count: there are 5 customers, and 2 of them (Ana, Marta) clearly ordered recently, so 3 should come back as churned. How many names does the query actually return? Look at Ben's row in the customers table and his (missing) rows in orders.",
    "The starting query uses a plain JOIN, so a customer with zero matching rows in orders never even reaches GROUP BY - they're gone before HAVING gets a chance to judge them. Switch to LEFT JOIN so every customer survives, then look at what MAX(order_date) becomes for a customer whose only joined row has order_date = NULL.",
    "LEFT JOIN customers to orders, then in HAVING catch both cases: a real last order before the cutoff, or no orders at all (MAX comes back NULL). SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id HAVING MAX(o.order_date) < '2026-04-01' OR MAX(o.order_date) IS NULL;"
  ]
}
```
