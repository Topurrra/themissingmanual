---
title: "Create & Read"
guide: "gorm-from-zero"
phase: 3
summary: "Insert rows with Create and read them back with the four finders — First, Take, Last, and Find — plus the ErrRecordNotFound pattern and why parameterized placeholders keep you safe."
tags: [gorm, go, create, read, crud, query]
difficulty: intermediate
synonyms: ["gorm create", "gorm first find take", "gorm read record", "gorm errrecordnotfound", "gorm insert", "gorm get by id"]
updated: 2026-07-10
---

# Create & Read

You've got a struct that maps to a table, and `AutoMigrate` has built that table for you. Now comes the part that makes an ORM feel like magic the first time: you hand GORM a Go value, and a row appears in the database. Then you ask for it back, and it lands in a struct, fully populated. No `INSERT`, no `SELECT`, no scanning columns into fields by hand.

Staying in control is a matter of keeping one picture in your head.

## The mental model

There are two directions of traffic, and only two:

> 💡 **`Create` pushes a struct into the database and fills in the generated fields. The finders (`First` / `Take` / `Last` / `Find`) pull rows out of the database into your structs.** Write goes one way, read comes back the other.

That's it. When you write, GORM doesn't just fire off an `INSERT` and forget — it reads the auto-generated primary key (and timestamps) back out and writes them *into the struct you passed*. When you read, GORM runs a `SELECT`, takes the columns, and pours them into the destination you handed it. The struct is the shape; `*gorm.DB` is the pump moving rows in and out.

And because you turned on the logger back in [Phase 1](01-what-gorm-is.md), you can *watch* the SQL each call generates. That's your superpower throughout this guide: every GORM call here is shown with the SQL it produces, so the ORM never becomes a black box.

Here's the model we'll use for the whole phase — the start of our **blog**:

```go
type User struct {
	gorm.Model        // ID, CreatedAt, UpdatedAt, DeletedAt
	Name  string
	Email string
}
```

*What just happened:* We embedded `gorm.Model`, so this struct already has an `ID uint` primary key plus the timestamp and soft-delete fields from [Phase 2](02-models-and-migration.md). We only added the two columns that are actually ours: `Name` and `Email`.

## Inserting a row with `Create`

You build a Go value, take its address, and pass it to `Create`:

```go
user := User{Name: "Ada", Email: "ada@example.com"}

db.Create(&user)

fmt.Println("new ID is", user.ID)        // e.g. 1
fmt.Println("created at", user.CreatedAt) // e.g. 2026-06-23 10:04:00
```

*What just happened:* Notice we never set `user.ID` — it was `0` going in. After `Create` returns, `user.ID` is `1`. GORM ran the `INSERT`, the database assigned the primary key, and GORM **wrote that value back into the struct**. Same story for `CreatedAt` and `UpdatedAt`. The `&` matters: you pass a *pointer* so GORM can mutate your struct.

The SQL the logger prints looks like this:

```sql
INSERT INTO `users` (`created_at`,`updated_at`,`deleted_at`,`name`,`email`)
VALUES ('2026-06-23 10:04:00','2026-06-23 10:04:00',NULL,'Ada','ada@example.com')
RETURNING `id`
```

