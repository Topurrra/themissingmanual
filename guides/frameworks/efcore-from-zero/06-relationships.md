---
title: "Relationships"
guide: "efcore-from-zero"
phase: 6
summary: "Model relationships in EF Core as foreign keys plus navigation properties: one-to-many, one-to-one, many-to-many with auto join tables, the Fluent API for control, and creating nested graphs."
tags: [efcore, csharp, relationships, navigation-properties, foreign-keys]
difficulty: advanced
synonyms: ["ef core relationships", "ef core navigation properties", "ef core one to many", "ef core many to many", "ef core foreign key convention", "ef core fluent api relationships"]
updated: 2026-07-10
---

# Relationships

The mental model for this phase: **a relationship is a foreign key plus navigation properties.** That's it. The database side is the same boring thing it's always been — a column in one table that points at the primary key of another. EF Core's contribution is the *navigation property*: a C# reference (or list) that lets you walk from one object to its related objects without writing the join yourself. EF reads the **shapes** of your classes — a `List<Post>` here, a `Blog` reference there, a `BlogId` int — and infers the foreign key and the relationship from them.

If the underlying concepts feel shaky — what a foreign key *is*, why a join table exists for many-to-many — read [Relationships & Keys](/guides/relationships-and-keys) first. This phase assumes you know the database side and focuses on how EF Core projects it onto C# classes.

> 📝 We've been building a **blog** schema: `Blog`, `Post`, and now we'll add `Tag`. The relationships are the natural ones — a blog has many posts, and posts and tags belong to each other in a many-to-many. By the end you'll be able to read a pair of entity classes and predict exactly what foreign key EF will create.

## One-to-many: the FK convention

The bread-and-butter relationship. One blog, many posts. You express it with **two navigation properties and one foreign key**, and EF Core wires the rest by convention.

```csharp
public class Blog
{
    public int Id { get; set; }
    public string Url { get; set; } = "";
    public List<Post> Posts { get; set; } = new();   // one-to-many: a blog has many posts
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public int BlogId { get; set; }                   // foreign key (convention: <Nav>Id)
    public Blog Blog { get; set; } = null!;           // inverse navigation
}
```

*What just happened:* EF Core saw a collection navigation (`Blog.Posts`) and a matching reference navigation on the other side (`Post.Blog`), and concluded these are *the same relationship viewed from both ends*. Then it spotted `Post.BlogId` — an `int` named `<NavigationName>Id` — and recognized it as the foreign key by convention. The `= null!` on `Post.Blog` tells the C# compiler "trust me, this won't be null at runtime" so the nullable-reference warning goes away (EF populates it when you load the relationship).

When you run `dotnet ef migrations add AddPostBlogRelationship`, the generated migration creates the `BlogId` column **and an index on it** — relational databases index foreign keys because you almost always filter and join on them.

```sql
-- What the migration produces (SQLite dialect)
ALTER TABLE "Posts" ADD "BlogId" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "IX_Posts_BlogId" ON "Posts" ("BlogId");
-- plus a FOREIGN KEY constraint linking Posts.BlogId -> Blogs.Id
```

*What just happened:* the migration added the FK column, created the index EF generates automatically for it, and declared the foreign-key constraint so the database itself enforces that every `Post.BlogId` points at a real `Blog`. Two navigation properties and one `int` became a proper, indexed, constrained relationship.

> 💡 The convention `<NavigationName>Id` is why `BlogId` works without configuration. Named `OwnerId` instead, EF wouldn't recognize it as the FK for the `Blog` navigation — you'd point EF at it with the Fluent API (coming up). Match the convention and you write zero config.

## One-to-one and many-to-many

**One-to-one** is the same idea with a *single reference* on each side instead of a collection. Think a `Blog` and its `BlogHeader`:

```csharp
public class Blog
{
    public int Id { get; set; }
    public BlogHeader Header { get; set; } = null!;   // reference, not a list
}

public class BlogHeader
{
    public int Id { get; set; }
    public int BlogId { get; set; }                   // FK lives on the dependent side
    public Blog Blog { get; set; } = null!;
}
```

