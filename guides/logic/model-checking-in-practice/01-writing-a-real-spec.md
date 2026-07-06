---
title: "Writing a Real Spec"
guide: "model-checking-in-practice"
phase: 1
summary: "Specify a mutual-exclusion lock completely: state, transitions, a safety property, and a liveness property, in enough detail to actually check."
tags: [logic, model-checking, mutual-exclusion, safety, liveness, formal-methods]
difficulty: advanced
synonyms: ["mutual exclusion spec example", "how to write a TLA+-style spec", "lock specification example", "safety and liveness for a lock", "critical section spec"]
updated: 2026-07-06
---

# Writing a Real Spec

The prerequisite guide specified a turnstile and sketched a money-transfer system. Both stopped
short of a full spec you could hand to a checker - the transfer system listed invariants without
nailing down every transition. This phase closes that gap: one system, specified completely enough
that nothing is left to "we'll figure it out later."

The system: two processes, `P1` and `P2`, sharing one resource - a database connection, a critical
section, whatever. Only one may hold it at a time. This is mutual exclusion, the most-studied
problem in concurrent systems, because almost every lock, mutex, and semaphore you've ever used is
an implementation of it.

## The state

Each process has a **location** - which line of its own logic it's currently at - and there's one
shared variable for who holds the lock.

```text
VARIABLES
  loc[P1], loc[P2]     \* each process's current location
  lock                 \* holder of the lock, or "none"

Locations for each process:
  idle       -- not trying to enter
  waiting    -- wants the lock, hasn't gotten it yet
  critical   -- holds the lock, running its critical section
```

A full state is a snapshot of all three: `(loc[P1], loc[P2], lock)`. With 3 locations per process
and 3 possible lock values (`none`, `P1`, `P2`), the raw grid is 27 combinations - most of them
unreachable, which phase 2 comes back to.

Two processes is the smallest interesting case, and that's deliberate. A spec for "N processes"
reads almost the same on paper but explores a state space that grows with N - phase 2 is where
that growth becomes the whole story. Fix N at 2 for now and get the transition rule exactly right;
generalizing the count is mechanical once the rule is correct.

## The transitions

Each process moves through the same three-step cycle, and the transition rule is what actually
enforces exclusion (or fails to).

```text
For process P (with the other process Q):

  T1_request:  loc[P] = idle  ->  loc[P] = waiting
               (P decides it wants the lock; always enabled)

  T2_acquire:  loc[P] = waiting  AND  lock = none
               ->  loc[P] = critical,  lock = P
               (P may only take the lock if nobody holds it)

  T3_release:  loc[P] = critical
               ->  loc[P] = idle,  lock = none
               (P finishes and gives the lock back)

Init:  loc[P1] = idle,  loc[P2] = idle,  lock = none
```

*What just happened:* `T2_acquire` is the entire mechanism. Its guard - `lock = none` - is a
precondition that must hold before the transition can fire. Take that guard away and you no longer
have a mutual-exclusion protocol, you have two processes racing to overwrite the same variable.
Writing the guard down explicitly is the spec-writing skill: everything about "correctness" here
lives in one line.

Note what's absent: no scheduler, no thread priority, no timing. At each step, *any* process with
an enabled transition may fire - the checker will try every process, every order, every
interleaving, not only the one you'd naturally imagine.

This is a real design choice, not laziness. Real schedulers are complex and vary by OS, language
runtime, and hardware. If the spec baked in a specific scheduling policy, a clean check would only
tell you the protocol is correct *under that policy* - and the moment you deploy on a different
runtime, or a future kernel version changes its scheduling heuristics, the guarantee evaporates.
Assuming an arbitrary, adversarial scheduler is stricter than any real one, so a protocol proven
correct against "anything can happen next" is correct against whatever scheduler you actually get.

## The safety property: mutual exclusion itself

Name the thing that must never happen, precisely:

```text
MutualExclusion ==
  NOT (loc[P1] = critical AND loc[P2] = critical)

  "It is never the case that both processes are in
   their critical section at the same time."
```

This is a one-line invariant, and it's the entire point of the system. Every mutex, database lock,
and distributed lock manager you've used exists to make this true. If a checker ever finds a
reachable state where both locations read `critical`, the lock is broken, full stop - no
disclaimers, no "well it's probably fine in practice."

## The liveness property: nobody waits forever

Safety alone permits a useless protocol: if `T2_acquire` never fires for `P2` at all, `P1` can hog
the lock forever and `MutualExclusion` never breaks. That's safe and worthless. Liveness rules it
out:

```text
LockFreedom ==
  (loc[P1] = waiting) ~> (loc[P1] = critical)
  (loc[P2] = waiting) ~> (loc[P2] = critical)

  "If a process is waiting, it eventually reaches
   its critical section."  (~> reads "leads to")
```

*What just happened:* `~>` is shorthand for "eventually" chained onto a condition - if the
left side ever becomes true, the right side must become true at some later point. This is the
"something good eventually happens" property from the prerequisite guide, made concrete for a lock:
waiting is not the same as starving.

A protocol can satisfy `MutualExclusion` and violate `LockFreedom` at the same time - that
combination is exactly what phase 3 goes looking for, because it's the failure mode nobody tests
for. Nobody writes a unit test titled "assert this thread doesn't wait forever," because a test
that hangs looks like a timeout, not a design flaw.

## Why this is a complete spec

Four ingredients, all present: variables (`loc`, `lock`), an initial state (`idle`/`idle`/`none`),
transitions with explicit guards (`T1`-`T3`), and two properties of different flavors
(`MutualExclusion`, `LockFreedom`). Nothing about *how* `lock` is implemented - no compare-and-swap,
no OS primitive - because the spec doesn't need to know. It only needs the rule that governs when
the lock may change hands. That's the level phase 2 will search exhaustively.

```quiz
[
  {
    "q": "What does the guard `lock = none` on transition T2_acquire actually do?",
    "choices": [
      "It's documentation only, with no effect on behavior",
      "It's the precondition that must hold before P can take the lock - the entire exclusion mechanism",
      "It slows down the process",
      "It only matters for the liveness property"
    ],
    "answer": 1,
    "explain": "The guard is a precondition: the transition is only enabled when it's true. Removing it removes mutual exclusion entirely - both processes could acquire the lock at once."
  },
  {
    "q": "A protocol never lets two processes hold the lock at once, but one process can wait forever while the other repeatedly re-acquires it. What's true?",
    "choices": [
      "The protocol violates MutualExclusion",
      "The protocol satisfies MutualExclusion but violates LockFreedom",
      "The protocol violates both properties",
      "This can't happen if the spec is written correctly"
    ],
    "answer": 1,
    "explain": "Never colliding is safety, intact here. But the waiting process never reaching critical is exactly what LockFreedom (a liveness property) forbids - safety and liveness fail independently."
  },
  {
    "q": "Why does the spec avoid describing how `lock` is implemented (compare-and-swap, OS mutex, etc.)?",
    "choices": [
      "Because implementation details are irrelevant to what's being reasoned about - only the rule governing when the lock changes hands matters",
      "Because TLA+ cannot express implementation details",
      "Because it would make the spec too short",
      "Because compare-and-swap is always correct anyway"
    ],
    "answer": 0,
    "explain": "The spec strips away 'how' on purpose - it keeps the rule that matters (the guard on T2_acquire) and discards the mechanism that enforces it in real code, per the blueprint/building split from the prerequisite guide."
  }
]
```

[Guide overview](_guide.md) · [Phase 2: Exhaustive State-Space Exploration →](02-exhaustive-state-space-exploration.md)
