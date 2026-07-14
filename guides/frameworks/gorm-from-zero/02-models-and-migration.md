---
title: "Models & Auto-Migration"
guide: "gorm-from-zero"
phase: 2
summary: "Define tables as Go structs, shape columns with struct tags, embed gorm.Model for ID and timestamps, and let AutoMigrate make the database match your code."
tags: [gorm, go, models, migration, struct-tags]
difficulty: intermediate
synonyms: ["gorm model", "gorm.Model", "gorm automigrate", "gorm struct tags", "gorm column tags", "gorm table from struct"]
updated: 2026-07-10
---

# Models & Auto-Migration

In [Phase 1](01-what-gorm-is.md) you opened a `*gorm.DB` and watched it log SQL. Now we give it
something to talk about: a table - and here's the one idea that makes the rest of GORM click.

## The mental model: a struct *is* the table

Stop thinking of "a struct" and "a table" as two things you have to keep in sync by hand. In GORM
they're the same thing seen from two sides. The struct is how Go sees the table; the table is how
the database stores the struct.

- Each **field** becomes a **column**.
- Each **struct tag** adds a **constraint** to that column (size, not-null, unique, an index).
- The **struct name** decides the **table name** (`User` → `users`).
- And one call - `AutoMigrate` - makes the real database **match** the struct you wrote.

> 💡 Once you hold "the struct is the source of truth, the database is its shadow," GORM stops feeling
> like two parallel systems you have to babysit. You edit the struct; you re-run AutoMigrate; the
> table catches up.

We'll build the **blog** schema this whole guide uses. It has three tables - users, posts, comments - 
and we start with `User`.

## `gorm.Model`: the four fields you almost always want

Most tables need a primary key and some timestamps. Typing those into every struct gets old, so GORM
ships a tiny struct you **embed** to get them for free: `gorm.Model`.

```go
type User struct {
    gorm.Model
    Name  string `gorm:"size:100;not null"`
    Email string `gorm:"uniqueIndex;not null"`
}
```

*What just happened:* By embedding `gorm.Model` on the first line, `User` silently gained four fields
before `Name` and `Email` even appear:

| Field | Type | What it does |
|-------|------|--------------|
| `ID` | `uint` | The primary key. Auto-increments. You almost never set it by hand. |
| `CreatedAt` | `time.Time` | GORM stamps it the moment the row is inserted. |
| `UpdatedAt` | `time.Time` | GORM re-stamps it on every save. |
| `DeletedAt` | `gorm.DeletedAt` | Enables **soft delete** - a "deleted" row sticks around but disappears from queries. (Full story in [Phase 5](05-update-and-delete.md).) |

So `CreatedAt` and `UpdatedAt` are managed *for* you - you don't write code to maintain them. That
one embed is why most GORM models start with `gorm.Model`.

> 📝 `gorm.Model` is plain Go embedding, not magic. It's literally a struct with those four fields,
> and embedding it promotes them onto `User`. You could copy-paste the four fields instead and get
> the identical result.

## A tour of field tags

The backtick string after a field - ``gorm:"..."`` - is a **struct tag**. GORM reads it to learn how
that column should be shaped. Multiple settings are separated by semicolons. Here are the ones you'll
reach for constantly:

```go
type User struct {
    gorm.Model
    Name      string `gorm:"size:100;not null"`        // VARCHAR(100), required
    Email     string `gorm:"uniqueIndex;not null"`     // unique index, required
    Username  string `gorm:"size:50;index"`            // plain (non-unique) index
    Role      string `gorm:"size:20;default:'member'"` // default value if none given
    Bio       string `gorm:"column:about_me"`          // override the column name
    avatarRaw []byte `gorm:"-"`                         // ignored entirely - no column
}
```

*What just happened:* each tag maps to one piece of SQL:

- `size:100` → the column's max length (`VARCHAR(100)`). Default for strings is often `VARCHAR(255)`.
- `not null` → a `NOT NULL` constraint; inserting a row without it errors.
- `uniqueIndex` → a unique index, so two users can't share an email. Use `index` for a plain,
  non-unique index (faster lookups, duplicates allowed).
- `default:'member'` → the column's `DEFAULT`. If you create a user without a role, the DB fills in
  `member`.
- `column:about_me` → override GORM's auto-generated column name. Now the Go field is `Bio` but the
  column is `about_me`.
- `-` → "this field is not a column." GORM skips it entirely. (Note `avatarRaw` is lowercase, so it's
  also unexported - handy for internal scratch fields.)

> ⚠️ A struct tag is a single backtick string with **no commas**, only semicolons between settings.
> ``gorm:"size:100, not null"`` is a classic typo - that comma makes GORM misread the second setting.

There are two more worth naming. `primaryKey` marks a field as *the* primary key (you'll see it below
when we skip `gorm.Model`), and you can combine settings freely: ``gorm:"size:255;not null;index"``.

## Naming conventions: where table and column names come from

You didn't write a table name anywhere. GORM derives it, and the rules are worth memorizing because
they're predictable:

- **Struct → table:** the name is **snake_case** and **pluralized**. `User` → `users`,
  `BlogPost` → `blog_posts`, `Comment` → `comments`.
- **Field → column:** **snake_case**, singular. `CreatedAt` → `created_at`, `Name` → `name`.

When the convention doesn't fit - say your table is legacy and called `tbl_users` - override the whole
table name with a `TableName()` method:

```go
func (User) TableName() string {
    return "blog_users"
}
```

