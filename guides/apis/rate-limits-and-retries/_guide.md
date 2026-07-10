---
title: "Rate Limits and Retries"
guide: "rate-limits-and-retries"
phase: 0
summary: "Calling a flaky or throttled API without melting it or yourself: 429s, exponential backoff with jitter, idempotency, and circuit breakers."
tags: [rate-limiting, retries, backoff, jitter, idempotency, circuit-breaker, apis, http]
category: apis
order: 9
difficulty: intermediate
synonyms: ["what does 429 mean", "http 429 too many requests", "retry-after header", "exponential backoff with jitter", "how to retry a failed api call", "what is a rate limit", "token bucket rate limiting", "idempotency key", "what is a circuit breaker", "thundering herd problem", "how to handle api throttling"]
updated: 2026-07-10
---

# Rate Limits and Retries

You wired up an API call, it worked, you shipped it. Then traffic grew, or the upstream had a bad
minute, and suddenly your logs are full of `429` and `503` — and your "fix" of retrying in a tight loop
somehow made everything *worse*. That sinking feeling, where the thing meant to help is now the thing
hurting you, is exactly what this guide clears up.

Here's the relief: calling a flaky or throttled API well is a small, learnable set of habits, not a dark
art. APIs rate-limit you on purpose, and they tell you how to behave — you mostly need to listen. Retrying
safely is a handful of rules: wait longer each time, add a little randomness, cap how hard you try, and
never blindly retry something that moves money. Learn those, and a wobbly dependency becomes a minor
annoyance instead of a 2am page.

## How to read this

- **Mid-incident, need the rule right now?** Phase 2 has the backoff-and-jitter recipe and the
  "is this safe to retry?" checklist; Phase 3 has the circuit-breaker idea for when a dependency is
  truly down.
- **Want it to actually make sense?** Read in order. Phase 1 explains *why* limits exist (so you stop
  taking them personally), Phase 2 turns retrying into a safe reflex, and Phase 3 covers the failure
  modes that bite teams who only learned the happy path.

## The phases

1. **[Why APIs Push Back](01-why-apis-push-back.md)** — the mental model: rate limits aren't an insult,
   they're how a shared service protects itself. Token buckets, the `429` status, and the `Retry-After`
   header that tells you exactly how long to wait.
2. **[Retrying Without Making It Worse](02-retrying-without-making-it-worse.md)** — the everyday core:
   exponential backoff, why you *must* add jitter, a retry budget so you give up gracefully, and the
   golden rule of only retrying requests that are safe to repeat.
3. **[When Retrying Isn't Enough](03-when-retrying-isnt-enough.md)** — the deeper payoff: the
   thundering-herd problem, the circuit breaker that stops you from hammering a downed service, and what
   it means to be a genuinely good client.

> This guide stays at the level you need to write a resilient client. The provider's side — designing
> and enforcing limits, sizing buckets, fairness across tenants — is its own topic; for the broader API
> picture see [REST APIs, Explained](/guides/rest-apis-explained) and [What an API Is](/guides/what-an-api-is).

[Phase 1: Why APIs Push Back](01-why-apis-push-back.md) →
