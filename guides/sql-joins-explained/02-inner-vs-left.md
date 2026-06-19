---
title: "INNER vs LEFT (and the Others)"
guide: "sql-joins-explained"
phase: 2
summary: "INNER JOIN keeps only rows that match on both sides; LEFT JOIN keeps every row from the left table and fills NULLs where there's no match. RIGHT and FULL are the mirror and the union of those two."
tags: [sql, inner-join, left-join, right-join, full-join, null]
difficulty: beginner
synonyms: ["inner join vs left join difference", "what is a left join", "when to use left join", "left join null", "right join vs left join", "full outer join explained"]
updated: 2026-06-19
---

# INNER vs LEFT (and the Others)

In Phase 1 you wrote a plain `JOIN` and noticed something: an order disappeared, and a user with no orders never showed up. That wasn't random. It's the single most important choice in joining tables — **do you want to keep the rows that don't have a match, or drop them?** — and SQL gives it different join *types* with different names.

This phase is the payoff. Two join types cover almost everything you'll ever write: `INNER JOIN` and `LEFT JOIN`. We'll do each with a query and its result side by side so the difference is impossible to miss, then explain RIGHT and FULL calmly so they hold no mystery either.

We'll keep using the exact tables from Phase 1. Here they are again, so you don't have to scroll:

```text
  users                          orders
  ┌────┬─────────┐               ┌──────────┬─────────┬────────┐
  │ id │ name    │               │ order_id │ user_id │ amount │
  ├────┼─────────┤               ├──────────┼─────────┼────────┤
  │ 1  │ Ada     │               │ 101      │ 1       │ 40     │
  │ 2  │ Grace   │               │ 102      │ 1       │ 15     │
  │ 3  │ Linus   │               │ 103      │ 2       │ 90     │
  └────┴─────────┘               │ 104      │ 7       │ 25     │
                                 └──────────┴─────────┴────────┘
```

Remember the two oddities: order `104` points at a non-existent user `7`, and Linus (user `3`) has no orders. Watch what each join type does with them.

## The picture: which rows survive

Before the syntax, hold this picture. Every join is choosing which rows to keep when a match is missing.

```text
  INNER JOIN  →  keep ONLY rows that match on BOTH sides
                 ┌──────────┐
        users    │ matched  │    orders
       (some) ───┤ rows     ├─── (some)
                 └──────────┘
                 unmatched rows on either side are dropped

  LEFT JOIN   →  keep ALL left-table rows; attach matches where they exist
                 ┌────────────────────┐
        ALL  ────┤ every left row,     │
       users     │ NULLs where no      │
                 │ matching order      │
                 └────────────────────┘
```

The word that controls everything is "left." The **left table** is the one named first, in the `FROM` clause. In `FROM users LEFT JOIN orders`, `users` is the left table — so a LEFT JOIN guarantees every user appears, matched up with their orders or padded with NULLs.

## INNER JOIN — only the matches

**What it actually is.** `INNER JOIN` keeps a row only when it finds a match on *both* sides. No match, no row. (Plain `JOIN` *is* an `INNER JOIN` — the word `INNER` is optional. Spelling it out makes your intent obvious, which is worth the four extra letters.)

**A real example.** Show each order with the buyer's name:

```sql
SELECT users.name, orders.order_id, orders.amount
FROM users
INNER JOIN orders ON orders.user_id = users.id;
```

```text
 name  │ order_id │ amount
───────┼──────────┼────────
 Ada   │ 101      │ 40
 Ada   │ 102      │ 15
 Grace │ 103      │ 90
```

*What just happened:* The database kept only rows where a user and an order matched on `user_id = id`. Linus is gone — he has no orders, so he never finds a match. Order `104` is gone too — its `user_id = 7` matches no user. INNER is ruthless about both directions: anything without a partner is dropped.

**When you want this.** Use INNER when the question only makes sense for matched rows: "list all orders with who bought them," "show employees with the department they belong to." If an unmatched row would be meaningless in the answer, INNER is right.

## LEFT JOIN — every left row, no matter what

**What it actually is.** `LEFT JOIN` keeps **every** row from the left table. Where a left row has a matching right row, it attaches it. Where it doesn't, it still keeps the left row and fills the right table's columns with `NULL`.

📝 **Terminology — NULL.** `NULL` is SQL's "there is no value here." It is not zero and not an empty string — it specifically means *unknown / absent*. A LEFT JOIN produces NULLs on purpose, to say "this left row had no match on the right."

**A real example.** List *every* user, with their orders if they have any:

```sql
SELECT users.name, orders.order_id, orders.amount
FROM users
LEFT JOIN orders ON orders.user_id = users.id;
```

