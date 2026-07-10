---
title: "Arithmetic with parameters"
guide: practice-webassembly
phase: 2
summary: "Add parameters to a WAT function and combine them with i32.add - your first real look at the stack-based execution model."
tags: [webassembly, wasm, wat, parameters, local.get, arithmetic]
difficulty: beginner
synonyms:
  - webassembly function parameters
  - wat i32.add
  - wasm arithmetic instructions
updated: 2026-07-10
---

# Arithmetic with parameters

Last lesson's function ignored the stack model - it just pushed one value
and returned. This lesson makes it real. A WAT function's parameters are
declared with `(param $name type)`, and to use a parameter's value you
explicitly push it onto the stack with `local.get $name` (params and local
variables are both called "locals" in WAT - parameters are just locals
pre-filled with the caller's arguments).

Arithmetic instructions like `i32.add` don't take arguments the way a
function call does - they **pop** however many values they need off the top
of the stack, do the operation, and **push** the result back on. So
`local.get $a` then `local.get $b` then `i32.add` reads as: push `a`, push
`b`, then pop the top two values and push their sum. Whatever's left on the
stack at the end of the function is what gets returned - no `return`
keyword needed for the simple case.

**Your task:** write a function exported as `"add"` that takes two `i32`
parameters and returns their sum.

**You'll practice:**

- Declaring parameters with `(param $name i32)`
- Pushing a parameter's value with `local.get`
- Combining two stack values with `i32.add`

```lesson
{
  "language": "wat",
  "check": "wat",
  "starterCode": ";; Export a function called \"add\" that takes two i32\n;; parameters and returns their sum.\n(module\n  ;; TODO: add your (func (export \"add\") ...) here\n)",
  "solution": "(module\n  (func (export \"add\") (param $a i32) (param $b i32) (result i32)\n    local.get $a\n    local.get $b\n    i32.add))",
  "hints": [
    "Two parameters: (param $a i32) (param $b i32), same line or separate - both are fine.",
    "Push each one with local.get before combining them: local.get $a then local.get $b.",
    "i32.add pops the top two stack values and pushes their sum - put it right after both local.get lines."
  ],
  "tests": [
    { "name": "add(2, 3) is 5", "code": "if (instance.exports.add(2, 3) !== 5) throw new Error('add(2, 3) should be 5, got ' + instance.exports.add(2, 3));" },
    { "name": "add(10, -3) is 7", "code": "if (instance.exports.add(10, -3) !== 7) throw new Error('add(10, -3) should be 7, got ' + instance.exports.add(10, -3));" },
    { "name": "add(0, 0) is 0", "code": "if (instance.exports.add(0, 0) !== 0) throw new Error('add(0, 0) should be 0, got ' + instance.exports.add(0, 0));" }
  ]
}
```
