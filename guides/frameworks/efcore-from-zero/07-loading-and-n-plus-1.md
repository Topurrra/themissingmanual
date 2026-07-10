---
title: "Loading Strategies & the N+1 Trap"
guide: "efcore-from-zero"
phase: 7
summary: "How EF Core loads related data: Include and ThenInclude (eager), lazy loading proxies, explicit loading, and the N+1 query trap that bites everyone — plus projection and split queries."
tags: [efcore, csharp, include, n-plus-1, eager-loading, performance]
difficulty: advanced
synonyms: ["ef core include", "ef core n+1", "ef core eager lazy loading", "ef core theninclude", "ef core split query", "ef core load related data"]
updated: 2026-07-10
---

# Loading Strategies & the N+1 Trap

In [Phase 6](06-relationships.md) you wired up navigation properties — `blog.Posts`, `post.Blog`,
`post.Tags`. They look like ordinary C# collections, so it's tempting to assume that once you've loaded
a blog, its posts are right there waiting. They are not. The gap between "looks loaded" and "is loaded"
is where the single most common ORM performance disaster lives: the **N+1 query trap**.

## The mental model: EF loads related data only when you ask

Here is the one sentence that prevents 80% of the confusion in this phase:

> 💡 **Loading a parent does not load its navigations.** EF Core fetches related data only when you
> explicitly ask for it — by `Include`-ing it in the query, by opting into lazy loading, or by loading
> it explicitly afterward.

When you write `ctx.Blogs.ToList()`, EF Core runs *one* `SELECT` against the `Blogs` table and hands you
`Blog` objects. Each `blog.Posts` collection comes back **empty** — not null, empty — because EF never
went to the `Posts` table. The navigation property is just an in-memory container with no idea a database
exists. EF fills it only when instructed.

```csharp
var blogs = ctx.Blogs.ToList();
Console.WriteLine(blogs[0].Posts.Count);   // 0 — even if the blog has 50 posts in the DB
```

*What just happened:* one query went out for blogs, nothing for posts. `Posts.Count` is 0 because the
collection was never populated. Not a bug — EF refuses to silently drag the whole database into memory
behind your back. Your job is to tell it what graph you actually need, three ways.

## Way 1: Eager loading with `Include` (the default tool)

**Eager loading** means "fetch the related data *in the same trip* as the parent." You declare it with
`Include`, naming the navigation you want.

```csharp
var blogs = ctx.Blogs
    .Include(b => b.Posts)
    .ToList();

Console.WriteLine(blogs[0].Posts.Count);   // 50 — populated
```

*What just happened:* `Include(b => b.Posts)` told EF to pull each blog *and* its posts. EF emits a
single `LEFT JOIN`, reads the flattened rows, and stitches the `Posts` collections back together. One
round trip, and now every `blog.Posts` is filled.

The SQL looks roughly like this:

```sql
SELECT b.Id, b.Url, p.Id, p.Title, p.BlogId
FROM Blogs AS b
LEFT JOIN Posts AS p ON p.BlogId = b.Id
ORDER BY b.Id;
```

*What just happened:* one `SELECT` with a join. The `ORDER BY b.Id` is EF's doing — grouping rows by blog
so it can assign each batch of posts to the right parent while reading down the result set.

### Going deeper with `ThenInclude`

`Include` loads one level. To follow a navigation *off the thing you just included*, chain
`ThenInclude`:

```csharp
var blogs = ctx.Blogs
    .Include(b => b.Posts)
        .ThenInclude(p => p.Tags)
    .ToList();
```

*What just happened:* you loaded blogs, their posts, and each post's tags — the whole three-level graph
(`Blog` → `Post` → `Tag`) in one query. `Include` jumps from blog to posts; `ThenInclude` continues from
each post to its tags. Chain as deep as your model goes.

> 📝 `Include` is the tool to reach for **by default**. It's explicit (you can see exactly what gets
> loaded), one round trip, and doesn't depend on opt-in magic. The other two strategies exist for specific
> situations — and one of them is a trap.

## Way 2: Lazy loading (off by default — and how it bites)

**Lazy loading** means: don't fetch the related data up front; fetch it *automatically the moment you
touch the navigation property*. Accessing `blog.Posts` silently fires a query.

It is **off by default in EF Core**, and turning it on takes deliberate setup:

1. Install the `Microsoft.EntityFrameworkCore.Proxies` package.
2. Enable it: `optionsBuilder.UseLazyLoadingProxies()`.
3. Make every navigation property `virtual` so EF can override it with a proxy.