```text
 name  │ order_id │ amount
───────┼──────────┼────────
 Ada   │ 101      │ 40
 Ada   │ 102      │ 15
 Grace │ 103      │ 90
 Linus │ NULL     │ NULL
```

*What just happened:* Every user from the left table survived — including Linus. Ada and Grace got their orders attached as before. Linus had no matching order, so the database kept his row anyway and put `NULL` in the columns that came from `orders`. That NULL row is the whole reason to reach for a LEFT JOIN: it's how "this user has zero orders" shows up in your results instead of silently vanishing.

Notice what's *still* missing: order `104`. It points at the non-existent user `7`, and we put `users` on the left, so an unmatched *order* still gets dropped. A LEFT JOIN protects the left table's rows, not the right table's.

**When you want this.** Use LEFT when you need the complete left side regardless of matches: "all users and how many orders each has (including zero)," "every product and its reviews, even products with none." Any time "show me the ones with *none*" is part of the question, you want a LEFT JOIN.

💡 **Key point.** The difference in one line: **INNER answers "where both exist," LEFT answers "everything on the left, plus the right where it exists."** Choosing wrong is how you accidentally hide your zero-order users — or accidentally include rows you meant to filter out.

## RIGHT and FULL — the other two, demystified

You'll see two more names. Neither is mysterious once you have INNER and LEFT.

**RIGHT JOIN** is just a LEFT JOIN with the tables flipped. It keeps every row from the *right* table (the one after the `JOIN` keyword) and fills NULLs on the left where there's no match. These two queries return the same rows:

```sql
FROM users LEFT JOIN orders ON ...    -- keeps every user
FROM orders RIGHT JOIN users ON ...   -- also keeps every user
```

Because you can always rewrite a RIGHT JOIN as a LEFT JOIN by swapping the table order, most people pick LEFT and stick with it — it reads left-to-right, the way you think. RIGHT isn't wrong; it's just rarely the clearer choice.

**FULL JOIN** (also written `FULL OUTER JOIN`) keeps **every row from both tables**: matched rows are paired up, and any unmatched row from *either* side is kept with NULLs on the other side. With our data:

```sql
SELECT users.name, orders.order_id, orders.amount
FROM users
FULL JOIN orders ON orders.user_id = users.id;
```

```text
 name  │ order_id │ amount
───────┼──────────┼────────
 Ada   │ 101      │ 40
 Ada   │ 102      │ 15
 Grace │ 103      │ 90
 Linus │ NULL     │ NULL      ← user with no order
 NULL  │ 104      │ 25        ← order with no user
```

*What just happened:* FULL kept the matched rows, *plus* Linus (a user with no order, NULLs on the right), *plus* order `104` (an order with no user, NULLs on the left). It's the only join here that surfaces *both* kinds of orphan at once — which is exactly why it's handy for data-quality checks like "find everything that doesn't line up."

📝 **Terminology — outer join.** LEFT, RIGHT, and FULL are collectively called *outer joins* — they all keep unmatched ("outer") rows and pad with NULLs. INNER is the only one that doesn't. So when someone says "use an outer join," they mean "keep the non-matching rows too."

⚠️ **Heads-up on database support.** INNER and LEFT work everywhere. FULL JOIN is supported by PostgreSQL, SQL Server, and Oracle, but **MySQL does not support `FULL JOIN`** (you emulate it with a `UNION` of a LEFT and a RIGHT join). If a `FULL JOIN` throws a syntax error, check which database you're on before assuming you mistyped.

## Why this saves you later

The day a report is "missing" rows, or a count comes out too low, the cause is almost always an INNER join where you needed a LEFT — the unmatched rows got silently dropped. And the day NULLs start appearing where you didn't expect them, you'll recognize them instantly as outer-join padding rather than corrupt data. Knowing *which* join you wrote, and *why*, turns those moments from confusing into obvious.

## Recap

1. **INNER JOIN** keeps only rows that match on both sides; unmatched rows on either side are dropped.
2. **LEFT JOIN** keeps every row from the **left** (first-named) table, attaching matches where they exist and **NULLs where they don't** — this is how "has none" shows up.
3. **RIGHT JOIN** is LEFT with the tables flipped; you can almost always just write LEFT instead.
4. **FULL JOIN** keeps unmatched rows from **both** sides with NULLs — great for finding orphans, but unsupported in MySQL.
5. LEFT/RIGHT/FULL are **outer joins** (they keep non-matches); INNER is the only one that doesn't.

Now you can get exactly the rows you intend. Next, the ways a join can betray you even when the type is right — and how to catch them.

---

[← Phase 1: Why Joins Exist](01-why-joins-exist.md) · [Guide overview](_guide.md) · [Phase 3: Join Gotchas →](03-join-gotchas.md)
