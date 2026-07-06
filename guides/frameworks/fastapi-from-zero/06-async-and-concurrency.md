---
title: "Async & Concurrency"
guide: "fastapi-from-zero"
phase: 6
summary: "How FastAPI's event loop serves many requests on one thread, when to write async def vs plain def, and the #1 performance bug — blocking the event loop with a sync call inside async def."
tags: [fastapi, async, await, asyncio, event-loop, concurrency, blocking, threadpool]
difficulty: intermediate
synonyms: ["fastapi async def vs def", "fastapi when to use async", "fastapi blocking event loop", "fastapi asyncio", "fastapi run sync in threadpool", "fastapi async database", "async await fastapi explained"]
updated: 2026-06-22
---

# Async & Concurrency

This is the phase where FastAPI either clicks or burns you. People hear "FastAPI is async, async is fast"
and sprinkle `async def` on everything like seasoning — then one slow database call quietly freezes their
entire server under load. The good news: there's a tiny mental model underneath all of it, and once you
have it, the rules write themselves. Build the model first, then the rules, then the one trap that
catches almost everyone.

## The mental model: one thread that refuses to wait

📝 **The event loop.** FastAPI runs on an **ASGI** server (Uvicorn), and at its heart is a single thread
running an **event loop**. That one thread serves *many* concurrent requests — not by cloning itself, but
by never sitting idle. When a request hits a point where it has to *wait* (a database round-trip, an HTTP
call to another service), the loop doesn't block on it. It parks that request and goes to run another one.
When the awaited thing is ready, it comes back and picks up where it left off.

If you've met this idea in JavaScript, it's the *same* idea — one loop, cooperative switching at `await`
points. The full machinery is in [Async/Await & the Event Loop](/guides/async-await-and-the-event-loop).
Under the hood it's Python's `asyncio`, the same model (and the same GIL caveat) covered in
[Python From Zero](/guides/python-from-zero).

💡 The key insight: concurrency here doesn't come from *more threads*. It comes from **not blocking**
while waiting. One thread can keep hundreds of requests in flight as long as each one steps aside (via
`await`) during its waits instead of hogging the loop.

The gesture, in pure Python — no server needed, run it and watch the order:

```python runnable
import asyncio

async def fetch(name, seconds):
    print(f"{name} starting")
    await asyncio.sleep(seconds)     # stands in for a network/DB wait; yields the loop here
    print(f"{name} done after {seconds}s")
    return name

async def main():
    # kick off two "requests" concurrently on ONE thread
    results = await asyncio.gather(
        fetch("request-A", 2),
        fetch("request-B", 1),
    )
    print("both finished:", results)

asyncio.run(main())
```

*What just happened:* both `fetch` calls started immediately. At each `await asyncio.sleep(...)`, the
task said "I'm about to wait — go run something else," and the single loop switched to the other one. So
`B` (1s) finished before `A` (2s), and the whole thing took about **2 seconds, not 3**. That's the event
loop: one thread, overlapping the waits. `await` means "I might pause here; let the loop do other work" —
exactly how your `async def` endpoints share one thread across many requests.

## `async def` vs `def` path operations — FastAPI accepts both

Something that surprises people: FastAPI happily takes endpoints written **either way**, and it does
something different with each.

📝 **The two paths:**

- An **`async def`** endpoint runs **directly on the event loop**. It shares the loop with every other
  request, so it must never block (more on that in a moment).
- A plain **`def`** endpoint is run in a **threadpool** — FastAPI offloads it to a separate worker thread
  so that even if it blocks, it can't freeze the loop.

Both are first-class. FastAPI isn't tolerating `def` as a legacy thing; it's a deliberate, correct choice
for a whole category of work. The question is never "which is faster" — it's "what does my endpoint *do*
inside?"

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/books/async")
async def list_books_async():
    # runs ON the event loop — fine, because there's nothing blocking here
    return {"books": ["Dune", "Neuromancer"]}

@app.get("/books/sync")
def list_books_sync():
    # runs in a THREADPOOL — FastAPI moved it off the loop for us
    return {"books": ["Dune", "Neuromancer"]}
```

*What just happened:* both endpoints return the same thing and both work perfectly. The only difference
is *where they run*. `list_books_async` executes on the loop's thread; `list_books_sync` gets handed to a
threadpool worker. For trivial bodies like these it doesn't matter — the difference becomes everything
the moment real work (a DB call, an HTTP request) shows up inside.

## The rule: match the keyword to the work

💡 You don't have to guess. There's a single decision:

> **Use `async def` when you `await` truly async I/O. Use plain `def` when your work is blocking or
> synchronous — FastAPI will move it to a thread for you.**

- Calling an **async** library — an async database driver, `httpx.AsyncClient`, an async cache client?
  Write **`async def`** and `await` it. You stay on the loop and yield politely during the wait.
- Calling a **sync/blocking** library — a synchronous DB driver, `requests`, file I/O, or CPU work? Write
  plain **`def`**. FastAPI runs it in the threadpool so its blocking can't stall the loop.

Here are both, done right:

```python
import httpx
from fastapi import FastAPI

