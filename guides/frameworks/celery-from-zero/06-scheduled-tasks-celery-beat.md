---
title: "Scheduled Tasks with Celery Beat"
guide: "celery-from-zero"
phase: 6
summary: "Run Celery tasks on a timetable with Celery Beat - a scheduler that enqueues jobs on intervals or crontab schedules, while your normal workers do the actual work."
tags: [celery, celery-beat, scheduled-tasks, periodic, cron, crontab, scheduling]
difficulty: intermediate
synonyms: ["celery beat", "celery scheduled tasks", "celery periodic tasks", "celery crontab schedule", "celery beat_schedule", "celery cron jobs", "celery recurring tasks"]
updated: 2026-07-10
---

# Scheduled Tasks with Celery Beat

So far every task in this guide has been triggered by *something happening* - a user signs up, a report is requested, a web request comes in and your app fires off a job. But a huge amount of real work isn't request-triggered at all. It's work that just needs to happen *on a schedule*, whether anyone's looking or not.

📝 Think about a typical web app: a digest email that goes out every morning at 7am, a cleanup job that sweeps away old reports every hour, a billing summary that runs on the first of the month. Nobody clicks a button for these - they run because the clock said so. What you want is something cron-like - a way to run your existing Celery tasks on a timetable. That's exactly what Celery Beat gives you.

If you've used Unix cron (covered in [The Terminal & Shell](/guides/the-terminal-and-shell)), the mental model will feel familiar: a clock that fires jobs at set times. Beat is that clock, but for your Celery tasks specifically.

## What Celery Beat is: the clock, not the doer

📝 **Beat is a scheduler process. It does not run your tasks itself.** This is the single most important thing to understand, and it trips people up constantly. When the schedule says "time to run `send_daily_digest`," Beat doesn't execute that function. Instead, it *enqueues a message* into the broker - the same Redis queue from [Phase 2](02-the-broker-and-worker.md) - and a normal worker picks it up and runs it, exactly like any other task.

So the division of labor is clean:

- **Beat = the clock.** It watches the schedule and drops task messages into the broker at the right times.
- **The worker = the doer.** It pulls those messages off the queue and actually runs your code.

You start Beat as its own process, separate from your worker:

```bash
celery -A tasks beat --loglevel=info
```

*What just happened:* we launched the Beat scheduler. `-A tasks` points it at your Celery app (same `tasks.py` as always), and `beat` is the subcommand that says "be the scheduler." This process stays running, watching the clock. When a scheduled time arrives, it enqueues the matching task and goes back to waiting.

⚠️ **Beat only schedules - it never executes.** If you run *only* Beat with no worker, your scheduled tasks will pile up in the broker and never run. You need both processes alive at the same time: Beat to enqueue on schedule, and at least one worker to drain the queue. A common "my nightly job isn't running" bug is forgetting to keep a worker up.

## Defining a schedule

You tell Beat what to run and when through `app.conf.beat_schedule` - a dictionary where each entry names a task, a schedule, and (optionally) arguments. Put this in your `tasks.py`:

```python
from celery import Celery
from celery.schedules import crontab

app = Celery("tasks", broker="redis://localhost:6379/0")

app.conf.beat_schedule = {
    "daily-digest-email": {
        "task": "tasks.send_daily_digest",
        "schedule": crontab(hour=7, minute=0),
    },
    "hourly-report-cleanup": {
        "task": "tasks.cleanup_old_reports",
        "schedule": 3600.0,
    },
}
```

*What just happened:* we defined two scheduled entries. The dictionary *keys* (`"daily-digest-email"`, `"hourly-report-cleanup"`) are just human-readable names for each schedule - pick whatever's clear. Inside each entry, `"task"` is the dotted name of the task to run (the same string you'd see in the worker's `[tasks]` banner), and `"schedule"` says when. The digest uses `crontab(hour=7, minute=0)` - "every day at 7:00am." The cleanup uses a plain number, `3600.0` - "every 3600 seconds," once an hour.

💡 Two flavors of schedule, two use cases. A **plain number** (or a `timedelta`) means "every N seconds" - a fixed *interval*. A **`crontab(...)`** means "at these calendar times" - wall-clock scheduling. The cleaner version of that hourly cleanup uses `timedelta` so the intent reads at a glance:

```python
from datetime import timedelta

app.conf.beat_schedule = {
    "hourly-report-cleanup": {
        "task": "tasks.cleanup_old_reports",
        "schedule": timedelta(hours=1),
    },
}
```

*What just happened:* `timedelta(hours=1)` is exactly equivalent to `3600.0` but says what it means. Reach for intervals when "every so often" is enough and the exact wall-clock time doesn't matter; reach for `crontab` when it has to happen at, say, 7am sharp.

If your task takes arguments, pass them with an `"args"` (tuple) or `"kwargs"` (dict) key:

```python
app.conf.beat_schedule = {
    "weekly-summary": {
        "task": "tasks.send_summary",
        "schedule": crontab(hour=9, minute=0, day_of_week="monday"),
        "args": ("weekly",),
    },
}
```

*What just happened:* each Monday at 9:00am, Beat enqueues `send_summary("weekly")`. The `"args"` tuple passes straight through to your task function, just as if you'd called `send_summary.delay("weekly")` yourself.

## crontab schedules in a bit more depth

📝 The `crontab()` schedule mirrors Unix cron: you specify some combination of `minute`, `hour`, `day_of_week`, `day_of_month`, and `month_of_year`, and Beat fires the task whenever the clock matches. Anything left out defaults to "every" - so `crontab(minute=0)` means "at minute 0 of *every* hour."

