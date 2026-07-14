---
title: "Retries & Error Handling"
guide: "celery-from-zero"
phase: 5
summary: "Why background tasks fail, how to retry transient errors with backoff, why retried tasks must be idempotent, the acks_late trade-off, and how to surface permanent failures."
tags: [celery, retries, error-handling, idempotency, autoretry, max-retries, acks-late]
difficulty: advanced
synonyms: ["celery retry task", "celery autoretry_for", "celery max_retries", "celery idempotency", "celery acks_late", "celery error handling", "celery exponential backoff"]
updated: 2026-07-10
---

# Retries & Error Handling

Here's the mental model to carry through this whole phase: **a background task is allowed to fail, and that's exactly the point.** A web request that fails shows the user a 500 and they retry by refreshing. A task has no user staring at it - it's running alone in a worker, minutes after the request that spawned it already returned. So the task has to be its own safety net: when something goes wrong, *it* decides whether to try again, how long to wait, and what to do when it finally gives up. Getting that decision right is most of what separates a toy Celery setup from one you'd trust with real money.

In Phase 4 you learned how to read a task's result and state. Now we deal with the messy reality those states are reporting on: timeouts, flaky third-party APIs, services that are down for ninety seconds, and workers that crash mid-job.

## Why background tasks fail

📝 Most task failures aren't bugs - they're **transient**. A mail server hiccups. A payment gateway times out. An internal service is rebooting. The network drops a packet. None of these mean your code is wrong; they mean the world was briefly uncooperative. The exact same call would succeed if you tried it again ten seconds later.

This is actually one of the core reasons to use a task queue in the first place. Inside a web request, a flaky upstream is a disaster - you can't make the user sit through a thirty-second retry loop, so you give up and show an error. A task has all the time in the world: it can wait, retry, back off, and eventually succeed without anyone noticing the bumps. The user already got their HTTP response; the work happening in the background is free to be patient.

⚠️ The flip side: because nobody is watching, a task that fails *permanently* can vanish silently. We'll deal with that at the end - first, retries.

## Retrying

There are two ways to make a task retry, and they fit different situations. Let's do both.

The first is **imperative**: you catch the error yourself and call `self.retry(...)`. To get access to `self`, you bind the task with `bind=True`.

```python
from celery import shared_task
from smtplib import SMTPException

@shared_task(bind=True, max_retries=5)
def send_welcome_email(self, user_id):
    user = User.objects.get(id=user_id)
    try:
        send_email(
            to=user.email,
            subject="Welcome aboard!",
            body=render_welcome(user),
        )
    except SMTPException as exc:
        # mail server hiccuped - wait 10s and try again
        raise self.retry(exc=exc, countdown=10)
```

*What just happened:* `bind=True` made `self` the first argument - the running task instance, and how you reach `self.retry()`. When the SMTP call throws, we don't let the task die; we call `self.retry(exc=exc, countdown=10)`, telling Celery to **re-enqueue this same task** to run again in 10 seconds. Note the `raise` - `self.retry()` actually raises a special `Retry` exception to abort the current run cleanly, so raising its return value is the idiomatic spelling. We pass `exc=exc` so that if we *do* eventually run out of retries, the original `SMTPException` gets recorded as the failure, not a generic one. `max_retries=5` caps it: after the fifth failed attempt, the task is allowed to fail for real.

📝 The second way is **declarative** - you describe which exceptions should auto-retry and let Celery handle the try/except for you:

```python
from celery import shared_task
from smtplib import SMTPException

@shared_task(
    autoretry_for=(SMTPException,),
    retry_backoff=True,
    retry_backoff_max=600,
    max_retries=5,
)
def send_welcome_email(user_id):
    user = User.objects.get(id=user_id)
    send_email(
        to=user.email,
        subject="Welcome aboard!",
        body=render_welcome(user),
    )
```

*What just happened:* this version has no try/except at all. `autoretry_for=(SMTPException,)` tells Celery: if the body raises that exception, retry automatically - same effect as the hand-written version, far less code. The new piece is `retry_backoff=True`, spacing retries out **exponentially**: roughly 1s, then 2s, 4s, 8s, instead of hammering every 10 seconds. 💡 Backoff matters because the thing you're retrying against is often *already struggling* - an overloaded mail server or API doesn't need your worker pounding it on a fixed interval. `retry_backoff_max=600` caps any single wait at 10 minutes so delays don't grow absurd, and `max_retries=5` still bounds the total attempts.

