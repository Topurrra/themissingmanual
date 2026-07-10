---
title: "Roman numeral converter"
guide: practice-javascript
phase: 12
summary: "Convert a number to a roman numeral with a lookup table and greedy subtraction - including the subtractive cases like IV and XC."
tags: [javascript, algorithms, lookup-table, loops]
difficulty: intermediate
synonyms:
  - roman numeral javascript
  - number to roman numeral converter
  - javascript lookup table algorithm
updated: 2026-07-10
---

# Roman numeral converter

Roman numerals map cleanly onto a **lookup table** plus **greedy
subtraction**: pair every symbol with its numeric value, walk the table from
biggest to smallest, and for each pair keep subtracting the value (and
appending the symbol) for as long as the remaining number is big enough.

The only wrinkle is the subtractive cases - `4` is `"IV"`, not `"IIII"`, and
`9` is `"IX"`, not `"VIIII"`. The clean fix is to put those combined symbols
right in the table alongside the plain ones (`90 -> "XC"`, `40 -> "XL"`,
`9 -> "IX"`, `4 -> "IV"`), in order from largest to smallest. The same greedy
loop handles them automatically - no special-casing needed.

**Your task:** write `toRoman(n)` for `n` from `1` to `100`, converting `n`
to its roman numeral string.

**You'll practice:**

- Building and walking a lookup table in priority order
- Greedy subtraction to consume a number down to zero

```lesson
{
  "language": "js",
  "starterCode": "// Write toRoman(n): convert a number (1-100) to a roman numeral string.\n// e.g. toRoman(9) === \"IX\", toRoman(58) === \"LVIII\"\nfunction toRoman(n) {\n\n}",
  "solution": "function toRoman(n) {\n  const table = [\n    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],\n    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']\n  ];\n  let result = '';\n  for (const [value, symbol] of table) {\n    while (n >= value) {\n      result += symbol;\n      n -= value;\n    }\n  }\n  return result;\n}",
  "hints": ["Build a lookup table from biggest to smallest, including the subtractive pairs: 90 -> \"XC\", 40 -> \"XL\", 9 -> \"IX\", 4 -> \"IV\".", "Walk the table in order. For each [value, symbol] pair, keep subtracting value from n and appending symbol for as long as n >= value.", "By the time you reach the end of the table, n is 0 and result holds the full roman numeral - the greedy largest-first subtraction is what makes this work."],
  "tests": [
    { "name": "handles single-symbol numbers", "code": "if (toRoman(1) !== 'I') throw new Error('toRoman(1) should be \"I\"'); if (toRoman(3) !== 'III') throw new Error('toRoman(3) should be \"III\"');" },
    { "name": "handles the subtractive cases", "code": "if (toRoman(4) !== 'IV') throw new Error('toRoman(4) should be \"IV\"'); if (toRoman(9) !== 'IX') throw new Error('toRoman(9) should be \"IX\"'); if (toRoman(40) !== 'XL') throw new Error('toRoman(40) should be \"XL\"'); if (toRoman(90) !== 'XC') throw new Error('toRoman(90) should be \"XC\"');" },
    { "name": "handles a mixed multi-symbol number", "code": "if (toRoman(58) !== 'LVIII') throw new Error('toRoman(58) should be \"LVIII\"');" },
    { "name": "handles the top of the range", "code": "if (toRoman(99) !== 'XCIX') throw new Error('toRoman(99) should be \"XCIX\"'); if (toRoman(100) !== 'C') throw new Error('toRoman(100) should be \"C\"');" }
  ]
}
```
