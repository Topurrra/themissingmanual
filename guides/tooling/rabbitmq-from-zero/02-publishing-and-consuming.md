---
title: "Phase 2: Publishing and Consuming for Real"
guide: rabbitmq-from-zero
phase: 2
summary: "The classic message broker: exchanges, queues, and bindings route messages to workers, with acknowledgements and dead-letter queues for reliable delivery."
tags: [rabbitmq, message-broker, amqp, queues, messaging]
difficulty: intermediate
synonyms: ["rabbitmq tutorial", "amqp message broker", "exchange queue binding", "rabbitmq vs kafka", "dead letter queue", "message acknowledgement"]
updated: 2026-06-30
---

# Phase 2: Publishing and Consuming for Real

You have the post-office picture. Now you actually send mail. This phase is the loop you will write a hundred times: declare your plumbing, publish, consume, acknowledge. The new decision is *which kind of exchange* to use, because that single choice changes how a routing key behaves and therefore how your messages spread.

The examples use the AMQP CLI shape and pseudocode that maps cleanly onto every client library (Python's `pika`, Node's `amqplib`, Go, Java). The names of the operations are the same everywhere because they come from the protocol, not the library.

## Declare before you use

Exchanges and queues do not spring into being. You **declare** them - an idempotent operation that creates the thing if missing and otherwise checks it matches. Declaring is safe to run every time your app starts; both producer and consumer typically declare what they need, so neither depends on the other booting first.

```text
exchange.declare  name="orders"  type="topic"  durable=true
queue.declare     name="email_q" durable=true
queue.bind        queue="email_q" exchange="orders" routing_key="order.placed"
```

*What just happened:* you created a durable topic exchange, a durable queue, and a binding that routes `order.placed` messages into `email_q`. `durable=true` means the broker remembers these definitions across a restart (we cover durability of the *messages* in Phase 3 - declaration durability and message durability are separate things).

## The exchange types - pick by routing shape

There are four exchange types. You will use three of them constantly; the fourth is a niche tool.

**Direct** - exact-match routing. A message goes to queues whose binding key equals the routing key, string for string.

```text
exchange type=direct
bind  queue=pdf_q   routing_key="pdf"
bind  queue=image_q routing_key="image"

publish routing_key="pdf"   → pdf_q only
publish routing_key="image" → image_q only
```

*What just happened:* direct is the workhorse for "route this job to the worker that handles its type." One routing key, one matching queue (or several if multiple queues share the same binding key).

**Topic** - pattern routing on dotted keys. Bindings use wildcards: `*` matches exactly one word, `#` matches zero or more words.

```text
exchange type=topic
bind queue=all_orders  routing_key="order.#"
bind queue=eu_orders   routing_key="order.eu.*"

publish routing_key="order.eu.placed" → all_orders AND eu_orders
publish routing_key="order.us.refunded" → all_orders only
```

*What just happened:* topic exchanges let one publish fan out by category. `order.#` catches everything under `order`; `order.eu.*` catches one more word after `order.eu`. This is the flexible default most teams reach for.

**Fanout** - ignore the routing key entirely; copy to *every* bound queue.

```text
exchange type=fanout
bind queue=cache_q
bind queue=audit_q
bind queue=search_q

publish (any routing key) → cache_q AND audit_q AND search_q
```

*What just happened:* fanout is broadcast. Every consumer gets its own copy. Use it for "this event happened, everyone who cares should react" - cache invalidation, live notifications.

The fourth type, **headers**, routes on message header attributes instead of the routing key. It is rarely worth the complexity; reach for topic first and only consider headers if you genuinely need to match on multiple non-hierarchical attributes.

> Mental shortcut: **direct** = "to this one", **topic** = "to whoever subscribed to this pattern", **fanout** = "to everyone".

## Work queues: one queue, many workers

The most common real pattern is not fancy routing - it is one queue with several identical consumers chewing through jobs in parallel. When multiple consumers subscribe to the same queue, RabbitMQ delivers each message to *one* of them. That is competing consumers, and it is how you scale a worker pool: start more processes, they share the load automatically.

```text
queue=task_q  ← consumer #1
              ← consumer #2
              ← consumer #3

100 messages → spread across the three, each message to exactly one worker
```

