---
title: "Dependency Injection with Depends()"
guide: "fastapi-from-zero"
phase: 5
summary: "FastAPI's Depends() lets an endpoint declare what it needs and have the framework supply it — pagination, DB sessions, auth — as plain reusable functions, with yield for setup/teardown."
tags: [fastapi, dependency-injection, depends, reusable-dependencies, yield-dependencies, auth-dependency]
difficulty: intermediate
synonyms: ["fastapi depends", "fastapi dependency injection", "fastapi reusable dependency", "fastapi yield dependency", "fastapi db session dependency", "fastapi sub-dependencies", "fastapi pagination dependency"]
updated: 2026-07-10
---

# Dependency Injection with Depends()

By now your Book service can take a validated request body, shape a clean response, and return honest
status codes. But look closely and the same chores keep repeating: every list endpoint re-reads `skip`
and `limit`, every protected endpoint re-checks the same token, every database-touching endpoint will (in
two phases) open and close a session the same way. Copy-paste that into ten endpoints and you've signed
up to fix the same bug ten times. FastAPI has a built-in answer, and it's one of the framework's best
ideas — trivial syntax once the *shape* clicks.

## The idea: declare what you need, the framework provides it

📝 **Dependency injection** in FastAPI means: a path operation *declares* what it needs as a parameter,
and FastAPI *provides* it by calling a function you wrote — a **dependency**. You don't fetch the thing
yourself. You announce "I need a current user / a database session / pagination settings," and the
framework runs the right function and hands you the result, already prepared.

If "the framework calls your function for you" feels familiar, it should — it's **inversion of control**,
the exact idea behind the word "framework"
([What a Framework Even Is](/guides/what-a-framework-even-is)). You're not calling the dependency; you
register what you want, and FastAPI calls it on your behalf at request time. *Don't call us, we'll call
you.*

💡 The lovely part: a FastAPI dependency is **just a plain function**. No special base class, no DI
container to configure, no XML, no registration step. If you can write a function, you can write a
dependency. That's the whole system.

## A simple dependency

Pagination — `skip` and `limit` — is the textbook case, because every list endpoint in the Book service
wants the same two query parameters with the same defaults and the same sanity checks.

The dependency itself is pure Python — no FastAPI imports, no running server needed — so it runs right
here:

```python runnable
def pagination_params(skip: int = 0, limit: int = 10) -> dict:
    # one place to keep pagination sane for the whole API
    safe_limit = min(limit, 100)   # never let a caller ask for 10,000 rows
    return {"skip": max(skip, 0), "limit": safe_limit}

# simulate FastAPI calling it with values pulled from the query string
print(pagination_params())                 # the defaults
print(pagination_params(skip=20, limit=5)) # a normal request
print(pagination_params(skip=-3, limit=999))  # a hostile request, clamped
```

*What just happened:* `pagination_params` is an ordinary function with two parameters that have
defaults. It clamps nonsense — negative `skip`, a `limit` of 999 — into something safe and returns a
tidy dict. Nothing here is FastAPI-specific yet; it's testable and runnable in isolation.

Wire it into an endpoint. This part needs the running app, so it's shown as plain code:

```python
from fastapi import FastAPI, Depends

app = FastAPI()

# pretend store; real DB arrives in Phase 7
BOOKS = [{"id": i, "title": f"Book {i}"} for i in range(1, 51)]

def pagination_params(skip: int = 0, limit: int = 10) -> dict:
    return {"skip": max(skip, 0), "limit": min(limit, 100)}

@app.get("/books")
def list_books(params: dict = Depends(pagination_params)):
    start = params["skip"]
    end = start + params["limit"]
    return BOOKS[start:end]
```

*What just happened:* `params: dict = Depends(pagination_params)` is the whole trick. You did **not**
call `pagination_params()` yourself — you handed the function to `Depends()`. When a request hits
`/books`, FastAPI calls it for you and injects the returned dict as `params`. Your endpoint body never
touches `skip` or `limit` directly; it just receives a ready-made, already-clamped dict.

💡 The part people miss the first time: the dependency's *own* parameters become part of the endpoint's
public interface. Because `pagination_params` declares `skip` and `limit`, a request to
`/books?skip=20&limit=5` works — FastAPI reads those query params, validates them as `int` (the same
type-hint-driven validation from earlier phases), passes them in, and they even show up in the automatic
`/docs`. The dependency contributed query parameters to an endpoint that never mentions them.

