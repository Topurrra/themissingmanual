---
title: "Capstone: max of four values"
guide: practice-webassembly
phase: 5
summary: "Combine everything so far - write a helper function and call it from another function - to find the largest of four fixed parameters, since WAT has no beginner-friendly array type to loop over."
tags: [webassembly, wasm, wat, functions, call, capstone]
difficulty: advanced
synonyms:
  - webassembly capstone exercise
  - wat function calling another function
  - wasm call instruction
updated: 2026-07-10
---

# Capstone: max of four values

One piece you haven't used yet: a WAT function can call *another* function
in the same module with `call $name`, exactly like `max(x, y)` would in any
other language - arguments get pushed on the stack first, `call` pops them
off, runs the target function, and pushes its result back. This is how real
WAT programs stay readable instead of turning into one giant flat function.

There's a reason this capstone asks for four *separate parameters* instead
of an array: WebAssembly's core instruction set doesn't have arrays or
lists - those are things higher-level languages that compile *to*
WebAssembly (like Rust or C) build on top of linear memory, which is a topic
of its own. Plain WAT works with individual `i32`/`i64`/`f32`/`f64` values
and function calls, which is exactly enough for this exercise.

**Your task:** write a function exported as `"max4"` that takes four `i32`
parameters and returns the largest of the four. Do it by writing a small
`max2`-style helper function (not exported - it doesn't need to be, only
`max4` does) and calling it twice, then once more on the two results -
exactly the `max` you already wrote in the last lesson, reused three times.

**You'll practice:**

- `call $name` to invoke another function in the same module
- Splitting a problem into a small helper plus a function that composes it
- Everything from the last four lessons, combined: params, comparison, `if`/`else`, and now `call`

```lesson
{
  "language": "wat",
  "check": "wat",
  "starterCode": ";; Export \"max4\": return the largest of four i32 params.\n;; Write a small (unexported) max2 helper first, then call it\n;; from max4 to combine four values two at a time.\n(module\n  ;; TODO: (func $max2 ...) - not exported, just a helper\n  ;; TODO: (func (export \"max4\") ...) - calls $max2 three times\n)",
  "solution": "(module\n  (func $max2 (param $a i32) (param $b i32) (result i32)\n    (if (result i32) (i32.gt_s (local.get $a) (local.get $b))\n      (then (local.get $a))\n      (else (local.get $b))\n    )\n  )\n  (func (export \"max4\") (param $a i32) (param $b i32) (param $c i32) (param $d i32) (result i32)\n    (call $max2\n      (call $max2 (local.get $a) (local.get $b))\n      (call $max2 (local.get $c) (local.get $d))\n    )\n  )\n)",
  "hints": [
    "Write $max2 first - it's exactly the max function from the last lesson, just without (export \"...\") since max4 is the only thing that needs to call it.",
    "call $max2 needs its two arguments already pushed - nesting them as (call $max2 (local.get $a) (local.get $b)) pushes both in order, then calls.",
    "max4(a,b,c,d) is max(max(a,b), max(c,d)): (call $max2 (call $max2 a b) (call $max2 c d))."
  ],
  "tests": [
    { "name": "max4(3, 9, 1, 7) is 9", "code": "if (instance.exports.max4(3, 9, 1, 7) !== 9) throw new Error('max4(3, 9, 1, 7) should be 9, got ' + instance.exports.max4(3, 9, 1, 7));" },
    { "name": "max4(1, 2, 3, 4) is 4", "code": "if (instance.exports.max4(1, 2, 3, 4) !== 4) throw new Error('max4(1, 2, 3, 4) should be 4, got ' + instance.exports.max4(1, 2, 3, 4));" },
    { "name": "max4(-5, -1, -9, -3) is -1", "code": "if (instance.exports.max4(-5, -1, -9, -3) !== -1) throw new Error('max4(-5, -1, -9, -3) should be -1, got ' + instance.exports.max4(-5, -1, -9, -3));" }
  ]
}
```
