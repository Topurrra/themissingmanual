---
title: "The Core Patterns"
guide: "designing-for-failure"
phase: 2
summary: "The three defenses you reach for constantly: timeouts so you never wait forever, retries with exponential backoff and jitter for transient failures on idempotent operations only, and circuit breakers that stop hammering a dead dependency and fail fast until it recovers."
tags: [timeouts, retries, backoff, jitter, circuit-breaker, idempotency, resilience]
difficulty: advanced
synonyms: ["how to set a timeout", "exponential backoff and jitter explained", "what is a circuit breaker", "retry only idempotent operations", "thundering herd retries", "fail fast pattern", "resilience patterns for microservices"]
updated: 2026-06-19
---

# The Core Patterns

In [Phase 1](01-everything-fails.md) we watched a single slow dependency take down a whole service while
nothing technically crashed. This phase hands you the three tools that would have stopped it cold. They
work together, and they're simple enough to hold in your head:

- **Timeouts** decide *how long you're willing to wait* before giving up. (This is the one most systems
  are missing.)
- **Retries** decide *whether and how to try again* after a transient failure — carefully, with backoff
  and jitter, and only for operations that are safe to repeat.
- **Circuit breakers** decide *when to stop trying altogether* because the dependency is clearly broken
  — so you fail fast and let it recover instead of pounding on it.

Learn these three and you've covered the overwhelming majority of "my service fell over because of
something downstream" situations.

## Timeouts — never wait forever

**What it actually is.** A *timeout* is a deadline on a call: "if I don't get a response within N
seconds, stop waiting and treat it as a failure." That's it. It's the answer to the third outcome from
Phase 1 — the *hang* — by refusing to hang.

**Why people get this wrong.** Most libraries and HTTP clients ship with **no timeout, or a wildly
generous default** (sometimes effectively infinite). So the code that looks innocent —
`http.get(recommendations_url)` — is quietly a promise to wait *forever* if the other side never
answers. That's the exact mechanism that exhausted the worker pool in Phase 1. The fix is to make the
deadline explicit and short enough to protect you.

**What it does in real life.** With a timeout, a slow dependency can hold a worker for *at most* the
timeout duration, not indefinitely. The worker comes back, free to serve someone else. The slow
dependency degrades that one feature instead of starving the entire service.

```text
   No timeout:                        With a 1s timeout:

   call ──────────────────────▶ ???   call ───▶ (1s) ──▶ ✗ give up
        (worker stuck forever)                  worker freed, handle the failure
```

**A real example.** A timeout being hit, shown with `curl`'s max-time flag standing in for whatever your
client does:
```console
$ curl --max-time 2 https://recs.internal/recommend
curl: (28) Operation timed out after 2003 milliseconds with 0 bytes received
```
*What just happened:* `curl` waited two seconds, got nothing, and gave up with error 28 instead of
hanging indefinitely. In your service, that translates to "the recommendations call failed; move on" —
maybe you skip recommendations and return the rest of the page. The worker is free again. The slow
dependency cost you one feature for one request, not your whole service.

⚠️ **Gotcha — set timeouts at every layer, and budget them.** A timeout only protects the layer that
has one. If your outer request has a 30-second timeout but the database call inside it has none, the
database hang still wins. And the inner timeouts should *add up to less* than the outer one — if the
overall request must answer in 3 seconds, you can't give a sub-call 5 seconds. This is sometimes called
a **timeout budget**: the parent deadline is divided among the children, not handed to each in full.

💡 **Key point.** If you do exactly one thing from this entire guide, set timeouts on every remote call.
It's the single highest-leverage line of defense, and the one most commonly missing.

## Retries — try again, but carefully

**What it actually is.** A *retry* is trying a failed call again, on the bet that the failure was
**transient** — a momentary blip, a packet drop, a brief overload — rather than permanent. Many network
failures genuinely are transient, so a retry often turns a glitch the user never sees into a non-event.

