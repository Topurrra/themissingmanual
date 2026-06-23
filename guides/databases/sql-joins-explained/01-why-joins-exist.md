---
title: "Why Joins Exist"
guide: "sql-joins-explained"
phase: 1
summary: "You split data into separate, linked tables on purpose; a JOIN matches rows from one table to rows in another using the shared key, so you can ask questions that span both."
tags: [sql, joins, foreign-key, relational, mental-model]
difficulty: beginner
synonyms: ["why do i need a join", "what does a join do", "how does a join match rows", "join on a foreign key", "combine two tables in one query"]
updated: 2026-06-19
---

# Why Joins Exist

If you've just come from learning about [relationships and keys](/guides/relationships-and-keys), you did something that felt slightly counterintuitive: you took information that "belongs together" — a customer and their orders — and deliberately split it into *separate tables*. That was correct. But it leaves you with a real problem the moment you want to answer an everyday question, and that problem is exactly what a join solves.

This phase doesn't teach you a single piece of join syntax to memorize. It installs the one picture everything else rests on: **a join matches rows in one table to rows in another, using a value they share.** Get that picture and the rest of this guide is just variations on it.

## The two tables we'll use everywhere

Throughout this guide we'll use the same tiny example: a `users` table and an `orders` table. Here they are.

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

Notice the link: every order carries a `user_id`. That column is how an order points back to the person who placed it. Order `101` has `user_id = 1`, and user `1` is Ada — so order `101` is Ada's.

📝 **Terminology — foreign key.** A *foreign key* is a column in one table whose value refers to a row in another table. Here, `orders.user_id` is a foreign key pointing at `users.id`. It's the thread that ties the two tables together, and it's the column a join will match on.

(Look closely and you'll spot two oddities: order `104` has `user_id = 7`, but there's no user `7`. And user `3`, Linus, has no orders at all. Those aren't mistakes — they're the exact cases that make Phase 2 and Phase 3 matter. Hold onto them.)

## Why the data is split in the first place

**The common wrong instinct.** When people first feel this pain, they think: "This is silly — I should have put the user's name directly *in* the orders table. Then I wouldn't need a join at all."

**Why that falls apart.** Imagine you did that — every order row carries its own copy of `name = "Ada"`. Now Ada changes her name. You have to find and update every single order she ever placed, and if you miss one, your data now disagrees with itself. Worse, a user who hasn't ordered yet has nowhere to exist. Splitting users and orders into separate tables means each fact lives in exactly one place: Ada's name is stored once, in `users`. That's the whole point, and it's why joins exist — the cost of storing each fact once is that you need a way to *recombine* facts on demand.

💡 **Key point.** You didn't split your tables to make querying harder. You split them so each fact is stored once. A join is the tool that pays that back: it recombines the split tables for a single question, without duplicating anything on disk.

## What a join actually is

**What it actually is.** A join is an instruction to the database: "for each row in table A, go find the matching row(s) in table B, and glue them together into wider rows." You tell it *how* to decide what "matching" means — almost always "where this column equals that column."

**What it does in real life.** Let's ask the everyday question: *show each order along with the name of the person who placed it.* That answer needs columns from both tables, so we join them.

```sql
SELECT orders.order_id, users.name, orders.amount
FROM orders
JOIN users ON orders.user_id = users.id;
```

The `ON orders.user_id = users.id` is the heart of it. It's the matching rule — the *join condition*. It tells the database: a row in `orders` matches a row in `users` when the order's `user_id` equals the user's `id`.

```text
 order_id │ name  │ amount
──────────┼───────┼────────
 101      │ Ada   │ 40
 102      │ Ada   │ 15
 103      │ Grace │ 90
```

*What just happened:* For each order, the database looked up the user whose `id` matched that order's `user_id`, then produced one wide row combining columns from both tables. Order `101` (`user_id = 1`) got paired with Ada; order `103` (`user_id = 2`) got paired with Grace. The two separate tables became one result that answers your actual question.

You can run the same move right now on two built-in tables — `books` and `authors`, linked by `books.author_id`:

```sql runnable
SELECT books.title, authors.name
FROM books
JOIN authors ON books.author_id = authors.id;
```
*What just happened:* For each book, the database looked up the author whose `id` matched the book's `author_id`, then glued the two together into one wide row — every book shown beside the person who wrote it. Two separate tables became one result that answers a question spanning both.

⚠️ **Where did orders go?** You started with four orders but got back three rows. Order `104` (`user_id = 7`) vanished, because there's no user `7` to match it to. That's not a bug — it's the *defining behavior* of the plain `JOIN` you just wrote (it's an INNER join, which keeps only rows that match on both sides). Whether that's what you want is the entire subject of Phase 2. For now, notice that a join doesn't only combine rows — it can also *drop* the ones that don't match.

## How to read a join condition out loud

When you see a join, read it as a sentence and it stops looking cryptic:

```text
  FROM orders                       "start with the orders table"
  JOIN users                        "bring in the users table"
  ON orders.user_id = users.id      "matching each order to the user
                                     whose id equals the order's user_id"
```

The `ON` clause is always answering one question: *how do I know which row over here goes with which row over there?* For the rest of this guide, whenever a join surprises you, the first thing to check is the `ON` clause — it's the rule the whole result is built from.

📝 **Terminology — table alias.** You'll often see joins written with short aliases to save typing: `FROM orders o JOIN users u ON o.user_id = u.id`. The `o` and `u` are just nicknames for the tables. We'll mostly spell the table names out in full here for clarity, but aliases mean exactly the same thing.

## Why this saves you later

Once you see a join as "match rows from A to rows in B on a shared key," a huge amount of SQL stops being intimidating. Reports that pull from five tables are just this same move, repeated. And the day a query returns the wrong number of rows — too few, or suspiciously too many — you'll know exactly where to look: the matching rule in the `ON` clause, and whether you wanted the non-matching rows kept or dropped. That single decision is Phase 2.

## Recap

1. You split data into separate tables so each fact is stored **once** — that's good design, not a mistake.
2. A **foreign key** (like `orders.user_id`) is the thread linking a row in one table to a row in another.
3. A **join** recombines those tables for one query by **matching rows on a shared value**, defined in the `ON` clause.
4. A plain `JOIN` keeps only rows that find a match on both sides — so it can *drop* rows (order `104` disappeared). Controlling that is what comes next.

---

[← Guide overview](_guide.md) · [Phase 2: INNER vs LEFT (and the Others) →](02-inner-vs-left.md)
