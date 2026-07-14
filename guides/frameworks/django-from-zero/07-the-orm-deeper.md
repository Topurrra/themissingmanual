---
title: "The ORM, Deeper"
guide: "django-from-zero"
phase: 7
summary: "QuerySets are lazy and chainable, field lookups and Q/F give you real query power, and the N+1 trap quietly fires a query per row - until select_related and prefetch_related collapse it."
tags: [django, orm, queryset, n-plus-one, select-related, prefetch-related, aggregation, lazy-evaluation]
difficulty: advanced
synonyms: ["django queryset lazy", "django select_related prefetch_related", "django n+1 query problem", "django orm filter chaining", "django aggregation annotate", "django q objects f expressions", "django orm performance"]
updated: 2026-07-10
---

# The ORM, Deeper

Phase 3 gave you the ORM's friendly face: `Post.objects.filter(...)`, `post.comments.all()`, query in Python and never touch SQL. That face is accurate, but it's only half the story. The other half is what happens *underneath* - when the SQL actually runs, how many queries you fire without realizing, and why the same blog loop that's instant on your laptop crawls in production.

Here's the mental model to carry through this whole phase. **A QuerySet is not data - it's a recipe for a query.** It describes *what you would fetch if someone asked*, and it sits there, costing nothing, until something forces it to run. That single fact explains chaining, the surprising moments when the database suddenly lights up, and the most expensive beginner mistake in any ORM: the N+1 problem.

If you've read [Lazy vs Eager Fetching & the N+1 Problem](/guides/hibernate-and-jpa-from-zero) for Java, you already know the punchline - N+1 is not a Django bug or a Hibernate bug, it's a trap *every* ORM sets the same way. This phase is the Python telling of that same story.

## QuerySets are lazy

📝 **A QuerySet doesn't touch the database when you build it. It runs only when you *consume* it** - iterate it in a `for` loop, slice it, call `list()` on it, or print it in the shell. Until then, you're holding a description, not rows.

That means you can stack `.filter()`, `.exclude()`, and `.order_by()` as much as you like, and Django builds *one* query out of the whole chain, deferring the actual database hit to the moment you read the results:

```python
>>> from blog.models import Post

>>> qs = Post.objects.filter(body__icontains="django")   # no query yet
>>> qs = qs.exclude(title__startswith="Draft")           # still no query
>>> qs = qs.order_by("-created")                          # STILL no query

>>> for post in qs:        # ← the database is hit RIGHT HERE
...     print(post.title)
Django is great
Hello world
```

*What just happened:* the first three lines look like they're doing work, but not one of them talked to the database. Each call returns a *new* QuerySet that remembers "filter by this, then exclude that, then sort." Django only assembles and runs the SQL when the `for` loop asks for the first row, and because the whole chain collapses into a single query, those three operations cost exactly one round trip - not three. The chaining is free; the *consumption* is what costs.

Here's the single query that chain produces:

```sql
SELECT id, title, body, created
FROM blog_post
WHERE body LIKE '%django%'
  AND NOT (title LIKE 'Draft%')
ORDER BY created DESC;
```

*What just happened:* `filter` became a `WHERE`, `exclude` became `AND NOT (...)`, and `order_by("-created")` became `ORDER BY created DESC` (the leading `-` is descending). Three Python method calls, one SQL statement. The ORM folded your recipe into a single trip to the database.

⚠️ **This laziness is a gift and a landmine.** The gift: you can pass QuerySets around, layer filters in different functions, and pay for exactly one query at the end. The landmine: because the query is invisible until consumed, it's genuinely easy to *accidentally* trigger many of them without noticing - precisely how the N+1 problem sneaks in. Hold onto "consuming a QuerySet runs a query"; in a few sections it's going to bite.

💡 One consequence worth knowing now: each time you consume a *fresh* QuerySet, it re-runs the query. `list(qs)` twice is two trips. If you need the results more than once, evaluate it once (`posts = list(qs)`) and reuse the list. Django caches results *within* a single QuerySet object once evaluated, but a brand-new `.filter(...)` chain is a brand-new query.

## Filtering with real power

The `__contains` lookup from Phase 3 was a taste. Django's **field lookups** are a small language for "WHERE this column does that," and three tools cover almost everything you'll reach for.

**Field lookups** are the double-underscore suffixes on a field name:

```python
>>> Post.objects.filter(title__icontains="django")     # case-insensitive contains
>>> Post.objects.filter(created__year=2026)            # rows created in 2026
>>> Post.objects.filter(created__gte="2026-01-01")     # created on or after that date
```

*What just happened:* `title__icontains` is case-insensitive `LIKE`; `created__year=2026` digs the year out of a date column; `created__gte` is `>=`. The pattern is always `field__lookup=value`. There are dozens - `__lt`, `__lte`, `__gt`, `__in`, `__isnull`, `__startswith` - but they all read the same way. That `created__gte` becomes:

