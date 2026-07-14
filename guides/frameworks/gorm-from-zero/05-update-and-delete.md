---
title: "Update & Delete"
guide: "gorm-from-zero"
phase: 5
summary: "Updating rows with Update/Updates/Save, the struct zero-value trap (and the map fix), bulk updates with the global-update block, and soft vs hard deletes with Unscoped."
tags: [gorm, go, update, delete, soft-delete]
difficulty: intermediate
synonyms: ["gorm update", "gorm save updates", "gorm zero value update", "gorm delete", "gorm soft delete", "gorm unscoped"]
updated: 2026-07-10
---

# Update & Delete

You've created rows and queried them back. Now you need to change them and remove them - and this is where GORM has two surprises that catch nearly everyone the first time. Once you hold the mental model, both stop being surprises and start being predictable.

Here's the model, and it's the whole phase in one sentence: **an update targets a row by its primary key (or a `Where` you add) and writes the changed columns; a delete - on a model with `gorm.Model` - hides the row by stamping `deleted_at` instead of removing it.** Hold those two ideas. Every confusing thing below is a consequence of one of them.

> 📝 We're still on the **blog** schema from earlier phases: a `User` and a `Post`, both embedding `gorm.Model` (so they each have an `ID`, timestamps, and - crucially for this phase - a `DeletedAt`).

## Updating one field: `Update`

The simplest change. You have a record loaded, you want to change one column:

```go
var user User
db.First(&user, 1) // load the user with ID = 1

db.Model(&user).Update("name", "Bob")
```

```sql
UPDATE `users` SET `name`='Bob',`updated_at`='2026-06-23 ...' WHERE `id` = 1
```

*What just happened:* `Model(&user)` tells GORM "the target is this row." Because `user` has its `ID` set, GORM scopes the `UPDATE` to `WHERE id = 1` - it doesn't touch any other row. It also bumped `updated_at` for free, because the model embeds `gorm.Model`.

## Updating several fields: `Updates` - and THE TRAP

Now you want to change a few columns at once. The natural reach is to pass a struct:

```go
db.Model(&user).Updates(User{Name: "Bob", Age: 0})
```

```sql
UPDATE `users` SET `name`='Bob',`updated_at`='2026-06-23 ...' WHERE `id` = 1
```

*What just happened:* Look hard at that SQL. You asked to set `name = 'Bob'` **and** `age = 0`. GORM set the name and **silently dropped the age.** The row's age is unchanged.

> ⚠️ **This is the single most important thing in this phase.** When you pass a **struct** to `Updates`, GORM only updates **non-zero fields**. `Age: 0` is the zero value for an `int`, so GORM can't tell "the user genuinely set 0" apart from "the user left this field blank" - and it assumes blank. Same for `""`, `false`, `nil`. Your update vanishes with no error.

Why does GORM do this? Because a struct literal can't express "I didn't set this field." A struct always has *all* its fields, each holding *some* value, and for a freshly-built `User{Name: "Bob"}` the `Age` is `0` whether you meant it or not. So GORM plays it safe and skips zeros. Convenient most of the time - until the day a real `0`, `false`, or `""` is exactly the value you need to write.

💡 **The fix: pass a map.** A map only contains the keys you put in it, so there's no ambiguity - GORM writes every key, zero or not:

```go
db.Model(&user).Updates(map[string]any{"name": "Bob", "age": 0})
```

```sql
UPDATE `users` SET `name`='Bob',`age`=0,`updated_at`='2026-06-23 ...' WHERE `id` = 1
```

*What just happened:* This time `age=0` made it into the SQL. The map said "I want these two columns set," and GORM obeyed literally. **Rule of thumb: struct for "update whatever's filled in," map when a zero value must actually land.**

## Writing the whole row: `Save`

`Updates` writes the columns you name. `Save` writes **all** of them - it's a full-row update:

```go
user.Name = "Bob"
user.Age = 0
db.Save(&user)
```

```sql
UPDATE `users` SET `name`='Bob',`age`=0,`email`='bob@blog.dev',`created_at`='...',`updated_at`='...' WHERE `id` = 1
```

*What just happened:* `Save` took the entire `user` struct and wrote every column back, `age=0` included - no zero-value skipping here, because `Save` isn't trying to guess which fields you "meant." It needs the primary key set (which it is, since we loaded the row). Use `Save` when you've mutated a loaded struct in Go and want the database to match it exactly. Reach for `Updates` when you only want to touch specific columns and leave the rest as they are.

## Bulk updates: a `Where`, and the safety block

So far every update hit one row via its PK. To change many rows at once, drop the loaded record and use `Model(&User{})` with a `Where`:

```go
db.Model(&User{}).Where("age < ?", 18).Update("active", false)
```

```sql
UPDATE `users` SET `active`=false,`updated_at`='...' WHERE age < 18
```

*What just happened:* No specific record, no PK - GORM updated every row matching the `Where`. This is the right tool for "deactivate all minors" or "mark every draft as archived."

> ⚠️ But what if you forget the `Where`? `db.Model(&User{}).Update("active", false)` would, taken literally, set `active = false` on **every user in the table.** GORM refuses: it returns `ErrMissingWhereClause` rather than run a global update by accident. This guard has saved more production tables than anyone can count.

