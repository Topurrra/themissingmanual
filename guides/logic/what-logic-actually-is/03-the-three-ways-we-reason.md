---
title: "The Three Ways We Reason"
guide: "what-logic-actually-is"
phase: 3
summary: "Deduction guarantees, induction generalizes, abduction guesses the best explanation. Knowing which of the three you're using — and where each fails — is the core of reasoning well."
tags: [logic, deduction, induction, abduction, reasoning]
difficulty: beginner
synonyms: ["deduction vs induction vs abduction", "what is deductive reasoning", "what is inductive reasoning", "what is abduction", "types of reasoning"]
updated: 2026-06-25
---

# The Three Ways We Reason

## You already run three engines

You switch between three completely different kinds of reasoning every day, usually
without noticing the gear change.

When you work out that you must be late because the meeting is at three and it's
already 2:55, that's one engine. When you decide your favorite coffee shop is
reliable because it's been good every morning this month, that's a second. When you
see your code crashed and think "the database connection probably dropped," that's a
third.

They feel similar from the inside — they all feel like "thinking." But they give you
very different things, and they fail in very different ways. Most muddled arguments
come from using one engine while believing you're using another: treating a good
guess as a proof, or treating a pile of examples as a guarantee.

The three engines are **deduction**, **induction**, and **abduction**. Once you can
name which one you're using, you can ask the right question about it — and that
question is the whole game.

## Deduction — from rules to a guarantee

Deduction goes from general rules down to a specific conclusion that is **locked
in**. If the premises are true and the argument is valid, the conclusion *cannot* be
false. No wiggle room, no probability, no "most likely." It's certainty or nothing.

```text
Premise 1:  All prime numbers greater than 2 are odd.
Premise 2:  17 is a prime number greater than 2.
Conclusion: Therefore, 17 is odd.
```

You don't need to go check whether 17 is odd. The conclusion was already sealed
inside the premises the moment you accepted them. That's the signature of deduction:
the conclusion adds no new information about the world — it only makes explicit
something the premises already contained.

This connects straight back to Phase 2. A deductive argument is **valid** when true
premises force a true conclusion, and **sound** when it's valid *and* the premises
are actually true. Deduction is the machinery that turns validity into certainty.

📝 **The strength:** certainty. Nothing else on this page can promise that. A correct
math proof is true forever.

⚠️ **The limit, and it's a real one:** deduction only rearranges what you already
put in. It discovers nothing genuinely new about the world. And it's only as
trustworthy as its premises — feed it a false premise and it will hand you a false
conclusion with total confidence, because validity says nothing about whether the
premises are true.

**For builders:** a type checker is pure deduction. Given the rules of the type
system and the types in your code, it deduces — with certainty — that you cannot pass
a string where an integer is required. It doesn't *guess*. It proves, within its
rules. A mathematical proof of an algorithm's correctness is the same engine, run by
hand.

## Induction — from examples to a probable rule

Induction runs the other direction: from specific observations *up* to a general or
probable conclusion. It's how you learn from experience.

```text
Observation: The sun has risen every morning for all of recorded history.
Conclusion:  Therefore, the sun will rise tomorrow.
```

That's an excellent conclusion. You'd be foolish to bet against it. But notice what
kind of "excellent" it is — it's **probable**, never certain. Nothing about the past
*forces* the future. The conclusion contains more than the premises gave you, which
is exactly why induction can teach you new things — and exactly why it can never
guarantee them.

💡 The honest summary of induction: it can be overwhelmingly well-supported and still
be wrong. One genuine counterexample — a single black swan after a lifetime of white
ones — breaks a universal claim no matter how many confirming cases came before it.

🪖 There's a famous illustration called the **turkey problem**. A turkey is fed every
single morning. Day after day, the evidence mounts: humans are generous, life is
good, the feeding is reliable. By every inductive measure the turkey has ever seen,
tomorrow will bring more food. Then comes the morning before Thanksgiving. The
turkey's reasoning wasn't sloppy — it was the *best possible* induction on the data
available. The data was incomplete in a way the turkey couldn't see. That's the
permanent risk of induction: you only ever have the observations you've had so far.

**For builders:** your test suite is induction, and this matters more than it sounds.
When your tests pass, you have *evidence* that the code works — strong, valuable
evidence. But passing tests are inductive **evidence**, not deductive **proof**.
You've checked specific cases; you have not shown the code is correct for every
possible input. This is the precise reason a green test suite can sit on top of a
real bug: the failing input was a black swan you never wrote a test for. Phase 2's
gap between "valid" and "true premises" shows up here as the gap between "tests pass"
and "code is correct."

## Abduction — from a clue to the best explanation

Abduction is inference to the *best explanation*. You start with something you
observe and reason backward to the most plausible cause.

