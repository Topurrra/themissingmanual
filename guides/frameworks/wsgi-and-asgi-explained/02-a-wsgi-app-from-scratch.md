---
title: "A WSGI App From Scratch"
guide: "wsgi-and-asgi-explained"
phase: 2
summary: "Write a real web app in a dozen lines with no framework - a plain WSGI callable that reads the request from environ, routes by hand, and returns bytes - then see exactly what Flask adds on top."
tags: [wsgi, python, environ, start-response, web, no-framework, internals]
difficulty: intermediate
synonyms: ["wsgi app from scratch", "wsgi environ start_response", "bare wsgi application", "wsgi without framework", "wsgi hello world", "wsgi routing by hand", "what flask is underneath"]
updated: 2026-07-10
---

# A WSGI App From Scratch

In Phase 1 you learned the contract: a WSGI app is just a Python *callable* the server invokes with two
arguments, and it hands back a response. This phase makes it real. We're going to write a complete,
working web app - one a browser can hit - with no Flask, no Django, no framework of any kind. Just a
function.

The mental model to hold the whole way through: **a WSGI app is one function the server calls per request.**
The server hands it everything it knows about the incoming request (in a dict called `environ`), gives it a
callback to set the status and headers (`start_response`), and expects back the body as bytes. Match that
shape and you have a web app. Everything a framework does - routing, request objects, response helpers - is
*convenience layered over this one function*. Once you've written the function yourself, the frameworks stop
being magic and start being ergonomics.

## The simplest WSGI app

Here's the whole thing - a web app you can run right now:

```python
from wsgiref.simple_server import make_server

def app(environ, start_response):
    start_response("200 OK", [("Content-Type", "text/plain")])
    return [b"Hello"]

if __name__ == "__main__":
    server = make_server("localhost", 8000, app)
    print("Serving on http://localhost:8000")
    server.serve_forever()
```

Save it as `bare.py` and run it:

```bash
python bare.py
```

Then in another terminal (or your browser at `http://localhost:8000`):

```console
$ curl http://localhost:8000
Hello
```

*What just happened:* `app` is the WSGI callable - a plain function taking `environ` and `start_response`.
When a request comes in, the server calls `app(environ, start_response)`. Inside, we call `start_response`
with the status line (`"200 OK"`) and a list of header tuples, then return the body as a list containing one
bytestring, `b"Hello"`. The `make_server(...)` line uses **`wsgiref.simple_server`** - a tiny WSGI server
that ships *with Python itself*, no install needed - to wire that function to a real TCP socket on port 8000.

💡 Read that again, because it's the whole point of this guide: **this is a complete web app.** It accepts
HTTP requests and returns HTTP responses. Flask, Django, FastAPI - every one of them, stripped to the studs,
is a function shaped exactly like `app` above. Everything else those frameworks ship is convenience built on
top of this. You are looking at the foundation.

## Reading the request from `environ`

So far `app` ignores its input entirely - it says "Hello" no matter what you ask for. To actually *respond*
to the request, you read it from `environ`.

📝 **`environ` is a plain dict** the server fills in with everything about the incoming request. The keys
you'll reach for constantly:

| Key | Holds | Example value |
|-----|-------|---------------|
| `environ["REQUEST_METHOD"]` | the HTTP verb | `"GET"`, `"POST"` |
| `environ["PATH_INFO"]` | the URL path | `"/notes"` |
| `environ["QUERY_STRING"]` | everything after `?` | `"q=milk&sort=date"` |
| `environ["HTTP_USER_AGENT"]` | a request header | `"curl/8.4.0"` |
| `environ["wsgi.input"]` | the request body, as a stream | a file-like object |

Two things worth pinning down. **Headers arrive as `HTTP_*` keys**: the server takes each incoming header,
uppercases it, swaps dashes for underscores, and prefixes `HTTP_`. So `User-Agent` becomes
`environ["HTTP_USER_AGENT"]`, `Accept-Language` becomes `environ["HTTP_ACCEPT_LANGUAGE"]`. And **the body is
a stream, not a string** - you read it from `environ["wsgi.input"]` (using the byte length in
`environ["CONTENT_LENGTH"]`), and what you get back is bytes.

Here's `app` actually looking at the request:

```python
def app(environ, start_response):
    method = environ["REQUEST_METHOD"]
    path = environ["PATH_INFO"]
    start_response("200 OK", [("Content-Type", "text/plain")])
    return [f"You sent a {method} to {path}".encode("utf-8")]
```

