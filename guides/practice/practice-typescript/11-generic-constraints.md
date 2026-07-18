---
title: "Generic constraints"
guide: practice-typescript
phase: 11
summary: "Constrain a generic with extends so the function can rely on a capability - T can be anything, as long as it has the property the code actually uses."
tags: [typescript, generics, constraints, extends]
difficulty: advanced
synonyms:
  - typescript generic extends constraint
  - t extends object with property
  - constrain generic type parameter
updated: 2026-07-18
---

# Generic constraints

Lesson 5's `first<T>` worked for *any* type because its body never touched
the elements - `arr[0]` needs nothing from `T`. But most useful generic
functions do need *something*: a function picking the most recently updated
item must read `.updated` - and an unconstrained `T` promises nothing, so
TypeScript refuses the read.

The middle ground between "any type" and "one exact type" is a
**constraint**:

```ts
function newest<T extends { updated: number }>(items: T[]): T {
```

`T extends { updated: number }` reads as: T can be anything, *as long as* it
has a numeric `updated`. Blog posts, files, user records - all welcome, each
keeping its own full type. The payoff is in the return: callers get back
their *complete* item type, not some stripped-down `{ updated: number }` -
`newest(posts).title` works, because `T` remembered it was a post all along.

**Your task:** implement `newest(items)`: given a non-empty array of items
that each have a numeric `updated` timestamp, return the item with the
largest `updated`.

**You'll practice:**

- Writing T extends { ... } constraints
- Relying on the constrained capability inside the body while preserving the full type

```lesson
{
  "language": "typescript",
  "starterCode": "// Return the item with the largest .updated - for ANY item type that has one.\nfunction newest<T extends { updated: number }>(items: T[]): T {\n\n}\n\nconst posts = [\n  { title: \"Intro\", updated: 100 },\n  { title: \"Deep dive\", updated: 300 },\n  { title: \"Errata\", updated: 200 },\n];\nconst files = [\n  { path: \"/a.txt\", size: 10, updated: 5 },\n  { path: \"/b.txt\", size: 20, updated: 9 },\n];\n\nconst newestPost = newest(posts);\nconst newestFile = newest(files);",
  "solution": "function newest<T extends { updated: number }>(items: T[]): T {\n  let best = items[0];\n  for (const item of items) {\n    if (item.updated > best.updated) best = item;\n  }\n  return best;\n}\n\nconst posts = [\n  { title: \"Intro\", updated: 100 },\n  { title: \"Deep dive\", updated: 300 },\n  { title: \"Errata\", updated: 200 },\n];\nconst files = [\n  { path: \"/a.txt\", size: 10, updated: 5 },\n  { path: \"/b.txt\", size: 20, updated: 9 },\n];\n\nconst newestPost = newest(posts);\nconst newestFile = newest(files);",
  "hints": ["Start with the first item as the best-so-far, then loop and replace it whenever item.updated is larger.", "The constraint is what makes item.updated legal to read - an unconstrained T promises no properties at all.", "Return the whole winning item, not its .updated - callers want the post or the file back, timestamps included."],
  "tests": [
    { "name": "finds the most recent post", "code": "if (newestPost.title !== 'Deep dive') throw new Error('newest post should be Deep dive (updated 300), got ' + newestPost.title);" },
    { "name": "same function works on files", "code": "if (newestFile.path !== '/b.txt') throw new Error('newest file should be /b.txt (updated 9), got ' + newestFile.path);" },
    { "name": "returns the whole item, not the timestamp", "code": "if (typeof newestPost !== 'object' || newestPost.updated !== 300) throw new Error('newest should return the full item object');" }
  ]
}
```
