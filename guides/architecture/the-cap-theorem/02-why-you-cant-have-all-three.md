---
title: "Why you can't have all three"
guide: the-cap-theorem
phase: 2
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

# Why you can't have all three

Phase 1 defined the three letters. This phase is the actual theorem: walk through one concrete partition, step by step, and watch consistency and availability become mutually exclusive in real time. This isn't an abstract impossibility proof - it's a forced decision that a real piece of software has to make, right now, with an actual request waiting on it.

## The setup

Two nodes, A and B, both holding a copy of the same value, replicated so either one can serve reads and writes.

```text
Node A: inventory_count = 10
Node B: inventory_count = 10

Client 1 is connected to Node A.
Client 2 is connected to Node B.
```

*What just happened:* nothing unusual yet - this is just ordinary replication, working exactly as intended. Both nodes agree, and a client can talk to either one and get the same, correct answer.

## The partition happens

The network link between A and B goes down. Both nodes are still running. Both can still serve the clients connected to them. They can't talk to each other anymore.

```text
Node A: inventory_count = 10        X        Node B: inventory_count = 10
              (Client 1)                            (Client 2)
                        (network link is down)
```

*What just happened:* this is the partition from Phase 1, made concrete. Neither node crashed. Neither client's connection dropped. The only thing broken is A and B's ability to synchronize with each other.

## Client 1 makes a write

While the partition is ongoing, Client 1 sells the last unit and writes `inventory_count = 9` to Node A.

```text
Node A: inventory_count = 9   <- just updated
Node B: inventory_count = 10  <- has no idea; can't hear from A
```

*What just happened:* Node A applied the write locally - it has no other choice, since it can't check with B first. Node B still thinks the count is 10, and has no way to find out otherwise, because the link that would carry that update is down.

## Client 2 makes a request - and now the system must choose

At this exact moment, Client 2 asks Node B for the current inventory count. Node B has to answer *something*, and every option it has falls into one of two camps.

```text
Option 1 - favor consistency:
  Node B says: "I can't confirm I have the latest value, since I can't reach A.
                I will not answer." -> returns an error / times out
  Result: the system just gave up AVAILABILITY to protect CONSISTENCY.

Option 2 - favor availability:
  Node B says: "Here's what I have: inventory_count = 10."
  Result: Client 2 just got a STALE, WRONG answer (it's actually 9).
          The system gave up CONSISTENCY to protect AVAILABILITY.
```

*What just happened:* there is no third option. Node B cannot both answer *and* guarantee correctness, since confirming correctness requires reaching A, and A is unreachable - every possible response falls cleanly into one of the two buckets above. This is the theorem itself, not a metaphor for it: an actual node, facing an actual request, during an actual partition, with only two shapes of response available.

> During a partition, "answer, but maybe wrong" and "refuse to answer" are the only two moves left on the board. CAP is the statement that there is no third move.

## Why this only bites during the partition

Before the partition and after it heals, A and B can talk, and the system can be both consistent and available at once - there's no tension because there's no obstacle to synchronizing. The forced choice is strictly a partition-time phenomenon.

```text
No partition       -> consistency AND availability, simultaneously, no conflict
During a partition -> pick one, for as long as the partition lasts
Partition heals     -> back to both, once the nodes resync
```

*What just happened:* this is worth sitting with, because it's the detail most summaries skip, and it sets up the correction in Phase 3 - CAP doesn't say a system is "a CP system" or "an AP system" as some permanent identity. It says: *when a partition happens, which way does this particular system lean.* The rest of the time, the theorem has nothing to say at all.

## What "choosing" looks like in practice

Real systems don't flip a switch mid-outage - the choice is a design decision, baked into the software in advance: what should a node do if it can't reach its peers? Some default to Option 1: refuse, or elect a leader and let only the leader answer. Others default to Option 2: always respond, and reconcile the disagreement once the partition heals - Phase 3 looks at real databases that made each choice, and clears up the most common misunderstanding about what CAP actually claims.

```quiz
[
  {
    "q": "During a network partition, Node B cannot reach Node A to confirm it has the latest value, but a client asks Node B for data anyway. What are Node B's only two options, according to CAP?",
    "choices": [
      "Answer with a value that might be stale, or refuse to answer at all",
      "Answer correctly no matter what, or shut down permanently",
      "Ask the client to wait until the network heals, with no other option",
      "Automatically fail over to a third node that always has the answer"
    ],
    "answer": 0,
    "explain": "Node B can't verify correctness without reaching A, so it can only answer (risking staleness, favoring availability) or refuse (favoring consistency). There's no third move once the partition is real."
  },
  {
    "q": "When does the tension between consistency and availability actually apply, according to this phase?",
    "choices": [
      "At all times, permanently, for any distributed system",
      "Only during an actual network partition - before and after, both can hold at once",
      "Only when the system has more than 10 nodes",
      "Only during scheduled maintenance windows"
    ],
    "answer": 1,
    "explain": "Outside a partition, nodes can synchronize freely and there's no obstacle to being both consistent and available. The forced choice is specifically a partition-time phenomenon."
  },
  {
    "q": "In the walkthrough, why can't Node B return the correct, up-to-date value while the partition is ongoing?",
    "choices": [
      "Node B's disk is full",
      "Node B doesn't support writes",
      "Confirming the latest value would require reaching Node A, which is unreachable during the partition",
      "The client's request timed out before Node B could respond"
    ],
    "answer": 2,
    "explain": "Node B's only copy of the truth is its own last-known value. Verifying it's still current requires the very connection to A that the partition has severed."
  }
]
```

Watch it animated: [the CAP theorem](/explainers/CAPTheorem.dc.html)

[← Phase 1: The three letters](01-the-three-letters.md) | [Overview](_guide.md) | [Phase 3: What this looks like in real databases →](03-what-this-looks-like-in-real-databases.md)
