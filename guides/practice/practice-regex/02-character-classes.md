---
title: "Character classes"
guide: practice-regex
phase: 2
summary: "Match a kind of character instead of one exact character, with \\d and your own [...] class."
tags: [regex, character-classes, digits, brackets]
difficulty: beginner
synonyms:
  - regex character class
  - what does backslash d mean in regex
  - regex square brackets
  - match any digit regex
updated: 2026-07-10
---

# Character classes

A literal like `/cat/` matches one exact sequence. A **character class**
matches *any one* character from a set instead. `\d` means "any digit" -
`0`-`9` - and it stands for exactly one character, not a whole number; to
match `"2026"` you'd need four of them in a row (more on that next lesson).

You can also build your own class with square brackets: `[aeiou]` means "any
one of these vowels," and matches the first one it finds anywhere in the
string.

**Your task:** write `hasDigit(str)`, true if `str` contains any digit
(`\d`), and `hasVowel(str)`, true if `str` contains any vowel (`[aeiou]`).

**You'll practice:**

- Matching any digit with `\d`
- Matching a custom set of characters with `[...]`

```lesson
{
  "language": "js",
  "starterCode": "// Write hasDigit(str): true if str contains any digit.\nfunction hasDigit(str) {\n\n}\n\n// Write hasVowel(str): true if str contains any of a, e, i, o, u.\nfunction hasVowel(str) {\n\n}",
  "solution": "function hasDigit(str) {\n  return /\\d/.test(str);\n}\n\nfunction hasVowel(str) {\n  return /[aeiou]/.test(str);\n}",
  "hints": ["\\d inside a regex matches any single digit 0-9.", "[aeiou] matches any one of those characters, wherever it appears.", "Both are just .test() calls, same as the last lesson."],
  "tests": [
    { "name": "hasDigit finds a digit in a word", "code": "if (hasDigit('room7') !== true) throw new Error('hasDigit(\"room7\") should be true');" },
    { "name": "hasDigit is false with no digits", "code": "if (hasDigit('no numbers here') !== false) throw new Error('hasDigit(\"no numbers here\") should be false');" },
    { "name": "hasVowel finds a vowel", "code": "if (hasVowel('cat') !== true) throw new Error('hasVowel(\"cat\") should be true (the a)');" },
    { "name": "hasVowel is false with no vowels", "code": "if (hasVowel('rhythm') !== false) throw new Error('hasVowel(\"rhythm\") should be false');" }
  ]
}
```
