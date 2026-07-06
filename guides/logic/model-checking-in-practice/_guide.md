---
title: "Model Checking in Practice"
guide: "model-checking-in-practice"
phase: 0
summary: "Write a real spec, understand exhaustive state-space exploration, and see a genuine concurrency bug a model checker catches before code exists."
tags: [logic, model-checking, formal-methods, concurrency, tla, advanced]
category: logic
order: 10
difficulty: advanced
synonyms: ["how does model checking actually work", "state explosion problem", "worked TLA+ example", "concurrency bug model checker catches", "when to use model checking", "mutual exclusion spec example"]
updated: 2026-07-06
---

# Model Checking in Practice

[Formal Methods and Specification](/guides/formal-methods-and-specification) introduced the
mental model: states, transitions, invariants, liveness, and a first look at exhaustive checking.
This guide is the follow-up for someone who read that and wants to actually do it - write a
complete spec for something real, understand what a checker is doing mechanically when it
"explores every state," and watch it catch a genuine concurrency bug.

Read the prerequisite first if you haven't. This picks up exactly where it left off and doesn't
re-explain states, transitions, or the safety/liveness split.

## How to read this

- **Want the full worked spec?** [Phase 1](01-writing-a-real-spec.md) specifies a mutual-exclusion
  lock end to end - state, transitions, a safety property, and a liveness property.
- **Want the mechanics of checking?** [Phase 2](02-exhaustive-state-space-exploration.md) covers
  how a checker actually walks a state graph, and the state explosion problem - honestly.
- **Want to see it catch something real?** [Phase 3](03-a-real-concurrency-bug-caught-before-code.md)
  walks a genuine lost-update race a model checker finds that a human reviewer would not, and where
  model checking still can't save you.

## The phases

1. **[Writing a Real Spec](01-writing-a-real-spec.md)** - a mutual-exclusion lock, specified
   completely: states, transitions, a named safety property, and a named liveness property.
2. **[Exhaustive State-Space Exploration](02-exhaustive-state-space-exploration.md)** - what a
   checker does step by step, why that's fundamentally not testing, and why state explosion is a
   real ceiling you can work around.
3. **[A Real Concurrency Bug, Caught Before Code](03-a-real-concurrency-bug-caught-before-code.md)**
   - a classic lost-update interleaving, the counterexample that finds it, and the honest limits of
   the whole approach.

> Prerequisite: [Formal Methods and Specification](/guides/formal-methods-and-specification) -
> especially its states/transitions/invariants phase
> ([Phase 2](/guides/formal-methods-and-specification/2)) and its checking phase
> ([Phase 3](/guides/formal-methods-and-specification/3)). Also builds on
> [What Logic Actually Is](/guides/what-logic-actually-is) and
> [Predicate Logic and Quantifiers](/guides/predicate-logic-and-quantifiers).

---

[Phase 1: Writing a Real Spec →](01-writing-a-real-spec.md)
