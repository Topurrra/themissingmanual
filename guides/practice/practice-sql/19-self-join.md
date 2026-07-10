---
title: "Self-join: a table joined to itself"
guide: practice-sql
phase: 19
summary: "Join a table to itself with two aliases to look up an employee's manager, who's stored as just another row in the same table."
tags: [sql, self-join, alias, join]
difficulty: intermediate
synonyms:
  - sql self join example
  - join table to itself
  - employee manager sql query
  - self join with alias
updated: 2026-07-10
---

# Self-join: a table joined to itself

Every join so far has connected two different tables. Sometimes the row you
need to match against lives in the *same* table - an employee's manager is
just another employee, stored in the very same `employees` table with the
very same columns. You can still `JOIN`, you just join the table to itself.

The trick is aliases: give the table two different names so the database (and
you) can tell "the employee" apart from "their manager" even though both
sides are pulling from `employees`.

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON e.manager_id = m.id;
```

*What just happened:* `e` and `m` are the same table, `employees`, aliased
twice. `e.manager_id = m.id` matches each employee row (`e`) to the row (`m`)
whose `id` equals that manager id - same mechanics as any other join, just
with both sides pointed at one table.

There's an `employees` table: `id`, `name`, `manager_id` (which points at
another row's `id` in the same table; the top of the org chart has
`manager_id` set to `NULL`).

**Your task:** return each employee's `name` alongside their manager's
`name`.

**You'll practice:**

- Joining a table to itself using two different aliases
- Matching a self-referencing foreign key (`manager_id`) back to the table's own `id`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);\nINSERT INTO employees (id, name, manager_id) VALUES (1, 'Grace', NULL), (2, 'Ana', 1), (3, 'Luka', 1), (4, 'Marta', 2);",
  "starterCode": "-- Return each employee's name alongside their manager's name.\nSELECT * FROM employees;",
  "solution": "SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id;",
  "hints": ["FROM employees e JOIN employees m ON ... treats the same table as two: e for the employee, m for the manager.", "The join condition is e.manager_id = m.id - match each employee's manager_id to the manager's own id.", "Grace has no manager (manager_id is NULL), so a plain JOIN drops her - only rows with a real match come back."]
}
```