*What just happened:* we pulled the verb and path straight out of `environ`, built a response string from
them, and `.encode("utf-8")`'d it into bytes before returning. Hit `http://localhost:8000/notes` and you get
back `You sent a GET to /notes`. That's it - that's "reading the request." There's no `request` object with
friendly attributes here; there's a dict, and you fish what you need out of it by key.

## Routing by hand

A real app does different things at different URLs. With no framework, you do that the most direct way
imaginable: look at `PATH_INFO` and branch.

```python
def app(environ, start_response):
    path = environ["PATH_INFO"]

    if path == "/":
        status, body = "200 OK", b"Welcome home"
    elif path == "/notes":
        status, body = "200 OK", b"Here are your notes"
    else:
        status, body = "404 Not Found", b"No such page"

    start_response(status, [("Content-Type", "text/plain")])
    return [body]
```

*What just happened:* we read the path once, then an `if`/`elif`/`else` decides the status and body. A request
to `/` returns "Welcome home"; `/notes` returns the notes line; anything else falls through to a real
`404 Not Found`. This little dispatcher - one place that reads the path and routes to the right response - is
called a **front controller**, and you just wrote one by hand.

💡 Look hard at that `if`/`elif` chain, because it's the thing a framework's URL router *automates*. When you
write `@app.route("/notes")` in Flask, Flask is maintaining this exact branching for you under the hood -
matching `PATH_INFO` against registered routes and calling the right function. You're doing manually,
explicitly, what a router does generically. Same idea; the framework just hides the `if` ladder behind a
decorator.

## Returning the response correctly

The WSGI return contract is strict, and getting it slightly wrong is the #1 way a from-scratch app blows up.
⚠️ Three rules, no exceptions:

1. **Status is a string** - `"200 OK"`, including the number *and* the reason phrase. Not `200`, not `"200"`.
2. **Headers are a list of `(str, str)` tuples** - `[("Content-Type", "text/plain")]`. Both sides strings.
3. **The body is an iterable of *bytes*** - `[b"Hello"]`, not `"Hello"`. Strings must be `.encode()`'d first.

Here's a correct response next to the two mistakes everyone makes:

```python
# CORRECT
start_response("200 OK", [("Content-Type", "text/plain")])
return [b"Hello"]

# BROKEN #1 - body is a str, not bytes
start_response("200 OK", [("Content-Type", "text/plain")])
return ["Hello"]          # TypeError: a bytes-like object is required

# BROKEN #2 - forgot to encode a built string
start_response("200 OK", [("Content-Type", "text/plain")])
name = "Ada"
return [f"Hello {name}"]  # same TypeError - it's still a str
```

*What just happened:* the correct version returns a list holding one bytestring. Both broken versions return
*strings*, and the server raises a `TypeError` because WSGI demands bytes on the wire - HTTP bodies are bytes,
and WSGI refuses to guess an encoding for you. ⚠️ The fix is always the same: `.encode("utf-8")` any string
before returning it, and write byte literals (`b"..."`) for constants. A second classic trip-up: returning
the bytestring *bare* instead of wrapped in a list - `return b"Hello"` technically works because a bytestring
is iterable, but the server then iterates it *one byte at a time*, which is almost never what you want. Return
an iterable *of* byte chunks: `[b"Hello"]`.

## What the framework adds

You now have, by hand, every moving part of a web app: a callable the server invokes, request data read from
`environ`, routing by branching on the path, and a correctly-shaped bytes response. So what does a framework
like [Flask](/guides/flask-from-zero) actually *give* you? Map it piece for piece against what you just wrote:

| You wrote, by hand | Flask gives you | What it's doing underneath |
|--------------------|-----------------|----------------------------|
| `if path == "/notes": ...` | `@app.route("/notes")` | the same `PATH_INFO` branching, registered for you |
| `environ["REQUEST_METHOD"]`, `environ["HTTP_*"]` | `request.method`, `request.headers` | a friendly object wrapping `environ` |
| `start_response(...)` + `return [body.encode()]` | `return "some html"` | builds the status, headers, and bytes body for you |
| your `def app(environ, start_response)` | Flask's `app` object | Flask's `app` **is** a WSGI callable too |

