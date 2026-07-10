---
title: "Backreferences"
guide: practice-regex
phase: 10
summary: "Reuse a captured group later in the SAME pattern with \\1, to require two pieces to match each other."
tags: [regex, backreferences, groups]
difficulty: intermediate
synonyms:
  - regex backreference example
  - what does 1 mean in regex
  - match repeated word regex
  - reuse capture group in pattern
updated: 2026-07-10
---

# Backreferences

Groups and capture (Phase 5) pull a piece of a match back out *after* the
match finishes. A **backreference**, `\1`, reuses a captured group *inside
the same pattern* - it says "whatever group 1 matched, match that exact text
again, right here."

`/\b(\w+)\s+\1\b/` reads as: capture a word, then require the *same* word
again after some whitespace. `"the the"` matches - group 1 captures `"the"`,
and `\1` demands another `"the"`. `"the cat"` doesn't match - `\1` needs
`"the"` again, but finds `"cat"`. You can't do this with a plain quantifier;
`\w+\s+\w+` would match *any* two words, not specifically two of the *same*
word.

**Your task:** write `hasRepeatedWord(str)`, true if `str` contains the same
word twice in a row (separated by whitespace), and `isDoubledString(str)`,
true if the *entire* string is some sequence of word characters repeated
exactly twice back-to-back (like `"abcabc"`), with nothing else around it.

**You'll practice:**

- Reusing a captured group with `\1` to require matching text
- Anchoring a backreference to check the whole string, not just part of it

```lesson
{
  "language": "js",
  "starterCode": "// Write hasRepeatedWord(str): true if the same word appears twice in a row.\nfunction hasRepeatedWord(str) {\n\n}\n\n// Write isDoubledString(str): true if the whole string is some sequence\n// of word characters repeated exactly twice back-to-back, e.g. \"abcabc\".\nfunction isDoubledString(str) {\n\n}",
  "solution": "function hasRepeatedWord(str) {\n  return /\\b(\\w+)\\s+\\1\\b/.test(str);\n}\n\nfunction isDoubledString(str) {\n  return /^(\\w+)\\1$/.test(str);\n}",
  "hints": ["(\\w+) captures a word; \\1 later in the pattern demands that exact same text again.", "\\b(\\w+)\\s+\\1\\b needs whitespace between the two copies - that's what makes it \"repeated word\", not just \"repeated letters\".", "^(\\w+)\\1$ has no whitespace between the copies and is anchored, so the whole string must be exactly two back-to-back copies of the same chunk."],
  "tests": [
    { "name": "hasRepeatedWord finds a doubled word", "code": "if (hasRepeatedWord('the the cat sat') !== true) throw new Error('hasRepeatedWord(\"the the cat sat\") should be true');" },
    { "name": "hasRepeatedWord rejects distinct words", "code": "if (hasRepeatedWord('the cat sat') !== false) throw new Error('hasRepeatedWord(\"the cat sat\") should be false - no word repeats');" },
    { "name": "isDoubledString accepts a doubled chunk", "code": "if (isDoubledString('abcabc') !== true) throw new Error('isDoubledString(\"abcabc\") should be true - \"abc\" repeated twice');" },
    { "name": "isDoubledString rejects a non-doubled string", "code": "if (isDoubledString('abcd') !== false) throw new Error('isDoubledString(\"abcd\") should be false - not two equal halves');" }
  ]
}
```