A few examples to anchor it:

```python
crontab(minute=0, hour=7)                          # every day at 7:00am
crontab(minute=0, hour=9, day_of_week="monday")    # every Monday at 9:00am
crontab(minute="*/15")                             # every 15 minutes
crontab(minute=0, hour=0, day_of_month=1)          # midnight on the 1st of each month
```

*What just happened:* each line is a wall-clock rule. Note `minute="*/15"` - the `*/N` step syntax is straight from cron and means "every 15th minute." If cron's field syntax is fuzzy, the cron reference in [The Terminal & Shell](/guides/the-terminal-and-shell) covers the same `minute hour day month weekday` grammar Beat borrows from.

⚠️ **Timezones will bite you.** By default Celery interprets `crontab` times in UTC, *not* your local time - so `crontab(hour=7)` might fire at what feels like the middle of the night. Set the timezone explicitly so 7am means 7am where you live:

```python
app.conf.timezone = "America/New_York"
app.conf.enable_utc = True
```

*What just happened:* we told Celery to evaluate schedules against New York time. Now `crontab(hour=7)` fires at 7am Eastern. ⚠️ Double-check this in production: a digest that's supposed to land at breakfast but goes out at 2am is the classic symptom of a forgotten `timezone` setting.

## Production gotchas

⚠️ **Run exactly one Beat process. Ever.** This is the big one. Beat is the clock, and if you run *two* clocks, every scheduled task gets enqueued twice - your daily digest goes out to every user twice, your cleanup runs in duplicate. This "double-scheduled tasks" bug is sneaky because everything looks fine until someone notices the duplicate emails. One worker can (and should) be scaled to many processes, but Beat must be a single instance. Be especially careful deploying multiple app servers - it's dangerously easy to accidentally start Beat on each one.

💡 Because a schedule can fire a task more than once - two Beats, a restart that re-fires a missed slot, a retry from [Phase 5](05-retries-and-error-handling.md) - your **periodic tasks should be idempotent too.** Running `cleanup_old_reports` twice in a row should be harmless; sending the digest twice should not double-charge or double-notify. Same "make running it twice safe" discipline as the retries phase, same underlying reason: at-least-once delivery means *plan for twice*.

For schedules that need to change at runtime - letting admins add or edit scheduled jobs from a UI, or storing schedules in a database instead of hardcoding them in `tasks.py` - reach for a database-backed scheduler:

- **`django-celery-beat`** stores the schedule in your Django database, editable through the admin. Great if you're already on Django.
- **`RedBeat`** stores the schedule in Redis and is designed to coordinate so you can run it more safely in multi-instance setups.

💡 Put it all together and the recipe for reliable scheduled work is short: **Beat (the clock) + workers (the doers) + idempotent tasks (the safety net).** Keep exactly one Beat running, keep workers up to drain what it enqueues, and write your periodic tasks so a double-fire never hurts. That foundation is what Phase 7 builds on when we take all of this - workers, retries, schedules - into production for real.

## Recap

- **Celery Beat is a scheduler process**, started with `celery -A tasks beat`. It runs separately from your worker.
- Beat is **the clock, not the doer**: on schedule it *enqueues* tasks into the broker, and a normal worker runs them. No worker running means scheduled tasks never execute.
- Define schedules in **`app.conf.beat_schedule`** - each entry has a `"task"` name, a `"schedule"`, and optional `"args"`/`"kwargs"`.
- Use a **number/`timedelta`** for fixed intervals ("every N seconds") and **`crontab(...)`** for calendar timing ("every day at 7am," "every Monday 9am"). Set `app.conf.timezone` or schedules run in UTC.
- **Run exactly one Beat process** - two Beats double-schedule every task. For runtime-editable or DB-backed schedules, use `django-celery-beat` or `RedBeat`.
- **Periodic tasks should be idempotent**, since a schedule can fire twice on restarts or duplicate Beats.

## Quick check

```quiz
[
  {
    "q": "When a scheduled time arrives, what does Celery Beat actually do?",
    "choices": ["Runs the task function directly inside the Beat process", "Enqueues a task message into the broker for a worker to run", "Sends the result back to your web app"],
    "answer": 1,
    "explain": "Beat is the clock, not the doer. On schedule it drops a task message into the broker, and a normal worker picks it up and executes it. That's why you still need a worker running alongside Beat."
  },
  {
    "q": "Which schedule means 'every day at 7:00am'?",
    "choices": ["schedule=7.0", "crontab(hour=7, minute=0)", "timedelta(hours=7)"],
    "answer": 1,
    "explain": "crontab(hour=7, minute=0) is calendar/wall-clock timing - 7:00am every day. A plain number or timedelta is a fixed interval ('every N seconds'), not a specific time of day."
  },
  {
    "q": "Why is it critical to run exactly one Beat process?",
    "choices": ["Beat can only connect to one broker at a time", "Two Beat processes double-schedule every task, causing duplicate jobs", "Multiple Beats slow down the workers"],
    "answer": 1,
    "explain": "Each Beat is an independent clock. Two clocks means every scheduled task gets enqueued twice - duplicate emails, double cleanups. Scale workers freely, but keep Beat to a single instance (and make tasks idempotent as a safety net)."
  }
]
```

---

[← Phase 5: Retries & Error Handling](05-retries-and-error-handling.md) · [Guide overview](_guide.md) · [Phase 7: Production: Scaling, Monitoring & Pitfalls →](07-production-scaling-monitoring.md)
