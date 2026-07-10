---
title: "The Django Admin"
guide: "django-from-zero"
phase: 4
summary: "Django reads your models and generates a complete web back-office — list, search, filter, create, edit, delete — for free. Register your models, customize with ModelAdmin and inlines, and know its limits."
tags: [django, admin, admin-site, modeladmin, back-office, superuser, crud]
difficulty: intermediate
synonyms: ["django admin tutorial", "django register model admin", "django modeladmin customization", "django createsuperuser", "django admin list_display", "django auto admin", "django back office"]
updated: 2026-07-10
---

# The Django Admin

Here's the trick that made people fall in love with Django in the first place. You spent Phase 3 defining
two models — `Post` and `Comment` — describing your blog's data as Python classes. Django already turned
those into database tables for you. Now it's about to do something that feels almost unfair: it reads those
same model definitions and hands you a *complete, working web application* for managing that data. A real
back-office, with login, list pages, search boxes, filters, edit forms, delete buttons — and you write
essentially none of it.

> 📝 **The mental model:** the admin is a *reflection* of your models. It doesn't have its own idea of what
> your data looks like — it asks your models. Each field becomes a form input. Each model becomes a list
> page. Change the model, and the admin changes with it. You're not building the admin, you're *describing
> how you want Django to render the one it already built.*

This is the single feature that sells Django to teams. "We need an internal tool so the content team can
publish posts" is normally a week of CRUD-screen drudgery. In Django it's about four lines of code.

## The auto-admin: a back-office for free

Think about what a content manager actually needs to do with a blog: see all the posts, find a specific
one, create a new one, fix a typo, unpublish something, delete spam comments. That's the classic
**CRUD** loop — Create, Read, Update, Delete — wrapped in a usable interface.

> 💡 Writing those screens by hand is the most repetitive work in web development. Django noticed that the
> information needed to build them — field names, their types, which fields are required — *already lives
> in your models*, so it reads your models (from Phase 3) and builds the whole interface automatically.

You get all of this with zero screen-building on your part:

- A **list page** for each model, showing every row
- **Create** and **edit** forms, with the right input type per field (a date picker for `DateField`, a
  dropdown for foreign keys, a checkbox for `BooleanField`)
- **Delete** with a confirmation step
- **Search**, **filters**, and **pagination** once you ask for them
- A **login screen** and a permission system, so only trusted staff get in

The admin isn't a toy demo, either — real teams run their entire content operation through it for years.

## Enabling it

Good news: the admin is already switched on. When you ran `startproject` back in Phase 1, Django included
the admin app in `INSTALLED_APPS` and wired its URLs. The admin lives at `/admin/` right now. You just
need two things: a user who's allowed in, and a line telling the admin which models to show.

First, create a **superuser** — an account with full admin access:

```bash
python manage.py createsuperuser
```

```console
Username: nika
Email address: nika@example.com
Password:
Password (again):
Superuser created successfully.
```

*What just happened:* Django walked you through creating a privileged account and saved it to the `User`
table (from the auth app's migrations). Start the server (`python manage.py runserver`), visit
`http://127.0.0.1:8000/admin/`, and you can log in — though the dashboard is nearly empty, since you
haven't told the admin about your models yet.

Now open `blog/admin.py` (Django created this empty file for your app) and register your models:

```python
from django.contrib import admin

from .models import Post, Comment

admin.site.register(Post)
admin.site.register(Comment)
```

*What just happened:* `admin.site.register(Post)` says "add `Post` to the admin." Refresh `/admin/` and
you'll see a **Blog** section with **Posts** and **Comments**, each clickable. You can now create posts,
edit them, delete them, and manage comments — a full CRUD interface, for those two lines. Nobody wrote a
single form or template.

> 💡 Remember the `__str__` method you added to your models in Phase 3? *This* is where it pays off — the
> admin's list page shows each row using `__str__`. Without it, every post shows up as the useless `Post
> object (1)`. That wasn't busywork in Phase 3, it was setting up for today.

## Customizing with `ModelAdmin`

The default admin is functional but plain — a list of posts shown only by title, with no way to search or
filter. You shape it with a **`ModelAdmin`** class: a small configuration object that tells the admin how
to present *one* model. You attach it with the `@admin.register` decorator (a tidier replacement for the
`admin.site.register` call above).

```python
from django.contrib import admin

from .models import Post, Comment


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "published", "created_at")
    list_filter = ("published", "created_at")
    search_fields = ("title", "body")
    ordering = ("-created_at",)
    prepopulated_fields = {"slug": ("title",)}
