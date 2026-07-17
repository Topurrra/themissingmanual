---
title: "Fix the bug: a JOIN that doubles your revenue"
guide: practice-sql
phase: 22
summary: "The query runs, the numbers look plausible, and they're wrong - a one-to-many JOIN is counting the same order twice. This is the most common reporting bug there is."
tags: [sql, join, aggregate, fan-out, sum, debugging]
difficulty: advanced
synonyms:
  - sql join inflates sum
  - join doubles total revenue
  - one to many join sum bug
  - fan out aggregate sql
  - why is my sum too high sql
updated: 2026-07-16
---

# Fix the bug: a JOIN that doubles your revenue

The last two lessons had queries that returned obviously wrong answers - zero
rows, or too few rows. This bug is worse, because the output *looks* like a
real report. Right column names, right shape, numbers in a sane range. You'd
have to already know the right answer to catch it just by looking.

`orders` holds one row per order. `shipments` holds one row per shipment -
and some orders ship in more than one package, so they get more than one row
in `shipments`. Joining `orders` to `shipments` to find out who has a shipped
order is fine. Joining them and then `SUM`ing the order amount is not: an
order with two shipment rows joins into two output rows, and `SUM` adds its
amount in twice. The order didn't get more expensive. It just has more rows
next to it.

Look at Ana. She has two orders, worth 100 and 50. Her first order shipped in
two packages. Add the shipment counts and you can already see the fan-out
coming before you touch a query.

**Your task:** return each customer's total revenue, counting only orders
that have shipped, without double-counting an order that shipped in more than
one package. The answer is `Ana 150`, `Luka 200`, `Marta 80`.

**You'll practice:**

- Noticing a `JOIN` + `SUM` that inflates totals when the joined table has
  more than one row per parent
- Filtering "has at least one match" with `EXISTS` instead of joining and
  summing over the duplicates

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, amount INTEGER);\nINSERT INTO orders (id, customer, amount) VALUES\n  (1, 'Ana', 100),\n  (2, 'Ana', 50),\n  (3, 'Luka', 200),\n  (4, 'Marta', 80);\nCREATE TABLE shipments (id INTEGER PRIMARY KEY, order_id INTEGER, carrier TEXT);\nINSERT INTO shipments (id, order_id, carrier) VALUES\n  (1, 1, 'DHL'),\n  (2, 1, 'FedEx'),\n  (3, 2, 'DHL'),\n  (4, 3, 'DHL'),\n  (5, 3, 'FedEx'),\n  (6, 4, 'DHL');",
  "starterCode": "-- Total revenue per customer, shipped orders only. Ana's total looks too high - fix it.\nSELECT o.customer, SUM(o.amount) AS total FROM orders o JOIN shipments s ON s.order_id = o.id GROUP BY o.customer;",
  "solution": "SELECT o.customer, SUM(o.amount) AS total FROM orders o WHERE EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id) GROUP BY o.customer;",
  "hints": [
    "Run it and check Ana by hand: her two orders are worth 100 and 50, so 150. The query says 250. Count her rows in shipments - order 1 has two.",
    "JOIN produces one output row per matching shipment, not per order. An order with two shipment rows joins into two rows, and SUM adds its amount in twice - the shipments table is one-to-many with orders.",
    "Don't JOIN to shipments at all. Filter with EXISTS to keep orders that have at least one shipment, then SUM without ever duplicating a row: SELECT o.customer, SUM(o.amount) AS total FROM orders o WHERE EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id) GROUP BY o.customer;"
  ]
}
```
