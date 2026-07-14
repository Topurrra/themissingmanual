---
title: "The CAP Theorem"
guide: the-cap-theorem
phase: 0
summary: "In a distributed system, a network partition forces a choice between consistency and availability - what CAP actually claims, why the choice is unavoidable, and what it looks like in real databases."
tags: [architecture, cap-theorem, distributed-systems, consistency, availability, databases]
category: architecture
order: 9
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

# The CAP Theorem

Every distributed database makes a promise, and eventually breaks part of it - on purpose, because the network forced it to. The CAP theorem is the formal statement of which part breaks, and when. It sounds abstract until the actual moment it applies: a cable gets cut, two data centers can't talk, and every system behind that cable must decide, right now, whether to keep answering or keep agreeing - it can't do both.

## How to read this

Read it in order. Phase 1 defines the three letters precisely - most confusion about CAP comes from vague definitions of "consistency" and "availability." Phase 2 walks through the actual argument for why you can't have all three, using a concrete network partition, and Phase 3 grounds it in real databases you've probably used and clears up the most common misreading of the theorem.

## The phases

1. [The three letters](01-the-three-letters.md) - consistency, availability, and partition tolerance, defined precisely.
2. [Why you can't have all three](02-why-you-cant-have-all-three.md) - walking through a real partition and the forced choice it creates.
3. [What this looks like in real databases](03-what-this-looks-like-in-real-databases.md) - CP systems, AP systems, and the most common misreading of CAP.

[Phase 1: The three letters](01-the-three-letters.md) →
