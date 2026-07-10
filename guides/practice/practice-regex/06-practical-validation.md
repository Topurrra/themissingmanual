---
title: "Practical validation"
guide: practice-regex
phase: 6
summary: "Combine character classes, quantifiers, and anchors into one real-world shape check: a username."
tags: [regex, validation, username, combining]
difficulty: intermediate
synonyms:
  - regex validate username
  - combine regex anchors and quantifiers
  - practical regex example
  - regex shape validation
updated: 2026-07-10
---

# Practical validation

Real validation is rarely one trick - it's the pieces from the last five
lessons, stacked. A username shape like "3 to 16 characters, must start with
a letter, everything after can be a letter, digit, or underscore" reads
directly as a regex once you know the vocabulary: an anchor to demand the
whole string, a class for the first character, `\w` for the rest, and a
quantifier for the count.

`^[a-zA-Z]\w{2,15}$` - start, one letter, then 2 to 15 more word characters,
end. That's a minimum total length of 3 and a maximum of 16. Same idea as the
guide's "perfect email regex is a trap" warning: aim for a shape that's
good enough and readable, not one that tries to catch everything.

**Your task:** write `isValidUsername(str)`, true if `str` is 3-16 characters,
starts with a letter, and contains only letters, digits, or underscores after
that.

**You'll practice:**

- Combining a character class, a quantifier, and anchors in one pattern
- Reading a multi-part regex left to right as a sentence

```lesson
{
  "language": "js",
  "starterCode": "// Write isValidUsername(str): 3-16 chars, starts with a letter,\n// then only letters/digits/underscores.\nfunction isValidUsername(str) {\n\n}",
  "solution": "function isValidUsername(str) {\n  return /^[a-zA-Z]\\w{2,15}$/.test(str);\n}",
  "hints": ["[a-zA-Z] matches exactly one letter for the first character.", "\\w{2,15} covers the rest: 2 to 15 more letters/digits/underscores, giving a total length of 3-16.", "Wrap it in ^...$ so the whole string has to match this shape, not just part of it."],
  "tests": [
    { "name": "accepts a normal username", "code": "if (isValidUsername('ada99') !== true) throw new Error('isValidUsername(\"ada99\") should be true');" },
    { "name": "accepts the shortest valid length", "code": "if (isValidUsername('a_1') !== true) throw new Error('isValidUsername(\"a_1\") should be true (3 characters, starts with a letter)');" },
    { "name": "rejects starting with a digit", "code": "if (isValidUsername('9ada') !== false) throw new Error('isValidUsername(\"9ada\") should be false - must start with a letter');" },
    { "name": "rejects too-short strings", "code": "if (isValidUsername('ab') !== false) throw new Error('isValidUsername(\"ab\") should be false - only 2 characters');" }
  ]
}
```
