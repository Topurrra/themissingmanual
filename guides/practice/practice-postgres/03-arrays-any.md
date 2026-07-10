---
title: "Arrays: a column that holds a list"
guide: practice-postgres
phase: 3
summary: "Use TEXT[] array columns and the = ANY(array) operator to check whether a value is one of several stored directly in a row."
tags: [postgres, arrays, any-operator]
difficulty: intermediate
synonyms:
  - postgres array column
  - text array sql
  - any array operator postgres
  - postgres array contains value
updated: 2026-07-10
---

# Arrays: a column that holds a list

Tagging a blog post with three tags usually means a junction table: a
`post_tags` table with one row per post-tag pairing. That's the right call
when tags need their own metadata or you're querying them heavily - but for a
short, simple list attached to a row, Postgres lets you skip the extra table
entirely with a genuine array column type, `TEXT[]`.

To check whether a specific value is one of the elements in an array column,
use `= ANY(column)`. It's not a text search on some comma-joined string -
`tags` really is a list, and `ANY` checks list membership directly.

You have an `articles` table with columns `id`, `title`, and `tags` (a
`TEXT[]`).

**Your task:** return the `title` of every article tagged `'sql'`.

**You'll practice:**

- Reading an array column
- Checking array membership with `value = ANY(column)`

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE articles (id INTEGER PRIMARY KEY, title TEXT, tags TEXT[]);\nINSERT INTO articles (id, title, tags) VALUES\n  (1, 'Intro to SQL', ARRAY['sql', 'beginner']),\n  (2, 'Postgres Arrays', ARRAY['sql', 'postgres', 'arrays']),\n  (3, 'Docker Basics', ARRAY['docker', 'devops']);",
  "starterCode": "-- Return the title of every article tagged 'sql'.\nSELECT title, tags FROM articles;",
  "solution": "SELECT title FROM articles WHERE 'sql' = ANY(tags);",
  "hints": ["'sql' = ANY(tags) checks whether 'sql' is one of the elements inside the tags array - not whether tags equals 'sql'.", "tags is a real TEXT[] column, not a comma-separated string - no string-splitting or LIKE needed.", "Two articles are tagged sql: Intro to SQL and Postgres Arrays. Docker Basics isn't."]
}
```
