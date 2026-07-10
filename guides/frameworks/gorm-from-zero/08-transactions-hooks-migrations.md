---
title: "Transactions, Hooks & Migrations"
guide: "gorm-from-zero"
phase: 8
summary: "Make several writes all-or-nothing with transactions, run your code around DB ops with lifecycle hooks, and version your schema with real migrations instead of leaning on AutoMigrate."
tags: [gorm, go, transactions, hooks, migrations]
difficulty: advanced
synonyms: ["gorm transaction", "gorm db.transaction", "gorm hooks beforecreate", "gorm migrations", "gorm automigrate production", "golang-migrate goose"]
updated: 2026-07-10
---

# Transactions, Hooks & Migrations

By [Phase 7](07-preloading-and-n-plus-1.md) you can read your blog efficiently. Now the three things that
separate a toy from something you'd run in production: writes that can't half-finish, code that runs
automatically around DB operations, and a schema you can evolve safely over time.

## The mental model: three guardrails

These three features feel unrelated until you see what they share — each one is a guardrail around the
moment data changes.

- A **transaction** makes several writes **all-or-nothing**. Either every write lands, or none of them
  do. No half-finished state.
- A **hook** runs **your code around a DB op** — right before an insert, right after a find. It's a
  place to hang behavior that should *always* happen.
- A **migration** **versions your schema over time** — an ordered, reviewable history of how your
  tables got to their current shape.

> 💡 Hold "transaction = all-or-nothing write, hook = code that fires around the op, migration =
> versioned schema history" and the rest of this phase is just syntax. The hard part is knowing *when*
> to reach for each, which is what we'll spend most of our time on.

If you've never met the all-or-nothing idea formally, the background — atomicity, consistency, the rest
of ACID — lives in [Transactions & ACID](/guides/transactions-and-acid). Here we focus on how GORM
hands it to you.

## Transactions: writes that succeed together or not at all

Picture signing up a new blog user *and* creating their welcome post in one go. If the user insert
succeeds but the post insert fails, you've got a user with no welcome post and a confusing half-state.
A transaction collapses those two writes into one unit: both land, or neither does.

### The closure form (reach for this first)

GORM's `Transaction` method takes a function. If your function returns `nil`, GORM **commits**. If it
returns an error — or panics — GORM **rolls back** automatically. You never call commit or rollback
yourself.

```go
err := db.Transaction(func(tx *gorm.DB) error {
    user := User{Name: "Ada", Email: "ada@example.com"}
    if err := tx.Create(&user).Error; err != nil {
        return err // rolls back — nothing is saved
    }

    post := Post{Title: "Hello, world", UserID: user.ID}
    if err := tx.Create(&post).Error; err != nil {
        return err // rolls back — the user insert is undone too
    }

    return nil // commits both
})
if err != nil {
    log.Println("signup failed, nothing was written:", err)
}
```

*What just happened:* GORM opened a transaction, handed your function a special `*gorm.DB` called `tx`,
and watched your return value. The first `Create` inserts the user; the second uses `user.ID` (GORM
filled it in after the first insert) to link the post to that user. If either `Create` returns an
error, you return it, and GORM rolls back — so a failed post insert *also* undoes the user insert. The
database never sees a user without their welcome post.

> ⚠️ Inside the closure, use **`tx`, not the outer `db`**. This is the single most common transaction
> bug in GORM. `tx` is the transactional handle; `db` is the plain connection. If you accidentally
> write `db.Create(&post)` inside the closure, that write runs *outside* the transaction — it won't
> roll back with the rest, and you're back to half-finished state. Every DB call in the block should
> go through `tx`.

### The manual form (when the closure doesn't fit)

Sometimes the control flow is too tangled for a single closure — you're branching across helper
functions, or commit timing depends on logic the closure can't cleanly express. Then you drive the
transaction by hand with `Begin`, `Commit`, and `Rollback`.

```go
tx := db.Begin()
defer func() {
    if r := recover(); r != nil {
        tx.Rollback() // a panic shouldn't leave the transaction open
    }
}()

if err := tx.Create(&user).Error; err != nil {
    tx.Rollback()
    return err
}

if err := tx.Create(&post).Error; err != nil {
    tx.Rollback()
    return err
}

tx.Commit()
```

