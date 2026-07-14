---
title: "Production Reality"
guide: kafka-from-zero
phase: 3
summary: "Delivery guarantees and why duplicates happen, building idempotent consumers, surviving rebalances, how retention quietly deletes old data, and when Kafka is the wrong tool."
tags: [kafka, delivery-guarantees, idempotency, rebalancing, retention, production]
difficulty: intermediate
synonyms: ["kafka at least once delivery", "kafka duplicate messages", "idempotent consumer kafka", "kafka rebalance explained", "kafka retention policy", "when not to use kafka"]
updated: 2026-06-30
---

# Production Reality

Everything works on your laptop with one consumer and ten messages. Production is where the log model earns its keep - and where the sharp edges live. None of these are bugs; they're the plain consequences of "durable distributed log." Know them in advance and they're routine. Meet them at 2am during an incident and they're a very bad night.

## Delivery guarantees: you'll almost always get at-least-once

There are three theoretical guarantees. Here's what each actually means and which one you live with.

- **At-most-once** - commit the offset *before* processing. If you crash mid-process, you've already moved your bookmark past the record, so it's never retried. You can **lose** records. Rare in practice; nobody wants silent data loss.
- **At-least-once** - process the record, *then* commit the offset. If you crash after processing but before committing, you resume from the old offset and **re-process** the record. You can get **duplicates**, never loss. **This is the default and the one you should design for.**
- **Exactly-once** - no duplicates, no loss. Kafka supports it for specific Kafka-to-Kafka flows (idempotent producer + transactions), but the moment your consumer touches an outside system - a database, an email, a payment API - you're back to designing for at-least-once at that boundary.

```text
at-least-once timeline (the common case):

  read offset 50  →  process (charge card ✅)  →  CRASH before commit
  restart         →  resume from offset 50    →  process AGAIN  →  card charged twice ❌
```

*What just happened:* the record was handled correctly, but the crash landed in the gap between "did the work" and "saved my place," so the work runs a second time. Kafka did nothing wrong - it just resumed from the last *committed* offset. This is why the next section isn't optional.

💡 **Key point.** "At-least-once" is not a setting you can flip off. It's the physics of "do work, then record that you did it" with a crash possible in between. The fix is never "make Kafka stop sending duplicates" - it's "make processing the same record twice harmless." That property has a name: idempotency.

## Idempotent consumers: the real-world fix

An operation is **idempotent** if doing it twice has the same effect as doing it once. If your consumer is idempotent, duplicates stop mattering, and your whole system gets dramatically simpler. Three common ways:

**1. Use a natural unique key + upsert.** Instead of `INSERT`, write `INSERT ... ON CONFLICT DO NOTHING` (or an upsert) keyed on something stable in the event, like `order_id`. The second arrival hits the conflict and does nothing.

```sql
-- Re-processing the same event is a no-op: the order_id already exists.
INSERT INTO orders (order_id, amount, status)
VALUES ('A100', 42, 'paid')
ON CONFLICT (order_id) DO NOTHING;
```

*What just happened:* the first time, the row is inserted. The duplicate from the at-least-once retry hits the unique `order_id`, the `ON CONFLICT` clause swallows it, and the order isn't double-counted. The duplicate became harmless without Kafka doing anything special.

**2. Track processed IDs.** Keep a table (or Redis set) of event IDs you've already handled; skip any you've seen. More work, but handles side effects that aren't a simple row write.

**3. Make the side effect itself idempotent.** Many external APIs accept an *idempotency key* - send the same key twice and the second call is ignored. Pass the event's ID as that key when you charge the card or send the email.

> 📝 **Terminology.** "Make it idempotent" is the single most useful sentence in event-driven work. It moves the burden from "guarantee each message is delivered exactly once" (very hard, distributed) to "guarantee processing twice is safe" (a local design choice you fully control). The broader pattern is covered in [/guides/event-driven-architecture](/guides/event-driven-architecture).

## Rebalances: when the group reshuffles

Whenever group membership changes - a consumer joins, leaves, or is presumed dead because it stopped checking in - Kafka triggers a **rebalance**: it re-divides the partitions among the surviving members. This is the mechanism that lets you scale up and recover from crashes. The catch:

- During a rebalance, consumption **pauses** briefly while partitions are reassigned. Frequent rebalances mean choppy throughput.
- The usual cause of *surprise* rebalances is a consumer that takes too long between polls. Kafka has a heartbeat and a max-poll interval; if your processing of a batch exceeds it, the broker decides the consumer is dead, kicks it out, and rebalances - even though it was alive and only slow.

