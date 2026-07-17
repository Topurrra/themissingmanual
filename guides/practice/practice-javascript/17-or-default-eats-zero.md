---
title: "Fix the bug: || quietly eats a real zero"
guide: practice-javascript
phase: 17
summary: "The code runs, prints a normal-looking purchase order, and orders ten of the thing the buyer set to zero. || falls back on every falsy value, and 0 is falsy."
tags: [javascript, defaults, falsy, nullish-coalescing, debugging]
difficulty: advanced
synonyms:
  - javascript default value overwrites 0
  - why does 0 become the default in javascript
  - javascript double pipe vs question question
  - nullish coalescing operator explained
  - empty string falsy default javascript
  - js or operator eats zero
updated: 2026-07-17
---

# Fix the bug: || quietly eats a real zero

A crash is a gift - it tells you exactly where to look. This bug does not
crash. The code runs, prints a purchase order that looks completely normal,
and orders ten of something the buyer told you not to order at all.

Buyers fill in a weekly restock sheet, and the form only sends the fields they
actually touched. That is why `normalize` exists: no `qty` means nobody
decided, so the warehouse rule is to order the standard case of 10, and no
`note` means the purchase order should just read "Standard restock". Filling
in blanks is genuinely the job here.

Two of the four lines are not blank, though. `HDMI-2M` has `qty: 0` - the
buyer looked at the Berlin shelf and decided to order none this week.
`MOUSE-PRO` has `note: ""` - the buyer cleared that note on purpose. Run the
code and read the printout: both decisions are gone. It now orders ten HDMI
cables under a note that says the shelf is overstocked, the supplier gets a
sentence nobody wrote, and the total is 51 units instead of 41.

**Your task:** fix `normalize(line)` so it fills in only the fields the buyer
actually left out. A `qty` of `0` and a `note` of `""` are answers, not
blanks. `totalUnits` is already correct - once `normalize` is right it prints
`41`.

**You'll practice:**

- Reading plausible output back against the data it came from
- Telling "the buyer set this to zero" apart from "the buyer set nothing"

```lesson
{
  "language": "js",
  "starterCode": "// The restock sheet exactly as the form sent it - buyers only send fields they touched.\nconst lines = [\n  { sku: \"USB-C-1M\", qty: 24, note: \"Fast mover\" },\n  { sku: \"HDMI-2M\", qty: 0, note: \"Overstocked in Berlin\" },\n  { sku: \"CASE-13\", note: \"Ship before Friday\" },\n  { sku: \"MOUSE-PRO\", qty: 7, note: \"\" },\n];\n\n// Fill in only the fields the buyer left out. Right now it does more than that - fix it.\nfunction normalize(line) {\n  return {\n    sku: line.sku,\n    qty: line.qty || 10,\n    note: line.note || \"Standard restock\",\n  };\n}\n\n// Already correct. Leave this one alone.\nfunction totalUnits(items) {\n  return items.reduce((sum, line) => sum + normalize(line).qty, 0);\n}\n\nfor (const line of lines.map(normalize)) {\n  console.log(`${line.sku}  x${line.qty}  ${line.note}`);\n}\nconsole.log(\"Total units to order:\", totalUnits(lines));",
  "solution": "// The restock sheet exactly as the form sent it - buyers only send fields they touched.\nconst lines = [\n  { sku: \"USB-C-1M\", qty: 24, note: \"Fast mover\" },\n  { sku: \"HDMI-2M\", qty: 0, note: \"Overstocked in Berlin\" },\n  { sku: \"CASE-13\", note: \"Ship before Friday\" },\n  { sku: \"MOUSE-PRO\", qty: 7, note: \"\" },\n];\n\n// ?? falls back only when the field is null or undefined, so a real 0 or \"\" survives.\nfunction normalize(line) {\n  return {\n    sku: line.sku,\n    qty: line.qty ?? 10,\n    note: line.note ?? \"Standard restock\",\n  };\n}\n\n// Already correct. Leave this one alone.\nfunction totalUnits(items) {\n  return items.reduce((sum, line) => sum + normalize(line).qty, 0);\n}\n\nfor (const line of lines.map(normalize)) {\n  console.log(`${line.sku}  x${line.qty}  ${line.note}`);\n}\nconsole.log(\"Total units to order:\", totalUnits(lines));",
  "hints": [
    "Run it and read the printout as a person would. It says 'HDMI-2M  x10  Overstocked in Berlin' - the line orders ten of a cable whose own note says the shelf is full. Look at that row in the sheet: qty is 0. Nothing left it blank, so something replaced it.",
    "|| does not ask 'is this field missing?'. It asks 'is the left side falsy?', and falls back on every falsy value there is: undefined, null, 0, \"\", NaN, and false. The buyer's 0 and \"\" are real answers, but they are falsy, so || cannot tell them apart from a field nobody touched - and quietly overwrites both.",
    "?? (nullish coalescing) asks the question you actually meant: fall back only when the left side is null or undefined. Everything else, including 0 and \"\", passes straight through. Change both defaults: qty: line.qty ?? 10, and note: line.note ?? \"Standard restock\","
  ],
  "tests": [
    { "name": "a qty the buyer set to 0 stays 0", "code": "if (normalize({ sku: 'HDMI-2M', qty: 0, note: 'Overstocked in Berlin' }).qty !== 0) throw new Error('normalize should keep a qty the buyer set to 0, not replace it with the default 10');" },
    { "name": "a missing qty still becomes the standard case of 10", "code": "if (normalize({ sku: 'CASE-13', note: 'Ship before Friday' }).qty !== 10) throw new Error('normalize should still use 10 when qty is missing from the line');" },
    { "name": "a note the buyer cleared stays empty", "code": "if (normalize({ sku: 'MOUSE-PRO', qty: 7, note: '' }).note !== '') throw new Error('normalize should keep an empty note the buyer cleared, not replace it with the standard text');" },
    { "name": "a missing note still becomes the standard text", "code": "if (normalize({ sku: 'CASE-13', qty: 4 }).note !== 'Standard restock') throw new Error('normalize should still use Standard restock when note is missing from the line');" },
    { "name": "the sheet totals 41 units, not 51", "code": "if (totalUnits(lines) !== 41) throw new Error('totalUnits(lines) should be 41 (24 + 0 + 10 + 7) - a real 0 is being counted as 10');" }
  ]
}
```
