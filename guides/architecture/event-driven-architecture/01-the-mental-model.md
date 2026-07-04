---
title: "Announce, Don't Call"
guide: "event-driven-architecture"
phase: 1
summary: "Systems that talk by emitting events instead of calling each other directly: queues, pub/sub, and choreography versus orchestration."
tags: [architecture, event-driven, pub-sub, message-queue, distributed-systems, decoupling, eventual-consistency]
difficulty: intermediate
synonyms: ["what is event driven architecture", "pub sub vs message queue", "events vs direct calls", "choreography vs orchestration", "at least once delivery", "why idempotent consumers", "eventual consistency events", "event broker", "kafka vs rabbitmq concepts", "decoupling services with events"]
updated: 2026-06-30
---

# Announce, Don't Call

Picture the code that runs when someone signs up. In a lot of systems, it looks like a to-do list the signup handler is personally responsible for completing:

```text
on signup(user):
    db.save(user)
    email_service.send_welcome(user)        # call out
    billing_service.start_trial(user)        # call out
    analytics_service.track("signup", user)  # call out
    crm_service.create_contact(user)         # call out
    return "ok"
```

*What just happened:* the signup handler made four outbound calls. It now *knows about* four other services, *waits for* all four, and *fails* if any one of them is down. Add a fifth thing that should happen on signup, and you edit this file again. The signup code has quietly become the manager of the whole company.

## The shift: stop calling, start announcing

Event-driven architecture replaces that to-do list with a single announcement:

```text
on signup(user):
    db.save(user)
    broker.emit("user.signed_up", {id: user.id, email: user.email})
    return "ok"
```

*What just happened:* the handler did its own job (save the user), shouted one fact into the room — "a user signed up, here are the details" — and returned. It does not know who's listening. It does not wait. Sending the welcome email, starting the trial, tracking analytics — those are now somebody else's problem, and the signup code has no idea how many somebodies there are.

That's the entire idea. An **event** is a statement of fact about something that already happened, in the past tense: `user.signed_up`, `order.placed`, `payment.failed`. Not a command ("send the email"), not a question ("are you there?") — a fact. The producer announces it and moves on. Interested parties react on their own time.

> The past tense matters more than it looks. `send_welcome_email` is an instruction aimed at one specific service — it couples the sender to the receiver. `user.signed_up` is true; it doesn't care who acts on it. That difference is what buys you the decoupling.

## The three parts: producer, broker, consumer

Every event-driven system, no matter how fancy the tooling, is these three roles:

```text
  PRODUCER              BROKER                  CONSUMERS
  (emits)        (holds & routes the event)     (react)

  signup  ──►  ┌──────────────────────┐  ──►  email service
  handler      │   "user.signed_up"   │  ──►  billing service
               │   (a queue or log)   │  ──►  analytics service
               └──────────────────────┘  ──►  crm service
```

- **Producer** — the thing that emits the event. It knows nothing about consumers. Its only job is to publish the fact.
- **Broker** — the piece in the middle that receives events and holds them until consumers are ready. This is the part that's new. It's a queue, or a log, or a pub/sub topic — software like RabbitMQ, Kafka, SQS, NATS. We'll get into the flavors in Phase 2.
- **Consumer** — a service that subscribes to events it cares about and does work when one arrives. Consumers are independent: each one fails, retries, and scales on its own.

The broker is the hero of the story. Without it, "emit an event" would still mean A has to know where B is. *With* it, A talks only to the broker, and the broker is the only thing that knows the routing. That one indirection is where all the benefits come from.

## Why anyone bothers: three real wins

**1. Decoupling.** The producer and consumers don't know each other exist. You can add a sixth consumer — say, a service that sends a Slack alert to the sales team — without touching the signup code at all. You deploy the new consumer, it subscribes to `user.signed_up`, done. The blast radius of "add a feature" shrinks dramatically.

**2. Buffering.** Because the broker *holds* events, a slow or briefly-down consumer doesn't break the producer. If the email service is overwhelmed at peak, signups keep flowing — the welcome emails queue up and get sent as the email service catches up. The broker absorbs the spike. (This is the same backpressure idea covered in [Webhooks & Message Queues](/guides/webhooks-and-message-queues).)

**3. Replay.** Some brokers (the log-shaped ones) keep events around after they're consumed. That means a brand-new consumer can start at the beginning and process the entire history — rebuild a search index, populate a new analytics warehouse, recover from a bug — by re-reading events that were emitted months ago. The event stream becomes a kind of audit trail you can rewind.

## A quick gut-check on the difference

Direct calls are **synchronous and pointed**: A calls B, A waits, A is coupled to B, A is only as available as B. Events are **asynchronous and broadcast**: A emits, A doesn't wait, A is coupled to nothing, A's availability doesn't depend on anyone downstream.

That sounds strictly better, which is exactly the trap. You're trading a problem you can see (tight coupling, cascading slowness) for problems you *can't* see yet (the work happens "eventually," not now, and debugging means following a fact across services). Phase 3 is where we pay that bill honestly. First, Phase 2 shows how events actually move.

**For builders:** before reaching for a broker, look at your existing call graph and ask which calls are *fire-and-forget* — the caller doesn't need the result to respond. Welcome emails, analytics, cache warming: classic fire-and-forget. Those are the calls that want to be events. A call whose result you need *in the same response* (charge this card, then tell the user it worked) usually wants to stay a direct call. Sorting your calls into those two buckets is most of the design work.

```quiz
[
  {
    "q": "In event-driven architecture, what is an 'event'?",
    "choices": ["A command telling a specific service what to do", "A statement of fact about something that already happened", "A question asking whether a service is available", "A scheduled task that runs on a timer"],
    "answer": 1,
    "explain": "An event is a past-tense fact (user.signed_up), not a command or a query. The producer announces what happened and doesn't dictate who acts on it."
  },
  {
    "q": "What role does the broker play that makes the whole pattern work?",
    "choices": ["It runs the business logic for every consumer", "It calls each consumer directly on the producer's behalf", "It receives events and holds them until consumers are ready, hiding the routing from the producer", "It guarantees every event is processed exactly once"],
    "answer": 2,
    "explain": "The broker is the indirection in the middle. The producer talks only to it, so producers and consumers never need to know about each other."
  },
  {
    "q": "Which of these is the BEST candidate to convert from a direct call into an event?",
    "choices": ["Charging a credit card before showing the user a success page", "Sending a welcome email after signup", "Reading a user's profile to render the current page", "Validating a password during login"],
    "answer": 1,
    "explain": "The welcome email is fire-and-forget: the caller doesn't need its result to respond. Calls whose results you need in the same response should usually stay direct."
  }
]
```

Watch it animated: [event-driven architecture](/explainers/EventDriven.dc.html)

[← Overview](_guide.md) | [Phase 2: How Events Really Flow →](02-how-events-flow.md)
