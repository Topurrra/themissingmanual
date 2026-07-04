---
title: "What N+1 actually is"
guide: n-plus-one-queries
phase: 1
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

# What N+1 actually is

Here's the situation you keep walking into. You write a list page — orders, posts, users, whatever. For each row you show something from a related table: the customer's name next to each order, the author next to each post. The code reads like plain English, you ship it, and it's fast. Weeks later it's the slowest page in the app and you have no idea why, because the code still reads like plain English.

The name tells you the whole story: **1** query to load the list, then **N** more queries — one for every single row in that list. Ten rows, eleven queries. Ten thousand rows, ten thousand and one queries. The "+1" is the list; the "N" is the part that grows with your data and quietly kills you.

## The line that looks innocent

Imagine loading all the orders and printing each customer's name. In almost any ORM, it looks roughly like this:

```text
orders = Order.all()           # query #1: SELECT * FROM orders

for order in orders:
    print(order.customer.name) # each .customer = one more query
```

*What just happened:* the first line ran one query and gave you a list of orders. But `order.customer` is not data you already have — it's a *trapdoor*. The first time you touch it, the ORM secretly runs another query to go fetch that customer. Loop over 500 orders and you've fired 500 hidden queries on top of the first one. The total is 1 + N = 501.

The cruel part is that `order.customer.name` looks exactly like reading a field you already loaded. There is no `query()` call, no SQL in sight, no syntax that screams "I am about to hit the database." That's the trap: the cost is invisible at the point where you pay it.

## Why is it called "lazy loading"?

When you load `Order.all()`, the ORM does the minimum: it fetches the orders and stops. It does **not** go fetch every related customer, because maybe you'll never look at them. Deferring that work until you actually ask is called **lazy loading**, and on its own it's a sensible default — why pay for data you might not use?

The N+1 problem is what lazy loading turns into when you *do* use it, once per row, inside a loop. Each `.customer` access wakes the lazy loader, which thinks "oh, you want this one? hang on" and runs a query. It has no idea you're about to ask for 499 more. It can't see the loop. So it solves each request in the dumbest possible isolation: one round trip at a time.

```text
SELECT * FROM orders;                         -- the "+1"
SELECT * FROM customers WHERE id = 17;        -- row 1
SELECT * FROM customers WHERE id = 4;         -- row 2
SELECT * FROM customers WHERE id = 91;        -- row 3
...                                           -- ... and so on, N times
```

*What just happened:* this is the actual SQL your one innocent loop produced. Each `WHERE id = ?` is a separate trip to the database — connect, send, wait, receive — and the waiting dominates. Even if every query is instant on its own, the *round trips* stack up. A query that takes 1 millisecond becomes 500 milliseconds of nothing-but-waiting when you run it 500 times.

> The killer isn't slow queries. It's *fast* queries run a thousand times. Each one is innocent; the multiplication is fatal.

## Why your laptop lied to you

On ten rows of seed data, N+1 is 11 queries. Eleven fast queries against a local database with no network in between is genuinely instant — you will never feel it. Your tests pass. Your demo flies. Everything looks perfect.

Production is a different planet. There are 10,000 rows instead of 10. The database lives on another machine, so every query pays real network latency. And dozens of users are hitting that same page at once, each spawning their own flood of N queries. The cost didn't appear in production — it was always there, scaling with `N`. You only changed `N`.

This is why N+1 is so dangerous specifically: it is a **performance bug that scales with data**, and you develop on tiny data. The feedback loop that would catch it is exactly the one your dev environment removes.

## The mental model to keep

Hold onto this one picture and you'll recognize N+1 everywhere for the rest of your career: **a loop over rows, where the body touches a relation.** That's the shape. Whenever you see code iterating a collection and reaching across to a related object inside the loop, your alarm should go off — not because it's wrong, but because it *might* be firing one query per turn of the loop.

It isn't the loop that's the problem, and it isn't the relation. It's the combination: asking the database the same kind of question over and over, one row at a time, when you could have asked once for all of them. Phase 3 is entirely about turning N+1 questions into a single question. But first you need to *see* it happening, which is Phase 2.

For builders: if you're fuzzy on what an ORM is actually doing when you write `order.customer`, the trapdoor makes a lot more sense after reading [how an ORM works](/guides/how-an-orm-works) — N+1 is the price of the convenience that guide describes.

```quiz
[
  {
    "q": "In the name \"N+1\", what does the \"+1\" refer to?",
    "choices": [
      "One extra query the database adds for safety",
      "The single query that loads the list of rows",
      "The first row in the result set",
      "An off-by-one bug in the loop"
    ],
    "answer": 1,
    "explain": "The \"+1\" is the initial query that fetches the list; the \"N\" is the one-query-per-row that follows."
  },
  {
    "q": "Why does N+1 usually stay invisible during development?",
    "choices": [
      "ORMs disable lazy loading in dev mode",
      "Dev databases run a faster query planner",
      "On tiny seed data, N is small and the queries are local and instant",
      "The bug only exists in compiled production builds"
    ],
    "answer": 2,
    "explain": "Eleven instant local queries feel like nothing. The cost scales with N, and dev data keeps N tiny."
  },
  {
    "q": "What makes the line `order.customer.name` so easy to miss?",
    "choices": [
      "It looks like reading already-loaded data, but secretly fires a query",
      "It only runs on every other iteration",
      "It throws a warning that most loggers hide",
      "It always loads the wrong customer"
    ],
    "answer": 0,
    "explain": "Attribute access looks free. The lazy loader turns that innocent dot into a hidden round trip to the database."
  }
]
```

Watch it animated: [the N+1 query problem](/explainers/NPlusOne.dc.html)

[← Overview](_guide.md) | [Phase 2: Seeing it in your logs →](02-seeing-it-in-the-logs.md)
