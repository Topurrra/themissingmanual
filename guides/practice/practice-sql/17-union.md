---
title: "UNION: combining two result sets"
guide: practice-sql
phase: 17
summary: "Stack two SELECTs into one result with UNION, and see how it differs from UNION ALL - deduplicated versus every row kept."
tags: [sql, union, union-all, set-operations]
difficulty: intermediate
synonyms:
  - sql union example
  - union vs union all
  - combine two select statements sql
  - stack query results sql
updated: 2026-07-10
---

# UNION: combining two result sets

Every query so far has pulled rows from one place - one table, or one set of
joined tables. `UNION` does something different: it stacks the results of
*two separate* `SELECT` statements into a single result, one on top of the
other. The two selects need the same number of columns, in compatible types,
but they can come from entirely different tables.

`UNION` also removes duplicate rows automatically, the same way `SELECT
DISTINCT` would - if the same row shows up from both sides, you only see it
once. `UNION ALL` is the other option: it keeps every row, duplicates
included, and is faster since it skips the dedup step. Reach for `UNION` when
a repeated value should only count once; reach for `UNION ALL` when you want
the raw combined total.

There are two tables: `customers` (`id`, `email`) and `suppliers` (`id`,
`email`) - one email, `ana@x.com`, happens to appear in both.

**Your task:** return one column of every distinct email address across both
`customers` and `suppliers`, with no duplicates.

**You'll practice:**

- Combining two `SELECT` statements with `UNION`
- Seeing `UNION` collapse a value that appears in both source tables into one row

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE customers (id INTEGER PRIMARY KEY, email TEXT);\nINSERT INTO customers (id, email) VALUES (1, 'ana@x.com'), (2, 'luka@x.com'), (3, 'marta@x.com');\nCREATE TABLE suppliers (id INTEGER PRIMARY KEY, email TEXT);\nINSERT INTO suppliers (id, email) VALUES (1, 'sam@x.com'), (2, 'ana@x.com'), (3, 'ben@x.com');",
  "starterCode": "-- Return every distinct email from both customers and suppliers, combined into one column.\nSELECT email FROM customers;",
  "solution": "SELECT email FROM customers UNION SELECT email FROM suppliers;",
  "hints": ["Write two full SELECT statements - one per table - joined by UNION, not a JOIN.", "Both SELECTs return one column (email), so UNION can stack them directly.", "ana@x.com is in both tables but UNION shows it only once - that's the dedup UNION does automatically."]
}
```
