---
title: "An ASGI App & the Servers"
guide: "wsgi-and-asgi-explained"
phase: 5
summary: "Write a bare ASGI app with scope/receive/send, read the request, run it under uvicorn, glimpse lifespan and websockets, then see FastAPI as ergonomics over this exact machinery."
tags: [asgi, uvicorn, starlette, fastapi, async, scope-receive-send, hypercorn]
difficulty: intermediate
synonyms: ["asgi app from scratch", "asgi scope receive send", "uvicorn hypercorn asgi server", "bare asgi application", "how fastapi works asgi", "asgi hello world", "starlette asgi"]
updated: 2026-06-23
---

# An ASGI App & the Servers

Back in [Phase 2](02-a-wsgi-app-from-scratch.md) you wrote a complete WSGI app — one function the
server calls per request, handed an `environ` dict, returning bytes. [Phase 4](04-why-asgi-exists.md)
explained *why* that shape couldn't go async, and what ASGI replaced it with. Now we make ASGI real the
same way we made WSGI real: by writing the whole thing by hand, with no framework in sight.

The mental model to carry through, and it's a direct echo of the WSGI one: **an ASGI app is one
`async` function the server calls per connection.** Instead of `(environ, start_response)`, it takes
three arguments — `scope` (what the connection is), `receive` (an awaitable you call to *get* events
coming in), and `send` (an awaitable you call to *push* events out). Match that shape and you have a
web app that can `await`. Everything FastAPI does is ergonomics layered over this one function — exactly
as Flask was ergonomics over the WSGI callable. Once you've written it yourself, FastAPI stops being
magic.

## A bare ASGI app

Here's the whole thing — a working ASGI app, no framework:

```python
async def app(scope, receive, send):
    assert scope["type"] == "http"

    await send({
        "type": "http.response.start",
        "status": 200,
        "headers": [(b"content-type", b"text/plain")],
    })
    await send({
        "type": "http.response.body",
        "body": b"Hello",
    })
```

*What just happened:* `app` is the ASGI callable — an `async def` function taking `scope`, `receive`,
and `send`. The server calls `await app(scope, receive, send)` per connection. First we check
`scope["type"]` is `"http"` (ASGI also delivers websocket and lifespan connections through this same
function — more below). Then we **send the response as two events**: an `http.response.start` carrying
the status and headers, followed by an `http.response.body` carrying the bytes. Notice the headers are
`(bytes, bytes)` tuples here, not `(str, str)` like WSGI — ASGI works in raw bytes on both sides.

💡 Look at what's *missing*: there is no `return`. In WSGI you returned the body; here the response is
**sent** as events through `send`, not returned. That's the ASGI shape from [Phase 4](04-why-asgi-exists.md)
in the flesh — a response isn't a value you hand back, it's a stream of messages you push out, each one
an `await` point where the event loop can go do other work. The two-event split (`start` then `body`)
is why you can begin a response, then stream the body in chunks later, all without blocking a worker.

## Reading the request

`scope` is to ASGI what `environ` was to WSGI: a dict the server fills in with everything *static* about
the connection — the method, the path, the headers. The difference is the *body*. In WSGI the body was a
single stream you read from `environ["wsgi.input"]`. In ASGI the body arrives as **`http.request` events
you pull in by `await receive()`** — and it can come in several chunks.

```python
async def app(scope, receive, send):
    assert scope["type"] == "http"
    method = scope["method"]          # "GET"
    path = scope["path"]              # "/notes"

    # Pull the request body in, chunk by chunk.
    body = b""
    more = True
    while more:
        event = await receive()       # an {"type": "http.request", ...} message
        body += event.get("body", b"")
        more = event.get("more_body", False)

    reply = f"{method} {path} ({len(body)} bytes of body)".encode("utf-8")
    await send({"type": "http.response.start", "status": 200,
                "headers": [(b"content-type", b"text/plain")]})
    await send({"type": "http.response.body", "body": reply})
```

*What just happened:* the method and path come straight off `scope` — no fishing through `HTTP_*` keys
like WSGI, they're plain `scope["method"]` and `scope["path"]`. The body is different: each
`await receive()` hands back one `http.request` event with a `body` chunk and a `more_body` flag. We
loop, appending chunks, until `more_body` is `False` and we've got the whole body. Then we send the
response back out as the same two events.

