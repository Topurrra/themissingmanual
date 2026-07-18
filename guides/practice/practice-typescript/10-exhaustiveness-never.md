---
title: "Exhaustiveness with never"
guide: practice-typescript
phase: 10
summary: "Make a switch over a discriminated union refuse to silently ignore a case: a default branch that hands the value to a never-typed function, throwing loudly for anything unhandled."
tags: [typescript, never, exhaustiveness, discriminated-unions, switch]
difficulty: advanced
synonyms:
  - typescript never exhaustive switch
  - assertnever pattern example
  - exhaustiveness checking discriminated union
updated: 2026-07-18
---

# Exhaustiveness with never

Last lesson's `area` handled circles and rects. Six months from now someone
adds `triangle` to the `Shape` union - and every `switch` over shapes in the
codebase is suddenly incomplete. The dangerous version fails *silently*:
the new shape falls through, returns `undefined`, and the bug surfaces three
screens later as `NaN`.

The fix is the **assertNever pattern**: a default branch that passes the
value to a function declared to accept `never` - the type with no values:

```ts
function assertNever(value: never): never {
  throw new Error("Unhandled kind: " + JSON.stringify(value));
}
```

It works on two levels. At *compile* time, if every case is handled, the
value reaching `default` has type `never`, and the call type-checks; miss a
case and the leftover type doesn't fit `never` - a red squiggle right at the
switch. At *runtime* (which is what this playground grades - remember,
types are stripped before execution), anything unhandled hits the default
and **throws immediately**, with the offending value in the message. Loud
and close to the cause, instead of silent and far away.

**Your task:** the `Shape` union has grown a `triangle`
(`base`, `height` - area is `base * height / 2`). The switch doesn't handle
it yet, so triangles currently fall into `assertNever` and throw. Add the
`triangle` case. The default stays - it's the tripwire for the *next* shape
someone adds.

**You'll practice:**

- Reading and keeping the assertNever exhaustiveness tripwire
- Extending a discriminated union switch without losing its safety net

```lesson
{
  "language": "typescript",
  "starterCode": "type Shape =\n  | { kind: \"circle\"; radius: number }\n  | { kind: \"rect\"; width: number; height: number }\n  | { kind: \"triangle\"; base: number; height: number };\n\nfunction assertNever(value: never): never {\n  throw new Error(\"Unhandled kind: \" + JSON.stringify(value));\n}\n\nfunction area(s: Shape): number {\n  switch (s.kind) {\n    case \"circle\":\n      return Math.PI * s.radius * s.radius;\n    case \"rect\":\n      return s.width * s.height;\n    // triangle is missing - right now it falls through to assertNever and throws\n    default:\n      return assertNever(s as never);\n  }\n}\n\nconst triArea = area({ kind: \"triangle\", base: 6, height: 4 });",
  "solution": "type Shape =\n  | { kind: \"circle\"; radius: number }\n  | { kind: \"rect\"; width: number; height: number }\n  | { kind: \"triangle\"; base: number; height: number };\n\nfunction assertNever(value: never): never {\n  throw new Error(\"Unhandled kind: \" + JSON.stringify(value));\n}\n\nfunction area(s: Shape): number {\n  switch (s.kind) {\n    case \"triangle\":\n      return (s.base * s.height) / 2;\n    case \"circle\":\n      return Math.PI * s.radius * s.radius;\n    case \"rect\":\n      return s.width * s.height;\n    default:\n      return assertNever(s as never);\n  }\n}\n\nconst triArea = area({ kind: \"triangle\", base: 6, height: 4 });",
  "hints": ["Add case \"triangle\" alongside the existing cases - its area is (s.base * s.height) / 2.", "Don't delete the default branch: it's what makes the NEXT missing shape throw loudly instead of returning undefined.", "Run it: before your fix, the starter itself throws 'Unhandled kind' the moment it computes triArea."],
  "tests": [
    { "name": "triangle area works", "code": "if (triArea !== 12) throw new Error('triangle base 6 height 4 should be 12, got ' + triArea);" },
    { "name": "existing shapes still work", "code": "if (area({ kind: 'rect', width: 3, height: 4 }) !== 12) throw new Error('rect 3x4 should still be 12');" },
    { "name": "unhandled kinds still throw loudly", "code": "let threw = false; try { area({ kind: 'hexagon', size: 2 }); } catch (e) { threw = true; } if (!threw) throw new Error('an unhandled kind should throw via assertNever, not return silently');" }
  ]
}
```