## Why DI here is genuinely powerful

That pagination example is small, but the payoff scales. Three wins, all from the same mechanism:

- **Write shared logic once.** Add `params: dict = Depends(pagination_params)` to `/books`,
  `/authors`, `/reviews` — every list endpoint gets identical, sane pagination. Change the max limit in
  *one* function and the whole API updates. No copy-paste, no drift.
- **Testable by swapping.** Because the dependency is just a function, your tests can replace it with a
  fake (FastAPI has a `dependency_overrides` hook for exactly this). Need a test to run as an admin user?
  Override the auth dependency to return one. No real tokens, no real database. We'll lean on this in the
  testing phase.
- **Self-documenting.** A dependency's parameters flow into the interactive docs automatically, so the
  contract stays honest without you maintaining it by hand.

And dependencies compose. 📝 A dependency can itself depend on another via `Depends(...)` — these are
**sub-dependencies**, and FastAPI resolves the whole chain for you, in order, before your endpoint runs:

```python
from fastapi import Depends

def db_connection():
    return {"conn": "fake-connection"}

# this dependency needs the one above — a sub-dependency
def book_repository(db: dict = Depends(db_connection)):
    return {"repo": "books", "using": db["conn"]}

@app.get("/books/{book_id}")
def get_book(book_id: int, repo: dict = Depends(book_repository)):
    return {"book_id": book_id, "served_by": repo}
```

*What just happened:* `get_book` asks only for `book_repository`. But `book_repository` itself asks for
`db_connection`. FastAPI walks the chain: it calls `db_connection` first, feeds the result into
`book_repository`, then hands *that* result to your endpoint. You declared one need at the top and the
framework assembled the whole stack underneath — DB → repository → endpoint, no glue code.

## `yield` dependencies: setup before, teardown after

Some things you depend on need to be *opened* and then reliably *closed* — a database session, a file, a
network client. You want code to run **before** the request handler and more **after** it, even if the
handler blew up. FastAPI's answer is a dependency that uses `yield` instead of `return`.

📝 A **`yield` dependency** runs everything up to the `yield` as **setup**, hands the yielded value to
your endpoint, and runs everything after the `yield` as **teardown** once the response is sent. If you've
met context managers in Python ([Python From Zero](/guides/python-from-zero) covers the `with`
statement), this is the same setup/teardown shape — the code after `yield` is your `finally`.

The canonical use is a database session. The real version lands in Phase 7; here's the *shape* now:

```python
from fastapi import Depends

# stand-in for a real session; Phase 7 makes this a SQLModel Session
def get_db():
    db = {"session": "open", "queries": []}   # setup: open the session
    print("DB session opened")
    try:
        yield db                              # hand it to the endpoint
    finally:
        print("DB session closed")           # teardown: always runs

@app.get("/books-from-db")
def list_books_from_db(db: dict = Depends(get_db)):
    db["queries"].append("SELECT * FROM books")
    return {"books": [], "ran": db["queries"]}
```

*What just happened:* When a request arrives, FastAPI runs `get_db` up to `yield`, opening the "session"
and injecting it as `db`. Your endpoint uses it. After the response is sent, FastAPI resumes the function
past `yield` and runs the teardown — closing the session. One function owns the entire lifecycle of the
resource, so an endpoint can *never* forget to clean up.

⚠️ The teardown runs **even if your endpoint raises an exception** — that's the entire reason for the
`try`/`finally`: a request that errors out still closes its database session, so you don't leak
connections every time something goes wrong. This is the single most important reason DB sessions are
done as `yield` dependencies and not opened ad hoc inside handlers.

## Auth as a dependency (preview) + where you can attach it

The same mechanism is how authentication works in FastAPI — a perfect fit. "This endpoint requires a
logged-in user" is exactly "this endpoint *depends on* there being a current user." Full auth — real
tokens, OAuth2, JWT — is Phase 8; here's the shape so you see the seam:

