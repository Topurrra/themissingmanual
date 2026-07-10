---
title: "Associations"
guide: "gorm-from-zero"
phase: 6
summary: "Wire tables together with GORM: belongs-to, has-many, has-one, and many-to-many. See the foreign keys AutoMigrate builds, create nested records, and manage relations with association mode."
tags: [gorm, go, associations, relationships, foreign-keys]
difficulty: advanced
synonyms: ["gorm associations", "gorm has many belongs to", "gorm has one", "gorm many2many", "gorm foreign key", "gorm association mode"]
updated: 2026-07-10
---

# Associations

So far every table in our blog has lived alone. A `User` is a `User`, a `Post` is a `Post`, and nothing
ties them together. Real data isn't like that — a post is written *by* a user, a comment belongs *to* a
post, a post is tagged *with* tags. This phase is where the blog stops being a pile of tables and
becomes a connected schema.

If the words "foreign key," "one-to-many," and "join table" feel hazy, pause and read
[Relationships & Keys](/guides/relationships-and-keys) first — this phase assumes you know what a
foreign key *is* and focuses on how GORM lets you express those relationships in Go.

## The mental model: an association is a foreign key plus a Go field that mirrors it

Here's the one idea that makes every relationship type below click. At the database level, a
relationship is always the same thing: **a foreign-key column on one table pointing at another table's
primary key.** Nothing exotic. The `posts` table has a `user_id` column; that column holds the `id` of
the user who wrote the post. That's the whole relationship, in SQL terms.

What GORM adds is a second view of that same fact, written in Go. You describe the relationship **twice**
in your structs:

- the **foreign-key field** (`UserID uint`) — the literal column that stores the link, and
- a **struct field of the related type** (`User User` or `Posts []Post`) — a Go-side handle that *mirrors*
  the link so you can walk it in code.

> 💡 GORM doesn't have a separate "define a relationship" function. It reads the **shape of your structs**
> — a `uint` field named `<Type>ID` next to a field of that type — and infers the relationship from it.
> The struct *is* the schema, exactly like Phase 2 promised. You're not configuring associations; you're
> drawing them with field names.

Hold that and the four relationship types stop being four things to memorize. They're four shapes of the
same foreign-key-plus-mirror idea.

## Belongs-to and has-many: User ↔ Post

The most common relationship in any app: one user writes many posts. This is **one relationship seen from
two ends.** From the post's side it's *belongs-to* (each post belongs to one user). From the user's side
it's *has-many* (each user has many posts). Same foreign key, two viewpoints.

```go
type User struct {
    gorm.Model
    Name  string `gorm:"size:100;not null"`
    Posts []Post // has many: one user, many posts
}

type Post struct {
    gorm.Model
    Title  string `gorm:"size:200;not null"`
    Body   string
    UserID uint // the foreign key — the actual column
    User   User // belongs to: the back-reference
}
```

*What just happened:* we wrote the same link from both directions. `Post.UserID` is the foreign-key
column — a plain `uint` that holds which user owns the row. `Post.User` is the belongs-to back-reference,
a Go field you can read to get the whole owner struct. And `User.Posts` is the has-many side, a slice that
will hold this user's posts. GORM connects all three by **naming convention**: it sees the `[]Post` slice
on `User`, looks on `Post` for a field named `UserID` (`<Owner>` + `ID`), and uses it as the FK. No tags
required — the names do the wiring.

When you run `AutoMigrate(&User{}, &Post{})`, GORM creates the column *and* the constraint:

```sql
CREATE TABLE `posts` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `created_at` datetime,
  `updated_at` datetime,
  `deleted_at` datetime,
  `title` varchar(200) NOT NULL,
  `body` text,
  `user_id` integer,
  CONSTRAINT `fk_users_posts` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
```

*What just happened:* the `user_id` column and the `fk_users_posts` foreign-key constraint both came
straight from your struct shape. AutoMigrate read `User.Posts` and `Post.UserID`, figured out the
direction, and emitted exactly the SQL you'd have written by hand. The relationship you "declared" in Go
is now a real, enforced FK in the database.

> 📝 GORM infers the FK as `<OwnerType>ID` — `UserID` here. If your column is named something else (a
> legacy `author_id`, say), you tell GORM with a tag: ``Posts []Post `gorm:"foreignKey:AuthorID"` `` and a
> matching `AuthorID uint` field. But when you follow the convention, you write zero tags.

## Has-one: User ↔ Profile

