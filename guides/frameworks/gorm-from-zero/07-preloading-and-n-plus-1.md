---
title: "Preloading & the N+1 Trap"
guide: "gorm-from-zero"
phase: 7
summary: "GORM never lazy-loads associations, so Posts comes back empty until you ask. Learn Preload's two-query pattern, the N+1 explosion that bites everyone, nested loads, and Joins vs Preload."
tags: [gorm, go, preload, n-plus-1, joins, performance]
difficulty: advanced
synonyms: ["gorm preload", "gorm n+1", "gorm joins vs preload", "gorm load associations", "gorm nested preload", "gorm eager loading"]
updated: 2026-06-23
---

# Preloading & the N+1 Trap

In [Associations](06-associations.md) you wired up the blog's relationships: a `User` has many `Post`s, a `Post` has many `Comment`s and belongs to a `User`. The schema knows about all of this. So you'd expect that when you load a user, their posts ride along for free.

They don't. And the first time you hit this, you'll stare at an empty slice and wonder what you did wrong. Let's fix the mental model before we fix any code.

## The one fact that prevents 90% of the confusion

> 💡 **GORM does not lazy-load associations.** Loading a user does *not* load their posts. The related data shows up only when you explicitly ask for it with `Preload` (or `Joins`).

If you've come from Hibernate or some other ORM where touching `user.getPosts()` quietly fires a query in the background, throw that intuition away here. Go has no proxies, no magic getters, no hook that intercepts field access. A struct field is a struct field. When GORM hands you back a `User`, the `Posts` slice is whatever the constructor left it as — empty.

```go
var users []User
db.Find(&users)

fmt.Println(len(users))          // 3   ← the users loaded fine
fmt.Println(len(users[0].Posts)) // 0   ← but Posts is empty!
```

*What just happened:* `Find` ran exactly one query — `SELECT * FROM users` — and filled the slice. It never touched the `posts` table, so `users[0].Posts` is the zero value for a slice: empty. Nothing is wrong. GORM did precisely what you told it, which was "load users." You didn't ask for posts, so it didn't fetch them.

> 📝 This is a *feature*, not a missing one. Implicit loading is exactly what causes surprise queries and runaway latency in other ORMs. GORM makes you say what you want, so the query count is something you control on purpose.

## Preload: the two-query pattern

To get the posts, you ask:

```go
var users []User
db.Preload("Posts").Find(&users)

fmt.Println(len(users[0].Posts)) // 5   ← now they're here
```

*What just happened:* `Preload("Posts")` told GORM to also load each user's `Posts`. The string `"Posts"` is the **field name on the struct**, not a table name — match it to your Go field, capitalization and all. Now `users[0].Posts` is populated.

The interesting part is *how* GORM fills it. Watch the SQL it logs:

```sql
SELECT * FROM `users`;
SELECT * FROM `posts` WHERE `posts`.`user_id` IN (1,2,3);
```

*What just happened:* Two queries. The first loads all users. GORM collects their IDs — `1, 2, 3` — then fires **one** second query with `WHERE user_id IN (...)` to grab every post belonging to any of those users in a single round trip. Back in Go, it stitches each post onto its owner by matching `user_id`.

The number that matters: **this is two queries whether you have 3 users or 3,000.** The `IN` list grows, but the round-trip count does not. Hold onto that — it's the whole point of the next section.

## ⚠️ The N+1 trap

Here's the scene. You know `Find` doesn't load posts. So you reach for the "obvious" fix: loop over the users and load each one's posts as you go.

```go
var users []User
db.Find(&users)                 // 1 query

for i := range users {
    db.Where("user_id = ?", users[i].ID).
        Find(&users[i].Posts)   // 1 query — PER USER
}
```

*What just happened:* It works! Every user ends up with their posts. But count the queries: 1 to load the users, then 1 more for *each* user in the loop. With 3 users that's 4 queries. With 1,000 users it's **1,001 queries.** This is the **N+1 problem** — 1 query to get the parents, plus N queries (one per parent) to get the children.

Now the same job with `Preload`:

```go
var users []User
db.Preload("Posts").Find(&users) // 2 queries, always
```

*What just happened:* Identical result — every user has their posts — in exactly **2 queries** no matter how many users come back. The loop version scaled with your data; `Preload` doesn't.

Here's why it hurts so much in production. Each query is a network round trip to the database. On localhost a round trip is a fraction of a millisecond and you'll never notice the loop. Ship it to a real deployment where the database is 2ms away across the network, load a page listing 500 users, and you've just spent a full second doing nothing but waiting on round trips. The endpoint that flew in dev now crawls.

> ⚠️ The cruel part: N+1 is **invisible in testing**. Small datasets and a local database hide it completely. It only shows up under real load with real row counts — which is to say, in front of real users. The fix is to *look at your query log* in development, not your stopwatch.

This is the single most common ORM performance bug there is, and it's covered from the database's side in [Why Is My Query Slow?](/guides/why-is-my-query-slow). When you see "the page got slow after we added related data," N+1 is the first thing to check.

## Nested and conditioned preloads

Real pages need more than one level. The blog wants users, *their* posts, and *those* posts' comments. Chain the path with a dot:

```go
db.Preload("Posts.Comments").Find(&users)
```

