---
title: "Forms & Request Data"
guide: "flask-from-zero"
phase: 4
summary: "Take in user-submitted data the right way: read raw form fields, apply the POST/redirect/GET pattern, validate and flash messages, then graduate to Flask-WTF for form classes, validators, and built-in CSRF protection."
tags: [flask, forms, request-form, flask-wtf, validation, csrf, flash]
difficulty: intermediate
synonyms: ["flask forms", "flask request.form", "flask-wtf forms validation", "flask csrf protection", "flask post redirect get", "flask flash messages", "flask handle form submission"]
updated: 2026-07-10
---

# Forms & Request Data

Up to now your notes app has *shown* data. This phase is where it starts *taking it in* — a real form where
a person types a note title and hits **Save**. That single act touches more of Flask than anything so far: an
HTML form, a `POST` handler, validation, a redirect, a confirmation message, and — the part everyone forgets
until it bites them — protecting the form from being submitted by a site that isn't yours.

The mental model: **a form submission is just a `POST` request whose body is a bag of named fields.** The
browser packs up the form's inputs and ships them in the request body; your view reads them out of
`request.form`. Flask's tiny core gives you exactly that and stops — no form library, no validation, no CSRF.
Everything richer is something you *add*. We'll start bare-hands, then layer on the extension that does the
tedious parts for you.

## Reading a raw form — the bare-hands version

📝 An HTML form is two things: a `<form>` that says *where* and *how* to submit, and inputs that carry named
values. Here's the create-note form:

```html
<form method="post" action="/notes/new">
  <label>Title <input type="text" name="title"></label>
  <button type="submit">Save</button>
</form>
```

*What just happened:* `method="post"` tells the browser to send a `POST` (the verb for submitting data, from
[Routing & Views](02-routing-and-views.md)), and `action="/notes/new"` is the URL it submits to. The `name`
attribute is load-bearing — `name="title"` is the key your view reads by. No `name`, no value in the request
body — the single most common "my field is missing" cause.

On the server, the view reads those fields off `request.form`:

```python
from flask import request

@app.route("/notes/new", methods=["POST"])
def create_note():
    title = request.form["title"]
    notes.append(title)
    return f"Saved: {title}", 201
```

*What just happened:* the browser's `POST` lands here, and `request.form["title"]` pulls the value of the
input named `title` out of the request body. `request.form` behaves like a dict — `request.form["title"]`
raises a `400 Bad Request` if the key is missing, while `.get("title")` returns `None` instead. That's the
*whole* of Flask's form handling: a dict of submitted fields, no validation, no escaping, no protection.

## POST, then redirect, then GET

⚠️ There's a bug hiding in that `return f"Saved: {title}", 201`. The user submits, sees "Saved," and then —
out of habit — hits **refresh**. The browser re-sends the *last request*, the `POST`, so it submits the note
*again*. And again, every refresh. Duplicate notes, and a confused user.

The fix is a discipline with a name: **POST/redirect/GET**. After a successful `POST`, don't render a page —
**redirect** the browser to a normal page with `redirect(url_for(...))`.

```python
from flask import request, redirect, url_for

@app.route("/notes/new", methods=["POST"])
def create_note():
    title = request.form["title"]
    notes.append(title)
    return redirect(url_for("notes_collection"))  # send them to the list page
```

*What just happened:* instead of returning HTML from the `POST`, the view returns a `302` redirect to the
notes list, and the browser makes a *fresh `GET`* to that page — the last request sitting in the browser is
now harmless, so refreshing re-fetches the list instead of re-submitting the form. `url_for` builds the
target from the view function's name (never hardcode the path — see Phase 2). Make this your reflex: **any
successful `POST` ends in a redirect, not a rendered page.**

## Validate, then flash a message

Right now `create_note` trusts whatever arrives, but an empty title is garbage and the user deserves to know
their note saved. Both need a small addition: a validation check and a **flash message** — a one-time note
that survives the redirect and shows up on the *next* page.

