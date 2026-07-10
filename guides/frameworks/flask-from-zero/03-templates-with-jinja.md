---
title: "Templates with Jinja2"
guide: "flask-from-zero"
phase: 3
summary: "How Flask turns data into HTML with Jinja2: rendering templates, the Jinja language, the context you pass, template inheritance for shared layout, and the auto-escaping that quietly blocks XSS."
tags: [flask, jinja2, templates, render-template, template-inheritance, autoescape, context]
difficulty: intermediate
synonyms: ["flask jinja2 templates", "flask render_template", "jinja template syntax", "jinja template inheritance extends block", "flask template context", "jinja filters", "flask html templates"]
updated: 2026-07-10
---

# Templates with Jinja2

In Phase 2 your views returned HTML by hand — strings like `f"<h1>{notes[note_id]}</h1>"`. That works for one
line, but falls apart the moment a note page needs a real `<head>`, a nav bar, a loop, and a footer. Stuffing
that into a Python f-string is how you end up with unreadable views and HTML you can't see the shape of.
This phase hands that job to **Jinja2**, the template engine that ships inside Flask.

Hold this mental model: **a view's job is to gather data; a template's job is to turn that data into HTML.**
The view talks to your data (the `Note` objects), bundles up what it found, and passes it to a template that
knows how to lay it out. The view never builds HTML by hand; the template never reaches into the database.
Keeping those jobs apart is why the same list of notes can render as a web page today and (in
[Building a JSON API](08-building-a-json-api.md)) as JSON tomorrow without rewriting your data logic.

## Why templates — getting HTML out of your views

📝 You don't import Jinja2 or wire it up. It's built into Flask, and you reach it through one function:
`render_template`. You give it a template filename and the data it needs; Flask finds the file, runs it with
your data available inside, and returns a finished response full of HTML.

```python
from flask import Flask, render_template

app = Flask(__name__)

notes = [
    {"id": 1, "title": "Buy milk", "content": "2 liters, oat"},
    {"id": 2, "title": "Call dentist", "content": "reschedule cleaning"},
]

@app.route("/notes")
def notes_list():
    return render_template("notes.html", notes=notes)
```

*What just happened:* the view fetched its data (here a throwaway list — a real database arrives in
[Working with a Database](05-database-with-sqlalchemy.md)) and handed it to `render_template("notes.html",
notes=notes)`. Flask finds `notes.html`, runs it with `notes` available inside, and returns the rendered HTML.
The view contains **zero HTML** — it only decides *what* to show, not *how* it looks.

📝 Where does `notes.html` live? In a folder named `templates/` next to your app file. Flask looks there
automatically — you don't configure the path:

```
your-app/
  app.py
  templates/
    notes.html
    note_detail.html
    base.html
```

## The Jinja language

A Jinja template is mostly plain HTML with three special markers sprinkled in — the entire language:

- `{{ value }}` — **output** a value. `{{ note.title }}` prints the title.
- `{% tag %}` — **logic**: loops and conditionals like `{% for %}`, `{% if %}`, plus helpers like `{% url ... %}`.
- `{{ value|filter }}` — **transform** a value on its way out: `{{ note.title|upper }}`.

Here's `notes.html` looping over the notes the view passed in:

```html
<h1>Your Notes</h1>

{% if notes %}
  <ul>
  {% for note in notes %}
    <li>
      <a href="{{ url_for('note_detail', note_id=note.id) }}">{{ note.title }}</a>
      — {{ note.content }}
    </li>
  {% endfor %}
  </ul>
{% else %}
  <p>No notes yet. Add your first one.</p>
{% endif %}
```

*What just happened:* `{% for note in notes %}` walks the list, and for each one `{{ note.title }}` prints the
title while `{{ note.content }}` prints the body. `{% if notes %}` / `{% else %}` shows a friendly message
when the list is empty, and `{{ url_for('note_detail', note_id=note.id) }}` builds the link by the view
function's *name* — the same `url_for` from Phase 2 — instead of hardcoding `/notes/1`, so a route change
propagates automatically.

⚠️ Jinja is **deliberately limited** — you can't call arbitrary Python, run a database query, or do heavy
computation from inside a template. That's a feature: real logic belongs in the **view**, where it's visible
and testable. Fighting the template to compute something is a sign the work belongs in the view instead.

## Context — what the template can see

📝 The keyword arguments you pass to `render_template` have a name: the **context**. It is the *entire* world
the template can see — if a name isn't in the context, the template doesn't have it at all, and there's no
reaching back into the view or the database for more.

```python
@app.route("/notes")
def notes_list():
    return render_template(
        "notes.html",
        notes=notes,
        page_title="My Notebook",
    )
```

*What just happened:* the view passed two things into the context — `notes` and `page_title`. Inside
`notes.html`, both `{{ notes }}` and `{{ page_title }}` are now available, *and nothing else from the view is*.
Rename the keyword (`notes=` becomes `items=`) and `{{ notes }}` silently goes blank, because the template's
name must match the key you passed. That tight boundary is what makes templates predictable: to know what a
template can use, you only have to read the context.

## Template inheritance — write the layout once

Every page on your site shares chrome — the same `<head>`, nav bar, footer. Copy-pasting that into
`notes.html`, `note_detail.html`, and every other template is how you end up updating the nav in five files
and forgetting one. Jinja's answer is **template inheritance**: a `base.html` defines the skeleton with
`{% block %}` holes, and child templates fill them.

