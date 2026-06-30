---
title: "The N+1 Query Problem"
guide: n-plus-one-queries
phase: 3
summary: "The ORM trap that is fast on seed data and dead in production: one query quietly becomes N+1. How to spot it and fix it."
tags: [databases, orm, performance, n+1, queries, eager-loading]
difficulty: intermediate
synonyms:
  - n+1 query problem
  - n plus one queries
  - orm fires too many queries
  - why is my orm slow
  - eager loading vs lazy loading
  - loop firing one query per row
updated: 2026-06-30
---

# Fixing it without over-fetching

The fix is one idea wearing three outfits: **stop asking one row at a time; ask for everything up front.** That's it. Whether your ORM spells it `includes`, `preload`, `joinedload`, `with`, `selectinload`, or `prefetch_related`, every fix you'll ever apply is the same move — tell the ORM, *before* the loop, that you're going to need the related data, so it can grab it all in one shot instead of dribbling it out N times.

The good news: this is usually a one-line change. The catch nobody mentions until you've been burned: doing it carelessly trades one performance bug for another. Let's get both right.

## Fix 1: eager loading (the everyday answer)

This is what you'll reach for 90% of the time. **Eager loading** is the opposite of lazy: you announce the relation when you load the list, and the ORM fetches all the related rows ahead of the loop.

```text
# before — lazy, fires 1 + N queries
orders = Order.all()
for order in orders:
    print(order.customer.name)

# after — eager, fires 2 queries total, no matter how many rows
orders = Order.all().include(:customer)   # the spelling varies per ORM
for order in orders:
    print(order.customer.name)
```

*What just happened:* you added one hint — `include(:customer)` — and the loop body didn't change at all. But now the ORM is smart about it. Under the hood it does this:

```sql
SELECT * FROM orders;
SELECT * FROM customers WHERE id IN (17, 4, 91, 23, 56, ...);
```

*What just happened:* instead of N single-row lookups, the ORM collected every customer ID from the orders and asked for all of them in **one** query with `WHERE id IN (...)`. Two queries total — the list, then everything it relates to — and that "2" stays "2" whether you have 10 orders or 10,000. This style is often called **preloading** or **select-in loading**: it stays two queries by design, which makes its cost easy to reason about.

## Fix 2: a single JOIN

The other shape collapses it all the way to **one** query by joining the tables, so the related data rides along on the same rows.

```sql
SELECT orders.*, customers.name
FROM orders
JOIN customers ON customers.id = orders.customer_id;
```

*What just happened:* one query hands you orders *and* their customer names together, already stitched. Most ORMs expose this as "joined" eager loading (`joinedload`, `JOIN`-based `includes`, etc.). One round trip, zero stutter. When you only need a column or two from the related table, this is often the leanest possible answer.

So when do you pick the IN-query (Fix 1) versus the JOIN (Fix 2)? Roughly:

```text
JOIN          -> great for one-to-one / belongs-to (each order has 1 customer)
IN / preload  -> safer for one-to-many (each customer has MANY orders)
```

*What just happened:* the rule of thumb has a sharp reason behind it, which is the next section — and it's the part that catches people.

## The trap on the other side: over-fetching

Here's the tradeoff the cheerful tutorials skip. A JOIN across a **one-to-many** relation *multiplies rows*. Join customers to their orders and a customer with 50 orders shows up 50 times in the result, with all their customer columns repeated on every single row. Pull a few large relations together and the result set explodes — sometimes a JOIN-based "fix" moves *more* total data over the wire than the N+1 did. This is **over-fetching**: solving "too many queries" by creating "one absurdly fat query."

```text
N+1            -> too many queries, each tiny           (round-trip cost)
fat JOIN       -> few queries, but enormous duplicated result  (payload cost)
preload/IN     -> few queries, no row multiplication     (usually the sweet spot)
```

*What just happened:* you can see why preloading (Fix 1) is the safe default for one-to-many — it never multiplies rows, because the related rows come back in their *own* query, not glued onto the parent. JOINs shine for to-one relations where there's no multiplication to worry about. The real goal was never "fewest queries at any cost." It's **few queries AND a sensibly-sized result.** Both axes matter.

## The discipline that prevents all of it

You don't want to be hunting N+1 forever. Two habits keep it from coming back:

```text
1. Select only the columns you actually render, not SELECT *.
2. Make query count a test: assert this endpoint runs <= K queries.
```

*What just happened:* the first habit shrinks the payload side of the tradeoff — fewer columns means a JOIN multiplies less data and `SELECT *` stops dragging blobs you never display. The second is the real safety net: many test frameworks let you assert "this code path runs at most K queries." Pin K to a small constant and the day someone reintroduces N+1, a test fails *before* production does — which is the whole battle, because N+1 is precisely the bug that hides until production.

> Fewest queries is not the goal. *Few queries that move only the data you need* is the goal. Chase only the first number and you'll JOIN your way into an over-fetching bug.

For builders: when you eager-load, you're choosing the query shape the ORM generates. If a JOIN-based load is still slow even after killing the N+1, the bottleneck has moved from *how many* queries to *how fast one query is* — that's [why is my query slow](/guides/why-is-my-query-slow) territory (indexes, the join itself, the query plan).

```quiz
[
  {
    "q": "What is the core idea behind every N+1 fix?",
    "choices": [
      "Cache the results so the loop never hits the database",
      "Load all the related data up front instead of one row at a time",
      "Move the loop into a database stored procedure",
      "Add an index to the related table"
    ],
    "answer": 1,
    "explain": "Eager loading, JOINs, and batching are all the same move: ask once for everything, before the loop, instead of N times inside it."
  },
  {
    "q": "Why is preload / IN-query loading often safer than a JOIN for a one-to-many relation?",
    "choices": [
      "It uses fewer total queries than a JOIN",
      "A JOIN across one-to-many multiplies rows and duplicates parent columns",
      "JOINs can't be used with ORMs",
      "Preloading is always faster for every relation type"
    ],
    "answer": 1,
    "explain": "A one-to-many JOIN repeats each parent row once per child, inflating the result. Preloading fetches children in a separate query, so no multiplication."
  },
  {
    "q": "What does \"over-fetching\" mean in this context?",
    "choices": [
      "Running the same query too many times",
      "Fetching rows before the user requests them",
      "Solving N+1 with a JOIN so fat it moves more data than N+1 did",
      "Loading data into a cache that's never read"
    ],
    "answer": 2,
    "explain": "Collapsing to one query can backfire: a multiplying JOIN with SELECT * can move more total data than the original N+1. Few queries AND a lean result is the goal."
  }
]
```

[← Phase 2: Seeing it in your logs](02-seeing-it-in-the-logs.md) | [Overview](_guide.md)
