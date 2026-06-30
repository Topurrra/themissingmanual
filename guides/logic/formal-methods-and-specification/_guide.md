---
title: "Formal Methods and Specification"
guide: "formal-methods-and-specification"
phase: 0
summary: "Describe what a system must do, and why it is correct, before you build it: state machines, invariants, and specify-before-you-code."
tags: [logic, formal-methods, specification, tla, invariants, intermediate]
category: logic
order: 8
difficulty: intermediate
synonyms: ["what are formal methods", "what is a specification", "TLA+ for beginners", "specify before you code", "state machine invariants", "how to find design bugs before coding", "model checking"]
updated: 2026-06-30
---

# Formal Methods and Specification

You've shipped the bug that no test caught — the one that only happens when two requests
land in the wrong order, or a node dies at the exact wrong millisecond. You couldn't have
written a test for it because you didn't know the situation existed. That's the gap formal
methods fill: instead of checking the code you wrote, you describe the *design* precisely
enough that a tool can hunt down every situation it allows, including the ones you'd never
think to test. The relief is real — teams catch fatal design bugs this way before a single
line of code exists.

## How to read this
- **Want the mental shift first?** [Phase 1](01-the-blueprint-not-the-building.md) reframes
  what a spec even is.
- **Want to actually model something?** Read in order — Phase 2 is states, transitions, and
  invariants; Phase 3 is checking the design and a gentle look at TLA+.

## The phases
1. **[The Blueprint, Not the Building](01-the-blueprint-not-the-building.md)** — a spec
   describes *what must be true*, separate from the code; coding is to programming what
   typing is to writing.
2. **[States, Transitions, and Invariants](02-states-transitions-invariants.md)** — model a
   system as states plus allowed moves, and pin down what must always (and eventually) hold.
3. **[Checking the Design Before You Build](03-checking-before-you-build.md)** — let a tool
   explore every reachable state, why that beats testing, and an on-ramp to TLA+.

> This builds on reasoning from [What Logic Actually Is](/guides/what-logic-actually-is), the
> always/there-exists machinery from
> [Predicate Logic and Quantifiers](/guides/predicate-logic-and-quantifiers), and the idea of
> a gap-free argument from [What a Proof Is](/guides/what-a-proof-is).

---

[Phase 1: The Blueprint, Not the Building →](01-the-blueprint-not-the-building.md)
