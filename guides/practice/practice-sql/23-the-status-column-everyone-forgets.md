---
title: "The status column everyone forgets"
guide: practice-sql
phase: 23
summary: "COUNT(*) counts every row that was ever inserted, not everyone still active. A status column changes what 'how many do we have' even means."
tags: [sql, count, where, status, soft-delete]
difficulty: advanced
synonyms:
  - count only active rows sql
  - sql count with status column
  - why does count include terminated rows
  - soft delete status column sql
  - count where status equals active
updated: 2026-07-16
---

# The status column everyone forgets

Almost every real table has one of these: `status`, `state`, `is_active`,
`deleted_at`. Rows don't disappear when something changes in the real world -
an employee leaves, a subscription lapses, an order gets cancelled - the row
stays put and a column gets updated to say so. Nothing you've queried so far
has had one of these columns. This one does.

⚠️ **Gotcha.** `COUNT(*)` counts every row in the table, full stop. It has no
idea that `status` exists, let alone what value in it means "still here." A
table can hold rows for people who left the company two years ago, and
`COUNT(*)` will cheerfully add them to the head count anyway.

There's a new `employees` table: `id`, `name`, `status`. Four employees are
`active`, two are `terminated`, and one is `on_leave`.

**Your task:** how many employees do we currently have? Define "currently"
as `status = 'active'` - someone `on_leave` is still employed but isn't
counted here, and someone `terminated` obviously isn't either. The answer is
`4`.

**You'll practice:**

- Filtering with `WHERE` before you aggregate with `COUNT`
- Noticing that a row existing in a table and a row still being "current" are two different things

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, status TEXT);\nINSERT INTO employees (id, name, status) VALUES\n  (1, 'Ana', 'active'),\n  (2, 'Luka', 'active'),\n  (3, 'Ben', 'active'),\n  (4, 'Sam', 'active'),\n  (5, 'Marta', 'terminated'),\n  (6, 'Elin', 'terminated'),\n  (7, 'Priya', 'on_leave');",
  "starterCode": "-- How many employees do we currently have?\nSELECT COUNT(*) AS total FROM employees;",
  "solution": "SELECT COUNT(*) AS total FROM employees WHERE status = 'active';",
  "hints": [
    "Run it and look at the number. Then count the rows in the employees table by hand - do they match? What does that tell you about what COUNT(*) is actually counting?",
    "COUNT(*) has no idea a status column exists. It counts every row, including the terminated ones and the one on_leave. You need to narrow the rows down before counting them.",
    "Add a WHERE clause that keeps only the current employees, then count what's left: SELECT COUNT(*) AS total FROM employees WHERE status = 'active';"
  ]
}
```
