---
title: "Caesar cipher"
guide: practice-javascript
phase: 13
summary: "Shift every letter in a string forward by a fixed amount, wrapping around the alphabet and leaving everything else untouched."
tags: [javascript, strings, char-codes, cipher, regex]
difficulty: intermediate
synonyms:
  - caesar cipher javascript
  - shift letters javascript
  - charCodeAt example
  - string cipher algorithm
updated: 2026-07-10
---

# Caesar cipher

Every character has a numeric code - `"a".charCodeAt(0)` is `97`, `"z"` is
`122`. Subtract the code of `"a"` (or `"A"` for uppercase) from a letter's
code and you get its position in the alphabet, `0` through `25`. Shift that
position, wrap it with `% 26` so it stays in range, and add the base code
back to get the new letter.

`str.replace(/[a-zA-Z]/g, fn)` is the piece that ties it together: the `g`
flag runs `fn` on every letter in the string, one at a time, and anything
that isn't a letter - spaces, punctuation, digits - passes through untouched
because the pattern never matches it.

**Your task:** write `encode(str, shift)`, shifting every letter in `str`
forward by `shift` places in the alphabet, wrapping from `z` back to `a`
(and `Z` to `A`), preserving each letter's case, and leaving non-letters
exactly as they are.

**You'll practice:**

- Converting between a character and its alphabet position with char codes
- Replacing every match in a string with `.replace(/.../g, fn)`

```lesson
{
  "language": "js",
  "starterCode": "// Write encode(str, shift): shift every LETTER in str forward by shift\n// places in the alphabet, wrapping around from z to a. Preserve case,\n// and leave anything that is not a letter (spaces, punctuation) untouched.\nfunction encode(str, shift) {\n\n}",
  "solution": "function encode(str, shift) {\n  return str.replace(/[a-zA-Z]/g, (ch) => {\n    const base = ch === ch.toUpperCase() ? 65 : 97;\n    return String.fromCharCode((((ch.charCodeAt(0) - base + shift) % 26) + 26) % 26 + base);\n  });\n}",
  "hints": ["str.replace(/[a-zA-Z]/g, fn) runs fn on every letter and leaves everything else (spaces, punctuation) exactly as it is.", "Each letter's code minus its alphabet base (65 for 'A', 97 for 'a') gives you a 0-25 position you can shift and wrap with % 26.", "Add 26 before the final % 26 so negative shifts (or shift > 26) still wrap correctly instead of producing a negative character code."],
  "tests": [
    { "name": "shifts lowercase letters forward", "code": "if (encode('abc', 1) !== 'bcd') throw new Error('encode(\"abc\", 1) should be \"bcd\"');" },
    { "name": "wraps around from z to a", "code": "if (encode('xyz', 3) !== 'abc') throw new Error('encode(\"xyz\", 3) should be \"abc\"');" },
    { "name": "preserves case, spaces, and punctuation", "code": "if (encode('Hello, World!', 5) !== 'Mjqqt, Btwqi!') throw new Error('encode(\"Hello, World!\", 5) should be \"Mjqqt, Btwqi!\"');" },
    { "name": "shift of 0 leaves the string unchanged", "code": "if (encode('Stay Put.', 0) !== 'Stay Put.') throw new Error('encode with shift 0 should return the same string');" }
  ]
}
```
