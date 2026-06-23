---
title: "Entity Models & Migrations"
guide: "efcore-from-zero"
phase: 2
summary: "Define tables as plain C# classes that EF Core maps by convention, tune them with data annotations or the Fluent API, and evolve your schema safely with versioned dotnet ef migrations."
tags: [efcore, csharp, models, migrations, conventions]
difficulty: intermediate
synonyms: ["ef core entity", "ef core conventions", "ef core data annotations", "dotnet ef migrations add", "ef core database update", "ef core primary key convention"]
updated: 2026-06-23
---

# Entity Models & Migrations

Here's the mental model to carry through this whole phase: **a class is a table.** You write an ordinary C# class, EF Core looks at it, and it figures out what the table should look like — the columns, the types, the primary key — mostly without you saying a word. When you later change that class, you don't reach for a SQL editor. You generate a **migration**: a small, versioned record of "the schema went from *this* to *that*," which you commit alongside your code and apply to the database when you deploy.

So there are two halves to learn. First, how EF Core reads your classes (and how you nudge it when its guesses aren't quite right). Second, how migrations turn those classes into real, evolving database schema you can trust in production.

> 📝 In [Phase 1](01-what-efcore-is.md) you built a `DbContext` with `DbSet<T>` properties. Each `DbSet<Blog> Blogs` is one table — but EF Core needs the actual `Blog` *class* to know what goes in it. That class is what we're writing now.

## A class is a table

EF Core works from **conventions** — sensible defaults it applies automatically so you write less configuration. The big ones:

- A property named `Id` (or `<TypeName>Id`, like `BlogId`) becomes the **primary key**.
- Every public property with a getter and setter becomes a **column**.
- The column's SQL type is inferred from the C# type (`int` → integer, `string` → text, `DateTime` → timestamp, and so on).
- The **table name** comes from the `DbSet` property name on your context — so `DbSet<Blog> Blogs` produces a table called `Blogs`.

Let's give our blog a `Post` entity:

```csharp
public class Post
{
    public int Id { get; set; }
    [Required, MaxLength(200)]
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
}
```

*What just happened:* EF Core reads this class and concludes: a table with an `Id` column as the primary key (and, because it's an `int` named `Id`, an auto-incrementing one), a `Title` text column, and a `Content` text column. The `[Required, MaxLength(200)]` on `Title` is the one place we overrode a convention — more on that in a second. The `= ""` initializers aren't an EF thing; they just keep C#'s nullable-reference warnings quiet by giving the strings a non-null default.

And the matching `Blog`:

```csharp
public class Blog
{
    public int Id { get; set; }
    public string Url { get; set; } = "";
}
```

*What just happened:* Same story — `Id` is the key, `Url` is a column. No annotations here, so EF Core uses pure conventions: `Url` becomes a nullable-or-not text column with no length cap. We'll tighten that up next, because "no length cap" is rarely what you actually want in a database.

> 💡 Conventions are doing real work for you. You didn't declare a single column type, key, or constraint by hand — you described your data as C# types and EF Core inferred a reasonable schema. You only step in when a guess is wrong.

## Two ways to override: annotations vs the Fluent API

When the conventions aren't enough — you need a max length, a different column name, a column that *isn't* mapped at all — you have two tools.

**Data annotations** are attributes you put right on the property. They live with the model, which makes them easy to read:

| Annotation | What it does |
|---|---|
| `[Required]` | Column is `NOT NULL` |
| `[MaxLength(200)]` | Caps string/array length (e.g. `varchar(200)`) |
| `[Column("url")]` | Maps the property to a differently named column |
| `[Key]` | Marks the primary key explicitly (when convention can't guess) |
| `[NotMapped]` | Exclude this property — no column for it |

The **Fluent API** is the other option: you configure everything in code inside your `DbContext`, in an `OnModelCreating` override.

```csharp
public class BloggingContext : DbContext
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Blog>()
            .Property(x => x.Url)
            .IsRequired()
            .HasMaxLength(200);
    }
}
```

*What just happened:* We told EF Core that `Blog.Url` is required and capped at 200 characters — the same kind of rule `[Required, MaxLength(200)]` expresses, but written centrally instead of on the property. `ModelBuilder` is the configuration surface; `b.Entity<Blog>().Property(...)` drills down to one column and chains the rules onto it.

Why two systems? Annotations are concise and live next to the data, which is great for simple rules. But the Fluent API is the more powerful of the two — it can express things annotations can't (composite keys, relationships, indexes, default values, and much more), and it keeps your entity classes free of EF-specific attributes if you want them to stay plain. **If you ever configure the same thing both ways, the Fluent API wins.** That precedence is worth memorizing: a confusing "but I set `[MaxLength]`!" bug is almost always a Fluent API line quietly overriding it.

> ⚠️ Don't sprinkle both for the *same* property and hope for the best. Pick a default approach for your project (many teams lean Fluent API for anything non-trivial) and reserve mixing for deliberate overrides you actually understand.

## Migrations: versioning your schema

You've got classes. Now you need an actual database with actual tables — and, crucially, a way to *change* that schema later without losing data or guessing at hand-written `ALTER TABLE` statements. That's what migrations are.

First, install the design-time pieces. The `Design` package powers the tooling; the `dotnet-ef` global tool gives you the commands:

```bash
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet tool install --global dotnet-ef
```

Now create your first migration:

```bash
dotnet ef migrations add InitialCreate
```

*What just happened:* EF Core compared your current model (the `Blog` and `Post` classes plus any Fluent config) against the *last* migration — and since there isn't one yet, the "diff" is "create everything." It wrote a new C# migration class into a `Migrations/` folder. That class has two methods: `Up()` (apply the change) and `Down()` (undo it). Nothing has touched your database yet — a migration is just a *plan*.

Here's a peek at what that generated class looks like:

```csharp
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Blogs",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                Url = table.Column<string>(maxLength: 200, nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_Blogs", x => x.Id));
        // ... CreateTable for "Posts" follows ...
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Blogs");
        // ... DropTable for "Posts" ...
    }
}
```

*What just happened:* The migration describes your schema as code, not raw SQL — `Up()` creates the tables (notice `Url` came out as `maxLength: 200, nullable: false`, exactly the Fluent rule we set), and `Down()` drops them so the change is reversible. EF Core translates this to dialect-specific SQL at apply time, which is why the same migration can target SQLite, SQL Server, or Postgres.

Now apply it:

```bash
dotnet ef database update
```

*What just happened:* EF Core ran the `Up()` of every pending migration against your database — creating the `Blogs` and `Posts` tables for real. It also created a bookkeeping table (`__EFMigrationsHistory`) that records which migrations have been applied, so next time it only runs the new ones. Run `database update` again right now and nothing happens: there's nothing pending.

If you want to *see* the SQL without touching the database, `dotnet ef migrations script` prints it. Get in the habit of reading it — it's the same instinct from Phase 1 of watching the SQL EF Core generates.

## Migrations vs `EnsureCreated()` — don't mix them

There's a tempting shortcut you'll see in tutorials: `ctx.Database.EnsureCreated()`. It looks at your model and creates the schema in one shot, no migration files, no tooling.

```csharp
// Dev/prototyping only — NOT a migration.
ctx.Database.EnsureCreated();
```

*What just happened:* EF Core created the tables directly from your current model. Fast and convenient for a throwaway prototype or a test database. But notice what it *didn't* do: it created no migration, recorded nothing in the history table, and gave you no `Down()` to reverse anything.

> ⚠️ `EnsureCreated()` and migrations are two different worlds, and they don't cooperate. `EnsureCreated()` creates the schema **once** and has no concept of evolving it — there's no "add a column later." Worse, a database made by `EnsureCreated()` has no migrations history, so `database update` won't know where to start. **Pick one per database.** For anything real, that's migrations.

## A migration per change, committed and deployed

The workflow once you're rolling is rhythmic, and it's worth internalizing:

1. Change a model (add a property, a new entity, a constraint).
2. `dotnet ef migrations add DescribeTheChange` — generates the diff.
3. Review the generated `Up()`/`Down()`. Did it do what you expected?
4. Commit the migration files **with the code change** — they're part of your source history.
5. On deploy, run `dotnet ef database update` (or apply the migration as part of your release).

Each model change earns its own migration. That gives you a readable, reviewable timeline of how your schema evolved — and the ability to roll forward or back deliberately.

> 💡 Treat migration files like code, because they are. They get reviewed in pull requests, they live in version control, and the order they're applied in matters. We'll cover the *production* side — applying migrations safely on a live database, and handling concurrency — in [Phase 8: Transactions & Migrations in Production](08-transactions-and-migrations.md). For now, the habit to build is: model change → migration → commit.

## Recap

- **A class is a table.** EF Core reads your plain C# entity classes and maps them by **convention**: `Id`/`<Type>Id` becomes the primary key, public properties become columns, types are inferred, and the table name comes from the `DbSet` name.
- Override conventions with **data annotations** (`[Required]`, `[MaxLength]`, `[Column]`, `[Key]`, `[NotMapped]`) on the property, or with the **Fluent API** in `OnModelCreating`. The Fluent API is more powerful and **wins** when both configure the same thing.
- **Migrations** version your schema. Install `Microsoft.EntityFrameworkCore.Design` and the `dotnet-ef` tool, then `dotnet ef migrations add <Name>` generates a reversible `Up()`/`Down()` class from the diff, and `dotnet ef database update` applies pending migrations.
- A migration is a **plan**, not an action — nothing hits the database until `database update`. EF Core tracks applied migrations in `__EFMigrationsHistory`.
- `EnsureCreated()` is a **dev-only** shortcut that creates schema once with no migration history — never mix it with migrations on the same database.
- Make **one migration per model change**, review it, commit it with the code, and apply it on deploy.

## Quick check

```quiz
[
  {
    "q": "You have a Blog class with an int property named Id and a public string Url. With pure EF Core conventions, what schema does EF infer?",
    "choices": ["No table at all until you add [Table] and [Key] attributes", "A Blogs table with Id as the primary key and Url as a column", "A Blog table with no primary key", "A table where only Url is mapped, because Id is reserved"],
    "answer": 1,
    "explain": "Conventions: Id becomes the primary key, public properties become columns, and the table name comes from the DbSet name (Blogs)."
  },
  {
    "q": "A property has [MaxLength(50)] in an annotation, but OnModelCreating also calls HasMaxLength(200) for it. What max length does the column get?",
    "choices": ["50, annotations take priority", "200, the Fluent API wins", "It throws an error for conflicting config", "The smaller of the two, 50"],
    "answer": 1,
    "explain": "When both configure the same thing, the Fluent API wins. That precedence is a common source of 'but I set the annotation!' confusion."
  },
  {
    "q": "What does `dotnet ef migrations add InitialCreate` do?",
    "choices": ["Immediately creates the tables in the database", "Generates a versioned migration class with Up/Down from the model diff, without touching the database", "Deletes and recreates the database from scratch", "Runs EnsureCreated() for you"],
    "answer": 1,
    "explain": "migrations add only generates the migration (a plan). Nothing reaches the database until you run dotnet ef database update."
  }
]
```

---

[← Phase 1: What EF Core Is & the DbContext](01-what-efcore-is.md) · [Guide overview](_guide.md) · [Phase 3: Create & Read →](03-create-and-read.md)