---
title: "The gotcha"
guide: short-circuit-evaluation
phase: 3
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

# The gotcha

Everything in Phase 2 relied on the right side being skippable without consequence - checking `user.name` versus not checking it doesn't change anything else in your program. That assumption quietly breaks in two specific situations, and both are worth knowing before they cost you an afternoon of debugging.

## Skipped side effects

A **side effect** is anything a function call does beyond returning a value - writing to a database, sending a request, incrementing a counter, printing a log line. Short-circuiting doesn't know or care whether the right side has side effects. It just skips it. If that skipped call was supposed to *do* something, that something never happens.

```python runnable
def save_to_database():
    print("saving to database...")
    return True

is_admin = False

# looks like it might save, but does it?
is_admin and save_to_database()
```

*What just happened:* nothing printed. `is_admin` is `False`, so `and` already knows the result is falsy and never runs `save_to_database()` - the save never happened, silently. If the intent here really was "only save if the user is an admin," this code is correct. But if someone wrote `is_admin and save_to_database()` expecting the save to happen unconditionally, or misjudged what `is_admin` would be, the bug is invisible: no error, no crash, just a function that silently never ran.

> The danger isn't short-circuiting itself - it's relying on a side-effecting call showing up on the right side of `&&`/`||` as if it were guaranteed to run. It's only guaranteed to run when the left side doesn't already settle the answer.

The practical guard: if a function call needs to happen no matter what, don't put it on the right side of `&&`/`||` and hope. Call it on its own line, or use an explicit `if`.

## The falsy-value surprise with OR

Phase 2 ended with a hint of this. `value or fallback` doesn't check "is `value` missing" - it checks "is `value` falsy," and those are not the same question. In most languages, `0`, `""` (empty string), and sometimes other values like an empty list are all falsy, exactly like `None`/`null`/`undefined`.

```python runnable
def set_volume(level):
    volume = level or 10   # 10 is the "default" if no level given
    print(f"volume set to {volume}")

set_volume(0)     # user explicitly wants silence
set_volume(None)  # user didn't specify anything
```

*What just happened:* `set_volume(0)` should set the volume to `0` - the user asked for silence. Instead it prints `volume set to 10`, because `0` is falsy, so `or` treats it exactly like a missing value and falls back to the default. The caller's *actual, intentional* `0` got silently overridden. This is one of the most common real-world bugs traced back to `||`: any legitimate falsy value - `0`, `""`, an empty array - triggers the fallback whether you wanted it to or not.

## The fix: nullish coalescing

Several languages now provide an operator specifically to solve this - usually spelled `??`, and called **nullish coalescing**. Instead of falling back on *any* falsy value, it falls back only when the left side is genuinely `null` or `undefined` (or that language's equivalent of "nothing was there"), leaving `0`, `""`, and `false` alone as the real values they are.

```text
level || 10   ->  falls back on 0, "", false, null, undefined - anything falsy
level ?? 10   ->  falls back only on null / undefined - real 0 and "" survive
```

*What just happened:* `??` narrows the question from "is this falsy" to "is this actually missing," which is almost always what people meant when they reached for `||` as a default-value shortcut in the first place. Python doesn't have a dedicated `??` operator, but the distinction still matters there - you'd write an explicit `if level is not None` check instead of leaning on `or` when zero and empty-string are valid inputs.

## Carrying this forward

Short-circuiting itself was never the bug in either example - it's a precise, predictable rule, exactly as described in Phase 1. The bug is always in the assumption layered on top of it: assuming a call will run, or assuming "falsy" means "absent." Once you know to ask those two questions - *does the right side need to run no matter what, and could a legitimate falsy value show up here* - you'll catch both of these before they ship instead of after.

[← Phase 2: Where this becomes a real pattern](02-real-patterns.md) | [Overview](_guide.md)