If you genuinely mean "every row," you opt in explicitly:

```go
db.Session(&gorm.Session{AllowGlobalUpdate: true}).
    Model(&User{}).
    Update("active", false)
```

*What just happened:* By opening a session with `AllowGlobalUpdate: true`, you've told GORM "yes, I really do mean the whole table." The block lifts for that chain. The fact that you have to say so out loud is the point - a global update should never be something you do by forgetting a clause.

## Deleting: the second big surprise

Now removal. The call looks exactly like what you'd expect:

```go
var user User
db.First(&user, 1)
db.Delete(&user)
```

```sql
UPDATE `users` SET `deleted_at`='2026-06-23 14:02:11' WHERE `id` = 1 AND `users`.`deleted_at` IS NULL
```

*What just happened:* You called `Delete`, and GORM ran an **`UPDATE`** - not a `DELETE`. The row is still sitting in the table; GORM just stamped its `deleted_at` column with the current time.

> ⚠️ This is **soft delete**, and it's automatic for any model that embeds `gorm.Model` (or otherwise has a `DeletedAt gorm.DeletedAt` field). "Deleted" means "marked as deleted," not "gone." People are routinely baffled when a deleted user keeps occupying a unique email or shows up in a raw `SELECT *` - the row never left.

The flip side is the genuinely useful part: every normal query **automatically excludes** soft-deleted rows. Notice the `AND deleted_at IS NULL` GORM quietly added above - it adds that to your `Find`s and `First`s too:

```go
var users []User
db.Find(&users) // the soft-deleted user 1 is NOT in here
```

```sql
SELECT * FROM `users` WHERE `users`.`deleted_at` IS NULL
```

*What just happened:* You didn't ask for `deleted_at IS NULL` - GORM added it because the model is soft-deletable. From your code's perspective the row is gone; it's just recoverable, and it leaves an audit trail. (You can also delete by ID without loading first: `db.Delete(&User{}, 1)`.)

## Seeing and removing soft-deleted rows: `Unscoped`

Sometimes you need to peek behind the curtain - or actually purge a row for real. `Unscoped()` drops the automatic `deleted_at IS NULL` filter:

```go
var users []User
db.Unscoped().Find(&users) // includes soft-deleted rows
```

```sql
SELECT * FROM `users`
```

*What just happened:* No `deleted_at` filter - you see everything, deleted-or-not. This is how you build a "recently deleted" view or recover a row.

And to delete a row **permanently** - a real `DELETE`, gone for good - combine `Unscoped()` with `Delete`:

```go
db.Unscoped().Delete(&user)
```

```sql
DELETE FROM `users` WHERE `id` = 1
```

*What just happened:* `Unscoped()` told GORM "skip the soft-delete machinery," so `Delete` did a true hard delete. The row is now actually removed. Reach for this when you mean it (GDPR erasure, purging test data) - and only then.

## Recap

- **`Update`** changes one column; **`Updates`** changes several. Both target the row by its PK (or a `Where` you add) and bump `updated_at`.
- **The zero-value trap:** `Updates` with a **struct** skips zero fields (`0`, `""`, `false`, `nil`) - they vanish silently. Pass a **map** when a zero value must actually be written.
- **`Save`** writes the entire struct back (a full-row update); use it to make the DB match a mutated Go value exactly.
- **Bulk updates** need a `Where`; a missing one triggers `ErrMissingWhereClause`. Opt into a whole-table update with `Session(&gorm.Session{AllowGlobalUpdate: true})`.
- **Soft delete** is automatic with `gorm.Model`: `Delete` runs an `UPDATE` on `deleted_at`, and normal queries auto-exclude the row - it's hidden, not removed.
- **`Unscoped()`** reveals soft-deleted rows (`Find`) and, with `Delete`, performs a true hard delete.

## Quick check

```quiz
[
  {
    "q": "When does db.Model(&user).Updates(...) write a zero value like age = 0 to the database?",
    "choices": ["Always", "Never", "Only when you pass a map, not a struct", "Only with db.Save"],
    "answer": 2,
    "explain": "A struct can't distinguish an intentional zero from an unset field, so GORM skips zeros. A map only contains the keys you set, so every key - including zeros - is written."
  },
  {
    "q": "Why does db.Model(&User{}).Update(\"active\", false) (no Where) fail by default?",
    "choices": ["false isn't a valid value", "GORM blocks global updates to prevent accidentally changing every row", "Update can't take a literal", "the model has no primary key"],
    "answer": 1,
    "explain": "GORM returns ErrMissingWhereClause to stop you from updating the whole table by accident. Add a Where, or opt in with AllowGlobalUpdate."
  },
  {
    "q": "After db.Delete(&user) on a gorm.Model-backed type, how do you see that row again in a query?",
    "choices": ["db.Find(&users)", "db.Unscoped().Find(&users)", "you can't - it's gone", "db.Save(&user)"],
    "answer": 1,
    "explain": "The row was soft-deleted (deleted_at set), so normal queries exclude it. Unscoped() drops that filter and shows soft-deleted rows."
  }
]
```

---

[← Phase 4: Querying](04-querying.md) · [Guide overview](_guide.md) · [Phase 6: Associations →](06-associations.md)