app = FastAPI()

# ASYNC work → async def + await
@app.get("/books/{book_id}/cover")
async def get_cover(book_id: int):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://covers.example.com/{book_id}")  # awaits — yields the loop
    return {"book_id": book_id, "cover_url": resp.json()["url"]}

# BLOCKING work → plain def (threadpool)
@app.get("/books/report")
def generate_report():
    import time
    time.sleep(2)                 # a blocking, synchronous operation (stand-in for a sync DB / heavy lib)
    return {"report": "ready"}
```

*What just happened:* `get_cover` does real network I/O with an **async** client, so it's `async def` and
`await`s the call — while it waits for the cover service, the loop serves other requests.
`generate_report` calls something **blocking** (`time.sleep`, standing in for a sync DB query or a
blocking library), so it's plain `def` — FastAPI runs it in a threadpool worker, and the event loop stays
free the whole time. Each keyword matches what's actually inside the body — the entire rule.

## ⚠️ The cardinal sin: blocking the event loop

The single most common FastAPI performance bug, and it looks completely innocent.

⚠️ **Never call a blocking function inside an `async def`.** If you put a synchronous DB call, a
`requests.get()`, or a `time.sleep()` directly inside an `async def` endpoint, you don't just slow down
*that* request — you freeze the **entire event loop**. One thread serves everyone. While that thread
sits inside a blocking call, it cannot switch to any other request. Every concurrent user stalls until
your one slow call returns.

The bug runs, returns the right answer, and quietly destroys your throughput under load:

```python
import time
from fastapi import FastAPI

app = FastAPI()

@app.get("/books/slow")
async def slow_books():
    time.sleep(2)        # 🚨 BLOCKING call inside async def — freezes the whole loop for 2 seconds
    return {"books": ["Dune"]}
```

*What just happened:* `time.sleep(2)` is *synchronous*. It blocks the thread it runs on — and that
thread is the event loop. For those 2 seconds, **no other request can be served**, no matter how fast
those other requests are. One user hitting this endpoint makes everyone else wait. It works fine when
tested alone, which is exactly why this bug ships to production and only shows up when traffic arrives.

There are three honest fixes. Pick by what the blocking thing actually is:

**Fix 1 — make it truly async.** If an async equivalent exists, use it and `await`:

```python
import asyncio
from fastapi import FastAPI

app = FastAPI()

@app.get("/books/slow")
async def slow_books():
    await asyncio.sleep(2)     # ✅ async wait — yields the loop; other requests run during these 2s
    return {"books": ["Dune"]}
```

*What just happened:* `await asyncio.sleep(2)` waits *cooperatively*. Instead of holding the thread
hostage, it hands the loop back so other requests run during the wait. Same 2-second delay for *this*
caller, zero impact on everyone else. (In real code: swap the sync DB driver for an async one, swap
`requests` for `httpx.AsyncClient`.)

**Fix 2 — use plain `def`.** If there's no async version of the library, drop `async` and let FastAPI's
threadpool handle the blocking:

```python
import time
from fastapi import FastAPI

app = FastAPI()

@app.get("/books/slow")
def slow_books():               # ✅ plain def → runs in the threadpool, off the loop
    time.sleep(2)               # blocking is fine here; it's not on the event loop's thread
    return {"books": ["Dune"]}
```

*What just happened:* by removing `async`, the endpoint runs in a threadpool worker. Now `time.sleep`
blocks *that worker thread*, not the event loop — so the loop keeps serving everyone else. Often the
simplest fix when you're stuck with a synchronous library.

**Fix 3 — offload from inside an `async def`.** Sometimes you're already in an `async def` (maybe you
`await` something else too) but you *have* to call one blocking function. Use `run_in_threadpool`:

```python
import time
from fastapi import FastAPI
from fastapi.concurrency import run_in_threadpool

app = FastAPI()

@app.get("/books/slow")
async def slow_books():
    await run_in_threadpool(time.sleep, 2)   # ✅ push the blocking call onto a worker thread, await it
    return {"books": ["Dune"]}