⚠️ **Watch out.** A common production spiral: processing is slow → consumer misses its poll deadline → kicked out → rebalance → the records it was working on get reassigned and re-processed by someone else → still slow → repeat. The fixes are to shrink batch sizes, do heavy work asynchronously, or raise the max-poll interval - and to be idempotent so the re-processing during the churn is safe.

## Retention: the log is not infinite by default

Kafka keeps records on disk, but not forever unless you say so. **Retention** governs when old records are deleted, and it's set per topic:

- **Time-based** - e.g. keep 7 days; anything older is eligible for deletion. The default on many setups.
- **Size-based** - e.g. keep the most recent 50 GB per partition.
- **Compaction** - a different mode: instead of deleting by age, keep only the *latest* record per key. Useful when a topic represents current state ("the latest profile for each user") rather than a stream of events.

```bash
# See a topic's retention settings.
kafka-configs --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name orders --describe
# retention.ms=604800000      (7 days)
# cleanup.policy=delete        (delete by age, vs "compact")
```

*What just happened:* this topic keeps records for 7 days (`604800000` ms) and uses the `delete` policy. After 7 days, old segments are removed - so "I can always replay from offset 0" is true *only within the retention window*. If you need full history forever, you must configure for it; don't assume it.

## When Kafka is the wrong tool

Kafka is heavy. Reach for it when you genuinely have streams: high throughput, multiple independent consumers of the same data, replay, or event history. Don't reach for it when:

- **You need per-message routing and complex delivery logic** (priorities, fan-out by routing rules, per-message acks/requeue). That's a classic broker's job - [/guides/webhooks-and-message-queues](/guides/webhooks-and-message-queues) covers that shape, and a tool like RabbitMQ fits it better.
- **You have low volume and one consumer.** A database table or a simple queue is less to operate than a Kafka cluster.
- **You need a request/response or a task that returns a result to the caller.** Kafka is one-directional event flow, not RPC.

💡 **Key point.** "Kafka vs a queue" is the wrong framing. They're different shapes: a queue is for *work to be done once by someone*; Kafka is for *events to be read by anyone, possibly more than once, possibly again later*. Match the tool to which sentence describes your problem.

## Recap

1. You almost always design for **at-least-once**: process then commit, accept possible **duplicates**, never lose data.
2. **Idempotent consumers** (upsert on a natural key, dedupe tables, idempotency keys) make duplicates harmless - that's the real fix, not chasing exactly-once.
3. **Rebalances** reassign partitions on membership change; slow processing causes surprise rebalances and re-processing.
4. **Retention** deletes old records by time, size, or compaction - replay only works *within* the window you configure.
5. Use Kafka for **streams, replay, and many readers**; use a **queue** for one-time routed work and a **DB/RPC** for low volume or request/response.

```quiz
[
  {
    "q": "Why do duplicate messages happen under the common at-least-once setup?",
    "choices": [
      "Kafka intentionally sends every message twice for safety",
      "A consumer can crash after processing a record but before committing its offset, so it re-reads on restart",
      "Producers always send each record to two partitions",
      "Retention causes old messages to be re-delivered"
    ],
    "answer": 1,
    "explain": "At-least-once means process then commit. A crash in the gap between the two makes the consumer resume from the last committed offset and re-process - a duplicate, never a loss."
  },
  {
    "q": "What is the practical fix for duplicate deliveries?",
    "choices": [
      "Switch Kafka to at-most-once mode",
      "Make the consumer idempotent so processing the same record twice is harmless",
      "Reduce the partition count to 1",
      "Disable retention so messages can't be replayed"
    ],
    "answer": 1,
    "explain": "You can't eliminate at-least-once duplicates across an external side effect. Designing processing to be idempotent (upserts, dedupe, idempotency keys) makes duplicates safe."
  },
  {
    "q": "A topic has retention.ms set to 7 days. What does that mean for replay?",
    "choices": [
      "You can always replay from offset 0 no matter how old",
      "Records older than 7 days are eligible for deletion, so replay only works within that window",
      "Consumers are kicked from the group every 7 days",
      "Each consumer keeps its offset for only 7 days"
    ],
    "answer": 1,
    "explain": "Retention deletes records past the configured age. Replay from offset 0 is only possible for data still inside the retention window; older data is gone unless you configured longer retention or compaction."
  }
]
```

---

[← Phase 2: Producing and Consuming for Real](02-producing-and-consuming.md) · [Guide overview](_guide.md)
