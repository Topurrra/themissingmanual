---
title: "Transactions & Migrations in Production"
guide: "efcore-from-zero"
phase: 8
summary: "Group multiple writes into all-or-nothing transactions, guard concurrent edits with a rowversion concurrency token, and apply migrations safely on a live database without racing app instances."
tags: [efcore, csharp, transactions, migrations, concurrency, production]
difficulty: advanced
synonyms: ["ef core transaction", "ef core begintransaction", "ef core concurrency token rowversion", "ef core migrations production", "ef core migrations bundle", "ef core idempotent script"]
updated: 2026-06-23
---

# Transactions & Migrations in Production

Two mental models carry this whole phase, and they're cousins. The first: a **transaction makes several operations all-or-nothing** — either every write lands together, or none of them do, so the database never ends up half-updated. The second: in production, **schema changes ship as reviewed, ordered migrations** — not as something your app improvises at startup. Both are about the same instinct: when real data is on the line, you stop trusting "it'll probably work" and start demanding "all or nothing, reviewed, repeatable."

This is the phase where EF Core stops being a convenience and starts being something you'd trust with a customer's money. Let's earn that trust.

> 📝 You've already been using transactions without knowing it — every `SaveChanges` from [Phase 5](05-change-tracking.md) was one. We're now going to make that explicit, and then take the migrations workflow from [Phase 2](02-models-and-migrations.md) and harden it for a live database.

## `SaveChanges` is already a transaction

Here's the thing most people miss: you don't need to *add* transactions to make a single `SaveChanges` safe. It already is one.

When you call `SaveChanges`, EF Core batches all the pending inserts, updates, and deletes it's been tracking and runs them inside a **single transaction**. If any one statement fails — a constraint violation, a deadlock, a dropped connection — the whole batch rolls back. You never get three of your five inserts.

```csharp
var blog = new Blog { Url = "https://battle-hardened.dev" };
blog.Posts.Add(new Post { Title = "Hello", Content = "First post" });
blog.Posts.Add(new Post { Title = "World", Content = "Second post" });

ctx.Blogs.Add(blog);
ctx.SaveChanges();   // blog + both posts: all of it, or none of it
```

*What just happened:* EF Core inserted the `Blog` row and both `Post` rows inside one implicit transaction. If the second post's insert had blown up, the blog and the first post would be rolled back too — you'd be left with exactly what you started with. This atomicity is free; it's the default. The transaction story only gets interesting when **one** `SaveChanges` isn't enough.

> 💡 If everything you need to do fits in a single `SaveChanges`, you're done — don't reach for `BeginTransaction`. Adding an explicit transaction around one `SaveChanges` is redundant ceremony.

## Explicit transactions: spanning multiple `SaveChanges`

So when *do* you need an explicit transaction? When a single unit of work spans **more than one** `SaveChanges` call — or mixes `SaveChanges` with raw SQL — and you need all of it to commit or roll back together.

A classic case: you want to insert a blog, get its generated `Id`, and only then insert dependent rows in a second round — but if that second step fails, the blog must vanish too. `BeginTransaction` makes those separate `SaveChanges` calls one atomic unit.

```csharp
using var tx = ctx.Database.BeginTransaction();
try
{
    ctx.Blogs.Add(blog);
    ctx.SaveChanges();              // first write

    ctx.Posts.AddRange(posts);
    ctx.SaveChanges();              // second write

    tx.Commit();                   // both land together
}
catch
{
    tx.Rollback();                 // anything failed → undo everything
    throw;
}
```

*What just happened:* `BeginTransaction` opened one database transaction that both `SaveChanges` calls wrote into. Neither set of rows is visible to anyone else until `Commit()`. If either `SaveChanges` throws, we `Rollback()` and re-throw, leaving the database untouched. The `using` is doing quiet safety work too — if an exception skips past us, disposing the transaction without a commit also rolls it back. (The explicit `Rollback()` makes the intent obvious to the next reader, which is worth the line.)

> 💡 This is just ACID atomicity applied through EF Core. If "atomic," "isolation," and "commit/rollback" feel fuzzy, the underlying database concepts live in [Transactions & ACID](/guides/transactions-and-acid) — that's the *why* under this *how*.

> ⚠️ Keep transactions **short**. A transaction holds locks until it commits, so calling a slow web API or waiting on user input in the middle of one is how you turn a quick write into a pile-up of blocked connections. Open it, do the writes, commit, get out.