Has-one is has-many's quieter sibling: a user has **exactly one** profile, not a slice of them. The shape
is nearly identical — the only difference is that the parent holds a single struct instead of a slice.

```go
type User struct {
    gorm.Model
    Name    string `gorm:"size:100;not null"`
    Posts   []Post  // has many
    Profile Profile // has one
}

type Profile struct {
    gorm.Model
    UserID uint   // the foreign key, on the child as always
    Bio    string `gorm:"size:500"`
}
```

*What just happened:* `User.Profile` is a single `Profile` (not `[]Profile`), so GORM reads it as has-one.
The foreign key still lives on the *child* table — `Profile.UserID` — exactly like has-many. That's the
rule worth remembering: in both has-one and has-many, the FK sits on the "many"/owned side, pointing back
at the owner. The only thing that flips between them is whether the parent field is one struct or a slice.

## Many-to-many: Post ↔ Tag, through a join table

Tags break the pattern. A post can have many tags, and a tag can label many posts — so a single FK column
can't express it (where would you even put it?). This is what a **join table** is for: a separate little
table holding pairs of IDs, one row per "this post has this tag" fact.

GORM builds and manages that join table for you when you use the `many2many` tag:

```go
type Post struct {
    gorm.Model
    Title string `gorm:"size:200;not null"`
    Tags  []Tag  `gorm:"many2many:post_tags;"`
}

type Tag struct {
    gorm.Model
    Name  string `gorm:"size:50;uniqueIndex;not null"`
    Posts []Post `gorm:"many2many:post_tags;"` // optional: the other direction
}
```

*What just happened:* the `many2many:post_tags` tag tells GORM "the link between posts and tags lives in a
join table called `post_tags`." Neither struct gets a foreign-key field — there's nowhere to put it, which
is exactly why the join table exists. Putting the same tag on `Tag.Posts` lets you walk the relationship
from either side. AutoMigrate now creates a third table you never declared as a struct:

```sql
CREATE TABLE `post_tags` (
  `post_id` integer,
  `tag_id` integer,
  PRIMARY KEY (`post_id`,`tag_id`),
  CONSTRAINT `fk_post_tags_post` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`),
  CONSTRAINT `fk_post_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`)
);
```

*What just happened:* `post_tags` is the generated join table — two FK columns, `post_id` and `tag_id`,
with a composite primary key so the same pair can't be inserted twice. Each row means "post X is tagged
with tag Y." GORM created and wired it from one struct tag; you never wrote a `PostTag` struct at all.

## Creating with nested associations

Now the payoff. Because GORM understands these relationships, you can create a parent and its children in
**one call** — GORM inserts everything and fills in the foreign keys for you. This is on by default (GORM
calls it full-save-associations).

```go
user := User{
    Name: "Ada",
    Posts: []Post{
        {Title: "Hello, world"},
        {Title: "On engines"},
    },
}
db.Create(&user)
```

*What just happened:* one `db.Create` inserted three rows: the user, plus both posts. Crucially, GORM read
the new `user.ID` after inserting the user, then stamped it into each post's `user_id` before inserting
them — so the children come out already wired to their parent. You didn't set a single `UserID` by hand.
This is the everyday way to seed connected data.

Let's complete the blog with a `Comment`. A comment is the textbook double-belongs-to: it belongs to the
post it's on **and** the user who wrote it — so it carries two foreign keys.

```go
type Comment struct {
    gorm.Model
    Body   string `gorm:"size:1000;not null"`
    PostID uint   // belongs to Post
    UserID uint   // belongs to User
}
```

*What just happened:* `Comment` has two FK columns, `PostID` and `UserID`, because it sits at the meeting
point of two relationships. Each one follows the same `<Type>ID` convention you've seen all phase. With
`User`, `Post`, `Comment`, and `Tag` all related, the blog schema is finally whole.

## Association mode: managing relations after the fact

Creating everything at once is great for fresh data, but often you need to attach or detach relations on a
record that already exists — add a tag to a published post, swap a post's whole tag set, clear them all.
That's **association mode**: `db.Model(&record).Association("FieldName")` gives you a little handle with
verbs for managing one relationship.

```go
var post Post
db.First(&post, 1) // load post #1

goLang := Tag{Name: "golang"}
db.Model(&post).Association("Tags").Append(&goLang)  // add one tag

db.Model(&post).Association("Tags").Replace(&Tag{Name: "orm"}) // set tags to exactly this

count := db.Model(&post).Association("Tags").Count() // how many tags now?

