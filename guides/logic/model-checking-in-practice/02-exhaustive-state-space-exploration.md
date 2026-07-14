---
title: "Exhaustive State-Space Exploration"
guide: "model-checking-in-practice"
phase: 2
summary: "How a model checker actually walks a state graph, why that's fundamentally different from testing, and why state explosion is a real ceiling you work around rather than ignore."
tags: [logic, model-checking, state-explosion, breadth-first-search, formal-methods]
difficulty: advanced
synonyms: ["state explosion problem", "how does a model checker work internally", "why model checking doesn't scale", "exhaustive search vs testing", "breadth first search state space"]
updated: 2026-07-06
---

# Exhaustive State-Space Exploration

You have a complete spec from phase 1. Now: what does a checker actually *do* with it? Not the
one-sentence version from the prerequisite guide - the mechanism, concretely, including the part
where it stops scaling and why that's an acceptable trade rather than a fatal flaw.

## The algorithm is almost embarrassingly simple

A model checker runs a breadth-first search over the state graph. That's the whole trick:

```text
1. Put the initial state in a queue. Mark it "seen."
2. Take a state off the queue.
3. For each transition that's enabled in this state:
     a. Compute the resulting state.
     b. Check every invariant against it. If one fails, STOP and report
        the path from INIT to here (the counterexample).
     c. If this resulting state hasn't been "seen" before, mark it seen
        and add it to the queue.
4. If the queue is empty, every reachable state has been visited
   and every invariant held everywhere. Done.
```

Apply this to the lock spec from phase 1. `INIT` is `(idle, idle, none)`. Two transitions are
enabled - `T1_request` for `P1` or for `P2` - so the search branches into two states,
`(waiting, idle, none)` and `(idle, waiting, none)`. Each of those branches again. The graph fans
out exactly as far as the transitions allow, and the checker visits every node in it exactly once.

There's no cleverness about *which* interleaving matters. It doesn't reason about "the tricky
case" - it has no notion of tricky. It enumerates. That's the entire source of its power: your
intuition prunes the search space based on what seems plausible, and the plausible-looking branches
are rarely where the bug hides.

## This is not testing with more steps

Testing samples. You write a scenario - `P1` requests, `P2` requests, `P1` acquires, `P1` releases,
`P2` acquires - run it once, and it either matches expectations or it doesn't. Add ten more
scenarios and you've sampled eleven paths through a graph that might contain thousands.

A checker doesn't pick paths. It computes the entire reachable set. For the two-process lock, "the
entire reachable set" is small enough to write out - roughly a dozen states, once you exclude the
27-combination raw grid's unreachable entries (you can never have `lock = P1` while `loc[P1] = idle`,
for instance; nothing produces that combination). The checker doesn't know that shortcut in advance.
It discovers it by trying every transition from every state it finds and never generating the
unreachable ones in the first place.

The guarantee that falls out of this is categorically different from a test suite's guarantee. "All
eleven tests pass" means eleven paths are fine. "Model checking completed" means *every* path is
fine - there is no twelfth path you forgot to write, because the search doesn't work by you writing
paths.

## The state explosion problem

Here's the catch. The lock example has two processes and three locations each. Bump it to
five processes and the raw combinations jump from 27 (3 x 3 x 3 lock values) to roughly 3 x (3^5)
location combinations - already over 700, and that's before counting the unreachable ones out. Add
a counter that can hold values 0 to 99, and multiply again. State spaces grow **multiplicatively**
with every extra variable and **combinatorially** with every extra concurrent process, because the
checker has to consider every process at every possible location relative to every other process.

This is not a tooling limitation that better engineering fixes. It's inherent to what exhaustive
search means. A real distributed system - a consensus protocol with a dozen nodes, message queues,
retries, timeouts - has a state space that dwarfs the number of atoms worth counting. No amount of
RAM or clever indexing makes "visit literally every one" tractable at that scale.

Model checkers fight back with real techniques - symmetry reduction (treating identical processes as
interchangeable so you don't re-explore the same shape relabeled), partial-order reduction (skipping
interleavings that provably can't affect the outcome), and abstraction (replacing "a counter from 0
to 99" with "zero, one, many" when the exact number doesn't matter to the property). These push the
ceiling up. They don't remove it.

## Why this is fine

The instinct here is to conclude model checking "doesn't scale" and shelve it. That's the wrong
lesson. You don't model-check your whole application - you never did, and nobody who uses this well
tries to. You model-check the one dangerous piece: the lock, the consensus core, the payment state
machine, the two functions where a race would actually hurt. That component's state space, bounded
to a handful of participants, is exactly the size the algorithm above handles in seconds.

The lock spec from phase 1, checked with two processes, isn't a toy because it's small - it's small
*because that's the right scope*. The two-process case already contains every interleaving pattern
the protocol's logic can produce; a twentieth process doesn't add a new *kind* of bug, it adds more
copies of the same kinds you'd already catch at two or three. Engineers who use model checking
professionally bound their models on purpose - "up to 4 nodes," "up to 3 in-flight requests" - and
treat a clean result at that bound as strong evidence about the design, not a claim about every
deployment size on earth.

```quiz
[
  {
    "q": "What search algorithm does a model checker use to explore the state space?",
    "choices": [
      "It randomly samples states, like fuzzing",
      "Breadth-first search: visit the initial state, then every state reachable in one step, then two steps, and so on",
      "It asks the developer which states to check",
      "Depth-first search down a single chosen path"
    ],
    "answer": 1,
    "explain": "The checker does breadth-first search from the initial state, checking invariants at every newly discovered state, until the queue of unvisited states is empty."
  },
  {
    "q": "Why does adding more concurrent processes make the state space grow so fast?",
    "choices": [
      "It doesn't - state space size is independent of process count",
      "Because the checker has to consider every process at every possible location relative to every other process, which multiplies combinations",
      "Because more processes means more code to compile",
      "Because the checker re-runs the entire search once per process"
    ],
    "answer": 1,
    "explain": "Each added process multiplies the number of location combinations, so the state space grows combinatorially with concurrency - this is the state explosion problem."
  },
  {
    "q": "Why is state explosion not a reason to abandon model checking?",
    "choices": [
      "Because RAM is cheap enough to brute-force any state space eventually",
      "Because you bound the model to the one risky component (a lock, a protocol core) rather than the whole system, and that's usually small enough to check completely",
      "Because state explosion only affects languages other than TLA+",
      "Because testing has the same limitation, so it doesn't matter"
    ],
    "answer": 1,
    "explain": "Practitioners scope model checking to the dangerous, concurrency-heavy component and bound the model (e.g. up to N processes), which keeps the space checkable while still catching the interleaving bugs that matter."
  }
]
```

[← Phase 1: Writing a Real Spec](01-writing-a-real-spec.md) · [Guide overview](_guide.md) · [Phase 3: A Real Concurrency Bug, Caught Before Code →](03-a-real-concurrency-bug-caught-before-code.md)
