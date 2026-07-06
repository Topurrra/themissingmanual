---
title: "Querying with LINQ"
guide: "efcore-from-zero"
phase: 4
summary: "Read data with LINQ over IQueryable: Where/OrderBy/Take, deferred execution, Select projection to DTOs, AsNoTracking for read speed, and keeping predicates translatable to SQL."
tags: [efcore, csharp, linq, query, asnotracking]
difficulty: intermediate
synonyms: ["ef core linq", "ef core where orderby select", "ef core deferred execution", "ef core asnotracking", "ef core iqueryable", "ef core projection"]
updated: 2026-06-23
---

# Querying with LINQ

The mental model to lock in: **a LINQ query is not code that runs — it's a description that EF Core turns into SQL.** When you write `ctx.Posts.Where(...)`, nothing touches the database. You're building an *expression tree*, a blueprint that says "I want posts, filtered like this, sorted like that." EF holds that blueprint and translates it into a single SQL statement only when you actually ask for the results.

Once you internalize "LINQ describes, SQL executes, and execution happens *later* than you'd think," EF Core querying stops surprising you. Every weird behavior in this phase — why your query didn't run, why it ran twice, why it suddenly broke — traces back to that one idea.

We'll keep using the running **blog** schema: a `Blog` has many `Post`s, each `Post` has a `BlogId`, `Title`, and `Id`.

## A query is a blueprint, not a result

Look at this chain and the SQL it becomes:

```csharp
var recent = ctx.Posts
    .Where(p => p.BlogId == blogId)
    .OrderByDescending(p => p.Id)
    .Take(10)
    .ToList();
```

EF translates that into one statement:

```sql
SELECT "p"."Id", "p"."BlogId", "p"."Title"
FROM "Posts" AS "p"
WHERE "p"."BlogId" = @blogId
ORDER BY "p"."Id" DESC
LIMIT 10
```

*What just happened:* You wrote four C# method calls, and EF folded all of them into a single round-trip to the database. `Where` became `WHERE`, `OrderByDescending` became `ORDER BY ... DESC`, `Take(10)` became `LIMIT 10`. The database filters, sorts, and limits — your app gets back only the 10 rows it asked for, not the whole table.

> 📝 There are two ways to write LINQ. The **method syntax** above (`.Where(...).OrderBy(...)`) is what you'll see most. There's also **query syntax**, reading more like SQL: `from p in ctx.Posts where p.BlogId == blogId select p`. They compile to the same thing — pick whichever you find clearer. This guide uses method syntax throughout.

## The operators that map to SQL

Most LINQ operators you'd reach for have a direct SQL translation. The common ones:

```csharp
// Filtering and sorting
var titles = ctx.Posts.Where(p => p.Title.Contains("EF")).ToList();

// Paging: skip the first 20, take the next 10 (page 3, 10 per page)
var page = ctx.Posts.OrderBy(p => p.Id).Skip(20).Take(10).ToList();

// Aggregates — these run in SQL and return a single value
int total = ctx.Posts.Count(p => p.BlogId == blogId);
bool anyDrafts = ctx.Posts.Any(p => p.Title == "");

// Grouping: count posts per blog
var perBlog = ctx.Posts
    .GroupBy(p => p.BlogId)
    .Select(g => new { BlogId = g.Key, Count = g.Count() })
    .ToList();
```

*What just happened:* Each operator pushed work down into the database. `Contains` became a SQL `LIKE`; an `In`-style filter (`Where(p => ids.Contains(p.Id))`) becomes a SQL `IN (...)`. `Skip`/`Take` became `OFFSET`/`LIMIT` — that's your paging. `Count` and `Any` came back as `COUNT(*)` and an `EXISTS` check, returning one number or one boolean instead of shipping rows across the wire. `GroupBy` became `GROUP BY`. None of these loaded the table into memory — the database did the heavy lifting.

## ⚠️ Deferred execution: nothing runs until you enumerate

This is the part that bites everyone at least once. A LINQ query over `IQueryable<T>` is *lazy*. Building it does nothing. The SQL fires only when you **enumerate** the results — a specific list of things count as enumerating.

```csharp
// No database call yet. This is just a blueprint.
var query = ctx.Posts.Where(p => p.BlogId == blogId);

// Still nothing — you can keep composing.
query = query.OrderByDescending(p => p.Id);

// NOW the SQL runs — ToList() enumerates.
var results = query.ToList();
```

*What just happened:* The first two lines built and refined an expression tree without touching the database. You could pass `query` around, add more `.Where(...)` calls conditionally, and EF would fold them all into one statement. Only `ToList()` triggered the actual SQL. The triggers that force execution: `ToList()`/`ToListAsync()`, `First()`/`FirstOrDefault()`, `Single()`, `Count()`, `Any()`, `Sum()`, and a plain `foreach`. Until one of those, you're composing — not querying.

⚠️ The flip side of laziness: if you enumerate the *same* query twice (two `foreach` loops, or `.Count()` then `.ToList()`), you hit the database **twice**. When you need the results more than once, call `ToList()` once and reuse the list.

> 💡 In real apps, prefer the async versions — `ToListAsync()`, `FirstOrDefaultAsync()` — so the thread isn't blocked waiting on the database. You'll need `using Microsoft.EntityFrameworkCore;` for those extension methods.

## Select: project to exactly the columns you need

By default, querying `ctx.Posts` selects every column and materializes full `Post` entities. Often you don't need the whole row — just an id and a title for a list view. That's what **projection** with `Select` is for.