```csharp
public class Blog
{
    public int Id { get; set; }
    public string Url { get; set; } = "";
    public virtual List<Post> Posts { get; set; } = new();   // virtual = lazy-loadable
}

// In OnConfiguring / DI setup:
optionsBuilder
    .UseLazyLoadingProxies()
    .UseSqlite("Data Source=blog.db");
```

*What just happened:* EF replaces your `Blog` with a generated subclass (a "proxy") that overrides the
`Posts` getter. When you read `blog.Posts`, the proxy notices the collection isn't loaded yet and fires a
`SELECT * FROM Posts WHERE BlogId = @id` right then. Convenient — `blog.Posts` "just works" with no
`Include`. That convenience is exactly what makes it dangerous, next section.

## Way 3: Explicit loading (load it yourself, later)

**Explicit loading** is the manual middle ground: no proxies, no `Include` at query time — you load a
specific navigation on demand using the `Entry` API.

```csharp
var blog = ctx.Blogs.First();

// Load a collection navigation:
ctx.Entry(blog).Collection(b => b.Posts).Load();

// Load a reference navigation:
var post = ctx.Posts.First();
ctx.Entry(post).Reference(p => p.Blog).Load();
```

*What just happened:* `ctx.Entry(blog)` gives you EF's tracking handle for that object.
`.Collection(...).Load()` runs one query to fill `blog.Posts`; `.Reference(...).Load()` does the same for
a single related entity like `post.Blog`. Useful when you only *sometimes* need the related data — but
call it inside a loop and you've reinvented the N+1 problem by hand.

## ⚠️ The N+1 trap — the heart of this phase

The disaster: you load a list of blogs, then loop over them and touch a navigation.

```csharp
var blogs = ctx.Blogs.ToList();                 // Query #1
foreach (var blog in blogs)
    Console.WriteLine(blog.Posts.Count);        // with lazy loading: one query PER blog
```

*What just happened:* line 1 runs **1** query to get the blogs. Then, with lazy loading enabled, *every
single* `blog.Posts` access fires its own `SELECT ... WHERE BlogId = @id`. With 100 blogs, that's
**1 + 100 = 101** queries to render one page. That's the N+1 trap: **1** query for the parents, plus
**N** more — one per parent — for the children. The loop looks innocent; the database is on fire.

It's insidious precisely *because* it looks like normal C#. Nothing in `blog.Posts.Count` screams
"network round trip." With lazy loading on, queries hide behind property access, so only the SQL log
(or a slow page under load) reveals 101 trips where there should be 1 or 2.

The SQL log under N+1 looks like this — and keeps going:

```sql
SELECT Id, Url FROM Blogs;                       -- 1
SELECT Id, Title, BlogId FROM Posts WHERE BlogId = 1;   -- + N
SELECT Id, Title, BlogId FROM Posts WHERE BlogId = 2;
SELECT Id, Title, BlogId FROM Posts WHERE BlogId = 3;
-- ... one more for every blog
```

### The fix: ask for the graph once

```csharp
var blogs = ctx.Blogs
    .Include(b => b.Posts)      // <-- one query, the graph comes with it
    .ToList();

foreach (var blog in blogs)
    Console.WriteLine(blog.Posts.Count);   // no queries here — already loaded
```

*What just happened:* the same loop now costs **1** query instead of **N+1**. `Include` pulled all the
posts in the original round trip via a join, so every `blog.Posts` is already in memory and `.Count`
touches nothing but RAM. One trip, not 101.

> 💡 This is why `Include` is the default and lazy loading is the footgun: it turns a missing `Include`
> into N silent queries instead of one loud error. The cure is the habit you've been building all
> guide — **watch the SQL EF generates**. The same query shape repeating in a loop in your logs is N+1.
> See [Why Is My Query Slow?](/guides/why-is-my-query-slow) for reading and diagnosing query plans.

## Avoiding over-fetch: projection with `Select`

Sometimes the issue isn't *too many* queries — it's *one query that drags too much*. If a page only needs
each blog's URL and post count, loading every full `Post` entity is waste. Project instead.

```csharp
var summaries = ctx.Blogs
    .Select(b => new
    {
        b.Url,
        PostCount = b.Posts.Count
    })
    .ToList();
```

*What just happened:* `Select` projects straight into a lightweight anonymous shape. EF turns
`b.Posts.Count` into a SQL aggregate — a correlated subquery or grouped count — so you get one efficient
query returning two columns per blog and loading **no entities at all**. When you only need a few
fields, projection beats `Include` hands down.

