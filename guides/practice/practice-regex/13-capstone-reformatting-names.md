---
title: "Capstone: reformatting names"
guide: practice-regex
phase: 13
summary: "Use capture groups and $1/$2 in a replacement string to swap \"Last, First\" names into \"First Last\"."
tags: [regex, capstone, capture-groups, replace]
difficulty: intermediate
synonyms:
  - regex replace with capture groups
  - reformat string javascript regex
  - dollar 1 dollar 2 replace
  - swap name order regex
updated: 2026-07-10
---

# Capstone: reformatting names

Everything from this batch comes together here. Capture groups (Phase 5)
pull pieces out of a match; `.replace()`'s replacement string can refer back
to them with `$1`, `$2`, and so on - so you can rebuild the matched text in a
*different order*, not just swap it for something fixed.

`"Ada, Lovelace".replace(/(\w+), (\w+)/, "$2 $1")` captures `"Ada"` as group
1 and `"Lovelace"` as group 2, then rebuilds the replacement as `$2` followed
by `$1`: `"Lovelace Ada"`. The pattern found the shape; the replacement
string reordered the pieces it captured.

**Your task:** write `reformatName(str)`, converting a single `"Last, First"`
name to `"First Last"`, and `reformatNames(list)`, applying that same
reformat to every name in an array (reuse `reformatName` inside `.map()`).

**You'll practice:**

- Referring to captured groups in a replacement string with `$1`/`$2`
- Reusing a single-string regex function across a list with `.map()`

```lesson
{
  "language": "js",
  "starterCode": "// Write reformatName(str): \"Last, First\" -> \"First Last\".\nfunction reformatName(str) {\n\n}\n\n// Write reformatNames(list): apply reformatName to every name in list.\nfunction reformatNames(list) {\n\n}",
  "solution": "function reformatName(str) {\n  return str.replace(/(\\w+), (\\w+)/, '$2 $1');\n}\n\nfunction reformatNames(list) {\n  return list.map(reformatName);\n}",
  "hints": ["(\\w+), (\\w+) captures the last name as group 1 and the first name as group 2.", "In the replacement string, $2 $1 puts group 2 first and group 1 second - swapping their order.", "list.map(reformatName) reuses the single-string function across every item in the array."],
  "tests": [
    { "name": "reformatName swaps a last-first pair", "code": "if (reformatName('Lovelace, Ada') !== 'Ada Lovelace') throw new Error('reformatName(\"Lovelace, Ada\") should be \"Ada Lovelace\"');" },
    { "name": "reformatName works for a different name", "code": "if (reformatName('Turing, Alan') !== 'Alan Turing') throw new Error('reformatName(\"Turing, Alan\") should be \"Alan Turing\"');" },
    { "name": "reformatNames reformats every name in the list", "code": "if (JSON.stringify(reformatNames(['Lovelace, Ada', 'Turing, Alan'])) !== JSON.stringify(['Ada Lovelace', 'Alan Turing'])) throw new Error('reformatNames should reformat every name in the list');" },
    { "name": "reformatNames handles an empty list", "code": "if (JSON.stringify(reformatNames([])) !== JSON.stringify([])) throw new Error('reformatNames([]) should be []');" }
  ]
}
```
