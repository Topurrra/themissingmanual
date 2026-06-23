---
title: "Routing & Views"
guide: "flask-from-zero"
phase: 2
summary: "How Flask turns a URL into a response: dynamic URL segments with converters, branching on HTTP methods, reading the request object, returning the right kind of response, and keeping views thin."
tags: [flask, routing, views, url-parameters, request-object, http-methods, response]
difficulty: beginner
synonyms: ["flask routing", "flask url parameters", "flask request object", "flask http methods get post", "flask url_for", "flask return response", "flask dynamic routes"]
updated: 2026-06-22
---

# Routing & Views

In Phase 1 you got an app running and saw the headline move: `@app.route` maps a URL to a function, and
whatever the function returns becomes the page. That's the whole skeleton of Flask. This phase puts meat on
it. How do you handle `/notes/7` when the `7` changes every request? How does the *same* URL do one thing on
a `GET` and another on a `POST`? Where does the data a user submits actually live, and what are your options
for what to hand back?

The mental model to hold onto: **a Flask view is a function that receives a request and returns a response.**
That's it — that's the entire job. The decorator decides *which* requests reach your function (the URL and
the method). Inside, you read what you need off the incoming request, do some work, and return something
Flask knows how to turn into an HTTP response. Everything below is that one cycle, made concrete, using the
notes app we're building.

## Dynamic URLs — capturing part of the path

A route like `/notes` lists every note. But `/notes/7` should show *one* note — the one with id `7`. That
`7` is part of the path and it changes per request, so you can't bake it into the route string. You mark it
as a **variable segment** with angle brackets, then receive it as an argument to the view.

```python
@app.route("/notes/<int:note_id>")
def note_detail(note_id):
    return f"You asked for note #{note_id}"
```

*What just happened:* `<int:note_id>` is a placeholder. Flask matches `/notes/7`, pulls out the `7`, and
passes it to `note_detail` as the `note_id` argument. The name after the colon must match the parameter name
exactly — that's the wiring. The `int:` part is a **converter**: it tells Flask "this segment is an integer,"
so `note_id` arrives as the number `7`, not the string `"7"`, and a request like `/notes/banana`
doesn't match this route at all (Flask returns a 404 instead of handing your function garbage).

The built-in converters you'll reach for:

| Converter | Matches | Example |
|-----------|---------|---------|
| `<string:x>` | any text without a slash (**the default**) | `/notes/<title>` |
| `<int:x>` | a whole number, given to you as an `int` | `/notes/<int:note_id>` |
| `<path:x>` | text *including* slashes | `/files/<path:subpath>` |

⚠️ If you write `<note_id>` with **no converter**, you get `string` by default — so `note_id` arrives as the
text `"7"`, not the number `7`. That's a classic source of "why is my id a string?" bugs. When a segment is a
numeric id, say so: `<int:note_id>`.

## HTTP methods — same URL, different verbs

By default a route only answers `GET` requests (the verb a browser uses to *fetch* a page). But creating a
note is a `POST` — the verb for *submitting* data. The REST idea that the URL names the resource and the
method is the verb you apply to it (see [What a Framework Even Is](/guides/what-a-framework-even-is) and any
HTTP primer) shows up here directly: `/notes` is the collection, and one route can handle both "show me the
notes" (`GET`) and "add a note" (`POST`).

```python
from flask import request

notes = []  # stand-in storage until Phase 5 brings a real database

@app.route("/notes", methods=["GET", "POST"])
def notes_collection():
    if request.method == "POST":
        notes.append(request.form["title"])
        return f"Added a note. Now have {len(notes)}.", 201
    return "Your notes: " + ", ".join(notes)
```

*What just happened:* `methods=["GET", "POST"]` tells Flask this view answers *both* verbs — without it, a
`POST` to `/notes` would be rejected with a `405 Method Not Allowed`. Inside, `request.method` tells you
*which* verb you got, so you branch: on `POST` you read the submitted title and create a note; on `GET` you
list what's there. This **create-on-POST, list-on-GET** pattern on a single collection URL is the bread and
butter of web apps. (The `notes = []` list is throwaway in-memory storage so the example runs — real
persistence arrives in Phase 5.)

💡 The `201` in `return ..., 201` is the HTTP status code for "Created" — more on returning status codes in a
moment.

## The request object — where the incoming data lives