```sql
SELECT id, title, body, created FROM blog_post WHERE created >= '2026-01-01';
```

But plain `.filter()` arguments are always joined with `AND`. The moment you need **OR**, or anything that doesn't fit "column = value," you reach for a **`Q` object**:

```python
>>> from django.db.models import Q

>>> Post.objects.filter(Q(title__icontains="django") | Q(body__icontains="django"))
```

*What just happened:* `Q` wraps a condition into something you can combine with `|` (OR) and `&` (AND), and negate with `~`. This finds posts mentioning "django" in *either* the title *or* the body - impossible with plain keyword arguments, which only AND together.

```sql
SELECT id, title, body, created FROM blog_post
WHERE title LIKE '%django%' OR body LIKE '%django%';
```

The third tool is the **`F` expression**, for when the value you're comparing against (or assigning) is *another column*, not a constant:

```python
>>> from django.db.models import F

>>> # atomic update: bump every post's view_count by 1, in the database
>>> Post.objects.update(view_count=F("view_count") + 1)
```

*What just happened:* `F("view_count")` means "the current value of this column, in the database, right now." So `view_count=F("view_count") + 1` becomes a single `UPDATE blog_post SET view_count = view_count + 1` - the increment happens *inside* the database, atomically, in one statement. ⚠️ The naive alternative - read the value into Python, add one, save it back - has a race: two requests both read `5`, both write `6`, and you've lost an increment. `F` sidesteps that by never bringing the number into Python. (`F` also works in filters: `Comment.objects.filter(created__gt=F("post__created"))` finds comments made after their post existed.)

## Spanning relationships in queries

Phase 3 walked the foreign key in Python (`comment.post`, `post.comments.all()`). The ORM lets you walk it *inside a filter* too, with the same double-underscore syntax - `field__relatedfield`:

```python
>>> # comments on a specific post, found without first fetching the post
>>> Comment.objects.filter(post__title="Hello world")

>>> # posts that have at least one comment by "Sam"
>>> Post.objects.filter(comments__author="Sam").distinct()
```

*What just happened:* `post__title` reaches *across* the `ForeignKey` from `Comment` to `Post` and filters on the post's title - Django turns that into a SQL `JOIN`. The second query goes the *reverse* direction: from `Post`, through the `comments` relation, to each comment's author, finding posts Sam commented on. (`.distinct()` because a post with three Sam-comments would otherwise appear three times.) Here's the first one's SQL:

```sql
SELECT c.id, c.author, c.body, c.created, c.post_id
FROM blog_comment c
INNER JOIN blog_post p ON c.post_id = p.id
WHERE p.title = 'Hello world';
```

*What just happened:* one query, one join, the filter applied on the joined table. Keep that join in mind, because the next section is about what happens when you *don't* let Django write it and walk the relationship in a Python loop instead.

## The N+1 problem (the main event)

This is the one. The performance bug that reads like completely normal code, passes every test on your three-row dev database, and then falls over the day production has real data. Watch closely.

You want to list every post with how many comments it has. The obvious loop:

```python
posts = Post.objects.all()                 # query #1: load the posts

for post in posts:
    print(post.title, post.comments.count())   # ← a NEW query every iteration
```

*What just happened:* line one runs **one** query to load all the posts. Then, each time the loop calls `post.comments.count()`, that's a *fresh* QuerySet on the reverse relation - and remember, **consuming a QuerySet runs a query.** So every single post fires its own `SELECT`. Here's the SQL flood with, say, 100 posts:

```sql
SELECT id, title, body, created FROM blog_post;                          -- the "1"

SELECT COUNT(*) FROM blog_comment WHERE post_id = 1;                     -- the "N" begins...
SELECT COUNT(*) FROM blog_comment WHERE post_id = 2;
SELECT COUNT(*) FROM blog_comment WHERE post_id = 3;
-- ...one more query for every single post...
SELECT COUNT(*) FROM blog_comment WHERE post_id = 99;
SELECT COUNT(*) FROM blog_comment WHERE post_id = 100;
```

*What just happened:* **1 query for the posts, then N more - one per post - for the comments.** That's `1 + N` queries. 100 posts = **101 queries**. A thousand posts = 1001. Each is a separate round trip: network hop, parse, plan, execute, return. Individually quick; multiplied by N, a stampede. This is the **N+1 problem**.

⚠️ The cruelty is that it's *invisible in the code*. The loop reads like a normal loop. It's instant with three posts in your test DB. Then it meets 5,000 posts in production and the page times out - nobody changed a line. The query count grows with your *data*, not your *code*, so it slides through code review and tests you didn't write. The exact same trap exists in Hibernate, SQLAlchemy, ActiveRecord, every ORM - see [the Java telling](/guides/hibernate-and-jpa-from-zero). You only catch it by *watching the query count*.

