---
title: "What EF Core Is & the DbContext"
guide: "efcore-from-zero"
phase: 1
summary: "EF Core is .NET's flagship ORM: a DbContext is your change-tracking session, DbSets are tables, and LINQ becomes SQL. Connect to SQLite, save a row, and watch the SQL."
tags: [efcore, csharp, orm, dbcontext, getting-started]
difficulty: beginner
synonyms: ["what is ef core", "entity framework core dbcontext", "ef core dbset", "ef core sqlite", "ef core orm intro", "ef core see sql"]
updated: 2026-07-10
---

# What EF Core Is & the DbContext

A .NET app that reads and writes SQL rows *could* hand-write every `INSERT`, `SELECT`, and `UPDATE` —
opening a connection, building a command, reading columns back one at a time. It works, but it's repetitive
plumbing, and the day a column name changes, you're chasing it through every query that touched it.

EF Core — Entity Framework Core — is what most ASP.NET Core apps reach for instead. It's .NET's flagship
**ORM** (object-relational mapper): you describe your tables as plain C# classes, and EF Core writes the SQL
for create, read, update, delete, relationships, and schema migrations. Fewer typos in column names, less
boilerplate, and the shape of your data lives in one place.

> 📝 This phase teaches the **library**. It assumes you know **C#** (classes, generics, LINQ basics,
> `async`/`await` — [C# From Zero](/guides/csharp-from-zero)) and the basics of **databases** (tables,
> rows, keys — [What a Database Is](/guides/what-a-database-is)). If you've used an ORM in another
> language, the core ideas transfer straight across — see [GORM From Zero](/guides/gorm-from-zero) for the
> same concepts in Go.

## The honest cost

Every convenience comes with a bill. When a library writes your SQL for you, you stop *seeing* your SQL —
exactly where ORMs earn their bad reputation. One innocent-looking method call can fire off a query you'd
never have written by hand, and if you're not watching, you find out in production when a page is
mysteriously slow.

