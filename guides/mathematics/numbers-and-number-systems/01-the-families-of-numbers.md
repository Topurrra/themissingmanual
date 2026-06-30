---
title: "The Families of Numbers"
guide: "numbers-and-number-systems"
phase: 1
summary: "Naturals, integers, rationals, irrationals, reals - each family was invented to make an operation always work: subtraction needed negatives, division needed fractions, geometry needed irrationals. They nest like Russian dolls."
tags: [mathematics, numbers, integers, rationals, reals]
difficulty: beginner
synonyms: ["types of numbers in math", "natural numbers integers rationals reals", "what is an irrational number", "number sets nesting", "what is a real number"]
updated: 2026-06-25
---

# The Families of Numbers

You probably met "numbers" as one thing: symbols you count, add, and multiply
with. Mathematicians see something else - *families*. Each family was born for a
reason. Something broke. An operation refused to give an answer, so people
invented new numbers to fix it.

That's this whole phase. Not "memorize five definitions" but one thread:
**the number system kept growing because math kept needing it to.** Once you see
the thread, the names stop being trivia and become inevitable.

## The driving idea: numbers grew to keep math working

Here's the mental model to carry through everything below.

Every family starts as "the numbers we already have." Then someone asks a fair
question - a subtraction, a division, a length - and the honest answer is: *there
is no number here that works.* A math where reasonable questions have no answer
feels broken.

So people widened the system instead of accepting the gap. They invented new
numbers so the question *did* have an answer. Each widening keeps everything you
already had and adds what was missing. Nothing gets thrown away.

We'll do this four times. Watch the same move repeat.

## Naturals (ℕ): the counting numbers

Start with the most ancient numbers - the ones you'd use to count sheep:

```text
0, 1, 2, 3, 4, 5, ...
```

These are the **natural numbers**, written ℕ. (Some books start them at 1, some at
0. We'll include 0 here; it's a convention, not a deep truth.) They go up forever.

Addition is happy here: any two naturals add to another natural. Multiplication
too. So far the system holds together.

Then someone asks: what is `3 − 5`?

The answer should be "two below zero." But there is no natural number below zero.
Within ℕ, `3 − 5` has *no answer at all.* Subtraction - an ordinary operation - is
allowed to fail.

That gap is the reason for the next family.

## Integers (ℤ): add the negatives

To make subtraction always work, we add mirror-image numbers below zero:

```text
..., -3, -2, -1, 0, 1, 2, 3, ...
```

These are the **integers**, written ℤ (from the German *Zahlen*, "numbers"). Now
`3 − 5 = -2` has a real answer. In fact *any* subtraction of integers gives an
integer. The hole is patched.

We didn't lose the naturals. Every natural number is still here - `4` is both a
natural and an integer. We only *extended* the system downward.

Then someone asks the next fair question: what is `1 ÷ 2`?

No integer, doubled, gives 1. The nearest integers are 0 and 1, and neither works.
Within ℤ, `1 ÷ 2` has no answer. Division - again, an ordinary operation - fails.

Same move, one more time.

## Rationals (ℚ): ratios of integers

