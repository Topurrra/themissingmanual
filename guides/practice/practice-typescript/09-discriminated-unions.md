---
title: "Discriminated unions"
guide: practice-typescript
phase: 9
summary: "Give every member of a union a shared literal tag (kind), then switch on it - the standard TypeScript pattern for handling data that comes in several shapes."
tags: [typescript, discriminated-unions, tagged-unions, switch, narrowing]
difficulty: intermediate
synonyms:
  - discriminated union example typescript
  - tagged union switch on kind
  - typescript union with kind property
updated: 2026-07-18
---

# Discriminated unions

The last lesson told object shapes apart by *probing* them - "does it have a
url?" That works, but it's detective work. The cleaner design, used all over
production TypeScript, is to make every shape *introduce itself*: give each
member of the union a shared property (conventionally `kind` or `type`)
holding a unique literal string.

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };
```

This is a **discriminated union**, and `kind` is the discriminant. Now a
`switch` on `s.kind` does everything at once: each `case` is a clean branch,
TypeScript narrows `s` to exactly that member inside it (`s.radius` is only
legal in the circle case), and the runtime behavior is a simple string
comparison. Redux actions, API responses, parser tokens - this pattern is
how TypeScript codebases model "one of several things."

**Your task:** implement `area(s)` for the `Shape` union: circles are
`PI * radius^2`, rectangles are `width * height`.

**You'll practice:**

- Declaring a union whose members share a literal kind tag
- Switching on the discriminant, with narrowing per case

```lesson
{
  "language": "typescript",
  "starterCode": "type Shape =\n  | { kind: \"circle\"; radius: number }\n  | { kind: \"rect\"; width: number; height: number };\n\nfunction area(s: Shape): number {\n  // switch on s.kind: \"circle\" -> Math.PI * radius squared, \"rect\" -> width * height\n  return 0;\n}\n\nconst circleArea = area({ kind: \"circle\", radius: 2 });\nconst rectArea = area({ kind: \"rect\", width: 3, height: 4 });",
  "solution": "type Shape =\n  | { kind: \"circle\"; radius: number }\n  | { kind: \"rect\"; width: number; height: number };\n\nfunction area(s: Shape): number {\n  switch (s.kind) {\n    case \"circle\":\n      return Math.PI * s.radius * s.radius;\n    case \"rect\":\n      return s.width * s.height;\n  }\n}\n\nconst circleArea = area({ kind: \"circle\", radius: 2 });\nconst rectArea = area({ kind: \"rect\", width: 3, height: 4 });",
  "hints": ["switch (s.kind) with a case per tag: case \"circle\" and case \"rect\".", "Inside case \"circle\", s is narrowed to the circle member - s.radius exists; s.width does not.", "Circle area is Math.PI * s.radius * s.radius; the rect case is s.width * s.height."],
  "tests": [
    { "name": "rect area is width * height", "code": "if (rectArea !== 12) throw new Error('rect 3x4 should have area 12, got ' + rectArea);" },
    { "name": "circle area uses PI * r^2", "code": "if (Math.abs(circleArea - 12.566370614359172) > 0.0001) throw new Error('circle r=2 should be about 12.5664, got ' + circleArea);" },
    { "name": "works for other values too", "code": "if (area({ kind: 'rect', width: 5, height: 5 }) !== 25) throw new Error('rect 5x5 should be 25');" }
  ]
}
```
