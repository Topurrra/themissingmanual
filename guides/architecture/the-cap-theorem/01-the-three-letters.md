---
title: "The three letters"
guide: the-cap-theorem
phase: 1
summary: "In a distributed system, a network partition forces a choice between consistency and availability - what CAP actually claims, why the choice is unavoidable, and what it looks like in real databases."
tags: [architecture, cap-theorem, distributed-systems, consistency, availability, databases]
difficulty: advanced
synonyms:
  - what is the cap theorem
  - consistency vs availability
  - cap theorem explained
  - can you have consistency availability and partition tolerance
  - cp vs ap systems
  - cap theorem database examples
updated: 2026-07-10
---

# The three letters

CAP stands for Consistency, Availability, and Partition tolerance. Each word already has an everyday meaning that will mislead you slightly, so before anything else, here's what each one means specifically in this context - a distributed system, meaning data that's copied across more than one machine.

## C - Consistency

**In this context, consistency means every node in the system agrees on the current value.** If you write a new value to the system and then immediately read it back - from any node - you get that new value, not an old one. There is one true answer, and every copy reflects it.

```text
Node A: balance = $500
Node B: balance = $500
Node C: balance = $500

-> a client writes balance = $400 to Node A
-> consistency means A, B, and C ALL now say $400, before any client
   is allowed to read $500 again from any of them
```

*What just happened:* consistency here is entirely about agreement across copies of data, not about a single database enforcing rules like "balances can't go negative." That second meaning is a real thing too - it's the "C" in ACID - but it's a different concept that happens to share a letter. In CAP, consistency is purely: does everyone see the same, latest value, right now.

## A - Availability

**Availability means every request that reaches a working node gets a response - not an error, not a timeout, an actual answer.** It says nothing about whether that answer is the newest value. It only promises that the system answers.

```text
Client sends: GET balance

Available system's promise:
  -> you WILL get a response (even if it might be slightly stale)

NOT the promise:
  -> the response is guaranteed to be the very latest value
```

*What just happened:* availability is a promise about responsiveness, full stop. A system can be perfectly available and still hand you data that's a few seconds out of date. Those are two separate axes, and CAP is specifically about the tension between them - which is exactly why conflating "available" with "correct" is the fastest way to misread this theorem.

## P - Partition tolerance

**A partition is when the network between nodes breaks** - a cable gets cut, a data center loses connectivity, a router drops packets - and some nodes can no longer talk to others, even though every individual node is still running fine. **Partition tolerance means the system keeps operating in some form despite that split**, rather than halting entirely.

```text
Before the partition:
  [Node A] <---> [Node B] <---> [Node C]     (all connected, one system)

During a partition:
  [Node A] <---> [Node B]      X      [Node C]
                          (network split - C is cut off from A and B)
```

*What just happened:* Node C hasn't crashed - it's still running, still has data, and can still answer requests from clients that reach it. What it can't do is talk to A and B to confirm it has the latest value or hear about new writes. Partition tolerance is about what happens next: does the system keep working in this split state, or stop entirely until the network heals?

> Consistency is about agreement. Availability is about responsiveness. Partition tolerance is about surviving a broken network instead of giving up.

## Why partition tolerance isn't really optional

It's tempting to read CAP as "pick any two of three" - as if you could skip partition tolerance and keep both consistency and availability. That's not a real option: every distributed system's nodes talk over a network, and networks fail - cables get cut, switches misbehave, cloud regions have outages. A system that isn't partition-tolerant hasn't "chosen CA"; it just stops working correctly the moment a partition happens, which is a matter of when, not if.

```text
Not partition-tolerant  ->  breaks (in some way) the moment a real partition occurs
Partition-tolerant       ->  keeps running during a partition, but must choose:
                              stay consistent, or stay available. Not both.
```

*What just happened:* this reframes the whole theorem - it isn't really "pick two of three" as a free menu. Partition tolerance is a fact of life for any real distributed system; the actual decision you get to make is what to do *during* a partition: favor consistency, or favor availability. Phase 2 walks through exactly why you can't have both once the network is actually split.

[← Overview](_guide.md) | [Phase 2: Why you can't have all three →](02-why-you-cant-have-all-three.md)
