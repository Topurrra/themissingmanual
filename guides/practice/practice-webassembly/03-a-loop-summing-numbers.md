---
title: "A local variable and a loop"
guide: practice-webassembly
phase: 3
summary: "Declare a mutable local, then loop with loop/br_if to sum integers from 1 to N - WAT has no for-loop keyword, so you build one from a block, a loop, and a conditional branch."
tags: [webassembly, wasm, wat, loop, local, br_if]
difficulty: intermediate
synonyms:
  - webassembly loop instruction
  - wat loop br_if
  - wasm sum numbers loop
updated: 2026-07-10
---

# A local variable and a loop

WAT has no `for` or `while` keyword. Instead you build loops out of three
lower-level pieces: `block`, `loop`, and a conditional branch (`br_if`).
That's a real jump in complexity from the last two lessons, so take this one
slow - once it clicks, every loop you write in WAT afterward is the same
shape.

`(local $name type)` declares a mutable local variable (separate from
params, though both use `local.get`/`local.set`). `local.set $name` pops the
top of the stack and stores it into that local - the write side of the
`local.get` you already know.

A `(loop $lbl ... )` doesn't repeat by itself - it runs its body **once**,
then falls through, unless something inside it branches back with
`(br $lbl)`. Wrapping the loop in a `(block $out ...)` gives you a second
target to jump *out* to: `(br_if $out condition)` pops a boolean-ish `i32`
off the stack and, if it's non-zero, exits straight to the end of `$out` -
that's your loop's exit condition. The pattern is always: check the exit
condition first (`br_if` out of the block), do the work, then
unconditionally `br` back to the top of the loop.

**Your task:** write a function exported as `"sumTo"` that takes one `i32`
parameter `n` and returns the sum of every integer from `1` to `n`
(inclusive) - `sumTo(5)` should be `1+2+3+4+5 = 15`.

**You'll practice:**

- `(local $name i32)` for a mutable variable, and `local.set` to write to it
- `block` + `loop` + `br_if` as WAT's building blocks for repetition
- `i32.gt_s` (signed greater-than) as the loop's exit test

```lesson
{
  "language": "wat",
  "check": "wat",
  "starterCode": ";; Export \"sumTo\": given n, return 1 + 2 + ... + n.\n(module\n  (func (export \"sumTo\") (param $n i32) (result i32)\n    (local $i i32)\n    (local $total i32)\n    ;; TODO: initialize $i to 1, loop while $i <= $n,\n    ;; adding $i to $total each time, then return $total.\n  )\n)",
  "solution": "(module\n  (func (export \"sumTo\") (param $n i32) (result i32)\n    (local $i i32)\n    (local $total i32)\n    (local.set $i (i32.const 1))\n    (local.set $total (i32.const 0))\n    (block $break\n      (loop $continue\n        (br_if $break (i32.gt_s (local.get $i) (local.get $n)))\n        (local.set $total (i32.add (local.get $total) (local.get $i)))\n        (local.set $i (i32.add (local.get $i) (i32.const 1)))\n        (br $continue)\n      )\n    )\n    (local.get $total)\n  )\n)",
  "hints": [
    "Set both locals first: $i to 1, $total to 0, using local.set (i32.const 1) etc. - the parenthesized form nests an instruction's stack-push right inside the call that consumes it.",
    "Wrap the loop in a block so you have somewhere to br_if out to: (block $break (loop $continue ... )).",
    "Exit test goes first inside the loop: (br_if $break (i32.gt_s (local.get $i) (local.get $n))) - jump out once i is past n.",
    "After the exit test: add $i to $total, increment $i by 1, then (br $continue) to jump back to the top of the loop. The final (local.get $total) after the block is the function's return value."
  ],
  "tests": [
    { "name": "sumTo(5) is 15", "code": "if (instance.exports.sumTo(5) !== 15) throw new Error('sumTo(5) should be 15, got ' + instance.exports.sumTo(5));" },
    { "name": "sumTo(1) is 1", "code": "if (instance.exports.sumTo(1) !== 1) throw new Error('sumTo(1) should be 1, got ' + instance.exports.sumTo(1));" },
    { "name": "sumTo(10) is 55", "code": "if (instance.exports.sumTo(10) !== 55) throw new Error('sumTo(10) should be 55, got ' + instance.exports.sumTo(10));" }
  ]
}
```
