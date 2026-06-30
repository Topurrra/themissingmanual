---
title: "RabbitMQ, From Zero"
guide: rabbitmq-from-zero
phase: 0
summary: "The classic message broker: exchanges, queues, and bindings route messages to workers, with acknowledgements and dead-letter queues for reliable delivery."
tags: [rabbitmq, message-broker, amqp, queues, messaging]
category: tooling
group: "Messaging & Caching"
order: 15
difficulty: intermediate
synonyms: ["rabbitmq tutorial", "amqp message broker", "exchange queue binding", "rabbitmq vs kafka", "dead letter queue", "message acknowledgement"]
updated: 2026-06-30
---

# RabbitMQ, From Zero

You have a web request that needs to send an email, resize an image, or charge a card, and you do not want the user staring at a spinner while it happens. So you reach for a queue. Then you open the RabbitMQ docs and meet exchanges, bindings, routing keys, vhosts, and a dozen acknowledgement modes, and the simple idea of "put work on a list" suddenly has more knobs than your stove. This guide gives you the mental model first, so every knob has a place to live.

By the end you will know what each piece does, how a message actually travels from your code to a worker, and how to make delivery reliable instead of hopeful.

## How to read this

Read the phases in order. Phase 1 builds the picture in your head: the broker, the post office, the difference between an exchange and a queue. Phase 2 is the daily work: publishing, consuming, the exchange types, prefetch. Phase 3 is what bites you in production: lost messages, poison messages, dead-letter queues, and how RabbitMQ differs from Kafka so you pick the right tool. If you have never touched a queue before, the broader idea is covered in [/guides/webhooks-and-message-queues](/guides/webhooks-and-message-queues).

## The phases

1. [Phase 1: The Smart Post Office](01-the-smart-post-office.md) — the mental model: broker, exchanges, queues, bindings, and why the producer never names a queue.
2. [Phase 2: Publishing and Consuming for Real](02-publishing-and-consuming.md) — the everyday loop: exchange types, routing keys, acknowledgements, and prefetch.
3. [Phase 3: When Delivery Goes Wrong](03-when-delivery-goes-wrong.md) — durability, redelivery, poison messages, dead-letter queues, and RabbitMQ versus Kafka.

[Phase 1: The Smart Post Office](01-the-smart-post-office.md) →