db.Model(&post).Association("Tags").Clear() // remove all tag links (tags themselves survive)
```

*What just happened:* each verb manages the **link**, not the tag rows themselves. `Append` adds a row to
`post_tags`. `Replace` swaps the post's entire set of tag links for the ones you pass. `Count` returns how
many are currently linked. `Clear` deletes the post's rows from the join table but leaves the `tags` table
untouched — you're cutting the connections, not deleting the tags. (`Delete` removes specific links you
name.) Use association mode whenever you're editing relationships on records that are already in the DB.

> 💡 Want the database to clean up automatically when a parent is deleted? Add a cascade tag:
> ``Posts []Post `gorm:"constraint:OnDelete:CASCADE;"` ``. Then deleting a user lets the DB delete that
> user's posts for you, enforced at the FK level.

## ⚠️ Declaring a relationship is not the same as loading it

Here's the trap that bites everyone exactly once. You define `User.Posts`, you migrate, the FK exists —
and then you fetch a user and `user.Posts` is **empty**. Nothing's broken. GORM does not load associations
automatically when you read a record; it only loads the columns of the row itself.

```go
var user User
db.First(&user, 1)
fmt.Println(len(user.Posts)) // 0 — even though this user has posts!
```

*What just happened:* `db.First` ran one `SELECT` against the `users` table and filled in the user's own
fields. It did **not** go touch the `posts` table, so the `Posts` slice stays at its zero value: an empty
slice. The relationship is defined and real in the database — GORM just won't walk it unless you ask.

Asking is what **Preload** is for, and it's the entire subject of the next phase — along with the N+1
query explosion that ambushes people who try to load associations the naive way. For now, the takeaway is
the boundary: **defining an association sets up the wiring; loading it is a separate, deliberate step.**

## Recap

- An **association is a foreign key plus a Go field that mirrors it**. GORM reads your struct shape — a
  `<Type>ID` field next to a field of that type — and infers the relationship; you don't configure it
  separately.
- **Belongs-to / has-many** is one FK seen from two ends: the FK (`UserID`) and back-reference (`User`)
  live on the child; the parent holds a slice (`Posts []Post`). AutoMigrate builds the column and the FK
  constraint.
- **Has-one** is has-many with a single struct instead of a slice; the FK still sits on the child
  (`Profile.UserID`). **Many-to-many** uses a ``gorm:"many2many:post_tags;"`` tag, and AutoMigrate
  generates the join table for you.
- **`db.Create` with nested data** inserts parent and children in one call and fills in the foreign keys
  automatically. **Association mode** (`Append`/`Replace`/`Clear`/`Count`) manages links on records that
  already exist.
- **Defining a relationship does not load it.** Reading a record leaves its association slices empty until
  you Preload — that's [Phase 7](07-preloading-and-n-plus-1.md).

## Quick check

```quiz
[
  {
    "q": "In a belongs-to / has-many relationship between User and Post, where does the foreign-key column live?",
    "choices": ["On the users table, as post_id", "On the posts table, as user_id", "In a separate join table", "GORM stores it in memory only"],
    "answer": 1,
    "explain": "The FK sits on the child (the 'many' side). Post gets a user_id column pointing at users.id; the User.Posts slice is just the Go-side mirror of that link."
  },
  {
    "q": "You add `Tags []Tag `gorm:\"many2many:post_tags;\"`` to Post and run AutoMigrate. What does GORM create?",
    "choices": ["A tags_id column on the posts table", "Nothing until you also write a PostTag struct", "A post_tags join table with post_id and tag_id columns", "A JSON column holding the tag list"],
    "answer": 2,
    "explain": "Many-to-many can't be expressed with a single FK column, so GORM generates a join table (post_tags) holding pairs of post_id and tag_id — without you ever declaring it as a struct."
  },
  {
    "q": "You define User.Posts, then run db.First(&user, 1). Why is user.Posts empty even though the user has posts?",
    "choices": ["The migration failed silently", "Defining an association doesn't auto-load it — you must Preload", "First only ever returns one field", "The foreign key was never created"],
    "answer": 1,
    "explain": "GORM loads only the record's own columns, not its associations. The relationship is real in the DB; you have to ask for it explicitly with Preload (Phase 7)."
  }
]
```

---

[← Phase 5: Update & Delete](05-update-and-delete.md) · [Guide overview](_guide.md) · [Phase 7: Preloading & the N+1 Trap →](07-preloading-and-n-plus-1.md)
