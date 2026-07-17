---
title: "Capstone: JSON numbers that arrive as strings"
guide: practice-javascript
phase: 21
summary: "The invoice total prints as $19.9925.508.99 and nothing throws. One amount arrived as a JSON string, and + quietly chose joining over adding."
tags: [javascript, capstone, json, type-coercion, numbers, debugging]
difficulty: advanced
synonyms:
  - javascript adding numbers concatenates instead
  - json number arrives as string
  - why does plus join my numbers javascript
  - javascript sum returns a string
  - convert json value to number safely
  - javascript reduce returns concatenated string
updated: 2026-07-17
---

# Capstone: JSON numbers that arrive as strings

This report has been right for months. This morning it mailed a customer an
invoice whose total reads `$19.9925.508.99`. Nothing threw. No error, no
alert - the total simply walked into a PDF and out to a human.

One line item changed. `MS-204` now comes from a supplier whose serializer
writes decimals as JSON strings (`"25.50"`) rather than numbers, which real
payment APIs genuinely do - a string cannot lose precision the way a float can.
The other two lines still arrive as numbers. `JSON.parse` hands all three back
exactly as written, because parsing is not validating: JSON has both types, and
nothing in the format promises you which one you will get.

Then `+` decides. In JavaScript `+` is two operators sharing one symbol: add
these numbers, or join these strings. If either side is a string, joining wins.
So the reduce runs `0 + 19.99` and gets `19.99`, then `19.99 + "25.50"` and gets
`"19.9925.50"`, then joins `8.99` onto the end of that. Every step is legal.
Every step is silent.

`Number("25.50")` gives you `25.5` and fixes it - but only halfway. `Number("n/a")`
gives `NaN`, and `NaN` spreads through arithmetic just as quietly: `sum + NaN` is
`NaN`, from there to the end, without a word. Coercing alone trades one silent
wrong answer for another. So you coerce **and** check, at the edge where the data
comes in - which turns a bad amount into a loud error you can locate, instead of
a total nobody thinks to question.

**Your task:** fix `invoiceTotal(json)` so it returns the real total as a
`number`, whatever mix of numbers and numeric strings the lines arrive in. If a
line's `amount` is not a number at all, throw instead of returning a nonsense
total. The sample `payload` is already in the editor - its true total is
`54.48`.

**You'll practice:**

- Coercing and validating untrusted JSON at the boundary instead of trusting its types
- Using `typeof` to prove a total became a string, because `+` joins the moment either side is one

```lesson
{
  "language": "js",
  "starterCode": "const payload = '{\"invoice\":\"INV-2026-0043\",\"lines\":[{\"sku\":\"KB-101\",\"amount\":19.99},{\"sku\":\"MS-204\",\"amount\":\"25.50\"},{\"sku\":\"HD-330\",\"amount\":8.99}]}';\n\n// Two lines arrive as JSON numbers, one arrives as a JSON string.\n// This returns a total and never throws. Run it, then read what it printed.\nfunction invoiceTotal(json) {\n  const data = JSON.parse(json);\n  return data.lines.reduce((sum, line) => sum + line.amount, 0);\n}\n\nconsole.log(`Invoice total: $${invoiceTotal(payload)}`);",
  "solution": "const payload = '{\"invoice\":\"INV-2026-0043\",\"lines\":[{\"sku\":\"KB-101\",\"amount\":19.99},{\"sku\":\"MS-204\",\"amount\":\"25.50\"},{\"sku\":\"HD-330\",\"amount\":8.99}]}';\n\nfunction invoiceTotal(json) {\n  const data = JSON.parse(json);\n  return data.lines.reduce((sum, line) => {\n    const amount = Number(line.amount);\n    if (!Number.isFinite(amount)) {\n      throw new TypeError(`Line ${line.sku} has a non-numeric amount: ${JSON.stringify(line.amount)}`);\n    }\n    return sum + amount;\n  }, 0);\n}\n\nconsole.log(`Invoice total: $${invoiceTotal(payload)}`);",
  "hints": [
    "Run it. The report line reads 'Invoice total: $19.9925.508.99'. Nothing threw, so nothing warned you - but read the digits: 19.99, then 25.50, then 8.99, parked next to each other instead of added up. Add console.log(typeof invoiceTotal(payload)); and see what you actually got back.",
    "typeof says 'string'. Look at the payload: KB-101 and HD-330 carry amount as JSON numbers, but MS-204 carries \"25.50\" - a JSON string. JSON.parse preserves that difference exactly, because parsing is not validating. And + is two operators sharing one symbol: add these numbers, or join these strings. If either side is a string, joining wins. So 0 + 19.99 is 19.99, but 19.99 + \"25.50\" is \"19.9925.50\", and every + after that just keeps joining.",
    "Coerce each amount as it comes out of JSON.parse, and reject anything that is not a real number so a bad line is a loud error instead of a silent NaN: function invoiceTotal(json) { const data = JSON.parse(json); return data.lines.reduce((sum, line) => { const amount = Number(line.amount); if (!Number.isFinite(amount)) { throw new TypeError(`Line ${line.sku} has a non-numeric amount: ${JSON.stringify(line.amount)}`); } return sum + amount; }, 0); }"
  ],
  "tests": [
    {
      "name": "returns a number, not a concatenated string",
      "code": "const t = invoiceTotal(payload); if (typeof t !== 'number') throw new Error('invoiceTotal(payload) should return a number, but typeof it is \"' + typeof t + '\"');"
    },
    {
      "name": "totals the sample payload correctly",
      "code": "if (invoiceTotal(payload) !== 54.48) throw new Error('invoiceTotal(payload) should be 54.48 (19.99 + 25.50 + 8.99), got ' + invoiceTotal(payload));"
    },
    {
      "name": "adds amounts that all arrive as strings",
      "code": "const strings = '{\"invoice\":\"INV-2026-0044\",\"lines\":[{\"sku\":\"A-1\",\"amount\":\"10.25\"},{\"sku\":\"B-2\",\"amount\":\"4.75\"}]}'; if (invoiceTotal(strings) !== 15) throw new Error('invoiceTotal should be 15 when both amounts are strings (\"10.25\" + \"4.75\"), got ' + invoiceTotal(strings));"
    },
    {
      "name": "adds amounts that all arrive as numbers",
      "code": "const numbers = '{\"invoice\":\"INV-2026-0045\",\"lines\":[{\"sku\":\"C-3\",\"amount\":3},{\"sku\":\"D-4\",\"amount\":7}]}'; if (invoiceTotal(numbers) !== 10) throw new Error('invoiceTotal should be 10 when both amounts are numbers (3 + 7), got ' + invoiceTotal(numbers));"
    },
    {
      "name": "throws on an amount that is not a number instead of totalling it anyway",
      "code": "const bad = '{\"invoice\":\"INV-2026-0046\",\"lines\":[{\"sku\":\"E-5\",\"amount\":12},{\"sku\":\"F-6\",\"amount\":\"n/a\"}]}'; let threw = false; try { invoiceTotal(bad); } catch (e) { threw = true; } if (!threw) throw new Error('invoiceTotal should throw on an amount of \"n/a\" rather than quietly returning NaN or a string');"
    }
  ]
}
```
