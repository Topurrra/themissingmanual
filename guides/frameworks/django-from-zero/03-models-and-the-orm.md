---
title: "Models & the ORM"
guide: "django-from-zero"
phase: 3
summary: "Define your data as Python classes, let migrations build the tables, and query the database in Python instead of SQL - Django's built-in ORM, the makemigrations/migrate loop, and the blog's Post and Comment models."
tags: [django, models, orm, migrations, queryset, fields, makemigrations]
difficulty: beginner
synonyms: ["django models", "django orm querying", "django migrations makemigrations migrate", "django model fields", "django queryset filter get", "django foreignkey relationship", "django model meta"]
updated: 2026-07-10
---

# Models & the ORM

So far the blog has had no real data - Phase 2 mapped URLs to views and returned hard-coded responses. Now we give it a memory. The question this phase answers is the one every web app eventually has to: *where does the data live, and how does my Python code talk to it?*

Here's the mental model to carry through everything below. Your database thinks in **tables** - rows and columns and foreign keys, numbers pointing at numbers. Your Python code thinks in **objects** - a `Post` with a `.title` and a `.body`, a `Comment` that *belongs to* a post. Those are two different shapes for the same information, and something has to translate between them. In Django, that something ships in the box: the **ORM**.

If you've read [What an ORM Is](/guides/hibernate-and-jpa-from-zero) for Java, this is the exact same idea - Hibernate for Java, Django's ORM for Python. And if "table," "row," and "foreign key" are fuzzy, [What a Database Actually Is](/guides/what-a-database-is) is the prerequisite mental model.

## Models = tables

📝 **A model is a Python class that maps to a database table.** You write a class that subclasses `models.Model`; Django treats that class as a table, each instance as a row, and each class attribute as a column. You never hand-write `CREATE TABLE` - you describe the *shape* in Python and Django builds the SQL.

The big relief for Python developers coming from other ecosystems: there's no separate ORM library to install and wire up. Java reaches for Hibernate; Node reaches for Prisma or TypeORM; Python web apps often reach for SQLAlchemy. Django's ORM is *built in* - one less decision, one less dependency.

Here are the blog's two models. They go in your app's `models.py`:

```python
from django.db import models


class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.CharField(max_length=80)
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
```

*What just happened:* you described two tables in Python. `Post` becomes a `post` table with columns `id` (Django adds an auto-incrementing primary key for free), `title`, `body`, and `created`. Each **field** is a class attribute whose *type* decides the column type: `CharField` is a short string (it needs `max_length` so the database knows the column width), `TextField` is unbounded long text, and `DateTimeField` stores a timestamp - `auto_now_add=True` means "stamp it once, when the row is first created." The `Comment.post` field is a `ForeignKey` pointing at `Post`: the "this comment *belongs to* that post" relationship, stored as a `post_id` column holding a number. More on `on_delete` and `related_name` shortly.

💡 The model is just a class. It doesn't touch the database when Python imports it - it's a *description*. Turning that description into an actual table is the next step, and it's deliberately a separate, explicit action.

## Migrations: version control for your schema

You've written a class that *describes* a table. The database doesn't have that table yet. **Migrations** are how the description becomes reality - and how it stays in sync every time you change a model later.

📝 **A migration is a file that records a change to your database schema.** You don't write it by hand. You run `makemigrations`, Django compares your models to the last known state, and it generates a Python file describing the difference ("create a `post` table with these columns"). Then `migrate` runs those files against the actual database.

It's a two-step rhythm, and the names tell you exactly what each does:

```bash
python manage.py makemigrations
python manage.py migrate
```

*What just happened:* `makemigrations` looked at your `models.py`, saw two brand-new models, and wrote a migration file (something like `blog/migrations/0001_initial.py`) capturing "create these two tables." Nothing has hit the database yet - this step only *plans* the change. Then `migrate` took that plan and executed it, running the actual `CREATE TABLE` SQL. Here's what the console shows:

```console
$ python manage.py makemigrations
Migrations for 'blog':
  blog/migrations/0001_initial.py
    + Create model Post
    + Create model Comment

$ python manage.py migrate
Operations to perform:
  Apply all migrations: admin, auth, blog, contenttypes, sessions
Running migrations:
  Applying blog.0001_initial... OK
```

