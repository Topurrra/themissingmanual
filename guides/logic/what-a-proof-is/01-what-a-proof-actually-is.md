---
title: "What a Proof Actually Is"
guide: "what-a-proof-is"
phase: 1
summary: "A proof is a gap-free chain of valid steps from things you already accept (axioms, definitions, known facts) to the claim you want to establish. Unlike evidence, a correct proof makes the conclusion certain."
tags: [logic, proof, axioms, certainty]
difficulty: beginner
synonyms: ["what is a proof", "what is an axiom", "proof vs evidence", "why prove things in math", "what makes a proof valid"]
updated: 2026-06-25
---

# What a Proof Actually Is

The word "proof" can feel like a wall — something with a velvet rope in front of
it, open only to people with chalk dust on their sleeves. You hear "prove it" and a
small voice says: *that's not for me.*

Here's the reality. A proof is an ordinary argument — the kind you make when you
explain why the restaurant must be closed, or why the missing ten dollars has to be
in your other coat. The only difference is that a proof has the gaps taken out. Every
place a normal argument says "and so, clearly," a proof stops and fills the space with
a reason no one can refuse.

That's the whole trick. Not genius. Patience about gaps.

## What a proof is

A proof is a chain. It starts from things you already accept and walks, one careful
step at a time, to the claim you want to establish.

The things you start from come in three kinds:

- **Axioms** — starting assumptions everyone in the room has agreed to accept
  without further argument.
- **Definitions** — the agreed meanings of your words. If "even number" means
  "a whole number you can write as two times some whole number," that meaning is
  yours to use, free, whenever you need it.
- **Previously-proven results** — anything already established the same way. Once
  proven, a result is yours to lean on forever; you never re-prove it.

From that bedrock, you take **valid** steps. A step is valid when the truth of
what came before *forces* the truth of what comes next — the conclusion can't be
false if the premises are true. (That word "valid" carries a lot of weight, and it
has a precise meaning; see [what logic actually is](/guides/what-logic-actually-is).)

You keep taking valid steps until you reach your claim. When you do, the claim isn't
*likely* true. It is true, with the same certainty as the bricks you started from —
because each step only ever passed that certainty along.

So the test for a proof is brutally simple, and you can apply it yourself:

> Walk it step by step. At every step, ask: *could someone honestly deny this,
> given everything before it?* If the answer is ever "yes," you have a gap, and
> you don't yet have a proof. If the answer is always "no," you do.

A proof is exactly an argument where the honest answer is always "no."

## Axioms: where the chain is anchored

📝 **Axiom** — a statement accepted as a starting point, without proof, by
agreement. Not because it's been proven (it hasn't), and not because it's beyond
question, but because *we have to start somewhere.* You can't prove everything
from nothing; every chain needs a first link that hangs from open air.

This can feel like cheating. It isn't. Think of axioms as the rules of a game you
and your reader agree to play. "Two points determine a line" is an axiom of one kind
of geometry. Nobody proves it. You agree to it, then see what follows. Change the
axioms and you get a different game with different — but equally valid — conclusions.

Definitions are the other half of your bedrock. An axiom says *what is true to
start with*; a definition says *what your words mean*. Both are accepted, not
proven. Everything else in the chain has to earn its place.

💡 If an argument ever feels circular or bottomless — "but why is *that* true?"
forever — you've usually hit the place where someone forgot to name their axioms.
Name them, and the bottom appears.

## Proof vs evidence

This distinction changes how you see almost everything, so slow down here.

**Evidence** makes a claim *more believable*. You test, you observe, you collect
examples, and your confidence goes up. This is how science, courts, and daily life
work, and it is enormously powerful. But evidence reasons from particular cases
toward a general pattern — that direction is called **inductive** — and it can never
reach certainty. There is always one more case you haven't checked.

**A proof** makes a claim *certain*. It reasons from general accepted truths down
to the specific conclusion — that direction is called **deductive** — and when
every step is valid, the conclusion is locked. Not 99.9% likely. Locked.

Here is the asymmetry that makes the whole thing sharp. Consider a claim of the
form *"every X has property P"* (logicians call this a universal claim; you can
read more in [predicate logic and quantifiers](/guides/predicate-logic-and-quantifiers)):

