---
title: "The Schema and Seed Data"
guide: sql-expense-analytics
phase: 1
summary: "Create the expenses table and fill it with a few dozen realistic rows you can query for the rest of the project."
tags: [sql, create-table, insert, schema, sqlite]
difficulty: intermediate
synonyms:
  - create table sql
  - insert seed data
  - sql schema design
  - expenses table
  - sqlite setup
updated: 2026-06-30
---

# The Schema and Seed Data

Every report needs something to report on. Before any analytics, you need a
table and rows in it. That's this phase: design a small `expenses` table, pour
in a realistic month-and-a-half of spending, and confirm it's all there.

## What an expense looks like

Strip a real expense down to what a report cares about and you get four things:

- **When** it happened - a date.
- **What** it was for - a category like groceries or rent.
- **A short description** - the merchant or memo, so a row is recognizable.
- **How much** - the amount.

That maps cleanly to four columns. Here's the table:

```sql
CREATE TABLE expenses (
  id          INTEGER PRIMARY KEY,
  spent_on    TEXT    NOT NULL,   -- ISO date: 'YYYY-MM-DD'
  category    TEXT    NOT NULL,
  description TEXT    NOT NULL,
  amount      REAL    NOT NULL    -- dollars, e.g. 42.50
);
```

A few decisions worth naming, because you'll feel them later:

**Dates as `TEXT` in `YYYY-MM-DD` form.** SQLite has no dedicated date type, and
it doesn't need one. As long as you store dates in ISO order, they sort
correctly as plain strings and SQLite's date functions read them happily. The
string `'2026-02-09'` sorts after `'2026-01-30'` exactly the way the calendar
does. Store dates any other way and you'll fight it forever; store them this way
and everything downstream behaves.

**Amount as `REAL`.** For money in a real production system you'd use integer
cents to dodge floating-point rounding. For a personal report where you're
eyeballing totals, `REAL` keeps the SQL readable and the rounding errors stay
below a cent. We'll note where it matters.

**`category` as a plain text column.** No separate categories table, no foreign
key. With a couple dozen rows and a handful of categories, a lookup table would
be machinery you don't need yet. The cost is that a typo (`grocery` vs
`groceries`) becomes its own category - so keep the spellings consistent when
you add rows.

## The seed data

Now the rows. Here's roughly six weeks of spending across January and February -
the kind of mix a real month has: a big rent payment, recurring subscriptions,
a scatter of groceries and dining, one travel splurge.

Run this block. It creates the table, inserts everything, then selects it back
sorted by date so you can see what you're working with.

```sql runnable
CREATE TABLE expenses (
  id          INTEGER PRIMARY KEY,
  spent_on    TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  description TEXT    NOT NULL,
  amount      REAL    NOT NULL
);

INSERT INTO expenses (spent_on, category, description, amount) VALUES
  ('2026-01-01', 'rent',          'January rent',        1450.00),
  ('2026-01-02', 'subscriptions', 'Streaming service',      15.99),
  ('2026-01-03', 'groceries',     'Corner market',          54.20),
  ('2026-01-05', 'dining',        'Lunch with Sam',         28.75),
  ('2026-01-07', 'transport',     'Metro card refill',      40.00),
  ('2026-01-09', 'groceries',     'Weekly shop',            96.40),
  ('2026-01-12', 'utilities',     'Electricity',            72.10),
  ('2026-01-14', 'dining',        'Pizza night',            34.50),
  ('2026-01-16', 'subscriptions', 'Music service',           9.99),
  ('2026-01-18', 'groceries',     'Farmers market',         61.30),
  ('2026-01-21', 'transport',     'Rideshare home',         18.40),
  ('2026-01-24', 'dining',        'Dinner out',             52.00),
  ('2026-01-27', 'groceries',     'Weekly shop',            88.15),
  ('2026-01-30', 'utilities',     'Water bill',             31.25),
  ('2026-02-01', 'rent',          'February rent',        1450.00),
  ('2026-02-02', 'subscriptions', 'Streaming service',      15.99),
  ('2026-02-04', 'groceries',     'Corner market',          49.80),
  ('2026-02-06', 'travel',        'Weekend flights',       312.00),
  ('2026-02-07', 'dining',        'Airport food',           22.60),
  ('2026-02-10', 'groceries',     'Weekly shop',           102.55),
  ('2026-02-13', 'dining',        'Valentine dinner',       96.00),
  ('2026-02-15', 'subscriptions', 'Music service',           9.99),
  ('2026-02-17', 'transport',     'Metro card refill',      40.00),
  ('2026-02-20', 'groceries',     'Weekly shop',            79.90),
  ('2026-02-23', 'utilities',     'Electricity',            68.40),
  ('2026-02-26', 'dining',        'Takeout',                31.20);

SELECT id, spent_on, category, description, amount
FROM expenses
ORDER BY spent_on;
```

You should get 26 rows back, oldest first. Scan them. There's your rent
anchoring each month, a travel spike in early February, and groceries and dining
sprinkled throughout - enough variety that the analytics later will have
something to say.

## One thing to remember

Notice that this block did three jobs in one: `CREATE TABLE`, then `INSERT`,
then `SELECT`. **Every runnable block in the rest of this project repeats that
setup.** The same `CREATE TABLE` and the same 26-row `INSERT` will appear at the
top of every block before the new query.

That looks repetitive, and it is - on purpose. Each block runs in a fresh,
empty database, so it has to build its own world before it can query it. The
upside is that any block on any page works on its own: you can jump straight to
the window-functions phase, hit Run, and it works, because the data comes with
it.

So don't be thrown when you see the same long `INSERT` again. The only part
that changes from here on is the query at the bottom. That query is where the
report gets built.

## Try it

Before moving on, make one edit and re-run:

- Change a `dining` row's `amount` to something large, like `200.00`, and run
  again. Watch the total you'll compute next phase shift.
- Add a row in March (`'2026-03-...'`) and re-run. You've now got a third month,
  which the trend queries later will pick up automatically.

When the data feels like yours, head to phase 2 and start turning these rows
into totals.