Django gives you two cures, and which one you use depends on the *direction* of the relationship.

**`select_related` - for forward `ForeignKey` / `OneToOne` (a JOIN).** Use it when you're going *to* the "one" side - `comment.post`:

```python
# BAD: 1 query for comments + 1 per comment for its post = N+1
for comment in Comment.objects.all():
    print(comment.post.title)        # comment.post hits the DB each loop

# GOOD: one query, the post JOINed in
for comment in Comment.objects.select_related("post"):
    print(comment.post.title)        # post already loaded - no extra query
```

*What just happened:* `select_related("post")` tells Django to `JOIN` the `post` table into the *same* query, so each comment arrives with its post already attached. The flood of per-comment `SELECT`s collapses into one statement:

```sql
SELECT c.id, c.author, c.body, c.post_id,
       p.id, p.title, p.body, p.created
FROM blog_comment c
INNER JOIN blog_post p ON c.post_id = p.id;
```

`select_related` works for following a foreign key *forward* (many-to-one) or a one-to-one, because a JOIN can pull the single related row in cleanly.

**`prefetch_related` - for reverse / many relations (a second query, joined in Python).** Use it when you're going *to* the "many" side - `post.comments.all()`:

```python
# BAD: 1 query for posts + 1 per post for its comments = N+1
for post in Post.objects.all():
    print(post.title, [c.author for c in post.comments.all()])

# GOOD: 2 queries total, no matter how many posts
for post in Post.objects.prefetch_related("comments"):
    print(post.title, [c.author for c in post.comments.all()])
```

*What just happened:* `prefetch_related("comments")` can't use a JOIN (joining a one-to-many would multiply rows wastefully), so it runs **one** query for the posts, then **one** more query that grabs *all* the comments for *all* those posts in a single `IN`, and stitches them onto the right posts in Python:

```sql
SELECT id, title, body, created FROM blog_post;
SELECT id, author, body, post_id FROM blog_comment WHERE post_id IN (1, 2, 3, ..., 100);
```

*What just happened:* **two queries, total - regardless of whether you have 100 posts or 100,000.** The `post.comments.all()` inside the loop no longer hits the database; it reads from the prefetched cache Django filled. 101 queries became 2.

💡 The rule that sticks: **`select_related` for the "one" side (it JOINs), `prefetch_related` for the "many" side (it does a second `IN` query).** Reach for whichever matches the direction you're traversing - covered further in [Why Is My Query Slow?](/guides/why-is-my-query-slow).

## Aggregation, annotation, and seeing the SQL

You've been counting comments the slow way. The ORM can push that counting *into the database*, where it belongs.

For a **single summary number** across the whole table, use `aggregate`:

```python
>>> from django.db.models import Count, Avg

>>> Post.objects.count()                        # how many posts? -> 100
>>> Comment.objects.aggregate(total=Count("id"))   # -> {'total': 540}
```

*What just happened:* `.count()` is `SELECT COUNT(*)` - one number, one query, far cheaper than `len(Post.objects.all())` (which pulls every row into Python just to count them). `aggregate(...)` collapses a whole QuerySet into a dict of computed values - `Count`, `Avg`, `Sum`, `Min`, `Max` - all computed by the database, not in Python.

For a **per-row** computed value - "how many comments does *each* post have" - use `annotate`. This is the proper, one-query fix for the N+1 counting loop from earlier:

```python
>>> from django.db.models import Count

>>> posts = Post.objects.annotate(num_comments=Count("comments"))
>>> for post in posts:
...     print(post.title, post.num_comments)   # no extra query - it's already on the row
```

*What just happened:* `annotate(num_comments=Count("comments"))` attaches a *new, computed attribute* to every post in the QuerySet, calculated by the database with a `GROUP BY`. Each `post.num_comments` is already there. The whole listing is **one** query:

```sql
SELECT p.id, p.title, p.body, p.created, COUNT(c.id) AS num_comments
FROM blog_post p
LEFT OUTER JOIN blog_comment c ON c.post_id = p.id
GROUP BY p.id;
```

*What just happened:* the database did all the counting in a single `GROUP BY` and handed back posts with their counts baked in - same result as the 101-query loop we started with, 1 query instead of 101. `aggregate` is the table-wide total; `annotate` is the per-row value.

💡 **The #1 Django performance skill is counting your queries.** N+1 doesn't announce itself, so make the SQL visible while you develop:

```python
>>> # see the exact SQL a QuerySet will run, without running it:
>>> print(Post.objects.filter(title__icontains="django").query)
SELECT "blog_post"."id", "blog_post"."title", ... WHERE ... LIKE %django%
```

