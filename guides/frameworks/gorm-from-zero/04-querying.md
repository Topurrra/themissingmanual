---
title: "Querying"
guide: "gorm-from-zero"
phase: 4
summary: "Build real queries with GORM: Where in all its forms, the struct-vs-map zero-value trap, Order/Limit/Offset for pagination, Select and Count, and reusable scopes — always watching the SQL."
tags: [gorm, go, query, where, order, scopes]
difficulty: intermediate
synonyms: ["gorm where", "gorm order limit offset", "gorm select", "gorm scopes", "gorm struct conditions", "gorm query builder"]
updated: 2026-07-10
---

# Querying

Here's the one idea that makes everything in this phase click: **a GORM chain doesn't run anything until you tell it to**. When you write `db.Where(...).Order(...).Limit(...)`, you're not hitting the database — you're *assembling* a query, clause by clause, in memory, and each method bolts one more piece onto a query that's still just sitting there. Nothing touches the database until you call a **finalizer** — `Find`, `First`, `Count`, and friends — which is the moment GORM turns your assembled chain into actual SQL and sends it over the wire.

> 💡 This is exactly how a SQL query builder works in any language. `Where` ≈ the `WHERE` clause, `Order` ≈ `ORDER BY`, `Limit` ≈ `LIMIT`. You're describing a SQL statement in Go syntax, and the finalizer compiles and runs it. Hold that mapping and GORM stops feeling like magic.

Throughout this phase, picture the SQL each chain produces. We'll show it side by side so the translation becomes second nature.

## The chain builds; the finalizer runs

```go
// This line does NOT hit the database. It returns a *gorm.DB
// carrying a half-built query.
query := db.Where("published = ?", true).Order("created_at desc")

// THIS line runs it — Find is the finalizer.
var posts []Post
query.Find(&posts)
```

```sql
SELECT * FROM posts WHERE published = true ORDER BY created_at desc;
```

*What just happened:* The first statement assembled a `WHERE` and an `ORDER BY` and handed back a `*gorm.DB` with that state stored inside. No SQL ran. Only `Find(&posts)` triggered the round-trip: GORM compiled the accumulated clauses into one `SELECT`, ran it, and scanned each row into the `posts` slice. Common finalizers: `Find` (many rows), `First`/`Take`/`Last` (one row), `Count` (a number), plus `Create`/`Save`/`Delete` from the other phases.

## `Where`, in all its forms

`Where` is where most of your filtering lives. The workhorse form is a **string with `?` placeholders** plus arguments — and you should *always* use placeholders, never string concatenation, because GORM parameterizes them and the database escapes them for you (no SQL injection).

```go
var posts []Post

// Single condition
db.Where("view_count > ?", 1000).Find(&posts)

// Multiple conditions in one string
db.Where("view_count > ? AND published = ?", 1000, true).Find(&posts)

// IN — pass a slice, GORM expands it
db.Where("id IN ?", []uint{1, 2, 3}).Find(&posts)

// LIKE — the % wildcards go in the argument, not the SQL
db.Where("title LIKE ?", "%go%").Find(&posts)
```

```sql
SELECT * FROM posts WHERE view_count > 1000;
SELECT * FROM posts WHERE view_count > 1000 AND published = true;
SELECT * FROM posts WHERE id IN (1,2,3);
SELECT * FROM posts WHERE title LIKE '%go%';
```

*What just happened:* Each `Where` became a `WHERE` clause. For `IN`, you hand GORM a Go slice and it expands it into `(1,2,3)` — note there are no parentheses in your Go string; GORM adds them. For `LIKE`, the `%` wildcards belong in the *argument value* (`"%go%"`), so they pass through the placeholder safely. The `?` placeholders mean the values are sent separately from the SQL text, which is what keeps you safe from injection.

### Chaining, `Or`, and `Not`

Chain multiple `Where` calls and GORM joins them with **AND**. For OR, use `Or`; to negate, use `Not`.