To make division work (almost always - we'll get to the catch), we allow one
integer divided by another:

```text
1/2,  -3/4,  7/1,  22/7,  0,  5
```

These are the **rationals**, written ℚ (for *quotient*). A rational is any number
you can write as a fraction `a/b` where `a` and `b` are integers and `b` is not
zero. That last rule matters: **division by zero stays undefined** even here.
`1 ÷ 2` is now `1/2`. The hole is patched again.

And once more, the old families survive. Every integer is a rational: `5` is
`5/1`. Every natural is too.

Rationals also have a decimal personality worth knowing. Write a rational as a
decimal and it always does one of two things:

- It **terminates**: `1/2 = 0.5`, `3/8 = 0.375`.
- Or it **repeats** forever in a pattern: `1/3 = 0.333...`, `1/7 = 0.142857142857...`

Terminating or repeating - those are the only options for a rational. Hold onto
that, because it's how we'll catch the numbers that *aren't* rational.

So have we got every number? It feels like fractions should cover everything.
They don't, and the reason comes not from arithmetic but from geometry.

## Irrationals: the numbers no fraction can reach

Draw a square one unit on each side. Its diagonal has a length. You can measure it,
point at it, build it - it's a real distance. By the Pythagorean relationship that
length is √2 (the number that, squared, gives 2).

Now the shock: **√2 cannot be written as any fraction `a/b`.** Not because we
haven't found the right one yet - it's been *proven* that no such fraction exists.
The ancient Greeks discovered this, and it genuinely unsettled them: fractions,
their whole notion of number, had a hole.

The circle constant π is the same story. The ratio of a circle's circumference to
its diameter is a perfectly real number, but it is provably not a fraction either.

Numbers like √2 and π are **irrational**: they cannot be written as a ratio of
integers. As decimals, they never terminate and never fall into a repeating
pattern - they run on forever without settling down:

```text
√2 = 1.41421356237...
π  = 3.14159265358...
```

That non-terminating, non-repeating decimal is the fingerprint of an irrational.
A rational always terminates or repeats; an irrational does neither.

## Reals (ℝ): the whole number line

Put the rationals and the irrationals together and you get the **real numbers**,
written ℝ. This is the number line you've always pictured - every point on it, no
gaps. The rationals are dense (there's one between any two you pick), but they
leave pinprick holes exactly where numbers like √2 and π live. The irrationals
fill those holes. Together they form one unbroken line.

Almost any quantity you measure in the physical world - a length, a temperature, a
weight - lives in ℝ.

Is *this* the end? For everyday math, yes. But the same pattern has one more
famous chapter: ask "what is √−1?" and no real number works, because any real
squared is zero or positive. To answer it, mathematicians invented the **complex
numbers** (ℂ), which extend ℝ the way ℤ once extended ℕ. We won't use them here -
notice the move never really stops.

## They nest like Russian dolls

Step back and look at what we built. Each family contained the last one whole:

```text
ℕ  ⊂  ℤ  ⊂  ℚ  ⊂  ℝ
naturals  integers  rationals  reals
```

That `⊂` means "is contained in." Read it as a chain of true statements:

- Every natural number is also an integer.
- Every integer is also a rational (`5 = 5/1`).
- Every rational is also a real.

The reverse is *not* true, and that's the interesting part: `-2` is an integer but
not a natural; `1/2` is rational but not an integer; `√2` is real but not rational.
Each family is strictly bigger than the one inside it.

This nesting is exactly the language of sets and subsets - each family is a set,
and the smaller ones are subsets of the larger. If that framing is new to you, see
[/guides/sets-relations-and-functions](/guides/sets-relations-and-functions). And
if the whole topic still feels intimidating rather than interesting, that's worth
addressing directly:
[/guides/why-math-isnt-your-enemy](/guides/why-math-isnt-your-enemy).

## For builders

If you write code, you've already been using two of these families, probably
without naming them.

- An `int` type is your machine's version of the **integers** ℤ - whole numbers,
  positive and negative. (With a catch: a real `int` has a maximum and minimum,
  while ℤ goes on forever. Overflow is what happens when a value walks off that
  edge.)
- A `float` (or `double`) is your machine's attempt at the **reals** ℝ - numbers
  with a fractional part.

Two things follow directly from the families above.

**Integer division throws away the fraction.** In many languages, `7 / 2` on two
integers gives `3`, not `3.5`. That's not a bug - the result is being kept inside ℤ,
where `3.5` doesn't exist, so it truncates. To get `3.5` you have to ask for real
(float) division.

**Floats are finite approximations, not the true reals.** This one bites people, so
it gets its own callout.

⚠️ **Gotcha: a float is not an exact real number.** ℝ is infinite in precision -
some reals (like √2) need infinitely many digits. Your computer has finite memory,
so it *cannot* store every real exactly; it stores the nearest value it can
represent. That's why, in almost every language:

```text
0.1 + 0.2  =  0.30000000000000004
```

The numbers `0.1` and `0.2` can't be held exactly in the machine's binary format,
so their stored versions are a hair off, and the error shows up in the sum. Nothing
is broken - it's the unavoidable cost of squeezing the infinite real line into a
fixed number of bits. The practical rule: don't test floats for exact equality;
check whether they're *close enough*.

## Recap

- Each family of numbers was invented to make an operation always have an answer.
- **ℕ (naturals):** counting numbers. Subtraction can fail (`3 − 5`).
- **ℤ (integers):** add negatives - subtraction always works. Division can fail (`1 ÷ 2`).
- **ℚ (rationals):** fractions `a/b` - division works (except by zero). Decimals
  terminate or repeat. But some real lengths (√2, π) are provably *not* fractions.
- **Irrationals:** can't be written as a ratio; decimals never terminate or repeat.
- **ℝ (reals):** rationals + irrationals = the full, gapless number line. (Next
  extension, ℂ, handles √−1.)
- They nest: ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ - every member of an inner family belongs to the outer
  ones too.
- For code: `int` ≈ integers, `float` ≈ a *finite approximation* of the reals, which
  is why `0.1 + 0.2` isn't exactly `0.3`.

Quick check before you move on:

```quiz
[
  {
    "q": "Subtraction like 3 − 5 has no answer among the natural numbers. Which family was invented to make subtraction always work?",
    "choices": ["The rationals (ℚ)", "The integers (ℤ)", "The irrationals", "The reals (ℝ)"],
    "answer": 1,
    "explain": "Adding the negative numbers gives the integers, where any subtraction of integers produces an integer. Rationals fix division, not subtraction."
  },
  {
    "q": "What makes a number irrational?",
    "choices": ["It is negative", "It is larger than every fraction", "It cannot be written as a ratio of two integers, and its decimal never terminates or repeats", "It has a decimal point in it"],
    "answer": 2,
    "explain": "An irrational like √2 or π provably can't be expressed as a/b for integers a and b; written out, its decimal goes on forever with no repeating pattern."
  },
  {
    "q": "Given the nesting ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ, which statement is true?",
    "choices": ["Every integer is also a rational number", "Every rational is also an integer", "Every real number is also a natural number", "Every rational is also an irrational"],
    "answer": 0,
    "explain": "Each family contains the one inside it: an integer like 5 is the rational 5/1, so every integer is rational. The reverse fails - 1/2 is rational but not an integer."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Bases: Binary, Decimal, Hex →](02-bases-binary-decimal-hex.md)