```text
Observation:  The grass is wet this morning.
Best guess:   It probably rained last night.
```

But notice — a sprinkler could have run. A pipe could have burst. The dog could have
knocked over a bucket. Rain is the *best available* explanation given what you know,
which is not the same as the *only* explanation, and certainly not a *proven* one.

This is the engine doctors use to diagnose: symptoms come in, and they reason to the
most likely underlying condition. It's also, almost exactly, how you debug.

**For builders:** debugging is abduction in its purest form. You have a symptom — a
crash, a wrong number, a hung request — and you reason backward to the most likely
cause. "The page is blank, so the API call probably failed." That's a hypothesis,
the best one given the clue. Good debuggers know it's a hypothesis: they go *verify*
it before acting on it, because abduction's signature failure is mistaking "best
explanation I thought of" for "the correct explanation."

⚠️ **The limit:** abduction is only as good as the set of explanations you
considered. If the real cause never crossed your mind, your "best" explanation is the
best of a bad list. The wet grass really was the sprinkler, and you walked outside
without an umbrella.

## The three side by side

Here's the whole map on one screen. The right-hand column is the one to memorize —
knowing *where each fails* is what keeps you from misusing it.

| Engine | Direction of reasoning | What it gives you | Where it fails |
|---|---|---|---|
| **Deduction** | General rules → specific conclusion | Certainty, if premises are true and the argument is valid | Adds no new knowledge; garbage premises → garbage conclusion |
| **Induction** | Specific observations → general/probable rule | New knowledge from experience; probability | Never certain; one counterexample (a black swan) can break it |
| **Abduction** | Observation → most likely cause | The most plausible hypothesis to test | "Best" isn't "only" or "correct," especially if you missed an explanation |

## A grounded note on AI

A large language model is, at its core, an extraordinarily capable pattern-matcher
trained to produce the most plausible-*sounding* continuation of text. That makes it,
in effect, an abduction engine running at high speed: given your question, it
generates the best-sounding explanation or answer. The catch is the same catch
abduction always has — the "best-sounding" answer is not guaranteed to be the
*correct* one, and the model produces it with the same fluent confidence either way.

That's why a model's answer can read as authoritative and still be wrong. It's
abduction without the verification step that a good debugger or doctor insists on.
The fix isn't to distrust the tool — it's to supply the missing step yourself: check
the claim, run the code, read the source. You'd do the same with any other
best-guess.

## The three engines, as a set

Step back and you have the toolkit. **Deduction** gives you certainty but no new
knowledge. **Induction** gives you new knowledge from the world but never certainty.
**Abduction** gives you the best explanation to investigate but no promise it's
right. Each is powerful in its lane and dangerous when borrowed into another's.

Logic is what gives you the rules for using each one well — when a deduction is
valid, when an induction is well-supported, when an abduction has earned the right to
be acted on. That study is what makes math feel less like a wall and more like a set
of tools, which is the whole spirit of [why math isn't your enemy](/guides/why-math-isnt-your-enemy).

From here, the Logic track gets concrete. You'll meet **propositional logic and
truth tables** — the exact machinery for combining true-and-false statements with
*and*, *or*, and *not*. You'll work through **if-then** reasoning, which trips up more
people than any other shape. You'll pick up **quantifiers** for talking about *all*
and *some* without ambiguity, learn what a real **proof** looks like step by step,
and train your eye to **spot fallacies** — the arguments that feel valid but aren't.
The three engines are the *what*. The rest of the track is the *how*.

Quick gut-check before you go — for each scenario, name the engine.

```quiz
[
  {
    "q": "A type checker reports: every value passed to this function is declared an integer, and the function only accepts integers, so this call is type-safe. Which engine is this?",
    "choices": ["Deduction", "Induction", "Abduction", "None of these"],
    "answer": 0,
    "explain": "It moves from general rules (the type system) to a conclusion that is locked in given those rules. True premises plus a valid argument force the conclusion — that's deduction."
  },
  {
    "q": "Your app's response time has been under 200ms on every request you've measured this week, so you conclude the app is fast. Which engine is this?",
    "choices": ["Deduction", "Induction", "Abduction", "Deduction and abduction combined"],
    "answer": 1,
    "explain": "You generalize from specific observations to a probable rule. It's well-supported but never certain — the next request could be the slow black swan. That's induction."
  },
  {
    "q": "The page renders blank and the network tab shows no data, so you figure the API call most likely failed. Which engine is this?",
    "choices": ["Deduction", "Induction", "Abduction", "None of these"],
    "answer": 2,
    "explain": "You reason backward from a symptom to the most plausible cause — a hypothesis to verify, not a proof. That's abduction, the everyday engine of debugging."
  }
]
```

[← Phase 2: Statements, Truth, and Validity](02-statements-truth-and-validity.md) · [Guide overview](_guide.md)