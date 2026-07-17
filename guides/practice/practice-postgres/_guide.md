---
title: "Postgres Practice"
guide: practice-postgres
phase: 0
summary: "Hands-on lessons on the features real Postgres has beyond standard SQL - JSONB, arrays, RETURNING, UUID keys, and upsert - against a real Postgres running in your browser."
tags: [postgres, practice, lessons, hands-on, jsonb, arrays]
category: practice
order: 8
difficulty: intermediate
synonyms:
  - postgres exercises
  - practice postgresql queries
  - learn postgres by doing
  - jsonb practice
updated: 2026-07-10
---

# Postgres Practice

Seven short, hands-on lessons on what Postgres adds on top of standard SQL: a
`JSONB` column for document-shaped data, arrays as a real column type,
`RETURNING` to get a row back from an `INSERT`, `UUID` primary keys generated
with `gen_random_uuid()`, and `ON CONFLICT DO UPDATE` for upserts. If you've
done the SQL Practice module, this picks up where it leaves off - same
Run-and-check format, but against a genuine Postgres instance (compiled to
WebAssembly, running entirely in your browser - no server, no setup).

Start with lesson 1. You can leave and come back any time - your code is saved locally.
