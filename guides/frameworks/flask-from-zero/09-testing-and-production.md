---
title: "Testing & Production"
guide: "flask-from-zero"
phase: 9
summary: "Test your notes app in-process with Flask's test client and a pytest app-factory fixture, then ship it for real — behind gunicorn, not the dev server — with safe production config and a minimal Dockerfile."
tags: [flask, testing, test-client, pytest, gunicorn, wsgi, deployment]
difficulty: intermediate
synonyms: ["flask testing test client", "flask pytest", "flask gunicorn deployment", "flask wsgi production server", "flask dev server not for production", "flask docker", "flask production config"]
updated: 2026-07-10
---

# Testing & Production

You've built a real notes app — routes, a database, auth, an API. Two questions separate a side project from something you'd let other people touch: *how do I know I didn't break anything?* and *how do I run this so it's not just alive on my laptop?*

📝 **Testing and deployment are the same idea pointed in two directions: you want your app to run somewhere other than the place you built it.** A test runs your app in a throwaway, controlled environment to check its behavior. Production runs it in a hardened, public environment to serve real users. The thing that makes *both* clean — the payoff of all that structure from Phase 6 — is the app factory. `create_app()` lets you build a fresh app for a test, and a different fresh app for production, from the exact same code.

## The test client: call your app without a server

The fear most people have about testing a web app is that they'll need to start the server, fire HTTP requests at `localhost`, and tear it all down — slow, flaky, painful. Flask sidesteps that entirely.

📝 **`app.test_client()` gives you a fake browser that calls your app in-process — no running server, no network, no port.** You call `client.get("/notes")` or `client.post("/notes", data={...})` and Flask routes the request through your real view functions and hands you back a response object — a function call wearing an HTTP costume. Tests run *fast* and reliable.

If you've never written a test before, read [Your First Unit Test](/guides/your-first-unit-test) — it teaches the Arrange-Act-Assert shape we're about to use:

```python
def test_notes_page_loads(client):
    # Act: ask the app for the notes page
    response = client.get("/notes/")

    # Assert: check the status code and the body
    assert response.status_code == 200
    assert b"Notes" in response.data
```

*What just happened:* `client.get("/notes/")` runs the request through your app's routing and view function and returns a `response`. We check two things every view test checks: `response.status_code` (200? redirect 302? not found 404?) and `response.data` (the raw bytes of the body). `response.data` is **bytes**, not a string, so compare against a byte string or decode it first. That `client` argument isn't magic; it's a pytest fixture we're about to build.

## The app factory makes testing clean

Where does `client` come from? This is where Phase 6 pays off. 💡 **Because you have a `create_app(config)` factory, your tests can build a brand-new app wired to a TEST config — an in-memory database, CSRF turned off — and nothing about it touches your real app.**

A pytest **fixture** is a reusable bit of setup that tests can request just by naming it as an argument. We'll write two: one that builds a test app, and one that hands tests a client for it. Put them in `tests/conftest.py` (pytest auto-discovers fixtures there):

```python
# tests/conftest.py
import pytest
from app import create_app
from app.models import db


@pytest.fixture
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # throwaway DB
        "WTF_CSRF_ENABLED": False,                        # no CSRF tokens in tests
    })
    with app.app_context():
        db.create_all()      # build the schema in the in-memory DB
        yield app            # hand the app to the test
        db.drop_all()        # tear it down afterward


@pytest.fixture
def client(app):
    return app.test_client()
```

*What just happened:* the `app` fixture calls `create_app(...)` with a **test config dict** — an in-memory SQLite database (`sqlite:///:memory:`) that exists only for the test and vanishes after, plus `WTF_CSRF_ENABLED: False` so form-posting tests skip CSRF tokens. Inside an app context it creates the tables, `yield`s the app, then drops everything. The `client` fixture depends on `app` and returns `app.test_client()`. Now any test that names `client` gets a fresh, isolated app every time.

⚠️ **Never run your tests against your real database.** A test that calls `client.post(...)` to create a note, or exercises a delete route, will happily write to — or wipe — whatever database the app is pointed at. The in-memory test config gives tests their own disposable world.

