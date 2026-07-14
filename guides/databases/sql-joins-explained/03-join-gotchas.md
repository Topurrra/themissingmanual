---
title: "Join Gotchas"
guide: "sql-joins-explained"
phase: 3
summary: "The accidental cartesian explosion from a missing or wrong ON condition, NULLs from outer joins quietly breaking your WHERE, joining on the wrong columns, and a simple row-count sanity check to catch all three."
tags: [sql, joins, cartesian-join, cross-join, null, where, debugging]
difficulty: beginner
synonyms: ["why does my join return too many rows", "cartesian join explained", "join duplicates rows", "left join where null disappears", "sanity check join row count", "accidental cross join"]
updated: 2026-07-10
---

# Join Gotchas

You understand the join types now. This phase is about moments where the *type* was right but the result still came out wrong - the query runs without an error, returns a plausible number, and quietly lies to you. These are the bugs that ship to production because nothing turned red. All three have the same cure: a thirty-second sanity check, at the end. Same `users` and `orders` tables from Phases 1 and 2.

## The gotcha cheat-card

> **Result looks wrong? Find the symptom, then read the section.**

| Symptom | Likely cause | Section |
|---|---|---|
| Way too many rows; counts inflated; duplicates everywhere | Missing or wrong `ON` → cartesian explosion | §1 |
| LEFT JOIN's "no match" rows vanished after you added a `WHERE` | `WHERE` on the right table filters out the NULL rows | §2 |
| Rows match that shouldn't (or none match) | Joining on the wrong columns | §3 |
| "Is this even right?" | Compare the join's row count to the base table | §4 |

---

## 1. The accidental cartesian explosion

⚠️ **This is the big one.** If you forget the `ON` clause, or write a join condition that's always true, the database doesn't error - it pairs **every** row on the left with **every** row on the right. That's called a *cartesian product* (or *cross join*), and it makes your row count explode.

📝 **Terminology - cartesian product / cross join.** Pairing every row of A with every row of B. If A has 3 rows and B has 4, you get 3 × 4 = 12 rows. The numbers stay small here, but on real tables - 10,000 users and 50,000 orders - a cartesian product is 500,000,000 rows. That's how a forgotten `ON` clause locks up a database.

**What it looks like.** Here's the join with no condition (some databases write this as `CROSS JOIN`; a comma between tables does the same thing):

```sql
SELECT users.name, orders.order_id
FROM users
CROSS JOIN orders;
```

```text
 name  │ order_id
───────┼──────────
 Ada   │ 101
 Ada   │ 102
 Ada   │ 103
 Ada   │ 104
 Grace │ 101
 Grace │ 102
 Grace │ 103
 Grace │ 104
 Linus │ 101
 ...   │ ...        (12 rows total: 3 users × 4 orders)
```

*What just happened:* With no matching rule, every user got paired with every order - Ada with order `104` (not hers), Linus with all four (none are his). 3 users × 4 orders = 12 meaningless rows. The query "worked." The answer is garbage.

**The subtler version.** You don't have to omit `ON` entirely to cause this. Join on a column that isn't unique - say two order rows happen to share some value you joined on - and each left row fans out across all of them. The row count balloons into duplicate-looking rows you didn't expect. The fix is always the same: **join on a key that uniquely identifies a row** (like `users.id`), not a column that repeats.

**The calm fix.** Always write an `ON` clause, and make it compare the foreign key to the key it references:

```sql
SELECT users.name, orders.order_id
FROM users
INNER JOIN orders ON orders.user_id = users.id;
```

This brings you back to the sensible 3-row result from Phase 2. If you ever *intend* a cross join (it has legitimate uses, like generating every combination of two small lists), write `CROSS JOIN` explicitly so the next person knows you meant it.

## 2. NULLs from an outer join quietly breaking your WHERE

This one is sneaky because it punishes you for doing two correct things at once. You write a LEFT JOIN to keep users with no orders - good. You add a `WHERE` clause to filter on something in the orders table - also reasonable. Your no-order users silently vanish, turning your LEFT JOIN back into an INNER JOIN without warning.

**What it looks like.** "Show every user, plus their order amount, but only orders over 20." Tempting to write:

```sql
SELECT users.name, orders.amount
FROM users
LEFT JOIN orders ON orders.user_id = users.id
WHERE orders.amount > 20;
```

```text
 name  │ amount
───────┼────────
 Ada   │ 40
 Grace │ 90
```

*What just happened:* Linus is gone - the very row your LEFT JOIN worked to keep. The LEFT JOIN first produced Linus with `amount = NULL` (no orders). Then `WHERE orders.amount > 20` ran, and `NULL > 20` is **not true** (in SQL, any comparison with NULL is "unknown," which `WHERE` treats as a no) - so Linus got filtered out. The `WHERE` on a right-table column quietly undid your outer join.

