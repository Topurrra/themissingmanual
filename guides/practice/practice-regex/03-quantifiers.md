---
title: "Quantifiers"
guide: practice-regex
phase: 3
summary: "Say how many with + and {n,m}, and pull the actual matched text out with .match()."
tags: [regex, quantifiers, match, repeats]
difficulty: beginner
synonyms:
  - regex quantifiers plus star
  - regex n m repeat count
  - javascript string match method
  - how many times regex repeat
updated: 2026-07-10
---

# Quantifiers

A character class matches one position. A **quantifier** right after it says
how many times it may repeat: `+` means "one or more," `{n,m}` means "between
n and m times." `\d+` matches a whole run of digits, however long - not just
one.

`str.match(regex)` (no `g` flag) returns an array whose first item, `match[0]`,
is the matched text - or `null` if nothing matched. That's how you get the
*actual text* a pattern found, not just true/false.

**Your task:** write `matchDigits(str)`, returning the first run of one or
more digits found in `str` (or `null` if there isn't one), and `matchCode(str)`,
returning the first run of 2 to 4 digits found (or `null`).

**You'll practice:**

- Matching a repeat with `+` (one or more)
- Matching a count range with `{n,m}`
- Extracting matched text with `.match()`

```lesson
{
  "language": "js",
  "starterCode": "// Write matchDigits(str): the first run of 1+ digits found, or null.\nfunction matchDigits(str) {\n\n}\n\n// Write matchCode(str): the first run of 2 to 4 digits found, or null.\nfunction matchCode(str) {\n\n}",
  "solution": "function matchDigits(str) {\n  const result = str.match(/\\d+/);\n  return result ? result[0] : null;\n}\n\nfunction matchCode(str) {\n  const result = str.match(/\\d{2,4}/);\n  return result ? result[0] : null;\n}",
  "hints": ["str.match(/\\d+/) returns an array or null - use result ? result[0] : null.", "\\d{2,4} means 2 to 4 digits in a row; it's greedy, so it grabs as many as it can up to 4.", "If str has fewer digits in a row than the minimum, match() returns null."],
  "tests": [
    { "name": "matchDigits grabs a short run", "code": "if (matchDigits('room 7') !== '7') throw new Error('matchDigits(\"room 7\") should be \"7\"');" },
    { "name": "matchDigits grabs a longer run", "code": "if (matchDigits('year 2026') !== '2026') throw new Error('matchDigits(\"year 2026\") should be \"2026\"');" },
    { "name": "matchCode caps at 4 digits", "code": "if (matchCode('code 123456') !== '1234') throw new Error('matchCode(\"code 123456\") should be \"1234\" (max 4 digits)');" },
    { "name": "matchCode needs at least 2 digits", "code": "if (matchCode('code 7') !== null) throw new Error('matchCode(\"code 7\") should be null - only one digit present');" }
  ]
}
```