(For this fixture to work, `create_app` needs to accept a config dict — a small tweak to the Phase 6 factory: `if isinstance(config, dict): app.config.update(config)` alongside the `from_object` path.)

## What to test

You don't need 100% coverage to get value. Aim at the things that *break in ways users notice*. For a Flask app, three layers:

```python
def test_create_note_redirects(client):
    response = client.post("/notes/", data={"title": "Buy milk", "content": "2%"})
    assert response.status_code == 302            # POST then redirect (PRG pattern)


def test_notes_requires_login(client):
    response = client.get("/notes/")              # not logged in
    assert response.status_code == 302            # bounced to the login page
    assert "/login" in response.headers["Location"]


def test_note_str(client):
    from app.models import Note
    note = Note(title="Hello", content="world")
    assert "Hello" in str(note)                   # plain model logic, no HTTP
```

*What just happened:* three kinds of test. The first checks a **view response** — posting a note should redirect (302), the classic Post/Redirect/Get pattern. The second checks **auth** — an unauthenticated request to a `login_required` route should redirect to `/login`, verified via the `Location` header. The third is **pure logic** on the model — no client, no HTTP.

💡 That ordering mirrors the **test pyramid**: lots of fast, cheap logic/model tests at the bottom, a solid middle layer of view tests, and only a few slow end-to-end tests up top. Most of your tests should be the cheap kind.

## Production: the dev server is NOT for production

This is the one rule from this phase that, if you remember nothing else, saves you from a real incident.

⚠️ **`flask run` and the underlying Werkzeug development server are for development only. Never put them in front of real users.** The dev server is single-threaded by default (one slow request blocks everyone), it's not built to survive hostile traffic, and Flask's own startup banner literally warns you: *"WARNING: This is a development server. Do not use it in a production deployment."* It will fall over under load, and has no business being on the public internet.

What you run instead is a real **WSGI server**. WSGI is the standard contract between a Python web app and the server that runs it — Flask speaks WSGI, and production-grade servers speak WSGI back. The most common one is **gunicorn**: battle-tested, multi-worker, boring in the best way.

```bash
gunicorn --workers 4 --bind 0.0.0.0:8000 "app:create_app()"
```

*What just happened:* gunicorn imports your `app` package, **calls your factory** (`create_app()`) to build the application, and serves it. `--workers 4` spins up four worker processes so four requests can be handled truly in parallel (a rough starting point is `2 × CPU cores + 1`). `--bind 0.0.0.0:8000` listens on port 8000 on all interfaces. In a typical deploy, **nginx** sits in front of gunicorn to terminate TLS, serve static files, and shield the app, but gunicorn runs your Python.

For the full story on getting this onto a server with a domain and HTTPS, see [Ship Your Side Project](/guides/ship-your-side-project). Dev server for `localhost`, gunicorn for the world.

## Config & Docker

Running the right server is half of "production." The other half is the right *config*. A production app is configured differently from your laptop in a few non-negotiable ways:

- ⚠️ **`DEBUG = False`.** With `DEBUG = True`, an unhandled error shows the visitor a full traceback *and* an interactive Werkzeug debugger console — which can execute arbitrary Python on your server. Debug mode in production is one of the most dangerous misconfigurations there is.
- ⚠️ **`SECRET_KEY` from the environment, never hard-coded.** It signs your session cookies; if committed to the repo, anyone who reads your code can forge logins.
- **A real database** (Postgres), not the SQLite file you developed against.
- **Static files served by nginx or a CDN**, not by Flask.

That's exactly what the `ProdConfig` class from Phase 6 encodes. The factory selects it, and you're configured safely with no code change.

