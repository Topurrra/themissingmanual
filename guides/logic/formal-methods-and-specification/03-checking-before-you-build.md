---
title: "Checking the Design Before You Build"
guide: "formal-methods-and-specification"
phase: 3
summary: "A model checker explores every reachable state of your spec and reports any that break an invariant — finding design bugs before code exists, with TLA+ as the on-ramp."
tags: [logic, model-checking, tla, formal-methods, verification]
difficulty: intermediate
synonyms: ["what is model checking", "TLA+ for beginners", "how to check a spec", "find design bugs before coding", "exhaustive state exploration", "counterexample trace"]
updated: 2026-06-30
---

# Checking the Design Before You Build

So you've done the work of Phase 2: your system is written as states, transitions, and the
invariants that must hold. Now comes the payoff that makes the whole effort worth it. Because the
spec is precise and finite-shaped, a *tool* can do something you never could by hand — visit every
single state the design can reach and check your invariant in each one. Not a sample. Every one.
This is **model checking**, and the first time it hands you a bug you'd never have imagined, the
value of "specify first" stops being theoretical.

## Why exhaustive beats clever

When you reason about concurrency in your head, you trace a few orderings — the obvious one, maybe
the nasty one a colleague mentioned — and conclude "looks fine." The trouble is the number of
orderings explodes. Three operations across two threads already have more interleavings than you'll
patiently enumerate, and the bug always lives in the interleaving you skipped because it seemed
absurd.

A model checker doesn't get bored and doesn't assume anything is absurd. It starts from your initial
state and mechanically explores:

```text
        INIT
       /  |  \           each arrow = an allowed transition
      A   B   C          each node  = a reachable state
     /|   |   |\
    D E   F   G H        the checker visits ALL of them
    |     |     |
    ...   X     ...      X = a state where an invariant is FALSE
```

*What just happened:* the checker walks the entire reachable graph from `INIT`, applying every
enabled transition, and tests each invariant at every node. If it ever reaches a state like `X`
where an invariant is false, it stops and shows you exactly how it got there. You didn't have to
think of the path to `X` — that's the point. The machine found the case your imagination filtered
out.

## The counterexample is the gift

Here's the part engineers fall in love with. When a model checker finds a violated invariant, it
doesn't merely say "failed." It hands you a **counterexample trace**: the precise sequence of
transitions, step by step, from the start to the broken state.

```text
INVARIANT VIOLATED:  INV1 (total balance == constant)

Counterexample trace:
  Step 0  INIT       A=100  B=100   total=200  OK
  Step 1  A starts transfer of 50 to B
                     A=50   B=100   total=150  <- money in flight
  Step 2  B reads its balance for ITS OWN transfer
                     A=50   B=100
  Step 3  first transfer completes
                     A=50   B=150   total=200  OK so far...
  Step 4  B's transfer (based on stale read) completes
                     A=50   B=120   total=170  <- INV1 BROKEN
```

*What just happened:* this is a textbook lost-update / race condition, and the checker reconstructed
the exact interleaving that triggers it — a stale read in step 2 that the obvious mental model never
considers. A counterexample is worth more than a red "FAIL," because it's a recipe: follow these
steps and you reproduce the bug every time. It turns "something's wrong somewhere" into "here, line
by line."

This is the connection back to proof. In [what a proof is](/guides/what-a-proof-is) you saw that one
counterexample disproves a universal claim. Your invariant *is* a universal claim — "in all reachable
states, money is conserved." The model checker's job is to search for the single counterexample that
disproves it. Find one, the design is broken. Find none after exhausting the space, and you have
something close to a proof that the property holds for your model.

## A gentle look at TLA+

The most established tool for this is **TLA+** — Lamport's specification language — with its model
checker **TLC**. You don't need to learn it today; the goal here is to recognize it and see that it's
the same ideas you already have, written in a precise notation.

A TLA+ spec is, almost literally, the four-part skeleton from Phase 2: variables, an initial-state
predicate, a next-state relation (the transitions), and the properties. Stripped to its essence, a
toy counter looks like this:

```text
VARIABLES x                      \* the state

Init == x = 0                    \* allowed starting state

Next == x' = x + 1               \* the transition: x' is x's next value

Invariant == x >= 0              \* must hold in every reachable state
```

