---
title: "Building a JSON API with Flask"
guide: "flask-from-zero"
phase: 8
summary: "Turn your notes app into a JSON API: return jsonify instead of templates, read request bodies, set status codes, serve JSON errors, and decide plainly when Flask fits versus FastAPI."
tags: [flask, json-api, jsonify, rest, api, error-handling, flask-vs-fastapi]
difficulty: intermediate
synonyms: ["flask json api", "flask jsonify", "flask rest api", "flask api error handling", "flask return json", "flask vs fastapi api", "flask api status codes"]
updated: 2026-07-10
---

# Building a JSON API with Flask

Everything you've built so far hands back HTML. A view runs `render_template`, the browser gets a page, a human reads it - the right shape when the *consumer* is a person looking at a screen. But notes don't only get read by people: a mobile app might want them, a React frontend might fetch them, another service might sync them. None of those wants a styled HTML page - they want raw data, JSON.

📝 **An API and a web page are the same Flask app wearing two different hats.** Same routing, same view functions, same request cycle - the *only* thing that changes is what a view returns. Return `render_template(...)` and you've served a page for a human. Return `jsonify(...)` and you've served data for a program. Flask was never "a web-page framework" - it's a request-to-response framework, and JSON is just another kind of response. This phase swaps the hat.

If "GET, POST, paths, status codes, resources" aren't yet second nature, read [REST APIs explained](/guides/rest-apis-explained) alongside this.

## HTML for humans, JSON for programs

The split is worth making concrete. So far a note route looked like this:

```python
@app.route("/notes/<int:note_id>")
def show_note(note_id):
    note = Note.query.get_or_404(note_id)
    return render_template("note.html", note=note)
```

*What just happened:* this fetches a `Note` (the model from [Phase 5](05-database-with-sqlalchemy.md)) and renders it into an HTML template - perfect for a browser, useless to a program that just wants title and content as data.

The API version of that same idea returns the note *as data*:

```python
from flask import jsonify

@app.route("/api/notes/<int:note_id>")
def get_note(note_id):
    note = Note.query.get_or_404(note_id)
    return jsonify({"id": note.id, "title": note.title, "content": note.content})
```

*What just happened:* same fetch, different return. `jsonify(...)` takes a Python dict, serializes it to a JSON string, and sets the `Content-Type: application/json` header so the client knows what it's receiving. The two routes coexist in one app: `/notes/<id>` serves a page, `/api/notes/<id>` serves the data. 💡 The `/api` prefix is just a convention; Flask doesn't treat it specially.

## JSON endpoints: reading and writing data

📝 **Flask has no built-in serializer.** It won't magically turn a `Note` object into JSON - `jsonify(note)` would fail, because Flask doesn't know which fields you want or how to format them. *You* decide the shape by converting the model to a plain dict yourself. A small helper keeps that in one place:

```python
def note_to_dict(note):
    return {"id": note.id, "title": note.title, "content": note.content}
```

*What just happened:* one function that defines your API's note shape. Every endpoint that returns a note goes through it, so the JSON stays consistent. This hand-serialization is the price of Flask's minimalism - later we'll see the extension that automates it.

Now the read-the-collection endpoint:

```python
@app.route("/api/notes")
def list_notes_api():
    notes = Note.query.all()
    return jsonify([note_to_dict(n) for n in notes])
```

*What just happened:* `Note.query.all()` pulls every note as objects, the comprehension runs each through `note_to_dict`, and `jsonify` serializes the resulting list. A client hitting this gets:

```http
GET /api/notes
```

```json
[
  {"id": 1, "title": "Groceries", "content": "milk, eggs, bread"},
  {"id": 2, "title": "Ideas", "content": "write the Flask guide"}
]
```

*What just happened:* a clean JSON array, ready for any program to parse.

Creating a note is the interesting direction, because now data flows *in*. A browser form sends `request.form`, but an API client sends a JSON body, read with `request.get_json()`:

```python
from flask import request

@app.route("/api/notes", methods=["POST"])
def create_note_api():
    data = request.get_json()
    note = Note(title=data["title"], content=data["content"])
    db.session.add(note)
    db.session.commit()
    return jsonify(note_to_dict(note)), 201
```

