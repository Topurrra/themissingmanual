---
title: "How Events Really Flow"
guide: "event-driven-architecture"
phase: 2
summary: "Systems that talk by emitting events instead of calling each other directly: queues, pub/sub, and choreography versus orchestration."
tags: [architecture, event-driven, pub-sub, message-queue, distributed-systems, decoupling, eventual-consistency]
difficulty: intermediate
synonyms: ["what is event driven architecture", "pub sub vs message queue", "events vs direct calls", "choreography vs orchestration", "at least once delivery", "why idempotent consumers", "eventual consistency events", "event broker", "kafka vs rabbitmq concepts", "decoupling services with events"]
updated: 2026-06-30
---

# How Events Really Flow

You've got the model: producer, broker, consumer. Now the practical questions show up. When the broker holds an event, does *one* consumer get it or *everyone*? When several services have to cooperate on one workflow, who's in charge? And when the network hiccups - because it will - does the event get delivered once, or never, or twice? These three questions decide how your system actually behaves, so let's take them one at a time.

## Queue vs pub/sub: one taker, or all takers?

There are two delivery shapes, and the difference is who consumes a given event.

A **queue** is a line of work where each message is handled by exactly *one* consumer. You run several copies of the same worker for throughput, and the broker hands each message to whichever worker is free. This is for **work distribution** - "this job needs doing once, by somebody."

```text
QUEUE  (competing consumers - each message goes to ONE)

  producer ─► [ msg msg msg msg ] ─┬─► worker A   (takes msg 1, 3)
                                    └─► worker B   (takes msg 2, 4)
```

*What just happened:* four messages, two identical workers. The broker split the line between them - no message was handled twice. Add a third worker and the line drains faster. This is how you scale a queue: more workers, same queue.

**Pub/sub** (publish/subscribe) is broadcast. The producer publishes to a *topic*, and *every* subscriber gets its own copy of every event. This is for **fan-out** - "this fact happened, and several different services each need to know."

```text
PUB/SUB  (fan-out - each subscriber gets its OWN copy)

  producer ─► topic "user.signed_up" ─┬─► email service     (gets a copy)
                                       ├─► billing service   (gets a copy)
                                       └─► analytics service (gets a copy)
```

*What just happened:* one event, three independent copies. The email, billing, and analytics services each received `user.signed_up` and reacted in parallel. None of them competed for it; none of them blocked the others.

In real systems you combine these: pub/sub fans an event out to several services, and *within* each service a queue distributes the work across that service's worker pool. The two shapes aren't rivals - they stack.

## Choreography vs orchestration: who runs the workflow?

Single events are easy. The hard part is a *multi-step* workflow - say, placing an order: reserve inventory, charge payment, schedule shipping, send a confirmation. There are two ways to coordinate the dance.

**Choreography** - no conductor. Each service reacts to events and emits its own, like dancers who each know their cue. There's no central brain; the workflow *emerges* from the chain of reactions.

```text
CHOREOGRAPHY  (each service reacts and emits the next event)

  order.placed ─► [inventory] ─► inventory.reserved
                                  └─► [payment] ─► payment.charged
                                                   └─► [shipping] ─► order.shipped
```

*What just happened:* nobody is in charge. Inventory heard `order.placed`, did its bit, and emitted `inventory.reserved`. Payment heard *that* and continued the chain. The flow is the sum of independent reactions. This is maximally decoupled - but to understand the whole workflow, you have to trace events across every service, because no single place describes it.

**Orchestration** - a conductor. One component (an *orchestrator* or *saga manager*) owns the workflow and tells each service what to do next, usually still over events or commands.

```text
ORCHESTRATION  (one orchestrator drives every step)

         ┌──────────── ORCHESTRATOR ────────────┐
         │ 1.reserve   2.charge   3.ship   4.notify │
         └──┬──────────┬─────────┬────────┬───────┘
            ▼          ▼         ▼        ▼
       inventory   payment   shipping   email
```

*What just happened:* the orchestrator drove the order through four steps and waited for each to report back. The whole workflow lives in *one* readable place, and if step 2 fails the orchestrator can run compensating steps (un-reserve the inventory). The cost: the orchestrator is now a central thing that knows about every service - you've traded some decoupling for clarity and control.