```

*What just happened:* `run_in_threadpool` shoves the blocking `time.sleep` onto a worker thread and gives
you back an awaitable. You `await` it, so the loop is free during the wait, and the blocking call happens
safely off-loop. The escape hatch for "I'm in async-land but this one library is stubbornly sync."

🪖 **War story.** A team ships an `async def` endpoint that calls their old synchronous Postgres driver
directly. Tests pass, demo is snappy. In production, the moment more than a handful of users hit it at
once, *every* endpoint on the service crawls — health checks time out, the load balancer starts killing
pods. The fix was one keyword: delete `async`. The blocking driver moved to the threadpool and the loop
was free again. Knowing this rule turns a 3am incident into a non-event.

## CPU-bound work, and an honest limit

⚠️ The part the hype skips: **async helps with I/O-bound concurrency, not CPU-bound work.** Async is
about overlapping *waiting*. If your endpoint does heavy computation — resizing images, crunching a giant
dataset, hashing in a loop — there's no waiting to overlap. Because of Python's **GIL** (the full story is
in [Python From Zero](/guides/python-from-zero)), threads don't give true parallelism for pure-Python CPU
work either. So even a plain `def` in the threadpool won't make CPU work *parallel* — it just keeps it
off the event loop.

For genuinely heavy CPU work, neither `async def` nor the threadpool is the answer. Reach for a **process
pool** (separate processes, separate GILs, real parallelism) or push the job to a **background worker
queue** (Celery, RQ, Dramatiq) and have the endpoint return quickly with a job id.

💡 **The whole takeaway:** match the keyword to the work. `async def` + `await` for async I/O. Plain
`def` for blocking or synchronous I/O. Never block the loop. For heavy CPU, get off the web process
entirely. Get this right and FastAPI's speed is yours; get it wrong and one sleepy call takes the whole
server down.

## Recap

1. **FastAPI runs on a single-threaded event loop** (ASGI/Uvicorn). It serves many concurrent requests by
   *not blocking* during waits — at each `await`, it parks one request and runs another.
2. FastAPI accepts **both** endpoint styles: `async def` runs **on the loop**; plain `def` runs in a
   **threadpool** so its blocking can't stall the loop. Neither is "the fast one" — they're for different work.
3. **The rule:** `async def` + `await` when you call truly async I/O (async DB driver, `httpx`); plain `def`
   when the work is blocking/synchronous (`requests`, sync driver, file I/O) — FastAPI offloads it.
4. **The cardinal sin:** a blocking call (`time.sleep`, sync DB, `requests.get`) inside an `async def`
   freezes the *entire* loop, stalling every concurrent request. The #1 FastAPI performance bug.
5. **Three fixes:** make it truly async (`await` an async equivalent), switch to plain `def` (threadpool),
   or `run_in_threadpool(...)` from inside an `async def`.
6. **Async is for I/O-bound concurrency, not CPU-bound work** — the GIL means threads don't parallelize
   pure-Python computation. Use a process pool or a background worker for heavy CPU.

## Quick check

Lock in the model that keeps your server alive under load:

```quiz
[
  {
    "q": "Why does calling time.sleep(2) (a blocking call) inside an async def endpoint hurt every request, not just that one?",
    "choices": ["It uses too much memory", "FastAPI serves async def endpoints on a single event-loop thread; a blocking call holds that thread, so no other request can be served until it returns", "time.sleep is deprecated in async code", "It opens a new database connection for every caller"],
    "answer": 1,
    "explain": "async def runs on the one event-loop thread. A synchronous/blocking call holds that thread hostage, so the loop can't switch to any other request — everyone stalls for the full duration."
  },
  {
    "q": "Your endpoint must call a synchronous, blocking database driver (no async version available). What's the cleanest correct choice?",
    "choices": ["Write it as async def and call the driver directly", "Write it as a plain def so FastAPI runs it in the threadpool", "Wrap the whole thing in asyncio.run()", "Add more Uvicorn workers and call it from async def anyway"],
    "answer": 1,
    "explain": "A plain def endpoint is run in FastAPI's threadpool, so the blocking driver blocks a worker thread, not the event loop. (Or, from inside an async def, use run_in_threadpool.) Calling a blocking driver directly inside async def freezes the loop."
  },
  {
    "q": "You have a CPU-heavy endpoint (resizing large images in pure Python) and want it to actually use multiple cores. Does making it async def help?",
    "choices": ["Yes — async def automatically parallelizes CPU work", "Yes — the event loop spreads CPU work across cores", "No — async helps overlap I/O waits, not CPU work; and the GIL blocks true thread parallelism. Use a process pool or background worker", "No — CPU work is impossible to speed up in Python at all"],
    "answer": 2,
    "explain": "Async overlaps waiting, and there's no waiting in pure computation. The GIL also prevents threads from parallelizing pure-Python CPU work, so the threadpool won't make it parallel either. Offload to a process pool or a background worker queue."
  }
]
```

---

[← Phase 5: Dependency Injection with Depends()](05-dependency-injection.md) · [Guide overview](_guide.md) · [Phase 7: Databases with SQLModel →](07-databases-with-sqlmodel.md)