```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html>
<head>
  <title>{% block title %}Notebook{% endblock %}</title>
</head>
<body>
  <nav><a href="{{ url_for('notes_list') }}">All notes</a></nav>

  <main>
    {% block content %}{% endblock %}
  </main>

  <footer>Built with Flask</footer>
</body>
</html>
```

```html
<!-- templates/notes.html -->
{% extends "base.html" %}

{% block title %}Your Notes — Notebook{% endblock %}

{% block content %}
  <h1>Your Notes</h1>
  <ul>
  {% for note in notes %}
    <li>{{ note.title }}</li>
  {% endfor %}
  </ul>
{% endblock %}
```

*What just happened:* `base.html` lays out the page once and marks two spots — `{% block title %}` and
`{% block content %}` — as overridable holes. The child's `{% extends "base.html" %}` says "start from that
skeleton," then its own `{% block %}` tags pour content into the matching holes, never repeating the `<nav>`,
`<footer>`, or `<head>`.

💡 This is the **DRY** win for server-rendered HTML: one base template, many children, zero duplicated chrome.
Change the footer in `base.html` and every page that extends it updates at once. Add a third page later and
you write only its `{% block content %}`, getting the whole shell for free.

## Auto-escaping — the XSS shield you get for free

By default, **Jinja auto-escapes every variable it outputs.** If a note's `content` contains
`<script>alert('xss')</script>`, Jinja doesn't render a live script tag — it converts the angle brackets to
`&lt;script&gt;` so the browser prints the text harmlessly instead of executing it.

```console
Stored note content:  Nice list! <script>steal()</script>
Rendered to page:      Nice list! &lt;script&gt;steal()&lt;/script&gt;
```

*What just happened:* a malicious note body went *into* the template via `{{ note.content }}`, but
auto-escaping defanged it on the way *out*. The visitor sees the literal text; the browser never runs the
script. This is your default defense against **cross-site scripting (XSS)** — the attack where someone smuggles
markup through user input to run code in another visitor's browser. Same trust-the-input family as SQL
injection; for the full picture read [SQL Injection & XSS](/guides/sql-injection-and-xss).

⚠️ The escape hatch is the `|safe` filter, which tells Jinja "trust this, render it raw," turning the shield
**off** for that value. Only reach for it on content *you* generated or have already sanitized — never on
anything a user typed. `{{ note.content|safe }}` on a user-submitted note is exactly how an XSS hole gets
created. When in doubt, leave it escaped.

💡 Templates are the surface the user actually sees. So far data has flowed one direction: storage → view →
template → browser. Next we reverse it: **forms** are how data flows back *in*, from the user to your app.

## Recap

1. **`render_template("notes.html", notes=notes)`** is how a view returns HTML: it finds the file in
   `templates/`, runs it with your data, and returns the response. Jinja2 ships inside Flask — no setup.
2. The **Jinja language** has three shapes: `{{ value }}` to output, `{% tag %}` for logic (`{% for %}`,
   `{% if %}`), and `{{ value|filter }}` to transform. ⚠️ It's deliberately limited — real logic stays in the
   view. `url_for` works in templates, so build links by view name, not hardcoded paths.
3. The **context** is the keywords you pass to `render_template`, and it's the template's *entire* world. Only
   names you pass are visible inside; the name in the template must match the key.
4. **Template inheritance** — `{% block %}` holes in `base.html`, `{% extends "base.html" %}` in children —
   gives you shared layout with zero duplication. 💡 The DRY win for server-rendered HTML.
5. 💡 Jinja **auto-escapes** variables by default, blocking XSS for free. ⚠️ `|safe` turns that off — only use
   it on content you trust, never on user input.

## Quick check

Make sure the data → HTML handoff stuck:

```quiz
[
  {
    "q": "Your view calls `render_template(\"notes.html\", notes=notes)`. Inside the template, what is available?",
    "choices": [
      "Only `{{ notes }}` — the context is exactly what you pass, nothing more",
      "Every variable defined in the view function",
      "`notes` plus anything in the global Python scope",
      "Nothing, because templates can't receive Python data"
    ],
    "answer": 0,
    "explain": "The context is the keywords you pass to render_template. Only `notes` is available; the template can't reach back into the view for anything else."
  },
  {
    "q": "A note's content contains `<script>steal()</script>`. You render it with `{{ note.content }}`. What does the visitor's browser do?",
    "choices": [
      "Runs the script — XSS succeeds",
      "Prints the literal text harmlessly because Jinja auto-escapes it",
      "Strips the tag silently and shows nothing",
      "Throws a template error and 500s"
    ],
    "answer": 1,
    "explain": "Jinja auto-escapes by default, converting the angle brackets to entities so the browser prints the text instead of executing it. Adding `|safe` would disable this and reopen the XSS hole."
  },
  {
    "q": "What does `{% extends \"base.html\" %}` at the top of a child template do?",
    "choices": [
      "Imports Python functions from base.html into the child",
      "Copies base.html's HTML inline before rendering",
      "Tells Jinja to start from base.html's skeleton and fill its `{% block %}` holes with the child's blocks",
      "Runs base.html as a separate request first"
    ],
    "answer": 2,
    "explain": "`{% extends %}` makes the child inherit base.html's layout; the child's `{% block %}` tags pour content into the matching holes, so shared chrome (nav, footer, head) lives in one place."
  }
]
```

---

[← Phase 2: Routing & Views](02-routing-and-views.md) · [Guide overview](_guide.md) · [Phase 4: Forms & Request Data →](04-forms-and-request-data.md)