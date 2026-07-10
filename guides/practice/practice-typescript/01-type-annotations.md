---
title: "Type annotations"
guide: practice-typescript
phase: 1
summary: "Add a type to a variable or a function's parameters and return value with a colon."
tags: [typescript, types, annotations, basics]
difficulty: beginner
synonyms:
  - typescript type annotations
  - typescript function types
  - typescript variable types
updated: 2026-07-10
---

# Type annotations

A type annotation is a colon followed by a type: `const width: number = 8;`
tells TypeScript (and anyone reading the code) that `width` will always hold a
number. Functions work the same way - `function area(w: number, h: number):
number` types each parameter and, after the closing `)`, the value the
function returns.

Annotations don't change what runs - they're erased before your code executes
(that's exactly what this playground's TypeScript step does: strip the types,
run the plain JavaScript underneath). Their job is to catch mistakes in your
editor, and to document what a function expects and hands back.

**Your task:** finish `area(w, h)` so it returns `w * h`, with `w`, `h`, and
the return value all typed as `number`.

**You'll practice:**

- Typing a variable with `: number`
- Typing function parameters and a return value

```lesson
{
  "language": "typescript",
  "starterCode": "const width: number = 8;\nconst height: number = 5;\n\n// Write area(w, h): number below - type w, h, and the return value as number.\nfunction area(w: number, h: number): number {\n\n}\n\nconst total = area(width, height);",
  "solution": "const width: number = 8;\nconst height: number = 5;\n\nfunction area(w: number, h: number): number {\n  return w * h;\n}\n\nconst total = area(width, height);",
  "hints": ["A type annotation goes after the name: const width: number = 8; function area(w: number, h: number): number { ... }.", "The body just returns w * h - the types don't change the logic, only what's allowed in.", "total should be 40 (8 * 5); area(3, 4) should also work and return 12."],
  "tests": [
    { "name": "total is width times height", "code": "if (total !== 40) throw new Error('total should be 40 (8 * 5)');" },
    { "name": "area works on other numbers", "code": "if (area(3, 4) !== 12) throw new Error('area(3, 4) should be 12');" }
  ]
}
```
