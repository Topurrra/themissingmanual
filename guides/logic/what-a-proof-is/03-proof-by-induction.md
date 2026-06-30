---
title: "Proof by Induction"
guide: "what-a-proof-is"
phase: 3
summary: "Induction proves a statement for all natural numbers with two steps: show it holds for the first case, then show that if it holds for one case it holds for the next. Like dominoes — knock the first, and the rule topples the rest."
tags: [logic, induction, recursion, proof]
difficulty: beginner
synonyms: ["proof by induction", "mathematical induction", "base case inductive step", "induction and recursion", "domino principle proof"]
updated: 2026-06-25
---

# Proof by Induction

One kind of claim should make you nervous: a claim about *all* natural numbers.
"This formula works for every n." Every n? There are infinitely many. You can't
check them one by one — you'd never finish. So how could anyone prove something true
for an infinite list of cases?

Induction is the answer, and it does the whole infinite job with a small, finite
amount of work. Once you see the trick, it stops feeling like a trick and starts
feeling like the most natural thing in the world.

## The domino metaphor

Picture a long line of dominoes, stretching off as far as you can see. You want to
know: will *all* of them fall?

You don't need to push each one. You need exactly two things to be true.

First, the **first domino falls**. Someone tips it over. The chain has to start
somewhere.

Second, the dominoes are **spaced so that each one knocks over the next**. Anywhere
in the line, if a domino falls, the one after it falls too.

If both hold, then *all* the dominoes fall — and you know it without watching. The
first falls, so the second falls. The second falls, so the third falls. The rule
carries you down the entire line, forever.

That's induction. Two facts, one about the start and one about the *step*, and
between them they cover infinitely many cases.

## The formal shape

Suppose you have a statement `P(n)` — some claim that depends on a natural number n.
You want to prove `P(n)` is true for *every* natural number n.

Induction says: do exactly two things.

**Base case.** Prove `P(1)`. (Sometimes you start at `P(0)` instead — whichever is
the first number you care about.) This is tipping the first domino.

**Inductive step.** Prove that *if* `P(k)` is true, *then* `P(k+1)` is true. You
assume `P(k)` holds for some unspecified k — this assumption is the **inductive
hypothesis** — and from it you derive `P(k+1)`. This is the spacing between dominoes:
each case knocks over the next.

Put those two together and you've proved `P(n)` for all n. The base case starts the
chain; the inductive step propagates it forever.

Notice what the inductive step really is: an implication, `P(k) → P(k+1)`. That's the
same conditional you met in [propositional logic](/guides/propositional-logic).
Induction is built from logical tools you already have — it only aims them at infinity.

## A worked example

The classic first proof. The sum of the numbers from 1 up to n has a tidy closed
form:

`1 + 2 + 3 + ... + n = n(n+1)/2`

Call that claim `P(n)` and prove it for all n by induction.

```text
Claim P(n):  1 + 2 + ... + n = n(n+1)/2

--- Base case: n = 1 ---
Left side:   1
Right side:  1(1+1)/2 = 1*2/2 = 1
Both sides equal 1, so P(1) is true.

--- Inductive step: assume P(k), prove P(k+1) ---
Inductive hypothesis (assume true):
    1 + 2 + ... + k = k(k+1)/2

We want to show P(k+1):
    1 + 2 + ... + k + (k+1) = (k+1)(k+2)/2

Start from the left side of P(k+1):
    (1 + 2 + ... + k) + (k+1)

Replace the part in parentheses using the hypothesis:
    = k(k+1)/2 + (k+1)

Put both terms over a common denominator:
    = k(k+1)/2 + 2(k+1)/2
    = [k(k+1) + 2(k+1)] / 2

Factor out (k+1):
    = (k+1)(k+2) / 2

That is exactly the right side of P(k+1). So P(k) implies P(k+1).

--- Conclusion ---
Base case holds, and each case implies the next.
Therefore P(n) holds for every natural number n.
```

Read the inductive step again slowly — it's where the whole idea lives. We never
proved the formula for `k+1` from scratch. We *borrowed* the result for `k` — that's
the inductive hypothesis — and only added one more term. The hard part was already
done for us, by us, one step earlier.

## Why it's valid

Here's the part that feels uncomfortable at first: in the inductive step, you assume
the very kind of thing you're trying to prove. Isn't that circular?

It isn't, and the domino picture shows why. You're not assuming `P(k)` is true for
all k. You're proving a *connection*: "wherever the chain has reached, it reaches one
further." That connection is a single, reusable rule. The base case then proves the
chain has actually started. Combine "it started" with "it always continues" and you
get "it reaches everywhere" — no circularity, only a rule applied over and over.