*What just happened:* `request.get_json()` parses the incoming JSON body into a Python dict - the API-client counterpart to `request.form`. You build a `Note` from it, then `add` + `commit` exactly as in [Phase 5](05-database-with-sqlalchemy.md). The return is a tuple: the created note as JSON, plus `201`, a *status code* that matters more than it looks.

A client creating a note sends and receives:

```http
POST /api/notes
Content-Type: application/json

{"title": "Read more", "content": "finish the Flask guide"}
```

```json
{"id": 3, "title": "Read more", "content": "finish the Flask guide"}
```

*What just happened:* the client posts a JSON body, your view reads it, saves it, and echoes back the created note with its real `id` filled in. That round-trip - send data, get the saved version back - is the bread and butter of a REST API.

## Status codes and JSON errors

The number a response carries is half its meaning. `200 OK` says "here's what you asked for." `201 Created` says "I made the thing you posted." `404 Not Found` says "no such note." A client *reads* these - your mobile app checks the status before it trusts the body. (The [HTTP & JSON API basics](/guides/http-and-json-api-basics) guide is the cheat sheet for which code means what.)

Returning a code is just the second item in a return tuple, as you saw with `201`. For a deliberate "not found," Flask gives you `abort`:

```python
from flask import abort

@app.route("/api/notes/<int:note_id>")
def get_note(note_id):
    note = Note.query.get(note_id)
    if note is None:
        abort(404)
    return jsonify(note_to_dict(note))
```

*What just happened:* `abort(404)` immediately stops the view and triggers Flask's 404 handling - no `return` needed, no risk of running the rest of the function on a `None`. (`get_or_404` from Phase 5 is the one-liner version of this exact pattern.)

⚠️ **Flask's default error responses are HTML pages, not JSON.** Out of the box, `abort(404)` sends back a little HTML document - fine for a browser, but a JSON client trying to `JSON.parse` an HTML page gets a parse error and no idea what went wrong. An API must answer errors in the same language as everything else: JSON. Fix this by registering an error handler:

```python
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404
```

*What just happened:* `@app.errorhandler(404)` tells Flask "when a 404 happens *anywhere*, run this instead of the default HTML page." Now every 404 - from `abort(404)`, `get_or_404`, or an unmatched route - comes back as `{"error": "Not found"}` with the right status code. Register the same for `400` and `500` and your API speaks one language end to end.

## Structuring an API as it grows

Two endpoints fit fine in one file. Twenty do not. The tool for that is the [blueprint from Phase 6](06-blueprints-and-app-factory.md) - group all your `/api` routes into one blueprint and register it under a shared prefix:

```python
from flask import Blueprint

api = Blueprint("api", __name__, url_prefix="/api")

@api.route("/notes")
def list_notes_api():
    return jsonify([note_to_dict(n) for n in Note.query.all()])
```

*What just happened:* the blueprint collects every API route under `/api` automatically - define `@api.route("/notes")` and it lives at `/api/notes`. Your API becomes one self-contained module, cleanly separated from the HTML side of the app.

And the hand-serialization? Flask's extension philosophy shows up again. 💡 The same "small core + chosen extensions" pattern from Flask-SQLAlchemy applies to APIs: **marshmallow** (or **Flask-Marshmallow**) defines schemas that serialize models to JSON *and* validate incoming data, killing the boilerplate of `note_to_dict` and manual lookups. **Flask-RESTful** offers a class-based structure for organizing resources. You don't need either to ship an API, but reaching for one as it grows is the natural next step.

## Flask vs FastAPI for APIs, plainly

You can absolutely build a real, production API with Flask - plenty of teams do, and you just saw how. But clarity matters more than loyalty: 💡 **FastAPI was *built* for APIs in a way Flask wasn't.**

Flask is a general web framework that does HTML and JSON equally well, with APIs as one thing among many. [FastAPI](/guides/fastapi-from-zero) made the API the *whole point*. The things you did by hand this phase - writing `note_to_dict`, validating `request.get_json()`, registering JSON error handlers, and documenting every endpoint - FastAPI does automatically from your type hints. One typed function declaration becomes validation, serialization, *and* interactive `/docs`, all kept in sync.

