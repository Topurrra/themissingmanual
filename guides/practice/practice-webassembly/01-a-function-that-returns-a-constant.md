---
title: "A function that returns a constant"
guide: practice-webassembly
phase: 1
summary: "Write your first WebAssembly Text function - export a value and meet the module/func/export syntax that every WAT program is built from."
tags: [webassembly, wasm, wat, functions, exports]
difficulty: beginner
synonyms:
  - webassembly text format basics
  - wat module syntax
  - wasm export function
updated: 2026-07-10
---

# A function that returns a constant

Every language you've probably used compiles down to *something* the
machine understands, but you never see it - the JavaScript engine or the
Python interpreter hides that step from you. WebAssembly is different: it has
a real binary format the browser runs directly (no interpreter standing in
the way, the same way a `.exe` runs directly), and it also has an official
**text format** you can read and write by hand - **WAT** (WebAssembly Text).
Think of WAT as "the assembly language of the web": it's the human-readable
face of the exact binary instructions your browser executes.

WAT looks unlike most languages you've written: everything is a parenthesized
expression, prefix-style, like `(i32.add (i32.const 2) (i32.const 3))`
instead of `2 + 3`. Under the hood, WebAssembly is **stack-based** - an
instruction like `i32.const 42` doesn't assign 42 to a variable, it *pushes*
42 onto an internal stack, and later instructions pop values off that stack
to work with them. You'll feel this stack model directly starting next
lesson; this one keeps it simple with a single push.

Every WAT program lives inside a `(module ...)` - the top-level container,
like a `.wasm` file's contents. Inside it, `(func ...)` declares a function,
and `(export "name")` makes that function callable from JavaScript under
`"name"` - this is exactly how the grader (and any real web page) reaches
into your compiled module and calls what you wrote.

**Your task:** write a function exported as `"answer"` that takes no
parameters and returns the 32-bit integer (`i32`) value `42`.

**You'll practice:**

- The `(module ...)` / `(func ...)` / `(export "...")` skeleton every WAT program starts from
- Declaring a function's return type with `(result i32)`
- Pushing a literal value with `i32.const`

```lesson
{
  "language": "wat",
  "check": "wat",
  "starterCode": ";; Export a function called \"answer\" that takes no\n;; parameters and returns the i32 value 42.\n(module\n  ;; TODO: add your (func (export \"answer\") ...) here\n)",
  "solution": "(module\n  (func (export \"answer\") (result i32)\n    i32.const 42))",
  "hints": [
    "A function goes inside the module: (func (export \"answer\") (result i32) ...).",
    "(result i32) declares the function returns a 32-bit integer - it doesn't compute anything by itself.",
    "i32.const 42 pushes the number 42 onto the stack - whatever's on the stack when the function ends is what it returns."
  ],
  "tests": [
    { "name": "answer() returns 42", "code": "if (instance.exports.answer() !== 42) throw new Error('answer() should return 42, got ' + instance.exports.answer());" },
    { "name": "answer is exported and callable with no arguments", "code": "if (typeof instance.exports.answer !== 'function') throw new Error('Expected an exported function called \"answer\".');" }
  ]
}
```