*What just happened:* GORM filled in `created_at`/`updated_at` for you, left `deleted_at` as `NULL` (the row isn't deleted), and used `RETURNING id` to grab the generated primary key — that's the value it copied back into `user.ID`.

### Checking whether it worked

`Create` returns a `*gorm.DB`, and the two fields you care about on it are `Error` and `RowsAffected`:

```go
result := db.Create(&user)
if result.Error != nil {
	log.Fatalf("insert failed: %v", result.Error)
}
fmt.Println("rows inserted:", result.RowsAffected) // 1
```

*What just happened:* GORM doesn't `panic` on a failed insert — a duplicate email, a broken connection, a constraint violation all surface as `result.Error`. Get into the habit of checking it. `result.RowsAffected` tells you how many rows the statement touched, which is `1` for a single insert.

> ⚠️ A common surprise: `Create` does **not** return an error for `nil` here, but it *will* error if a unique constraint or NOT NULL constraint is violated. Don't assume success — check `result.Error` every time you write.

### Inserting many rows at once

Pass a *slice* and GORM batches the insert:

```go
users := []User{
	{Name: "Linus", Email: "linus@example.com"},
	{Name: "Grace", Email: "grace@example.com"},
	{Name: "Edsger", Email: "edsger@example.com"},
}

result := db.Create(&users)
fmt.Println("rows inserted:", result.RowsAffected) // 3
fmt.Println("first new ID:", users[0].ID)          // 2
```

*What just happened:* One call, one `INSERT` statement with multiple value rows. GORM wrote the generated `ID` back into *each* element of the slice, so `users[0].ID`, `users[1].ID`, and so on are all populated. `RowsAffected` is `3`. This is far faster than calling `Create` in a loop — let GORM batch it.

## Reading rows back: the four finders

Now the other direction. GORM gives you four finder methods, and the difference between them is mostly *how many rows* and *in what order*. Learn these four and you've covered the vast majority of reads you'll ever write.

### `First` — one row, by primary key

Give it a struct pointer and an ID, and `First` fetches that row:

```go
var user User
db.First(&user, 1)   // find the user with ID = 1

fmt.Println(user.Name) // "Ada"
```

```sql
SELECT * FROM `users` WHERE `users`.`id` = 1 ORDER BY `users`.`id` LIMIT 1
```

*What just happened:* `First` orders by the primary key and takes the first row — here, the one matching `id = 1`. The second argument (`1`) is shorthand for "look this up by primary key." GORM scanned the single returned row into `user`. Note the `ORDER BY id` and `LIMIT 1`: that ordering is what makes it "first."

### `First` — one row, by a condition

Drop the ID and pass a condition string with `?` placeholders instead:

```go
var user User
db.First(&user, "email = ?", "grace@example.com")

fmt.Println(user.Name) // "Grace"
```

```sql
SELECT * FROM `users` WHERE email = 'grace@example.com' ORDER BY `users`.`id` LIMIT 1
```

*What just happened:* Same `First`, but now the lookup is "first row where `email` matches." The `?` is a placeholder; the `"grace@example.com"` argument fills it in safely (more on *why* that matters at the end). You still get `ORDER BY id LIMIT 1`, so among matching rows you get the lowest-ID one.

### `Take` — one row, no ordering

When you just want *some* row and don't care which, `Take` skips the `ORDER BY`:

```go
var user User
db.Take(&user)
```

```sql
SELECT * FROM `users` LIMIT 1
```

*What just happened:* No `ORDER BY` clause — GORM grabs whatever row the database hands back first. It's marginally cheaper than `First` because the database doesn't have to sort. Reach for `Take` when "any one row" is genuinely fine; reach for `First` when you want a deterministic "the first one."

(`Last` is the mirror of `First`: `db.Last(&user)` orders by primary key *descending* and takes one — the newest row by ID. Same shape, opposite end.)

### `Find` — all the rows, into a slice

When you want more than one row, pass a *slice* pointer to `Find`:

```go
var users []User
db.Find(&users)

fmt.Println("got", len(users), "users") // got 4 users
```

```sql
SELECT * FROM `users`
```

*What just happened:* No `LIMIT`, no `ORDER BY` — `Find` reads *every* row in the table and appends each one to the slice. (You'll add `Where`, `Order`, and `Limit` to narrow and shape this in [Phase 4](04-querying.md); right now it's the firehose.) `Find` works with a condition too: `db.Find(&users, "name = ?", "Ada")` returns all matching rows.

## The one gotcha that bites everyone: zero rows

Here's the difference between `First` and `Find` that trips up every newcomer, so let's make it stick.

> ⚠️ When **no row matches**: `First` (and `Take` and `Last`) treat that as an **error** — they return `gorm.ErrRecordNotFound`. But `Find` treats it as a perfectly normal result — you get an **empty slice and a `nil` error**.

That asymmetry is intentional. Asking for "the user with this ID" and getting nothing back is usually a real problem worth handling (a 404). Asking for "all users named X" and getting nothing back is a normal, expected answer (zero results).

So you check them differently. For a single-record `First`, test for the not-found error explicitly:

```go
var user User
result := db.First(&user, "email = ?", "nobody@example.com")

if errors.Is(result.Error, gorm.ErrRecordNotFound) {
	// no such user — in a web handler, this is your 404
	http.Error(w, "user not found", http.StatusNotFound)
	return
}
if result.Error != nil {
	// some *other* error — a real database failure
	http.Error(w, "internal error", http.StatusInternalServerError)
	return
}
// here, user is populated
```

*What just happened:* `errors.Is(result.Error, gorm.ErrRecordNotFound)` is the canonical "not found" check — use `errors.Is`, not `==`, so it survives error wrapping. That branch maps cleanly to an HTTP 404. A *different* non-nil error means something actually broke (connection dropped, bad SQL), which is a 500. This three-way split — not found / other error / success — is the bread-and-butter shape of a GORM read in a web handler.

For `Find`, there's nothing to special-case — just check `len`:

```go
var users []User
result := db.Find(&users, "name = ?", "Ghost")

if result.Error != nil {
	// a real failure; "no matches" is NOT one of these
	log.Println(result.Error)
}
fmt.Println("matches:", len(users)) // 0 — and result.Error is nil
```

*What just happened:* Zero matches gave us an empty slice and a `nil` error. If you write `if result.Error != nil` expecting it to catch "no users named Ghost," it never fires — the empty slice *is* the answer. Check `len(users) == 0` if "no results" needs handling.

> 📝 Quick memory hook: **singular finder (`First`/`Take`/`Last`) → errors on empty. Plural finder (`Find`) → empty slice, no error.** One row missing is an exception; zero matching rows is just a count.

## A safety note: those `?` placeholders

You saw `db.First(&u, "email = ?", email)` a few times. The `?` is not optional styling — it's the thing standing between you and SQL injection.

Never build a condition by gluing strings together:

```go
// ⚠️ DANGER — never do this
db.First(&u, fmt.Sprintf("email = '%s'", userInput))
```

*What just happened:* If `userInput` is `' OR '1'='1`, that string becomes `email = '' OR '1'='1'` — a condition that matches every row. Worse inputs can read or destroy data you never meant to expose. You hand-built an injection hole.

Do this instead:

```go
// ✅ SAFE — parameterized
db.First(&u, "email = ?", userInput)
```

*What just happened:* GORM sends the SQL and the value to the database *separately*. The driver treats `userInput` as pure data — a value to compare against, never as SQL to execute. Even `' OR '1'='1` is just a (very odd) string it looks for and doesn't find. Always pass values through `?`; never interpolate them into the query string.

## Recap

- **`Create(&value)` inserts** and writes the generated `ID`, `CreatedAt`, and `UpdatedAt` *back into your struct* — pass a pointer so it can.
- Check `result.Error` after every write (GORM won't panic), and use `result.RowsAffected` to see how many rows changed. Pass a **slice** to `Create` for a batched multi-row insert.
- The four finders: **`First`** (one, by PK, ordered), **`First` with a condition**, **`Take`** (one, unordered), **`Last`** (one, newest by PK), and **`Find`** (all matching, into a slice).
- **`First`/`Take`/`Last` return `gorm.ErrRecordNotFound` on zero rows; `Find` returns an empty slice and `nil` error.** Use `errors.Is(err, gorm.ErrRecordNotFound)` and map it to a 404.
- Always pass values through **`?` placeholders** — they're parameterized and injection-safe. Never `fmt.Sprintf` user input into a query.

## Quick check

```quiz
[
  {
    "q": "After `db.Create(&user)` succeeds on a struct embedding gorm.Model, what is true of `user.ID`?",
    "choices": ["It is still 0 — you must SELECT to learn it", "GORM wrote the generated primary key back into it", "It holds the number of rows affected", "It is only set if you call db.Save next"],
    "answer": 1,
    "explain": "Create reads the generated primary key (via RETURNING) and copies it back into the struct you passed — which is why you pass a pointer."
  },
  {
    "q": "You call `db.Find(&users, \"name = ?\", \"Ghost\")` and no rows match. What do you get?",
    "choices": ["result.Error is gorm.ErrRecordNotFound", "A panic", "An empty slice and a nil error", "users is nil and result.Error is set"],
    "answer": 2,
    "explain": "Find treats zero matches as a normal result: an empty slice with no error. Only First/Take/Last return ErrRecordNotFound on no rows."
  },
  {
    "q": "Which line safely looks up a user by an email that came from user input?",
    "choices": ["db.First(&u, fmt.Sprintf(\"email = '%s'\", in))", "db.First(&u, \"email = ?\", in)", "db.First(&u, \"email = \" + in)", "db.Take(&u, in)"],
    "answer": 1,
    "explain": "The ? placeholder is parameterized: GORM sends the value separately from the SQL, so it can't be interpreted as code. String interpolation opens a SQL injection hole."
  }
]
```

[← Phase 2: Models & Auto-Migration](02-models-and-migration.md) · [Guide overview](_guide.md) · [Phase 4: Querying →](04-querying.md)