```sql
SELECT b.Url, (SELECT COUNT(*) FROM Posts AS p WHERE p.BlogId = b.Id) AS PostCount
FROM Blogs AS b;
```

*What just happened:* the count happens in the database, not in C#. No posts cross the wire, just the
URL and a number per blog.

## ⚠️ Cartesian explosion and `AsSplitQuery`

`Include` is great until you `Include` **two collections at once**. Then the join multiplies:

```csharp
var blogs = ctx.Blogs
    .Include(b => b.Posts)
    .Include(b => b.Authors)    // a second collection on the same blog
    .ToList();
```

*What just happened:* joining `Blogs` to both `Posts` *and* `Authors` produces a row for every
*combination* — a blog with 50 posts and 10 authors yields 50 × 10 = 500 rows, most repeating the same
data. That's a **cartesian explosion**: the result set balloons and EF burns time de-duplicating. One
query, but a brutally fat one.

The fix is to let EF split it into separate queries:

```csharp
var blogs = ctx.Blogs
    .Include(b => b.Posts)
    .Include(b => b.Authors)
    .AsSplitQuery()             // <-- one SELECT per collection instead of a mega-join
    .ToList();
```

*What just happened:* `AsSplitQuery()` tells EF to run one `SELECT` for blogs, one for their posts, one
for their authors — then stitch the graph together in memory. You trade a few extra round trips for
avoiding the multiplicative row blowup. (Tradeoff: separate queries aren't a single consistent snapshot —
fine for most reads, something to weigh under heavy concurrent writes.)

> 📝 The N+1 problem is not an EF Core quirk — it's universal to every ORM. You'll meet the exact same
> trap (and the exact same `Include`-style fix) in Java's
> [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero) and Go's [GORM](/guides/gorm-from-zero). The
> defense is always the same: watch the SQL, load the graph you need in as few trips as possible — see
> [Why Is My Query Slow?](/guides/why-is-my-query-slow).

## Recap

- **Loading a parent does not load its navigations.** `ctx.Blogs.ToList()` leaves every `blog.Posts`
  empty — EF fetches related data only when you ask.
- **Eager loading with `Include`** (and `ThenInclude` for deeper levels) pulls the graph in one round
  trip via a join. It's explicit and the right default.
- **Lazy loading** is off by default; it needs the `Proxies` package, `UseLazyLoadingProxies()`, and
  `virtual` navigations. It makes `blog.Posts` "just work" — by firing a hidden query, which is the
  classic N+1 source. **Explicit loading** (`Entry().Collection().Load()`) is the manual alternative.
- **The N+1 trap:** loading parents (1 query) then touching a navigation in a loop fires N more — 1+N
  total. The fix is `Include` (or projection) to make it one round trip. Watch the SQL log to catch it.
- **`Select` projection** avoids over-fetch by loading only the columns you need (no entities tracked);
  **`AsSplitQuery()`** avoids the cartesian explosion when you `Include` multiple collections at once.

## Quick check

```quiz
[
  {
    "q": "After `var blogs = ctx.Blogs.ToList();` with default settings, what is `blogs[0].Posts.Count`?",
    "choices": ["The real post count from the database", "0, because navigations aren't loaded unless you ask", "null, because Posts was never set", "Throws an exception"],
    "answer": 1,
    "explain": "Loading a parent does not load its navigations. EF ran one query for blogs and never touched Posts, so the collection is empty (0), not populated and not null."
  },
  {
    "q": "You loop over 100 blogs and read `blog.Posts.Count` each time, with lazy loading enabled. How many queries run?",
    "choices": ["1", "2", "101 (1 for blogs + 100 for posts)", "100"],
    "answer": 2,
    "explain": "This is the N+1 trap: 1 query loads the blogs, then each lazy `blog.Posts` access fires its own query — 100 more. Adding `Include(b => b.Posts)` collapses it back to 1."
  },
  {
    "q": "You `Include` two separate collections on the same blog and the row count explodes. What fixes it?",
    "choices": ["Add more `ThenInclude` calls", "`AsSplitQuery()` to run one SELECT per collection", "Switch to lazy loading", "Call `Load()` in a loop"],
    "answer": 1,
    "explain": "Joining two collections at once causes a cartesian explosion (rows multiply). `AsSplitQuery()` splits it into one query per collection and stitches the graph in memory, avoiding the blowup."
  }
]
```

[← Phase 6: Relationships](06-relationships.md) · [Guide overview](_guide.md) · [Phase 8: Transactions & Migrations in Production →](08-transactions-and-migrations.md)