*What just happened:* GORM checks for a `TableName() string` method on your model. If it finds one, it
uses that string verbatim instead of pluralizing. Now every query for `User` hits `blog_users`. (The
receiver `(User)` has no name because we don't use it - we only need the method to exist.)

## `AutoMigrate`: make the database match the structs

You have structs. The database has nothing yet. `AutoMigrate` bridges the gap: hand it your models and
it creates the tables, columns, indexes, and foreign keys to match.

```go
err := db.AutoMigrate(&User{}, &Post{}, &Comment{})
if err != nil {
    log.Fatal("migration failed:", err)
}
```

*What just happened:* GORM inspected each struct, compared it to the live database, and issued the SQL
needed to make reality match your code. On a fresh database that means three `CREATE TABLE` statements.
With logging on (from Phase 1), you'd see GORM emit something like this for `User`:

```sql
CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `created_at` datetime,
  `updated_at` datetime,
  `deleted_at` datetime,
  `name` varchar(100) NOT NULL,
  `email` text NOT NULL
);
CREATE UNIQUE INDEX `idx_users_email` ON `users`(`email`);
CREATE INDEX `idx_users_deleted_at` ON `users`(`deleted_at`);
```

*What just happened:* every piece traces back to the struct. `id`/`created_at`/`updated_at`/`deleted_at`
came from `gorm.Model`. `name` is `NOT NULL` and length-capped because of its tags. The unique index on
`email` is your `uniqueIndex` tag. GORM even indexes `deleted_at` on its own, because that's the column
soft-delete filters on. The struct really *is* the table - you're reading your own tags back as SQL.

Run `AutoMigrate` again with no changes and GORM does nothing - it's safe to call on every startup.
Add a field to the struct and re-run, and GORM issues an `ALTER TABLE ... ADD COLUMN` to catch up.

> ⚠️ **AutoMigrate is additive only.** It creates tables and *adds* missing columns, indexes, and
> foreign keys. It will **never drop a column, never delete a table, and never change a column's type
> in a way that could lose data.** Rename `Email` to `EmailAddress` and AutoMigrate adds a *new*
> `email_address` column - the old `email` column and its data just sit there. That's a feature in
> dev (you can't accidentally nuke data) and a limitation in production (it can't express renames,
> drops, or careful type changes). For real, ordered, reversible schema changes you want a proper
> migration tool - [Phase 8](08-transactions-hooks-migrations.md) covers when and why.

So the practical rule: **AutoMigrate is great for development and getting started, not a complete
migration strategy.** Lean on it now; graduate from it later.

## A model *without* `gorm.Model`

`gorm.Model` is a convenience, not a requirement. If you don't want the timestamps or soft-delete - 
say a small lookup table - define your own primary key and skip the embed:

```go
type Tag struct {
    ID   uint   `gorm:"primaryKey"`
    Name string `gorm:"size:50;uniqueIndex;not null"`
}
```

*What just happened:* with no `gorm.Model`, `Tag` has exactly two columns: `id` and `name`. The
`primaryKey` tag tells GORM that `ID` is the primary key (GORM also assumes a `uint` field named `ID`
is the PK by default, so here the tag is explicit insurance). No `created_at`, no `updated_at`, no
soft-delete - just the columns you declared. Use this when the four `gorm.Model` fields would be dead
weight.

With `User` defined and migrated, the table exists and is waiting for rows. Next we put data in and
read it back.

## Recap

- **A struct is the table.** Fields become columns, struct tags add constraints, the struct name sets
  the table name.
- **Embed `gorm.Model`** to get `ID`, `CreatedAt`, `UpdatedAt` (auto-managed), and `DeletedAt`
  (enables soft delete) without writing them yourself.
- **Field tags** shape columns: `size`, `not null`, `uniqueIndex`/`index`, `default`, `column:` to
  rename, `-` to ignore. Separate settings with **semicolons, not commas**.
- **Naming is automatic:** `User` → table `users`, `CreatedAt` → column `created_at`; override the
  table name with a `TableName()` method.
- **`AutoMigrate` makes the DB match the structs** - creating tables and adding missing
  columns/indexes - but it's **additive only**: it never drops or destructively retypes. Great in
  dev, not a full migration tool ([Phase 8](08-transactions-hooks-migrations.md)).
- You can **skip `gorm.Model`** and declare your own `primaryKey` when you don't want timestamps or
  soft delete.

## Quick check

```quiz
[
  {
    "q": "What does embedding gorm.Model add to your struct?",
    "choices": ["Only an ID field", "ID, CreatedAt, UpdatedAt, and DeletedAt", "A TableName method", "Nothing until you run AutoMigrate"],
    "answer": 1,
    "explain": "gorm.Model embeds four fields: ID (primary key), the auto-managed CreatedAt and UpdatedAt timestamps, and DeletedAt which enables soft delete."
  },
  {
    "q": "You rename a struct field and re-run AutoMigrate. What happens to the old column?",
    "choices": ["It is renamed to match", "It is dropped automatically", "It stays - a new column is added alongside it", "AutoMigrate refuses to run"],
    "answer": 2,
    "explain": "AutoMigrate is additive only. It adds a new column for the renamed field and leaves the old column (and its data) untouched. Real renames need a proper migration tool."
  },
  {
    "q": "By default, which table does a struct named BlogPost map to?",
    "choices": ["BlogPost", "blogpost", "blog_posts", "blogposts"],
    "answer": 2,
    "explain": "GORM converts the struct name to snake_case and pluralizes it: BlogPost becomes blog_posts. Override it with a TableName() method if needed."
  }
]
```

---

[← Phase 1: What GORM Is & Connecting](01-what-gorm-is.md) · [Guide overview](_guide.md) · [Phase 3: Create & Read →](03-create-and-read.md)