The clear dividing line:

- **Reach for Flask APIs** when you're already in a Flask app and want to add a JSON endpoint or two, when you want full manual control over every response, or when the API is a *side* of a larger HTML app.
- **Reach for FastAPI** when the API *is* the product - a backend serving a frontend or mobile app, a microservice, anything where validation and documentation carry real weight and you'd rather not hand-roll them.

Neither is "better." Flask trades automation for control and simplicity; FastAPI trades a stricter, type-hint-driven style for a huge amount of automation. Pick by what you're building.

## Recap

1. **An API is the same Flask app, different return value** - swap `render_template` for `jsonify`. Same routing, same request cycle; only the response shape changes (data for programs, not pages for humans).
2. **`jsonify` serializes a dict and sets the JSON content type**, but Flask has **no built-in model serializer** - you convert models to dicts yourself (a `note_to_dict` helper keeps the shape in one place).
3. **Read incoming JSON with `request.get_json()`** - the API counterpart to `request.form` - then save through `db.session` exactly as before.
4. **Status codes are part of the contract**: return `(body, 201)` on create, `abort(404)` when missing. ⚠️ Default Flask errors are HTML - register `@app.errorhandler` handlers so errors come back as JSON.
5. **Structure a growing API with a blueprint** under an `/api` prefix; **marshmallow / Flask-RESTful** are the extensions that automate serialization and validation - the extension pattern again.
6. **Flask can do APIs; FastAPI was built for them.** Use Flask APIs inside an existing Flask app or for full control; reach for [FastAPI](/guides/fastapi-from-zero) when the API is the product and you want validation, serialization, and docs for free.

## Quick check

Three questions on the ideas that have to stick before Phase 9:

```quiz
[
  {
    "q": "What is the core difference between a Flask view that serves an HTML page and one that serves a JSON API response?",
    "choices": [
      "Only what the view returns - render_template for a page, jsonify for data; the routing and request cycle are identical",
      "API views must use a completely separate Flask application object",
      "API views cannot use the database or models that HTML views use",
      "Flask needs a special 'API mode' enabled in config before JSON works"
    ],
    "answer": 0,
    "explain": "An API is the same Flask app wearing a different hat. Same routing, same view functions, same request cycle - the only change is returning jsonify(...) instead of render_template(...). The two can coexist in one app."
  },
  {
    "q": "You call abort(404) in an API endpoint, but your JSON client reports a parse error instead of a clean error message. Why?",
    "choices": [
      "Flask's default error responses are HTML pages - you must register an @app.errorhandler(404) that returns jsonify(...) so errors come back as JSON",
      "abort(404) is not a real Flask function and silently does nothing",
      "The client must send a special header to receive JSON errors",
      "404 errors can never return a body, so there is nothing for the client to parse"
    ],
    "answer": 0,
    "explain": "Out of the box Flask returns a small HTML page for errors. A JSON client trying to parse HTML fails. Registering @app.errorhandler(404) (and 400, 500) to return jsonify({\"error\": ...}), code makes the whole API speak JSON consistently."
  },
  {
    "q": "When is FastAPI the more natural choice over Flask for an API, according to this phase?",
    "choices": [
      "When the API is the product - and you want validation, serialization, and interactive docs generated automatically from type hints",
      "Always - Flask cannot build production APIs at all",
      "Only when you need to serve HTML pages alongside the API",
      "Only for tiny one-or-two-endpoint additions to an existing app"
    ],
    "answer": 0,
    "explain": "Flask can build real APIs, but FastAPI was built for them: type hints drive automatic validation, serialization, and /docs. Reach for Flask APIs inside an existing Flask app or for full control; reach for FastAPI when the API is the whole point."
  }
]
```

---

[← Phase 7: Sessions, Auth & Extensions](07-sessions-auth-and-extensions.md) · [Guide overview](_guide.md) · [Phase 9: Testing & Production →](09-testing-and-production.md)