*What just happened:* a single queue with three consumers triples your throughput with zero code change. Each message is handled once. Contrast this with fanout, where each *queue* gets a copy - here it is one queue, and the *consumers* compete.

## Acknowledgements: the broker needs to know you finished

Here is the part people skip and regret. When a consumer receives a message, the broker does not consider it done. It waits for an **acknowledgement** (ack). Until the ack arrives, the broker considers the message "in flight" - delivered but unconfirmed.

```text
broker → deliver message → consumer
consumer does the work...
consumer → basic.ack → broker   (now the broker deletes it)
```

*What just happened:* the ack is your promise that the work succeeded. If your consumer crashes after receiving but before acking, the broker sees the connection drop, marks the message unacknowledged, and **redelivers** it to another consumer. No work is lost. This is the heart of reliable delivery.

There are two ack modes, and the default in raw AMQP matters:

- **Manual ack** (what you want): you call `basic.ack` after the work succeeds. Crash mid-work → redelivery. This is the safe choice for anything that matters.
- **Auto ack** (`auto_ack=true`): the broker treats the message as done the instant it ships it out. Fast, but if your consumer dies before finishing, the message is gone forever. Only use it for data you can afford to lose.

```text
# Safe consumer loop, in any language
consume(queue="task_q", auto_ack=false)
on_message(msg):
    do_the_work(msg)        # if this throws, no ack is sent
    basic.ack(msg)          # only reached on success
```

*What just happened:* by acking *after* the work and only on success, a crash leaves the message unacknowledged, and the broker hands it to someone else. Move the ack to the top and you have silently switched to "lose work on crash."

## Prefetch: stop one greedy worker from hoarding

By default a consumer will accept as many unacknowledged messages as the broker wants to push. So if you have three workers and 300 messages, one fast-connecting worker might grab 200 while the others sit idle - then if it is slow, your queue drains slowly even though two workers are bored.

The fix is **prefetch** (`basic.qos` with `prefetch_count`): cap how many unacknowledged messages one consumer may hold at once.

```text
basic.qos(prefetch_count=1)
```

*What just happened:* with prefetch 1, a consumer gets exactly one message, must ack it before getting the next, and slow workers stop starving fast ones. The work spreads by actual capacity, not by who grabbed first. For quick uneven jobs, 1 is a fine default; for high-throughput tiny messages, a small number like 10 to 50 reduces round-trips. Tune it; do not leave it unlimited.

## In the wild

A typical background-job setup: a topic exchange named after your domain, one durable queue per job type bound with a specific routing key, manual acks, `prefetch_count` tuned to your job size, and a worker pool of identical consumers per queue. That handful of decisions covers the vast majority of production RabbitMQ usage. The event-driven thinking behind *why* you publish events at all is worth the detour in [/guides/event-driven-architecture](/guides/event-driven-architecture).

```quiz
[
  {
    "q": "Which exchange type ignores the routing key and copies the message to every bound queue?",
    "choices": ["direct", "topic", "fanout", "headers"],
    "answer": 2,
    "explain": "Fanout broadcasts: every bound queue receives a copy, regardless of routing key. Direct and topic both route by key."
  },
  {
    "q": "With manual acknowledgement, when should a consumer call basic.ack?",
    "choices": ["Immediately on receiving the message", "After the work succeeds", "Before doing any work", "Never; the broker acks automatically"],
    "answer": 1,
    "explain": "Ack after success. If the consumer crashes before acking, the broker redelivers the message, so no work is lost."
  },
  {
    "q": "What does setting prefetch_count=1 accomplish?",
    "choices": ["Deletes the queue after one message", "Limits a consumer to one unacknowledged message at a time, spreading load fairly", "Makes the exchange a fanout", "Disables acknowledgements"],
    "answer": 1,
    "explain": "Prefetch caps in-flight unacked messages per consumer, preventing one worker from hoarding the queue while others sit idle."
  }
]
```

[← Phase 1: The Smart Post Office](01-the-smart-post-office.md) | [Overview](_guide.md) | [Phase 3: When Delivery Goes Wrong →](03-when-delivery-goes-wrong.md)