**Why people get this wrong — two ways, both bad.**

First, **the naive retry loop**: fail, immediately try again, fail, immediately try again. If the
dependency is struggling because it's *overloaded*, hammering it with instant retries pours gasoline on
the fire. Worse, if *every* client retries at the same instant, they all hit the recovering service
together and knock it back down — a **thundering herd**.

The fix is two ideas stacked:

- **Exponential backoff** — wait longer between each attempt: 1s, then 2s, then 4s, then 8s. You give a
  struggling dependency room to breathe instead of crowding it.
- **Jitter** — add randomness to each wait so clients *don't* line up and retry in sync. Backoff spreads
  retries out in time; jitter spreads them out across *clients*. (source: AWS's "Exponential Backoff
  And Jitter" makes the case for adding jitter — <https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/>)

```text
   Naive retry (everyone in lockstep):     Backoff + jitter (spread out):

   t=0  ✗✗✗✗✗  all clients retry at once    t≈1±r  ✗   ✗     ✗
   t=0  ✗✗✗✗✗  …again, in sync              t≈2±r    ✗    ✗  ✗
   t=0  ✗✗✗✗✗  …herd keeps stampeding       t≈4±r  ✗       ✗     ✗
        recovering service gets crushed             load is smeared across time
```

**A real example.** A retry policy in words, then what the client log looks like:
```console
attempt 1: GET /recommend → 503 Service Unavailable   (wait ~1s + jitter)
attempt 2: GET /recommend → 503 Service Unavailable   (wait ~2s + jitter)
attempt 3: GET /recommend → 200 OK
```
*What just happened:* The first two attempts hit a temporarily overloaded service and got `503`. Instead
of retrying instantly, the client waited about a second (plus a random jitter), then about two, giving
the service room to recover. By the third attempt it was healthy again, and the user never saw an error.

The second way people get retries wrong is the dangerous one:

⚠️ **Gotcha — only retry idempotent operations.** An operation is **idempotent** if doing it twice has
the same effect as doing it once. Reading data is idempotent. Setting a value to `X` is idempotent.
*Charging a credit card is not* — retry that blindly and you may bill the customer twice. The trap is the
*hang*: the request may have actually *succeeded* on the server, but the response got lost on the way
back, so the client thinks it failed and retries. Now it's done twice.

📝 **Terminology.** *Idempotent* = safe to repeat; the end state is the same no matter how many times you
do it. The safe pattern for non-idempotent actions (like payments or "create order") is to use an
**idempotency key** — a unique ID the client sends with the request so the server can recognize "I've
already processed this one" and not do it again. This is the heart of reliable message and webhook
delivery, covered in [Webhooks & Message Queues](/guides/webhooks-and-message-queues) — if you're
retrying anything that *changes state*, read that before you ship it.

💡 **Key point.** Retries are for *transient* failures on *idempotent* operations. A `503` or a timeout
on a read? Retry with backoff and jitter. A `400 Bad Request` (your request is malformed) or a
`404`? Don't retry — the answer won't change, and you're just adding load. Retry the *retryable*, not
everything.

## Circuit breakers — stop hammering a corpse

Timeouts cap each call; retries handle the occasional blip. But what about when a dependency isn't
blipping — it's just *down*, and has been for a while? Retrying every single request (each one waiting
out its full timeout first) is pure waste: you're spending your own resources and time waiting on
something you already have strong evidence is broken. That's where the circuit breaker comes in.

**What it actually is.** A *circuit breaker* is exactly the electrical metaphor: a switch that **trips
open** when it sees too much trouble, cutting the connection so the trouble can't spread. Once tripped,
calls to the failing dependency **fail fast** — instantly, without even attempting the call — until
enough time passes to check whether it has recovered.

It lives in three states:

