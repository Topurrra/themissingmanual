---
title: "Literal matching and .test()"
guide: practice-regex
phase: 1
summary: "Write your first regex literal and ask it a yes/no question with .test()."
tags: [regex, literals, test, basics]
difficulty: beginner
synonyms:
  - javascript regex test method
  - regex literal syntax
  - regexp.test example
  - check if string matches regex
updated: 2026-07-10
---

# Literal matching and .test()

A regex in JavaScript is written between slashes: `/cat/` is a pattern, not a
string. Most characters inside it are **literals** - they match themselves,
letter for letter. Once you have a pattern, `pattern.test(str)` asks the
simplest possible question: does this shape appear *anywhere* in `str`? It
returns `true` or `false` - nothing else.

By default a match can happen anywhere in the string, not just at the start,
and it's case-sensitive - `/cat/` matches inside `"concatenate"` just as
happily as inside `"a cat sat"`, but never matches `"CAT"`.

**Your task:** write `hasCat(str)`, returning whether `str` contains the
literal text `"cat"` anywhere, using a regex and `.test()`.

**You'll practice:**

- Writing a regex literal with `/.../`
- Checking a match with `.test()`
- Regex matches are case-sensitive and match anywhere by default

```lesson
{
  "language": "js",
  "starterCode": "// Write hasCat(str): true if str contains \"cat\" anywhere.\nfunction hasCat(str) {\n\n}",
  "solution": "function hasCat(str) {\n  return /cat/.test(str);\n}",
  "hints": ["A regex literal looks like /cat/ - no quotes.", "Call .test(str) on the regex to get true or false back.", "Matching is case-sensitive and happens anywhere in the string, so \"concatenate\" counts."],
  "tests": [
    { "name": "hasCat finds a standalone word", "code": "if (hasCat('I have a cat') !== true) throw new Error('hasCat(\"I have a cat\") should be true');" },
    { "name": "hasCat finds cat inside a longer word", "code": "if (hasCat('concatenate') !== true) throw new Error('hasCat(\"concatenate\") should be true - cat matches anywhere');" },
    { "name": "hasCat is false with no match", "code": "if (hasCat('I have a dog') !== false) throw new Error('hasCat(\"I have a dog\") should be false');" },
    { "name": "hasCat is case-sensitive", "code": "if (hasCat('CAT scan') !== false) throw new Error('hasCat(\"CAT scan\") should be false - matching is case-sensitive');" }
  ]
}
```
