---
title: "Fix the bug: map(parseInt) quietly returns the wrong numbers"
guide: practice-javascript
phase: 19
summary: "The code runs, prints four numbers, and never errors. Two of them are wrong: product 11 came back as product 3. What map hands its callback is doing it."
tags: [javascript, map, parseint, callbacks, arity, debugging]
difficulty: advanced
synonyms:
  - map parseint returns nan
  - why does map parseint give wrong numbers
  - javascript array map parseint radix
  - parseint second argument radix map
  - convert array of strings to numbers javascript
  - map passes index to callback
updated: 2026-07-17
---

# Fix the bug: map(parseInt) quietly returns the wrong numbers

The compare form on your shop posts back the ids of whatever boxes the customer
checked. Checkboxes hand you strings, so you convert them to numbers before you
look each product up. `values.map(parseInt)` reads like plain English, and it
runs without a single error.

Then read what it printed. The customer checked products 4, 8, 11 and 2. You
got back `4, NaN, 3, 2`. Half of them are right, which is exactly what makes
this one dangerous: nothing crashed, nothing warned you, and product 11 quietly
became product 3. That is a real product page, for a real product, that nobody
asked for.

`map` is not broken and neither is `parseInt`. The bug lives in the handoff
between them: in what `map` actually passes to the function you handed it, and
in what `parseInt` does with an argument it never asked for. Notice that the
first id came back fine and the second is not a number at all. One function gave
four different kinds of answer to four similar strings, so whatever changes from
item to item is your suspect.

**Your task:** fix `toIds` so every string in `values` becomes the number it
looks like: `["4", "8", "11", "2"]` returns `[4, 8, 11, 2]`.

**You'll practice:**

- Checking a plausible-looking result value by value instead of glancing at it
- Seeing what `map` really passes to its callback, and what happens when the
  function you passed it accepts more than one argument

```lesson
{
  "language": "js",
  "starterCode": "// This prints the wrong product ids and never errors. Find out why, then fix toIds.\nfunction toIds(values) {\n  return values.map(parseInt);\n}\n\nconst selected = [\"4\", \"8\", \"11\", \"2\"];\nconsole.log(\"Comparing products: \" + toIds(selected).join(\", \"));",
  "solution": "function toIds(values) {\n  return values.map((v) => parseInt(v, 10));\n}\n\nconst selected = [\"4\", \"8\", \"11\", \"2\"];\nconsole.log(\"Comparing products: \" + toIds(selected).join(\", \"));",
  "hints": [
    "Run it and line the values up one at a time. You put in \"4\", \"8\", \"11\", \"2\" and got back 4, NaN, 3, 2. The first is right, the second is not a number at all, the third came back as 3, the fourth is right. Nothing threw, so the strings are fine - the same function is answering differently depending on where the string sits in the array.",
    "map does not call your callback with one argument. It calls it with three: (value, index, array). And parseInt's second parameter is the radix, the number base to read the string in. So map's index lands in parseInt's radix slot. parseInt(\"4\", 0) means \"no base given\", which falls back to 10, so item 0 is right by luck. parseInt(\"8\", 1) is NaN, because base 1 is not a real base. parseInt(\"11\", 2) reads \"11\" as binary and gets 3. Handing map a function by name hands that function every argument map has, not just the first one you had in mind.",
    "Wrap the call so only the value gets through, and name the base yourself: return values.map((v) => parseInt(v, 10)); The arrow function takes one parameter, so the index has nowhere to land. values.map(Number) also works, because Number ignores the extra arguments map passes it."
  ],
  "tests": [
    { "name": "converts every id in the list, not just some of them", "code": "const r = toIds([\"4\", \"8\", \"11\", \"2\"]); if (JSON.stringify(r) !== JSON.stringify([4, 8, 11, 2])) throw new Error('toIds([\"4\", \"8\", \"11\", \"2\"]) should be [4, 8, 11, 2]');" },
    { "name": "the same string gives the same number wherever it sits", "code": "const r = toIds([\"7\", \"7\", \"7\", \"7\"]); if (JSON.stringify(r) !== JSON.stringify([7, 7, 7, 7])) throw new Error('toIds([\"7\", \"7\", \"7\", \"7\"]) should be [7, 7, 7, 7] - the same number four times');" },
    { "name": "one id on its own", "code": "const r = toIds([\"11\"]); if (JSON.stringify(r) !== JSON.stringify([11])) throw new Error('toIds([\"11\"]) should be [11]');" }
  ]
}
```
