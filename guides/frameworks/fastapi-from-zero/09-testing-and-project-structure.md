---
title: "Testing & Project Structure"
guide: "fastapi-from-zero"
phase: 9
summary: "Test FastAPI in-process with TestClient, swap real dependencies for fakes via dependency_overrides, and grow past one giant main.py with APIRouter and a sane project layout."
tags: [fastapi, testing, testclient, pytest, dependency-override, apirouter, project-structure]
difficulty: intermediate
synonyms: ["fastapi testclient", "fastapi pytest", "fastapi dependency override testing", "fastapi apirouter structure", "fastapi project layout", "fastapi test database", "fastapi testing endpoints"]
updated: 2026-06-22
---

# Testing & Project Structure

The moment your Book API touches a real database and real auth, the temptation is to test it by spinning
up the server, opening `/docs`, and clicking around. That works exactly once, on your machine, on a good
day. It doesn't catch the bug you introduce next Tuesday, and it can't run in CI.

This phase is about two habits that travel together. First, how to test FastAPI *properly* — fast,
repeatable, in-process, no clicking. Second, how to lay out the project so it stays testable as it grows.
These aren't separate topics: the reason FastAPI is so pleasant to test is the exact design we've been
building toward — everything is a dependency — and that same design keeps the codebase from collapsing
into one unreadable file.

## The mental model: your app is a callable, not a server

📝 The single idea that unlocks FastAPI testing: **your app object is just a Python object you can call
directly.** You don't need a running server, a port, or a real HTTP socket to test an endpoint. FastAPI's
`TestClient` takes your `app`, sends a request *into it in-process*, and hands you back the response — all
inside the same Python process as your test.

That's why it's fast (no network, no process startup) and reliable (no "is the server up yet?"
flakiness). A test is just: build a client, call a route, check what came back — the same
Arrange-Act-Assert shape you'd use for any function; see [Your First Unit
Test](/guides/your-first-unit-test) for that shape from scratch.

## `TestClient`: calling your app like a function

`TestClient` comes from Starlette (the toolkit under FastAPI) and its API is modeled on the popular
`requests` library, so `.get()`, `.post()`, `.json()`, and `.status_code` all read the way you'd expect.

A complete, real test of the Book API. It needs the app object, so it's plain code (you can't run a
server inside the browser sandbox):

```python
# tests/test_books.py
from fastapi.testclient import TestClient
from app.main import app           # your FastAPI() instance

client = TestClient(app)

def test_list_books_returns_200_and_a_list():
    # Act: send a GET into the app, in-process
    response = client.get("/books")

    # Assert: status code AND the shape of the body
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_book_returns_201_with_the_title():
    payload = {"title": "Dune", "author": "Frank Herbert"}
    response = client.post("/books", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Dune"
    assert "id" in body          # the server assigned an id
```

*What just happened:* `TestClient(app)` wrapped your application so you can call it like an HTTP client
without any server running. `client.get("/books")` and `client.post("/books", json=...)` exercise the
*real* routing, the *real* Pydantic validation, the *real* response models — the whole stack from Phases
2–4 — and return a response object. You then assert on `status_code` and `response.json()`. We check more
than the status: a `201` with the wrong body is still a bug, so we assert the title round-trips and an
`id` was assigned. A genuine integration test, and it ran in milliseconds.

💡 Run these with `pytest` from your project root. It discovers any file named `test_*.py` and any
function named `test_*` inside it — no registration, no boilerplate:

```bash
pytest -q
```

A passing run looks like this:

```console
..                                                       [100%]
2 passed in 0.14s
```

## Dependency overrides: the testing superpower

Now the part that makes FastAPI testing genuinely special. [Phase 5](05-dependency-injection.md) promised
that because the database session, the current user, and everything else come in through `Depends()`,
your tests can *swap them out*. This is where you cash that promise.

📝 `app.dependency_overrides` is a dict that maps a dependency function to a replacement. When FastAPI is
about to call a dependency during a request, it checks this dict first — if there's an override, it calls
*that* instead. Your endpoint code doesn't change at all. It still asks for `get_session`; FastAPI just
quietly hands it the test double.

Two cases cover almost everything you'll ever need.

### Overriding the database with in-memory SQLite

You don't want tests hitting your real Postgres — slow, stateful, and one failing test can poison the
next. Point the session dependency at a fresh in-memory SQLite database that exists only for the test run:

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db import get_session     # the real dependency from Phase 7

@pytest.fixture
def client():
    # one in-memory DB, shared across connections for this test
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)   # build the Book tables fresh

    def get_session_override():
        with Session(engine) as session:
            yield session

    # the swap: real session -> throwaway in-memory one
    app.dependency_overrides[get_session] = get_session_override

    yield TestClient(app)

    # teardown: undo the swap so the next test starts clean
    app.dependency_overrides.clear()
