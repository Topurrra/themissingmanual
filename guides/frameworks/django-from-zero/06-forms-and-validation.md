---
title: "Forms & Validation"
guide: "django-from-zero"
phase: 6
summary: "How data flows back into your app: a Form class declares fields, ModelForm builds one from a model, the GET/POST view pattern handles it, validation cleans it, and csrf_token keeps it safe."
tags: [django, forms, modelform, validation, csrf, form-handling, cleaned-data]
difficulty: intermediate
synonyms: ["django forms", "django modelform", "django form validation", "django csrf token", "django form is_valid cleaned_data", "django handle post form", "django form rendering"]
updated: 2026-06-22
---

# Forms & Validation

Phase 5 ended on a one-way street: database → view → template → browser. Data flowed *out*. This phase reverses the arrow. A reader finishes your blog post, wants to leave a comment, types it into a box, and hits submit. That comment has to travel *back in* — and along the way it needs to be parsed, checked, and either saved or bounced back with errors. That whole round trip is what Django forms are for.

Here's the mental model to carry through everything below: **a form is a translator that sits between messy HTTP and clean Python.** A browser sends form submissions as a flat bag of strings — `title=Hello&body=Nice+post`. Your `Comment` model wants real, validated Python values. The form stands in the middle: it renders the HTML inputs going *out*, then on the way *in* it parses those raw strings, validates them, and hands you back clean Python values (or a tidy list of errors to show the user). You declare *what* you want; the form does the tedious, error-prone middle work.

📝 Without a form, you'd be doing all of that by hand: writing the `<input>` tags, reading `request.POST["body"]`, checking it isn't blank, checking it isn't 5000 characters, converting types, and rebuilding the page with error messages when something's wrong — on every single form, forever. The `forms` framework is Django saying "you've described the shape of your data already; let me handle the plumbing."

## Why Django forms

A **`Form` class** is where you declare the fields you expect. It looks a lot like a model, on purpose — each attribute is a field with a type and some rules:

```python
# blog/forms.py
from django import forms

class CommentForm(forms.Form):
    author = forms.CharField(max_length=80)
    body = forms.CharField(widget=forms.Textarea)
    email = forms.EmailField(required=False)
```

*What just happened:* you declared a form with three fields. Each one carries both a *type* and *validation rules* baked in. `CharField(max_length=80)` will render a text input and later reject anything over 80 characters. `EmailField` renders a text input but checks the value actually looks like an email. `required=False` makes `email` optional — by default every field is required. Notice you wrote zero HTML and zero validation logic: the field types *are* the spec, and Django reads that spec to both build the inputs and check the answers.

💡 The `widget=` argument controls *how* a field is rendered without changing *what* it accepts. `CharField` normally renders a single-line `<input>`; `widget=forms.Textarea` swaps that for a multi-line `<textarea>`, which is what you want for a comment body. Same data, different box.

## `ModelForm` — forms from models

The plain `Form` above works, but look closely and you'll spot a problem: those fields mirror your `Comment` model from Phase 3. You'd be writing `author`, `body`, `email` *twice* — once in `models.py`, once in `forms.py` — and keeping them in sync by hand forever. That's exactly the duplication Django hates.

📝 **`ModelForm` builds a form straight from a model.** You point it at the model, list the fields you want, and Django reads the model's field definitions to generate the form — types, max lengths, and all. The model goes back to being the single source of truth it was always meant to be.

```python
# blog/forms.py
from django import forms
from .models import Comment

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ["author", "body", "email"]
```

*What just happened:* the inner `class Meta` tells the `ModelForm` two things — which `model` to mirror (`Comment`) and which `fields` to include. Django inspects the `Comment` model and generates a matching form field for each name in the list: the model's `CharField(max_length=80)` becomes a form `CharField(max_length=80)` automatically. You didn't redeclare a single field. Change the model later — bump a `max_length`, add a field — and the form follows along when you update the `fields` list.

💡 The real payoff comes at save time: a `ModelForm` knows how to turn its cleaned data into a model instance. After validation you call `form.save()` and it **creates the `Comment` object for you** and writes it to the database — no manual `Comment(author=..., body=...)` construction. Less code, less drift, fewer bugs. (Listing fields explicitly beats the shortcut `fields = "__all__"` — that one quietly exposes *every* model field to user input, which is how you accidentally let someone set `is_approved=True` on their own comment.)

## The view pattern (GET vs POST)