```python
from flask import request, redirect, url_for, flash

app.secret_key = "dev-only-change-me"  # required for flashing (it signs the session cookie)

@app.route("/notes/new", methods=["POST"])
def create_note():
    title = request.form.get("title", "").strip()
    if not title:
        flash("Title can't be empty.")
        return redirect(url_for("notes_collection"))
    notes.append(title)
    flash("Note saved.")
    return redirect(url_for("notes_collection"))
```

*What just happened:* `request.form.get("title", "").strip()` reads the field forgivingly and trims
whitespace, so a box of spaces counts as empty. If it's blank, we `flash` an error and redirect *back*
without saving; otherwise we save and `flash` a success message, which stays in the session and appears
exactly once on the next request. ⚠️ Flashing needs `app.secret_key` set — flashed messages ride in the
signed session cookie, and without a key Flask raises an error. Use a real random secret in production.

The messages don't show themselves — your template pulls them out with `get_flashed_messages()`:

```html
{% for message in get_flashed_messages() %}
  <p class="flash">{{ message }}</p>
{% endfor %}
```

*What just happened:* `get_flashed_messages()` returns the queued messages and *clears* them in the same
move, so a refresh afterward won't show them again — that's what "one-time" means. Put this loop in your base
template (from [Templates with Jinja2](03-templates-with-jinja.md)) so every page can surface a flash;
`{{ message }}` is auto-escaped by Jinja, so a flash built from user input is safe to render.

## Flask-WTF — the extension way

That hand-rolled validation works for one field. Imagine instead a form with a title, a body, a category, and
a "required / max length / must be one of these" rule on each — the `if not this and not that` pile grows
fast, and you're re-implementing the same checks every project. 📝 This is the moment Flask's philosophy says
reach for an **extension**. **Flask-WTF** (a thin wrapper over the WTForms library) gives you form
*classes* — declare your fields and validators once, and it handles parsing, validation, and re-rendering.

```python
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired, Length

class NoteForm(FlaskForm):
    title = StringField("Title", validators=[DataRequired(), Length(max=120)])
    submit = SubmitField("Save")

@app.route("/notes/new", methods=["GET", "POST"])
def create_note():
    form = NoteForm()
    if form.validate_on_submit():
        notes.append(form.title.data)
        flash("Note saved.")
        return redirect(url_for("notes_collection"))
    return render_template("new_note.html", form=form)
```

*What just happened:* `NoteForm` declares the form as a class — each field names its type (`StringField`) and
its rules (`DataRequired`, `Length(max=120)`). The view's one decision is `form.validate_on_submit()`, which
returns `True` only when the request is a `POST` **and** every validator passes. On success you read clean
data off `form.title.data` and follow the same POST/redirect/GET you already know. On a `GET` or a *failed*
`POST` it's `False`, so you re-render the template and WTForms hands the form back with per-field errors
already attached — no manual `if not title` checks; the validators *are* the rules.

In the template you let the form render itself, errors and all:

```html
<form method="post">
  {{ form.csrf_token }}
  {{ form.title.label }} {{ form.title() }}
  {% for error in form.title.errors %}<span class="error">{{ error }}</span>{% endfor %}
  {{ form.submit() }}
</form>
```

*What just happened:* `{{ form.title() }}` renders the `<input>`, `{{ form.title.label }}` its label, and the
loop prints any validation errors WTForms attached to that field. `{{ form.csrf_token }}` is the piece we
explain next, and it's the reason Flask-WTF is worth adopting even for small forms.

💡 The honest rule of thumb: raw `request.form` is fine for a trivial, one-off field where you fully control
the input. For anything you'd call a *real* form — multiple fields, validation rules, anything submitted
repeatedly — reach for Flask-WTF. You'll write less code *and* get CSRF for free.

## CSRF — and why it's not optional for writes

📝 ⚠️ **CSRF (Cross-Site Request Forgery)** is an attack where a malicious site silently makes a logged-in
user's browser submit a request to *your* app — the browser attaches your session cookie to any request to
your domain, even one triggered from `evil.com`. A hidden form on the attacker's page that `POST`s to
`/notes/new` (or worse, `/account/delete`) fires with your identity attached. The fix is a secret the
attacker can't know: Flask-WTF embeds a **per-session CSRF token** (`{{ form.csrf_token }}`) and rejects any
`POST` whose token is missing or wrong — a forged form can't include a token it never saw.

