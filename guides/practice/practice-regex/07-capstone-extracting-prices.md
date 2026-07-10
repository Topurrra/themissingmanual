---
title: "Capstone: extracting prices"
guide: practice-regex
phase: 7
summary: "Pull every dollar amount out of a messy paragraph with a global regex and str.match()."
tags: [regex, capstone, global-flag, extraction]
difficulty: intermediate
synonyms:
  - regex extract all matches
  - javascript match global flag
  - find all prices in text regex
  - regex g flag example
updated: 2026-07-10
---

# Capstone: extracting prices

Everything so far finds *one* match. Add the `g` (global) flag and
`str.match(regex)` changes behavior: instead of an array with capture-group
details, it returns every match found in the string, in order - or `null` if
there are none.

This is the shape of real text-extraction work: a messy paragraph, a pattern
for the *piece* you want, and a loop-free way to pull out every occurrence.

**Your task:** write `extractPrices(text)`, returning an array of every dollar
amount found in `text` (like `"$4"` or `"$19.99"`), in the order they appear.
Return an empty array if none are found. A price is a `$` followed by one or
more digits, optionally followed by a decimal point and exactly two digits.

**You'll practice:**

- Finding every match with the `g` flag
- Handling `match()`'s `null` result when nothing matches
- Combining `\$`, `\d+`, and an optional group into one pattern

```lesson
{
  "language": "js",
  "starterCode": "// Write extractPrices(text): every \"$<digits>\" or \"$<digits>.<2 digits>\"\n// found in text, in order, as an array. Empty array if none found.\nfunction extractPrices(text) {\n\n}",
  "solution": "function extractPrices(text) {\n  const matches = text.match(/\\$\\d+(\\.\\d{2})?/g);\n  return matches || [];\n}",
  "hints": ["\\$ escapes the dollar sign - a bare $ is the end-of-string anchor.", "(\\.\\d{2})? makes the decimal part optional: a dot plus exactly two digits, or nothing.", "With the g flag, match() returns null (not []) when there's no match at all - normalize that yourself."],
  "tests": [
    { "name": "extracts a mix of whole and decimal prices", "code": "if (JSON.stringify(extractPrices('Coffee is $4 and a bagel is $2.50.')) !== JSON.stringify(['$4', '$2.50'])) throw new Error('extractPrices should return [\"$4\", \"$2.50\"]');" },
    { "name": "returns an empty array with no prices", "code": "if (JSON.stringify(extractPrices('Everything is free today!')) !== JSON.stringify([])) throw new Error('extractPrices should return [] when nothing matches');" },
    { "name": "extracts three prices in order", "code": "if (JSON.stringify(extractPrices('Prices: $19.99, $5, $100.00')) !== JSON.stringify(['$19.99', '$5', '$100.00'])) throw new Error('extractPrices should return [\"$19.99\", \"$5\", \"$100.00\"]');" },
    { "name": "stops the decimal part at one digit", "code": "if (JSON.stringify(extractPrices('Only $3.5 today')) !== JSON.stringify(['$3'])) throw new Error('extractPrices(\"Only $3.5 today\") should be [\"$3\"] - the decimal group needs exactly 2 digits');" }
  ]
}
```
