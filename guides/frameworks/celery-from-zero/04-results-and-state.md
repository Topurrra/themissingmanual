---
title: "Results & State"
guide: "celery-from-zero"
phase: 4
summary: "How Celery stores task return values and status in a result backend, how to query them with AsyncResult, what the task states mean, and when you actually need results at all."
tags: [celery, result-backend, asyncresult, task-state, status, return-value, redis]
difficulty: intermediate
synonyms: ["celery result backend", "celery asyncresult", "celery task state status", "celery get task result", "celery task return value", "celery ignore_result", "celery pending success failure"]
updated: 2026-06-23
---

# Results & State

Here's the mental model before anything else: **the broker and the result backend are two different mailboxes.** In Phase 3 we kept saying `.delay()` hands you back an `AsyncResult` — a receipt. That receipt is only useful if there's somewhere for the worker to *write down* what happened. The broker carries the message *to* the worker; it does not carry the answer back. For that you need a second store, the **result backend**, where the worker records "this task finished, here's its return value" or "this task blew up, here's the error."

Once that clicks, the rest of this phase is just: how do I set up that second mailbox, how do I read from it, and — the part most people get wrong — do I even need it?

## The result backend

📝 To capture what a task returned (or even just whether it succeeded), Celery needs a **result backend**: a place to store outcomes, keyed by task id. It's configured separately from the broker, and it can be Redis, a SQL database, or a few other stores.

```python
# celery_app.py
from celery import Celery

app = Celery(
    "myapp",
    broker="redis://localhost:6379/0",     # where messages go OUT
    backend="redis://localhost:6379/1",    # where results come BACK
)
```

*What just happened:* We pointed `broker` and `backend` at the same Redis server but **different databases** (`/0` vs `/1`) — they're separate concerns, so we keep them in separate stores even when it's the same box. The broker holds pending *work*; the backend holds finished *outcomes*. They happen to both be Redis here, which is common, but they don't have to be — plenty of setups use Redis as broker and Postgres as backend.

⚠️ Without a backend configured, results are **discarded**. The task still runs perfectly fine — the email still sends — but `result.get()` will hang or error, and `result.status` can never move past `PENDING`, because there's nowhere for the worker to write the outcome. If you ever find yourself unable to read a result, the first thing to check is whether you set `backend=` at all.

## AsyncResult: your handle on a running task

📝 When you call `.delay()` (or `.apply_async()`), you get back an `AsyncResult` — a thin handle to one specific task, identified by its id. It doesn't *contain* the result; it knows how to go *ask the backend* about it. The pieces you'll use:

- `result.id` — the unique task id (a UUID string). Save this if you want to check back later.
- `result.ready()` — `True` if the task has finished (success or failure), `False` if still pending/running.
- `result.status` — the current state, e.g. `"PENDING"`, `"SUCCESS"`, `"FAILURE"`.
- `result.get(timeout=...)` — fetch the actual return value, **blocking** until it's ready (or the timeout expires).

```python
# enqueue and hold onto the receipt
result = generate_report.delay(account_id, "2026-06")

print(result.id)        # "d5b8...e91" — a handle you could store and reload
print(result.ready())   # False — the worker probably hasn't finished yet
print(result.status)    # "PENDING"

# later, when you actually need the answer:
report_path = result.get(timeout=30)   # blocks up to 30s, then returns the value
```

*What just happened:* `.delay()` returned instantly with a receipt. `ready()` and `status` are cheap, non-blocking peeks at the backend — they answer "is it done yet?" without waiting. `get()` is the opposite: it **sits and waits** for the worker to finish, then hands you whatever the task `return`ed (here, the path `generate_report` produced). The `timeout=30` is a safety valve so you're not blocked forever if the worker is wedged.

⚠️ `get()` **blocks the calling thread until the task completes.** That's fine in a one-off script or the shell. It is a trap inside a web request — you'd hand control to Celery only to immediately sit and wait for it, throwing away the entire point of going async. The request hangs exactly as long as if you'd never used Celery.

⚠️ Worse: **never call `.get()` inside another task.** A worker blocking on another task's result can deadlock the whole pool — if all your workers are busy waiting on results that only a free worker could produce, nothing moves. Celery will even warn you about this. If you need to chain work, that's what chains and workflows are for (a later topic), not nested `get()` calls.

## Task states

📝 A task moves through a small set of states, and the backend records the latest one:

- **PENDING** — Celery doesn't know anything yet. Queued but not started, *or* an id it's never heard of (more on that below).
- **STARTED** — a worker has picked it up and begun (only tracked if you opt in via `task_track_started`).
- **SUCCESS** — finished cleanly; the return value is in the backend.
- **FAILURE** — raised an exception; the backend holds the traceback.
- **RETRY** — failed but is scheduled to run again (Phase 5).
- **REVOKED** — cancelled before it could run.

```python
result = send_welcome_email.delay(user.id)

result.status        # "PENDING"  — just enqueued
# ...worker picks it up and runs...
result.status        # "SUCCESS"
result.successful()  # True
result.failed()      # False
```

*What just happened:* We watched one task walk from `PENDING` to `SUCCESS`. The convenience methods `successful()` / `failed()` are just readable wrappers over `status`. The flow is always: unknown/queued → (started) → a terminal state (`SUCCESS`, `FAILURE`, or `REVOKED`), possibly looping through `RETRY` on the way.

⚠️ Here's the confusion that bites everyone: **PENDING also means "I have no record of this id."** Celery's backend stores a result *after* a task reaches a terminal state — it does **not** write a row the moment you enqueue. So Celery genuinely cannot tell "queued, waiting for a worker" apart from "this id never existed / was a typo." Both report `PENDING`. If you query a result and it's stuck `PENDING` forever, don't assume it's still running — it may have finished and expired, or you may be checking an id the backend never saw (often because no backend was configured at all).

