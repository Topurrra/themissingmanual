---
title: "The Fixes (and When Floats Are Fine)"
guide: floating-point-and-money
phase: 3
summary: "Store money as integer cents or a decimal type, compare floats with a tolerance instead of ==, and know the cases where floats are exactly the right tool."
tags: [floating-point, money, decimal, cents, tolerance, epsilon, best-practices]
difficulty: beginner
synonyms: ["how to store money in code", "integer cents money", "decimal type for currency", "compare floats with tolerance", "epsilon float comparison", "when is float ok", "decimal vs float money", "how to avoid floating point errors"]
updated: 2026-07-10
---

# The Fixes (and When Floats Are Fine)

Here's the good news: you don't need to understand IEEE 754 any deeper to be safe. You need a small kit of three habits, matched to the three bites from the last phase - money gets an exact representation, comparisons get a tolerance, and, the part people forget, you let floats keep doing the jobs they're great at.

## Fix #1: store money as integer minor units (cents)

The cleanest money fix is to stop storing fractions at all. A dollar is 100 cents; a price isn't `19.99` dollars, it's `1999` cents. Integers are stored *exactly* - no binary-fraction problem, because there's no fraction. You do all the math in whole cents and only format with a decimal point when you show it to a human.

```python runnable
price_cents = 1999          # $19.99, stored as a whole number
quantity = 3
total_cents = price_cents * quantity
print(total_cents)                          # 5997 - exact, always
print(f"${total_cents // 100}.{total_cents % 100:02d}")
```
*What just happened:* Every value and every operation stays a whole number, so there is no rounding error to accumulate - `1999 * 3` is exactly `5997`. The decimal point only appears at the very end, for display. This is what most payment systems do under the hood, and it's the default you should reach for.

The catch to know about: division. Splitting `5997` cents three ways is `1999` each with `0` left over - clean. But `100` cents split three ways is `33, 33, 33` with `1` cent left over, and *someone* has to get that extra cent. Integer cents doesn't make that decision for you; it makes the leftover **visible and exact** so you can assign it on purpose instead of losing it to rounding.

## Fix #2: use a decimal type when you need fractions of a cent

Sometimes whole cents aren't enough - tax rates, interest, currencies with more than two decimal places, per-unit prices like fuel. For those, most languages offer a **decimal** type that stores numbers in base 10, exactly, the way you write them. It's slower than a float, but it doesn't round `0.1`.

```python runnable
from decimal import Decimal

a = Decimal("0.1") + Decimal("0.2")
print(a)              # 0.3 - exactly
print(a == Decimal("0.3"))
```
*What just happened:* `Decimal` stores `0.1`, `0.2`, and `0.3` as exact base-10 values, so the sum is exactly `0.3` and the equality check is `True`. The catch you must respect: build decimals from **strings** (`Decimal("0.1")`), not from floats - `Decimal(0.1)` would copy the float's rounding error straight in. Most languages have an equivalent: `BigDecimal`, `decimal`, `NUMERIC`/`DECIMAL` in SQL.

> ⚠️ A decimal type only helps if you keep floats out of it. `Decimal("0.1")` is exact; `Decimal(0.1)` inherits the float error and defeats the entire point. Same rule in databases: store money in a `DECIMAL`/`NUMERIC` column, never `FLOAT`/`REAL`.

## Fix #3: compare floats with a tolerance, not ==

When you genuinely are working with floats (you'll see good reasons in a moment), stop asking "exactly equal?" Ask "close enough?" - within a small tolerance that absorbs rounding noise.

```python runnable
a = 0.1 + 0.2
b = 0.3
print(a == b)                       # False - exact comparison
print(abs(a - b) < 1e-9)            # True - within tolerance
import math
print(math.isclose(a, b))           # True - the built-in way
```
*What just happened:* `abs(a - b) < 1e-9` checks whether the two values differ by less than a tiny threshold, which they don't - so it treats them as equal. Better still, many languages ship a ready-made `isclose` that handles the tricky scaling for big and small numbers. The rule: **never `==` two computed floats; compare the difference against a tolerance** (often called an *epsilon*).

📝 **Terminology.** *Minor units* are the smallest whole unit of a currency (cents for USD). A *decimal type* stores numbers in base 10 exactly. *Tolerance* / *epsilon* is the small allowed difference when comparing floats for "close enough."

## The other half of the truth: floats are often exactly right

It would be wrong to leave you afraid of floats. They're not a mistake to be avoided - they're the correct tool for a huge class of problems. Reach for floats freely when:

- **The values are measurements, not exact counts.** Temperatures, distances, sensor readings, weights - these are already approximate; a float's tiny error is far smaller than the real-world uncertainty.
- **You're doing graphics, audio, simulation, or geometry.** Pixel positions, 3D coordinates, physics steps, signal samples. Speed matters enormously and a 16th-digit error is invisible on screen or in the ear.
- **You're doing science or statistics.** Averages, models, probabilities - float's range and speed are exactly what you want, and you compare with tolerances anyway.

```text
USE A FLOAT FOR:        DON'T USE A FLOAT FOR:
  measurements            money / currency
  graphics & geometry     exact counts that must reconcile
  physics & simulation    anything compared with ==
  science & statistics    accumulating sums where exactness matters
```
*What just happened:* The dividing line isn't "floats are bad," it's **exactness**. Need an exact decimal value (especially money) or an exact comparison? Use integers or a decimal type. Working with inherently approximate quantities where speed counts? Floats are the right call. The same property that makes them wrong for dollars makes them perfect for pixels.

💡 **Key point.** One rule covers ninety percent of the danger: **never store money in a float.** Use integer minor units, or a decimal type. Everything else here is detail hanging off that rule.

> 💬 For builders: when you pick up a new language, spend five minutes learning its money story before you write any. Which decimal type does it ship? What's the idiomatic `isclose`? What column type does the database use for currency? Knowing those three answers up front is the difference between a clean ledger and a 2 a.m. reconciliation bug. And if the underlying base-2 idea still feels shaky, [Why Math Isn't Your Enemy](/guides/why-math-isnt-your-enemy) and [How a Computer Actually Works](/guides/cpu-ram-and-storage) are worth a pass.

```quiz
[
  {
    "q": "What's the recommended default for storing a USD price like $19.99 in code?",
    "choices": [
      "A float: 19.99",
      "A string: \"19.99\"",
      "An integer number of cents: 1999",
      "A double rounded to two places"
    ],
    "answer": 2,
    "explain": "Integer minor units (cents) are stored exactly - no binary-fraction rounding. You only add the decimal point when formatting for display."
  },
  {
    "q": "When using a decimal type, why must you write Decimal(\"0.1\") instead of Decimal(0.1)?",
    "choices": [
      "Strings are faster than numbers",
      "Decimal(0.1) inherits the float's rounding error before the decimal type ever sees it",
      "Decimal can't accept numbers at all",
      "It's only a style preference with no real effect"
    ],
    "answer": 1,
    "explain": "0.1 as a float is already rounded. Passing that float into Decimal copies the error in. Building from the string \"0.1\" gives the exact value you wrote."
  },
  {
    "q": "Which task is a GOOD fit for floats?",
    "choices": [
      "A bank account balance",
      "3D coordinates in a graphics engine",
      "An invoice total that must reconcile to the cent",
      "A loop counter compared with == to a target"
    ],
    "answer": 1,
    "explain": "Graphics values are inherently approximate and speed-critical, where a 16th-digit error is invisible. Money and exact comparisons need integers or a decimal type."
  }
]
```

[← Phase 2: Where It Bites](02-where-it-bites.md) · [Guide overview](_guide.md)