This is the deep payoff. The inductive step is proved *once*, in general, for an
arbitrary k. But because k stands for any number, that one proof does the work of
infinitely many. You establish infinitely many cases with finite effort, because you
found the *pattern* that links each case to the next instead of grinding through them
individually. Finite work, infinite reach.

## For builders

If you write code, you already think this way — under a different name.

Induction is the exact shape of **recursion**. A recursive function has a **base
case** (the input small enough to answer directly) and a **recursive case** (reduce
the problem to a slightly smaller one and trust the function to handle that). Sound
familiar? Base case plus a step that reaches the next case down.

```text
function sumTo(n):
    if n == 1:              <- base case
        return 1
    else:
        return n + sumTo(n - 1)   <- step: reduce to a smaller case
```

When you reason about whether a recursive function is *correct*, you're doing an
induction proof, named or not. You check the base case returns the right answer. Then
you assume the recursive call on the smaller input is correct (the inductive
hypothesis), and check the function builds the right answer on top of it. If both
hold, the function is correct for all inputs — because the dominoes fall.

So induction isn't an exotic math ritual. It's the same trust you place in a
recursive call, made explicit.

## ⚠️ You need both parts

The most common way to wreck an induction proof is to skip the base case.

It's tempting, because the inductive step often feels like the clever, satisfying
part. But without a base case, nothing anchors the chain. You can prove "each domino
knocks over the next" perfectly — and if no domino ever gets tipped over, *not a
single one falls*. The implications are all true and completely useless, because
they're never triggered.

You can even "prove" outright false statements this way if you drop the base case.
The base case isn't a formality to rush past. It's the thing that turns an endless
chain of *ifs* into actual truth.

The other failure is a broken step: an inductive step that quietly assumes something
extra, or works for some k and not others. The step has to hold for *every* k, with
nothing borrowed except the hypothesis itself.

## Where this leaves you

You've now seen the three pillars of this guide. You know
[what a proof actually is](01-what-a-proof-actually-is.md) — an argument that forces a
conclusion. You know
[the main techniques](02-the-main-proof-techniques.md) — direct proof, contradiction,
contrapositive. And now you have induction: the tool for taming infinity, two steps
that topple an endless line of cases.

That's a real foundation. You can read a proof and follow why each line is forced,
and you have a vocabulary for the moves people make to get there.

One more skill rounds it out, and it points the other direction. So far you've
studied how arguments go *right*. The natural companion is learning how they go
*wrong* — the recurring patterns of bad reasoning that look convincing until you name
them. Spotting fallacies lets you sit through a confident-sounding argument and put
your finger on exactly where it cheats. If proof is how you build trust in a
conclusion, fallacy-spotting is how you withhold it when it hasn't been earned.
That's the last Logic foundation, and it's where the whole toolkit starts paying off
in everyday life.

## Open-ended exercise

Prove by induction that the sum of the first `n` natural numbers is `n(n+1)/2`. Write
out the base case (n = 1) and the inductive step (assume true for n, prove for n+1).
The structure is identical to a recursive function that builds on a smaller input — see
the connection?

A quick check before you go:

```quiz
[
  {
    "q": "What are the two parts every induction proof needs?",
    "choices": [
      "A base case and an inductive step",
      "A hypothesis and a conclusion",
      "A contradiction and a contrapositive",
      "An example and a counterexample"
    ],
    "answer": 0,
    "explain": "You prove the first case (base case), then prove that any case implies the next (inductive step). Together they cover all natural numbers."
  },
  {
    "q": "In the domino picture, what does the base case correspond to?",
    "choices": [
      "Spacing the dominoes so each knocks over the next",
      "Tipping over the very first domino",
      "Counting how many dominoes there are",
      "Checking that the last domino falls"
    ],
    "answer": 1,
    "explain": "The base case starts the chain — it tips the first domino. Without it, the 'each knocks over the next' rule is true but never triggered, so nothing falls."
  },
  {
    "q": "Why do programmers already understand induction?",
    "choices": [
      "Because every loop runs a fixed number of times",
      "Because induction is only used in mathematics, not code",
      "Because recursion has the same shape: a base case plus a step that reduces to the next case",
      "Because compilers prove programs correct automatically"
    ],
    "answer": 2,
    "explain": "Reasoning that a recursive function is correct IS an induction proof: the base case answers directly, and you assume the smaller recursive call is correct (the inductive hypothesis) to show the whole call is."
  }
]
```

[← Phase 2: The Main Proof Techniques](02-the-main-proof-techniques.md) · [Guide overview](_guide.md)