```text
Claim:  "Every even number greater than 2 is the sum of two primes."

Evidence FOR it:
   4 = 2 + 2
   6 = 3 + 3
   8 = 3 + 5
   ... checked for billions of numbers, all work.

Does this PROVE it?   No.
   It supports it. The very next number could be the one that fails.
   No pile of confirming examples — however huge — proves a universal claim.

A single COUNTEREXAMPLE, on the other hand:
   one even number that is NOT a sum of two primes
   would destroy the claim instantly and forever.
```

(That example is real — it's an unsolved problem. Billions of confirming cases,
still not a proof.)

Read that box twice. Examples can only *support* a "for all" claim; they can never
finish it. But one counterexample *settles* it — in the negative. That's why
mathematicians hunt counterexamples so eagerly: a single one does what infinite
examples cannot.

## For builders

You already live with this distinction every day. You call it something else.

A **passing test** is evidence. A test runs your code on *particular* inputs and
checks the output for those inputs. That's induction: "it worked on the cases I
tried." A green test suite raises your confidence — and it should — but it checks a
finite handful of the (often infinite) inputs your code might see.

A **proof** about your code — the kind you do informally when you reason "this loop
can't go out of bounds because `i` is always less than `len`" — guarantees *all*
inputs at once, by argument rather than by trial.

```text
Test:   add(2, 3) == 5     ✓   (one case, checked)
        add(0, 0) == 0     ✓   (one case, checked)
        add(-1, 1) == 0    ✓   (one case, checked)
        => evidence that add works. Not a guarantee.

Proof:  an argument that add(a, b) == a + b for EVERY a and b
        => a guarantee, covering inputs you never typed.
```

This is the exact reason "the tests pass" is not the same as "the code is correct."
Tests sample reality; proofs cover it. Most of the time sampling is all you can
afford, and that's fine — but knowing *which* kind of certainty you have keeps you
honest about what could still break.

⚠️ **The gotcha that catches everyone.** "It works on the cases I tried" is not
"it works always." A handful of green checks, a few hand-traced examples, a demo
that didn't crash — these are evidence, not proof. The moment you say "so it always
works" on the strength of examples alone, you've quietly swapped support for
certainty, and the bug you ship will be in the case you never tried.

🪖 When examples make you feel sure, name it out loud: *"I have strong evidence,
not a proof."* That one sentence has saved more shipped code than any linter.

## Recap

- A **proof** is a gap-free chain of **valid** steps from accepted truths to a
  claim. Every step must be one no honest reader could deny.
- The accepted truths are **axioms** (agreed starting assumptions), **definitions**
  (agreed meanings), and **previously-proven results**.
- A correct proof gives **certainty** (deductive reasoning). **Evidence** —
  examples, tests, observations — gives **support** (inductive reasoning), never
  certainty.
- No pile of examples proves a "for all" claim; a single **counterexample**
  disproves one.
- For builders: passing tests are evidence (particular cases); a proof guarantees
  all inputs. That's why "tests pass" ≠ "code is correct."

A quick check before you move on:

```quiz
[
  {
    "q": "Which best describes what a proof is?",
    "choices": [
      "A gap-free chain of valid steps from accepted truths to the claim",
      "A large collection of examples that all confirm the claim",
      "An expert vouching that the claim is true",
      "A claim that has never been shown to be false"
    ],
    "answer": 0,
    "explain": "A proof links accepted truths to the conclusion through steps no one can deny. Examples and authority can support a claim, but they aren't proofs."
  },
  {
    "q": "You've tested a function on a thousand inputs and they all pass. What have you got?",
    "choices": [
      "A proof that the function is correct for all inputs",
      "Strong evidence, but not certainty that it works for every input",
      "Nothing useful, since tests never tell you anything",
      "A counterexample to the function's correctness"
    ],
    "answer": 1,
    "explain": "Tests check particular cases (induction): they raise confidence but can't cover every possible input. Only an argument covering all inputs would make it certain."
  },
  {
    "q": "What is an axiom?",
    "choices": [
      "A statement proven from simpler statements",
      "A claim supported by many examples",
      "A starting assumption accepted without proof, by agreement",
      "A claim that turned out to be false"
    ],
    "answer": 2,
    "explain": "An axiom is a starting point accepted without proof. You can't prove everything from nothing, so every chain of reasoning needs agreed first links."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: The Main Proof Techniques →](02-the-main-proof-techniques.md)