```python
from fastapi import Depends, Header, HTTPException

def get_current_user(x_token: str = Header(default="")):
    if x_token != "secret-token":
        # no valid credentials → stop here, the endpoint never runs
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"username": "ada", "role": "reader"}

@app.post("/books")
def create_book(title: str, user: dict = Depends(get_current_user)):
    return {"created_by": user["username"], "title": title}
```

*What just happened:* `create_book` depends on `get_current_user`. FastAPI runs that dependency *first*;
if the token is missing or wrong it raises `401` and your endpoint body never executes. If it passes, the
endpoint receives the authenticated `user`. Same pattern as pagination — declare the need, the framework
satisfies (or rejects) it before you run. (`get_current_user` could itself `Depends` on `get_db` to look
the user up — sub-dependencies again.)

You don't have to attach a dependency endpoint-by-endpoint. There are three reuse levels:

- **Path level** — in the endpoint's parameters, as above. Affects that one route.
- **Router level** — `APIRouter(dependencies=[Depends(get_current_user)])` applies it to every route on
  that router. Great for "everything under `/admin` requires auth."
- **App level** — `FastAPI(dependencies=[Depends(...)])` applies it to *every* endpoint, ideal for
  cross-cutting concerns like a global API-key check.

(You'll meet routers properly in Phase 9; the takeaway now is that the *same* `Depends()` scales from one
route to the whole app.)

💡 `Depends()` is the backbone you'll lean on for the rest of this guide. Database sessions in Phase 7
and authentication in Phase 8 are both *just dependencies*. Learn this one mechanism well and those
phases become "apply the thing you already know" rather than new machinery.

## Recap

1. **Dependency injection** = an endpoint declares what it needs as a parameter (`Depends(func)`), and
   FastAPI calls your function and injects the result. It's **inversion of control** — the framework
   calls your code, not the other way around.
2. A dependency is **a plain function**. No container, no base class. Its own parameters become part of
   the endpoint's interface and show up in the automatic docs.
3. DI lets you **write shared logic once** (pagination, auth, DB), makes endpoints **testable** by
   swapping dependencies, and keeps the API **self-documenting**. Dependencies can depend on other
   dependencies (**sub-dependencies**), resolved as a chain.
4. A **`yield` dependency** runs setup before the request and teardown after — the standard pattern for
   opening and closing resources like DB sessions, mirroring Python's `with`.
5. The teardown of a `yield` dependency runs **even when the endpoint raises**, which is exactly why DB
   sessions use it — errored requests still clean up.
6. **Auth fits naturally as a dependency**, and dependencies attach at the **path, router, or app**
   level. `Depends()` is the backbone for databases and auth in the phases ahead.

## Quick check

Lock in the core idea before moving on:

```quiz
[
  {
    "q": "When you write `params: dict = Depends(pagination_params)`, who calls `pagination_params`?",
    "choices": ["You call it yourself before the endpoint runs", "FastAPI calls it and injects the result", "It is never called; Depends just documents it", "Pydantic calls it during model validation"],
    "answer": 1,
    "explain": "That's inversion of control: you declare the dependency and FastAPI calls the function for you at request time, passing its return value into your endpoint."
  },
  {
    "q": "Why is a database session typically written as a `yield` dependency with try/finally?",
    "choices": ["yield makes the query run faster", "So the session is shared globally across all requests", "So teardown (closing the session) runs after the response, even if the endpoint raised", "Because FastAPI cannot inject objects created with return"],
    "answer": 2,
    "explain": "Code after `yield` runs as teardown once the response is sent, and the `finally` guarantees it runs even on an exception — so errored requests still close their session and don't leak connections."
  },
  {
    "q": "You want every route under an admin router to require authentication. What's the cleanest place to attach `Depends(get_current_user)`?",
    "choices": ["On each endpoint individually, repeated everywhere", "At the router level, e.g. APIRouter(dependencies=[Depends(get_current_user)])", "Inside the Pydantic response model", "It can only ever be attached per-path"],
    "answer": 1,
    "explain": "Dependencies attach at the path, router, or app level. Putting it on the router applies it to every route on that router in one place — no per-endpoint repetition."
  }
]
```

---

[← Phase 4: Response Models & Status Codes](04-response-models-and-status-codes.md) · [Guide overview](_guide.md) · [Phase 6: Async & Concurrency →](06-async-and-concurrency.md)
