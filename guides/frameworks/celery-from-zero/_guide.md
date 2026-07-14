---
title: "Celery From Zero"
guide: "celery-from-zero"
phase: 0
summary: "Learn the distributed task queue that runs background work for Python web apps: the broker/worker/result model, defining and calling tasks, results and state, retries and error handling, scheduled tasks with Celery Beat, and production scaling, monitoring, and the pitfalls. Move slow work off the request and run it reliably."
tags: [celery, python, task-queue, background-jobs, broker, worker, redis, async-work]
category: frameworks
order: 15
group: "Python"
difficulty: intermediate
synonyms: ["learn celery", "celery tutorial", "celery task queue", "celery broker worker", "celery delay apply_async", "celery retries", "celery beat scheduled tasks", "celery vs rq dramatiq", "python background jobs"]
updated: 2026-06-23
---

# Celery From Zero

Some work is too slow to do during a web request: sending an email, generating a report, processing an
upload, calling a slow third-party API. Make the user wait for it and your app feels broken. Celery is the
answer the Python world reaches for - a **distributed task queue** that lets your app hand a job off to
run *later*, on a separate pool of worker processes, while the request returns instantly. FastAPI,
Django, and Flask apps all lean on it for exactly this.

The mental model that makes Celery click is a four-part hand-off: your app puts a **task** message on a
**broker** (a queue, usually Redis or RabbitMQ); one of several **workers** picks it up and runs it; and
an optional **result backend** stores what it returned. Once you see those four pieces - and that they're
separate processes talking through a queue - Celery stops being intimidating configuration and becomes a
shape you can reason about (and debug).

> 📝 This assumes **Python** ([Python From Zero](/guides/python-from-zero)) and pairs naturally with the
> queue concepts in [Webhooks & Message Queues](/guides/webhooks-and-message-queues). It's the background
> worker that the framework guides ([FastAPI](/guides/fastapi-from-zero), [Django](/guides/django-from-zero),
> [Flask](/guides/flask-from-zero)) all hand heavy jobs to. Celery needs a broker + worker processes, so
> examples are shown with the commands to run them yourself.

## How to read this

Read in order - it builds from a single background task up to scheduled jobs and a monitored production
setup, using a running example of a web app offloading email and report work. Phases carry difficulty
badges.

## The phases

**Part 1 - The core model (🟢 Basic → 🟡)**
1. **[What Celery Is & Why](01-what-celery-is.md)** 🟢 - the problem, and the broker/worker/result mental model.
2. **[The Broker & Worker](02-the-broker-and-worker.md)** 🟢 - the queue (Redis/RabbitMQ) and the worker processes that drain it.
3. **[Defining & Calling Tasks](03-defining-and-calling-tasks.md)** 🟡 - `@task`, `.delay()`/`.apply_async()`, and how a job gets queued and run.

**Part 2 - Doing it right (🟡 → 🔴)**
4. **[Results & State](04-results-and-state.md)** 🟡 - the result backend, `AsyncResult`, and tracking task status.
5. **[Retries & Error Handling](05-retries-and-error-handling.md)** 🔴 - retrying failures, idempotency, and not losing work.
6. **[Scheduled Tasks with Celery Beat](06-scheduled-tasks-celery-beat.md)** 🟡 - periodic, cron-like jobs.

**Part 3 - Production (🔴 → 🟢)**
7. **[Production: Scaling, Monitoring & Pitfalls](07-production-scaling-monitoring.md)** 🔴 - concurrency, Flower, and the mistakes that bite everyone.
8. **[Where to Go Next](08-where-to-go-next.md)** 🟢 - Celery vs the alternatives, framework integration, and what to build.

> The whole thing is a hand-off: app → broker → worker → (result). Hold those four pieces and Celery's
> configuration and quirks all fall into place.

---

[Phase 1: What Celery Is & Why →](01-what-celery-is.md)
