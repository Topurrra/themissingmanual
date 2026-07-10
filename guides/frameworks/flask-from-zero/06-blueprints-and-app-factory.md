---
title: "Blueprints & the App Factory"
guide: "flask-from-zero"
phase: 6
summary: "One app.py stops scaling. Flask's answer is blueprints (modular route groups) plus the app factory — a create_app() function that wires extensions and breaks the classic circular-import trap."
tags: [flask, blueprints, app-factory, project-structure, application-context, config, modular]
difficulty: advanced
synonyms: ["flask blueprints", "flask app factory pattern", "flask project structure", "flask application context", "flask circular import", "flask config", "flask modular app"]
updated: 2026-07-10
---

# Blueprints & the App Factory

Your notes app works. It persists, it does CRUD, it renders templates — and it all lives in one `app.py` that's quietly getting longer every phase. Routes, models, config, and the `db` object are all piling into a single module, and the day you add login, then tags, then an API, it becomes a 600-line scroll where everything imports everything and you're afraid to touch any of it.

📝 **A growing Flask app is organized by two ideas: blueprints split your routes into modules, and an app factory builds the app inside a function instead of at the top of a file.** Neither is exotic — they're the structure essentially every non-trivial Flask app converges on, and what lets Flask grow past the toy stage without collapsing under its own imports.

## The one-file problem

⚠️ A real app outgrows a single `app.py`. Think about what's accumulated in yours: the `Flask(__name__)` instance, the `db` config and setup, the `Note` model, every `@app.route`, the form handling. That's tolerable at five routes. At fifty — spread across notes, auth, tags, and an API — it's a single file where unrelated features sit shoulder to shoulder, and where the `app` object created at the top gets imported by everything below it.

That last detail is the real trap, and we'll come back to it. Flask's answer is two patterns: **blueprints** carve the routes into modules, and the **app factory** turns the app's creation into a function.

## Blueprints: a mini-app you register

📝 **A Blueprint is a group of related routes (and their templates and static files) that you define separately, then *register* onto the app.** Think of it as a self-contained module of the application — a `notes` blueprint, an `auth` blueprint, a `tags` blueprint — each a little bundle of views that knows nothing about the others. You build them in isolation and plug them into the app at the end.

The key shift: instead of decorating routes with `@app.route`, you decorate them with `@<blueprint>.route`. The blueprint collects the routes; the app doesn't even exist yet at this point in the file.

```python
# app/notes/routes.py
from flask import Blueprint, render_template, request, redirect, url_for
from app.models import Note, db

# Create the blueprint: a name, the import name, and an optional URL prefix.
notes_bp = Blueprint("notes", __name__, url_prefix="/notes")


@notes_bp.route("/")
def list_notes():
    notes = Note.query.all()
    return render_template("notes.html", notes=notes)


@notes_bp.route("/", methods=["POST"])
def create_note():
    note = Note(title=request.form["title"], content=request.form["content"])
    db.session.add(note)
    db.session.commit()
    return redirect(url_for("notes.list_notes"))
```

*What just happened:* `Blueprint("notes", __name__, url_prefix="/notes")` creates a route group named `"notes"`, and every route on it gets `/notes` prepended — so `@notes_bp.route("/")` is really `/notes/`. The routes look exactly like ones you already know, except they hang off `notes_bp` instead of `app`. Notice `url_for("notes.list_notes")` is now *namespaced* — a feature: two blueprints can each have a `list` view without colliding, because they're `notes.list` and `auth.list`.

A blueprint on its own does nothing — it's a definition sitting in a file. It only becomes live routes when the app registers it:

```python
app.register_blueprint(notes_bp)
```

*What just happened:* `register_blueprint` is the moment the blueprint's routes get copied onto the real app, prefix and all. Before this line, `notes_bp` is inert; after it, `GET /notes/` actually resolves to `list_notes`. You'll call `register_blueprint` once per blueprint, all in one place — inside the factory.

💡 If you've read the [Django guide](/guides/django-from-zero), this will feel familiar: a blueprint is Flask's rough equivalent of a Django **app** — a focused, self-contained slice of features. Django apps are a framework convention with batteries attached; a blueprint is just a lightweight grouping you opt into. Same goal, much thinner mechanism.

## The app factory pattern

So blueprints handle the routes. But there's still that `app = Flask(__name__)` sitting at module level, created the instant the file is imported. The app factory changes that.