⚠️ This is the trap if you're coming from WSGI: **the body is not one read.** WSGI gave you a single
input stream; ASGI dribbles the body in as a series of `receive` events, and you must loop until
`more_body` is false or you'll silently process a half-empty request. The upside is exactly the point of
async — each `await receive()` is a yield point, so a worker waiting on a slow upload isn't blocked, it's
free to serve other connections.

## Running it: uvicorn

A WSGI app needs a WSGI server (gunicorn, uWSGI) to invoke it. 📝 **An ASGI app needs an ASGI server** —
the three common ones are **uvicorn**, **hypercorn**, and **daphne**. They speak HTTP on the socket and
translate it into the `scope` / `receive` / `send` calls your app expects. Save the app above as
`myapp.py` and point uvicorn at it:

```bash
uvicorn myapp:app
```

```console
$ uvicorn myapp:app
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

*What just happened:* `uvicorn myapp:app` means "import `myapp.py`, find the `app` object, and run it as
an ASGI app." Uvicorn binds a socket on port 8000, accepts HTTP connections, and for each one calls
`await app(scope, receive, send)` — the exact function you wrote. Curl `http://127.0.0.1:8000/notes` and
you get your method/path line back.

💡 Hold the contrast next to [Phase 3](03-the-wsgi-server-and-middleware.md): **gunicorn alone is a WSGI
server; uvicorn is an ASGI server.** They are not interchangeable — a WSGI server can't drive an
`async def app(scope, ...)`, and an ASGI server can't drive a `def app(environ, start_response)`. In
production you usually combine them: run **gunicorn with uvicorn worker processes**
(`gunicorn -k uvicorn.workers.UvicornWorker myapp:app`), behind nginx. Gunicorn gives you the robust
process manager (multiple workers, restarts); the uvicorn workers give you the async event loop. nginx
out front terminates TLS and serves static files. Same layered shape as the WSGI stack — just async-aware
workers in the middle.

## A glimpse: lifespan and websockets

📝 Remember the `assert scope["type"] == "http"` at the top? That guard exists because **HTTP is not the
only thing that comes through your app.** ASGI delivers other connection types through the *same*
`scope` / `receive` / `send` function:

- **`scope["type"] == "lifespan"`** — sent once at startup and once at shutdown. The server calls your
  app with a lifespan scope, you `await receive()` a `lifespan.startup` event (open your DB pool here),
  and later a `lifespan.shutdown` event (close it). It's how an ASGI app runs setup/teardown code.
- **`scope["type"] == "websocket"`** — a long-lived two-way connection. You `await receive()` incoming
  messages and `await send()` outgoing ones, for as long as the socket stays open.

💡 That's the whole reason ASGI exists in one sentence: **one protocol shape — `scope` / `receive` /
`send` — handles HTTP requests, websockets, and the app lifecycle alike.** WSGI could only ever do one
request-response over HTTP; ASGI's three-argument async contract is general enough to carry all three.
You don't need the details today — just register that your `app` function is a single door that
*everything* comes through, and the `scope["type"]` tells you what kind of connection you're holding.

## What FastAPI and Starlette add

Now the reveal. You just wrote a bare ASGI app — `scope` / `receive` / `send`, headers as byte tuples,
the body looped in chunk by chunk, the response pushed out as two events. That is tedious, and nobody
ships it by hand. So what does [FastAPI](/guides/fastapi-from-zero) do?

💡 **FastAPI is built on Starlette, and Starlette is an ASGI framework** — meaning Starlette's
application object is itself an ASGI callable, the same `async def app(scope, receive, send)` shape you
wrote, with routing, request parsing, and response serialization built on top. When you write this in
FastAPI:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/notes")
async def list_notes():
    return {"notes": ["milk", "bread"]}
