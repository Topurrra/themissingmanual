---
title: "NATS and Amazon SQS"
guide: nats-and-sqs
phase: 3
summary: "Two lighter messaging options: NATS for fast, simple pub/sub and request-reply, and SQS for a fully managed, zero-ops cloud queue."
tags: [nats, sqs, messaging, queues, pubsub, aws, jetstream]
difficulty: intermediate
synonyms: ["nats vs sqs", "amazon sqs tutorial", "nats jetstream", "simple message queue aws", "pub sub broker", "fifo queue vs standard queue", "visibility timeout", "dead letter queue", "lightweight message broker"]
updated: 2026-06-30
---

# Phase 3: Production Reality

Everything in Phase 2 works on your laptop. Production is where the broker meets a slow database, a worker that crashes mid-task, a message that can never succeed, and a duplicate you didn't expect. None of these are exotic — they're the default behavior you have to design around. This phase is the set of gotchas that, once you've felt them, you never forget.

## The visibility timeout is a deadline, not a suggestion

This is the single most common SQS bug. When you receive a message, SQS hides it for the **visibility timeout** (default 30 seconds). The unspoken contract: process and delete it before that window closes. If your processing takes longer than the timeout, SQS assumes you died, makes the message visible again, and hands it to another worker — while you're still working on it.

```text
t=0    worker A receives msg  (hidden for 30s)
t=30   timeout expires, msg visible again
t=31   worker B receives the SAME msg  ← now two workers process it
t=45   worker A finishes, deletes msg
t=60   worker B finishes, tries to delete — receipt handle stale
```

*What just happened:* a job that took 45 seconds under a 30-second timeout got processed twice. The fix is to set the visibility timeout comfortably above your worst-case processing time, or to call `change-message-visibility` to extend it (a "heartbeat") while a long job runs.

```bash
# Buy more time on an in-flight message before the timeout expires.
aws sqs change-message-visibility \
  --queue-url "$Q" \
  --receipt-handle "$RECEIPT_HANDLE" \
  --visibility-timeout 120
```

*What just happened:* you pushed this message's deadline out to 120 seconds, so a slow job won't be redelivered out from under you. Don't just set a giant static timeout, though — if a worker truly crashes, a huge timeout means the message sits stuck for that long before anyone retries it.

## Design for at-least-once: make consumers idempotent

SQS Standard is **at-least-once**. Even with a sane visibility timeout, a network hiccup between your `delete` call and SQS can leave the message in the queue, and it'll be redelivered. So you cannot assume a message arrives exactly once. The same is true of JetStream redelivery after a missed ack.

The cure isn't to fight duplicates — it's to make processing the same message twice harmless. That property is **idempotency**.

```text
NOT idempotent:  balance = balance + amount        (runs twice → double charge)
idempotent:      if not already_applied(msg_id):
                     balance = balance + amount
                     mark_applied(msg_id)
```

*What just happened:* by recording which message IDs you've already applied and skipping repeats, a second delivery becomes a no-op. Now "at-least-once" stops being scary. This is why most teams pick Standard over FIFO: idempotent consumers are good engineering anyway, and they unlock Standard's throughput without the FIFO penalty.

> FIFO's "exactly-once" only de-duplicates within a roughly five-minute window, and only for messages you mark as duplicates. It is not a license to skip idempotency. Build idempotent consumers regardless of queue type.

## Dead-letter queues: where poison messages go to rest

Some messages will never succeed. A malformed payload, a referenced record that was deleted, a bug in your handler — process it, fail, it reappears, fail again, forever. That's a **poison message**, and it can wedge a queue.

A **dead-letter queue (DLQ)** is the release valve. You configure a redrive policy: after a message has been received `maxReceiveCount` times without being deleted, SQS moves it to a separate queue instead of redelivering it.

```text
main queue ──(received 5×, never deleted)──▶ DLQ
                                              │
                                    you inspect, fix, or replay
```

*What just happened:* the failing message stops poisoning your main queue after five attempts and lands in the DLQ, where it can't block healthy traffic. The DLQ becomes your "needs a human" inbox. Always set up a DLQ for any real queue, and *alarm on its depth* — a DLQ filling up is one of the clearest "something is broken" signals you'll get.

JetStream has the same concept in different clothes: you cap redelivery with `max_deliver` on a consumer and route terminal failures to an advisory subject or another stream.

## NATS gotchas: slow consumers and the persistence cliff

NATS is fast, which creates its own failure mode. If a subscriber can't keep up with the rate of incoming messages, NATS won't block the publisher to wait for it. Instead it protects the system by dropping that subscriber's backlog — a **slow consumer**. You'll see a warning, and that subscriber will have holes in its message history.

The mental fix: in core NATS, the producer's speed is not your consumer's problem to throttle. If you can't afford to drop messages, you are on JetStream, full stop. Pull-based JetStream consumers fetch at their own pace and won't be dropped for being slow — that's the entire point of the persistence layer.

The other cliff is forgetting which mode you're in. Core NATS and JetStream look similar in code but have opposite durability guarantees. A message published to a subject that *isn't* captured by any stream is fire-and-forget, even on a server with JetStream enabled. Confirm your stream's `--subjects` actually covers the subjects you publish to, or you'll think you have persistence you don't.

## A short operational checklist

```text
SQS:
  [ ] visibility timeout > worst-case processing time (or heartbeat it)
  [ ] consumers are idempotent (assume at-least-once)
  [ ] DLQ configured with a sane maxReceiveCount
  [ ] CloudWatch alarm on DLQ depth and queue age
  [ ] long polling on (wait-time-seconds) to cut cost

NATS:
  [ ] core NATS only where message loss is acceptable
  [ ] JetStream stream subjects actually cover your publish subjects
  [ ] consumers ack explicitly; max_deliver caps redelivery
  [ ] request() calls always set a timeout
```

*What just happened:* you turned four sharp failure modes into routine config. None of this is heroic — it's the boring discipline that separates a queue that pages you at 3am from one you forget exists.

**In the wild:** the teams who sleep well aren't the ones with the fanciest broker. They're the ones who assumed duplicates, set a DLQ, alarmed on it, and made their consumers idempotent before they ever needed to. The broker is small; the discipline is the product.

```quiz
[
  {
    "q": "Your SQS worker takes 45 seconds but the visibility timeout is 30 seconds. What goes wrong?",
    "choices": ["The message is deleted before processing finishes", "The message becomes visible again at 30s and a second worker processes it too", "SQS rejects the message", "The queue switches to FIFO mode"],
    "answer": 1,
    "explain": "Once the timeout expires, SQS assumes the worker died and redelivers the message — so it gets processed twice. Raise the timeout or heartbeat with change-message-visibility."
  },
  {
    "q": "What's the right response to SQS Standard's at-least-once delivery?",
    "choices": ["Switch everything to FIFO to get exactly-once", "Make consumers idempotent so processing twice is harmless", "Disable the visibility timeout", "Delete messages before processing them"],
    "answer": 1,
    "explain": "Idempotent consumers turn duplicate delivery into a no-op, letting you keep Standard's throughput without fearing repeats."
  },
  {
    "q": "What is a dead-letter queue for?",
    "choices": ["Storing every message for replay", "Holding messages that repeatedly fail so they stop poisoning the main queue", "Speeding up delivery", "Encrypting messages at rest"],
    "answer": 1,
    "explain": "After maxReceiveCount failed attempts, SQS moves the message to the DLQ so a poison message can't wedge the main queue. Alarm on its depth."
  }
]
```

[← Phase 2](02-sending-and-receiving-for-real.md) | [Overview](_guide.md)