*What just happened:* `db.Begin()` starts the transaction and gives you `tx`. Now *you* own the
outcome: every error path calls `tx.Rollback()`, the happy path ends with `tx.Commit()`, and the
deferred `recover` makes sure that even a panic rolls back instead of leaving a half-open transaction
holding locks. It's more code and more ways to slip up — which is exactly why the closure form is the
default. Reach for manual control only when you genuinely need it.

> 💡 Same rule, restated: in the manual form, every write goes through `tx` too. The whole point is
> that `db.Begin()` returns a *new* handle scoped to this transaction.

## Hooks: your code, run automatically around DB ops

A hook is a method you define on your model that GORM calls at a specific moment in a record's life.
You don't invoke it — GORM does, every time the matching operation runs. The full lifecycle:

| Hook | Fires |
|------|-------|
| `BeforeCreate(tx *gorm.DB) error` | just before an INSERT |
| `AfterCreate(tx *gorm.DB) error` | just after an INSERT |
| `BeforeSave` / `BeforeUpdate` | before a save / update |
| `BeforeDelete` | before a delete |
| `AfterFind(tx *gorm.DB) error` | after a row is loaded from the DB |

The classic use is filling in a field that should *always* be set on insert — a UUID, or a hashed
password — so no caller can forget to do it.

```go
import "github.com/google/uuid"

func (u *User) BeforeCreate(tx *gorm.DB) error {
    u.UUID = uuid.NewString()
    return nil
}
```

*What just happened:* you added a `BeforeCreate` method to `User`. Now every time anything inserts a
user — `db.Create(&user)`, or a `tx.Create` inside a transaction — GORM calls this method first and
stamps a fresh UUID onto the record before it hits the database. The caller writes nothing extra; the
guarantee lives on the model. A password hook works the same way: hash `u.Password` in `BeforeCreate`
(or `BeforeSave`) and a plaintext password can never be written by accident.

The other half of the contract: **returning an error from a hook aborts the operation.** Return a
non-nil error from `BeforeCreate` and the insert is cancelled — and if you're inside a transaction,
that error rolls the whole transaction back. So a validation hook is a clean way to reject bad data
before it lands.

> ⚠️ Hooks are hidden behavior. Someone reading `db.Create(&user)` has no visual hint that a UUID is
> being minted, a password is being hashed, or a network call is firing. Keep hooks **small, fast, and
> predictable** — set a field, validate a value, return. Don't put slow I/O (sending email, calling an
> external API) in a hook: it runs inside the surrounding transaction, so it holds the transaction
> open and a failure rolls back your write for reasons that are hard to trace. When in doubt, do the
> heavy work in plain application code where it's visible.

## Migrations: versioning your schema, not just creating it

Back in [Phase 2](02-models-and-migration.md) you met `AutoMigrate`, and the warning that came with
it. Here's why that warning matters once real data is involved.

**`AutoMigrate` is additive only.** It creates tables and adds missing columns, indexes, and foreign
keys. It will never drop a column, never delete a table, and never change a column's type in a way that
could lose data. That's perfect in development — you can't accidentally nuke anything — but it means
AutoMigrate *cannot express* a rename, a drop, or a careful type change. Rename a struct field
and AutoMigrate adds a new column beside the old one, leaving the original data stranded. There's also
no record of *what changed when* and no way to undo a step.