⚠️ The cure isn't avoiding EF Core — it's **watching the SQL it generates**. EF Core can log every statement
it runs. Turn that on while you learn (we'll do it in a minute), and the ORM stops being a black box. You'll
see the `INSERT` behind an `Add`, the `SELECT` behind a query, and the moment a call does something expensive.

## The mental model

Before any setup, hold this picture — it's the whole guide in one line:

> **A `DbContext` is a change-tracking session, a `DbSet<T>` is a table, and LINQ becomes SQL.**

Three pieces:

- **The `DbContext` = your session with the database.** You create one, do some work through it, and dispose
  it. While it's alive it **tracks the changes** you make to the objects it hands you, and pushes them all
  to the database when you call `SaveChanges`.
- **A `DbSet<T>` = a table.** Your context exposes one `DbSet` property per table — `DbSet<Blog>` is the
  `Blogs` table. You add to it, and you query through it.
- **LINQ becomes SQL.** You write queries in C#'s built-in query language (LINQ), and EF Core translates
  them into real `SELECT ... WHERE ...` statements. (Querying is Phase 4 — for now, just know that's the
  flow.)

💡 EF Core is a **SQL generator**, not a cage. When the high-level API gets awkward — a gnarly report, a
bulk update — you drop straight to raw SQL with `FromSql(...)` or `ExecuteSql(...)`, against the same
connection. You never lose access to the database underneath.

## Installing EF Core

EF Core is the core library plus a **provider** for your specific database. We'll use SQLite — zero setup
(the database is just a file), so you can run everything here without standing up a server.

From inside a console project (`dotnet new console -o blog` if you're starting fresh), pull in the SQLite
provider:

```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
```

*What just happened:* `dotnet add package` downloaded the SQLite provider and added it to your `.csproj`.
That one package brings EF Core's core along as a dependency, plus the adapter that teaches it to speak
SQLite specifically. Moving to PostgreSQL or SQL Server later just means swapping the provider
(`Npgsql.EntityFrameworkCore.PostgreSQL` or `Microsoft.EntityFrameworkCore.SqlServer`) — little else changes.

## Defining a DbContext and an entity

You write two kinds of class: a **`DbContext`** subclass that names your tables and points at the database,
and an **entity** class for each table — a plain class whose properties become columns:

```csharp
using Microsoft.EntityFrameworkCore;

public class BlogContext : DbContext
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=blog.db");
}

public class Blog
{
    public int Id { get; set; }
    public string Url { get; set; } = "";
}
```

*What just happened:* `BlogContext` derives from `DbContext`, which is what makes it a database session. Its
two `DbSet<T>` properties declare the tables — `Blogs` and `Posts` — and `=> Set<Blog>()` is the standard
way to wire each one up. `OnConfiguring` is where the context learns *which* database to talk to:
`UseSqlite("Data Source=blog.db")` says "use the SQLite provider, pointed at a file called `blog.db`"
(created automatically if it doesn't exist). `Blog` is an **entity** — an ordinary C# class. Its `Id` and
`Url` properties will become columns; EF Core treats a property named `Id` as the primary key by
convention. (We'll define `Post` and turn these into real tables in [Phase 2](02-models-and-migrations.md).)

📝 In an ASP.NET Core app you usually *don't* write `OnConfiguring`. Instead you register the context with
dependency injection via `AddDbContext<BlogContext>(...)`, and the framework hands a fresh, correctly-scoped
context to each request — see [ASP.NET Core From Zero](/guides/aspnet-core-from-zero). Same mental model,
different wiring.

## Opening, saving, and disposing

Using the context is three moves — create it, change something, save:

```csharp
using var ctx = new BlogContext();

ctx.Blogs.Add(new Blog { Url = "https://example.com" });
ctx.SaveChanges();
```

Run it with `dotnet run`.

*What just happened:* `new BlogContext()` opened a session. `ctx.Blogs.Add(...)` didn't touch the database
yet — it told the context "start tracking this new `Blog`, I intend to insert it." Nothing is written until
`ctx.SaveChanges()`, which looks at everything the context is tracking, generates the SQL, and runs it in a
single batch (here, one `INSERT`). `using var` makes this safe: `DbContext` is meant to be **short-lived**,
and `using` disposes it — releasing the connection — the moment the block ends. Create one, do a unit of
work, let it go. (`SaveChanges` has an `async` twin, `SaveChangesAsync`, for web apps.)

## Turn on the SQL log

This is the fix for the honest cost, and the single best habit to build while learning. Chain `LogTo` onto
your provider setup and EF Core prints every statement it runs:

```csharp
protected override void OnConfiguring(DbContextOptionsBuilder options)
    => options.UseSqlite("Data Source=blog.db")
              .LogTo(Console.WriteLine);
```

*What just happened:* the only change is `.LogTo(Console.WriteLine)`, which hands EF Core a place to send
its log lines — here, straight to the console. From now on, every query leaves a trail you can read. (In
development you can also add `.EnableSensitiveDataLogging()` to see actual parameter *values*, not just
`@p0` placeholders — handy while learning, but keep it out of production since it can print real data.)

Re-run the save with logging on, and the `INSERT` from a moment ago shows up looking roughly like this:

```sql
INSERT INTO "Blogs" ("Url")
VALUES (@p0);
SELECT "Id"
FROM "Blogs"
WHERE changes() = 1 AND "rowid" = last_insert_rowid();
```

*What just happened:* that's the literal SQL behind `Add` + `SaveChanges`. The first statement inserts the
row; the second reads back the database-generated `Id` so EF Core can fill it into your `Blog` object in
memory. Two C# lines, and here's exactly what they became. 💡 Keep this on the entire time you're learning
— the instant a single call fires five queries, or runs a `SELECT` with no `WHERE`, you'll see it.

## The running example: a blog

Rather than disconnected snippets, this guide builds one small, recognizable schema — a **blog** — and grows
it phase by phase. You've already met two of its tables; here's the cast and how they relate:

```mermaid
flowchart LR
  Blog -- "has many" --> Post
  Post -- "tagged with many" --> Tag
  Tag -- "applied to many" --> Post
```

*What just happened:* the diagram lays out where we're headed. A **`Blog`** has many **`Post`s** — a
one-to-many relationship. A **`Post`** can carry many **`Tag`s** while each `Tag` labels many posts — a
many-to-many. Right now they're just boxes and arrows; in [Phase 2](02-models-and-migrations.md) we turn
these into real entity classes, use migrations to create the tables, then create rows, query with LINQ,
watch change tracking batch our edits, and wire up these relationships.

The win for this phase: you can connect, you've saved a row, the SQL log is on, and you hold the mental
model. That's the foundation everything else stands on.

## Recap

1. **EF Core is .NET's flagship ORM** — you describe tables as C# classes and it writes the SQL for CRUD,
   relationships, and migrations, so you skip the hand-written query boilerplate.
2. **The honest cost is invisible SQL.** The cure is `LogTo`: turn it on while learning so you see the exact
   statement behind every call.
3. **The mental model:** a `DbContext` is a change-tracking session, a `DbSet<T>` is a table, and LINQ
   becomes SQL — and you can always drop to raw SQL with `FromSql`/`ExecuteSql`.
4. **Install a provider** (`Microsoft.EntityFrameworkCore.Sqlite` here), define a `DbContext` subclass with
   `DbSet` properties, and point it at the database in `OnConfiguring` with `UseSqlite("Data Source=...")`.
5. **`Add` then `SaveChanges`:** `Add` only starts tracking; nothing hits the database until `SaveChanges`
   batches and runs the SQL. Keep the context **short-lived** — `using var ctx = new BlogContext();`.
6. In **ASP.NET Core** you register the context with `AddDbContext` and let DI hand one per request, instead
   of writing `OnConfiguring`.

## Quick check

Three questions on the framing that has to stick before Phase 2:

```quiz
[
  {
    "q": "In EF Core's mental model, what is a `DbContext`?",
    "choices": [
      "A change-tracking session with the database that exposes DbSets and pushes changes on SaveChanges",
      "A single row fetched from a table",
      "The SQLite file on disk",
      "A class that maps directly to exactly one table"
    ],
    "answer": 0,
    "explain": "A `DbContext` is your session with the database: it holds `DbSet<T>` properties (the tables), tracks the changes you make, and writes them all when you call `SaveChanges`. A class that maps to one table is an entity; a `DbSet<T>` represents the table."
  },
  {
    "q": "After `ctx.Blogs.Add(blog);`, when is the row actually written to the database?",
    "choices": [
      "When you call `ctx.SaveChanges()` — `Add` only starts tracking it",
      "Immediately, inside the `Add` call",
      "When the `DbContext` is garbage collected",
      "Only after you manually open a transaction"
    ],
    "answer": 0,
    "explain": "`Add` just tells the context to start tracking the new entity as something to insert. Nothing reaches the database until `SaveChanges`, which generates and runs the SQL (here an `INSERT`) in one batch."
  },
  {
    "q": "Why is `.LogTo(Console.WriteLine)` such a good habit while learning EF Core?",
    "choices": [
      "It prints the exact SQL behind every call, so the ORM stops being a black box",
      "It makes queries run faster by caching them",
      "It is required or EF Core refuses to connect",
      "It automatically rewrites slow queries for you"
    ],
    "answer": 0,
    "explain": "The honest cost of an ORM is that you stop seeing your SQL. `LogTo` prints every generated statement, so you immediately catch surprises — like one call firing several queries or a `SELECT` with no `WHERE`."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Entity Models & Migrations →](02-models-and-migrations.md)
