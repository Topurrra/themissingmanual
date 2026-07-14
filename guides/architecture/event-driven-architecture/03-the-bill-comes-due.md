---
title: "The Bill Comes Due"
guide: "event-driven-architecture"
phase: 3
summary: "Systems that talk by emitting events instead of calling each other directly: queues, pub/sub, and choreography versus orchestration."
tags: [architecture, event-driven, pub-sub, message-queue, distributed-systems, decoupling, eventual-consistency]
difficulty: intermediate
synonyms: ["what is event driven architecture", "pub sub vs message queue", "events vs direct calls", "choreography vs orchestration", "at least once delivery", "why idempotent consumers", "eventual consistency events", "event broker", "kafka vs rabbitmq concepts", "decoupling services with events"]
updated: 2026-07-10
---

# The Bill Comes Due

Every benefit in Phase 1 had a hidden cost, and now we pay it - straight, with no spin. Event-driven systems are genuinely powerful, and they are also genuinely harder to reason about than a stack of direct calls. The teams that succeed with them aren't the ones who avoided these problems; they're the ones who saw them coming. So here are the four that catch everyone, what each one feels like in production, and how to live with it.

## 1. Eventual consistency: "done" doesn't mean done yet

When the signup handler emits `user.signed_up` and returns "ok," the welcome email has *not* been sent. The trial has *not* started. Those happen moments later, when the consumers get around to it. The system is **eventually consistent**: it will be correct soon, but for a window after the producer returns, different parts disagree about the state of the world.

```text
t=0   signup handler returns "ok"  ──► user sees "Welcome!"
t=0   billing consumer hasn't run yet
t=1s  user clicks "My Plan"        ──► "No active trial"  😟
t=2s  billing consumer processes the event ──► trial now active
```

*What just happened:* for about two seconds the user existed but had no trial, and if they were quick they saw a wrong answer. Nothing is broken - the work just hadn't propagated yet. With direct calls this gap doesn't exist, because everything finishes before the response. With events, the gap is the *price of decoupling*, and you have to design the UI and the data flows to tolerate it (show "setting up your account…", read from the source of truth for critical checks, don't promise what hasn't happened).

> This is the trade in one sentence: synchronous calls give you *consistency now* at the cost of coupling; events give you *decoupling* at the cost of consistency *later*. Neither is free. Choose based on whether your use case can tolerate the gap.

## 2. Debugging gets harder: the request you can't follow

With direct calls, a failed request has a stack trace - one thread, one path, top to bottom. With events, a single user action fans out into a constellation of independent reactions across services, at different times, with no shared call stack. "Why didn't this user get their welcome email?" stops being a stack trace and becomes detective work across five log files.

The survival tools here are not optional in a serious system:
- **Correlation IDs** - stamp every event with an ID that follows the whole workflow, so you can grep one ID across every service and reconstruct the chain.
- **Distributed tracing** - tools that stitch those hops into a single timeline you can actually look at.
- **A dead-letter queue (DLQ)** - a side queue where events that keep failing get parked instead of looping forever, so you can inspect the poison message instead of losing it.

Without these, an event-driven system is a black box that *mostly* works and is *miserable* to debug the day it doesn't.

## 3. Ordering: events don't always arrive in the order they happened

You might assume `cart.item_added` always arrives before `cart.checked_out`. Across a distributed broker with multiple partitions and parallel consumers, that assumption can break - events can arrive out of order, or be processed in parallel out of order.

Most brokers only guarantee ordering within a **partition** or a single queue, and only if you route related events to the same partition (usually by a key like `cart_id`). So the fix is twofold: route events that must stay ordered to the same partition using a stable key, and where you can, **design events so order doesn't matter** - carry enough state in the event that a consumer can act correctly regardless of what it has or hasn't seen yet.

## 4. Duplicates, and the cure: idempotency

We saw in Phase 2 *why* at-least-once delivery hands you duplicates. Here's how you survive them. An operation is **idempotent** when doing it twice has the same effect as doing it once. You don't try to *prevent* duplicate delivery (you can't, reliably); you make duplicate *processing* harmless.

The workhorse pattern: give every event a unique ID, and have each consumer record which IDs it has already handled. Before doing the work, check.

```sql
-- consumer receives an event with id 'evt_8a3f' and a payment to apply
INSERT INTO processed_events (event_id) VALUES ('evt_8a3f')
ON CONFLICT (event_id) DO NOTHING;
-- only do the real work if THIS consumer hasn't seen evt_8a3f before
```

*What just happened:* the first time `evt_8a3f` arrives, the INSERT succeeds and the consumer proceeds to charge the card. If the broker redelivers `evt_8a3f` after a lost ack, the INSERT hits the conflict, changes nothing, and the consumer skips the charge. The double-charge from Phase 2 is now impossible - the duplicate still *arrives*, but processing it is a no-op. (Doing the dedupe insert and the real work in one transaction is what makes this airtight.)

This is why "make your consumers idempotent" is the most-repeated advice in this whole field. At-least-once is the delivery reality; idempotency is how you make it safe.

## So when should you NOT do this?

The most senior move in this guide is knowing when to skip it. Event-driven architecture is the wrong default for a small or new system: if your whole app is one service and a database, a broker buys you eventual-consistency bugs, distributed-debugging pain, and new infrastructure to operate - in exchange for decoupling between parts that aren't even separate yet. Reach for events when you have **real, separate services** that need to react to each other, when **fire-and-forget** work is clogging your request path, when you need **buffering** against spikes, or when **multiple independent consumers** genuinely need the same facts. Until then, a direct call is simpler, easier to debug, and consistent *now*. (Whether you even have separate services is exactly what [Monolith vs Microservices](/guides/monolith-vs-microservices) helps you decide *first*.)

**For builders:** if you take one habit from this guide, take this: **assume every event will be delivered more than once, and make every consumer safe under that assumption.** Add the event-ID dedupe table on day one, not after the first double-charge. It's a few lines, and it's the difference between an event-driven system you trust and one that quietly corrupts data every time the network sneezes.

```quiz
[
  {
    "q": "What does 'eventual consistency' mean for a user right after a producer emits an event and returns?",
    "choices": ["All downstream work is guaranteed finished before the response", "There's a window where different parts of the system disagree until the event is processed", "The event will never be processed", "The producer blocks until every consumer is done"],
    "answer": 1,
    "explain": "The producer returns immediately, but consumers process the event later. For a short window the state hasn't propagated, so different parts can disagree - the price of decoupling."
  },
  {
    "q": "Why must consumers be idempotent in an at-least-once system?",
    "choices": ["To make events arrive faster", "Because the broker guarantees exactly-once delivery", "Because duplicates are effectively unavoidable, so processing one twice must be harmless", "To enforce strict ordering of events"],
    "answer": 2,
    "explain": "At-least-once delivery means duplicates will happen (lost acks, crashes, redelivery). You can't prevent duplicate delivery reliably, so you make duplicate processing a no-op."
  },
  {
    "q": "Which situation is the BEST reason NOT to adopt event-driven architecture yet?",
    "choices": ["You have several independent services that need to react to the same facts", "Fire-and-forget work is clogging your request path", "Your whole app is one service and a database with no separate parts to decouple", "You need to buffer against traffic spikes"],
    "answer": 2,
    "explain": "A single service and database gains little from a broker but pays full price in eventual-consistency bugs and distributed-debugging pain. Events shine when you have real, separate services."
  }
]
```

[← Phase 2: How Events Really Flow](02-how-events-flow.md) | [Overview](_guide.md)
