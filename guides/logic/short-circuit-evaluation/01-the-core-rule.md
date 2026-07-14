---
title: "Why bother checking the second half"
guide: short-circuit-evaluation
phase: 1
summary: "Why && and || stop evaluating the moment the answer is already determined, and how that becomes both a useful coding pattern and a source of subtle bugs."
tags: [short-circuit-evaluation, boolean-logic, operators, programming, logic]
difficulty: beginner
synonyms:
  - what is short circuit evaluation
  - why does && stop early
  - how does || work in javascript
  - guard pattern with &&
  - why is my fallback value being used unexpectedly
  - nullish coalescing vs or
updated: 2026-07-04
---

# Why bother checking the second half

Picture a light switch wired to two switches in series - both have to be flipped on for the light to turn on. The moment you see the first switch is off, you already know the light is off. You don't need to walk over and check the second switch at all; the outcome is settled. That's the entire idea behind short-circuit evaluation, applied to `&&` and `||` in code.

If you want the background on what AND and OR mean as logical connectives before diving into this specific behavior, [Propositional Logic](/guides/propositional-logic) covers that foundation - this guide picks up from there and focuses on one particular thing your language does when it *evaluates* an AND or OR expression at runtime.

## The rule for AND

For `&&` (or `and`, depending on the language), the whole expression is `true` only if *both* sides are `true`. That means the instant the left side turns out to be `false`, the answer is already locked in - the entire expression must be `false`, no matter what the right side would have been. So the language doesn't bother evaluating the right side at all.

```text
false && (anything)   ->  always false, right side never runs
true  && (right side) ->  right side must be checked to know the answer
```

*What just happened:* the left operand alone was enough to determine the result in the first row. There was no point running the right side, so the language skipped it entirely - not "evaluated it and ignored the result," but genuinely never executed it.

## The rule for OR

`||` (or `or`) works the mirror-image way. The whole expression is `true` if *either* side is `true`. So the instant the left side turns out to be `true`, the answer is already locked in as `true` - the right side is skipped.

```text
true  || (anything)   ->  always true, right side never runs
false || (right side) ->  right side must be checked to know the answer
```

*What just happened:* same idea, flipped. One `true` on the left is enough to guarantee a `true` result, so there's nothing left for the right side to contribute.

## Seeing it happen

Here's the rule made visible, using a function call that prints a message so you can see whether it actually ran:

```python runnable
def loud_true():
    print("loud_true ran")
    return True

def loud_false():
    print("loud_false ran")
    return False

print("--- AND with a false first ---")
result = loud_false() and loud_true()
print("result:", result)

print("--- OR with a true first ---")
result = loud_true() or loud_false()
print("result:", result)
```

*What just happened:* in the AND example, only `"loud_false ran"` prints - `loud_true()` never executes, because `and` already knew the answer was `False` after the left side came back `False`. In the OR example, only `"loud_true ran"` prints, for the same reason in reverse. If short-circuiting weren't happening, both function calls would print every time, regardless of order.

> Short-circuiting isn't an optimization trick bolted on afterward - it's the definition of how `&&` and `||` evaluate. The right side runs *only if the left side didn't already settle the answer.*

## Why this matters beyond trivia

Right now this might look like a curiosity about how your language saves a bit of work. It's more than that: because the right side is *guaranteed* not to run when it's unnecessary, you can rely on that guarantee to write code that would otherwise crash. That's the entire subject of Phase 2 - the guard pattern and default values are both just this one rule, used on purpose.

Watch it animated: [short-circuit evaluation](/explainers/ShortCircuit.dc.html)

```quiz
[
  {
    "q": "In `false && someFunction()`, does someFunction() get called?",
    "choices": [
      "Yes, always - && only skips the return value",
      "No - the left side being false already determines the result, so the right side never runs",
      "Only if someFunction() has no arguments",
      "It depends on the return type of someFunction()"
    ],
    "answer": 1,
    "explain": "AND short-circuits on a false left side: the overall result is already false, so the right side is never evaluated."
  },
  {
    "q": "In `true || someFunction()`, does someFunction() get called?",
    "choices": [
      "Yes, OR always evaluates both sides",
      "No - the left side being true already determines the result, so the right side never runs",
      "Only in compiled languages, not interpreted ones",
      "Only if the function returns a boolean"
    ],
    "answer": 1,
    "explain": "OR short-circuits on a true left side: the overall result is already true, so evaluating the right side would be redundant, and it's skipped."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Where this becomes a real pattern →](02-real-patterns.md)
