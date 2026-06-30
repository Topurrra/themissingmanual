---
title: "Phase 3: When Delivery Goes Wrong"
guide: rabbitmq-from-zero
phase: 3
summary: "The classic message broker: exchanges, queues, and bindings route messages to workers, with acknowledgements and dead-letter queues for reliable delivery."
tags: [rabbitmq, message-broker, amqp, queues, messaging]
difficulty: intermediate
synonyms: ["rabbitmq tutorial", "amqp message broker", "exchange queue binding", "rabbitmq vs kafka", "dead letter queue", "message acknowledgement"]
updated: 2026-06-30
---

# Phase 3: When Delivery Goes Wrong

Everything in Phase 2 works on a good day. This phase is about the bad days: the broker restarts, a message can never be processed, a buggy consumer rejects the same message forever, or your queue quietly grows until memory runs out. RabbitMQ has answers for each, but they are opt-in. The defaults favor speed, and "I assumed it was durable" is a classic 3am lesson.

## Durability: surviving a broker restart

By default, queues and messages live in memory. Restart the broker and they vanish. Reliability needs three things turned on together — miss any one and you still lose data:

```text
1. queue.declare  durable=true        # the queue definition survives restart
2. publish with   delivery_mode=2     # the message is persisted to disk
3. exchange.declare durable=true      # the exchange definition survives restart
```

*What just happened:* a durable queue holding non-persistent messages still loses the messages on restart — the queue comes back empty. You need the queue durable *and* each message marked persistent (`delivery_mode=2`, sometimes exposed as a `persistent=true` flag). Persistence costs disk writes, so it is a deliberate trade: durability for throughput.

> Durable does not mean instant. There is a brief window where a confirmed-to-the-app message is still in the OS buffer, not yet on disk. If you need a hard guarantee that the broker has the message, use **publisher confirms** — the broker sends back a confirmation once it has taken responsibility for the message. Without confirms, a publish that "succeeds" only means it left your process.

## Redelivery and the poison message problem

Phase 2's safety net — unacked messages get redelivered — has a sharp edge. Suppose a message is malformed and your consumer throws every single time it tries. The flow becomes a loop:

```text
deliver → consumer throws → no ack → broker redelivers → consumer throws → ...forever
```

*What just happened:* a **poison message** jams the queue. Because the consumer never acks, the broker keeps handing the same message back. One bad message can stall an entire worker pool, burning CPU on a job that will never succeed. Redelivery alone is not enough; you need somewhere for hopeless messages to go.

## Reject vs nack: telling the broker "not this one"

A consumer is not limited to ack. It can also refuse a message:

- **`basic.nack`** (or `basic.reject`) with `requeue=true` — "I could not handle this, put it back." The message returns to the queue for another attempt.
- **`basic.nack`** with `requeue=false` — "I could not handle this, and do not give it back." The message is removed from the queue — and *this* is the hook that sends it to a dead-letter queue.

```text
on_message(msg):
    try:
        do_the_work(msg)
        basic.ack(msg)
    except PermanentError:
        basic.nack(msg, requeue=false)   # give up → dead-letter it
    except TransientError:
        basic.nack(msg, requeue=true)    # retry later
```

*What just happened:* you decide per-error whether a failure is worth retrying. A network blip is transient — requeue it. A message your code can never parse is permanent — `requeue=false` so it leaves the main queue instead of poisoning it. The difference between these two branches is the difference between self-healing and an infinite loop.

## Dead-letter queues: the hospital for failed messages

A **dead-letter exchange** (DLX) is a normal exchange that a queue forwards messages to when they are dead-lettered. A message gets dead-lettered when it is nacked with `requeue=false`, when it expires (TTL), or when the queue overflows its length limit.

You configure it as an argument on the *source* queue:

```text
queue.declare  name="task_q"
  arguments:
    x-dead-letter-exchange: "dlx"
    x-dead-letter-routing-key: "task.failed"

# then a normal queue catches the dead letters:
queue.declare  name="task_dead_q"
queue.bind     queue="task_dead_q" exchange="dlx" routing_key="task.failed"
```