📝 **Instead of a module-level `app`, you write a `create_app()` function that builds the app, configures it, wires up extensions and blueprints, and returns it.** The app is no longer a global that springs into existence on import — it's something you *construct on demand* by calling a function.

```python
# app/__init__.py
from flask import Flask
from app.models import db


def create_app(config_object="config.DevConfig"):
    app = Flask(__name__)
    app.config.from_object(config_object)   # load settings (see below)

    db.init_app(app)                        # bind the extension to THIS app

    from app.notes.routes import notes_bp   # import here, on purpose
    app.register_blueprint(notes_bp)

    return app
```

*What just happened:* everything that used to live at the top of `app.py` now happens *inside a function*. `create_app` makes a fresh `Flask` instance, loads its config from an object, binds the database extension to that specific app with `db.init_app(app)`, registers the blueprints, and hands the finished app back. Nothing runs at import time — it runs when you *call* `create_app()`.

Two concrete payoffs. First, **you can build different apps from the same code.** Your tests can call `create_app("config.TestConfig")` for an app pointed at a throwaway database, while production calls `create_app("config.ProdConfig")` — same factory, different config, no globals to monkey-patch. Second, **no import-time side effects.** A module-level `app = Flask(...)` *does work the moment anyone imports the file*, which makes it surprisingly hard to test and reason about. The factory defers all of that until you ask for it.

💡 To run it, your entry point just calls the factory: `app = create_app()`. In development, `flask --app "app:create_app" run` calls the factory for you.

## The circular-import trap (and why the factory helps)

Now the payoff for that "import here, on purpose" comment — this is THE classic Flask structure bug, the one that bites nearly everyone the first time they split a file.

⚠️ Picture the naive version. `app.py` creates `app` and `db`, then imports your models so the routes can use them. But `models.py` needs `db` to define `Note(db.Model)` — so it imports `db` from `app.py`. Now `app.py` imports `models.py` and `models.py` imports `app.py`: a **circular import**. Python starts loading one, hits the import of the other, loops back to the first before it's finished defining `db`, and you get `ImportError: cannot import name 'db'` from a module that clearly defines `db`.

The factory pattern dissolves this. The trick is two-step: **create the extension object at module level, but *bind* it to an app inside the factory.**

```python
# app/models.py
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()                 # created here, NOT bound to any app yet


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, nullable=False)
```

*What just happened:* `db = SQLAlchemy()` with **no app argument** creates the extension in a detached state — it exists, models can inherit from `db.Model`, but it isn't tied to any particular Flask app. This is the linchpin: `models.py` now imports only from `flask_sqlalchemy`, never from your app module, so there's no cycle to form. The binding happens later, in the factory, with `db.init_app(app)` — the line that finally says "this `db` belongs to *this* app."

The blueprint gets imported in `create_app` *inside* the function, not at the top of the file. That import only runs when the factory runs — well after `db` and the app are set up — so the routes can safely import `db` without tripping the cycle. 💡 The rule of thumb: extension objects live at module level (unbound), models import only the extension, and the factory does the binding and the blueprint imports.

## Config & the application context

The factory loaded config with `app.config.from_object(...)`. 📝 **`app.config` is a dictionary of every setting your app needs** — the database URI, the secret key, debug flags — and the clean way to fill it is from a *config class*, one per environment:

```python
# config.py
import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")


class DevConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///notes.db"
    DEBUG = True


class ProdConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"]
    DEBUG = False
```

*What just happened:* a base `Config` holds shared settings, and `DevConfig`/`ProdConfig` inherit and override what differs. The factory picks one by name, so switching environments is a one-argument change — and secrets like `SECRET_KEY` and the production database URL come from environment variables, never hard-coded into the repo. (Non-negotiable; the [Secrets Management](/guides/secrets-management) guide explains why a committed secret is a compromised secret.)

📝 **The application context is how your code finds "the current app" without importing it.** Once you have multiple possible apps (dev, test, prod) built by a factory, there's no single global `app` to reach for — so Flask, during each request, makes the active app available through two objects: `current_app` (the app handling this request) and `g` (a scratchpad for per-request data). That's why Phase 5's `db.create_all()` had to run inside `with app.app_context():` — it needed to know *which* app's database to build.

Put it all together and a grown-up Flask project has a predictable shape:

```text
notes/                       ← project root
├── config.py                ← Config classes (Dev / Prod / Test)
├── run.py                   ← entry point: app = create_app()
├── app/
│   ├── __init__.py          ← create_app() lives here (the factory)
│   ├── models.py            ← db = SQLAlchemy() + the Note model
│   ├── notes/
│   │   └── routes.py        ← notes_bp blueprint + its views
│   ├── auth/
│   │   └── routes.py        ← auth_bp blueprint (Phase 7)
│   └── templates/           ← Jinja templates
└── tests/                   ← create_app("config.TestConfig")
```

*What just happened:* the responsibilities are now physically separated. `config.py` holds settings, `app/__init__.py` is the factory that assembles everything, `models.py` owns the database, and each feature (`notes`, `auth`) is a blueprint in its own folder with its own routes. `tests/` builds its own app against a test config. Every file here has one job, and you can open `notes/routes.py` knowing it's *only* about notes.

💡 Blueprints + the app factory are the structure every serious Flask app uses — not because a framework forces it, but because it's what makes a Flask app *scale*. The same small-core-plus-extensions philosophy that added a database in Phase 5 lets you grow the app itself: modular pieces, assembled on demand, with no global app and no circular imports.

## Recap

1. ⚠️ **One `app.py` doesn't scale** — routes, models, config, and a module-level `app` piling into a single file becomes unworkable (and import-fragile) as features grow. Blueprints + the app factory are the fix.
2. **A blueprint is a modular group of routes** you define with `@blueprint.route`, then `app.register_blueprint(...)` to make live. `url_for` becomes namespaced (`notes.list_notes`). It's Flask's lightweight equivalent of a Django app.
3. **The app factory** is a `create_app(config)` function that builds, configures, and returns the app — instead of a module-level global. It lets you create per-environment apps (test vs prod) and avoids import-time side effects.
4. ⚠️ **The circular-import trap** (models import `app`, `app` imports models) is broken by creating extensions unbound at module level (`db = SQLAlchemy()`), binding inside the factory (`db.init_app(app)`), and importing blueprints *inside* `create_app`.
5. **Config comes from classes** (`app.config.from_object("config.DevConfig")`) with secrets pulled from the environment; the **application context** (`current_app`, `g`) is how code finds the current app without importing a global — which is why `app.app_context()` exists.

## Quick check

Three questions on the ideas that have to stick before Phase 7:

```quiz
[
  {
    "q": "What is a Flask blueprint?",
    "choices": [
      "A modular group of related routes (and templates/static) you define separately, then register onto the app with app.register_blueprint()",
      "A configuration file that stores the app's secret key and database URL",
      "A replacement for the database model that describes table structure",
      "A built-in Flask feature that automatically generates an admin interface"
    ],
    "answer": 0,
    "explain": "A blueprint is a self-contained bundle of routes (plus its templates and static files) defined with @blueprint.route. It does nothing until app.register_blueprint() copies its routes onto the real app. It's Flask's lightweight equivalent of a Django app."
  },
  {
    "q": "Why use an app factory (a create_app() function) instead of a module-level app = Flask(__name__)?",
    "choices": [
      "It lets you build apps with different config (e.g. test vs prod) from the same code and avoids import-time side effects",
      "It makes the app run faster because Flask caches the global instance",
      "It is required by Flask — apps won't start without a factory function",
      "It automatically encrypts the SECRET_KEY before the app starts"
    ],
    "answer": 0,
    "explain": "A factory builds the app on demand, so tests can call create_app('config.TestConfig') and prod can call create_app('config.ProdConfig') from identical code. It also defers all setup until called, eliminating the import-time side effects a module-level app causes."
  },
  {
    "q": "What breaks the classic Flask circular-import trap between app.py and models.py?",
    "choices": [
      "Creating the extension unbound at module level (db = SQLAlchemy()) and binding it to the app inside the factory with db.init_app(app)",
      "Importing models at the very top of app.py before anything else runs",
      "Putting the Note model and all the routes back into a single app.py file",
      "Renaming the db variable to something unique in each module"
    ],
    "answer": 0,
    "explain": "The cycle forms when models import app and app imports models. The fix: create db = SQLAlchemy() unbound in models.py (which then imports only flask_sqlalchemy, no app), and bind it inside create_app() via db.init_app(app). Importing blueprints inside the factory keeps the cycle from forming too."
  }
]
```

---

[← Phase 5: Working with a Database](05-database-with-sqlalchemy.md) · [Guide overview](_guide.md) · [Phase 7: Sessions, Auth & Extensions →](07-sessions-auth-and-extensions.md)