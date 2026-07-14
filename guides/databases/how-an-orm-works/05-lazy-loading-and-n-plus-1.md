---
title: "Lazy Loading & the N+1 Trap"
guide: "how-an-orm-works"
phase: 5
summary: "When related data loads - lazy (on access) vs eager (up front) - and the N+1 query explosion every ORM can cause in an innocent loop, plus the fix and how to choose per query."
tags: [orm, database, lazy-loading, eager-loading, n-plus-1, performance]
difficulty: advanced
synonyms: ["orm lazy loading", "orm eager loading", "n+1 problem", "orm join fetch", "orm preload include", "orm related data loading"]
updated: 2026-07-10
---

# Lazy Loading & the N+1 Trap

[Phase 4](04-change-tracking.md) covered how the ORM figures out *what to write* without you spelling it
out. This phase is the mirror image on the read side: when you load an object that has related data - a
`Customer` with `orders`, a `Post` with `comments` - *when* do those related rows actually come back? The
ORM has to choose, and the choice it makes (or the one you forget to make) is behind the single most
common ORM performance bug in existence.

> 📝 The mental model: **loading is the choice of *when* related data is fetched.** Not *whether* - you'll
> get the data either way - but *when*. Two strategies: **lazy** (fetch the related data the moment you first
> access it) and **eager** (fetch it up front, in the same trip, when you ask for the parent). Hold that one
> distinction and the whole N+1 mess becomes predictable instead of mysterious.

## Lazy loading: a placeholder until you touch it

With lazy loading, related data is **not** fetched when you load the parent. Instead the ORM hands you back a
**proxy** - a placeholder that looks like the collection (or the related object) but holds no rows yet. The
real query fires the instant you first *access* it.

```text
customer = repo.find(Customer, 5)   # 1 query: SELECT * FROM customers WHERE id = 5
#                                     customer.orders is a proxy - no orders fetched yet

print(customer.orders.count)        # touching it NOW triggers:
#                                     SELECT * FROM orders WHERE customer_id = 5
```

*What just happened:* Loading the customer was one query. The `orders` collection came back as an
empty-handed placeholder. Only when you reached for `customer.orders` did the ORM quietly run a second
query to fill it. This is convenient - you get related data on demand, paying for exactly what you touch - 
and it's the default in **Hibernate** (collections are lazy unless told otherwise) and a configurable mode
in **SQLAlchemy**, **GORM**, and **EF Core**. The catch: "fires when you access it" is easy to do *inside
a loop* without realizing.

## Eager loading: bring it along up front

With eager loading, you tell the ORM up front "I'll need the orders too," and it fetches them in the same
round trip - either by a JOIN, or by a single follow-up batched query keyed on the parents it loaded.

```text
customer = repo.query(Customer).with_related("orders").find(5)
#   → SELECT ... FROM customers
#     LEFT JOIN orders ON orders.customer_id = customers.id
#     WHERE customers.id = 5
#   orders are already in memory - no second query when you touch them

print(customer.orders.count)        # no query: already loaded
```

*What just happened:* By asking for `orders` eagerly, the ORM loaded the customer and its orders together.
Accessing `customer.orders` later costs nothing - the rows are already there. Same idea, different
spellings per ORM (named below). Eager loading trades "fetch on demand" for "fetch now, all at once," and
that trade is exactly what saves you from the trap below.

## ⚠️ The N+1 trap

Here's where lazy loading quietly turns into a disaster. You load a list of parents (1 query), then loop over
them and touch a lazy relationship on each one. Every touch fires its own query.

```text
customers = repo.all()              # 1 query:  SELECT * FROM customers
for c in customers:
    print(c.orders.count)           # lazy access → 1 query PER customer
#                                     SELECT * FROM orders WHERE customer_id = ?
# total = 1 (the customers) + N (one per customer) = N+1 queries
```

*What just happened:* The outer query loaded N customers. Then, because `orders` is lazy, each loop
iteration fired a fresh query to load *that* customer's orders. With 1,000 customers that's **1 + 1,000 =
1,001 queries** instead of the 1–2 you actually needed. This is the **N+1 problem**, and it's universal - 
every ORM that supports lazy loading can produce it.

The reason it's so dangerous is that it **hides**. The code reads beautifully - a clean loop over objects,
no SQL in sight. With ten rows in your dev database it runs in milliseconds and every test passes. Then
production has a hundred thousand rows, the page takes nine seconds, and the database is on fire - it
only bites under real data volume, exactly when you can least afford it. For the full diagnosis-and-fix
playbook, see [The N+1 Query Problem](/guides/n-plus-one-queries); for reading a slow endpoint's SQL, see
[Why Is My Query Slow?](/guides/why-is-my-query-slow).

## The fix: eager-load the relationship

The cure is to tell the ORM to fetch the related data up front, collapsing N+1 queries into one or two. The
idea is identical everywhere; only the method name changes:

- **Hibernate / JPA** - `JOIN FETCH` in JPQL, or `@EntityGraph`
- **SQLAlchemy** - `selectinload(...)` (batched follow-up) or `joinedload(...)` (single JOIN)
- **GORM** - `Preload("Orders")`
- **EF Core** - `Include(c => c.Orders)`