*What just happened:* failed messages from `task_q` are not lost and do not loop — they are routed through the DLX into `task_dead_q`, where you can inspect them, alert on them, or replay them after a fix. The dead-letter queue is your evidence locker: it tells you *what* failed and lets you decide what to do, instead of silently dropping or silently retrying forever.

```text
task_q ──(nack requeue=false)──▶ DLX ──▶ task_dead_q ──▶ you, reading the failures
```

*What just happened:* the poison loop from earlier is broken. Bad messages exit the hot path after one decisive failure and land somewhere safe and visible. A common pattern adds a retry queue with a TTL in between, so a message bounces back for a few delayed attempts before finally giving up to the dead-letter queue.

## RabbitMQ vs Kafka: pick the right shape

People reach for Kafka and RabbitMQ for overlapping reasons, but they are built on opposite ideas, and knowing which you have saves you from forcing the wrong model.

| | RabbitMQ | Kafka |
| --- | --- | --- |
| Core model | Smart broker, dumb consumer | Dumb broker, smart consumer |
| What it is | A router that pushes messages to queues | A durable, ordered log readers pull from |
| After delivery | Message is acked and **deleted** | Message **stays** in the log (retention window) |
| Re-read old messages | No — once consumed and acked, it is gone | Yes — rewind your offset and replay |
| Routing | Rich: exchanges, topics, bindings | Minimal: topics and partitions |
| Best fit | Task queues, RPC, complex routing, per-message workflows | High-volume event streams, replay, many independent readers |

*What just happened:* the deciding question is *do consumers need to re-read history?* RabbitMQ treats a message as work to be done once and removed — perfect for "resize this image," "send this email," "charge this card." Kafka treats messages as a permanent log you can replay — perfect for "every page view, forever, read by analytics and billing and ML independently." If you want rich routing and fire-and-forget jobs, RabbitMQ. If you want a replayable stream consumed at each reader's own pace, Kafka. Using one where the other belongs is the most expensive RabbitMQ mistake there is.

## In the wild

A production-grade RabbitMQ queue almost never stands alone. It comes with: durable + persistent messages, manual acks, a dead-letter exchange catching permanent failures, and usually a delayed retry queue in front of the DLX. Set those up once as your default template and most reliability questions answer themselves. When you find yourself wanting infinite retention and replay, that is the signal you have outgrown the queue model — not a reason to fight RabbitMQ into being a log.

```quiz
[
  {
    "q": "To survive a broker restart, what does a message need beyond a durable queue?",
    "choices": ["Nothing; a durable queue is enough", "To be marked persistent (delivery_mode=2)", "A fanout exchange", "auto_ack enabled"],
    "answer": 1,
    "explain": "A durable queue with non-persistent messages comes back empty. The message itself must be persisted to disk (delivery_mode=2)."
  },
  {
    "q": "What sends a message to a dead-letter exchange?",
    "choices": ["Acking it successfully", "Nacking it with requeue=false (or TTL expiry, or queue overflow)", "Publishing to a topic exchange", "Setting prefetch_count=1"],
    "answer": 1,
    "explain": "Dead-lettering happens on nack/reject with requeue=false, on message TTL expiry, or on queue length overflow — routing the message out of the hot path."
  },
  {
    "q": "The biggest difference between RabbitMQ and Kafka is:",
    "choices": ["RabbitMQ is faster in all cases", "Kafka cannot do routing at all", "RabbitMQ deletes messages after they are acked; Kafka keeps them in a replayable log", "Kafka has no consumers"],
    "answer": 2,
    "explain": "RabbitMQ is a broker that routes and deletes; Kafka is a durable log you can rewind and replay. That shapes which workloads fit each."
  }
]
```

[← Phase 2: Publishing and Consuming for Real](02-publishing-and-consuming.md) | [Overview](_guide.md)