## Optimistic concurrency: don't let the last writer win silently

Now the bug that *doesn't* announce itself. Picture two editors load the same blog. Editor A changes the URL and saves. Editor B — who loaded the old version a minute ago — changes the description and saves. With no protection, B's `SaveChanges` issues `UPDATE Blogs SET ... WHERE Id = 5`, overwriting A's change. A's edit is gone, no error, nobody notices until a customer asks where their data went. That's **last-write-wins**, and it's the silent default.

The fix is a **concurrency token**: a column EF Core checks during updates. The cleanest version is a `rowversion` (a value the database auto-bumps on every change), declared with `[Timestamp]`:

```csharp
public class Blog
{
    public int Id { get; set; }
    public string Url { get; set; } = "";

    [Timestamp]
    public byte[] RowVersion { get; set; } = null!;
}
```

*What just happened:* `[Timestamp]` tells EF Core this `byte[]` is a database-managed `rowversion` — the database stamps a new value into it every time the row changes. EF Core now treats it as a concurrency token, which changes how it writes updates. (The Fluent-API equivalent, if you prefer keeping attributes off your entities, is `.Property(x => x.RowVersion).IsRowVersion()`, or `.IsConcurrencyToken()` for any plain column you want to guard.)

With that token in place, EF Core adds it to the `WHERE` clause of every update:

```sql
UPDATE Blogs SET Url = @newUrl, RowVersion = @auto
WHERE Id = 5 AND RowVersion = @theVersionILoaded;
```

*What just happened:* The update only matches if `RowVersion` is **still** the value you loaded. If Editor A already changed the row, the version moved on, the `WHERE` matches **zero rows**, and EF Core notices the mismatch (it expected to affect one row) and throws **`DbUpdateConcurrencyException`**. The silent clobber became a loud, catchable signal.

You handle it by catching that exception, reloading the current values, and deciding what to do — retry, merge, or ask the user:

```csharp
try
{
    ctx.SaveChanges();
}
catch (DbUpdateConcurrencyException ex)
{
    var entry = ex.Entries.Single();
    entry.Reload();          // pull the database's current values
    // re-apply your change on top of the fresh data, then SaveChanges() again
}
```

*What just happened:* `ex.Entries` hands you the entities that failed the version check. `Reload()` refreshes one with what's actually in the database now, so you can re-apply your edit against current data instead of stale data and try again. The "right" merge policy is yours to choose — but now you *get* to choose, instead of losing data quietly.

> ⚠️ Without a concurrency token, concurrent edits are **last-write-wins by default** — and EF Core gives you no warning. If two users can ever edit the same row (almost any real app), add the token *before* you ship, not after the support ticket.

## Applying migrations in production

You built migrations in [Phase 2](02-models-and-migrations.md): model change → `migrations add` → commit. That workflow is the same in production. What changes is **how the migration reaches the live database** — because now there's real data, possibly multiple app instances, and no undo button.

First, what *not* to lean on. `EnsureCreated()` has no concept of evolving a schema (Phase 2 covered why), and there's no "auto-migrate on every request" feature worth wiring up. You want a deliberate, reviewable step. Here are the three solid options.

**Option 1 — `dotnet ef database update` in the deploy pipeline.** The same command from your dev machine, run as a controlled step during deployment (before or alongside rolling out the new app version). Simple, explicit, and it runs once where you can watch it.

```bash
dotnet ef database update
```

*What just happened:* The deploy pipeline applied every pending migration's `Up()` to the production database as a discrete, observable step — not buried inside app startup. It runs in one place, at a known moment, and the pipeline logs tell you exactly what happened.

**Option 2 — an idempotent SQL script for a human to review.** Generate plain SQL a DBA can read, approve, and run against the database — and run **repeatedly** without harm:

```bash
dotnet ef migrations script --idempotent
```

*What just happened:* EF Core emitted a SQL script that checks `__EFMigrationsHistory` before each migration, so it only applies the ones that haven't run yet. That `--idempotent` flag is what makes it safe to run more than once — and the plain SQL is something a human (or a change-review process) can actually inspect before it touches production data. This is the option regulated or DBA-gated shops usually want.

**Option 3 — a migrations bundle.** A self-contained executable that applies your migrations, with no SDK or project files needed on the target machine:

```bash
dotnet ef migrations bundle
```

