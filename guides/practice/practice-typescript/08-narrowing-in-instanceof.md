---
title: "Narrowing with in and instanceof"
guide: practice-typescript
phase: 8
summary: "Branch on a union of object types using the in operator and instanceof - the narrowing tools for when typeof only says 'object'."
tags: [typescript, narrowing, type-guards, unions]
difficulty: intermediate
synonyms:
  - typescript in operator narrowing
  - instanceof type guard example
  - narrow union of object types
  - typeof object narrowing not working
updated: 2026-07-18
---

# Narrowing with in and instanceof

Lesson 4 narrowed a `string | number` union with `typeof`. But `typeof` has a
blind spot: for a `Date`, a plain object, an array - it answers `"object"`
for all of them. A union of object types needs sharper questions:

- **`instanceof`** asks "was this built by that class?" - the right check
  for class instances like `Date`.
- **`in`** asks "does this object have that property?" - the right check for
  plain object shapes: `"url" in value` is true only for the member of the
  union that carries a `url`.

Inside each branch, TypeScript narrows the type - and at runtime, the same
checks route each value to code that can actually handle it. One function,
three shapes, no crashes:

```ts
function describe(value: string | Date | { url: string }): string {
  // typeof for the primitive, instanceof for the class, in for the shape
}
```

**Your task:** complete `describe` so it returns `"text: "` plus the string
for strings, `"year: "` plus the full year for Dates, and `"link: "` plus
the url for link objects.

**You'll practice:**

- instanceof as a runtime check and a type narrower
- The in operator for telling object shapes apart

```lesson
{
  "language": "typescript",
  "starterCode": "function describe(value: string | Date | { url: string }): string {\n  if (typeof value === \"string\") return \"text: \" + value;\n  // Add a branch for Date (instanceof) returning \"year: \" + the full year,\n  // and a branch for the link object (in) returning \"link: \" + the url.\n  return \"unknown\";\n}\n\nconst a = describe(\"hello\");\nconst b = describe(new Date(2030, 0, 1));\nconst c = describe({ url: \"https://example.com\" });",
  "solution": "function describe(value: string | Date | { url: string }): string {\n  if (typeof value === \"string\") return \"text: \" + value;\n  if (value instanceof Date) return \"year: \" + value.getFullYear();\n  if (\"url\" in value) return \"link: \" + value.url;\n  return \"unknown\";\n}\n\nconst a = describe(\"hello\");\nconst b = describe(new Date(2030, 0, 1));\nconst c = describe({ url: \"https://example.com\" });",
  "hints": ["typeof new Date() is just \"object\" - that's why the Date branch needs value instanceof Date instead.", "For the plain object, ask about its property: if (\"url\" in value) - quotes around the property name.", "Inside the Date branch, value.getFullYear() gives the year; inside the in branch, value.url is safe to read."],
  "tests": [
    { "name": "strings take the text branch", "code": "if (a !== 'text: hello') throw new Error('describe(\"hello\") should be \"text: hello\", got ' + a);" },
    { "name": "Dates take the instanceof branch", "code": "if (b !== 'year: 2030') throw new Error('describe(new Date(2030, 0, 1)) should be \"year: 2030\", got ' + b);" },
    { "name": "link objects take the in branch", "code": "if (c !== 'link: https://example.com') throw new Error('link object should give \"link: https://example.com\", got ' + c);" }
  ]
}
```
