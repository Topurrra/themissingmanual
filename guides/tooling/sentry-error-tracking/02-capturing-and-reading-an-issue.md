---
title: "Capturing and reading an issue"
guide: sentry-error-tracking
phase: 2
summary: "Error tracking that turns a vague bug report into a stack trace: grouped issues, the breadcrumbs and context around a crash, releases, and source maps."
tags: [sentry, error-tracking, observability, monitoring, stack-trace, source-maps]
difficulty: beginner
synonyms: ["set up sentry sdk", "sentry dsn", "sentry capture exception", "sentry tags and context", "sentry breadcrumbs", "read a sentry issue"]
updated: 2026-06-30
---

# Capturing and reading an issue

You've got the mental model. Now the loop you'll actually live in: get the SDK reporting, watch crashes turn into issues, and make those issues rich enough that you can diagnose a bug without ever reproducing it. The goal of this phase is that when an issue lands in your inbox, you can fix it from the page in front of you.

## Step one: the DSN and one init call

Sentry knows which project an event belongs to because of a **DSN** — a URL that contains your project's public key. It looks like a secret but it's safe to ship in client code; it only grants permission to *send* events, not read them.

Wiring up the SDK is a single initialization call near the start of your program. Here's a Python service:

```python
import sentry_sdk

sentry_sdk.init(
    dsn="https://abc123@o12345.ingest.sentry.io/67890",
    environment="production",
    release="web@2026.06.30-a1b2c3",
    traces_sample_rate=0.0,   # error tracking only for now
)
```

*What just happened:* one `init` call installs hooks into the runtime so any uncaught exception is automatically captured and sent. You did not wrap your code in try/except — Sentry catches what bubbles all the way up. The `environment` and `release` fields tag every event, which matters enormously later.

The same shape holds in JavaScript, with the SDK loaded before the rest of your app:

```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://abc123@o12345.ingest.sentry.io/67890",
  environment: "production",
  release: "web@2026.06.30-a1b2c3",
});
```

*What just happened:* same contract — initialize early, and uncaught errors plus unhandled promise rejections flow to Sentry on their own. The earlier this runs, the more crashes it can catch.

> Set `environment` deliberately and keep dev out of production. If your laptop sends events to the same project as production, your real signal drowns in noise from code you're actively breaking. A separate `environment` (or a separate project entirely) for development is the cheapest sanity you'll ever buy.

## Capturing on purpose

Uncaught exceptions report themselves, but sometimes you catch an error to handle it gracefully and still want Sentry to know it happened. That's an explicit capture:

```python
try:
    charge_card(order)
except PaymentError as err:
    show_user("Payment failed, please retry")
    sentry_sdk.capture_exception(err)   # handled, but still recorded
```

*What just happened:* the user got a clean message and your code kept running, but Sentry still recorded the full exception with its stack trace. You're not choosing between good UX and visibility — you get both.

You can also capture a message with no exception attached, for a "this shouldn't happen" branch:

```python
if cart.total < 0:
    sentry_sdk.capture_message("negative cart total", level="error")
```

*What just happened:* Sentry recorded an event even though nothing threw. Use this sparingly — it's for genuinely anomalous states, not as a logging replacement.

## Reading an issue: the anatomy

Open an issue and you're looking at a representative event plus aggregate stats. The parts that earn their keep:

```text
AttributeError: 'NoneType' object has no attribute 'email'

STACK TRACE
  app/views.py     line 88   signup_view(request)
  app/services.py  line 31   create_account(data)
  app/mail.py      line 42   send_welcome(user)   ← user is None

TAGS        environment=production  release=web@2026.06.30-a1b2c3
            browser=Chrome 126      server=web-07
CONTEXT     user.id=90431   request: POST /signup
BREADCRUMBS (10)  ...trail of what happened before the crash...
```

*What just happened:* the stack trace shows the call path with the failing frame highlighted; tags let you filter ("only Chrome?"); context carries the request and user; breadcrumbs reconstruct the lead-up. You're reading the crash scene, not guessing at it.

## Breadcrumbs: the trail before the crash

Breadcrumbs are the single feature that most often turns "I can't reproduce it" into "oh, that's why." They're a rolling log of recent activity — navigation, network calls, clicks, your own log statements — attached to whatever event fires next.

```text
14:21:58  navigation   /  →  /signup
14:21:59  ui.click     button#submit
14:22:00  http         POST /api/account  →  201
14:22:00  http         GET  /api/user/90431  →  404   ← lookup failed here
14:22:01  error        AttributeError ... mail.py:42
```

*What just happened:* the breadcrumbs reveal the actual cause — the user lookup returned 404, so `user` was `None` by the time `send_welcome` touched it. The exception is at line 42, but the bug is the failed lookup one step earlier. Most SDKs record these automatically; you can add your own for domain events.

## Tags and context: making issues searchable and diagnosable

There's a real distinction here. **Tags** are indexed key-value pairs you filter and group by — low-cardinality things like `plan`, `region`, `browser`. **Context** is rich structured data attached for reading, not searching — the full request body, feature flags, the order object.

```python
sentry_sdk.set_tag("plan", user.plan)          # searchable: "show me Pro crashes"
sentry_sdk.set_user({"id": user.id})           # who was affected
sentry_sdk.set_context("order", {              # readable detail on the event
    "id": order.id,
    "items": len(order.items),
    "total": order.total,
})
```

*What just happened:* you can now answer "is this only hitting Pro users?" with a tag filter, while the order context sits on every event for when you open one. The rule of thumb: tag what you'll filter by, set context for what you'll read.

> Resist tagging high-cardinality values like user IDs or full URLs with query strings. Tags are indexed, and a tag with a near-infinite set of values bloats storage and makes the UI sluggish. Identify the user with `set_user`; keep one-off detail in context.

**In the wild:** teams wire Sentry into their alerting and ticketing. A new issue can open a ticket automatically, post to a chat channel, and link back to the deploy — so the path from "it broke" to "someone's looking at it" is minutes, not the next morning.

```quiz
[
  {
    "q": "Is it safe to include the Sentry DSN in client-side JavaScript that ships to browsers?",
    "choices": [
      "No, the DSN is a secret that grants full account access",
      "Yes, the DSN only grants permission to send events, not read them",
      "Only if you encrypt it first",
      "Only for internal apps behind a VPN"
    ],
    "answer": 1,
    "explain": "The DSN is a public ingestion key. It lets clients send events but does not grant read access, so shipping it to browsers is expected."
  },
  {
    "q": "What are breadcrumbs in Sentry?",
    "choices": [
      "Permanent server-side audit logs",
      "A rolling trail of recent activity attached to the next event",
      "The list of resolved issues",
      "Stack frames from the standard library"
    ],
    "answer": 1,
    "explain": "Breadcrumbs are a rolling record of recent actions (navigation, network calls, logs) attached to whatever event fires next, reconstructing the lead-up to a crash."
  },
  {
    "q": "Which value is a poor choice for a Sentry tag?",
    "choices": [
      "The subscription plan (free/pro)",
      "The browser name",
      "The unique user ID",
      "The deployment region"
    ],
    "answer": 2,
    "explain": "Tags are indexed and meant for low-cardinality filtering. A unique user ID has near-infinite values; identify users with set_user instead."
  }
]
```

[← Phase 1](01-what-sentry-actually-is.md) · [Overview](_guide.md) · [Phase 3: Releases, source maps, and noise →](03-releases-source-maps-and-noise.md)
