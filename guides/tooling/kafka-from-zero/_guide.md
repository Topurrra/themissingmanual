---
title: "Kafka, From Zero"
guide: kafka-from-zero
phase: 0
summary: "The distributed log everyone runs in production: topics, partitions, offsets, and consumer groups - append-only streams you can replay, not a traditional queue."
tags: [kafka, distributed-log, streaming, partitions, consumer-groups, messaging]
category: tooling
group: "Messaging & Caching"
order: 13
difficulty: intermediate
synonyms: ["kafka tutorial", "what is apache kafka", "kafka topics partitions offsets", "consumer groups explained", "kafka vs message queue", "at least once delivery kafka", "how to replay kafka messages"]
updated: 2026-06-30
---

# Kafka, From Zero

You keep hearing that Kafka is "a message queue," so you go in expecting RabbitMQ with a different logo - and then nothing fits. Messages don't disappear when you read them. Two different services read the same data. You can rewind and read last Tuesday's events again. The "queue" model you brought with you fights you at every turn, and it feels like the tool is broken.

It isn't broken. Kafka is not a queue - it's a **durable, append-only log**, and almost every confusion you'll have comes from carrying queue intuitions into a log-shaped world. This guide swaps the mental model first. Once you see Kafka as "a giant shared notebook that nobody erases, where each reader keeps their own bookmark," topics, partitions, offsets, and consumer groups stop being trivia and start being obvious.

## How to read this

Read the phases in order. Phase 1 replaces "queue" with "log" in your head - the one swap that makes the rest make sense. Phase 2 is the daily work: producing with keys, consuming in groups, committing offsets, and how partitions give you both ordering and parallelism. Phase 3 is production reality: delivery guarantees, why you get duplicates, idempotent consumers, rebalances, and retention. If the broader idea of async messaging is new to you, start with [/guides/webhooks-and-message-queues](/guides/webhooks-and-message-queues); if you're wondering *why* a company builds around streams, see [/guides/event-driven-architecture](/guides/event-driven-architecture).

## The phases

1. [Phase 1: It's a Log, Not a Queue](01-its-a-log-not-a-queue.md) - the mental model: append-only topics, partitions, offsets, and why reading doesn't delete anything.
2. [Phase 2: Producing and Consuming for Real](02-producing-and-consuming.md) - the everyday loop: keys and partitioning, consumer groups, committing offsets, and how to scale readers.
3. [Phase 3: Production Reality](03-production-reality.md) - delivery guarantees, duplicates, idempotent consumers, rebalances, retention, and when Kafka is the wrong tool.

[Phase 1: It's a Log, Not a Queue](01-its-a-log-not-a-queue.md) →
