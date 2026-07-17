---
title: "Fix the bug: the pattern that accepts junk"
guide: practice-regex
phase: 14
summary: "The validator below says 'abc12345xyz' is a valid postcode. Find out why a pattern that looks right accepts garbage, and fix it."
tags: [regex, anchors, validation, debugging]
difficulty: intermediate
synonyms:
  - regex validation accepts wrong input
  - why does my regex match too much
  - regex anchors required for validation
  - regex test returns true unexpectedly
updated: 2026-07-16
---

# Fix the bug: the pattern that accepts junk

Every other lesson asked you to write a pattern from scratch. Real work is more
often the opposite: a pattern is already there, it looks correct, and it is
quietly wrong.

This one is the most common regex bug there is, and the nastiest kind: it fails
by saying **yes**. `isPostcode` is supposed to accept exactly five digits and
nothing else. Run it and it happily accepts `abc12345xyz`. Nothing throws, no
error appears - the function just returns `true` for input it should reject.
A validator that says yes too easily is how bad data gets into a database.

The reason is that `.test()` asks "does this pattern appear **anywhere** in the
string?", not "is the string **exactly** this pattern?" You met the fix in
phase 4.

**Your task:** run the code, look at what it returns for the junk input, and
fix `isPostcode` so it accepts a five-digit postcode and rejects everything
else.

**You'll practice:**

- Reading a silent wrong answer instead of waiting for an error
- Anchoring a pattern so it has to match the whole string

```lesson
{
  "language": "js",
  "starterCode": "// This is broken: it accepts junk. Run it, look at the second line, and fix isPostcode.\nfunction isPostcode(str) {\n  return /\\d{5}/.test(str);\n}\n\nconsole.log('12345        ->', isPostcode('12345'));\nconsole.log('abc12345xyz  ->', isPostcode('abc12345xyz'));\nconsole.log('123456       ->', isPostcode('123456'));",
  "solution": "function isPostcode(str) {\n  return /^\\d{5}$/.test(str);\n}\n\nconsole.log('12345        ->', isPostcode('12345'));\nconsole.log('abc12345xyz  ->', isPostcode('abc12345xyz'));\nconsole.log('123456       ->', isPostcode('123456'));",
  "hints": [
    "Run it first. '12345' is right, but look at what the other two lines print - the pattern is finding five digits somewhere inside a longer string and calling that a match.",
    ".test() returns true if the pattern matches any part of the string. You need to say that the five digits are the whole string, start to finish.",
    "Anchor both ends: ^ pins the match to the start, $ pins it to the end. /^\\d{5}$/ can only match a string that is exactly five digits."
  ],
  "tests": [
    { "name": "accepts a real five-digit postcode", "code": "if (isPostcode('12345') !== true) throw new Error(\"isPostcode('12345') should be true\");" },
    { "name": "rejects digits buried in junk", "code": "if (isPostcode('abc12345xyz') !== false) throw new Error(\"isPostcode('abc12345xyz') should be false - the digits must be the whole string\");" },
    { "name": "rejects too many digits", "code": "if (isPostcode('123456') !== false) throw new Error(\"isPostcode('123456') should be false - six digits is not five\");" },
    { "name": "rejects too few digits", "code": "if (isPostcode('123') !== false) throw new Error(\"isPostcode('123') should be false\");" }
  ]
}
```
