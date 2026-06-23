---
title: "Webhooks & Message Queues — Events and Async Integration Beyond Request/Response"
guide: "webhooks-and-message-queues"
phase: 0
summary: "How services talk to each other when one of them isn't waiting for an answer: webhooks let another system call your URL when something happens, and message queues let your own services hand off work to be done later."
tags: [webhooks, message-queues, async, event-driven, integration, apis]
category: apis
order: 7
difficulty: intermediate
synonyms: ["what is a webhook", "how do webhooks work", "what is a message queue", "webhooks vs message queue", "async integration between services", "how to verify a webhook signature", "what is a dead letter queue", "at least once delivery"]
updated: 2026-06-19
---

# Webhooks & Message Queues

You already know how to call an API: you send a request, you wait, you get a response back. That model
is everywhere, and it works — until the thing you care about hasn't happened *yet*. The payment will
clear sometime in the next minute. The video will finish encoding eventually. Ten thousand orders just
landed in the same second and you can't process them all right now. The request/response model has no
good answer for "later," and that's the gap this guide fills.

There are two tools for "later," and people constantly confuse them. A **webhook** is how *another
company's* system tells *yours* that something happened, by calling a URL you gave them. A **message
queue** is how *your own* services hand work to each other without waiting around. Both are about events
and asynchronous work — but they solve different problems, and reaching for the wrong one makes a mess.
By the end of this guide you'll know which is which, how each actually works under the hood, and the
handful of gotchas (signatures, duplicates, retries) that bite everyone the first time.

## How to read this
- **Need to wire up a webhook *right now*?** Jump to [Phase 1: Push vs Pull](01-push-vs-pull-webhooks.md) — it's a complete walkthrough of registering a URL and verifying the events are real.
- **Want it to finally make sense?** Read in order. Phase 1 and 2 build the two mental models, and Phase 3 puts them side by side and names the traps.

## The phases
1. **[Push vs Pull: Webhooks](01-push-vs-pull-webhooks.md)** — polling wastes effort; a webhook flips it so the other service calls *your* URL when something happens. How to register, what a delivery looks like, and how to verify it's genuine.
2. **[Message Queues](02-message-queues.md)** — a to-do list between your own services. A producer drops a message, a consumer picks it up when ready. Decoupling, absorbing spikes, and surviving outages.
3. **[When to Use Which (and the Gotchas)](03-when-to-use-which.md)** — webhooks for cross-system notifications, queues for internal async work. Delivery guarantees, why duplicates happen, idempotency, retries, ordering, and dead-letter queues — at a gentle level.

> This guide stops at the mental models and the everyday traps. The deep operational material —
> partitioning for throughput, exactly-once semantics, choosing a specific broker, and event-sourcing
> as an architecture — is deferred to a follow-up guide so this one stays a thing you can read in a
> sitting.

Related guides: [REST APIs, Explained](/guides/rest-apis-explained) · [Designing APIs That Last](/guides/designing-apis-that-last)
