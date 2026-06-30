---
title: "NATS and Amazon SQS"
guide: nats-and-sqs
phase: 0
summary: "Two lighter messaging options: NATS for fast, simple pub/sub and request-reply, and SQS for a fully managed, zero-ops cloud queue."
tags: [nats, sqs, messaging, queues, pubsub, aws, jetstream]
category: tooling
group: "Messaging & Caching"
order: 16
difficulty: intermediate
synonyms: ["nats vs sqs", "amazon sqs tutorial", "nats jetstream", "simple message queue aws", "pub sub broker", "fifo queue vs standard queue", "visibility timeout", "dead letter queue", "lightweight message broker"]
updated: 2026-06-30
---

# NATS and Amazon SQS

You read about Kafka, sketched a topology with partitions and consumer groups and a ZooKeeper-shaped hole in your heart, and then looked at what you actually need: a service that fires an event and another that reacts. That's it. The gap between what Kafka costs to run and what your problem needs is enormous, and you can feel it.

This guide is about the two brokers you reach for when Kafka is overkill. NATS is a tiny, blisteringly fast broker you can run yourself in one binary. SQS is a queue AWS runs for you so you never think about a broker again. Both are boring in the best way, and that's the relief.

## How to read this

Read the phases in order the first time. Phase 1 builds the mental model so the words "subject," "queue group," and "visibility timeout" stop being noise. Phase 2 is the everyday work: publishing, consuming, request-reply, and the SQS receive loop you'll actually write. Phase 3 is where things go wrong in production and how to not get paged for it. If you've already used one of the two, you can skim to the half you don't know.

## The phases

1. [Phase 1: Not Everything Needs Kafka](01-not-everything-needs-kafka.md) — the mental model: what NATS and SQS are, and how to pick a broker.
2. [Phase 2: Sending and Receiving for Real](02-sending-and-receiving-for-real.md) — pub/sub, request-reply, JetStream, and the SQS poll loop.
3. [Phase 3: Production Reality](03-production-reality.md) — visibility timeouts, dead-letter queues, duplicates, and the failure modes.

[Phase 1: Not Everything Needs Kafka](01-not-everything-needs-kafka.md) →