To package the whole thing so it runs the same everywhere, wrap it in a container. Here's a minimal `Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run the app with gunicorn, NOT the Flask dev server
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:8000", "app:create_app()"]
```

*What just happened:* this builds on a slim Python base image, installs dependencies first (so Docker caches that layer and rebuilds stay fast), copies your code, and — crucially — its `CMD` launches **gunicorn**, not `flask run`. The container runs identically on your laptop, a teammate's machine, or a cloud host. If `FROM`, layers, and `CMD` are unfamiliar, [Docker Without the Magic](/guides/docker-without-the-magic) walks through each line.

💡 Clean testing and clean production config are *the same capability*. Both come from `create_app()` building a fresh, independently-configured app on demand — test config for pytest, prod config for gunicorn, dev config for your laptop. The factory you wrote in Phase 6 to dodge circular imports is the foundation that lets you both trust your app and ship it.

## Recap

1. 📝 **The test client calls your app in-process.** `app.test_client()` returns a fake browser — `client.get(...)` / `client.post(...)` run requests through your real views with no running server. Fast and reliable. Assert on `response.status_code` and `response.data` (which is bytes).
2. 💡 **The app factory makes tests clean.** A pytest fixture calls `create_app(test_config)` with an in-memory SQLite DB and CSRF off, builds the schema, yields a client, then tears down — a fresh isolated app per test. ⚠️ Never test against the real database.
3. **Test three layers:** view responses (status, redirects, content), auth (login-required routes redirect), and pure model/logic. Follow the test pyramid — mostly cheap, fast tests at the bottom.
4. ⚠️ **The dev server is not for production.** `flask run` / Werkzeug is single-threaded and insecure. Run behind a real WSGI server — **gunicorn** with multiple workers (`gunicorn "app:create_app()"`), typically with nginx in front.
5. ⚠️ **Production config is different and it matters.** `DEBUG = False` (debug mode leaks tracebacks and an RCE-capable console), `SECRET_KEY` and `DATABASE_URL` from the environment (never hard-coded), a real DB, static files via nginx/CDN — all selected by the factory's `ProdConfig`. A minimal Dockerfile runs gunicorn, not the dev server.

## Quick check

Three questions on the ideas that matter most before you ship:

```quiz
[
  {
    "q": "What does Flask's app.test_client() let you do?",
    "choices": [
      "Call your app in-process — routing requests through your real view functions — without starting a server or using the network",
      "Start a real development server on a random port and send it HTTP requests over the network",
      "Automatically generate test cases for every route in your application",
      "Connect your tests to the production database so they exercise real data"
    ],
    "answer": 0,
    "explain": "test_client() returns a fake browser that runs requests through your real views in-process — no server, no port, no network. That makes tests fast and reliable, and you assert on response.status_code and response.data (bytes)."
  },
  {
    "q": "Why should you never use flask run / the Werkzeug development server in production?",
    "choices": [
      "It's single-threaded and insecure — built for development, not hostile public traffic — so you run a real WSGI server like gunicorn instead",
      "It can only serve one route at a time regardless of how the app is written",
      "It refuses to start unless DEBUG is set to True, which is unsafe",
      "It doesn't support templates or static files, only JSON responses"
    ],
    "answer": 0,
    "explain": "The dev server is single-threaded by default and not hardened for public traffic — Flask itself warns against it. Production runs behind a real WSGI server like gunicorn (multiple workers), usually with nginx in front."
  },
  {
    "q": "Which production configuration setting is a serious security risk if you get it wrong?",
    "choices": [
      "DEBUG = True in production — it exposes tracebacks and an interactive debugger console that can run arbitrary code (an RCE risk)",
      "Setting --workers to a number higher than your CPU core count",
      "Serving static files through nginx instead of through Flask",
      "Using an in-memory SQLite database for the production app"
    ],
    "answer": 0,
    "explain": "With DEBUG = True, an unhandled error shows visitors a full traceback plus the Werkzeug interactive debugger, which can execute Python on your server — a remote-code-execution hole. Production must use DEBUG = False, and pull SECRET_KEY from the environment, never hard-code it."
  }
]
```

---

[← Phase 8: Building a JSON API with Flask](08-building-a-json-api.md) · [Guide overview](_guide.md) · [Phase 10: Where to Go Next →](10-where-to-go-next.md)