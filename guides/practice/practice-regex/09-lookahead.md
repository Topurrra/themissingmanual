---
title: "Lookahead"
guide: practice-regex
phase: 9
summary: "Check what comes next with (?=...) without including it in the match - a positive lookahead."
tags: [regex, lookahead, assertions]
difficulty: intermediate
synonyms:
  - regex lookahead example
  - positive lookahead javascript
  - regex match without consuming
  - what does ?= mean in regex
updated: 2026-07-10
---

# Lookahead

Every pattern so far *consumes* what it matches - the matched text becomes
part of the result. A **lookahead**, `(?=...)`, is different: it checks that
something comes next *without* consuming it. `/cat(?= food)/` only matches
`"cat"` when it's immediately followed by `" food"` - but the match itself is
still just `"cat"`, not `"cat food"`.

Lookahead is also how you check "does this string contain X *somewhere*"
without pinning down exactly where. `/^(?=.*\d)/` reads as: from the start,
look ahead for `.*\d` (anything, then a digit) - true if a digit exists
*anywhere* in the string, even though the lookahead itself matches zero
characters. This is the trick behind password rules like "must contain a
digit" - no loop, no scanning code, just a position check.

**Your task:** write `matchCatFood(str)`, returning `"cat"` if `str` contains
`"cat"` immediately followed by `" food"` (without including `" food"` in the
result), or `null` otherwise; and `hasDigitSomewhere(str)`, true if `str`
contains a digit anywhere.

**You'll practice:**

- Asserting what comes next with `(?=...)` without consuming it
- Using a lookahead to check "contains X somewhere" in one pattern

```lesson
{
  "language": "js",
  "starterCode": "// Write matchCatFood(str): \"cat\" if immediately followed by \" food\"\n// (without \" food\" in the result), or null.\nfunction matchCatFood(str) {\n\n}\n\n// Write hasDigitSomewhere(str): true if str contains a digit anywhere.\nfunction hasDigitSomewhere(str) {\n\n}",
  "solution": "function matchCatFood(str) {\n  const result = str.match(/cat(?= food)/);\n  return result ? result[0] : null;\n}\n\nfunction hasDigitSomewhere(str) {\n  return /^(?=.*\\d)/.test(str);\n}",
  "hints": ["(?= food) checks that \" food\" comes next without adding it to the match.", "str.match(/cat(?= food)/) returns null when \"cat\" isn't followed by \" food\".", "/^(?=.*\\d)/ scans ahead for any digit anywhere in the string - the lookahead itself matches zero characters."],
  "tests": [
    { "name": "matchCatFood matches when followed by food", "code": "if (matchCatFood('I fed the cat food') !== 'cat') throw new Error('matchCatFood(\"I fed the cat food\") should be \"cat\"');" },
    { "name": "matchCatFood rejects cat without food after it", "code": "if (matchCatFood('I have a cat') !== null) throw new Error('matchCatFood(\"I have a cat\") should be null - not followed by \" food\"');" },
    { "name": "hasDigitSomewhere finds a digit anywhere", "code": "if (hasDigitSomewhere('passw0rd') !== true) throw new Error('hasDigitSomewhere(\"passw0rd\") should be true');" },
    { "name": "hasDigitSomewhere rejects a string with no digits", "code": "if (hasDigitSomewhere('password') !== false) throw new Error('hasDigitSomewhere(\"password\") should be false - no digit present');" }
  ]
}
```
