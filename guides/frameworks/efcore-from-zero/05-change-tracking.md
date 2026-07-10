---
title: "Change Tracking & SaveChanges"
guide: "efcore-from-zero"
phase: 5
summary: "How EF Core's DbContext acts as a unit of work: it tracks the entities it hands you, diffs them against a snapshot, and batches the minimal SQL when you call SaveChanges."
tags: [efcore, csharp, change-tracking, savechanges, unit-of-work]
difficulty: advanced
synonyms: ["ef core change tracking", "ef core savechanges", "ef core unit of work", "ef core update delete", "ef core entity state", "ef core detached entity"]
updated: 2026-07-10
---

# Change Tracking & SaveChanges

The thing that trips up almost everyone the first time: there is no `Update` method you call to save an edit. You load a `Post`, change its `Title`, call `SaveChanges`, and the `UPDATE` statement just... appears. That can feel like magic, and magic you don't understand is magic that will bite you. So before any code, the mental model.

> 💡 **The mental model.** A `DbContext` is a **unit of work** with a built-in **change tracker**. The moment a query hands you an entity, the context starts watching it: it stashes a private **snapshot** of every property value as they were when loaded. When you call `SaveChanges`, EF compares the current values of each tracked entity against its snapshot, works out the minimal set of inserts, updates, and deletes needed, and pushes them all to the database in **one transaction**. You don't tell EF *what* changed — it figures that out by diffing.

Hold that picture — **load, mutate, diff, save** — and everything in this phase follows from it.

## Update by mutation

Because the context already tracks the entity, updating a row is three steps: load it, change a property, save. No "update" call.

```csharp
using var ctx = new BlogContext();

var post = ctx.Posts.First(p => p.Id == 42);
post.Title = "Rewritten and better";
ctx.SaveChanges();
```

*What just happened:* the `First` query loaded the post **and** registered it with the change tracker, snapshot included. Setting `post.Title` only changed the in-memory object — nothing hit the database yet. `SaveChanges` diffed the entity against its snapshot, saw exactly one column differed, and emitted SQL touching only that column:

```sql
UPDATE Posts SET Title = 'Rewritten and better' WHERE Id = 42;
```

> 📝 Notice it does **not** rewrite every column — only `Title`. EF tracks changes per-property, so an `UPDATE` carries just the columns that actually moved. That keeps writes small and avoids stomping on columns another process may have touched.

Deleting is the same shape, except you tell the context to mark the entity for removal:

```csharp
var post = ctx.Posts.First(p => p.Id == 42);
ctx.Posts.Remove(post);
ctx.SaveChanges();
```

*What just happened:* `Remove` doesn't delete anything immediately — it flips the tracked entity's state to `Deleted`. `SaveChanges` runs `DELETE FROM Posts WHERE Id = 42;`. Until you save, the row's still there.

## Entity states: what the tracker is really storing

Every entity the context knows about sits in exactly one of five states. This is the vocabulary the change tracker thinks in:

| State | Meaning | What `SaveChanges` does |
|-------|---------|--------------------------|
| `Added` | New, not yet in the DB (you called `Add`) | `INSERT` |
| `Unchanged` | Loaded and untouched since | nothing |
| `Modified` | A tracked property changed | `UPDATE` (changed columns) |
| `Deleted` | Marked for removal (you called `Remove`) | `DELETE` |
| `Detached` | The context isn't tracking it at all | nothing — it's invisible |

You can read or set the state yourself through `ctx.Entry(...)`:

```csharp
var post = ctx.Posts.First(p => p.Id == 42);
Console.WriteLine(ctx.Entry(post).State);   // Unchanged

post.Title = "Edited";
Console.WriteLine(ctx.Entry(post).State);   // Modified
```

*What just happened:* fresh from the query, the post is `Unchanged`. The instant you mutate a tracked property, the change tracker notices (detected when you inspect state or call `SaveChanges`) and moves the entity to `Modified`. You never set this by hand in the normal flow — the diff drives it. `ctx.Entry(post).State` is your window into what the tracker believes about any entity.

> 💡 Want to see the whole picture? `ctx.ChangeTracker.Entries()` returns every tracked entity with its state — a great thing to dump when an update mysteriously does nothing (foreshadowing).

## SaveChanges: one batch, one transaction

`SaveChanges` isn't a per-entity operation. It collects **all** pending changes across every tracked entity, then sends them together, wrapped in a single database transaction.

```csharp
ctx.Posts.Add(new Post { Title = "Brand new" });        // Added
ctx.Posts.First(p => p.Id == 7).Title = "Touched up";   // Modified
ctx.Posts.Remove(ctx.Posts.First(p => p.Id == 9));      // Deleted

int rows = ctx.SaveChanges();
Console.WriteLine($"{rows} rows affected");              // 3 rows affected
```

*What just happened:* three different operations — an insert, an update, and a delete — accumulated in the tracker. The single `SaveChanges` call issued all three inside one transaction: if any statement fails, the whole batch rolls back and your database is left untouched. The return value is the **number of rows affected**, here `3`.