**The calm fix.** If a condition is about *which right rows to match*, put it in the `ON` clause, not in `WHERE`. The `ON` clause is applied *during* matching, so unmatched left rows are still kept:

```sql
SELECT users.name, orders.amount
FROM users
LEFT JOIN orders ON orders.user_id = users.id
                AND orders.amount > 20;
```

```text
 name  │ amount
───────┼────────
 Ada   │ 40
 Grace │ 90
 Linus │ NULL
```

*What just happened:* Linus is back. The `amount > 20` test now happens *while* matching, so Ada keeps only her order over 20 and Linus - no matching order at all - is still preserved with a NULL. Rule to remember: on an outer join, **conditions about the matched table go in `ON`; conditions that filter the final result go in `WHERE`.** (If you genuinely want to filter on a right column *and* drop non-matches, an INNER join is what you meant - write it as INNER.)

## 3. Joining on the wrong columns

The database matches whatever columns you tell it to, even when that's nonsense - it can't know `orders.user_id` is meant to point at `users.id`; it only does what the `ON` clause says. Two ways this bites:

- **Right name, wrong table's column.** Both tables might have an `id`. Writing `ON orders.id = users.id` matches *order ids* against *user ids* - pure coincidence when anything matches at all. You wanted `orders.user_id = users.id`.
- **Plausible but incorrect key.** Joining on something like a name or an email that *looks* unique but isn't guaranteed to be. Two users named "Ada" and you'll cross-match their orders. Always join on the real key (the id), not on a human-readable field that merely seems unique.

**The calm fix.** Say the `ON` clause out loud as a sentence (the trick from Phase 1): "match each order to the user whose `id` equals the order's `user_id`." If the sentence is true about your data, the columns are right. If it sounds absurd ("match each order to the user whose id equals the order's id"), you've found the bug.

## 4. The sanity check: does the row count make sense?

Here's the habit that catches all three gotchas above before they reach anyone else. After writing a join, **ask what the row count *should* be, then check it.**

If each order belongs to exactly one user (a many-orders-to-one-user relationship), joining `orders` to `users` should give you **one row per matching order - never more.**

```sql
SELECT COUNT(*) FROM orders;                          -- the baseline

SELECT COUNT(*)
FROM orders
INNER JOIN users ON orders.user_id = users.id;        -- the join
```

```text
 COUNT(*)
──────────
 4            ← orders alone (our baseline)

 COUNT(*)
──────────
 3            ← after INNER JOIN
```

*What just happened:* Four orders, three after the join. That drop is expected and explainable - order `104` has no matching user, so INNER dropped it. The number went *down* by exactly the orphan we already knew about. That's a healthy join.

Now you know what each direction of surprise means:

- **Count went UP** (more rows than your baseline table)? You've got a cartesian/duplicate problem (§1) - you're joining on something that isn't unique. This is the dangerous one; investigate immediately.
- **Count dropped more than you expected**? An INNER join is silently discarding non-matching rows you wanted (the §2 trap), or your `ON` columns are wrong (§3). A LEFT join may be what you need.
- **Count is exactly what you predicted**? You've earned your confidence.

💡 **Key point.** A join you can't predict the row count of is a join you don't understand yet. Predicting it first, then checking, is the single cheapest way to catch every gotcha in this phase.

## When the join is correct but slow

Everything here has been about getting the *right* rows. A different problem - a correct join that takes ages on a big table - is usually about whether the columns in your `ON` clause are indexed, and how the database executes the match. That's covered in [Why Is My Query Slow?](/guides/why-is-my-query-slow). Get the join *correct* first (this guide); make it *fast* second (that one).

## Recap

1. **A missing or always-true `ON` clause** causes a cartesian explosion - every row paired with every row. Always join on a unique key.
2. **A `WHERE` on a right-table column** turns a LEFT JOIN back into an INNER JOIN by filtering out its NULL rows; put match conditions in `ON` instead.
3. **Joining on the wrong columns** matches nonsense without erroring - read the `ON` clause aloud to check it.
4. **Predict the row count, then verify it** - up means duplication, an unexpected drop means lost matches, exact means you're good.
5. Right rows first (this guide); fast joins second ([Why Is My Query Slow?](/guides/why-is-my-query-slow)).

You can now join tables on purpose, pick the type that keeps exactly the rows you mean, and catch the three classic ways a join lies. The data you split apart goes back together - correctly, and without surprises.

---

[← Phase 2: INNER vs LEFT (and the Others)](02-inner-vs-left.md) · [Guide overview](_guide.md)
