---
title: "What a Transaction Is"
guide: "transactions-and-acid"
phase: 1
summary: "A transaction is a bundle of database changes that either all happen or none do; you mark its edges with BEGIN, seal it with COMMIT, and throw the whole thing away with ROLLBACK."
tags: [databases, transactions, begin, commit, rollback, sql]
difficulty: intermediate
synonyms: ["what is a database transaction", "begin commit rollback", "all or nothing database", "how to do a money transfer in sql", "what does rollback do"]
updated: 2026-06-19
---

# What a Transaction Is

Let's go back to that money transfer, because it's the cleanest way to feel why transactions exist. Moving $100 from Alice to Bob isn't one change — it's two: take $100 off Alice's balance, add $100 to Bob's. Both are simple `UPDATE` statements. The danger lives in the gap *between* them.

If anything interrupts you after the first statement and before the second — a crash, a network drop, a thrown exception in your application code — you've created money out of thin air or destroyed it. The database doesn't know these two updates belong together. Unless you tell it.

## The mental model: a bundle that's all-or-nothing

**What a transaction actually is.** A transaction is a way of saying to the database: *"Treat these statements as one indivisible unit. Apply all of them, or — if anything goes wrong — apply none of them. Never leave me halfway."*

Picture it as wrapping several changes in a single sealed envelope. While the envelope is open you can keep adding changes to it. The moment you seal it (`COMMIT`), everything inside becomes permanent together. If you tear it up instead (`ROLLBACK`), everything inside disappears together, as if you never started.

```text
   BEGIN ───────────────────────────────────► COMMIT
     │                                            │
     │   ┌──────────────────────────────────┐     │   all changes
     │   │  UPDATE alice  (-$100)           │     │   become permanent
     │   │  UPDATE bob    (+$100)           │     │   AT THE SAME MOMENT
     │   └──────────────────────────────────┘     │
     │              the bundle                     ▼
     │
     └──────────────────────────────► ROLLBACK
                                          │
                                          ▼   the WHOLE bundle is
                                              thrown away — as if
                                              nothing ever happened
```

That's the entire idea. Everything else in this guide is detail hanging off this one picture: changes go in a bundle, and the bundle commits or rolls back *as a whole*.

## The three commands you'll actually use

**`BEGIN`** opens the envelope. From this point, your changes are provisional — visible to you, but not yet permanent and (usually) not yet visible to anyone else.

**`COMMIT`** seals it. Every change since `BEGIN` becomes permanent, all at once.

**`ROLLBACK`** tears it up. Every change since `BEGIN` is undone, all at once.

📝 **Terminology.** Different databases spell the opener slightly differently: PostgreSQL and MySQL accept `BEGIN`; the SQL standard keyword is `START TRANSACTION` (both work in MySQL and Postgres). They mean the same thing — open the bundle. We'll use `BEGIN`.

## A real example: the safe money transfer

Here's the transfer done right. Watch the edges.

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice';
UPDATE accounts SET balance = balance + 100 WHERE name = 'Bob';

COMMIT;
```

```text
 name  | balance        name  | balance        name  | balance
-------+--------        -------+--------        -------+--------
 Alice |    500   ───►  Alice |    400   ───►  Alice |    400
 Bob   |    200         Bob   |    200         Bob   |    300
       (before)         (mid-bundle,           (after COMMIT —
                         seen only by you)      everyone sees this)
```

*What just happened:* Between `BEGIN` and `COMMIT`, both updates ran inside the bundle. Critically, no other connection saw Alice down $100 while Bob was still waiting — to the rest of the world, the two balances changed in the same instant, at `COMMIT`. The money was never missing and never doubled. If the server had crashed after the first `UPDATE` but before `COMMIT`, the unsealed bundle would be discarded on restart, and Alice would still have her $500.

## When something goes wrong: ROLLBACK

Now suppose you check Alice's balance mid-transfer and discover she only has $50. You don't want a half-finished transfer sitting there. You throw the whole thing away:

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice';
-- your application checks the balance, sees it went negative, and decides to abort

ROLLBACK;
```

```text
 name  | balance        name  | balance        name  | balance
-------+--------        -------+--------        -------+--------
 Alice |     50   ───►  Alice |    -50   ───►  Alice |     50
       (before)         (mid-bundle,           (after ROLLBACK —
                         seen only by you)      back to exactly before)
```

*What just happened:* The `UPDATE` had taken effect *inside* the bundle, so your own connection saw Alice at -$50. But `ROLLBACK` discarded the entire bundle, snapping Alice's balance back to exactly where it was before `BEGIN`. No trace of the attempt remains. This is the superpower: you can make changes, look at the result, and still change your mind cleanly.

⚠️ **Gotcha: an open transaction holds on until you close it.** A transaction isn't free while it's open — it can hold locks and keep older row versions around so it has a consistent view. If your application opens a transaction and then wanders off (waits on a slow API call, hits an unhandled exception, or the developer forgets to commit), that bundle stays open. Other transactions can pile up behind its locks, and your database's cleanup can't reclaim space. The rule: **open a transaction as late as you can, and close it — commit or rollback — as soon as you can.** Don't do slow, unrelated work in the middle of one.

## Why this saves you later

Once you see every group of related writes as a bundle, a whole category of 2am bugs stops being mysterious. "Why is this order marked paid but has no line items?" "Why does this user have a profile row but no account row?" Almost always: two writes that should have been one transaction were left as two separate statements, and something died in the gap. The fix is the same shape every time — wrap the related writes in `BEGIN ... COMMIT` so they live or die together.

## Recap

1. A **transaction** is a bundle of changes that either all happen or none do — never halfway.
2. **`BEGIN`** opens the bundle; **`COMMIT`** makes everything in it permanent at once; **`ROLLBACK`** discards everything in it at once.
3. Inside an open bundle you see your own provisional changes; the outside world sees nothing until `COMMIT`.
4. The money transfer is the canonical case: two updates that must succeed or fail *together*.
5. Keep transactions short — an open one holds locks and resources until you close it.

---

[← Guide overview](_guide.md) · [Phase 2: ACID, Explained →](02-acid-explained.md)
