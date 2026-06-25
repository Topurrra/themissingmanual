---
title: "Probability: Measuring Uncertainty"
guide: "probability-and-statistics"
phase: 1
summary: "Probability puts a number from 0 to 1 on how likely something is. For equally likely outcomes it's favorable over total; independent events multiply, mutually exclusive ones add, and expected value tells you the long-run average."
tags: [mathematics, probability, expected-value, independence]
difficulty: beginner
synonyms: ["what is probability", "how to calculate probability", "independent events", "expected value", "probability of two things happening"]
updated: 2026-06-25
---

# Probability: Measuring Uncertainty

You flip a coin. You don't know how it lands until it lands — yet you'd happily bet even
money on it, and you'd refuse that same bet on a die showing a 4. Some unknowns feel more
likely than others, and you sense it in your gut. Probability turns that gut feeling into a
number you can reason with, compare, and combine.

This isn't about predicting the future. It's about measuring uncertainty honestly: "I don't
know what will happen, but here's exactly how much I don't know."

## A probability is a number from 0 to 1

Every probability is a single number between **0 and 1**:

- **0** means the event is impossible. It will not happen.
- **1** means the event is certain. It will happen.
- **0.5** means it's a coin flip — as likely to happen as not.

Anything in between is a shade of "maybe." A probability of 0.9 means very likely; 0.1 means
unlikely but not ruled out. People often write these as percentages — 0.9 is 90%, 0.25 is
25% — the same number wearing a different outfit. Multiply by 100 for a percentage; divide by
100 to get back.

📝 If someone hands you a "probability" of 1.4 or −0.2, something is wrong. Probabilities live
in the range 0 to 1, full stop. Less a rule to memorize than a free sanity check.

## Equally likely outcomes: favorable over total

The cleanest case is when every outcome is **equally likely** — a fair coin, a fair die, a
shuffled deck. Then probability is a counting problem:

```
P(event) = number of favorable outcomes / total number of outcomes
```

Roll one fair die. There are 6 possible outcomes (1 through 6), all equally likely. Exactly
one is a 4. So:

```
P(rolling a 4) = 1 / 6 ≈ 0.167
```

This is why [counting came first](/guides/counting-and-combinatorics). Equally-likely
probability is careful counting: count the outcomes you want, count all the outcomes, divide.
When the counting gets hard — "what's the probability of a full house?" — the probability is
hard for the same reason. Same skill underneath.

💡 The phrase "equally likely" does real work. This formula applies only when no outcome is
favored over another. A weighted die or loaded coin breaks it: you can't merely count, you'd
need each outcome's weight.

## The complement: the easy way in

Sometimes the thing you want is awkward to count, but its **opposite** is easy. The complement
of event A is "A does not happen," and the two always add up to certainty:

```
P(not A) = 1 − P(A)
```

A 1/6 chance of rolling a 4 means a 5/6 chance of *not* rolling a 4. That seems too simple to
matter — until you hit "what's the chance of at least one 6 in several rolls?" Counting every
way to get "at least one" is a headache. Counting the *one* way to get "none" is trivial. So
compute the easy opposite and subtract from 1. You'll see this pay off in the runnable example
below.

## Combining events: multiply for "and," add for "or"

Most real questions involve more than one event. There are two core moves, mirroring the
and-vs-or split from counting.

**Independent events multiply (the "and" case).** Two events are independent when one happening
doesn't change the odds of the other. Two separate coin flips are independent — the first coin
has no memory. For the probability that *both* happen, multiply:

```
P(A and B) = P(A) · P(B)        (when A and B are independent)
```

Two coin flips both landing heads:

```
P(heads and heads) = 1/2 · 1/2 = 1/4
```

That matches intuition: of the four equally likely pairs (HH, HT, TH, TT), exactly one is HH.

**Mutually exclusive events add (the "or" case).** Two events are mutually exclusive when they
can't both happen at once. Rolling a 4 and rolling a 5 on one die can't both be true. For the
probability that *one or the other* happens, add:

```
P(A or B) = P(A) + P(B)         (when A and B can't both happen)
```

```
P(rolling a 4 or a 5) = 1/6 + 1/6 = 2/6 = 1/3
```

A way to keep them straight: **"and" narrows down** (you need both, so the chance shrinks —
two numbers below 1 multiply to something smaller), while **"or" opens up** (more ways to win,
so the chance grows).

## Expected value: the long-run average

Probability tells you how likely each outcome is. **Expected value** tells you what you'd
average over many repeats. Multiply each possible value by its probability, then add:

