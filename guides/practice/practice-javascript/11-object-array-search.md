---
title: "Object + array combined search"
guide: practice-javascript
phase: 11
summary: "Filter an array of objects by every key/value pair in a criteria object, combining array methods with property access."
tags: [javascript, arrays, objects, filter, search]
difficulty: intermediate
synonyms:
  - filter array of objects javascript
  - search array of objects by properties
  - match object properties javascript
updated: 2026-07-10
---

# Object + array combined search

Real data is usually an array of objects - a list of people, products,
orders. Searching it means combining two things you already know: `.filter()`
from Phase 4 to narrow the array, and property access from Phase 5 to look
inside each object.

The one new piece is checking *several* properties at once. `criteria` is a
plain object like `{ age: 30, city: "London" }`, and you want to keep only
the items that match every key in it. `Object.keys(criteria)` gives you that
list of keys to check, and `.every()` returns `true` only if all of them
match - exactly the "match everything" rule the task needs.

**Your task:** write `findMatching(list, criteria)`, returning every object in
the `list` array whose properties match ALL key/value pairs in the plain
object `criteria`.

**You'll practice:**

- Reading `Object.keys()` off a plain object
- Combining `.filter()` and `.every()` to require every condition to match

```lesson
{
  "language": "js",
  "starterCode": "// Write findMatching(list, criteria): return every object in the list array\n// whose properties match ALL key/value pairs in criteria.\n// e.g. findMatching(people, { age: 30 }) returns everyone aged 30.\nfunction findMatching(list, criteria) {\n\n}",
  "solution": "function findMatching(list, criteria) {\n  return list.filter((item) =>\n    Object.keys(criteria).every((key) => item[key] === criteria[key])\n  );\n}",
  "hints": ["Object.keys(criteria) gives you the list of properties to check.", ".every() on that key list returns true only if EVERY key matches - exactly the \"match all\" rule the task needs.", "Combine both inside list.filter(): keep an item only when every key in criteria equals the same key on that item."],
  "tests": [
    { "name": "matches on a single key", "code": "const people = [{ name: 'Ada', age: 30, city: 'London' }, { name: 'Grace', age: 40, city: 'NYC' }, { name: 'Linus', age: 30, city: 'Helsinki' }]; const result = findMatching(people, { age: 30 }); if (result.length !== 2 || result[0].name !== 'Ada' || result[1].name !== 'Linus') throw new Error('findMatching(people, { age: 30 }) should return Ada and Linus');" },
    { "name": "matches on multiple keys at once", "code": "const people = [{ name: 'Ada', age: 30, city: 'London' }, { name: 'Grace', age: 40, city: 'NYC' }, { name: 'Linus', age: 30, city: 'Helsinki' }]; const result = findMatching(people, { age: 30, city: 'London' }); if (result.length !== 1 || result[0].name !== 'Ada') throw new Error('findMatching(people, { age: 30, city: \"London\" }) should return only Ada');" },
    { "name": "returns an empty array when nothing matches", "code": "const people = [{ name: 'Ada', age: 30, city: 'London' }]; const result = findMatching(people, { city: 'Mars' }); if (result.length !== 0) throw new Error('findMatching should return [] when no item matches every criteria key');" }
  ]
}
```
