---
title: "Capstone: typed inventory lookup"
guide: practice-typescript
phase: 6
summary: "Combine an interface, a union return type, and a generic helper in one small program."
tags: [typescript, capstone, interfaces, generics, union-types]
difficulty: intermediate
synonyms:
  - typescript capstone project
  - typescript practice project
  - typescript interface generic example
updated: 2026-07-10
---

# Capstone: typed inventory lookup

Everything so far comes together here: an `interface` for the shape of an
item, a function whose return type is a union (`Item | undefined`, since a
lookup might not find anything), and a generic helper that works regardless
of what's in the array.

`array.find(fn)` returns the first item where `fn` returns true, or
`undefined` if none match - which is exactly what an `Item | undefined`
return type promises the caller: check before assuming you got a real item
back.

**Your task:** define `Item` with `id: number` and `name: string`, write
`findItem(items, id)` returning the matching item or `undefined`, and a
generic `count(arr)` returning `arr.length`.

**You'll practice:**

- Combining an interface with a union return type
- Writing a generic helper that works on any array

```lesson
{
  "language": "typescript",
  "starterCode": "interface Item {\n  id: number;\n  name: string;\n}\n\n// findItem returns the matching item, or undefined if no id matches.\nfunction findItem(items: Item[], id: number): Item | undefined {\n\n}\n\n// count works on an array of any type.\nfunction count<T>(arr: T[]): number {\n\n}\n\nconst inventory: Item[] = [\n  { id: 1, name: \"Mouse\" },\n  { id: 2, name: \"Keyboard\" },\n];\n\nconst found = findItem(inventory, 2);\nconst missing = findItem(inventory, 99);\nconst total = count(inventory);",
  "solution": "interface Item {\n  id: number;\n  name: string;\n}\n\nfunction findItem(items: Item[], id: number): Item | undefined {\n  return items.find((item) => item.id === id);\n}\n\nfunction count<T>(arr: T[]): number {\n  return arr.length;\n}\n\nconst inventory: Item[] = [\n  { id: 1, name: \"Mouse\" },\n  { id: 2, name: \"Keyboard\" },\n];\n\nconst found = findItem(inventory, 2);\nconst missing = findItem(inventory, 99);\nconst total = count(inventory);",
  "hints": ["items.find((item) => item.id === id) returns the matching item, or undefined if none match - exactly what Item | undefined promises.", "count<T> doesn't need to know what T is - arr.length works the same regardless of what's inside the array.", "found.name should be 'Keyboard' (id 2); missing should be undefined (no id 99); total should be 2."],
  "tests": [
    { "name": "findItem finds the matching item", "code": "if (!found || found.name !== 'Keyboard') throw new Error('found.name should be \"Keyboard\" (id 2)');" },
    { "name": "findItem returns undefined when nothing matches", "code": "if (missing !== undefined) throw new Error('missing should be undefined (no id 99)');" },
    { "name": "count matches the inventory length", "code": "if (total !== 2) throw new Error('total should be 2');" },
    { "name": "count works generically", "code": "if (count(['a', 'b', 'c']) !== 3) throw new Error('count([\\'a\\',\\'b\\',\\'c\\']) should be 3');" }
  ]
}
```
