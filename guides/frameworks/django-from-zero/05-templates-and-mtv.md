---
title: "Templates & the MTV Pattern"
guide: "django-from-zero"
phase: 5
summary: "How Django turns data into HTML: where templates fit in MTV, the template language, the context dict, template inheritance for shared layout, and the auto-escaping that quietly blocks XSS."
tags: [django, templates, template-language, render, context, template-inheritance, mtv]
difficulty: intermediate
synonyms: ["django templates", "django template language", "django render context", "django template inheritance extends block", "django template tags filters", "django mtv", "django autoescape xss"]
updated: 2026-06-22
---

# Templates & the MTV Pattern

Back in Phase 2 your views already started rendering templates instead of returning hand-typed HTML strings. This phase is where we slow down and look at the **T** in MTV properly — because that letter is doing more work than it looks like.

Here's the mental model to hold onto before any code: **a view's job is to gather data and hand it off; a template's job is to turn that data into HTML.** The view talks to the Model (your `Post` objects), bundles up what it found, and passes it to a Template that knows how to lay it out. Two roles, one clean handoff. The view never builds HTML; the template never touches the database. Keeping those jobs separate is the whole point — it's why the same `Post` list can be rendered as a web page today and (Phase 9) as JSON tomorrow without rewriting your data logic.

📝 **MTV is Django's name for the same idea most people call MVC.** Model = your data (the ORM). Template = the presentation (HTML). View = the glue in the middle that decides *which* data goes to *which* template. The flow for one request is short and always the same: **request → URLconf picks a view → view queries the Model → view calls `render()` with a template + data → HTML goes back to the browser.**

## Where templates fit

A view renders a template with `render()`. You give it three things: the request, the path to a template, and a dict of data:

```python
# blog/views.py
from django.shortcuts import render
from .models import Post

def post_list(request):
    posts = Post.objects.all()
    return render(request, "blog/post_list.html", {"posts": posts})
```

*What just happened:* the view fetched every `Post` from the database (Model), then handed that list to `render()` along with a template path and a dict. `render()` finds `blog/post_list.html`, runs it with `posts` available inside, and returns a finished `HttpResponse` full of HTML. Notice the view itself contains zero HTML — it only decides *what* to show, not *how* it looks.

📝 That template path — `"blog/post_list.html"` — lives in a `templates/` folder inside your app: `blog/templates/blog/post_list.html`. The doubled `blog/` is deliberate. Django searches *all* apps' `templates/` folders as one merged pile, so the inner `blog/` namespaces your files and stops your `post_list.html` from colliding with some other app's `post_list.html`. It feels redundant the first time; it saves you from a confusing bug the first time two apps share a filename.

## The Django Template Language

A template is mostly plain HTML with three special markers sprinkled in. That's the entire language, and there are only three shapes to learn:

- `{{ variable }}` — **output** a value. `{{ post.title }}` prints the title.
- `{% tag %}` — **logic**: loops, conditionals, and helpers like `{% for %}`, `{% if %}`, `{% url %}`.
- `{{ value|filter }}` — **transform** a value on its way out: `{{ post.body|truncatewords:30 }}`.

Here's `post_list.html` looping over the posts the view passed in:

```html
<h1>The Blog</h1>

{% for post in posts %}
  <article>
    <h2><a href="{% url 'post_detail' post.id %}">{{ post.title }}</a></h2>
    <p class="meta">{{ post.published_at|date:"M j, Y" }}</p>
    <p>{{ post.body|truncatewords:30 }}</p>
  </article>
{% empty %}
  <p>No posts yet. {{ empty_message|default:"Check back soon." }}</p>
{% endfor %}
```

*What just happened:* `{% for post in posts %}` walks the list. For each post, `{{ post.title }}` prints the title and `{% url 'post_detail' post.id %}` builds the link by *name* (the same named routes you set up in the URLconf in Phase 2) instead of hardcoding a path — so if the URL pattern ever changes, this link follows it automatically. The filters earn their keep too: `|date:"M j, Y"` formats a datetime into `Jun 22, 2026`, and `|truncatewords:30` clips the body to 30 words. The `{% empty %}` branch runs only when `posts` is empty, and `|default:` supplies a fallback if `empty_message` is missing or falsy.

⚠️ The Django Template Language is **deliberately limited** — you cannot call arbitrary Python, do math, or run a database query from inside a template. That's a feature, not a missing one. It forces the rule from the top of this phase: real logic belongs in the **view**, where it's testable and visible. If you find yourself fighting the template to compute something, that's the template telling you the work should have happened in the view before the data was handed over.

## Context: what the template can see

That dict you pass to `render()` has a name: the **context**. It's the *entire* world the template can see. If a name isn't in the context, the template does not have it at all — there's no reaching back into the view or the database for more.

```python
# blog/views.py
def post_list(request):
    posts = Post.objects.all()
    context = {
        "posts": posts,
        "show_drafts": request.user.is_staff,
    }
    return render(request, "blog/post_list.html", context)
```

*What just happened:* the view built a context with two keys and handed it over. Inside the template, `{{ posts }}` and `{{ show_drafts }}` are now available — and *nothing else from the view is*. The local variable was called `posts`, but the template only sees it because the key `"posts"` is in the dict. Rename the key and the template's `{{ posts }}` goes blank. That tight boundary is what makes templates predictable: to know what a template can use, you only have to read the context, not the whole view.

💡 You can drive logic off context values: `{% if show_drafts %}...{% endif %}` shows a block only to staff. The decision (`request.user.is_staff`) was made in the view; the template just reacts to the boolean it was given. View decides, template displays.

## Template inheritance: write the layout once

