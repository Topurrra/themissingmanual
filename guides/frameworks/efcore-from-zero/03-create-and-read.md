---
title: "Create & Read"
guide: "efcore-from-zero"
phase: 3
summary: "Insert rows with Add plus SaveChanges and watch EF write back the generated Id, then read them back with Find, First, Single, and ToList - and know when each one throws."
tags: [efcore, csharp, create, read, crud]
difficulty: intermediate
synonyms: ["ef core add savechanges", "ef core find first single", "ef core read query", "ef core insert", "ef core tolist", "ef core async savechangesasync"]
updated: 2026-07-10
---

# Create & Read

You've got a `DbContext`, a `Blog` class, and a real database with tables behind it (Phase 2). Now comes
the part you actually came for: putting rows in and getting them back out. This is the C and the R of
CRUD, and the half of EF Core you'll use every single day.

## The mental model: a session you stage into, then flush

Here's the one picture to carry through this whole phase:

**`Add` doesn't touch the database. It stages an insert in your `DbContext`'s memory. `SaveChanges` is
the moment EF turns everything you've staged into SQL and sends it - in one transaction. The finders
(`Find`, `First`, `Single`, `ToList`) go the other direction: they run a `SELECT` and pour the rows
back into C# objects.**

> 💡 Think of the `DbContext` as a notepad, not a phone line. You scribble intentions on it ("insert
> this blog"), and nothing reaches the database until you call `SaveChanges`. That's why a single
> `SaveChanges` can flush ten inserts at once - they were all just sitting on the notepad.

We'll lean on the SQL logger from Phase 1 throughout, because the fastest way to trust an ORM is to read
the SQL it writes.

## Creating rows: `Add` + `SaveChanges`

The pattern is two lines: make an object, hand it to the `DbSet`, then flush.

```csharp
var blog = new Blog { Url = "https://battle-hardened.dev" };

ctx.Blogs.Add(blog);   // staged, not saved - no SQL yet
ctx.SaveChanges();     // NOW the INSERT runs

Console.WriteLine(blog.Id);   // 1  ← EF filled this in for you
```

With the logger on, `SaveChanges` prints something like:

```sql
INSERT INTO "Blogs" ("Url")
VALUES (@p0);
SELECT "Id"
FROM "Blogs"
WHERE changes() = 1 AND "rowid" = last_insert_rowid();
```

*What just happened:* `Add` only marked the object as "to be inserted" - the first line did nothing to
the database. `SaveChanges` generated the `INSERT`, ran it inside a transaction, then read back the
auto-generated primary key with that second `SELECT`. EF Core writes that key **into your object** - 
`blog.Id` was `0` before the save and `1` after, so the object you're holding matches the row that now
exists.

> ⚠️ A brand-new object's `Id` is `0` (the default for `int`) until you call `SaveChanges`. If you try
> to use `blog.Id` before saving, you'll get `0`, not the real key. The Id exists only after the row
> exists.

### Inserting many at once: `AddRange`

When you have a batch, stage them all and save once:

```csharp
var posts = new[]
{
    new Post { Title = "Why I read the SQL", BlogId = blog.Id },
    new Post { Title = "The N+1 trap",       BlogId = blog.Id },
};

ctx.Blogs.Add(blog);
ctx.Posts.AddRange(posts);
ctx.SaveChanges();   // one trip, one transaction, all rows
```

*What just happened:* `AddRange` staged both posts alongside the blog. The single `SaveChanges` flushed
everything together in **one transaction** - if any insert failed, they'd all roll back, nothing left
half-written. That's the unit-of-work behavior we'll dig into in
[Phase 5](05-change-tracking.md); for now, hold "stage as much as you want, save once."

### Async, for web apps

In a web request you don't want to block the thread while the database works. Use the async variant:

```csharp
ctx.Blogs.Add(blog);
await ctx.SaveChangesAsync();
```

*What just happened:* same `INSERT`, same write-back of `blog.Id`, but the thread is freed to handle
other requests while the database works. In an ASP.NET Core app, this is the default to reach for. `Add`
itself stays synchronous (it's just touching the in-memory notepad) - only the flush has an async form.

## Reading rows: the four finders

Reading is where EF gives you a few tools that look similar but behave differently. Pick the one whose
**failure mode** matches what you mean.

### `Find(id)` - by primary key, tracker-first

```csharp
var blog = ctx.Blogs.Find(1);
```

*What just happened:* `Find` looks up a row by its **primary key**, checking the change tracker (the
notepad) *first*. If you already loaded blog #1 earlier in this `DbContext`, `Find` hands you the same
object with **no database trip at all**. Only if it's not already in memory does EF run:

```sql
SELECT "Id", "Url" FROM "Blogs" WHERE "Id" = @p
```

If no row has that key, `Find` returns `null`. Use it when you have an Id in hand (a route parameter
like `/blogs/1`) and want the cheapest possible lookup.

### `First` / `FirstOrDefault` - first match of a condition

```csharp
var blog  = ctx.Blogs.First(b => b.Url == "https://battle-hardened.dev");
var maybe = ctx.Blogs.FirstOrDefault(b => b.Url == "https://nope.dev");
```

*What just happened:* these take a predicate (any condition, not just the key) and return the **first**
match. EF translates it to:

```sql
SELECT "Id", "Url" FROM "Blogs" WHERE "Url" = @p LIMIT 1
```

The difference is what happens when nothing matches: `First` **throws** an
`InvalidOperationException`; `FirstOrDefault` returns `null`. The first line above succeeds; the second
returns `null` because no blog has that URL.

### `Single` / `SingleOrDefault` - exactly one match

```csharp
var blog = ctx.Blogs.Single(b => b.Url == "https://battle-hardened.dev");
```

*What just happened:* `Single` says "I expect exactly one row to match." It throws if **none** match
*and* throws if **more than one** matches - doubling as a sanity check on uniqueness. Behind the scenes EF
fetches up to two rows (`LIMIT 2`) to tell whether there was more than one. `SingleOrDefault` is the same
but returns `null` when none match (still throws on two or more). Reach for `Single` when a duplicate
would mean your data is broken and you want to find out loudly.

### `ToList` / `ToListAsync` - all the rows

```csharp
var all      = ctx.Blogs.ToList();
var dotnet   = ctx.Posts.Where(p => p.Title.Contains(".NET")).ToList();
var allAsync = await ctx.Blogs.ToListAsync();
```

*What just happened:* `ToList` runs the query and materializes **every** matching row into a `List<T>`.
On its own it's `SELECT * FROM Blogs`; with a `Where`, EF folds the condition into the SQL so only
matching rows come back - the database filters, not your C#. We'll go deep on `Where`, `OrderBy`,
`Select` in [Phase 4](04-querying-with-linq.md). The async `ToListAsync` is what you want in web apps,
for the same thread-freeing reason as `SaveChangesAsync`.

## `First` vs `FirstOrDefault`: the choice that bites people

The single most common stumble in EF Core reads.

> ⚠️ `First` and `Single` **throw** when nothing matches. `FirstOrDefault` and `SingleOrDefault`
> return **`null`**. They are not interchangeable - pick based on whether "not found" is an *error* or
> an *expected outcome*.

The clear way to choose: ask "if this returns nothing, is my program broken, or is that just a normal
'not found'?"

```csharp
// A user requested /blogs/999 - "not found" is normal, return a 404.
var blog = ctx.Blogs.FirstOrDefault(b => b.Id == id);
if (blog is null)
    return NotFound();

// We just inserted this and MUST be able to read it back - missing = bug, throw loud.
var settings = ctx.Blogs.First(b => b.Url == knownSeedUrl);
```

*What just happened:* the first case maps a missing row to an HTTP 404 - a user typing a bad Id isn't a
crash, so we check for `null` and respond gracefully. The second uses `First` because absence would mean
something is genuinely wrong; throwing surfaces the bug instead of letting a `null` slip downstream and
blow up later with a confusing `NullReferenceException`. Choosing the throwing or `*OrDefault` variant
*is* deciding how "missing" should be handled.

## Two things that come for free

> 📝 **Your queries are injection-safe by default.** Notice the `@p0` / `@p` in every generated
> statement above - EF Core turns the values in your LINQ predicates into **SQL parameters**, never
> string-concatenated into the query text. So `b.Url == userInput` is safe even when `userInput` is
> `"'; DROP TABLE Blogs; --"`; it goes in as a parameter value, not as SQL - one of the real reasons to
> let the ORM write the SQL.

> 📝 **Prefer the async finders in web apps.** `ToListAsync`, `FirstOrDefaultAsync`,
> `SingleOrDefaultAsync`, `FindAsync`, and `SaveChangesAsync` all exist. In a server handling many
> concurrent requests, blocking a thread on a synchronous database call wastes a thread that could serve
> someone else. It matters far less in a one-off script - but in ASP.NET Core, async is the house style.

## Recap

- **`Add` stages, `SaveChanges` flushes.** Nothing reaches the database until `SaveChanges` (or
  `SaveChangesAsync`) runs, and it runs everything staged in one transaction.
- **EF writes the generated `Id` back into your object** after the insert - it's `0` before saving and
  the real key after.
- **`Find(id)`** looks up by primary key and checks the in-memory tracker first (no DB hit if already
  loaded); **`ToList`/`ToListAsync`** pull every matching row.
- **`First`/`Single` throw on no match; `FirstOrDefault`/`SingleOrDefault` return `null`.** Pick by
  whether "missing" is an error or a normal outcome (e.g. a 404).
- **`Single` also throws on more than one match**, making it a built-in uniqueness check.
- **Values become SQL parameters automatically**, so reads are injection-safe; prefer the async finders
  in web apps.

## Quick check

```quiz
[
  {
    "q": "You call ctx.Blogs.Add(blog) but never call SaveChanges. What's in the database?",
    "choices": ["The new blog row", "Nothing - Add only stages the insert in memory", "A row with a null Url", "An empty row reserving the Id"],
    "answer": 1,
    "explain": "Add only marks the object for insertion on the DbContext. No SQL runs until SaveChanges (or SaveChangesAsync) flushes it."
  },
  {
    "q": "A user requests /blogs/999 and no blog has that Id. You want to return a 404, not crash. Which finder fits?",
    "choices": ["First, then catch the exception", "Single", "FirstOrDefault and check for null", "Find, then call SaveChanges"],
    "answer": 2,
    "explain": "FirstOrDefault returns null when nothing matches, so you can check for null and respond with a 404. First would throw, treating a normal 'not found' as a crash."
  },
  {
    "q": "After ctx.Blogs.Add(blog); ctx.SaveChanges();, what is blog.Id?",
    "choices": ["Still 0 - you must reload the object", "The auto-generated key EF wrote back into the object", "null until you call Find", "A random GUID"],
    "answer": 1,
    "explain": "SaveChanges runs the INSERT and reads the database-generated primary key back into your object, so blog.Id holds the real key right after the save."
  }
]
```

[← Phase 2: Entity Models & Migrations](02-models-and-migrations.md) · [Guide overview](_guide.md) · [Phase 4: Querying with LINQ →](04-querying-with-linq.md)
