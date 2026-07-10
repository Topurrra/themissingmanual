---
title: "Global flag: find and replace all"
guide: practice-regex
phase: 12
summary: "Add the g flag to .replace() to swap out EVERY match in a string, not just the first."
tags: [regex, global-flag, replace]
difficulty: intermediate
synonyms:
  - regex replace all javascript
  - g flag replace example
  - replace every match regex
  - string replace global flag
updated: 2026-07-10
---

# Global flag: find and replace all

`str.replace(pattern, replacement)` without the `g` flag stops after the
*first* match - the rest of the string is left untouched, even if the
pattern could match again later on. Add the `g` flag and `.replace()`
changes behavior: it swaps out *every* match it finds, in one pass.

This is the same `g` flag from the price-extraction capstone (Phase 7), but
paired with `.replace()` instead of `.match()` - there the goal was pulling
matches *out*, here it's swapping matches *out for something else*, like
redacting every phone number in a block of text with `***`.

**Your task:** write `redactFirstPhone(str)`, replacing only the *first*
phone number found in `str` with `"***"`, and `redactAllPhones(str)`,
replacing *every* phone number with `"***"`. A phone number looks like
`555-123-4567` - three digits, a dash, three digits, a dash, four digits.

**You'll practice:**

- Seeing `.replace()` stop after the first match without the `g` flag
- Adding `g` to replace every occurrence in one call

```lesson
{
  "language": "js",
  "starterCode": "// Write redactFirstPhone(str): replace only the FIRST \\d{3}-\\d{3}-\\d{4}\n// match with \"***\".\nfunction redactFirstPhone(str) {\n\n}\n\n// Write redactAllPhones(str): replace EVERY \\d{3}-\\d{3}-\\d{4} match with \"***\".\nfunction redactAllPhones(str) {\n\n}",
  "solution": "function redactFirstPhone(str) {\n  return str.replace(/\\d{3}-\\d{3}-\\d{4}/, '***');\n}\n\nfunction redactAllPhones(str) {\n  return str.replace(/\\d{3}-\\d{3}-\\d{4}/g, '***');\n}",
  "hints": ["Without g, .replace() stops after swapping out the first match it finds.", "Add g right after the closing / to make .replace() swap out every match instead of just the first.", "\\d{3}-\\d{3}-\\d{4} is the phone shape: 3 digits, dash, 3 digits, dash, 4 digits."],
  "tests": [
    { "name": "redactFirstPhone only replaces the first match", "code": "if (redactFirstPhone('Call 555-123-4567 or 555-987-6543') !== 'Call *** or 555-987-6543') throw new Error('redactFirstPhone should leave the second phone number untouched');" },
    { "name": "redactAllPhones replaces every match", "code": "if (redactAllPhones('Call 555-123-4567 or 555-987-6543') !== 'Call *** or ***') throw new Error('redactAllPhones should replace both phone numbers');" },
    { "name": "redactAllPhones leaves text with no phone numbers alone", "code": "if (redactAllPhones('No phones here') !== 'No phones here') throw new Error('redactAllPhones should return the string unchanged when nothing matches');" },
    { "name": "redactFirstPhone leaves text with no phone numbers alone", "code": "if (redactFirstPhone('No phones here') !== 'No phones here') throw new Error('redactFirstPhone should return the string unchanged when nothing matches');" }
  ]
}
```
