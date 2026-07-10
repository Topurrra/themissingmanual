---
title: "Groups and capture"
guide: practice-regex
phase: 5
summary: "Wrap part of a pattern in () to capture it, then pull it back out by index or by name."
tags: [regex, groups, capture, named-groups]
difficulty: intermediate
synonyms:
  - regex capture groups
  - regex named groups example
  - extract text with regex javascript
  - regexp match groups
updated: 2026-07-10
---

# Groups and capture

Parentheses `(...)` **group** part of a pattern - and also **capture** what
matched there, so you can pull it back out. `str.match(/Hello, (\w+)!/)`
returns an array where `[0]` is the whole match and `[1]` is whatever the
first group captured.

Naming a group makes this easier to read: `(?<year>\d{4})` captures the same
thing but stores it under `match.groups.year` instead of a numbered index.
This is how you turn "did it match" into "here's the piece I actually wanted."

**Your task:** write `capturedName(str)`, returning the name captured from a
greeting shaped like `"Hello, Ada!"` (or `null` if it doesn't match), and
`parseDate(dateStr)`, returning `{ year, month, day }` (each a string) parsed
from a date shaped like `"2026-07-10"` using named groups (or `null` if it
doesn't match).

**You'll practice:**

- Capturing part of a match with `(...)` and reading it from the match array
- Naming a group with `(?<name>...)` and reading `match.groups.name`

```lesson
{
  "language": "js",
  "starterCode": "// Write capturedName(str): the name in \"Hello, <name>!\", or null.\nfunction capturedName(str) {\n\n}\n\n// Write parseDate(dateStr): { year, month, day } from \"YYYY-MM-DD\", or null.\nfunction parseDate(dateStr) {\n\n}",
  "solution": "function capturedName(str) {\n  const result = str.match(/Hello, (\\w+)!/);\n  return result ? result[1] : null;\n}\n\nfunction parseDate(dateStr) {\n  const result = dateStr.match(/^(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})$/);\n  return result ? result.groups : null;\n}",
  "hints": ["result[1] holds whatever the first (...) group captured.", "A named group (?<year>\\d{4}) shows up as result.groups.year.", "result.groups is already the shape { year, month, day } once each named group matches."],
  "tests": [
    { "name": "capturedName pulls the name out", "code": "if (capturedName('Hello, Ada!') !== 'Ada') throw new Error('capturedName(\"Hello, Ada!\") should be \"Ada\"');" },
    { "name": "capturedName works for a different name", "code": "if (capturedName('Hello, Bob!') !== 'Bob') throw new Error('capturedName(\"Hello, Bob!\") should be \"Bob\"');" },
    { "name": "parseDate returns the named pieces", "code": "if (JSON.stringify(parseDate('2026-07-10')) !== JSON.stringify({ year: '2026', month: '07', day: '10' })) throw new Error('parseDate(\"2026-07-10\") should be { year: \"2026\", month: \"07\", day: \"10\" }');" },
    { "name": "parseDate rejects the wrong shape", "code": "if (parseDate('07-10-2026') !== null) throw new Error('parseDate(\"07-10-2026\") should be null - wrong shape');" }
  ]
}
```