```go
// Chained Where = AND
db.Where("published = ?", true).Where("view_count > ?", 500).Find(&posts)

// Or
db.Where("view_count > ?", 1000).Or("featured = ?", true).Find(&posts)

// Not
db.Not("published = ?", false).Find(&posts)
```

```sql
SELECT * FROM posts WHERE published = true AND view_count > 500;
SELECT * FROM posts WHERE view_count > 1000 OR featured = true;
SELECT * FROM posts WHERE NOT (published = false);
```

*What just happened:* Two `Where`s in a row produced `AND` — that's the default glue. `Or` switched the connector to `OR` for that fragment, and `Not` wrapped its condition in a negation. When you start mixing `AND` and `OR`, watch the generated SQL closely: operator precedence in the database may not group things the way you assumed, and a stray `OR` can quietly widen your result set.

## Struct vs map conditions — the zero-value trap

GORM lets you pass a **struct** as a condition: it reads the non-empty fields and builds equality checks. It's clean and type-safe — until it silently drops a field on you.

```go
// Struct condition — matches on the fields you set
db.Where(&User{Name: "Alice", Active: true}).Find(&users)
```

```sql
SELECT * FROM users WHERE name = 'Alice' AND active = true;
```

*What just happened:* GORM walked the struct, found `Name` and `Active` set, and turned each into an `=` condition. Looks great. Now here's the trap. ⚠️

```go
// You WANT: everyone whose age is 0. You get: everyone.
db.Where(&User{Age: 0}).Find(&users)
```

```sql
SELECT * FROM users;   -- the Age condition vanished!
```

*What just happened:* **Struct conditions ignore zero-value fields.** `Age: 0` is the zero value for an `int`, so GORM can't tell "I deliberately want age 0" apart from "I didn't set age," and it leaves the condition out entirely. Same for `Name: ""`, `Active: false`, `nil` pointers — all silently dropped. The query you *thought* filtered returns the whole table.

The fix when you genuinely need to match a zero value: use a **map**, where a present key always becomes a condition.

```go
// Map condition — the key is there, so the condition is there
db.Where(map[string]any{"age": 0}).Find(&users)
```

```sql
SELECT * FROM users WHERE age = 0;
```

*What just happened:* A map carries no notion of "zero means unset" — if the key `"age"` is in the map, GORM emits `age = 0`, full stop. Rule of thumb: structs for the common case (non-zero values, type safety); maps the moment a zero, empty string, or false is a real value you need to filter on.

## `Order`, `Limit`, `Offset`, `Select`, `Count`

These map straight onto their SQL clauses. `Order` sorts, `Limit` caps the row count, and `Offset` skips rows — together they give you pagination.

```go
// Page 3 of 10-per-page: skip 20, take 10, newest first
var posts []Post
db.Order("created_at desc").Limit(10).Offset(20).Find(&posts)
```

```sql
SELECT * FROM posts ORDER BY created_at desc LIMIT 10 OFFSET 20;
```

*What just happened:* `Order` set the sort, `Limit` capped results at 10, and `Offset` skipped the first 20 — so this is page 3 (offsets 0, 10, 20...). The general pagination formula is `Offset((page - 1) * pageSize).Limit(pageSize)`. Always pair pagination with an `Order`; without a stable sort, "page 2" isn't guaranteed to exclude what "page 1" already showed.

Use `Select` to fetch only the columns you need, and `Count` to get a number instead of rows.

```go
// Only pull two columns
var users []User
db.Select("name", "email").Find(&users)

// Count rows matching a condition — note Model + Count
var n int64
db.Model(&User{}).Where("active = ?", true).Count(&n)
```

```sql
SELECT name, email FROM users;
SELECT count(*) FROM users WHERE active = true;
```

*What just happened:* `Select` narrowed the `SELECT` list to two columns — handy when a table is wide and you only need a couple of fields. `Count` is a finalizer that returns a count rather than scanning rows; because there's no slice to infer the table from, you tell GORM the table with `Model(&User{})`, and the result lands in an `int64` you pass by pointer.

## Scopes — reusable query fragments