```text
            many failures
            in a row
   ┌────────┐  ───────────▶  ┌────────┐   after a cooldown   ┌──────────┐
   │ CLOSED │                │  OPEN  │ ───────────────────▶ │ HALF-OPEN│
   │ normal │  ◀───────────  │ fail   │                      │ try ONE  │
   │ calls  │   test succeeds│ fast   │ ◀─────────────────── │ test call│
   └────────┘                └────────┘   test fails (reopen)└──────────┘

   CLOSED    : calls flow normally; count failures.
   OPEN      : too many failures → stop calling; fail instantly for a cooldown.
   HALF-OPEN : cooldown elapsed → let ONE test call through.
               success → back to CLOSED; failure → back to OPEN.
```

**What it does in real life.** When the dependency is healthy, the breaker is **closed** and traffic
flows normally while it quietly counts failures. When failures cross a threshold, it trips **open**: for
the next stretch of time (the cooldown), every call to that dependency returns an error *immediately*
without trying — no waiting out timeouts, no piling on a service that's clearly down. After the cooldown,
it goes **half-open** and lets a single test call through. If that succeeds, the dependency looks
recovered, so the breaker closes and normal traffic resumes. If it fails, the breaker opens again and
waits another round.

**Why this saves you.** Two reasons. First, **fail fast**: when something's down, your users get a quick,
honest error (or a fallback — see [Phase 3](03-failing-soft.md)) instead of waiting out a timeout on
every request. Second, **let it recover**: a dependency that's struggling under load can't recover if
you keep slamming it. The open breaker takes the pressure off and gives it a chance to come back. The
breaker protects *both* sides.

⚠️ **Gotcha — tune the thresholds, or the breaker lies.** A breaker that trips on one stray error will
flap open and closed and reject perfectly good traffic. A breaker that needs a thousand failures to trip
won't protect you in time. The right thresholds (how many failures, over what window, how long the
cooldown) depend on your traffic and your dependency, and they take observation to get right. Start
conservative and adjust based on what you actually see in production — don't guess once and forget it.

🪖 **War story.** The combination that bites people: a circuit breaker wrapped around a call that *also*
has aggressive retries *inside* the breaker. Each "attempt" is really three retried calls, so the
breaker's failure count and timing math are off by 3x and it never behaves the way you expected. Decide
where retries live relative to the breaker (usually: breaker on the outside, limited retries within a
single logical attempt) and keep it consistent.

## How the three fit together

These aren't three separate tools you pick between — they're layers on the *same* call:

```text
   one outbound call to a dependency:

   ┌─ circuit breaker ─ open?  → fail fast, don't even try
   │                   closed? ↓
   │   ┌─ retry (idempotent only) ─ with backoff + jitter
   │   │     ┌─ timeout ─ cap each individual attempt
   │   │     │     └─ the actual network call
```

A call goes out; the **timeout** caps how long each attempt can take; **retries** handle a transient
failure with backoff and jitter; and the **circuit breaker** sits over the whole thing, ready to trip
and fail fast if the dependency is clearly broken. Timeouts make retries safe (a hung call can't block a
retry). Retries make blips invisible. The breaker stops the bleeding when blips become an outage.

## Recap

1. **Timeouts** cap how long you'll wait — set them on *every* remote call, at every layer, and make
   inner timeouts add up to less than outer ones (a timeout budget). The most commonly missing safeguard.
2. **Retries** handle *transient* failures, but only with **exponential backoff** (wait longer each
   time) and **jitter** (randomize the wait) so you don't stampede a recovering service.
3. **Retry only idempotent operations.** Anything that changes state (payments, "create order") needs an
   **idempotency key** — see [Webhooks & Message Queues](/guides/webhooks-and-message-queues).
4. A **circuit breaker** trips **open** after too many failures, makes calls **fail fast** during a
   cooldown, then tests recovery in **half-open** — protecting both your resources and the struggling
   dependency.
5. The three layer onto the same call: breaker outside, retries within an attempt, timeout on each
   individual call.

---

[← Guide overview](_guide.md) · [Phase 3: Failing Soft — Degradation & Redundancy →](03-failing-soft.md)