A form needs a view to drive it, and Django has one canonical shape for that view. The same URL does double duty depending on the HTTP method: a **GET** request means "show me the form," and a **POST** request means "here's my filled-in form, process it." One view, two jobs, branching on `request.method`.

```python
# blog/views.py
from django.shortcuts import render, redirect, get_object_or_404
from .models import Post
from .forms import CommentForm

def add_comment(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    if request.method == "POST":
        form = CommentForm(request.POST)        # bind the submitted data
        if form.is_valid():
            comment = form.save(commit=False)   # build, don't save yet
            comment.post = post                 # attach it to this Post
            comment.save()                      # now write to the DB
            return redirect("post_detail", post_id=post.id)
    else:
        form = CommentForm()                    # GET: an empty, blank form

    return render(request, "blog/add_comment.html", {"form": form, "post": post})
```

*What just happened:* on a **GET**, the `else` branch runs and builds an empty `CommentForm()` — a blank form to render. On a **POST**, you create a *bound* form by passing `request.POST` (the submitted data) into `CommentForm(request.POST)`, then ask `form.is_valid()`. If it's valid, `form.save(commit=False)` builds the `Comment` object *without* hitting the database yet — that pause lets you attach the parent `post` (which the form never asked the user for) before the real `comment.save()`. Then you **redirect**. If validation *fails*, `is_valid()` is `False`, the `if` is skipped, and execution falls through to the same `render()` at the bottom — but now `form` is the bound form, carrying the user's input *and* the error messages, so the page re-renders with both.

⚠️ **Always redirect after a successful POST** — that's the Post/Redirect/Get pattern, and it's not optional politeness. If you rendered a page directly after saving instead of redirecting, the browser would still have the POST "loaded," and a refresh (or back button) would re-submit it — posting the same comment twice, three times, however many times the reader hits F5. Redirecting sends the browser to a fresh GET, so a refresh just reloads a harmless page. Save, then redirect. Every time.

## Validation

The line `if form.is_valid():` is doing a lot of quiet work, so let's open it up. Calling **`is_valid()`** runs every field's checks — required-ness, max lengths, type conversion (a date string becomes a real `date`, an `EmailField` confirms the `@`). It returns `True` or `False`, and as a side effect it populates two things: **`form.cleaned_data`** (a dict of the validated, type-converted Python values) on success, and **`form.errors`** (per-field error messages) on failure.

📝 The rule of thumb: **never read `request.POST` for real values — read `form.cleaned_data`.** `request.POST["body"]` gives you the raw submitted string, untouched and unvalidated. `form.cleaned_data["body"]` gives you the value *after* it survived validation. The form is the translator; `cleaned_data` is its output.

For rules a field type can't express on its own, you write a **`clean_<field>()`** method for one field, or a **`clean()`** method for rules that span several fields:

```python
# blog/forms.py
from django import forms
from .models import Comment

BANNED = {"spam", "buy-now", "free-money"}

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ["author", "body", "email"]

    def clean_body(self):
        body = self.cleaned_data["body"]
        if any(word in body.lower() for word in BANNED):
            raise forms.ValidationError("That comment looks like spam.")
        return body
```

*What just happened:* Django automatically calls `clean_body()` during `is_valid()`, after the built-in field checks have already passed (so `self.cleaned_data["body"]` is guaranteed present). You inspect the value; if it smells like spam you `raise forms.ValidationError(...)` with a human message; otherwise you **return the value** — and that return is mandatory, because whatever `clean_body` returns becomes the final `cleaned_data["body"]`. When you raise instead, validation fails, `is_valid()` flips to `False`, and your message lands in `form.errors["body"]` automatically. For cross-field rules — say, "if you supply an email it must match a registered account" — you'd override `clean()` instead, where the *whole* `cleaned_data` dict is available at once.

💡 You almost never have to wire error messages into the template by hand. Because failed validation routes everything into `form.errors`, and rendering the form (next section) prints those errors next to the fields they belong to, the round-trip just works: bad input bounces back to the user, annotated, with their other answers preserved.

## CSRF protection

There's one last piece, and Django will *refuse to process your POST without it*. If you build the template form and leave this out, you'll hit a `403 Forbidden` — so let's understand why before it bites you.

📝 **CSRF stands for Cross-Site Request Forgery:** an attack where a malicious page tricks your *already-logged-in* browser into firing a request at your site — submitting a form, changing a password — riding on the cookies you already have. The browser happily attaches your session, so the server can't tell the forged request from a real one.

