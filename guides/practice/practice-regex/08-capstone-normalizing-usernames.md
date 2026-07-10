---
title: "Capstone: normalizing usernames"
guide: practice-regex
phase: 8
summary: "Filter a list down to valid usernames with regex, then normalize what's left with .toLowerCase()."
tags: [regex, capstone, filter, normalize]
difficulty: intermediate
synonyms:
  - regex filter array of strings
  - validate and normalize list javascript
  - regex real world example
  - clean up user input list
updated: 2026-07-10
---

# Capstone: normalizing usernames

The last lesson validated one username. Real input arrives as a batch - a
signup list, an import file, a CSV column - and the job is usually "keep the
valid ones, and clean them up." Regex answers the first half; ordinary array
methods answer the second.

`array.filter(fn)` keeps only the items where `fn` returns true; `array.map(fn)`
transforms what's left. Chain them and a messy list becomes exactly the
usernames you can actually store: valid, and consistently lowercased.

**Your task:** write `normalizeUsernames(list)`, returning only the valid
usernames from `list` (3-16 characters, starts with a letter, only letters,
digits, or underscores after that - same shape as the last lesson), each
converted to lowercase, in their original order.

**You'll practice:**

- Reusing a validation regex inside `.filter()`
- Chaining `.filter()` and `.map()` to clean up a list

```lesson
{
  "language": "js",
  "starterCode": "// Write normalizeUsernames(list): keep only valid usernames (3-16 chars,\n// starts with a letter, then letters/digits/underscores), lowercased.\nfunction normalizeUsernames(list) {\n\n}",
  "solution": "function normalizeUsernames(list) {\n  return list\n    .filter((name) => /^[a-zA-Z]\\w{2,15}$/.test(name))\n    .map((name) => name.toLowerCase());\n}",
  "hints": ["Reuse the same shape from the last lesson: /^[a-zA-Z]\\w{2,15}$/.", "list.filter((name) => ...) keeps only the names where the regex matches.", "Chain .map((name) => name.toLowerCase()) on the filtered result to normalize case."],
  "tests": [
    { "name": "keeps valid names and drops invalid ones", "code": "if (JSON.stringify(normalizeUsernames(['Ada99', '9bob', 'Cy_Borg', 'ab'])) !== JSON.stringify(['ada99', 'cy_borg'])) throw new Error('normalizeUsernames should return [\"ada99\", \"cy_borg\"]');" },
    { "name": "drops too-short and symbol-only entries", "code": "if (JSON.stringify(normalizeUsernames(['X', 'Neo123', '!!!'])) !== JSON.stringify(['neo123'])) throw new Error('normalizeUsernames should return [\"neo123\"]');" },
    { "name": "handles an empty list", "code": "if (JSON.stringify(normalizeUsernames([])) !== JSON.stringify([])) throw new Error('normalizeUsernames([]) should be []');" },
    { "name": "lowercases a single valid entry", "code": "if (JSON.stringify(normalizeUsernames(['Valid_User1'])) !== JSON.stringify(['valid_user1'])) throw new Error('normalizeUsernames([\"Valid_User1\"]) should be [\"valid_user1\"]');" }
  ]
}
```
