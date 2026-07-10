---
title: "Comparison and branching"
guide: practice-webassembly
phase: 4
summary: "Use i32.gt_s and if/else to pick between two values - WAT's if is an expression that can itself return a value, not just a control-flow statement."
tags: [webassembly, wasm, wat, if, else, comparison, i32.gt_s]
difficulty: intermediate
synonyms:
  - webassembly if else
  - wat comparison operators
  - wasm conditional branching
updated: 2026-07-10
---

# Comparison and branching

You've used `i32.gt_s` already, as a loop's exit test. This lesson uses it to
pick between two values directly - a `max` function, the classic case for a
conditional.

WAT's `if` is unusual if you're coming from JS or Python: it's an
**expression**, not just a statement, and when it produces a value you must
declare that with `(result i32)` right on the `if`, matching the function's
own result type. Both branches - `(then ...)` and `(else ...)` - have to
leave the same type on the stack, because the caller can't know in advance
which one ran. There's no implicit `undefined`/`None` fallback the way there
is in JS or Python: an `if` that returns a value needs an `else`, full stop.

Comparison instructions like `i32.gt_s` (signed greater-than) work like
`i32.add` did: they pop two values and push a result - here, an `i32` that's
`1` for true or `0` for false, which is exactly what `if`/`br_if` read as
their condition.

**Your task:** write a function exported as `"max"` that takes two `i32`
parameters and returns the larger one.

**You'll practice:**

- `i32.gt_s` for a signed greater-than comparison
- `if (result i32) ... (then ...) (else ...)` as a value-producing conditional
- Why WAT's `if`/`else` must both leave the same type behind

```lesson
{
  "language": "wat",
  "check": "wat",
  "starterCode": ";; Export \"max\": return whichever of a, b is larger.\n(module\n  ;; TODO: add your (func (export \"max\") ...) here,\n  ;; using i32.gt_s and if/then/else.\n)",
  "solution": "(module\n  (func (export \"max\") (param $a i32) (param $b i32) (result i32)\n    (if (result i32) (i32.gt_s (local.get $a) (local.get $b))\n      (then (local.get $a))\n      (else (local.get $b))\n    )\n  )\n)",
  "hints": [
    "Compare first: (i32.gt_s (local.get $a) (local.get $b)) pushes 1 if a > b, else 0.",
    "Wrap it in an if that returns a value: (if (result i32) <condition> (then ...) (else ...)).",
    "Each branch just needs to leave the right local on the stack: (then (local.get $a)) and (else (local.get $b))."
  ],
  "tests": [
    { "name": "max(7, 3) is 7", "code": "if (instance.exports.max(7, 3) !== 7) throw new Error('max(7, 3) should be 7, got ' + instance.exports.max(7, 3));" },
    { "name": "max(2, 9) is 9", "code": "if (instance.exports.max(2, 9) !== 9) throw new Error('max(2, 9) should be 9, got ' + instance.exports.max(2, 9));" },
    { "name": "max(5, 5) is 5", "code": "if (instance.exports.max(5, 5) !== 5) throw new Error('max(5, 5) should be 5, got ' + instance.exports.max(5, 5));" }
  ]
}
```