⚠️ Django's defense is the **`{% csrf_token %}` tag**. It drops a hidden, per-session secret token into your form's HTML, and Django checks that the token comes back on every POST. An attacker's page on another domain can forge the *request* but can't read your token (the browser's same-origin rules stop it), so the forged POST arrives without a valid token and Django rejects it. This is the same family of trust-the-input problem as the injection bugs in [SQL Injection & XSS](/guides/sql-injection-and-xss) — the fix, again, is to demand proof that the data really came from where it claims.

Here's the template that renders the form, token included:

```html
<!-- blog/templates/blog/add_comment.html -->
{% extends "blog/base.html" %}

{% block content %}
  <h2>Comment on "{{ post.title }}"</h2>

  <form method="post">
    {% csrf_token %}
    {{ form.as_p }}
    <button type="submit">Post comment</button>
  </form>
{% endblock %}
```

*What just happened:* `{% csrf_token %}` renders the hidden token input that Django will verify on submit — leave it out and the POST is rejected. `{{ form.as_p }}` renders every field as a paragraph, *including its label, its input, and any error messages* from `form.errors` — so a bounced-back invalid form shows its complaints with zero extra markup from you. The `<form method="post">` plus the submit button complete the loop: the browser bundles the inputs and posts them straight to the view you wrote above.

💡 Step back and look at the whole chain you've built across this guide: you defined a `Comment` **model** once (Phase 3), and from that one definition you got your database **schema** (Phase 3), a working **admin** interface (Phase 4), auto-escaped **templates** (Phase 5), and now a **validated form** — nearly for free. Model → form → template is Django's central bargain: describe your data well in one place, and the framework spends that description over and over on your behalf.

## Recap

- A **`Form`** class declares the fields you expect; Django uses that one declaration to render the HTML inputs going out and to parse + validate the submitted strings coming in. A form is a translator between messy HTTP and clean Python.
- A **`ModelForm`** builds itself from a model via `class Meta: model = ...; fields = [...]`, so the model stays the single source of truth — and `form.save()` creates the object for you.
- The canonical view branches on method: **GET** shows an empty form; **POST** binds `request.POST`, and `if form.is_valid():` saves and **redirects** (Post/Redirect/Get) — else it re-renders with errors.
- **`is_valid()`** runs the checks and fills **`cleaned_data`** (validated values — read these, never raw `request.POST`) or **`form.errors`**. Add `clean_<field>()` for one field or `clean()` for cross-field rules; `raise forms.ValidationError(...)` to reject.
- **`{% csrf_token %}`** is mandatory in every POST form — it proves the submission came from your own page and blocks Cross-Site Request Forgery. Without it, Django returns `403`.
- The model → form → template chain means one good model definition gives you schema, admin, *and* a validated form with very little extra code.

## Quick check

```quiz
[
  {
    "q": "After a successful POST that saves a new comment, why does the view return redirect(...) instead of render(...)?",
    "choices": ["redirect is faster than render", "It follows Post/Redirect/Get so a browser refresh won't re-submit the form", "render can't be used after form.save()"],
    "answer": 1,
    "explain": "Rendering directly after a POST leaves the POST 'loaded' in the browser, so a refresh re-submits and creates duplicate comments. Redirecting sends the browser to a fresh GET, making refresh harmless."
  },
  {
    "q": "Inside a custom clean_body() method, where do you read the field's value and what must the method do on success?",
    "choices": ["Read request.POST['body'] and return None", "Read self.cleaned_data['body'] and return the value", "Read form.errors['body'] and raise it"],
    "answer": 1,
    "explain": "clean_<field>() reads the validated value from self.cleaned_data and must return it — that return becomes the final cleaned value. Raising forms.ValidationError instead marks the field invalid."
  },
  {
    "q": "You submit a POST form but forgot {% csrf_token %} in the template. What happens?",
    "choices": ["The form saves normally; the token is optional", "Django returns 403 Forbidden because the CSRF check fails", "The browser strips the form before sending"],
    "answer": 1,
    "explain": "Django requires a valid CSRF token on every POST to block Cross-Site Request Forgery. Without {% csrf_token %} the token is missing, the check fails, and you get a 403."
  }
]
```

---

[← Phase 5: Templates & the MTV Pattern](05-templates-and-mtv.md) · [Guide overview](_guide.md) · [Phase 7: The ORM, Deeper →](07-the-orm-deeper.md)
