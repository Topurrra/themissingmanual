---
title: "Recursion kata: factorial and Fibonacci"
guide: practice-python
phase: 11
summary: "Write factorial(n) and fibonacci(n) recursively - each one calling itself with a smaller input until it reaches a base case."
tags: [python, recursion, factorial, fibonacci]
difficulty: intermediate
synonyms:
  - python recursion practice
  - recursive factorial python
  - recursive fibonacci python
  - python function calling itself
updated: 2026-07-10
---

# Recursion kata: factorial and Fibonacci

A recursive function calls itself with a smaller version of its own input,
until it reaches a **base case** small enough to answer directly without
calling itself again. Every recursive function needs both parts: a base
case that stops the calls, and a step that shrinks the input and trusts the
smaller call to return the right answer.

`5! ` (factorial) is `5 * 4!`, and `4!` is `4 * 3!`, all the way down to
`0! = 1` - the base case that ends the chain. Fibonacci works the same way:
each number is the sum of the two before it (`fibonacci(n) = fibonacci(n-1) +
fibonacci(n-2)`), down to two base cases, `fibonacci(0) = 0` and
`fibonacci(1) = 1`.

**Your task:** write `factorial(n)`, returning `n!` using recursion (`0!` is
`1`). Then write `fibonacci(n)`, returning the `n`th Fibonacci number
(0-indexed: `fibonacci(0) = 0`, `fibonacci(1) = 1`) using recursion - each
function should call itself, not use a loop.

**You'll practice:**

- Writing a base case and a recursive case for factorial
- Writing a two-base-case recursive function for Fibonacci

```lesson
{
  "language": "python",
  "starterCode": "# Write factorial(n): n! using recursion. 0! is 1.\ndef factorial(n):\n    pass\n\n# Write fibonacci(n): the nth Fibonacci number using recursion.\n# fibonacci(0) is 0, fibonacci(1) is 1.\ndef fibonacci(n):\n    pass",
  "solution": "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)",
  "hints": ["factorial's base case is n == 0, returning 1. Otherwise return n * factorial(n - 1).", "fibonacci has two base cases in one: when n <= 1, just return n (that covers both fibonacci(0) == 0 and fibonacci(1) == 1).", "fibonacci's recursive case is fibonacci(n - 1) + fibonacci(n - 2)."],
  "tests": [
    { "name": "factorial of 5", "code": "assert factorial(5) == 120, 'factorial(5) should be 120'" },
    { "name": "factorial base case", "code": "assert factorial(0) == 1, 'factorial(0) should be 1'" },
    { "name": "fibonacci base cases", "code": "assert fibonacci(0) == 0 and fibonacci(1) == 1, 'fibonacci(0) should be 0 and fibonacci(1) should be 1'" },
    { "name": "fibonacci further out", "code": "assert fibonacci(6) == 8, 'fibonacci(6) should be 8'" },
    { "name": "fibonacci(10)", "code": "assert fibonacci(10) == 55, 'fibonacci(10) should be 55'" }
  ]
}
```