💡 That last row is the kicker. The Flask `app` you create with `Flask(__name__)` is itself a WSGI callable -
it has the same `(environ, start_response)` shape your function has, which is *exactly* why a WSGI server can
run it. When you saw `request.method` and `request.form` over in
[Routing & Views](/guides/flask-from-zero), you were looking at a polished wrapper over the same `environ`
dict you just read by hand. `@app.route` is the `if` ladder. `return "html"` is the `start_response` plus the
`.encode()`. None of it is new machinery - it's ergonomics layered over the function you already understand.

You wrote the core. A framework is the comfortable seat bolted on top. Next phase we look at the *other* half
of running a real app: the **WSGI server** that actually invokes your callable in production (you won't ship
`wsgiref` - you'll reach for gunicorn or uWSGI), and **middleware**, the trick of wrapping one WSGI app in
another - which turns out to be the root of every framework's "middleware" feature.

## Recap

1. **A WSGI app is one function** the server calls per request: `def app(environ, start_response)`. With
   `wsgiref.simple_server` (built into Python) that function is already a complete, runnable web app - no
   framework required.
2. **`environ` is a plain dict** holding the request: `REQUEST_METHOD`, `PATH_INFO`, `QUERY_STRING`, headers
   as `HTTP_*` keys, and the body as a stream at `environ["wsgi.input"]`.
3. **Routing by hand** is branching on `PATH_INFO` - a front controller. 💡 A framework's URL router automates
   exactly this `if`/`elif` ladder behind `@app.route`.
4. ⚠️ **The response contract is strict:** status is a string (`"200 OK"`), headers are a list of `(str, str)`
   tuples, and the body is an iterable of *bytes* (`[b"..."]`). Returning a `str` is the most common error -
   `.encode("utf-8")` first.
5. **A framework is ergonomics over this callable:** `@app.route` = manual path branching, `request` = a
   wrapper over `environ`, `return "html"` = building the bytes body and headers. Flask's `app` object *is* a
   WSGI callable - same shape as the one you wrote.

You can now read a WSGI app and see straight through to the function underneath. Next: the server that runs it
in the real world, and middleware.

## Quick check

Make sure the bare callable stuck:

```quiz
[
  {
    "q": "Your WSGI app does `return \"Hello\"` (a plain string). What happens?",
    "choices": [
      "It errors - the WSGI body must be an iterable of bytes, so you need `return [b\"Hello\"]`",
      "It works fine; WSGI encodes strings to bytes automatically",
      "It returns an empty response because strings aren't allowed",
      "It works but sends the wrong Content-Type header"
    ],
    "answer": 0,
    "explain": "WSGI requires the body to be an iterable of bytes - HTTP bodies are bytes and WSGI won't guess an encoding. Return `[b\"Hello\"]`, or `.encode(\"utf-8\")` a built string before returning it."
  },
  {
    "q": "A request comes in with a `User-Agent: curl/8.4.0` header. Where do you read it inside the app?",
    "choices": [
      "`environ[\"HTTP_USER_AGENT\"]` - headers arrive uppercased, dashes-to-underscores, with an `HTTP_` prefix",
      "`environ[\"User-Agent\"]` - headers keep their original name",
      "`environ[\"wsgi.input\"]` - all headers live in the body stream",
      "`start_response[\"User-Agent\"]` - headers come through the callback"
    ],
    "answer": 0,
    "explain": "The server maps each incoming header into `environ` by uppercasing it, replacing dashes with underscores, and prefixing `HTTP_`. So `User-Agent` becomes `environ[\"HTTP_USER_AGENT\"]`."
  },
  {
    "q": "In Flask, what is `@app.route(\"/notes\")` actually automating compared to the bare WSGI app?",
    "choices": [
      "The manual `if path == \"/notes\"` branching on `PATH_INFO` - the router registers routes and dispatches for you",
      "The TCP socket setup that `make_server` does",
      "The `.encode(\"utf-8\")` call on the response body",
      "Nothing - `@app.route` is unrelated to WSGI"
    ],
    "answer": 0,
    "explain": "Routing by hand means branching on `environ[\"PATH_INFO\"]`. `@app.route` is sugar over exactly that: Flask keeps a table of paths and runs the matching view, so you don't write the `if`/`elif` ladder yourself."
  }
]
```

---

[← Phase 1: What WSGI Is](01-what-wsgi-is.md) · [Guide overview](_guide.md) · [Phase 3: The WSGI Server & Middleware →](03-the-wsgi-server-and-middleware.md)