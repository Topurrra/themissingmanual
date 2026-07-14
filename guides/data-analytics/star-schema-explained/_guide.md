---
title: "The Star Schema, Explained"
guide: star-schema-explained
phase: 0
summary: "The dimensional-modeling pattern behind most data warehouses - one fact table surrounded by dimension tables - and why it's shaped that way on purpose."
tags: [star-schema, dimensional-modeling, data-warehouse, olap, data-analytics]
category: data-analytics
order: 11
difficulty: intermediate
synonyms:
  - what is a star schema
  - fact table vs dimension table
  - star schema vs snowflake schema
  - dimensional modeling explained
  - how do data warehouses organize tables
  - why is it called a star schema
updated: 2026-07-04
---

# The Star Schema, Explained

Open up a data warehouse and you'll find tables organized in a way that looks nothing like the app database you're used to. Instead of a web of normalized tables all pointing at each other, you'll find one big table sitting in the middle - sales, orders, events, whatever the business measures - surrounded by a handful of smaller tables describing the "who, what, when, and where" of each row. That shape has a name: a **star schema**, and it's not an accident. It's built specifically to make one kind of question fast: "sum this number, broken down by that category."

This guide covers what the two kinds of tables are, why the shape looks like a star, and when you'd reach for it.

## How to read this

Read in order. Phase 1 introduces facts and dimensions with a concrete example. Phase 2 explains why dimensions are deliberately denormalized - the choice that makes this shape different from the database schemas you already know. Phase 3 contrasts it with a "snowflake" schema and connects it to the broader OLTP/OLAP split.

## The phases

1. [Facts vs. dimensions](01-facts-vs-dimensions.md) - the two kinds of tables, with a concrete sales example.
2. [Why it's shaped like a star](02-why-a-star.md) - denormalized dimensions, on purpose, for fast reporting.
3. [Star vs. snowflake, and when to use it](03-star-vs-snowflake.md) - a normalized variant, and where this fits in the bigger picture.

[Phase 1: Facts vs. dimensions](01-facts-vs-dimensions.md) →