*What just happened:* because both sides hold a single reference (no `List<>`), EF infers one-to-one. The foreign key goes on the **dependent** side — the entity that can't exist without the other (`BlogHeader` needs a `Blog`). EF often can't guess which side is dependent here, so one-to-one is the relationship most likely to need a Fluent API hint.

**Many-to-many** is where EF Core 5+ earns its keep. A post has many tags; a tag belongs to many posts. Put a collection on *each* side — these are called **skip navigations** — and EF creates the join table for you:

```csharp
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public List<Tag> Tags { get; set; } = new();
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Post> Posts { get; set; } = new();
}
// EF creates a PostTag join table; add an explicit join entity only if it needs extra columns.
```

*What just happened:* EF saw a collection on both ends with no foreign key on either entity, and recognized a many-to-many. It silently created a hidden join table (`PostTag`) with two FK columns — `PostsId` and `TagsId` — to record which posts wear which tags. You never declared that table; it's invisible in your C# model, and you navigate straight from `post.Tags` to `tag.Posts` as if the join didn't exist — the "skip" in skip navigation.

> ⚠️ The auto join table works only when the join holds *nothing but the two foreign keys*. The moment you need an extra column on the relationship itself — say, `AddedDate` recording when a tag was applied — define an **explicit join entity** (a `PostTag` class with `PostId`, `TagId`, and `AddedDate`) and map two one-to-many relationships through it. Reach for that only when the relationship genuinely carries data of its own.

## The Fluent API: taking control

Conventions handle the common cases. When they can't guess — a non-conventional FK name, a one-to-one's dependent side, a specific delete behavior — you configure the relationship explicitly in `OnModelCreating`. The vocabulary reads like a sentence:

```csharp
protected override void OnModelCreating(ModelBuilder b)
{
    b.Entity<Post>()
        .HasOne(p => p.Blog)          // a Post has one Blog
        .WithMany(bl => bl.Posts)     // a Blog has many Posts
        .HasForeignKey(p => p.BlogId) // the FK is Post.BlogId
        .OnDelete(DeleteBehavior.Cascade); // delete a Blog -> delete its Posts
}
```

*What just happened:* we spelled out the exact relationship EF had already inferred from the class shapes — `HasOne`/`WithMany` name both ends, `HasForeignKey` pins down which property is the FK, and `OnDelete` declares what happens to posts when their blog is deleted. With a conventional FK name like `BlogId` you don't *need* this — write it when conventions fall short, or when you want delete behavior explicit and reviewed rather than defaulted.

**Required vs optional** is controlled by whether the FK can be null:

```csharp
public int BlogId { get; set; }    // non-nullable FK = REQUIRED: a Post must have a Blog
public int? BlogId { get; set; }   // nullable FK = OPTIONAL: a Post may have no Blog
```

*What just happened:* a non-nullable `int BlogId` means the column is `NOT NULL` and every post is required to belong to a blog — and deleting a blog cascades to its posts by default. Making it `int?` flips the relationship to optional: a post can exist with `BlogId = NULL`, and the default delete behavior changes to setting that FK to null rather than deleting the post. The nullability of one property quietly decides both the constraint and the cascade rule.

> 💡 You don't have to choose Fluent-or-nothing. Let conventions handle the 90% they cover for free, and add a Fluent API line *only* for the specific thing a convention got wrong. Every line you add is a line a reviewer has to understand — add them for a reason.

## Creating with nested relations

Where navigation properties pay off: you don't insert a blog, read back its id, then insert posts with that id by hand. You build the **object graph** and save it once.

```csharp
var blog = new Blog
{
    Url = "https://example.com",
    Posts =
    {
        new Post { Title = "Hello, world" },
        new Post { Title = "Second post" }
    }
};

ctx.Blogs.Add(blog);
ctx.SaveChanges();
```