*What just happened:* `str(queryset.query)` shows you the SQL Django *would* emit - invaluable for "wait, why is this slow." Beyond that, install **django-debug-toolbar** (it shows a per-request query count and flags duplicates right in the browser), or turn on SQL logging in settings. If one page action fires dozens of near-identical `SELECT`s, you've found an N+1.

💡 The plain summary of this whole phase: **the ORM is wonderfully convenient, and that convenience is exactly what hides the cost.** Every QuerySet is real SQL underneath. You don't have to write that SQL - but you do have to know it's there, and count it.

## Recap

1. **QuerySets are lazy.** Building and chaining `.filter().exclude().order_by()` costs nothing; the database is hit only when you *consume* the QuerySet (iterate, slice, `list()`). The whole chain collapses into one query.
2. **Filtering has real power**: field lookups (`title__icontains`, `created__year`, `__gte`) for "column does that," `Q` objects for OR/complex/negated conditions, and `F` expressions for column-to-column comparisons and atomic in-database updates.
3. **You can span relationships inside a filter** with `field__relatedfield` (`Comment.objects.filter(post__title=...)`) - Django writes the JOIN for you.
4. ⚠️ **The N+1 problem**: a loop that touches a related object per row (`post.comments...`) fires 1 query for the parents + N for the children = `1 + N`. 100 posts → 101 queries. It's invisible in code and scales with your data, not your logic - the same trap in [every ORM](/guides/hibernate-and-jpa-from-zero).
5. **The fixes**: `select_related` for forward FK / one-to-one (does a JOIN), `prefetch_related` for reverse / many relations (a second `IN` query joined in Python). One side JOINs, the many side prefetches.
6. **Aggregation & seeing the SQL**: `.count()` and `.aggregate(Count/Avg/Sum)` for table-wide totals, `.annotate(Count("comments"))` for per-row computed values. 💡 The #1 perf skill is *counting queries* - use `str(qs.query)`, django-debug-toolbar, or SQL logging.

## Quick check

Three questions on the ideas that separate "the ORM works" from "the ORM is fast":

```quiz
[
  {
    "q": "You write `qs = Post.objects.filter(body__icontains=\"django\").exclude(title__startswith=\"Draft\").order_by(\"-created\")` and then do nothing else. How many database queries have run so far?",
    "choices": [
      "Zero - a QuerySet is lazy; nothing hits the database until you consume it (iterate, slice, or list() it)",
      "Three - one for each of filter, exclude, and order_by",
      "One - the query runs immediately when you call filter",
      "Two - filter and exclude each run, but order_by is free"
    ],
    "answer": 0,
    "explain": "QuerySets are lazy. Chaining filter/exclude/order_by just builds up a recipe; each call returns a new QuerySet without touching the database. The single combined query runs only when you consume it - iterate it in a loop, slice it, or call list(). Building the chain costs nothing."
  },
  {
    "q": "You loop over `Post.objects.all()` and inside the loop access `post.comments.all()` to list each post's comments. With 200 posts, roughly how many queries run, and what fixes it?",
    "choices": [
      "201 (1 + N) - it's the N+1 problem; fix it with prefetch_related(\"comments\"), which loads all comments in one extra IN query",
      "1 - Django automatically loads all related comments with the posts",
      "201, and the fix is select_related(\"comments\"), which JOINs the comments in",
      "2 always - Django caches the reverse relation by default"
    ],
    "answer": 0,
    "explain": "Accessing post.comments.all() per iteration consumes a fresh QuerySet each time = 1 query for posts + 200 for comments = 201 (N+1). Because comments is a reverse/many relation, the fix is prefetch_related (a second IN query joined in Python), not select_related (which uses a JOIN and is for forward FK / one-to-one)."
  },
  {
    "q": "You want every post listed with its comment count, in as few queries as possible. Which approach does it?",
    "choices": [
      "Post.objects.annotate(num_comments=Count(\"comments\")) - the database computes a per-row count with GROUP BY in a single query",
      "Loop over posts and call post.comments.count() on each - Django optimizes this to one query",
      "Post.objects.aggregate(Count(\"comments\")) - returns the count for each post",
      "Post.objects.count() - counts comments per post automatically"
    ],
    "answer": 0,
    "explain": "annotate adds a per-row computed value (here, a Count with GROUP BY) so each post arrives with num_comments already attached - one query for the whole listing. aggregate returns a single table-wide summary dict, not a per-post value, and the per-post .count() loop is the N+1 you're trying to avoid."
  }
]
```

---

[← Phase 6: Forms & Validation](06-forms-and-validation.md) · [Guide overview](_guide.md) · [Phase 8: Users, Auth & Sessions →](08-users-auth-and-sessions.md)