Reach for the declarative form for the common "retry on these exceptions with backoff" case. Drop to imperative `self.retry()` when you need to decide *at runtime* - for example, reading a `Retry-After` header from a rate-limited API and passing it as the `countdown`.

## Idempotency - the critical idea

This is the most important paragraph in the phase, so let's be blunt. **The moment you add retries, you have accepted that your task might run more than once.**

⚠️ A retried task runs again. A task that the broker redelivers (because the worker crashed, or the acknowledgement got lost) runs again. Even a task you only meant to send once can, under the right network failure, be *delivered* twice. This isn't a Celery quirk - it's the nature of distributed messaging, the same "at-least-once delivery" reality covered in [Webhooks & Message Queues](/guides/webhooks-and-message-queues).

Here's the nightmare made concrete:

```python
@shared_task(autoretry_for=(GatewayTimeout,), max_retries=3)
def charge_payment(order_id):
    order = Order.objects.get(id=order_id)
    # DANGER: the charge can succeed at the gateway,
    # then the *response* times out on the way back.
    gateway.charge(order.amount, order.card_token)  # raises GatewayTimeout
    order.mark_paid()
```

*What just happened:* something genuinely awful, hiding in plain sight. The gateway **successfully charged the card**, but the network dropped the response, so our code saw a `GatewayTimeout` and the task retried - **charging the customer a second time.** Retrying a non-idempotent task doesn't add safety; it adds risk.

💡 The fix is **idempotency**: design the task so that running it twice has the same effect as running it once. The standard tool is an **idempotency key** - a unique token for this logical operation that you check before acting:

```python
@shared_task(autoretry_for=(GatewayTimeout,), max_retries=3)
def charge_payment(order_id):
    order = Order.objects.get(id=order_id)

    if order.is_paid:                 # already done? do nothing.
        return order.payment_id

    # Pass an idempotency key so the gateway itself dedupes
    # a retried charge instead of billing twice.
    result = gateway.charge(
        order.amount,
        order.card_token,
        idempotency_key=f"order-{order.id}",
    )
    order.mark_paid(payment_id=result.id)
    return result.id
```

*What just happened:* two layers of protection. First, the early `if order.is_paid` check means a redelivered task that already finished returns and does nothing - running it again is harmless. Second, we hand the payment gateway an `idempotency_key` tied to the order, so even if our two attempts both reach the gateway, *it* recognizes the second one as a duplicate and returns the original charge instead of billing again. (Every serious payment API supports this mechanism, precisely because retries are universal.) **This is the discipline: before you turn on retries, make the task idempotent.**

## acks_late & worker crashes

There's one more way a task can run twice, and it forces a genuine trade-off you have to choose on purpose.

📝 By default, a worker **acknowledges** a task to the broker the instant it *picks it up* - before running it. The broker hears "got it" and drops the message. Now imagine the worker crashes (out of memory, deploy, machine reboot) one second into a thirty-second job. The message is already gone from the broker - the task is **lost forever**, half-finished, and nothing will ever retry it. This is "at-most-once" delivery: a task runs zero or one times, never more.

📝 Setting `acks_late=True` flips this. The worker acknowledges only **after** the task finishes successfully:

```python
@shared_task(acks_late=True)
def generate_report(account_id, month):
    rows = query_usage(account_id, month)
    pdf = render_pdf(rows)
    store_report(account_id, month, pdf)
```

*What just happened:* the task is no longer acknowledged up front. If this worker dies mid-report, the broker never heard a confirmation, so after a timeout it **re-queues the message** and another worker runs it again. The report survives the crash. ⚠️ But look at the cost: if the crash happens *after* `store_report` runs but *before* the ack is sent, the task gets re-run and the report is generated twice. That's the at-least-once trade - `acks_late=True` guarantees the work isn't lost, at the price of possibly running more than once, which is exactly why it only makes sense for an **idempotent** task. (`generate_report` here re-creates a report keyed by `(account_id, month)`, so running it twice just overwrites the same output - safe.) Rule of thumb: `acks_late` for work you can't afford to lose *and* have made safe to repeat; the default for work where a rare double-run would be worse than a rare miss.

## Failure handling