## ⚠️ The detached-entity trap — the #1 web-app surprise

Everything above assumes the entity was **loaded by this context**, so it's tracked. In a web app, that assumption quietly breaks — the single most common EF Core gotcha you'll hit.

When a controller receives an object deserialized from a JSON request body, that object was created by the model binder — **not** loaded by your `DbContext`. It is `Detached`. The context has never seen it, has no snapshot for it, isn't watching it. So this does **nothing**:

```csharp
// post came from the HTTP request body — it is DETACHED
public IActionResult UpdatePost(Post post)
{
    post.Title = "Changed in the controller";
    ctx.SaveChanges();   // ⚠️ no UPDATE runs — the context isn't tracking `post`
    return Ok();
}
```

*What just happened:* nothing, and that's the trap. `post` is detached, so there's no snapshot to diff and no tracked state to mark `Modified`. `SaveChanges` looks at its (empty) change tracker, finds nothing to do, and returns `0`. No error, no exception — just a silent no-op that looks like a database bug.

Three honest ways to fix it.

**1. `ctx.Update(...)` — mark the whole entity Modified.** Simplest, but it sets *every* column to `Modified`, so the `UPDATE` rewrites all columns regardless of what actually changed.

```csharp
ctx.Update(post);    // attaches as Modified (all properties)
ctx.SaveChanges();   // UPDATE Posts SET Title=..., Body=..., ... WHERE Id = post.Id
```

*What just happened:* `Update` attaches the detached object to the context and stamps it `Modified` wholesale, so `SaveChanges` has something to write. The cost: you overwrite every column from whatever's on `post` — including any the client didn't intend to change.

**2. `Attach` + set state explicitly.** When you want finer control over which properties are dirty.

```csharp
ctx.Attach(post);
ctx.Entry(post).Property(p => p.Title).IsModified = true;   // only Title
ctx.SaveChanges();
```

*What just happened:* `Attach` brings `post` in as `Unchanged`. Marking just `Title` as modified makes the resulting `UPDATE` touch only that one column — the same minimal-write behavior as the tracked path.

**3. Load-then-copy.** The safest pattern, and what most production code does: load the real tracked entity, copy the allowed fields onto it, then save.

```csharp
var existing = ctx.Posts.First(p => p.Id == post.Id);   // tracked, with snapshot
existing.Title = post.Title;                            // copy only what you allow
ctx.SaveChanges();                                      // normal diff-and-UPDATE
```

*What just happened:* you're back on the happy path. `existing` is tracked, so the change tracker diffs it normally and writes only the columns you copied — and it guards against a client smuggling in fields you never meant to expose, since you control which properties get copied.

> ⚠️ If an update "works locally but does nothing in the web app," your entity is almost certainly detached. Check `ctx.Entry(entity).State` — if it says `Detached`, that's your answer.

## Recap

- A `DbContext` is a **unit of work** with a **change tracker**: it snapshots every entity it loads and diffs against that snapshot on save.
- **You don't call an update method.** Load → mutate a property → `SaveChanges`, and EF emits an `UPDATE` for only the changed columns. Delete with `Remove`.
- Every tracked entity has a **state** — `Added`, `Unchanged`, `Modified`, `Deleted`, or `Detached` — which you can inspect or set via `ctx.Entry(e).State`.
- `SaveChanges` **batches** all pending inserts/updates/deletes into one transaction and returns the number of affected rows.
- **Detached entities** (objects from a web request, not loaded by this context) aren't tracked — mutating them does nothing on save. Fix with `ctx.Update(...)`, `Attach` + per-property state, or the safer load-then-copy.

## Quick check

```quiz
[
  {
    "q": "You load a Post, set post.Title, and call SaveChanges. What SQL does EF Core generate?",
    "choices": ["Nothing — you forgot to call an Update method", "An UPDATE touching only the Title column", "An UPDATE rewriting every column on the row", "An INSERT for a new Post"],
    "answer": 1,
    "explain": "The entity is tracked, so SaveChanges diffs it against its snapshot, sees only Title changed, and emits an UPDATE for just that column."
  },
  {
    "q": "A controller receives a Post deserialized from the request body, sets a property, and calls SaveChanges. Nothing changes in the database. Why?",
    "choices": ["The transaction rolled back", "The object is detached, so the context isn't tracking it and has nothing to save", "SaveChanges only handles inserts", "You must call Remove first"],
    "answer": 1,
    "explain": "An object from the request body was never loaded by this context, so it's Detached. With no snapshot and no tracked state, SaveChanges finds nothing to do — a silent no-op."
  },
  {
    "q": "What does SaveChanges return?",
    "choices": ["The saved entity", "true if any change was written", "The number of rows affected", "The new primary key"],
    "answer": 2,
    "explain": "SaveChanges batches all pending changes into one transaction and returns the count of rows affected."
  }
]
```

---

[← Phase 4: Querying with LINQ](04-querying-with-linq.md) · [Guide overview](_guide.md) · [Phase 6: Relationships →](06-relationships.md)
