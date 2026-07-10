---
title: "Generics"
guide: practice-typescript
phase: 5
summary: "Write one function that works with any type, using a generic type parameter."
tags: [typescript, generics, functions]
difficulty: intermediate
synonyms:
  - typescript generic function example
  - typescript generic type parameter
  - typescript T placeholder type
updated: 2026-07-10
---

# Generics

Without generics, a "return the first element" function would need typing
per array type: one for `number[]`, another for `string[]`. A generic
function instead declares a placeholder type name - conventionally `T` -
right after its own name, then uses `T` anywhere a real type would go:

```ts
function first<T>(arr: T[]): T {
  return arr[0];
}
```

`T` isn't a real type - it's filled in per call. `first([10, 20, 30])` fills
`T` with `number`; `first(["a", "b"])` fills it with `string`. The body never
needs to know which - `arr[0]` works identically either way.

**Your task:** write `first(arr)` so it returns the first element of any
array, typed generically.

**You'll practice:**

- Declaring a generic type parameter with `<T>`
- Using `T` in a parameter and return type

```lesson
{
  "language": "typescript",
  "starterCode": "// Write first<T>(arr: T[]): T, returning the first element of any array.\nfunction first<T>(arr: T[]): T {\n\n}\n\nconst firstNum = first([10, 20, 30]);\nconst firstWord = first([\"a\", \"b\", \"c\"]);",
  "solution": "function first<T>(arr: T[]): T {\n  return arr[0];\n}\n\nconst firstNum = first([10, 20, 30]);\nconst firstWord = first([\"a\", \"b\", \"c\"]);",
  "hints": ["<T> right after the function name declares the placeholder type; arr: T[] means an array of that type.", "The body doesn't need to know what T is - arr[0] returns the first element the same way regardless.", "firstNum should be 10, firstWord should be 'a'."],
  "tests": [
    { "name": "works on a number array", "code": "if (firstNum !== 10) throw new Error('firstNum should be 10');" },
    { "name": "works on a string array", "code": "if (firstWord !== 'a') throw new Error('firstWord should be \"a\"');" },
    { "name": "works on any other array", "code": "if (first([true, false]) !== true) throw new Error('first([true, false]) should be true');" }
  ]
}
```