```text
customers = repo.query(Customer).with_related("orders").all()
#   one strategy → a single JOIN:
#     SELECT ... FROM customers LEFT JOIN orders ON orders.customer_id = customers.id
#   another strategy → 2 queries total (batched):
#     SELECT * FROM customers
#     SELECT * FROM orders WHERE customer_id IN (1, 2, 3, ... )   ← all at once

for c in customers:
    print(c.orders.count)           # no query - orders already loaded
# total = 1 or 2 queries, regardless of how many customers
```

*What just happened:* Instead of N separate per-customer queries, the ORM either JOINed the orders in or
ran **one** follow-up query with an `IN (...)` over all the customer ids. Either way the loop now fires
**zero** queries - the data is already in memory. 1,001 queries became 1 or 2 - the same move whether
you're writing `JOIN FETCH`, `selectinload`, `Preload`, or `Include`.

## ⚠️ But don't eager-load everything

The temptation after getting burned by N+1 is to eager-load *all the things, always*. That swings you into
the opposite ditch:

- **Over-fetching** - you pull related data you never actually use on this page, wasting bandwidth,
  memory, and database work for rows that get thrown away.
- **Cartesian explosion** - eager-loading *several* collections with JOINs multiplies rows. A customer
  with 50 orders and 50 addresses, JOINed together, returns 50 × 50 = **2,500 rows** for one customer - 
  the database materializes the cross product and the ORM has to de-duplicate it back into objects. (This
  is why batched strategies like `selectinload` often beat a big multi-JOIN: separate `IN (...)` queries
  don't multiply.)

So the rule is: **choose the loading strategy per query, based on what that query will actually use.**
Need the orders on this page? Eager-load orders, and *only* orders. There is no single "correct" setting - 
the right answer depends on each query's access pattern.

> 💡 The reliable way to *know* which trap you're in is to **watch the SQL the ORM generates**. Turn on query
> logging (or use a query-count assertion in tests) and count the statements per request. One innocent loop
> firing 200 queries jumps out immediately once you can see them - and seeing them is the whole skill. Phase 6
> covers how those statements get built; [Why Is My Query Slow?](/guides/why-is-my-query-slow) covers reading
> them.

This trap is *identical in spirit* across every mainstream ORM - same disease, same cure, different vocabulary.
If you want to see it concretely in the library you actually use, each of these guides walks the exact loading
APIs: [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero), [SQLAlchemy](/guides/sqlalchemy-from-zero),
[GORM](/guides/gorm-from-zero), and [EF Core](/guides/efcore-from-zero).

## Recap

- **Loading is the choice of *when* related data is fetched:** lazy (on first access) vs eager (up front, in
  the same request).
- **Lazy loading** hands back a proxy/placeholder and runs a separate query the moment you touch the
  relationship - convenient, on-demand, the default in several ORMs.
- ⚠️ **The N+1 trap:** load N parents (1 query), loop and touch a lazy relationship on each (N queries) =
  **N+1** total. It hides in clean-looking loops and only bites under real data volume.
- **The fix is to eager-load** the relationship so it arrives in 1–2 queries: Hibernate `JOIN FETCH` /
  `@EntityGraph`, SQLAlchemy `selectinload` / `joinedload`, GORM `Preload`, EF Core `Include`.
- ⚠️ **Don't eager-load everything** - it over-fetches, and JOINing multiple collections causes a cartesian
  explosion. Choose the strategy **per query**, and 💡 **watch the generated SQL** to confirm.

## Quick check

```quiz
[
  {
    "q": "You load 500 customers, then loop over them printing customer.orders.count, where orders is lazy. How many queries run?",
    "choices": ["1 query - the loop reuses the first result set", "501 queries - 1 for the customers plus 1 per customer", "500 queries - one JOIN per customer", "2 queries - the ORM always batches"],
    "answer": 1,
    "explain": "This is the N+1 problem: 1 query loads the customers, then each lazy access in the loop fires its own query for that customer's orders - 500 more. Total 1 + 500 = 501."
  },
  {
    "q": "What is the standard fix for an N+1 query problem?",
    "choices": ["Add an index to the orders table", "Eager-load the relationship up front (JOIN FETCH / selectinload / Preload / Include) so it arrives in 1–2 queries", "Call commit() before the loop", "Disable change tracking on the customers"],
    "answer": 1,
    "explain": "Eager loading fetches the related rows up front - via a JOIN or a single batched IN(...) query - so the loop touches data already in memory and fires no further queries. Each ORM names it differently but it's the same move."
  },
  {
    "q": "Why is 'just eager-load everything, always' a bad default?",
    "choices": ["Eager loading is always slower than lazy loading", "It over-fetches unused data, and JOINing multiple collections causes a cartesian explosion (rows multiply)", "It breaks change tracking", "It only works in Hibernate"],
    "answer": 1,
    "explain": "Eager-everything pulls data you may not use and, when several collections are JOINed, multiplies rows (50 orders × 50 addresses = 2,500 rows for one parent). Choose the loading strategy per query based on what it actually needs."
  }
]
```

---

[← Phase 4: Change Tracking & Dirty Checking](04-change-tracking.md) · [Guide overview](_guide.md) · [Phase 6: Building the Query (to SQL) →](06-building-the-query.md)