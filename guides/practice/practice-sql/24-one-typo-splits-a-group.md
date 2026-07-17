---
title: "One typo splits a group into three"
guide: practice-sql
phase: 24
summary: "GROUP BY groups by exact string match. A company typed four different ways becomes four different groups, and your count of 'who orders the most' quietly goes wrong."
tags: [sql, group-by, trim, lower, messy-data, debugging]
difficulty: advanced
synonyms:
  - group by case sensitive
  - group by ignoring whitespace
  - why does group by split the same value
  - normalize text before group by
  - trim lower group by sql
updated: 2026-07-16
---

# One typo splits a group into three

Nobody enforces spelling on a free-text field. A company name gets typed by
whoever is filling out the form that day - sometimes title case, sometimes
lowercase, sometimes with a stray leading space from a copy-paste. The
database doesn't reject any of it. It just stores four different-looking
strings that are, to a human, obviously the same company.

`GROUP BY` doesn't know that. It groups by exact string equality, so
`'Acme Inc'`, `'acme inc'`, and `' Acme Inc'` (note the leading space) are
three separate groups as far as the database is concerned - even though every
row in front of you is the same customer.

⚠️ **Gotcha.** `GROUP BY company` groups rows together only when their
`company` values are byte-for-byte identical. Casing differences and extra
whitespace are enough to split one real-world group into several, and each
split-off group gets its own `COUNT(*)` - none of which reflects the true
total.

**Your task:** find out which company sends the most orders.

**You'll practice:**

- Noticing that a `GROUP BY` result has more groups than there are real-world
  categories
- Normalizing text with `TRIM` and `LOWER` before grouping on it

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE orders (id INTEGER PRIMARY KEY, company TEXT, amount INTEGER);\nINSERT INTO orders (id, company, amount) VALUES\n  (1, 'Acme Inc', 120),\n  (2, 'Acme Inc', 80),\n  (3, 'acme inc', 60),\n  (4, ' Acme Inc', 45),\n  (5, 'Globex', 200),\n  (6, 'Globex', 150);",
  "starterCode": "-- Which company sends the most orders? This counts 4 groups, not 2 - fix it.\nSELECT company, COUNT(*) AS total FROM orders GROUP BY company;",
  "solution": "SELECT TRIM(LOWER(company)) AS company, COUNT(*) AS total FROM orders GROUP BY TRIM(LOWER(company));",
  "hints": [
    "Run it and read the result. There are six order rows and, to your eye, two real companies - but how many rows come back? If it's more than two, some of those groups are the same company counted separately.",
    "Look closely at the company text in each group: casing differs ('Acme Inc' vs 'acme inc'), and one row has a leading space. GROUP BY compares the raw string, so any difference in casing or whitespace creates a new group.",
    "Normalize the value before grouping on it, in both the SELECT list and the GROUP BY: SELECT TRIM(LOWER(company)) AS company, COUNT(*) AS total FROM orders GROUP BY TRIM(LOWER(company));"
  ]
}
```
