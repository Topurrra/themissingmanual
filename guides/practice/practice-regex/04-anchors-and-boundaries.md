---
title: "Anchors and boundaries"
guide: practice-regex
phase: 4
summary: "Pin a match to a position instead of a character, with ^ $ for the whole string and \\b for a whole word."
tags: [regex, anchors, word-boundary, position]
difficulty: beginner
synonyms:
  - regex caret and dollar sign
  - regex word boundary b
  - match whole string regex
  - match whole word not substring regex
updated: 2026-07-10
---

# Anchors and boundaries

Lesson 1's `hasCat` matched `"cat"` inside `"concatenate"` - because by
default a match can happen anywhere. **Anchors** fix that by pinning a match
to a *position* instead of a character: `^` means "start of the string," `$`
means "end of the string." Wrap a pattern in `^...$` and it must match the
*entire* string, not just some piece of it.

`\b` is a smaller version of the same idea: a **word boundary**, the edge
between a word character and a non-word character (or the edge of the
string). `/\bcat\b/` matches `"cat"` as a whole word - in `"the cat sat"` -
but not the `cat` buried inside `"category"`.

**Your task:** write `isWholeNumber(str)`, true only if the *entire* string is
one or more digits, and `hasWord(str)`, true if `str` contains `"cat"` as a
whole word (not as part of a longer word).

**You'll practice:**

- Anchoring a whole-string match with `^` and `$`
- Matching a whole word (not a substring) with `\b`

```lesson
{
  "language": "js",
  "starterCode": "// Write isWholeNumber(str): true only if str is entirely digits.\nfunction isWholeNumber(str) {\n\n}\n\n// Write hasWord(str): true if str contains \"cat\" as a whole word.\nfunction hasWord(str) {\n\n}",
  "solution": "function isWholeNumber(str) {\n  return /^\\d+$/.test(str);\n}\n\nfunction hasWord(str) {\n  return /\\bcat\\b/.test(str);\n}",
  "hints": ["^\\d+$ means: start, one or more digits, then end - nothing else allowed.", "Without ^ and $, \\d+ would match just the digit part of a longer string.", "\\bcat\\b matches \"cat\" only when a word boundary sits on both sides of it."],
  "tests": [
    { "name": "isWholeNumber accepts an all-digit string", "code": "if (isWholeNumber('2026') !== true) throw new Error('isWholeNumber(\"2026\") should be true');" },
    { "name": "isWholeNumber rejects trailing text", "code": "if (isWholeNumber('2026 AD') !== false) throw new Error('isWholeNumber(\"2026 AD\") should be false - not the whole string');" },
    { "name": "hasWord matches a standalone word", "code": "if (hasWord('the cat sat') !== true) throw new Error('hasWord(\"the cat sat\") should be true');" },
    { "name": "hasWord rejects a substring match", "code": "if (hasWord('category error') !== false) throw new Error('hasWord(\"category error\") should be false - cat is not a whole word there');" }
  ]
}
```