## When you need results — and when you don't

💡 The honest default for a lot of background work is: **you don't need the result.** `send_welcome_email` is fire-and-forget — nobody is waiting on its return value, and "did the email send?" is answered by your email provider's logs, not by polling Celery. Storing a result for it is pure overhead: every finished task writes a row to the backend that nobody will ever read, and those rows pile up.

📝 You can turn results off per-task or globally:

```python
@app.task(ignore_result=True)
def send_welcome_email(user_id):
    user = User.objects.get(id=user_id)
    send_email(to=user.email, subject="Welcome aboard!", body=render_welcome(user))

# or globally, in config:
# app.conf.task_ignore_result = True
```

*What just happened:* `ignore_result=True` tells Celery not to bother writing this task's outcome to the backend. The task runs identically; we've only stopped recording an answer no one asked for. For a busy email queue that's a real saving in backend writes and storage.

💡 You **do** need results when something downstream waits on the outcome: a user clicked "Download report" and the file path comes back from `generate_report`; or one step feeds the next in a chain. The rule of thumb: **keep a result only if a real reader exists.** Don't store results you'll never read — they're not free.

## Polling vs pushing

So a user kicks off `generate_report` and wants to know when it's ready. You already know not to block the request with `get()`. What do you do instead?

💡 The simple, robust pattern is **polling by id**:

1. The request enqueues the task and immediately returns `result.id` to the client.
2. The client (or a status endpoint) checks back periodically: "is task `d5b8…` done?"
3. When the status flips to `SUCCESS`, fetch the value and show the download link.

```python
# views.py
def start_report(request):
    result = generate_report.delay(request.user.account_id, "2026-06")
    return json({"task_id": result.id})          # return the receipt, don't wait

def report_status(request, task_id):
    result = generate_report.AsyncResult(task_id)  # rebuild the handle from the id
    if result.ready():
        return json({"state": result.status, "url": result.result})
    return json({"state": result.status})          # still PENDING/STARTED
```

*What just happened:* `start_report` returns instantly with just the id — the request is never blocked. `report_status` reconstructs an `AsyncResult` **from that id alone** (note: no new task is enqueued; we're just looking one up) and reports whether it's done. The client polls this second endpoint every couple of seconds. Nobody blocks; the worker churns away independently. For richer experiences you can skip polling entirely and **push** completion — a websocket message or a webhook the task fires on success — so the UI updates the instant the report lands.

⚠️ One last gotcha: **results expire.** Celery deletes them from the backend after `result_expires` (24 hours by default), so a result is a short-lived notification, not durable storage. If a user might come back next week for that report, persist the real outcome (the file, a DB row) yourself — don't expect to read it back out of the Celery backend. And of course, sometimes the status you poll won't be `SUCCESS` but `FAILURE` or `RETRY` — handling *that* gracefully is exactly where Phase 5 picks up.

## Recap

- The **result backend** is a separate store from the broker — configure it with `backend=`. The broker carries work out; the backend carries outcomes back. Without one, results are discarded and status never leaves `PENDING`.
- `.delay()` returns an **`AsyncResult`**: a handle by id. Use `result.id`, `result.ready()`, `result.status` for cheap non-blocking peeks, and `result.get(timeout=...)` to fetch the return value.
- **`.get()` blocks.** Never call it inside a web request (defeats the purpose) or inside another task (can deadlock the worker pool).
- Task states run **PENDING → STARTED → SUCCESS / FAILURE / RETRY / REVOKED.** `PENDING` is ambiguous: it also means "unknown id," so don't read it as proof a task is still running.
- Skip results for fire-and-forget work (`ignore_result=True`); keep them only when a real reader waits. Expose a **status endpoint and poll by id** rather than blocking — and remember results **expire** (`result_expires`), so persist anything you need long-term yourself.

## Quick check

Check your grip on results and state before we get into failures:

```quiz
[
  {
    "q": "You configured Celery with only broker= and no backend=. A task runs fine, but result.status stays PENDING forever. Why?",
    "choices": [
      "The worker crashed silently",
      "With no result backend there is nowhere to record the outcome, so status can never advance",
      "PENDING means the task is still running"
    ],
    "answer": 1,
    "explain": "The backend is where outcomes get written. With no backend, results are discarded and status is stuck — the task still ran, you just can't observe its outcome."
  },
  {
    "q": "Why is calling result.get() inside a web request a mistake?",
    "choices": [
      "It returns the wrong value",
      "It blocks the request until the task finishes, throwing away the whole point of going async",
      "get() only works in the shell"
    ],
    "answer": 1,
    "explain": ".get() blocks the caller until completion. In a request that means the user waits exactly as long as a synchronous call — return the task id and poll a status endpoint instead."
  },
  {
    "q": "A task is fire-and-forget (send_welcome_email) and nothing ever reads its return value. What's the sensible setup?",
    "choices": [
      "Set ignore_result=True so Celery doesn't store an outcome nobody reads",
      "Always store the result so you have a record",
      "Call .get() after .delay() to confirm it sent"
    ],
    "answer": 0,
    "explain": "Storing results you'll never read is pure overhead that piles up in the backend. ignore_result=True skips the write; the task runs identically."
  }
]
```

---

[← Phase 3: Defining & Calling Tasks](03-defining-and-calling-tasks.md) · [Guide overview](_guide.md) · [Phase 5: Retries & Error Handling →](05-retries-and-error-handling.md)