*What just happened:* `Init` says we start at zero. `Next` describes how the state changes — the
prime mark `x'` means "the value of x in the next state," so this reads "next x is current x plus
one." `Invariant` is the always-true property. Feed this to TLC and it explores the reachable states
and confirms (or refutes) the invariant. It's the turnstile and the transfer system from Phase 2,
in the notation a checker can run.

> The lesson isn't the syntax — it's that TLA+ is nothing more than the states-transitions-invariants
> mental model written down formally. If you understood Phase 2, you already understand what a TLA+
> spec *is*; learning the tool is learning where the brackets go.

## What checking can and can't promise

Be honest about the boundaries, because overselling this is how people get burned.

A model checker verifies your **model**, not your code. If your spec says transfers are atomic but
your real code isn't, the checker happily blesses a design your implementation doesn't honor. The
spec catches *design* bugs; you still need tests and reviews for the gap between blueprint and
building.

And exhaustive exploration has a ceiling. If the state space is astronomically large (or infinite),
the checker can't visit all of it in finite time — you bound the model (say, "up to 4 accounts, up to
3 concurrent transfers") and check that. A clean run over a bounded model isn't a universal proof; it's
overwhelming evidence within the bounds you chose. For full mathematical certainty you reach for
theorem proving, which is heavier and rarer. For most engineers, bounded model checking is the
sweet spot: a few hours of effort, design bugs found that would've cost a production incident.

## The whole arc, in one breath

Step back and look at what you've assembled.

A **spec is a blueprint, not the building** — you write down what must be true, separate from the
code (Phase 1). You express that blueprint as **states, transitions, and properties** — invariants
for *always*, liveness for *eventually* (Phase 2). Then a **model checker explores every reachable
state** and hands you a counterexample the moment a property breaks, before any code exists (Phase 3).

That's the loop real teams use to catch fatal bugs in distributed systems on a laptop, in an
afternoon, instead of in production a year later. You don't have to formalize everything you ever
build. But the next time you're designing something where order, concurrency, or failure can bite —
the situations tests structurally can't cover — you now have a sharper move than "code it carefully and
hope." Write the blueprint. Name what must always be true. Then check the design before you build it.

## For builders

A pragmatic starting point: don't try to spec your whole service. Pick the one gnarly part — the
distributed lock, the state machine with the tricky cancel path, the retry logic — and model only
that. Write its states, its transitions, and the single invariant that would ruin your week if it
broke. Even sketching it on paper sharpens the design; running it through TLC turns the sketch into a
checked guarantee. Small, targeted specs of the scary 5% deliver almost all the value.

```quiz
[
  {
    "q": "What does a model checker do that hand-reasoning about concurrency cannot?",
    "choices": [
      "It writes the implementation code for you",
      "It exhaustively visits every reachable state and checks your invariants in each one",
      "It guarantees your production code is bug-free",
      "It speeds up the running program"
    ],
    "answer": 1,
    "explain": "A model checker explores the entire reachable state space — including the interleavings you'd never think to trace — and tests each invariant at every state."
  },
  {
    "q": "When a model checker finds a violated invariant, what is the most useful thing it gives you?",
    "choices": [
      "A single 'FAILED' message",
      "A faster version of the spec",
      "A counterexample trace: the exact step-by-step path to the broken state",
      "A list of all passing tests"
    ],
    "answer": 2,
    "explain": "The counterexample trace is a reproduction recipe — the precise sequence of transitions that reaches the bad state, turning 'something's wrong' into a line-by-line path."
  },
  {
    "q": "What is an honest limitation of model checking a bounded spec?",
    "choices": [
      "It checks the model, not your actual code, and only within the bounds you set",
      "It can never find any bugs",
      "It replaces the need for tests entirely",
      "It only works on programs written in TLA+"
    ],
    "answer": 0,
    "explain": "A checker verifies the design model, not the implementation, and a clean run over a bounded model is strong evidence within those bounds — not a universal proof. Tests still cover the code."
  }
]
```

[← Phase 2: States, Transitions, and Invariants](02-states-transitions-invariants.md) · [Guide overview](_guide.md)
