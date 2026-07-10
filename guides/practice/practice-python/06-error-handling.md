---
title: "Error handling"
guide: practice-python
phase: 6
summary: "Raise a specific exception with a clear message, then catch it with try/except instead of letting it crash the program."
tags: [python, exceptions, try-except, raise, error-handling]
difficulty: intermediate
synonyms:
  - python try except
  - raise exception python
  - python error handling
updated: 2026-07-10
---

# Error handling

`raise ValueError("message")` stops the function right there and hands the
caller a specific, named problem instead of a wrong answer or a crash further
down the line. It's how you say "this input is bad, and here's exactly why" -
far more useful to whoever calls your function than a silent `None` or a
confusing error somewhere else.

`try` / `except` is how the caller decides what to do about it. Code inside
`try` runs normally until something raises; `except ValueError:` catches
that specific exception type and runs its block instead of letting the
program crash. Catching the exact exception type matters - an unrelated bug
shouldn't get silently swallowed along with the one you meant to handle.

**Your task:** write `divide(a, b)`, which raises `ValueError("cannot divide
by zero")` when `b` is `0`, and otherwise returns `a / b`. Then write
`safe_divide(a, b)`, which calls `divide(a, b)` but catches that `ValueError`
and returns `None` instead of letting it propagate.

**You'll practice:**

- Raising a specific exception with `raise`
- Catching it with `try` / `except` and building one function on another

```lesson
{
  "language": "python",
  "starterCode": "# Write divide(a, b): raise ValueError(\"cannot divide by zero\") when b is 0,\n# otherwise return a / b.\ndef divide(a, b):\n    pass\n\n# Write safe_divide(a, b): call divide(a, b), but catch that ValueError\n# and return None instead of letting it propagate.\ndef safe_divide(a, b):\n    pass",
  "solution": "def divide(a, b):\n    if b == 0:\n        raise ValueError(\"cannot divide by zero\")\n    return a / b\n\ndef safe_divide(a, b):\n    try:\n        return divide(a, b)\n    except ValueError:\n        return None",
  "hints": ["divide raises with: raise ValueError(\"cannot divide by zero\") - only when b == 0.", "safe_divide wraps a call to divide(a, b) in a try/except ValueError block.", "On the except branch, safe_divide should just return None."],
  "tests": [
    { "name": "divide returns a normal result", "code": "assert divide(10, 2) == 5, 'divide(10, 2) should be 5'" },
    { "name": "divide raises ValueError on zero", "code": "raised = False\ntry:\n    divide(5, 0)\nexcept ValueError:\n    raised = True\nassert raised, 'divide(5, 0) should raise a ValueError'" },
    { "name": "safe_divide returns the result when it succeeds", "code": "assert safe_divide(9, 3) == 3, 'safe_divide(9, 3) should be 3'" },
    { "name": "safe_divide returns None instead of raising", "code": "assert safe_divide(5, 0) is None, 'safe_divide(5, 0) should be None, not raise'" }
  ]
}
```