This is the same family of bug as the injection holes in
[SQL Injection & XSS, Explained](/guides/sql-injection-and-xss): an action gets *trusted* that shouldn't be —
there, untrusted input treated as code; here, an untrusted request treated as the user's intent. The cure
rhymes: don't trust input you can't verify.

⚠️ Raw `request.form` has **no CSRF protection at all** — the hand-rolled `create_note` from earlier in this
phase will happily accept a forged cross-site `POST`. That's the strongest argument for Flask-WTF: use a
`FlaskForm` and render `{{ form.csrf_token }}`, and `validate_on_submit()` checks the token automatically.
(Set `app.secret_key` — the same one flashing needs — because that's what signs the token.)

💡 The takeaway: **anything that writes — creates, edits, deletes — must be validated *and* CSRF-protected.**
Read-only `GET`s are exempt, but the moment a request mutates data, both guards apply. Flask-WTF gives you
both in one move, which is why it's the default choice for forms that matter.

## Recap

1. 📝 **A form submission is a `POST` whose body is named fields.** Read them with `request.form["title"]`
   (400 if missing) or `request.form.get("title")` (returns `None`). The HTML input's `name` is the key.
2. ⚠️ **POST/redirect/GET:** after a successful `POST`, return `redirect(url_for(...))` — never a rendered
   page — so a refresh re-fetches a page instead of re-submitting the form.
3. **Validate and flash:** check the input yourself (`if not title.strip()`), and use `flash("Note saved.")`
   + `get_flashed_messages()` in the template for one-time messages. Flashing requires `app.secret_key`.
4. 📝 **Flask-WTF** is the extension for real forms: a `FlaskForm` class declares fields + validators, and
   `form.validate_on_submit()` parses, validates, and (on failure) re-renders with per-field errors.
5. 📝 ⚠️ **CSRF** lets a malicious site submit your form using a logged-in user's cookie; Flask-WTF blocks it
   with a per-session token (`{{ form.csrf_token }}`) it validates automatically. Raw `request.form` has none.
6. 💡 Raw `request.form` for trivial input; Flask-WTF for anything real. **Validate *and* CSRF-protect
   anything that writes.**

Next we stop appending to a throwaway list and give those notes a real home: a database.

## Quick check

Make sure the form-handling essentials stuck:

```quiz
[
  {
    "q": "Why redirect after a successful POST instead of rendering a page directly?",
    "choices": [
      "So a browser refresh re-fetches a page (a GET) instead of re-submitting the form",
      "Because Flask forbids returning HTML from a POST handler",
      "Redirects are faster than rendering a template",
      "It's the only way to set a 201 status code"
    ],
    "answer": 0,
    "explain": "POST/redirect/GET: redirecting makes the last request a harmless GET, so refreshing re-fetches the page rather than re-submitting the form and creating duplicates."
  },
  {
    "q": "What does `form.validate_on_submit()` return for the very first GET request to the form's URL?",
    "choices": [
      "False, because it's True only on a POST where all validators pass",
      "True, so you can pre-fill the form",
      "None, because there's no data yet",
      "It raises an error on GET requests"
    ],
    "answer": 0,
    "explain": "`validate_on_submit()` is True only when the request is a POST and every validator passes. On a GET (first visit) it's False, so you fall through and render the empty form."
  },
  {
    "q": "Why does a CSRF token stop a forged cross-site form submission?",
    "choices": [
      "The attacker's page can't include a per-session token it never saw, so the POST is rejected",
      "It encrypts the form data so the attacker can't read it",
      "It blocks all requests that come from a different domain",
      "It logs the user out whenever a foreign request arrives"
    ],
    "answer": 0,
    "explain": "Flask-WTF embeds a secret per-session token in the form and checks it on POST. A forged form on another site can't know that token, so its submission fails validation."
  }
]
```

---

[← Phase 3: Templates with Jinja2](03-templates-with-jinja.md) · [Guide overview](_guide.md) · [Phase 5: Working with a Database →](05-database-with-sqlalchemy.md)