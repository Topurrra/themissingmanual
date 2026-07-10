---
title: "Union types and narrowing"
guide: practice-typescript
phase: 4
summary: "Type a value as one of several types with |, then use typeof to narrow it before acting."
tags: [typescript, union-types, type-guards, typeof]
difficulty: intermediate
synonyms:
  - typescript union type example
  - typescript typeof narrowing
  - typescript type guard
updated: 2026-07-10
---

# Union types and narrowing

`string | number` means "either a string or a number" - a union of two types.
A parameter typed `id: string | number` could genuinely be handed either one,
so before doing anything type-specific with it, you need to check which type
you actually got. That check is called a **type guard**, and the simplest one
is `typeof`:

```ts
if (typeof id === 'number') {
  // id is treated as a number here
}
```

Inside that `if`, the value is *narrowed* to just `number` - outside it, or in
an `else`, it's still the other option. This is the pattern that makes a union
type useful rather than just a wider hole to fall through.

**Your task:** write `formatId(id)` - if `id` is already a string, return it
unchanged; if it's a number, return it as a string prefixed with `#`.

**You'll practice:**

- Declaring a union type with `|`
- Narrowing a union with a `typeof` check

```lesson
{
  "language": "typescript",
  "starterCode": "// formatId returns a string id unchanged, but prefixes a numeric id with \"#\".\nfunction formatId(id: string | number): string {\n\n}\n\nconst a = formatId(\"abc123\");\nconst b = formatId(42);",
  "solution": "function formatId(id: string | number): string {\n  if (typeof id === 'number') return `#${id}`;\n  return id;\n}\n\nconst a = formatId(\"abc123\");\nconst b = formatId(42);",
  "hints": ["id: string | number means id could be either type - typeof id tells you which one you actually got.", "typeof id === 'number' narrows id to number inside that branch; the string case just falls through to the final return.", "a should be 'abc123' (unchanged); b should be '#42' (42 prefixed with #)."],
  "tests": [
    { "name": "a string id passes through unchanged", "code": "if (a !== 'abc123') throw new Error('a should be \"abc123\" unchanged');" },
    { "name": "a numeric id gets prefixed", "code": "if (b !== '#42') throw new Error('b should be \"#42\"');" },
    { "name": "works on another numeric id", "code": "if (formatId(7) !== '#7') throw new Error('formatId(7) should be \"#7\"');" }
  ]
}
```