Once you've written `Where("published = ?", true)` for the fifth time, pull it into a **scope**: a function that takes a `*gorm.DB`, adds some clauses, and returns it. You then drop it into any chain with `Scopes(...)`.

```go
// A scope is just: func(*gorm.DB) *gorm.DB
func Published(db *gorm.DB) *gorm.DB {
    return db.Where("published = ?", true)
}

func Popular(db *gorm.DB) *gorm.DB {
    return db.Where("view_count > ?", 1000)
}

// Compose them into a chain — order them however reads best
var posts []Post
db.Scopes(Published, Popular).Order("created_at desc").Find(&posts)
```

```sql
SELECT * FROM posts
WHERE published = true AND view_count > 1000
ORDER BY created_at desc;
```

*What just happened:* `Published` and `Popular` each take the in-progress `*gorm.DB`, tack on a `Where`, and hand it back. `Scopes(Published, Popular)` ran both against the chain before the finalizer, so their conditions joined with `AND` — exactly as if you'd written the two `Where`s inline. Now "published and popular" is a named, testable, reusable thing you can compose anywhere instead of copy-pasting filter strings.

> 💡 Scopes are also where pagination logic usually lives — a `Paginate(page, size)` scope keeps every list endpoint consistent. Keep the Phase 1 SQL logger on while you build them so you can *see* what each scope adds to the statement. The moment a chain produces SQL you didn't expect — a missing condition, a surprise full scan — you've caught a bug before it ships. That habit of reading the generated SQL is the same skill that saves you in [Why Is My Query Slow?](/guides/why-is-my-query-slow).

## Recap

- A chain **builds** a query lazily; nothing runs until a **finalizer** (`Find`, `First`, `Count`, ...) compiles and executes it.
- `Where` takes a string with `?` placeholders plus args — always parameterize. Chained `Where` = AND; use `Or` and `Not` for the rest. `IN` takes a slice; `LIKE` puts the `%` in the argument.
- **Struct conditions silently ignore zero-value fields** (`0`, `""`, `false`, `nil`). When a zero value is a real filter, use a `map[string]any` instead.
- `Order` + `Limit` + `Offset` give pagination (`Offset((page-1)*size).Limit(size)`); always pair with an `Order`. `Select` narrows columns; `Count` needs `Model(&T{})` and an `int64`.
- **Scopes** are `func(*gorm.DB) *gorm.DB` fragments composed via `Scopes(...)` — reusable, testable filters. Keep the SQL logger on to confirm each chain generates what you expect.

Check your grip on the lazy chain and the zero-value trap:

```quiz
[
  {
    "q": "When does `db.Where(\"age > ?\", 18).Order(\"name\")` actually run SQL against the database?",
    "choices": ["As soon as Where is called", "As soon as Order is called", "Only when a finalizer like Find or Count is called", "When the *gorm.DB variable goes out of scope"],
    "answer": 2,
    "explain": "The chain only builds the query in memory. SQL runs when a finalizer (Find, First, Count, etc.) compiles and executes it."
  },
  {
    "q": "What does `db.Where(&User{Age: 0}).Find(&users)` return?",
    "choices": ["Only users with age 0", "All users — the zero-value Age condition is dropped", "A compile error", "No users at all"],
    "answer": 1,
    "explain": "Struct conditions ignore zero-value fields, so `Age: 0` is omitted and the query has no WHERE. Use map[string]any{\"age\": 0} to match a zero value."
  },
  {
    "q": "What is a GORM scope?",
    "choices": ["A struct tag that limits column access", "A function `func(*gorm.DB) *gorm.DB` that adds clauses and is composed via Scopes(...)", "A transaction boundary", "A way to scope a connection to one goroutine"],
    "answer": 1,
    "explain": "A scope takes the in-progress *gorm.DB, adds query clauses, and returns it. You compose scopes into a chain with Scopes(...)."
  }
]
```

---

[← Phase 3: Create & Read](03-create-and-read.md) · [Guide overview](_guide.md) · [Phase 5: Update & Delete →](05-update-and-delete.md)
