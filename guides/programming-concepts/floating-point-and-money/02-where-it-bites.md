---
title: "Where It Bites"
guide: floating-point-and-money
phase: 2
summary: "The three places float rounding turns into real bugs - money totals that miss by a cent, exact equality checks that fail, and long summations that drift."
tags: [floating-point, money, equality, summation, bugs, precision]
difficulty: beginner
synonyms: ["floating point money bug", "why is my total off by a cent", "comparing floats with ==", "float equality fails", "summing floats error accumulates", "floating point in a loop"]
updated: 2026-07-10
---

# Where It Bites

A tiny error in the 16th decimal sounds harmless, and most of the time it is. The danger isn't the size of one error - it's the three situations where that error gets *noticed*: displaying money, checking two numbers for equality, and adding up many numbers. Recognizing them on sight is half the job.

## Bite #1: money, off by a cent

This is the one that ends up in a bug ticket. Picture a checkout adding up an order:

```python runnable
price = 0.10
quantity = 3
total = price * quantity
print(total)
print(f"${total:.2f}")
```
*What just happened:* `0.10 * 3` should be `0.30`, but the stored result is `0.30000000000000004`. Format it to two decimals for display and it *looks* fine - `$0.30`. That's the trap: the display hides the error, so you ship it. The rounding is still in the underlying number, waiting.

It surfaces the moment you do anything *exact* with that total - comparing it, summing many of them, or rounding at a different step. A classic: split a bill and the pennies don't add back up.

```python runnable
bill = 0.30
each = round(bill / 3, 2)   # three people split it
print(each)                 # 0.1 each
print(each * 3)             # do the three shares rebuild the bill?
print(each * 3 == bill)
```
*What just happened:* Each share rounds to `0.1`, but `0.1 * 3` is `0.30000000000000004`, which is *not* equal to the stored `0.30`. In a real ledger this is the missing penny that makes an accountant's reconciliation fail at 2 a.m. The money was never "lost" - it was never represented exactly in the first place.

> ⚠️ A float total that *displays* correctly is the most dangerous kind. The error is invisible until something downstream - a comparison, a sum, a different rounding step - drags it into the light. By then it's in production.

## Bite #2: comparing floats with ==

Because stored floats are approximations, two calculations that *should* give the same value often give two slightly different nearby floats. Checking them with `==` then fails for no visible reason:

```python runnable
a = 0.1 + 0.2
b = 0.3
print(a)            # 0.30000000000000004
print(b)            # 0.3
print(a == b)       # surprise
```
*What just happened:* `a` and `b` are mathematically equal but stored as two different floats, so `==` reports `False`. This is why an exact equality check on floats is a quiet bug magnet: a loop that stops only when a counter "equals" a target, a test asserting `result == 0.3`, a cache keyed on a computed float - each can fail or loop forever even though the math is right.

The fix (next phase) is to stop asking "are these *exactly* equal?" and start asking "are these *close enough*?" But first, the sneakiest bite of the three.

## Bite #3: long summations drift

One rounding error is tiny. Add a million of them and they stop being tiny. When you sum a long list of floats, each addition rounds a little, and the errors *accumulate* in the same direction:

```python runnable
total = 0.0
for _ in range(1_000_000):
    total += 0.1
print(total)              # expected 100000.0
print(total - 100000.0)  # the drift
```
*What just happened:* Adding `0.1` a million times should give `100000.0`, but the result drifts off by a small amount because each step's rounding error piles on the last. The longer the loop or the larger the spread of magnitudes, the worse the drift. This is why scientific and financial code that sums many values has to be careful about *how* it sums them - not whether floats are "accurate enough" in isolation.

💡 **Key point.** The errors aren't getting bigger individually - they're *adding up*. A bound that's invisible on one operation becomes visible over millions. Order and count start to matter.

## The pattern under all three

Notice the common thread. The error from Phase 1 is always there; these three situations are where it becomes *observable*:

```text
money       → you need an EXACT decimal value, and floats hold approximations
equality    → you ask "exactly equal?" of two approximations
summation   → you repeat the rounding enough times that it adds up
```
*What just happened:* Every float bug traces back to the same root - approximation - surfacing through exactness, exact comparison, or accumulation. Once you can name which of the three you're in, the fix in the next phase is obvious.

📝 **Terminology.** *Accumulated error* (or *error accumulation*) is the buildup of many small rounding errors over a sequence of operations. *Exact equality* is comparing with `==` and demanding the bits match - the thing you almost never want with floats.

> 💬 For builders: when you're reviewing code, treat three things as instant red flags - a `float`/`double` holding a currency amount, an `==` between two computed floating-point values, and a long-running sum of floats. None is *guaranteed* wrong, but each deserves a second look and usually one of the fixes coming up next.

```quiz
[
  {
    "q": "A cart total displays correctly as \"$0.30\" but the stored value is 0.30000000000000004. Why is this still dangerous?",
    "choices": [
      "It will display wrong on other screens",
      "The hidden error surfaces in exact comparisons, sums, or later rounding steps",
      "It uses more memory than 0.30",
      "It will round up to $0.31 automatically"
    ],
    "answer": 1,
    "explain": "Formatting for display hides the error but doesn't remove it. Any exact operation downstream - comparison, summation, re-rounding - drags it back into view."
  },
  {
    "q": "Why does 0.1 + 0.2 == 0.3 return False?",
    "choices": [
      "0.3 is stored as a string, not a number",
      "== always returns False for floats",
      "The two sides are stored as two slightly different nearby floats, so an exact match fails",
      "Python rounds the left side up"
    ],
    "answer": 2,
    "explain": "Both sides are approximations stored as different floats. == demands an exact bit match, which they don't have, even though they're mathematically equal."
  },
  {
    "q": "Adding 0.1 a million times drifts away from 100000.0. What's the underlying cause?",
    "choices": [
      "Integer overflow in the loop counter",
      "Each addition rounds slightly, and those errors accumulate over many steps",
      "0.1 changes value during the loop",
      "The CPU gets slower as the number grows"
    ],
    "answer": 1,
    "explain": "Each step introduces a tiny rounding error in the same direction. One is invisible; a million of them accumulate into a visible drift."
  }
]
```

[← Phase 1: Why Floats Surprise You](01-why-floats-surprise-you.md) · [Guide overview](_guide.md) · [Phase 3: The Fixes →](03-the-fixes.md)
