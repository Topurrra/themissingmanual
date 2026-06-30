---
title: "Phase 2: Sending and Receiving for Real"
guide: nats-and-sqs
phase: 2
summary: "Two lighter messaging options: NATS for fast, simple pub/sub and request-reply, and SQS for a fully managed, zero-ops cloud queue."
tags: [nats, sqs, messaging, queues, pubsub, aws, jetstream]
difficulty: intermediate
synonyms: ["nats vs sqs", "amazon sqs tutorial", "nats jetstream", "simple message queue aws", "pub sub broker", "fifo queue vs standard queue", "visibility timeout", "dead letter queue", "lightweight message broker"]
updated: 2026-06-30
---

# Phase 2: Sending and Receiving for Real

Mental models are nice, but you came here to send a message. This phase is the everyday work: standing up NATS, publishing and subscribing, doing request-reply, adding persistence with JetStream, and writing the SQS loop that pulls work and deletes it. The commands here are the ones you'll actually type.

## Run NATS in one command

You need the server (`nats-server`) and, to poke at it by hand, the CLI (`nats`). Once you have the binary on your path:

```bash
# Start the server. Defaults to listening on port 4222.
nats-server

# In another terminal, subscribe to a subject and wait.
nats sub "orders.>"

# In a third, publish a message to a matching subject.
nats pub orders.placed '{"id": 42, "total": 19.99}'
```

*What just happened:* the subscriber, listening on the wildcard `orders.>`, received the message published to `orders.placed`. The server matched the subject pattern and delivered it. No topic to pre-create, no schema to register - the subject sprang into existence the moment you used it.

That last point surprises people coming from Kafka. In NATS, subjects aren't declared up front. They're addresses, and any publish or subscribe can name a new one.

## Pub/sub with a client library

Here's the same flow in code. The shape is identical across the official client libraries: connect, then subscribe with a handler or publish a payload.

```js
import { connect } from "nats";

const nc = await connect({ servers: "localhost:4222" });

// Subscriber: handle every message on orders.placed
const sub = nc.subscribe("orders.placed");
(async () => {
  for await (const msg of sub) {
    console.log("got order:", msg.string());
  }
})();

// Publisher: fire an event and move on
nc.publish("orders.placed", JSON.stringify({ id: 42, total: 19.99 }));
```

*What just happened:* `publish` returned immediately - it didn't wait for the subscriber to process anything. That's the fire-and-forget default. The subscriber's `for await` loop runs independently as messages arrive.

## Queue groups: load balancing built in

What if you have three workers and you want each message handled by exactly *one* of them, not all three? That's a **queue group**. Subscribers that share a queue group name split the messages between them; the broker picks one member per message.

```js
// Start this on three separate workers - same queue name.
const sub = nc.subscribe("jobs.resize", { queue: "resizers" });
for await (const msg of sub) {
  await resizeImage(msg.data);
}
```

*What just happened:* by passing `{ queue: "resizers" }`, the three subscribers became a single competing-consumer pool. A message to `jobs.resize` goes to one resizer, not all three. This is how you scale a worker horizontally in NATS - no partition math, no rebalancing config.

## Request-reply: RPC over the broker

Sometimes you don't want fire-and-forget. You want an answer. NATS request-reply gives you that: the requester sends and waits, a responder replies on a private inbox subject the requester created.

```js
// Responder: listen, compute, reply.
const sub = nc.subscribe("price.lookup");
for await (const msg of sub) {
  msg.respond(JSON.stringify({ sku: "ABC", price: 9.99 }));
}

// Requester: send and await one reply, with a timeout.
const reply = await nc.request(
  "price.lookup",
  JSON.stringify({ sku: "ABC" }),
  { timeout: 1000 }
);
console.log(reply.string());
```

*What just happened:* `nc.request` published the message and blocked until a reply landed on its temporary inbox subject, or until the 1-second timeout fired. If you ran several responders in a queue group, NATS would load-balance the requests across them - you get failover and scaling for free.

> Always set a timeout on `request`. Without one, a missing responder means your caller waits forever. A timeout turns a silent hang into a clean, catchable error.

## JetStream: when messages must survive

Core NATS forgets. When you need messages to persist - to survive a restart, or to be replayed by a consumer that wasn't online yet - you turn on **JetStream**. You define a **stream** that captures subjects, and **consumers** that read from it with delivery tracking and acknowledgments.