*What just happened:* EF Core packaged the migrations into a single executable you can drop onto a deploy server and run. It's a clean middle ground — more portable than needing the full `dotnet ef` tooling installed, more automated than hand-running a SQL script.

### The convenient-but-risky one: `Database.Migrate()` at startup

You'll see this in tutorials: call `context.Database.Migrate()` when the app boots and let it apply pending migrations itself.

```csharp
// Convenient — but think hard before using this in production.
context.Database.Migrate();
```

*What just happened:* On startup, the app applied any pending migrations to its database automatically. For a solo project or a single-instance app, that's genuinely convenient. The trouble shows up at scale.

> ⚠️ `Database.Migrate()` at startup is risky when **multiple app instances start at once** — a common deploy and autoscaling pattern. Several instances race to apply the same migrations against the same database, and a partially-applied schema is a bad afternoon. It also gives you **no review step**: the schema changes the instant the app boots, with no DBA approval and no separate moment to catch a mistake. For anything multi-instance or production-critical, prefer a deploy-time step (Option 1, 2, or 3) where exactly one actor applies migrations at a known time.

> 💡 The migrations *workflow* — one migration per change, reviewed, committed, ordered — is the foundation here, and it generalizes beyond EF Core. If you want the framework-agnostic principles (forward-only changes, expand/contract, never editing an applied migration), see [Database Migrations](/guides/database-migrations).

## Recap

- **`SaveChanges` is already atomic.** Every call batches its writes into a single transaction — all of them land, or none do. You don't add a transaction to make one `SaveChanges` safe.
- **Use `BeginTransaction` only to span multiple `SaveChanges` calls** (or `SaveChanges` plus raw SQL) as one all-or-nothing unit. Commit on success; roll back (and re-throw) on failure. Keep transactions short.
- **Optimistic concurrency** needs a token: a `[Timestamp] byte[] RowVersion` (rowversion) or `.IsConcurrencyToken()`. EF Core adds it to the update's `WHERE`; a stale version matches zero rows and throws `DbUpdateConcurrencyException`. Catch it, `Reload()`, re-apply, retry.
- **Without a concurrency token, concurrent edits are silent last-write-wins** — no error, lost data. Add the token before you ship anything multi-user.
- **Apply migrations in production via a deliberate step**: `dotnet ef database update` in the pipeline, `migrations script --idempotent` for DBA review, or `migrations bundle` as a portable executable.
- **`Database.Migrate()` at startup is convenient but risky** — multiple instances race to migrate, and there's no review moment. Prefer a deploy-time step for anything production-critical.

## Quick check

```quiz
[
  {
    "q": "You call a single SaveChanges that inserts a Blog and three Posts, and the third Post violates a constraint. What ends up in the database?",
    "choices": ["The Blog and the first two Posts", "Nothing — the whole SaveChanges rolls back", "The Blog only", "Everything, with the bad Post nulled out"],
    "answer": 1,
    "explain": "A single SaveChanges runs as one transaction. If any statement in the batch fails, the entire batch rolls back — all or nothing."
  },
  {
    "q": "A Blog entity has a [Timestamp] RowVersion property. Two users load the same blog; user A saves first, then user B saves a stale copy. What happens to user B's SaveChanges?",
    "choices": ["It silently overwrites user A's change", "It throws DbUpdateConcurrencyException because the WHERE matches no rows", "It merges both changes automatically", "It blocks until user A's transaction releases"],
    "answer": 1,
    "explain": "The concurrency token goes into the update's WHERE clause. User A already bumped RowVersion, so user B's update matches zero rows and EF Core throws DbUpdateConcurrencyException — catch it, reload, and retry."
  },
  {
    "q": "Why is context.Database.Migrate() at startup risky for a production app running several instances?",
    "choices": ["It can't apply more than one migration at a time", "Multiple instances race to apply the same migrations, and there's no review step", "It only works with SQLite", "It deletes the __EFMigrationsHistory table each boot"],
    "answer": 1,
    "explain": "When several instances start together they race to migrate the same database, risking a partially-applied schema, and the schema changes with no DBA review. Prefer a single deploy-time step: database update, an idempotent script, or a bundle."
  }
]
```

---

[← Phase 7: Loading Strategies & the N+1 Trap](07-loading-and-n-plus-1.md) · [Guide overview](_guide.md) · [Phase 9: EF Core in the Real World & Where to Go Next →](09-where-to-go-next.md)