```

*What just happened:* The fixture stands up a brand-new SQLite database in memory, creates the Book
tables on it, and defines `get_session_override` — a `yield` dependency with the same shape as the real
one, but backed by the throwaway engine. The line `app.dependency_overrides[get_session] =
get_session_override` is the whole trick: every endpoint that does `Depends(get_session)` now gets the
test database, with zero changes to the endpoints. Each test that asks for the `client` fixture gets its
own pristine database, so tests can't contaminate each other.

⚠️ Look at that last line — `app.dependency_overrides.clear()`. **Overrides are global state on the app
object.** If you set one and don't reset it, it leaks into every test that runs afterward, and you get
the worst kind of bug: tests that pass or fail depending on what ran *before* them. Always undo overrides
in teardown; putting the override inside a fixture (which auto-runs its teardown after each test) is the
clean way to guarantee that.

### Overriding `get_current_user` to test protected routes

Protected endpoints from [Phase 8](08-authentication-and-security.md) are the other classic case. You
don't want to mint real JWTs in a test just to check `POST /books` works — you want to *pretend* you're
logged in:

```python
# tests/test_protected.py
from app.main import app
from app.dependencies import get_current_user

def fake_current_user():
    return {"username": "test-reader", "role": "admin"}

def test_create_book_when_authenticated(client):
    app.dependency_overrides[get_current_user] = fake_current_user
    try:
        response = client.post("/books", json={"title": "1984", "author": "Orwell"})
        assert response.status_code == 201
        assert response.json()["title"] == "1984"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
```

*What just happened:* Instead of producing a valid token, you replaced the entire authentication
dependency with `fake_current_user`, which just returns a logged-in admin. The endpoint runs as if a real
user passed auth — no tokens, no password hashing, no headers to fake. The `try/finally` does the same job
as the fixture teardown above: it removes the override no matter what, so this test can't sabotage the
next one. This is how you test "what happens when an admin creates a book?" without dragging the whole
auth system into every test.

## The test pyramid, applied to this API

📝 Not every test should be an HTTP round-trip. The classic guidance — see
[Unit, Integration, E2E](/guides/unit-integration-e2e) — maps cleanly onto a FastAPI project:

- **Unit tests (the wide base).** Test pure functions and service logic *directly*, with no client and no
  app. If you have a `services.py` with `calculate_late_fee(book)` or `slugify_title(title)`, call it as a
  plain function and assert the result. Fastest and most numerous.
- **Integration tests (the middle).** Use `TestClient` to hit real endpoints against the in-memory test
  DB — what the examples above are. They prove routing, validation, the DB layer, and your response
  models all fit together. Most of your FastAPI tests live here.
- **End-to-end tests (the thin top).** A few tests against a *real* running server and a real (or
  containerized) database, exercising full flows like register → log in → create book → fetch it. Slow
  and more fragile, so keep them few and reserve them for critical paths.

💡 The honest rule of thumb: push logic down into plain functions you can unit-test, and use `TestClient`
for the seams where pieces meet. If you need an HTTP request just to test a calculation, that calculation
probably wants to be its own testable function.

## Project structure: escaping one giant `main.py`

⚠️ Every tutorial app starts as a single `main.py`, and that's fine — until it isn't. Once you have
books, authors, reviews, and auth, a 600-line `main.py` is where bugs hide and merge conflicts breed. You
can't find anything, and you can't test a slice of it in isolation.

📝 The fix is `APIRouter`. A router is a mini-FastAPI you can declare endpoints on, living in its own
module. You then *include* it into the main app — same routes, same behavior, just organized by feature.

A layout that scales without being over-engineered:

```text
app/
├── main.py            # creates FastAPI(), includes routers, app-wide config
├── db.py              # engine + get_session dependency (Phase 7)
├── models.py          # SQLModel Book, User, etc.
├── dependencies.py    # get_current_user and other shared dependencies
└── routers/
    ├── __init__.py
    ├── books.py       # everything under /books
    └── auth.py        # everything under /auth
tests/
├── conftest.py        # the client fixture + overrides
├── test_books.py
└── test_protected.py
```

A router module and the include look like this:

```python
# app/routers/books.py
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.db import get_session
from app.models import Book

router = APIRouter(prefix="/books", tags=["books"])

@router.get("")
def list_books(session: Session = Depends(get_session)):
    return session.query(Book).all()

@router.post("", status_code=status.HTTP_201_CREATED)
def create_book(book: Book, session: Session = Depends(get_session)):
    session.add(book)
    session.commit()
    session.refresh(book)
    return book
```

```python
# app/main.py
from fastapi import FastAPI
from app.routers import books, auth

app = FastAPI(title="Book API")

