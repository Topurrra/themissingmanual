---
title: "The Broker & Worker"
guide: "celery-from-zero"
phase: 2
summary: "Meet the two processes that make Celery work: the broker (a Redis or RabbitMQ queue holding pending task messages) and the worker (a separate process that drains the queue and runs tasks)."
tags: [celery, broker, worker, redis, rabbitmq, queue, concurrency]
difficulty: beginner
synonyms: ["celery broker redis rabbitmq", "celery worker", "celery start worker", "celery broker url", "celery queue", "redis vs rabbitmq celery", "celery worker concurrency"]
updated: 2026-06-23
---

# The Broker & Worker

Phase 1 gave you the four-part shape: app → broker → worker → (result). This phase zooms in on the middle two pieces, the ones you actually have to *run*. Here's the mental model to hold onto: **your web app and your workers are different programs that never talk to each other directly.** They only ever talk to a thing in the middle — the broker. Once that clicks, half of Celery's "why isn't this working?" mysteries solve themselves.

## The broker: a mailbox between two processes

📝 **The broker is the message queue that sits between your app and the workers.** When your app wants a job done later, it doesn't call the worker — it drops a small message ("run `send_welcome_email` for user 42") into the broker. The message waits there until a worker is free to pick it up. That's the whole job of the broker: hold pending task messages, hand them out one at a time.

If you've read [Webhooks & Message Queues](/guides/webhooks-and-message-queues), this is exactly the producer/consumer queue from that guide. Your web app is the **producer** dropping messages; your workers are the **consumers** picking them up. Celery is a friendly Python layer on top of that same idea — it's not magic, it's a queue with good manners.

Two brokers cover almost everyone:

- **Redis** — an in-memory data store that doubles as a queue. Dead simple to run, one command to start, and the default choice for most people learning Celery or running small-to-medium apps. This guide uses Redis.
- **RabbitMQ** — a dedicated message broker built for exactly this. More moving parts to operate, but stronger delivery guarantees and richer routing (priorities, complex fan-out). Reach for it when you outgrow Redis or need those guarantees.

⚠️ **The broker is a separate service you have to run.** It is not part of your Python code and it doesn't start itself. No broker running means no queue exists, which means your tasks have nowhere to go. With Docker, starting Redis is a one-liner:

```bash
docker run -d -p 6379:6379 redis
```

*What just happened:* We started a Redis container in the background (`-d`) and exposed its default port `6379` to your machine. That URL — `localhost:6379` — is what Celery will connect to in a moment. (No Docker? A native `redis-server` install works the same way.)

## Creating the Celery app

The Celery "app" is a single Python object that holds your configuration — most importantly, *where the broker is*. It's tiny. Put this in a file called `tasks.py`:

```python
from celery import Celery

app = Celery("tasks", broker="redis://localhost:6379/0")
```

*What just happened:* We created one `Celery` instance. The first argument, `"tasks"`, is just a name (conventionally the module it lives in). The important part is `broker="redis://localhost:6379/0"` — the **broker URL**, which points Celery at the Redis we started. The `/0` on the end picks Redis database 0. This `app` object is what you'll attach tasks to in Phase 3; for now it's an empty Celery app that knows how to reach the queue.

💡 The broker URL is the single most important line of config you'll write. Get the host, port, or scheme wrong and everything downstream fails quietly — more on that at the end of this phase.

## The worker: the process that does the work

📝 **A worker is a separate process that connects to the broker, pulls task messages off the queue, and runs them.** Your web app does not run tasks. It only enqueues them. Something has to be on the other end of the queue actually executing the code — that something is the worker, and you start it yourself from a terminal:

```bash
celery -A tasks worker --loglevel=info
```

*What just happened:* The `celery` command-line tool started a worker. `-A tasks` tells it which app to use (your `tasks.py` from above, where the `app` object lives). `worker` is the subcommand that says "be a worker." `--loglevel=info` makes it chatty so you can see what it's doing. This process stays running in the foreground, waiting for jobs.

When it boots, a worker prints a banner that tells you everything about its setup:

```console
 -------------- celery@laptop v5.3.6
--- ***** -----
-- ******* ---- [config]
- *** --- * --- .> app:         tasks:0x7f9a1c
- ** ---------- .> transport:   redis://localhost:6379/0
- ** ---------- .> results:     disabled://
- *** --- * --- .> concurrency: 8 (prefork)
-- ******* ---- 
--- ***** ----- [queues]
 -------------- .> celery           exchange=celery(direct) key=celery

[tasks]
  . tasks.send_welcome_email
  . tasks.generate_report

[2026-06-23 10:14:02,331: INFO/MainProcess] Connected to redis://localhost:6379/0
[2026-06-23 10:14:02,402: INFO/MainProcess] celery@laptop ready.
```

*What just happened:* Read this banner top to bottom and it confirms the whole mental model. **transport** is the broker it connected to (your Redis). **results** is disabled — we haven't set up a result backend yet (that's Phase 4). **concurrency: 8 (prefork)** is how many tasks it can run at once (next section). The **[queues]** block shows it's listening on the default `celery` queue. The **[tasks]** list is every task it knows how to run — right now `send_welcome_email` and `generate_report`. The final `ready.` line means it's connected and waiting for work.