```
expected value = sum of (each value × its probability)
```

Say a game pays $10 if a die shows a 6, and $0 otherwise:

```
expected value = $10 · (1/6) + $0 · (5/6) = $10/6 ≈ $1.67
```

Any single play gives you $10 or nothing, but over thousands of plays you'd average about
$1.67 each. That number tells you whether a $2 entry fee is a bad deal (it is — you'd lose
about $0.33 per play on average).

## Try it: at least one 6 in two rolls

Here's the complement trick in action. Computing "at least one 6 in two rolls" directly means
juggling several cases; computing "no 6 at all" is one clean multiplication.

```python runnable
# P(at least one 6 in two dice rolls) via the complement
p_no_six_one_roll = 5/6
p_no_six_twice = p_no_six_one_roll ** 2
print(round(1 - p_no_six_twice, 4))   # ~0.3056
```

*What just happened:* Instead of counting every way to get at least one 6, we counted the
single easy opposite — getting *no* 6. Each roll misses the 6 with probability 5/6, and the
two rolls are independent, so both miss with probability (5/6)² ≈ 0.6944. Subtract that from
1 and you get ≈ 0.3056: there's about a 31% chance of seeing at least one 6 across two rolls.
Notice we used all three ideas at once — the complement, independence (multiply), and the
0-to-1 range.

## For builders

This shows up in code more than you might expect:

- **Randomness and sampling.** When you pick a random element, shuffle a list, or A/B-test a
  feature, you're generating outcomes with known probabilities. The math lets you check
  whether your "random" distribution is actually fair.
- **Retries and failure probabilities.** If one network call fails 1% of the time
  (probability 0.01) and failures are independent, the chance that three independent retries
  *all* fail is 0.01³ = 0.000001 — one in a million. That's the entire argument for retry
  logic, in one multiplication.
- **Rare events at scale.** A "1-in-a-million" event sounds like it'll never happen. But if
  your service handles a million requests an hour, *expect* it roughly once an hour. Low
  probability times huge volume equals a regular occurrence. This is why large-scale systems
  hit bugs that "can't happen" — at scale, rare is routine.

## ⚠️ Gotcha: independence is a precondition, not a default

Multiplying probabilities is valid only when the events are genuinely independent — when one
truly doesn't affect the other. Drawing two cards *without* replacing the first changes the
deck, so those draws aren't independent, and naive multiplication gives the wrong answer.

The most famous version is the **gambler's fallacy**: a coin lands heads five times in a row,
and someone "feels" tails is overdue. It isn't. The coin has no memory; the next flip is still
exactly 1/2. The past flips and the next flip are independent, so the past tells you nothing
about the next outcome. Before you multiply, always ask: does the first event change the odds
of the second? If yes, you can't blindly multiply.

## Recap

- A probability is a single number from **0 (impossible) to 1 (certain)**, often shown as a
  percentage.
- For **equally likely** outcomes, `P(event) = favorable / total` — it's counting in disguise.
- The **complement** rule, `P(not A) = 1 − P(A)`, is often the shortcut, especially for "at
  least one" questions.
- **Independent** events **multiply** ("and"); **mutually exclusive** events **add** ("or").
- **Expected value** is the long-run average: sum of (value × its probability).
- Independence is a condition you must check — forgetting it is the gambler's fallacy.

A quick check before you move on:

```quiz
[
  {
    "q": "A fair eight-sided die has faces 1 through 8. What is the probability of rolling a 3?",
    "choices": ["1/8", "3/8", "1/3", "8/3"],
    "answer": 0,
    "explain": "Equally likely outcomes: favorable over total. There's one face showing 3 out of 8 total faces, so P = 1/8. (Notice it sits between 0 and 1, as every probability must.)"
  },
  {
    "q": "You flip a fair coin twice. What is the probability of getting heads both times?",
    "choices": ["1/2", "1/4", "1", "2/3"],
    "answer": 1,
    "explain": "The flips are independent, so you multiply: P(heads and heads) = 1/2 · 1/2 = 1/4."
  },
  {
    "q": "If the probability of rain tomorrow is 0.3, what is the probability of no rain?",
    "choices": ["0.3", "0.5", "0.7", "1.3"],
    "answer": 2,
    "explain": "The complement rule: P(not A) = 1 − P(A) = 1 − 0.3 = 0.7."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Reading Data: Statistics That Don't Lie →](02-reading-data-statistics.md)