*What just happened:* GORM walks the path two levels deep. It runs three queries — users, then posts for those users (`WHERE user_id IN (...)`), then comments for those posts (`WHERE post_id IN (...)`) — and stitches the whole tree together. Still a fixed, small number of queries, not one-per-row at any level.

Often you don't want *all* the children. Pass a condition as extra arguments and it becomes a `WHERE` on the preload query:

```go
db.Preload("Posts", "published = ?", true).Find(&users)
```

*What just happened:* The second query becomes `SELECT * FROM posts WHERE user_id IN (...) AND published = true`. Each user gets only their published posts; drafts never load. The condition syntax is the same `?`-placeholder style you used in [Querying](04-querying.md) — and the placeholder still protects you from SQL injection.

And when you genuinely want every direct association without naming each one:

```go
import "gorm.io/gorm/clause"

db.Preload(clause.Associations).Find(&users)
```

*What just happened:* `clause.Associations` is a shorthand that preloads **every association one level deep** — for the blog's `User`, that's `Posts` and any other direct relations. Note the limit: it goes one level only. It will *not* descend into `Posts.Comments`; nested paths you still spell out by hand.

## Joins vs Preload: one row vs many rows

`Preload` isn't the only way to pull in related data. `Joins` does it with an actual SQL `JOIN`:

```go
var posts []Post
db.Joins("User").Find(&posts)
```

*What just happened:* One query — `SELECT ... FROM posts LEFT JOIN users ON users.id = posts.user_id` — and each post comes back with its `User` field filled. A single round trip, no second query. For a **belongs-to** or **has-one** relationship, this is the better tool: each post has exactly one user, so the join adds one column-set per row and nothing multiplies.

So why not use `Joins` for everything? Because of what a JOIN does to **has-many**. Picture joining users to their posts:

```sql
SELECT * FROM users LEFT JOIN posts ON posts.user_id = users.id;
```

A user with 5 posts produces **5 rows** in the result — the user's columns repeated on every one. Ten users with 5 posts each is 50 rows, every user's data copied five times over the wire. That's the **row-multiplication** problem, and it gets worse the more children each parent has. `Preload`'s separate `IN` query sidesteps it entirely: users come back once, posts come back once, GORM assembles them in memory.

The rule of thumb:

- **Belongs-to / has-one (one related row)** → `Joins`. One query, no multiplication.
- **Has-many / many-to-many (many related rows)** → `Preload`. Avoids the row blow-up.

> 💡 This isn't a GORM quirk — it's the same tradeoff in every ORM. Hibernate calls it the same N+1 and offers `JOIN FETCH` versus batch loading ([Hibernate & JPA From Zero](/guides/hibernate-and-jpa-from-zero)); SQLAlchemy gives you `joinedload` versus `selectinload` ([SQLAlchemy From Zero](/guides/sqlalchemy-from-zero)) for exactly this one-row-vs-many-rows decision. Learn the shape once and it transfers to every data layer you'll ever touch.

## Recap

- **GORM never lazy-loads.** `db.Find(&users)` leaves `user.Posts` empty — there are no background queries on field access. You load associations explicitly or not at all.
- **`Preload` is the two-query pattern.** It loads the parents, then runs one `WHERE ... IN (...)` query for the children and stitches them together — 2 queries regardless of row count.
- **N+1 is the trap.** Looping and querying per parent is 1+N queries; `Preload` replaces it with 2. It's invisible on small/local data and brutal under real load — read your query log, not your stopwatch.
- **Nested and conditioned:** `Preload("Posts.Comments")` goes deep, `Preload("Posts", "published = ?", true)` filters children, `Preload(clause.Associations)` grabs everything one level down.
- **`Joins` vs `Preload`:** `Joins` (one SQL JOIN) for belongs-to/has-one; `Preload` (separate IN query) for has-many, because a JOIN multiplies parent rows by their children.
- The one-row-vs-many-rows decision is universal — the same trap and the same fix in Hibernate and SQLAlchemy.

## Quick check

```quiz
[
  {
    "q": "After db.Find(&users), what is in users[0].Posts?",
    "choices": ["The user's posts, loaded automatically", "An empty slice — GORM doesn't lazy-load", "A lazy proxy that loads on first access", "An error, because Posts wasn't selected"],
    "answer": 1,
    "explain": "GORM has no lazy loading. Find loads only users; Posts stays the empty zero value until you Preload it."
  },
  {
    "q": "You load 200 users, then loop and run db.Find(&u.Posts) per user. How many queries run?",
    "choices": ["2", "200", "201", "400"],
    "answer": 2,
    "explain": "1 query for the users plus N (200) for the loop = 201. That's the N+1 problem; Preload would make it 2."
  },
  {
    "q": "A Post belongs to one User. Which is the better tool to load each post's User?",
    "choices": ["Joins — one JOIN, no row multiplication", "Preload — to avoid the row blow-up", "A per-post query in a loop", "Neither; it loads automatically"],
    "answer": 0,
    "explain": "Belongs-to is one related row, so a JOIN adds no extra rows. Preload's separate query is for has-many, where a JOIN would multiply parent rows."
  }
]
```

[← Phase 6: Associations](06-associations.md) · [Guide overview](_guide.md) · [Phase 8: Transactions, Hooks & Migrations →](08-transactions-hooks-migrations.md)