💡 Stop and notice: the worker and your web app are **two completely separate processes.** You start the web app one way, you start the worker another way, and the only thing they share is the broker URL. They could run on different machines and it would work identically. This separation is the entire point — slow work runs over *there*, in the worker, while your web request returns instantly over *here*.

## Concurrency: one worker, many tasks at once

📝 **A single worker can run several tasks simultaneously using a pool of sub-workers.** You control how many with `--concurrency`:

```bash
celery -A tasks worker --concurrency=4
```

*What just happened:* We told the worker to run up to 4 tasks at the same time. By default the worker uses the **prefork** pool, which means it forks 4 separate child processes; each one grabs a task and runs it independently. If `--concurrency` is omitted, Celery defaults to one child per CPU core (that's the `8` you saw in the banner).

📝 Which pool you want depends on what your tasks *do*:

- **prefork** (separate processes, the default) — best for **CPU-bound or blocking work**, like crunching numbers for a `generate_report`. Separate processes sidestep Python's GIL and isolate crashes, so one task blowing up doesn't take its siblings down.
- **gevent / eventlet** (lightweight green threads in one process) — best for **I/O-bound work** that spends most of its time *waiting*: calling an email API for `send_welcome_email`, hitting a database, fetching a URL. You can run hundreds of these cheaply because each one is mostly idle.

A rough rule: if your task burns CPU, use prefork; if it sits around waiting on the network, gevent/eventlet lets one worker handle far more of them. You can tune this later — the default prefork pool is a perfectly good starting point.

## The flow, end to end

💡 Now you can see the full hand-off in motion:

1. Your web app calls a task (Phase 3) → a message lands in the **broker** (Redis).
2. A free child in the **worker** pool pulls that message off the queue.
3. The worker runs your function and (optionally) stores what it returned in a **result backend** (Phase 4).

To make this real you need exactly three things running: a **broker** (Redis), a **worker** (the `celery ... worker` command), and your **app** (which enqueues jobs). With all three up, your web app can finally offload work and return instantly.

⚠️ **The number-one beginner trap: tasks that silently never run.** If you enqueue a job and *nothing happens* — no error, no result, just silence — the cause is almost always the broker. Either no broker is running, or your broker URL is wrong (typo in the host, wrong port, pointing at a Redis that isn't there). Celery happily accepts the task into a queue nobody is draining, and it sits there forever. So when a task seems to vanish, **check the broker first**: is Redis up? Does the URL in your `Celery(...)` call match where Redis actually is? Is a worker connected to that same URL? Nine times out of ten the answer is hiding in those three questions.

With the broker and worker understood and running, you're ready to actually write tasks and call them — which is Phase 3.

## Recap

- The **broker** is a message queue (Redis or RabbitMQ) that holds pending task messages between your app and your workers — it's the producer/consumer queue from [Webhooks & Message Queues](/guides/webhooks-and-message-queues).
- The broker is a **separate service you must run**; it's not part of your Python code and won't start itself.
- The **Celery app** is a small Python object (`Celery("tasks", broker=...)`) whose most important config is the **broker URL**.
- A **worker** is a separate process (`celery -A tasks worker`) that connects to the broker, pulls messages, and runs your tasks; its startup banner shows the broker, queues, registered tasks, and concurrency.
- **Concurrency** lets one worker run many tasks at once: `--concurrency=N`, with **prefork** (processes) for CPU/blocking work and **gevent/eventlet** for I/O-bound waiting.
- When a task silently never runs, **check the broker first** — no broker or a wrong broker URL is the classic culprit.

## Quick check

```quiz
[
  {
    "q": "What is the broker's job in Celery?",
    "choices": ["It runs your task functions", "It holds pending task messages between your app and the workers", "It stores the return value of finished tasks"],
    "answer": 1,
    "explain": "The broker is the message queue in the middle: your app drops task messages into it, and workers pull them out. Running the task is the worker's job; storing return values is the result backend's job."
  },
  {
    "q": "Your app enqueues a task but nothing ever happens — no error, no result. What's the most likely cause?",
    "choices": ["A syntax error in your task code", "Too much concurrency", "No broker is running, or the broker URL is wrong"],
    "answer": 2,
    "explain": "Silent no-ops almost always mean the broker. If no broker is up or the URL is wrong, Celery queues the task into a void where no worker can reach it. Check the broker first."
  },
  {
    "q": "Which pool fits a CPU-bound task like generating a heavy report?",
    "choices": ["gevent", "prefork (separate processes, the default)", "eventlet"],
    "answer": 1,
    "explain": "Prefork uses separate processes, which sidestep the GIL and isolate crashes — ideal for CPU-bound or blocking work. gevent/eventlet shine for I/O-bound tasks that mostly wait."
  }
]
```

---

[← Phase 1: What Celery Is & Why](01-what-celery-is.md) · [Guide overview](_guide.md) · [Phase 3: Defining & Calling Tasks →](03-defining-and-calling-tasks.md)