```bash
# Enable JetStream on the server.
nats-server -js

# Create a stream that captures everything under orders.
nats stream add ORDERS --subjects "orders.>" --storage file

# Publish - now it's stored, not just broadcast.
nats pub orders.placed '{"id": 99}'

# Create a durable consumer and pull messages with acks.
nats consumer add ORDERS workers --pull --ack explicit
nats consumer next ORDERS workers --ack
```

*What just happened:* the message to `orders.placed` was written to disk inside the `ORDERS` stream. The `workers` consumer pulled it and acknowledged it. If that consumer had been offline at publish time, the message would still be waiting when it came back - the opposite of core NATS. With `--ack explicit`, an unacknowledged message is redelivered, so a crashed worker doesn't drop the job.

The trade is real: JetStream costs disk and adds the acknowledgment dance. Reach for it when loss is unacceptable; stay on core NATS when it isn't.

## SQS: send, receive, delete

SQS has no server for you to start - you create the queue once, then it's all API calls. The receive loop has a shape you must internalize, because it's where every SQS bug lives. Receiving a message does **not** remove it. You have to delete it yourself after you've processed it.

```bash
# Create a standard queue (one-time setup).
aws sqs create-queue --queue-name jobs

# Send a message.
aws sqs send-message \
  --queue-url "$Q" \
  --message-body '{"task": "resize", "id": 7}'

# Receive up to 10 messages, waiting up to 20s for them (long polling).
aws sqs receive-message \
  --queue-url "$Q" \
  --max-number-of-messages 10 \
  --wait-time-seconds 20
```

*What just happened:* `receive-message` returned messages *and a `ReceiptHandle` for each one*. The message is now invisible to other consumers for the visibility timeout - but it still exists in the queue. If you walk away now, it reappears later and gets processed again. The `--wait-time-seconds 20` is **long polling**: instead of returning instantly empty, SQS waits up to 20 seconds for a message to show up, which cuts your empty-receive count and your bill.

The third step is the one beginners forget - deleting the message once you're done:

```bash
# After successfully processing, delete it using the receipt handle.
aws sqs delete-message \
  --queue-url "$Q" \
  --receipt-handle "$RECEIPT_HANDLE"
```

*What just happened:* the message is now gone for good. The receipt handle is a one-time token tied to *this* receive, not a permanent message ID - receive the same message again and you get a fresh handle. The contract is: **receive → process → delete.** Skip the delete and you'll process the same work twice; we cover why that's survivable in Phase 3.

**For builders:** in real code you use the AWS SDK, not the CLI, and you loop forever: long-poll for a batch, process each message, delete it, repeat. The CLI commands above map one-to-one onto SDK calls (`SendMessage`, `ReceiveMessage`, `DeleteMessage`), so what you learned at the terminal is exactly what you'll write.

```quiz
[
  {
    "q": "In SQS, what does calling ReceiveMessage do to the message?",
    "choices": ["Permanently removes it from the queue", "Makes it invisible for the visibility timeout but leaves it in the queue until you delete it", "Marks it processed automatically", "Copies it to a dead-letter queue"],
    "answer": 1,
    "explain": "Receiving hides the message temporarily and returns a receipt handle. It stays in the queue until you explicitly delete it - receive, process, delete."
  },
  {
    "q": "You have three NATS subscribers and want each message handled by exactly one of them. What do you use?",
    "choices": ["A subject wildcard", "Three separate subjects", "A shared queue group name on the subscriptions", "JetStream with explicit acks"],
    "answer": 2,
    "explain": "Subscribers sharing a queue group name form a competing-consumer pool - the broker delivers each message to just one member."
  },
  {
    "q": "When does JetStream earn its extra disk and acknowledgment overhead over core NATS?",
    "choices": ["When you want the lowest possible latency", "When messages must survive restarts or be replayed by a later consumer", "When you have no subscribers", "When you need request-reply"],
    "answer": 1,
    "explain": "JetStream adds persistence and redelivery so messages survive and can be replayed. Core NATS is fire-and-forget and forgets on restart."
  }
]
```

[← Phase 1](01-not-everything-needs-kafka.md) | [Overview](_guide.md) | [Phase 3: Production Reality →](03-production-reality.md)