app.include_router(books.router)
app.include_router(auth.router)
```

*What just happened:* `APIRouter(prefix="/books", tags=["books"])` defines a self-contained set of routes;
the `prefix` means you write `@router.get("")` instead of repeating `/books` on every path, and the `tags`
group these endpoints together in `/docs`. In `main.py`, `app.include_router(books.router)` stitches the
router into the real application — at runtime the routes behave *identically* to having been declared on
`app` directly. The payoff: each feature lives in one file you can read, change, and test on its own, and
`main.py` shrinks to a short table of contents. (Remember from Phase 5 that `APIRouter` can also take
`dependencies=[...]` — that's how you require auth for every route in a router at once.)

## Settings, and the payoff

One last piece of structure. Hardcoding the database URL, secret key, or token expiry into your code is a
trap — different values in dev, test, and production, and secrets that must never be committed. The clean
answer is **pydantic-settings**: define a typed `Settings` model that reads from environment variables,
with the same validation you already trust from Pydantic.

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./books.db"
    secret_key: str
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
```

*What just happened:* `Settings` pulls each field from an environment variable (or a `.env` file),
coerces and validates the types — `access_token_expire_minutes` *will* be an `int` or the app refuses to
start — and gives you one typed object to import. No more scattered `os.environ` lookups, no silently
wrong config. (You can even make `settings` a dependency and override it in tests, just like everything
else.)

💡 Step back and see the throughline of this whole guide. The reason all of this — swapping the test
database, faking the current user, splitting features into routers, overriding settings — is *easy* is
that nothing in your app reaches out and grabs its own dependencies. Everything is injected. Untestable
code is almost always un-injected code: a handler that constructs its own DB connection or reads
`os.environ` directly can't be tested without that real thing present. The layered, dependency-driven
design you've built isn't bureaucracy — it's exactly what makes the app testable, and exactly what makes
it ready for production. Which is where we go next.

## Recap

1. **`TestClient(app)`** calls your FastAPI app **in-process** — no server, no port, no network. It's
   built on Starlette with a `requests`-style API, so `client.get(...)`, `client.post(..., json=...)`,
   `.status_code`, and `.json()` are all you need. Run tests with `pytest`.
2. Assert on **more than the status code** — a `201` with the wrong body is still a bug. Check the shape
   and key fields of `response.json()`.
3. **`app.dependency_overrides`** swaps a real dependency for a test double: point `get_session` at an
   in-memory SQLite DB, or replace `get_current_user` to test protected routes without real auth. The
   endpoints don't change at all.
4. **Always reset overrides** (`.clear()` in a fixture teardown, or `try/finally`). They're global app
   state and leak between tests if you forget.
5. **Apply the test pyramid:** unit-test pure functions directly, use `TestClient` for endpoint
   (integration) tests, and keep a thin layer of real-DB end-to-end tests for critical flows.
6. **`APIRouter` + `app.include_router(...)`** splits one giant `main.py` into per-feature modules.
   **pydantic-settings** gives you typed config from the environment. Both exist because the whole design
   is dependency-driven — which is what makes the app testable in the first place.

## Quick check

Make sure the testing mechanics stuck before we ship to production:

```quiz
[
  {
    "q": "What does TestClient(app) actually do when you call client.get('/books')?",
    "choices": ["Starts a real HTTP server on a port and connects to it", "Sends the request into your app object in-process, no server needed", "Mocks out all your endpoints so nothing real runs", "Only works if `uvicorn` is already running in another terminal"],
    "answer": 1,
    "explain": "TestClient (from Starlette) wraps your app and dispatches requests directly into it in the same process. No port, no network, no running server — that's why it's fast and reliable."
  },
  {
    "q": "Why must you clear app.dependency_overrides after a test?",
    "choices": ["Otherwise pytest refuses to run the next file", "It frees memory FastAPI would otherwise leak", "Overrides are global state on the app, so a leftover one bleeds into later tests and makes them order-dependent", "Clearing it is what actually applies the override"],
    "answer": 2,
    "explain": "dependency_overrides is a dict living on the app object. If you don't reset it (via fixture teardown or try/finally), the override persists and silently affects every test that runs afterward."
  },
  {
    "q": "How do you split a large API into feature modules without changing endpoint behavior?",
    "choices": ["Define endpoints on an APIRouter in each module and app.include_router(...) them in main.py", "Copy main.py into several files and import whichever you need", "Run a separate FastAPI() per feature on different ports", "Move each endpoint into a Pydantic model"],
    "answer": 0,
    "explain": "APIRouter lets you declare routes in their own module (with a prefix and tags), then include_router stitches them into the app. At runtime the routes behave exactly as if declared on `app` directly."
  }
]
```

---

[← Phase 8: Authentication & Security](08-authentication-and-security.md) · [Guide overview](_guide.md) · [Phase 10: Production & Where to Go Next →](10-where-to-go-next.md)