Retries handle the transient failures. But some failures are permanent - a malformed record, a deleted user, a bug - and no amount of retrying will fix them. You need a plan for when a task truly gives up.

📝 When a task exhausts its retries (or raises an error you didn't auto-retry), Celery marks its state `FAILURE` and, if you've configured a result backend, stores the exception and traceback there (that's what Phase 4's `AsyncResult` reads). You can also hook the moment of final failure with an `on_failure` handler or an error callback:

```python
from celery import Task

class AlertOnFailure(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error("Task %s failed permanently: %s", self.name, exc)
        alert_oncall(f"{self.name} failed for args={args}: {exc}")

@shared_task(base=AlertOnFailure, autoretry_for=(SMTPException,), max_retries=5)
def send_welcome_email(user_id):
    ...
```

*What just happened:* by giving the task a custom `base` class, its `on_failure` runs **only after the last retry has failed** - the final-defeat hook. Here we log the error and page on-call. Without something like this, a permanently failing task fails into the void: no exception bubbles up to a user, no stack trace lands in your request logs, nothing. 💡 For high-volume cases, the equivalent pattern at the queue level is a **dead-letter queue** - failed messages get routed to a separate queue you can inspect and replay later.

⚠️ Internalize this: **a silently-failing background task is worse than a failing web request.** A failed request screams at the user, who tells you. A failed task whispers to no one - the welcome email just never arrives, the report never appears, and you find out from an angry customer next week. You only know your tasks are failing if you actively look, which is why monitoring (Phase 7) isn't optional.

💡 So here's the whole discipline of this phase in one breath: **make tasks idempotent, retry transient errors with backoff, and surface permanent failures loudly.** Do those three things and your background jobs become something you can actually trust.

## Recap

- Most task failures are **transient** (flaky APIs, timeouts, brief outages) - a task is the right place to handle them because, unlike a web request, it can afford to wait and retry.
- Retry **imperatively** with `self.retry(exc=..., countdown=..., max_retries=...)` (needs `bind=True`), or **declaratively** with `autoretry_for=(...)`, `retry_backoff=True`, and `max_retries`. Use backoff so you don't hammer a struggling service.
- **Idempotency is non-negotiable once you retry:** a retried or redelivered task may run more than once. Check "already done?" and use an idempotency key so a retried `charge_payment` doesn't double-charge.
- `acks_late=True` acks after completion, so a worker crash re-queues the task instead of losing it - the at-least-once trade. It only makes sense for idempotent tasks.
- On final failure, the state is `FAILURE` (exception stored if you have a backend); use `on_failure`/error callbacks, dead-letter queues, and alerting to surface it. A silently failing task is worse than a failing request - monitor them.

## Quick check

```quiz
[
  {
    "q": "Why must a task be idempotent before you enable retries?",
    "choices": [
      "Retries run faster on idempotent tasks",
      "A retried or redelivered task may run more than once, so running twice must equal running once (e.g. no double charge)",
      "Celery refuses to retry tasks that aren't marked idempotent"
    ],
    "answer": 1,
    "explain": "Retries and broker redelivery mean at-least-once execution. If the task isn't idempotent, a second run causes real damage like a duplicate payment."
  },
  {
    "q": "What does retry_backoff=True do?",
    "choices": [
      "Cancels the task after the first failure",
      "Spaces retries out exponentially (1s, 2s, 4s...) so you don't hammer a struggling service",
      "Retries the task an unlimited number of times"
    ],
    "answer": 1,
    "explain": "Exponential backoff increases the wait between attempts, giving an overloaded upstream room to recover instead of pounding it on a fixed interval."
  },
  {
    "q": "What is the trade-off of setting acks_late=True?",
    "choices": [
      "Tasks run faster but use more memory",
      "If a worker crashes the task is re-queued (not lost), but it may run twice - so the task must be idempotent",
      "Results are stored permanently instead of expiring"
    ],
    "answer": 1,
    "explain": "acks_late acknowledges only after completion, so a crash re-queues the task (at-least-once). The cost is possible double execution, which is only safe for idempotent tasks."
  }
]
```

---

[← Phase 4: Results & State](04-results-and-state.md) · [Guide overview](_guide.md) · [Phase 6: Scheduled Tasks with Celery Beat →](06-scheduled-tasks-celery-beat.md)