Every page on your site shares chrome — the same `<head>`, nav bar, and footer. Copy-pasting that into every template is how you end up updating the nav in eleven files and missing one. Django's answer is **template inheritance**: a `base.html` defines the skeleton with `{% block %}` holes, and child templates fill the holes.

```html
<!-- blog/templates/blog/base.html -->
<!DOCTYPE html>
<html>
<head>
  <title>{% block title %}The Blog{% endblock %}</title>
</head>
<body>
  <nav><a href="/">Home</a></nav>

  <main>
    {% block content %}{% endblock %}
  </main>

  <footer>Built with Django</footer>
</body>
</html>
```

```html
<!-- blog/templates/blog/post_list.html -->
{% extends "blog/base.html" %}

{% block title %}All Posts — The Blog{% endblock %}

{% block content %}
  <h1>The Blog</h1>
  {% for post in posts %}
    <h2>{{ post.title }}</h2>
  {% endfor %}
{% endblock %}
```

*What just happened:* `base.html` lays out the page once and marks two spots — `{% block title %}` and `{% block content %}` — as overridable. The child template's `{% extends "blog/base.html" %}` says "start from that skeleton," then its own `{% block %}` tags pour content into the matching holes. The child never repeats the `<nav>`, the `<footer>`, or the `<head>` — it inherits them. Change the footer in `base.html` and every page that extends it updates at once.

💡 This is the **DRY** win for server-rendered HTML: Don't Repeat Yourself, applied to layout. One base template, many children, zero duplicated chrome. When a designer asks to add a nav link, you edit one file.

## Auto-escaping: the XSS shield you didn't ask for

Now the part that quietly protects you. By default, **Django templates auto-escape every variable they output.** If a `{{ post.body }}` contains `<script>alert('xss')</script>`, Django doesn't render a live script tag — it converts the angle brackets to `&lt;script&gt;` so the browser prints the text harmlessly instead of executing it.

```console
Stored post body:  Nice post! <script>steal()</script>
Rendered to page:  Nice post! &lt;script&gt;steal()&lt;/script&gt;
```

*What just happened:* a malicious comment body went *into* the template, but auto-escaping defanged it on the way *out*. The user sees the literal text; the browser never runs the script. This is your default defense against **cross-site scripting (XSS)** — the attack where someone smuggles markup through user input to run code in another visitor's browser. It's the same family of trust-the-input mistake as SQL injection; if you want the full picture of why this attack works and how it bites, read [SQL Injection & XSS](/guides/sql-injection-and-xss). The good news: in Django templates, the safe behavior is the one you get for free.

⚠️ The escape hatch is `|safe` (or `mark_safe()` in Python), which tells Django "trust this, render it raw." That turns the shield **off** for that value. Only ever reach for it on content *you* generated or have sanitized — never on anything a user typed. `{{ comment.body|safe }}` on a user-submitted comment is exactly how an XSS hole gets created. When in doubt, leave it escaped.

💡 You'll also start seeing `{% csrf_token %}` the moment you add a form — it drops a hidden token into the HTML that proves a form submission really came from your own page. We're foreshadowing it here because it lives in templates, but it earns its full explanation in the next phase.

💡 Templates are the **V**iew the user actually sees — the rendered surface of your app. So far the data has flowed one direction: database → view → template → browser. Next we reverse it: **forms** are how data flows back *in*, from the user to your app, and that's exactly where `{% csrf_token %}` and validation come in.

## Recap

- **MTV** splits work cleanly: the **Model** holds data, the **View** gathers it and decides what to show, the **Template** turns it into HTML. The view never builds HTML; the template never queries the database.
- A view renders with `render(request, "blog/post_list.html", {"posts": posts})` — request, template path, and a **context** dict of data.
- The **template language** has three shapes: `{{ variable }}` to output, `{% tag %}` for logic (`{% for %}`, `{% if %}`, `{% url %}`), and `{{ value|filter }}` to transform. It's deliberately limited — real logic stays in the view.
- The **context** is the template's entire world. Only the names you put in the dict are visible inside.
- **Template inheritance** (`{% block %}` in `base.html`, `{% extends %}` in children) gives you shared layout with zero duplication — the DRY win for server-rendered HTML.
- Django **auto-escapes** variables by default, blocking XSS for free. `|safe`/`mark_safe` turns that off — only use it on content you trust, never on user input.

## Quick check

```quiz
[
  {
    "q": "In Django's MTV pattern, whose job is it to query the database and decide which data to send to the template?",
    "choices": ["The Template", "The View", "The URLconf"],
    "answer": 1,
    "explain": "The View gathers data from the Model and hands it to the Template via render(). The template only displays what it's given."
  },
  {
    "q": "A template tries to use {{ author }}, but the view's context dict only contains {\"posts\": posts}. What happens?",
    "choices": ["Django reaches back into the view to find author", "author is empty — only names in the context dict are visible", "It raises a hard error and the page 500s"],
    "answer": 1,
    "explain": "The context is the template's entire world. A name not in the dict renders as empty; the template can't reach outside it."
  },
  {
    "q": "A comment body contains <script>steal()</script>. You render it with {{ comment.body }}. What does the visitor's browser do?",
    "choices": ["Runs the script — XSS succeeds", "Prints the text harmlessly because Django auto-escapes it", "Strips the tag silently and shows nothing"],
    "answer": 1,
    "explain": "Auto-escaping converts the angle brackets to entities, so the browser prints the literal text instead of executing it. Adding |safe would disable this and reopen the XSS hole."
  }
]
```

---

[← Phase 4: The Django Admin](04-the-django-admin.md) · [Guide overview](_guide.md) · [Phase 6: Forms & Validation →](06-forms-and-validation.md)
