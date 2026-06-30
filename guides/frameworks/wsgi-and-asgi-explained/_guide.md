---
title: "WSGI & ASGI Explained"
guide: "wsgi-and-asgi-explained"
phase: 0
summary: "Learn the protocol every Python web framework sits on: what WSGI is and the problem it solved, a bare WSGI app with no framework, WSGI servers and middleware, why ASGI exists for async, a bare ASGI app and its servers, and how Flask, Django, and FastAPI are all built on these contracts. The bottom layer, made visible."
tags: [wsgi, asgi, python, web, gunicorn, uvicorn, middleware, framework-internals]
category: frameworks
order: 14
group: "Python"
difficulty: intermediate
synonyms: ["what is wsgi", "what is asgi", "wsgi vs asgi", "wsgi application callable", "asgi async python", "gunicorn uvicorn", "how flask works under the hood", "python web server interface"]
updated: 2026-06-23
---

# WSGI & ASGI Explained

Underneath Flask, Django, FastAPI - every Python web framework - there's one small contract that lets a
web server and your Python code talk to each other. For synchronous frameworks it's **WSGI**; for async
ones it's **ASGI**. Almost nobody learns these directly, which is exactly why "how does `flask run`
actually serve a request?" feels like magic. It isn't: a WSGI app is a plain Python *callable* the server
invokes, and an ASGI app is an async callable. Once you've written each by hand - in a dozen lines, with
no framework - every framework reads as conveniences over that callable.

This is a **roots guide**. You'll rarely write raw WSGI/ASGI apps in a real job (frameworks exist for
good reasons), but understanding them demystifies a pile of things at once: why you run `gunicorn` or
`uvicorn` in production, what "middleware" really is, why FastAPI is async and Flask isn't, and how the
whole Python web stack fits together. We build it bare-metal first, then point at the frameworks and watch
the shapes line up.

> 📝 This assumes **Python** (functions, async/await - [Python From Zero](/guides/python-from-zero)) and a
> grasp of **HTTP** ([HTTP, Explained](/guides/http-explained)). It's the Python parallel to
> [The Servlet API](/guides/the-servlet-api) (Java's equivalent foundation) and is most useful after
> you've used [Flask](/guides/flask-from-zero) or [FastAPI](/guides/fastapi-from-zero) and want to see
> beneath them. Examples are shown with their output rather than run on the page.

## How to read this

Short and foundational - read in order. It builds a bare WSGI app, then a bare ASGI app, then maps both
onto the frameworks you know. Phases carry difficulty badges.

## The phases

1. **[What WSGI Is](01-what-wsgi-is.md)** 🟢 - the contract between a web server and a Python app, and the problem it solved.
2. **[A WSGI App From Scratch](02-a-wsgi-app-from-scratch.md)** 🟡 - write one in a dozen lines with no framework, and see what Flask *is* underneath.
3. **[The WSGI Server & Middleware](03-the-wsgi-server-and-middleware.md)** 🟡 - gunicorn/uWSGI run your app; middleware wraps it - the root of framework "middleware."
4. **[Why ASGI Exists](04-why-asgi-exists.md)** 🔴 - WSGI is synchronous; async (websockets, high concurrency) needs a new contract.
5. **[An ASGI App & the Servers](05-an-asgi-app-and-the-servers.md)** 🟡 - a bare ASGI app, uvicorn, and how FastAPI/Starlette sit on top.
6. **[From Protocol to Framework](06-from-protocol-to-framework.md)** 🟢 - Flask = a WSGI app, FastAPI = an ASGI app; the whole stack, seen.

> Once you've seen the callable, "a Python web framework" reads as "conveniences over a WSGI or ASGI
> app." The magic was always this contract.

---

[Phase 1: What WSGI Is →](01-what-wsgi-is.md)
