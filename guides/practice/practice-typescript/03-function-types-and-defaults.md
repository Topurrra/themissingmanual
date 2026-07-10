---
title: "Function types and default params"
guide: practice-typescript
phase: 3
summary: "Type a function as a value, and give a parameter a default so it's optional to call with."
tags: [typescript, function-types, default-parameters, optional-parameters]
difficulty: beginner
synonyms:
  - typescript function type syntax
  - typescript default parameter
  - typescript optional parameter
updated: 2026-07-10
---

# Function types and default params

A parameter can have a default value - `b: number = 2` means "if the caller
leaves this out, use 2." That's real, runtime behavior (not erased like a type
annotation): calling `multiply(4)` really does use `b = 2`.

You can also write a type for a function itself, when the function is stored
in a variable or passed around: `(a: number, b: number) => number` describes
"a function taking two numbers and returning one." Any function matching that
shape - like `multiply` - can be assigned to a variable with that type.

**Your task:** write `multiply(a, b)` where `b` defaults to `2`, then declare
`operation` as a typed function variable pointing at `multiply`.

**You'll practice:**

- Giving a parameter a default value
- Writing a function-type annotation for a variable

```lesson
{
  "language": "typescript",
  "starterCode": "// multiply(a, b): b should default to 2 when omitted.\nfunction multiply(a: number, b: number = 2): number {\n\n}\n\n// Type operation as a function taking two numbers and returning a number.\nconst operation: (a: number, b: number) => number = multiply;\n\nconst doubled = operation(5);\nconst custom = operation(5, 3);",
  "solution": "function multiply(a: number, b: number = 2): number {\n  return a * b;\n}\n\nconst operation: (a: number, b: number) => number = multiply;\n\nconst doubled = operation(5);\nconst custom = operation(5, 3);",
  "hints": ["b: number = 2 gives b a default - call multiply(4) with only one argument and b is filled in automatically.", "The function-type annotation (a: number, b: number) => number just describes multiply's shape - assign multiply to operation as-is.", "doubled should be 10 (5 * 2, default b); custom should be 15 (5 * 3)."],
  "tests": [
    { "name": "doubled uses the default", "code": "if (doubled !== 10) throw new Error('doubled should be 10 (5 * default 2)');" },
    { "name": "custom overrides the default", "code": "if (custom !== 15) throw new Error('custom should be 15 (5 * 3)');" },
    { "name": "multiply itself defaults b", "code": "if (multiply(4) !== 8) throw new Error('multiply(4) should be 8 (4 * default 2)');" }
  ]
}
```