```

*What just happened:* underneath, `app` is an ASGI application — uvicorn calls it with exactly
`scope` / `receive` / `send`. The `@app.get("/notes")` decorator does the `scope["path"]` matching you'd
otherwise hand-write. FastAPI reads the body via `await receive()` for you, parses it, and turns the
`dict` you return into the two `send` events — `http.response.start` with `content-type: application/json`,
then `http.response.body` with the JSON bytes. Your tidy `async def` endpoint *is* the bare ASGI machinery
from the top of this page, with all the ceremony automated away.

Map it the same way [Phase 2](02-a-wsgi-app-from-scratch.md) mapped Flask onto bare WSGI:

| You wrote, by hand | FastAPI / Starlette gives you | What it's doing underneath |
|--------------------|-------------------------------|----------------------------|
| `assert scope["type"] == "http"`, `scope["path"]` branching | `@app.get("/notes")` | the same scope inspection + path matching, registered |
| the `await receive()` body loop | typed request models, parsed for you | reads and assembles the body events |
| two `send(...)` events with byte headers | `return {...}` | builds the `start` + `body` events and serializes JSON |
| your `async def app(scope, receive, send)` | the `FastAPI()` object | **is** an ASGI callable too — same shape |

That last row is the kicker, and it's the same kicker as WSGI: the `app` you create with `FastAPI()` is
itself an ASGI callable, which is *exactly* why uvicorn can run it. You wrote the bare ASGI app. FastAPI
is the comfortable seat bolted on top. The final phase ties the two halves of this guide together —
WSGI and ASGI, frameworks and servers — into one picture.

## Recap

1. **An ASGI app is one `async` function** the server calls per connection:
   `async def app(scope, receive, send)`. It's the async sibling of the WSGI callable from
   [Phase 2](02-a-wsgi-app-from-scratch.md).
2. **The response is *sent*, not returned** — you `await send(...)` an `http.response.start` event
   (status + byte headers) then an `http.response.body` event (the bytes). No `return` of a body.
3. **`scope` holds the static request** (method, path, headers, plus `type`), while **the body arrives
   as `http.request` events you pull in with `await receive()`** — looping on `more_body`, ⚠️ unlike
   WSGI's single input stream.
4. **ASGI apps need an ASGI server** — uvicorn, hypercorn, or daphne. gunicorn alone is a *WSGI* server;
   in production, run gunicorn with uvicorn workers behind nginx.
5. **The same `scope`/`receive`/`send` shape carries HTTP, `websocket`, and `lifespan`** connections —
   one protocol, many connection types. That generality is the whole reason ASGI exists.
6. 💡 **FastAPI is built on Starlette, an ASGI framework** — `@app.get` async endpoints are this exact
   `scope`/`receive`/`send` machinery with routing, parsing, and serialization on top. You wrote the
   bare app; FastAPI is the ergonomics.

## Quick check

Make sure the ASGI shape stuck:

```quiz
[
  {
    "q": "How does a bare ASGI app return its response body to the client?",
    "choices": [
      "It `await send(...)`s an `http.response.start` event then an `http.response.body` event — the response is sent, not returned",
      "It `return`s a list of bytes, exactly like a WSGI app",
      "It assigns the body to `scope[\"body\"]` before the function ends",
      "It calls `start_response(...)` then returns the bytes"
    ],
    "answer": 0,
    "explain": "ASGI apps push the response out as events: an `http.response.start` (status + headers) followed by one or more `http.response.body` events. There is no `return` of a body — that streaming-of-events shape is what lets the app stay async."
  },
  {
    "q": "In an ASGI app, where does the request body come from?",
    "choices": [
      "From `await receive()` events — `http.request` messages whose `body` chunks you loop over until `more_body` is false",
      "From `scope[\"body\"]`, fully assembled before the app runs",
      "From `environ[\"wsgi.input\"]`, read as one stream",
      "From the `send` callable, which both sends and receives"
    ],
    "answer": 0,
    "explain": "Unlike WSGI's single input stream, ASGI delivers the body as `http.request` events. You `await receive()` repeatedly, appending each chunk's `body`, until `more_body` is False."
  },
  {
    "q": "What is the relationship between FastAPI and the bare `scope`/`receive`/`send` app?",
    "choices": [
      "FastAPI is built on Starlette (an ASGI framework); a FastAPI app IS an ASGI callable, with routing, parsing, and serialization layered over the same scope/receive/send machinery",
      "FastAPI replaces ASGI with its own faster protocol that uvicorn translates",
      "FastAPI is a WSGI framework, so it uses environ/start_response instead",
      "FastAPI has nothing to do with ASGI — it runs directly on raw sockets"
    ],
    "answer": 0,
    "explain": "FastAPI sits on Starlette, an ASGI framework, so its app object is itself an ASGI callable — which is why uvicorn can run it. Your `@app.get` async endpoint is the bare scope/receive/send machinery with the ceremony automated."
  }
]
```

---

[← Phase 4: Why ASGI Exists](04-why-asgi-exists.md) · [Guide overview](_guide.md) · [Phase 6: From Protocol to Framework →](06-from-protocol-to-framework.md)