```csharp
public record PostDto(int Id, string Title);

var list = await ctx.Posts
    .Where(p => p.BlogId == blogId)
    .Select(p => new PostDto(p.Id, p.Title))
    .ToListAsync();
```

The generated SQL is narrower:

```sql
SELECT "p"."Id", "p"."Title"
FROM "Posts" AS "p"
WHERE "p"."BlogId" = @blogId
```

*What just happened:* Instead of `SELECT Id, BlogId, Title`, EF generated `SELECT Id, Title` — only the columns your `PostDto` actually uses. Less data crosses the wire, and EF skips building full entity objects. For a posts table with a big `Content` or `Body` column you don't need in a list, this is a real, measurable win.

> 💡 For read-only API endpoints (your typical `GET /posts`), project straight to a DTO. You get a leaner query *and* avoid leaking your internal entity shape into your API response — two birds, one `Select`.

## AsNoTracking and keeping queries translatable

When EF hands you full entities, it **tracks** them — keeping a snapshot of each one so it can detect edits later when you call `SaveChanges` (Phase 5's topic). For a read-only query, that bookkeeping is pure overhead: you're never going to save these objects back.

```csharp
var posts = await ctx.Posts
    .AsNoTracking()
    .Where(p => p.BlogId == blogId)
    .ToListAsync();
```

*What just happened:* `AsNoTracking()` told EF "don't bother watching these for changes." The query runs faster and uses less memory because EF skips creating change-tracking snapshots. Trade-off: if you edit one of these objects and call `SaveChanges`, nothing happens — EF isn't watching them. That's exactly what you want for GET endpoints and any read you won't modify. (Projections with `Select` to a DTO are effectively untracked already, since DTOs aren't entities.)

⚠️ **Client vs server evaluation** is the sharp edge here. Almost everything in your LINQ runs as SQL on the database (the *server*). But if your predicate calls a C# method EF can't translate, it can't push that into SQL.

```csharp
// EF can translate this — it knows StartsWith → LIKE 'EF%'
var ok = ctx.Posts.Where(p => p.Title.StartsWith("EF")).ToList();

// EF CANNOT translate a custom C# method — this throws at runtime
var bad = ctx.Posts.Where(p => MyCustomCheck(p.Title)).ToList();
```

*What just happened:* The first query translated cleanly — `StartsWith` maps to a SQL `LIKE`. The second referenced `MyCustomCheck`, a method that exists only in C#, with no SQL equivalent. Modern EF Core won't silently pull the whole table into memory to run it (older ORMs did, causing brutal performance surprises) — instead it **throws**, telling you the expression couldn't be translated. The fix: keep `Where` predicates built from things EF understands (entity properties, comparisons, `StartsWith`/`Contains`/`==`), or pull the data first and do the C# logic afterward on the in-memory list — knowing you've now loaded more rows.

The habit that saves you: **watch the SQL EF generates.** If a query is slow or behaving oddly, the logged SQL tells you whether the work is happening in the database or accidentally in your app. For a deep dive on diagnosing slow queries, see [Why Is My Query Slow?](/guides/why-is-my-query-slow).

## Recap

- A LINQ query is a **description**, not a result. EF builds an expression tree and translates it to one SQL statement.
- Execution is **deferred** — the SQL fires only when you enumerate: `ToList()`/`ToListAsync()`, `First()`, `Count()`, `Any()`, or `foreach`. Enumerate twice, hit the database twice.
- `Where`, `OrderBy`, `Skip`/`Take`, `Count`, `Any`, `Sum`, `GroupBy`, and `Contains` all map to SQL — the database does the work and returns just the answer.
- `Select` **projects** to a DTO, generating a narrower SELECT — fewer columns, less data, leaner read endpoints.
- `AsNoTracking()` skips change-tracking for read-only queries: faster and lighter.
- ⚠️ Keep predicates **translatable** — a C# method EF can't turn into SQL throws. Watch the generated SQL to stay in command.

## Quick check

```quiz
[
  {
    "q": "You write `var q = ctx.Posts.Where(p => p.BlogId == 1);` and stop there. What has hit the database?",
    "choices": ["The full filtered result set", "A COUNT of matching rows", "Nothing — execution is deferred until you enumerate", "An empty query that errors"],
    "answer": 2,
    "explain": "Building a LINQ query only creates an expression tree. No SQL runs until you enumerate with ToList(), First(), Count(), foreach, etc."
  },
  {
    "q": "For a read-only GET endpoint that returns posts you won't modify, which is the best fit?",
    "choices": ["ctx.Posts.AsNoTracking().Where(...)", "ctx.Posts.Where(...) with full tracking", "Load every column and filter in C#", "ctx.Posts.Find(id) in a loop"],
    "answer": 0,
    "explain": "AsNoTracking() skips the change-tracker bookkeeping you don't need for read-only data — faster and less memory."
  },
  {
    "q": "What does adding `.Select(p => new PostDto(p.Id, p.Title))` change about the generated SQL?",
    "choices": ["It adds a JOIN to every related table", "It narrows the SELECT to only the Id and Title columns", "It forces the query to run in memory", "It disables deferred execution"],
    "answer": 1,
    "explain": "Projection tells EF to select only the columns the DTO uses, producing a narrower SELECT that ships less data."
  }
]
```

[← Phase 3: Create & Read](03-create-and-read.md) · [Guide overview](_guide.md) · [Phase 5: Change Tracking & SaveChanges →](05-change-tracking.md)