*What just happened:* you added one `Blog` whose `Posts` collection already held two `Post` objects with no `BlogId` set. On `SaveChanges`, EF inserted the blog first, got its generated `Id` back, then inserted both posts with their `BlogId` filled in to match — all in one transaction. You never touched a foreign key value; EF read it off the navigation. (Many-to-many works the same way: assign `post.Tags = new() { tag1, tag2 }` and EF writes the join rows for you.)

> ⚠️ Defining a navigation property does **not** mean it gets loaded when you read. Query `ctx.Blogs.First()` and `blog.Posts` will be empty — not because the blog has no posts, but because you didn't ask EF to fetch them. Loading related data on read (`Include`, lazy loading, and the N+1 query trap that catches everyone) is the subject of [Phase 7](07-loading-and-n-plus-1.md). For now: a navigation describes the relationship; it doesn't auto-populate.

## Recap

- **A relationship is a foreign key plus navigation properties.** EF Core infers it from class shapes — a collection navigation, a reference navigation, and an FK property — not from configuration.
- **One-to-many:** a `List<Post>` on the parent, a `Blog` reference and a `BlogId` on the child. The FK follows the `<NavigationName>Id` convention, and the migration creates the column *and* an index on it.
- **One-to-one** uses a single reference on each side with the FK on the dependent side; **many-to-many** uses a collection on each side (skip navigations) and EF auto-creates a hidden join table — add an explicit join entity only when the relationship needs extra columns.
- The **Fluent API** (`HasOne`/`WithMany`/`HasForeignKey`/`OnDelete`) takes control when conventions can't guess. A **non-nullable FK is a required** relationship; a **nullable FK (`int?`) is optional**, which also changes the default delete behavior.
- **Create graphs in one shot:** build the object tree, `Add` the root, `SaveChanges`. EF inserts in dependency order and fills the foreign keys for you.
- Defining a navigation does **not** load it on read — that's [Phase 7](07-loading-and-n-plus-1.md).

## Quick check

```quiz
[
  {
    "q": "In the blog schema, Post has `public int BlogId { get; set; }` and `public Blog Blog { get; set; }`, while Blog has `public List<Post> Posts { get; set; }`. What does EF Core infer?",
    "choices": ["Nothing until you add Fluent API config", "A one-to-many relationship with BlogId as the foreign key, by convention", "A many-to-many relationship needing a join table", "A one-to-one relationship between Blog and Post"],
    "answer": 1,
    "explain": "A collection navigation (Blog.Posts) plus a reference navigation (Post.Blog) plus an FK named <Nav>Id (BlogId) is the convention for one-to-many. No configuration needed."
  },
  {
    "q": "You give Post a `List<Tag> Tags` and Tag a `List<Post> Posts`, with no FK property on either. What does EF Core do in EF Core 5+?",
    "choices": ["Throws an error because there's no foreign key", "Creates a join table automatically and lets you navigate post.Tags directly", "Requires you to write an explicit PostTag join entity first", "Treats it as two unrelated one-to-many relationships"],
    "answer": 1,
    "explain": "A collection on both sides with no FK is a many-to-many. EF creates a hidden join table automatically; you only write an explicit join entity when it needs extra columns."
  },
  {
    "q": "You change a Post's foreign key from `public int BlogId` to `public int? BlogId`. What does that change?",
    "choices": ["Nothing — nullability of the FK is ignored by EF", "It makes the relationship optional: a Post can have no Blog, and the default delete behavior changes", "It deletes the relationship entirely", "It forces you to use the Fluent API to keep it working"],
    "answer": 1,
    "explain": "A non-nullable FK = required relationship; a nullable FK (int?) = optional. The nullability also changes the default on-delete behavior from cascade to setting the FK null."
  }
]
```

---

[← Phase 5: Change Tracking & SaveChanges](05-change-tracking.md) · [Guide overview](_guide.md) · [Phase 7: Loading Strategies & the N+1 Trap →](07-loading-and-n-plus-1.md)