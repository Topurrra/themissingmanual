---
title: "Many-to-many: joining through a junction table"
guide: practice-sql
phase: 14
summary: "Chain two JOINs through a junction table to answer a many-to-many question, like which courses each student is enrolled in."
tags: [sql, join, many-to-many, junction-table]
difficulty: intermediate
synonyms:
  - sql many to many join
  - junction table sql example
  - join three tables sql
  - association table sql
updated: 2026-07-10
---

# Many-to-many: joining through a junction table

The `JOIN` you've used so far links two tables with a straightforward
one-to-many shape: one user, many orders. But some relationships go both
ways - a student takes many courses, and a course has many students. Neither
table can hold that link directly; a `course_id` column on `students` would
only fit one course per student.

The fix is a third table that exists purely to record the pairings: a
**junction table**. Each row in it means "this student is in this course" -
two foreign keys, nothing else. To answer a question that spans the
many-to-many relationship, you join through it: student → junction row →
course.

There are three tables: `students` (`id`, `name`), `courses` (`id`, `title`),
and `enrollments` (`student_id`, `course_id`) - the junction table linking
them.

**Your task:** return each student's `name` alongside the `title` of every
course they're enrolled in - one row per enrollment.

**You'll practice:**

- Joining through a junction table with two `JOIN ... ON` clauses
- Seeing why many-to-many relationships need a third table, not a shared column

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO students (id, name) VALUES (1, 'Ana'), (2, 'Luka'), (3, 'Marta');\nCREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT);\nINSERT INTO courses (id, title) VALUES (1, 'Calculus'), (2, 'History'), (3, 'Art');\nCREATE TABLE enrollments (student_id INTEGER, course_id INTEGER);\nINSERT INTO enrollments (student_id, course_id) VALUES (1, 1), (1, 2), (2, 1), (3, 3);",
  "starterCode": "-- Return each student's name and the title of every course they're enrolled in.\nSELECT * FROM enrollments;",
  "solution": "SELECT students.name, courses.title FROM students JOIN enrollments ON enrollments.student_id = students.id JOIN courses ON courses.id = enrollments.course_id;",
  "hints": ["enrollments only has two id columns - it's the bridge, not the data you want to display.", "Join students to enrollments on students.id = enrollments.student_id, then enrollments to courses on enrollments.course_id = courses.id.", "Ana takes two courses, so she appears in two rows - one per enrollment, not one per student."]
}
```
