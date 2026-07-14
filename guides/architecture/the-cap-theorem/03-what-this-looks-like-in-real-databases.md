---
title: "What this looks like in real databases"
guide: the-cap-theorem
phase: 3
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

# What this looks like in real databases

Phase 2 showed the forced choice in the abstract: during a partition, a node either answers with a possibly-stale value or refuses to answer. Real databases make that choice deliberately, as a design decision baked in ahead of time. Systems are often labeled "CP" or "AP" as shorthand for which way they lean.

## CP systems: consistency over availability

A **CP system** is built to refuse rather than risk answering wrong. If it can't confirm it has the current, agreed-upon value, it will return an error or block until it can.

**A single-leader relational database during failover.** Most traditional RDBMS setups (a primary with one or more replicas) route all writes through one leader node. If that leader becomes unreachable - partitioned off from the rest of the cluster - the system doesn't let just any replica start accepting writes with unconfirmed data; it typically pauses writes (or serves only reads, clearly marked as such) until a new leader is safely elected or the original one rejoins. The gap in write availability is the price paid to avoid two nodes disagreeing about the current value.

**ZooKeeper and etcd.** These are coordination services, specifically built to be the single source of truth other systems rely on for things like leader election and distributed locks. If they answered with stale data during a partition, every system depending on them for correctness would inherit that corruption. So they're built explicitly CP: during a partition, a node that can't confirm it's part of the majority (the quorum) will refuse to serve requests rather than risk giving an answer that disagrees with the rest of the cluster.

```text
CP system during a partition:
  "I can't confirm this is current." -> refuses / errors / blocks
  Cost: some requests fail during the partition
  Benefit: no client ever sees two different "correct" answers
```

## AP systems: availability over consistency

An **AP system** is built to always answer, even if that answer might be a few moments out of date, and to reconcile any disagreements after the partition heals.

**DynamoDB and Cassandra-style eventual consistency.** These systems are designed so that any reachable node answers a request, partition or not. If Node A and Node B both accepted writes to the same record while cut off from each other, the system doesn't block - it lets both writes happen, and resolves the conflict later using a defined strategy (last-write-wins, version vectors, or an application-supplied merge rule). The read you get back is described as **eventually consistent**: it will converge to the same value everywhere, but not necessarily at the instant you ask.

```text
AP system during a partition:
  "Here's what I have." -> answers immediately, even if stale
  Cost: two nodes might briefly disagree about the current value
  Benefit: no client is ever left without an answer
```

*What just happened, comparing the two:* neither choice is a bug - both are correct engineering responses to the same physical fact (the network split), aimed at different priorities. A payment ledger and a coordination service both lean CP because a wrong answer is worse than no answer. A shopping cart or a social media feed usually leans AP because a few-seconds-stale "add to cart" is a far smaller problem than the entire cart page going down.

## The most common misreading of CAP

Here's the correction that matters most: **CAP describes what a system does *during* a partition - it is not a permanent label for what a system is at all times.** A database described as "AP" isn't somehow less consistent on an ordinary Tuesday with no network issues; outside of a partition, most systems are both consistent and available simultaneously, exactly as Phase 2 showed. The CP/AP label only tells you which guarantee gets dropped in the specific, temporary window when nodes can't talk to each other.

```text
Wrong reading:  "System X is AP, so it's generally less consistent."
Right reading:   "System X is AP, meaning: IF a partition happens,
                  it will keep answering requests rather than refuse them,
                  and consistency is the thing that temporarily gives."
```

*What just happened:* this distinction is exactly why CAP gets misquoted so often in casual conversation. People use "CP" and "AP" as if they were permanent personality traits of a database, when the theorem only ever makes a claim about partition-time behavior. Most of the time, for most systems, the theorem doesn't apply at all - there's no partition, so there's nothing to trade off.

## The deeper refinement: PACELC

CAP's silence about the *non-partition* case is exactly what a later refinement, called **PACELC**, was designed to address: **if there's a Partition, choose between Availability and Consistency (the CAP part) - Else (when the network is fine), choose between Latency and Consistency.** The insight is that even without a partition, there's often still a tradeoff between responding fast and confirming full consistency across replicas first. It's worth knowing the name exists - it's the deeper, more complete version of the same question CAP raises.

## Recap

1. **Consistency** means every node agrees on the latest value; **availability** means every request gets an answer; **partition tolerance** means the system keeps functioning despite a network split - and it's effectively mandatory for any real distributed system.
2. During an actual partition, a node facing a request can only answer (risking staleness) or refuse (risking availability) - there's no third option, which is the theorem itself, not a metaphor for it.
3. **CP systems** (a failing-over RDBMS, ZooKeeper, etcd) refuse rather than risk disagreement. **AP systems** (DynamoDB, Cassandra) always answer and reconcile later.
4. The most common misreading is treating CP/AP as a permanent label. CAP only describes behavior *during* a partition - outside of one, a system is typically both consistent and available.
5. PACELC is the deeper refinement: even without a partition, there's often still a latency-versus-consistency tradeoff to make.

[← Phase 2: Why you can't have all three](02-why-you-cant-have-all-three.md) | [Overview](_guide.md)
