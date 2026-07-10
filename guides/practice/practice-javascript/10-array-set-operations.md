---
title: "Array set operations"
guide: practice-javascript
phase: 10
summary: "Find the items unique to one array with filter + includes, then remove duplicates from an array with a Set."
tags: [javascript, arrays, sets, filter, dedupe]
difficulty: intermediate
synonyms:
  - javascript array difference
  - remove duplicates javascript array
  - javascript dedupe array
  - filter includes javascript
updated: 2026-07-10
---

# Array set operations

Back in Phase 4 you used `.filter()` to narrow an array down by a condition.
The condition can just as easily be "is this missing from another array?" -
`a.filter((item) => !b.includes(item))` keeps only the items of `a` that
`b` doesn't have, which is exactly what a set difference is.

For duplicates, JavaScript's built-in `Set` does the work for you: a `Set`
can only ever hold one copy of each value, and it remembers the order things
were added in. Spread an array into a `Set` and back into an array -
`[...new Set(arr)]` - and you've deduplicated it in one line, first
occurrence kept, order preserved.

**Your task:** write `diff(a, b)`, returning the items in array `a` that are
NOT in array `b`, and `dedupe(arr)`, returning `arr` with duplicates removed,
keeping the order items first appeared in.

**You'll practice:**

- Filtering one array against the contents of another
- Deduplicating an array with a `Set`

```lesson
{
  "language": "js",
  "starterCode": "// Write diff(a, b): items in array a that are NOT in array b.\nfunction diff(a, b) {\n\n}\n\n// Write dedupe(arr): arr with duplicates removed, keeping first-occurrence order.\nfunction dedupe(arr) {\n\n}",
  "solution": "function diff(a, b) {\n  return a.filter((item) => !b.includes(item));\n}\n\nfunction dedupe(arr) {\n  return [...new Set(arr)];\n}",
  "hints": ["diff wants items from a where b does NOT include them: a.filter((item) => !b.includes(item))", "A Set only ever keeps one copy of each value, and remembers insertion order - spreading one back into an array is the whole trick for dedupe.", "[...new Set(arr)] turns arr into a Set (dropping duplicates) and back into an array in one line."],
  "tests": [
    { "name": "diff keeps items missing from b", "code": "if (JSON.stringify(diff([1, 2, 3, 4], [2, 4])) !== '[1,3]') throw new Error('diff([1,2,3,4], [2,4]) should be [1,3]');" },
    { "name": "diff works on strings", "code": "if (JSON.stringify(diff(['a', 'b', 'c'], ['b'])) !== '[\"a\",\"c\"]') throw new Error('diff([\"a\",\"b\",\"c\"], [\"b\"]) should be [\"a\",\"c\"]');" },
    { "name": "dedupe removes repeats and keeps order", "code": "if (JSON.stringify(dedupe([1, 2, 2, 3, 1, 4])) !== '[1,2,3,4]') throw new Error('dedupe([1,2,2,3,1,4]) should be [1,2,3,4]');" },
    { "name": "dedupe on an array with no duplicates", "code": "if (JSON.stringify(dedupe(['x', 'y', 'z'])) !== '[\"x\",\"y\",\"z\"]') throw new Error('dedupe with no duplicates should return the same order unchanged');" }
  ]
}
```