The plain rule of thumb: **choreography** for simple, short chains where loose coupling matters most; **orchestration** once the workflow has branches, rollbacks, or more than a few steps and you need to *see* it in one place. Many teams start choreographed, watch it turn into spaghetti nobody can follow, and add an orchestrator for the gnarly workflows.

## Delivery guarantees: the fine print that will bite you

When you emit an event, how many times does each consumer receive it? There are three theoretical answers, and only one of them is what you almost always get in practice.

| Guarantee | What it means | Reality |
|---|---|---|
| **At-most-once** | Delivered 0 or 1 times - may be lost | Fast, but you can silently drop events. Rarely acceptable. |
| **At-least-once** | Delivered 1 or more times - never lost, may repeat | **The common default.** Safe against loss, but you *will* see duplicates. |
| **Exactly-once** | Delivered precisely 1 time | The dream. Genuinely hard end-to-end; often "exactly-once *processing*" faked atop at-least-once. |

Most brokers you'll actually use default to **at-least-once**. Here's *why* duplicates are nearly unavoidable: after a consumer processes an event, it sends an *acknowledgment* ("ack") back to the broker so the broker can stop tracking it. If the consumer crashes - or the ack gets lost on the network - *after* doing the work but *before* the ack lands, the broker never hears confirmation. So it does the safe thing: it redelivers. The work happens twice.

```text
1. broker delivers  "payment.charged"  ──►  consumer
2. consumer charges the card  ✅
3. consumer crashes before sending ack  💥
4. broker waited, heard nothing, REDELIVERS  ──►  consumer
5. consumer charges the card AGAIN  💸💸   ← the duplicate bites
```

*What just happened:* the broker did exactly what it promised - never lose a message - and the cost of that promise was a double charge. The broker can't tell "the consumer died" apart from "the consumer is just slow," so when in doubt it redelivers. This is not a bug; it's the guarantee working as designed.

Which is why the single most important habit in event-driven systems is making consumers **idempotent** - safe to run the same event twice with no extra effect. That's the heart of Phase 3, and the reason it deserves its own phase.

**For builders:** when you pick or configure a broker, find the delivery guarantee in its docs *before* you write a consumer, not after a double-charge in production. Assume at-least-once unless the docs prove otherwise, and design every consumer as if duplicates are guaranteed - because they effectively are. For the practical retry/backpressure side of running a queue, see [Webhooks & Message Queues](/guides/webhooks-and-message-queues).

```quiz
[
  {
    "q": "What's the core difference between a queue and pub/sub?",
    "choices": ["Queues are faster than pub/sub", "In a queue each message goes to exactly one consumer; in pub/sub every subscriber gets its own copy", "Pub/sub can't lose messages but queues can", "Queues are for events and pub/sub is for commands"],
    "answer": 1,
    "explain": "A queue distributes work (one taker per message) for throughput; pub/sub fans out (every subscriber gets a copy) so multiple services each learn about the same event."
  },
  {
    "q": "When does orchestration tend to beat choreography?",
    "choices": ["When you want maximum decoupling and the simplest possible services", "When the workflow has branches, rollbacks, or many steps and you need to see it in one place", "Whenever there is more than one consumer", "When the broker only supports at-most-once delivery"],
    "answer": 1,
    "explain": "Orchestration puts the whole workflow in one readable place and can run compensating steps on failure - worth the central coupling once the flow gets complex."
  },
  {
    "q": "Why do at-least-once brokers deliver duplicates?",
    "choices": ["Because the network always doubles every packet", "Because consumers ask for events twice on purpose", "Because if the ack is lost or the consumer crashes after doing the work, the broker can't tell and redelivers to avoid losing the event", "Because duplicates make processing faster"],
    "answer": 2,
    "explain": "The broker can't distinguish a dead consumer from a slow one. When it doesn't get an ack, it redelivers rather than risk losing the event - so the work can happen twice."
  }
]
```

[← Phase 1: Announce, Don't Call](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: The Bill Comes Due →](03-the-bill-comes-due.md)