📝 **`flask.request`** is how your view reads everything about the request that came in. It's a single object
Flask hands you (technically per-request, but you import it once and use it anywhere inside a view). The parts
you'll use constantly:

| Attribute | Holds | From |
|-----------|-------|------|
| `request.args` | query-string values | `?q=...&sort=...` |
| `request.form` | submitted form fields | an HTML form's `POST` body |
| `request.json` | a parsed JSON body | an API client's `POST` |
| `request.method` | the HTTP verb | `GET`, `POST`, ... |
| `request.headers` | request headers | `User-Agent`, `Authorization`, ... |

Here's reading a **query parameter** (the part after `?` in the URL) — handy for search and filtering:

```python
@app.route("/search")
def search():
    term = request.args.get("q", "")
    matches = [n for n in notes if term.lower() in n.lower()]
    return f"Notes matching '{term}': {matches}"
```

*What just happened:* a request to `/search?q=milk` lands here, and `request.args.get("q", "")` pulls the
`milk` out of the query string. Using `.get("q", "")` instead of `request.args["q"]` means a missing `?q=`
gives you the empty-string default rather than a `400 Bad Request` — `request.args` behaves like a dict, and
`.get` with a fallback is the forgiving way to read optional values.

And reading a **form field** from a submitted body:

```python
@app.route("/notes/new", methods=["POST"])
def create_note():
    title = request.form.get("title", "Untitled")
    notes.append(title)
    return f"Created: {title}", 201
```

*What just happened:* when an HTML form `POST`s to `/notes/new`, the field named `title` shows up in
`request.form`, and `request.form.get("title", "Untitled")` reads it with a fallback. ⚠️ `request.args` and
`request.form` are *different* buckets: `args` is the URL's query string, `form` is the request body. Reading
from the wrong one is a common "why is this empty?" moment. We'll build real HTML forms — and validate them —
in [Forms & Request Data](04-forms-and-request-data.md); for now, just know where the data lands.

## Returning responses — your options for what to hand back

A view's return value becomes the HTTP response, and Flask is flexible about what it accepts:

```python
from flask import jsonify, redirect, url_for, abort

@app.route("/notes/<int:note_id>")
def note_detail(note_id):
    if note_id >= len(notes):
        abort(404)                              # 1. bail out with an error page
    return f"<h1>{notes[note_id]}</h1>"         # 2. a string → HTML body

@app.route("/api/notes")
def api_notes():
    return jsonify(notes)                       # 3. Python data → JSON response

@app.route("/notes/<int:note_id>/delete", methods=["POST"])
def delete_note(note_id):
    del notes[note_id]
    return redirect(url_for("api_notes"))       # 4. send the browser elsewhere
```

*What just happened:* four ways to respond, all from plain `return`:

1. **`abort(404)`** stops the view immediately and makes Flask return its standard `404 Not Found` page (any
   status works — `abort(403)`, etc.). It's the clean way to say "this doesn't exist."
2. **A string** becomes the response body, served as HTML — exactly what you saw in Phase 1.
3. **`jsonify(notes)`** turns Python data (a list, a dict) into a proper JSON response with the right
   `Content-Type` header. This is the seed of the JSON API in [Building a JSON API](08-building-a-json-api.md).
4. **`redirect(url_for("api_notes"))`** sends the browser to another URL — the standard move after a
   successful `POST` so a refresh doesn't re-submit.

You can also return a **tuple** to set the status code, as you saw: `return "Created", 201`. Body first,
status second.

📝 Notice `url_for("api_notes")` in that redirect. **`url_for` builds a URL from the *view function's name*,
not a hardcoded path.** You pass it `"api_notes"` (the function), and Flask returns `/api/notes`. For routes
with variable segments you pass the values as keyword arguments: `url_for("note_detail", note_id=7)` gives
you `/notes/7`.

⚠️ Don't hardcode URLs like `redirect("/api/notes")`. The day you change the route string to `/v2/notes`,
every hardcoded path silently breaks, while `url_for("api_notes")` keeps working because it's tied to the
function, not the text of the path. Build URLs with `url_for` and let Flask keep them in sync.

## The flow — and why views stay thin

💡 Step back and see the whole cycle, because it never changes: **Flask matches the incoming URL to a view
function, hands that function the request, and sends back whatever the function returns.** Match → call →
respond. That's the entire job of the framework's core — the same request/response loop every framework runs,
laid bare here (which is exactly the point made in
[What a Framework Even Is](/guides/what-a-framework-even-is)). Routing, the request object, and response
helpers are just the three sides of that one loop.

