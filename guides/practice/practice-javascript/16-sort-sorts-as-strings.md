---
title: "Fix the bug: sort() quietly sorts numbers as text"
guide: practice-javascript
phase: 16
summary: "The price filter runs, returns a sorted-looking list, and puts the $105 monitor first. Nothing throws. sort() with no comparator is doing exactly what it was told."
tags: [javascript, sort, arrays, comparator, debugging, mutation]
difficulty: advanced
synonyms:
  - javascript sort numbers wrong order
  - why does sort put 10 before 9
  - array sort not sorting numbers
  - javascript sort comparator function
  - sort mutates the original array javascript
  - js sort puts 105 before 76
updated: 2026-07-17
---

# Fix the bug: sort() quietly sorts numbers as text

You maintain the monitors page for a small parts shop. It has a "Price: low to
high" button and, above the list, a badge reading "Most expensive: $X". Both
read from the same sorted array.

A customer wrote in this morning. According to the page, the cheapest monitor in
the shop is the $105 one, and the most expensive is the $91 one.

Nothing threw. No red text, no failed request, no `undefined` on the page. The
function ran, handed back an array of the right length holding the right four
numbers, and the page rendered it. The order is just wrong, and wrong order
still looks like an answer.

Two details before you touch the code. This filter shipped months ago and nobody
complained until last week, when the shop listed its first monitor over $100.
And the page's own default order - the one the "Featured" tab uses - is
scrambled now too, though nothing here asked for that.

**Your task:** fix `byPrice(prices)` so it returns the prices sorted low to
high, and so the array it was handed comes back untouched.
`byPrice([88, 105, 91, 76])` is `[76, 88, 91, 105]`, and `monitors` still reads
`[88, 105, 91, 76]` afterwards.

**You'll practice:**

- Reading a plausible-looking result as a claim, then checking it against a value sitting in front of you
- Spotting the two silent things `sort()` does when you call it with no arguments

```lesson
{
  "language": "js",
  "starterCode": "// \"Price: low to high\" for the monitors page. Nothing throws - read the output.\nfunction byPrice(prices) {\n  return prices.sort();\n}\n\nconst monitors = [88, 105, 91, 76];\nconst listed = byPrice(monitors);\n\nconsole.log(\"Low to high:\", listed);\nconsole.log(\"Most expensive:\", listed[listed.length - 1]);\nconsole.log(\"Featured tab still in the page's own order?\", monitors);",
  "solution": "function byPrice(prices) {\n  return [...prices].sort((a, b) => a - b);\n}\n\nconst monitors = [88, 105, 91, 76];\nconst listed = byPrice(monitors);\n\nconsole.log(\"Low to high:\", listed);\nconsole.log(\"Most expensive:\", listed[listed.length - 1]);\nconsole.log(\"Featured tab still in the page's own order?\", monitors);",
  "hints": [
    "Run it and read the first line. It claims 105 is the cheapest of 88, 105, 91 and 76, which you can see is false - and the other three came out in the right order, so this is not random noise. Now read the last line: the array you passed in came back reordered, even though you only wanted a sorted copy of it. Two wrong things, no error.",
    "sort() with no arguments does not compare numbers. It converts every element to a string and compares those character by character, the way a dictionary orders words. The string \"105\" starts with \"1\" and \"76\" starts with \"7\", and \"1\" sorts before \"7\", so 105 lands at the front. The other three prices are all two digits long, so text order and number order happen to agree for them - which is why this held up until a price crossed 100. The second problem is separate: sort() does not make a copy. It reorders the array you handed it and gives you back that same array.",
    "Give sort a comparator so it compares values instead of text, and spread the input into a new array first so the caller's order survives: function byPrice(prices) { return [...prices].sort((a, b) => a - b); } A comparator receives two elements and returns a negative number when a should come first, a positive number when b should, and 0 when the order between them does not matter - and a - b is exactly that for numbers. Modern browsers also give you prices.toSorted((a, b) => a - b), which makes the copy for you."
  ],
  "tests": [
    { "name": "sorts by value, not by text", "code": "const out = byPrice([88, 105, 91, 76]);\nif (JSON.stringify(out) !== JSON.stringify([76, 88, 91, 105])) throw new Error('byPrice([88, 105, 91, 76]) should be [76, 88, 91, 105], got ' + JSON.stringify(out));" },
    { "name": "puts 9 before 10", "code": "const out2 = byPrice([9, 10, 8]);\nif (JSON.stringify(out2) !== JSON.stringify([8, 9, 10])) throw new Error('byPrice([9, 10, 8]) should be [8, 9, 10] - as text, \"10\" sorts before \"9\". Got ' + JSON.stringify(out2));" },
    { "name": "still works when every price is the same length", "code": "const out3 = byPrice([45, 12, 77]);\nif (JSON.stringify(out3) !== JSON.stringify([12, 45, 77])) throw new Error('byPrice([45, 12, 77]) should be [12, 45, 77], got ' + JSON.stringify(out3));" },
    { "name": "leaves the caller's array in its original order", "code": "const original = [88, 105, 91, 76];\nbyPrice(original);\nif (JSON.stringify(original) !== JSON.stringify([88, 105, 91, 76])) throw new Error('byPrice must not reorder the array it was given - it came back as ' + JSON.stringify(original));" }
  ]
}
```