Production wants the opposite: a schema history that's **reproducible** (run the same steps, get the
same schema), **reversible** (every change has an undo), and **reviewable** (changes are files in your
repo that go through code review). That's what **versioned migrations** give you, via a dedicated tool
like [golang-migrate](https://github.com/golang-migrate/migrate), [goose](https://github.com/pressly/goose),
or [atlas](https://atlasgo.io/).

The shape is the same across all of them: ordered pairs of SQL files, an **up** (apply the change) and
a **down** (undo it).

```sql
-- 000004_add_published_to_posts.up.sql
ALTER TABLE posts ADD COLUMN published BOOLEAN NOT NULL DEFAULT false;
```

```sql
-- 000004_add_published_to_posts.down.sql
ALTER TABLE posts DROP COLUMN published;
```

*What just happened:* you wrote the change *and* its reverse, as plain, reviewable SQL, numbered so it
runs in a fixed order. The `up` file adds a `published` flag to the blog's `posts` table; the `down`
file removes it again if you need to roll the change back. Because it's hand-written SQL, you can do
the things AutoMigrate can't — drops, renames, data backfills, careful type changes — and a teammate
can read the diff before it ships.

You apply pending migrations by running the tool — for golang-migrate, that's `migrate up`:

```bash
migrate -path ./migrations -database "$DATABASE_URL" up
```

*What just happened:* the tool looked at your database, checked a bookkeeping table it maintains
(commonly `schema_migrations`) to see which numbered migrations have already run, and applied only the
new ones in order. Run it again with nothing new and it does nothing. That tracking table is the whole
trick — it's how the tool knows your schema's exact version and can move it forward (or, with `down`,
backward) one reviewable step at a time. The full discipline — naming, ordering, backfills, zero-downtime
changes — is its own topic in [Database Migrations](/guides/database-migrations).

> 📝 The honest division of labor: `AutoMigrate` to get moving fast in dev and on side projects;
> versioned migrations the moment real users have real data in the table. Many teams use both — AutoMigrate
> locally for speed, a migration tool in CI and production for safety. Use the right one for the stakes.

## Recap

- A **transaction makes several writes all-or-nothing.** Prefer the **closure form** (`db.Transaction`):
  return `nil` to commit, return an error or panic to roll back automatically.
- ⚠️ **Inside the closure, use `tx`, not the outer `db`** — the most common transaction bug. Use the
  **manual form** (`Begin`/`Commit`/`Rollback` with a deferred `recover`) only when the control flow is
  too complex for a closure.
- **Hooks run your code around DB ops** — `BeforeCreate`, `AfterCreate`, `BeforeSave`, `AfterFind`, and
  friends. Great for stamping a UUID or hashing a password so no caller can forget. **Returning an
  error aborts the operation** (and rolls back the surrounding transaction).
- ⚠️ **Keep hooks small and predictable** — they're hidden behavior; no slow I/O inside them.
- **`AutoMigrate` is additive only** (no drops, renames, or destructive type changes) — fine for dev,
  not a production migration strategy. Use **versioned migrations** (golang-migrate, goose, atlas):
  ordered up/down SQL, applied with `migrate up`, tracked in a `schema_migrations` table.

## Quick check

```quiz
[
  {
    "q": "Inside a db.Transaction(func(tx *gorm.DB) error { ... }) closure, which handle should your writes use?",
    "choices": ["The outer db, so they share a connection", "tx, the transactional handle passed in", "Either one — GORM tracks both", "A new db.Begin() call inside the closure"],
    "answer": 1,
    "explain": "Use tx. The outer db runs outside the transaction, so a write through db won't roll back with the rest — the classic GORM transaction bug."
  },
  {
    "q": "What happens when a BeforeCreate hook returns a non-nil error?",
    "choices": ["GORM logs it but inserts the row anyway", "The insert is aborted, and inside a transaction it rolls back", "Only that field is skipped", "The hook is retried until it returns nil"],
    "answer": 1,
    "explain": "Returning an error from a hook aborts the operation, and if it's running inside a transaction the whole transaction rolls back. That makes hooks a clean place to reject bad data."
  },
  {
    "q": "Why isn't AutoMigrate enough for evolving a production schema?",
    "choices": ["It only works with SQLite", "It is additive only — it can't drop, rename, or destructively retype, and keeps no reversible history", "It is too slow on large tables", "It requires the database to be empty"],
    "answer": 1,
    "explain": "AutoMigrate only adds tables/columns/indexes; it can't express renames, drops, or careful type changes, and there's no ordered, reversible, reviewable history. Versioned migrations (up/down SQL) cover that."
  }
]
```

---

[← Phase 7: Preloading & the N+1 Trap](07-preloading-and-n-plus-1.md) · [Guide overview](_guide.md) · [Phase 9: GORM in the Real World & Where to Go Next →](09-where-to-go-next.md)