*What just happened:* the first command reported the migration file it created and what's in it. The second applied it - and notice it also applied migrations for `admin`, `auth`, and friends. Those are Django's own built-in apps (you'll meet the admin next phase); they ship migrations too, and `migrate` brings the whole database up to date in one pass.

💡 **Migrations are version control for your database schema.** The migration files are committed to git alongside your code, so a teammate who pulls your branch runs `migrate` and gets the *exact same* tables - no "works on my machine" schema drift. They're reviewable in a pull request, repeatable on every environment, and record the full history of how your schema got where it is.

⚠️ **Every model change needs both steps.** Add a field, rename one, change `max_length` - the moment you touch `models.py`, the database is out of sync until you run `makemigrations` *and then* `migrate`. Forgetting `makemigrations` means the change is never even recorded; forgetting `migrate` means it's recorded but never applied. The classic confusing error - a column the database swears doesn't exist, even though it's right there in your model - is almost always a migration you forgot to apply.

## The ORM: querying in Python

The tables exist. Now the payoff - reading and writing data without writing SQL. The single best way to learn this is the **Django shell**, an interactive Python prompt with your whole project loaded:

```bash
python manage.py shell
```

Every model has an attribute called `objects` - its **manager** - and that's your entry point for talking to the table. Let's create some posts and read them back:

```python
>>> from blog.models import Post

>>> Post.objects.create(title="Hello world", body="My first post.")
<Post: Post object (1)>

>>> Post.objects.create(title="Django is great", body="The admin alone sells it.")
<Post: Post object (2)>

>>> Post.objects.all()
<QuerySet [<Post: Post object (1)>, <Post: Post object (2)>]>

>>> Post.objects.get(id=1)
<Post: Post object (1)>

>>> Post.objects.filter(title__contains="Django")
<QuerySet [<Post: Post object (2)>]>

>>> Post.objects.order_by("-created")
<QuerySet [<Post: Post object (2)>, <Post: Post object (1)>]>
```

*What just happened:* you ran five different database operations and never wrote a word of SQL. `objects.create(...)` inserted a new row and handed back the saved `Post` object. `objects.all()` fetched every row. `objects.get(id=1)` fetched exactly one row by its primary key (it raises an error if zero or more than one match - `get` is for "I expect exactly one"). `objects.filter(title__contains="Django")` returned every post whose title contains "Django" - that `__contains` is a *lookup*, the double-underscore syntax Django uses for "WHERE this column does that." `order_by("-created")` sorted newest-first (the leading `-` means descending). `<QuerySet [...]>` is just Django's name for "a collection of rows from a query."

💡 **You write Python; the ORM writes SQL.** `Post.objects.filter(title__contains="Django")` generated roughly:

```sql
SELECT id, title, body, created
FROM blog_post
WHERE title LIKE '%Django%';
```

*What just happened:* your Python lookup `title__contains="Django"` became a SQL `LIKE` clause, against the `blog_post` table (Django names tables `<app>_<model>` by default). This is the deal an ORM offers: you stay in Python, it produces and runs the SQL. The convenience is real - and like any ORM, it can quietly generate *wasteful* SQL if you're not paying attention. We meet that trap (the famous N+1 problem) head-on in [Phase 7](07-the-orm-deeper.md).

## Relationships: following the foreign key

The `ForeignKey` on `Comment` is what makes this a *relational* database and not two unrelated tables. It gives you navigation in **both directions** - and Django generates a tidy Python accessor for each.

Let's attach a comment to a post and then walk the relationship from both ends:

```python
>>> from blog.models import Post, Comment

>>> post = Post.objects.get(id=1)

>>> Comment.objects.create(post=post, author="Sam", body="Loved this!")
<Comment: Comment object (1)>

>>> # Forward: from a comment to its post
>>> comment = Comment.objects.get(id=1)
>>> comment.post
<Post: Post object (1)>
>>> comment.post.title
'Hello world'

>>> # Reverse: from a post to all its comments
>>> post.comments.all()
<QuerySet [<Comment: Comment object (1)>]>
```

*What just happened:* you created a comment by handing it a whole `Post` object (`post=post`) - Django stores the post's id in the `post_id` column for you. Then you walked the link two ways. **Forward** (the direction the `ForeignKey` points): `comment.post` follows the foreign key from the comment back to its single owning post, chainable straight on to `.post.title`. **Reverse** (against the arrow): `post.comments.all()` finds every comment whose `post_id` matches this post. That `comments` name is exactly the `related_name="comments"` we set on the field - without it, Django would default the reverse accessor to `post.comment_set.all()`.

And `on_delete=models.CASCADE`? Django answering a question the database insists on: *if this post is deleted, what happens to its comments?* `CASCADE` means "delete them too" - a post's comments shouldn't outlive the post. (Other options exist, like `PROTECT` to forbid the deletion, but `CASCADE` is the sensible default here.)

We're keeping relationship queries deliberately shallow here. The deeper material - how QuerySets are *lazy*, why looping over `post.comments` can secretly fire a query per row, and how to fix it - is all in [Phase 7](07-the-orm-deeper.md).

## `__str__`, Meta, and field options

Three finishing touches turn rough models into ones that are pleasant to work with - and that the rest of Django can present nicely.

First, `__str__`. Notice every object above printed as the unhelpful `<Post: Post object (1)>`. Add a `__str__` method and that changes everywhere:

```python
class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return self.title


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.CharField(max_length=80)
    body = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author} on {self.post.title}"
```

*What just happened:* `__str__` defines how an object turns into a readable string - now a post prints as `Hello world` instead of `Post object (1)`, in the shell, in error messages, and (crucially) in the admin you'll build next phase. The `class Meta` block holds model-level settings; `ordering = ["-created"]` makes *every* query for posts come back newest-first by default, so you don't have to remember `.order_by()` each time.

Now the field option that trips up nearly everyone: **`null` versus `blank`**. They sound identical and are not.

⚠️ **`null` is about the database; `blank` is about validation.**
- `null=True` lets the *database column* store `NULL` (no value at all). A schema decision.
- `blank=True` lets a *form* accept an empty value without complaining. A validation decision.

They operate in completely different layers. For a text field you'd usually leave both off (required) or set `blank=True` *without* `null=True` - Django stores "empty text" as an empty string `""`, not `NULL`, so adding `null=True` to a `CharField`/`TextField` just creates two different ways to say "empty." Reach for `null=True` mainly on non-text fields (numbers, dates, foreign keys) that genuinely have "no value." A field with `default=...` supplies a value when none is given; `unique=True` tells the database to reject duplicates.

💡 **The model is the single source of truth.** That one class definition drives *three* things at once: the **database schema** (via migrations, this phase), the **admin interface** ([Phase 4](04-the-django-admin.md) - which reads your fields and `__str__` to build a back-office for free), and **forms** ([Phase 6](06-forms-and-validation.md) - where `blank`, `max_length`, and field types become validation rules). Define your data well in `models.py` and Django propagates it everywhere.

## Recap

1. **A model is a Python class that maps to a table** - subclass `models.Model`, and each field attribute (`CharField`, `TextField`, `DateTimeField`, `ForeignKey`) becomes a column. Django's ORM is built in; no SQLAlchemy or separate library required.
2. **Migrations turn model changes into schema changes**: `makemigrations` writes a migration file describing the diff, `migrate` applies it to the database. They're version control for your schema - committed, reviewable, repeatable.
3. ⚠️ **Every model edit needs both `makemigrations` and `migrate`** - skip either and your code and database fall out of sync.
4. **The ORM lets you query in Python**: `objects.create/all/get/filter/order_by` via each model's `objects` manager. You write Python; Django writes and runs the SQL underneath.
5. **A `ForeignKey` gives two-way navigation**: forward with `comment.post`, reverse with `post.comments.all()` (the name set by `related_name`). `on_delete` decides what happens to children when the parent is deleted.
6. **`__str__`, `Meta`, and field options polish the model**: `__str__` for readable objects, `Meta.ordering` for default sort, and field options where `null` is a *database* concern and `blank` is a *forms* concern - different layers, not synonyms. The model is the single source of truth feeding the schema, the admin, and forms.

## Quick check

Three questions on the ideas that have to stick before the admin in Phase 4:

```quiz
[
  {
    "q": "You add a new field to your Post model. What must you do for the database to actually have that column?",
    "choices": [
      "Run `makemigrations` to record the change, then `migrate` to apply it to the database",
      "Nothing - Django updates the database automatically when it imports the model",
      "Hand-write an ALTER TABLE statement and run it in the SQL shell",
      "Only run `migrate`; `makemigrations` is just for brand-new projects"
    ],
    "answer": 0,
    "explain": "Touching models.py puts your code ahead of the schema. `makemigrations` generates a migration file describing the diff; `migrate` runs it against the database. You need both - forgetting either leaves code and database out of sync."
  },
  {
    "q": "Given `post = models.ForeignKey(Post, related_name=\"comments\", on_delete=models.CASCADE)` on Comment, how do you get all comments for a given post object?",
    "choices": [
      "post.comments.all()",
      "post.comment.all()",
      "Comment.objects.post(post)",
      "post.foreignkey('Comment')"
    ],
    "answer": 0,
    "explain": "The reverse accessor's name comes from related_name, so it's post.comments.all(). Without related_name, Django would default it to post.comment_set.all(). Forward navigation (comment to its post) is just comment.post."
  },
  {
    "q": "What is the difference between `null=True` and `blank=True` on a model field?",
    "choices": [
      "`null=True` lets the database column store NULL (a schema concern); `blank=True` lets a form accept an empty value (a validation concern)",
      "They are synonyms - both make the field optional in exactly the same way",
      "`null=True` is for text fields and `blank=True` is for number fields",
      "`blank=True` deletes the row when the field is empty; `null=True` keeps it"
    ],
    "answer": 0,
    "explain": "They operate in different layers. null is about whether the database column can hold NULL; blank is about whether a form will accept an empty value. They're independent, and for text fields you usually use blank without null to avoid two different ways of saying 'empty'."
  }
]
```

---

[← Phase 2: URLs & Views](02-urls-and-views.md) · [Guide overview](_guide.md) · [Phase 4: The Django Admin →](04-the-django-admin.md)