```

*What just happened:* each attribute reshapes the admin for `Post`:

- **`list_display`** — which columns show on the list page. Instead of one title column, you now see
  title, author, published-state, and date side by side.
- **`list_filter`** — adds a sidebar of filters. A content manager can click "show only published" or
  filter by date with one click.
- **`search_fields`** — adds a search box at the top that searches across the named fields.
- **`ordering`** — the default sort. `"-created_at"` means newest first.
- **`prepopulated_fields`** — as you type a post's title, Django auto-fills the `slug` field with a
  URL-friendly version. (Assumes your `Post` has a `slug` field; drop the line if it doesn't.)

> 💡 Notice the pattern: you didn't write any UI. You wrote *configuration* — a handful of tuples naming
> fields — and Django translated it into search boxes, filter sidebars, and sortable columns.

## Inlines: editing related objects together

There's one rough edge so far. Comments belong to posts (that's the foreign key from Phase 3), but in the
admin they live on a totally separate page. To read a post and moderate its comments, you'd bounce between
two screens. What you actually want is to see — and edit — a post's comments *right there on the post's
edit page.*

That's an **inline**. You define a small inline class for the related model, then attach it to the parent's
`ModelAdmin`:

```python
from django.contrib import admin

from .models import Post, Comment


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 1


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "published", "created_at")
    list_filter = ("published", "created_at")
    search_fields = ("title", "body")
    ordering = ("-created_at",)
    inlines = [CommentInline]
```

*What just happened:* `CommentInline` tells the admin "Comments are related to Post — render them inside
the Post form." Now when you open a post to edit it, its comments appear as editable rows beneath the
post's fields, and `extra = 1` leaves one blank row so you can add a new comment without leaving the page.
Django knew *how* to connect them because of the `ForeignKey` from `Comment` to `Post` — you just told it
where to display the relationship.

> 💡 `TabularInline` lays the related rows out as a compact table (great for short records like comments).
> Its sibling **`StackedInline`** stacks each related object as a full form block — better when the related
> model has many fields and a table would be too cramped.

## What the admin is for (and what it isn't)

The admin feels so powerful that it's tempting to reach for it everywhere. So let's be clear about its job,
because misusing it is a genuine security mistake.

> 💡 The admin is for **trusted internal staff** — your team, your content editors, your moderators. It's an
> *internal back-office and content-management tool*, and at that job it's a massive productivity win. Spin
> one up and your colleagues can manage data on day one.

> ⚠️ The admin is **not** your public, user-facing interface, and it is **not** a public API. Don't point
> your blog's readers at `/admin/` to write comments, and don't let untrusted users near it. It exposes raw
> database editing with delete buttons everywhere — in the wrong hands that's a disaster. In production,
> lock it down: serve it over HTTPS, give staff strong unique passwords, and consider moving it off the
> obvious `/admin/` URL or restricting it by IP.

What your *public* visitors see — the actual blog pages with their own design — is a separate thing you
build deliberately. That's the next two phases: templates render the public pages (Phase 5), and forms let
visitors safely submit comments (Phase 6).

> 💡 Step back and notice what just happened across Phases 3 and 4. You defined `Post` and `Comment` *once*,
> as Python classes. From that single definition Django gave you the database schema (Phase 3), and now a
> complete admin interface (Phase 4) — and next it'll generate forms too (Phase 6). Define the model once,
> get the rest for free.

## Recap

- Django generates a **full CRUD back-office** — list, search, filter, create, edit, delete — automatically
  from your models. It's the framework's signature feature.
- The admin is already enabled. Create access with `python manage.py createsuperuser`, then **register**
  each model with `admin.site.register(Model)` (or the `@admin.register` decorator) in `admin.py`.
- A model's `__str__` controls how its rows appear in the admin — which is why you wrote good `__str__`
  methods in Phase 3.
- A **`ModelAdmin`** class customizes one model's admin via `list_display`, `list_filter`, `search_fields`,
  `ordering`, and `prepopulated_fields` — configuration, not UI code.
- **Inlines** (`TabularInline` / `StackedInline`) let you edit related objects, like a post's comments, on
  the parent's edit page.
- The admin is for **trusted staff only** — an internal tool, never a public UI or API. Lock it down in
  production.

## Quick check

```quiz
[
  {
    "q": "Where does the Django admin get the information it needs to build its forms and list pages?",
    "choices": ["From a separate config file you write by hand", "From your model definitions", "From the database's raw column metadata at runtime"],
    "answer": 1,
    "explain": "The admin reflects your models — each field becomes a form input and each model becomes a list page. Change the model and the admin changes with it."
  },
  {
    "q": "What does a ModelAdmin's `list_display` attribute control?",
    "choices": ["Which fields are required when creating a record", "Which columns appear on the model's list page in the admin", "Which users are allowed to see the model"],
    "answer": 1,
    "explain": "`list_display` is a tuple of field names shown as columns on the list page, so you see more than just the `__str__` value."
  },
  {
    "q": "Which statement about the Django admin is correct?",
    "choices": ["It's meant to be your public, user-facing interface", "It's an internal back-office for trusted staff and should be locked down in production", "It replaces the need to ever write templates or forms"],
    "answer": 1,
    "explain": "The admin is a powerful internal tool for trusted staff. It is not a public UI or API — expose it carefully, and build public pages with templates and forms instead."
  }
]
```

---

[← Phase 3: Models & the ORM](03-models-and-the-orm.md) · [Guide overview](_guide.md) · [Phase 5: Templates & the MTV Pattern →](05-templates-and-mtv.md)