Because the view *is* that seam, ⚠️ **keep it thin.** A good view does three things and stops: parse what it
needs from the request, call a function that does the actual work, and return a response. The business
logic — how a note is validated, how it's saved, how a search actually ranks — belongs in plain functions or
modules you call *from* the view, not stuffed inside it. Database access especially lives elsewhere (that's
[Working with a Database](05-database-with-sqlalchemy.md)).

```python
# thin view: parse → delegate → respond
@app.route("/notes/new", methods=["POST"])
def create_note():
    title = request.form.get("title", "")
    note = add_note(title)                 # the real work lives in add_note()
    return redirect(url_for("note_detail", note_id=note.id))
```

*What just happened:* the view reads one field, calls `add_note` (a regular function that owns the logic),
and redirects. It stays readable, and `add_note` stays testable on its own without faking a web request.
This discipline pays off as the app grows — and it sets up the next piece: right now your views return raw
HTML strings, which gets ugly fast. Next phase we hand that job to **templates**.

## Recap

1. **Dynamic URLs** use angle brackets: `<int:note_id>` captures a path segment and passes it to the view.
   Converters (`int`, `string`, `path`) type and constrain the match — ⚠️ no converter means `string` by
   default, so numeric ids arrive as text unless you write `<int:...>`.
2. **HTTP methods** are declared with `methods=["GET", "POST"]`; branch on `request.method` to do "list on
   GET, create on POST" from a single collection URL.
3. **`flask.request`** carries the incoming data: `request.args` (query string), `request.form` (form body),
   `request.json`, `request.headers`, `request.method`. Use `.get(key, default)` for optional values.
4. **Responses** come from `return`: a string (HTML), a `(body, status)` tuple, `jsonify(...)` for JSON,
   `redirect(url_for(...))` to send the browser elsewhere, or `abort(404)` to bail out with an error.
5. 📝 **`url_for("view_name")`** builds URLs from the view function's name — ⚠️ never hardcode paths, or
   they break the moment a route changes.
6. 💡 The whole framework core is one loop: **match the URL → call the view with the request → return a
   response.** Keep views thin — parse, delegate to real functions, respond.

You can now route any request and return the right kind of response. Next we stop returning HTML strings by
hand and let Jinja2 templates do it properly.

## Quick check

Make sure the request → response cycle stuck:

```quiz
[
  {
    "q": "You write `@app.route(\"/notes/<note_id>\")` (no converter) and request `/notes/7`. What is `note_id` inside the view?",
    "choices": [
      "The string \"7\", because with no converter the default is `string`",
      "The integer 7, because Flask detects it's numeric",
      "A 404 error, because the route doesn't match",
      "None, because you forgot the `int:` converter"
    ],
    "answer": 0,
    "explain": "With no converter, Flask uses `string` by default, so `note_id` is the text \"7\". Write `<int:note_id>` to receive a real integer."
  },
  {
    "q": "A user submits an HTML form with a field named `title` via POST. Where do you read it?",
    "choices": [
      "`request.form[\"title\"]` (or `.get`) — form fields live in the request body",
      "`request.args[\"title\"]` — all submitted values live in args",
      "`request.headers[\"title\"]`",
      "`request.method[\"title\"]`"
    ],
    "answer": 0,
    "explain": "Submitted form fields live in `request.form` (the request body). `request.args` is the URL query string (`?q=...`) — a different bucket."
  },
  {
    "q": "Why is `redirect(url_for(\"api_notes\"))` better than `redirect(\"/api/notes\")`?",
    "choices": [
      "`url_for` builds the URL from the view function's name, so it keeps working if you change the route's path string",
      "`url_for` is faster because it skips URL parsing",
      "Hardcoded paths cause a 404 in production but work in development",
      "There's no difference; both are equally fine"
    ],
    "answer": 0,
    "explain": "`url_for` ties the URL to the view function, not the literal path. Change the route to `/v2/notes` and `url_for` still resolves correctly, while a hardcoded `/api/notes` silently breaks."
  }
]
```

---

[← Phase 1: What Flask Is & Your First App](01-what-flask-is.md) · [Guide overview](_guide.md) · [Phase 3: Templates with Jinja2 →](03-templates-with-jinja.md)