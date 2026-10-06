---
title: "Conditional Totals: SUMIFS, COUNTIFS, AVERAGEIFS"
guide: "excel-formulas-that-do-real-work"
phase: 3
summary: "Total, count, and average only the rows that match one or more conditions with SUMIFS, COUNTIFS, and AVERAGEIFS, including date ranges, wildcards, and the argument-order difference from SUMIF that trips everyone."
tags: [excel, sumifs, countifs, averageifs, sumif, conditional-aggregation, criteria]
difficulty: intermediate
synonyms: ["how to use sumifs in excel", "sumifs with date range", "sumif vs sumifs argument order", "countifs multiple criteria", "excel sum by category", "averageifs div/0", "excel sum if between two dates"]
updated: 2026-10-06
---

# Conditional Totals: SUMIFS, COUNTIFS, AVERAGEIFS

"What were East sales in February?" is the most common question a spreadsheet gets. You could filter the table and read the status bar, but the answer goes stale the moment the data changes. The `-IFS` family answers it with a formula that recalculates itself.

The idea: each function takes pairs of **a range to test and a condition**. A row counts only if it passes **every** pair. Use the Orders sheet with Total in `H2:H9`, Region in `F2:F9`, Customer in `C2:C9`, Quantity in `E2:E9`, and OrderDate in `B2:B9`.

## SUMIFS

```excel
=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)
```

The first argument is the thing to add up. Then come the pairs.

```excel
=SUMIFS(H2:H9, F2:F9, "East")
```

East orders are 1001 (240), 1003 (300), 1006 (220), and 1008 (90): `240 + 300 + 220 + 90 = 850`. The West total is `200 + 210 + 120 + 600 = 1130`, and `850 + 1130 = 1980`, the sum of the whole column.

Add a second pair to narrow further:

```excel
=SUMIFS(H2:H9, F2:F9, "East", C2:C9, "Nora Patel")
```

East orders by Nora Patel are 1001, 1003, and 1008: `240 + 300 + 90 = 630`.

### The argument-order trap

The older single-condition function is `SUMIF(range, criteria, [sum_range])`. Its sum range is **third and optional**. In SUMIFS the sum range is **first and required**. Microsoft calls this out as a common source of problems. Compare:

```excel
=SUMIF(F2:F9, "East", H2:H9)
=SUMIFS(H2:H9, F2:F9, "East")
```

Both return `850`. Mix up the order and you get zero or an error, not a helpful message. You can use SUMIFS for everything and ignore SUMIF, but you will read SUMIF in old files, so know both.

### Criteria: operators, dates, and cell references

A criterion is text. Plain values match exactly (`"East"`). To compare, put the operator inside the quotes: `">=200"`, `"<>East"`, `"<5"`.

To compare against a value in a cell or a function result, **join the operator to it with `&`**:

```excel
=SUMIFS(H2:H9, B2:B9, ">="&DATE(2026,2,1), B2:B9, "<"&DATE(2026,3,1))
```

This is the standard "everything in February" pattern: on or after Feb 1 and before Mar 1. Orders 1004, 1005, and 1006 qualify: `210 + 120 + 220 = 550`. Using "before the first of next month" avoids having to know whether the month ends on the 28th, 30th, or 31st.

Wildcards work in text criteria: `*` for any run of characters, `?` for one character, `~` to match a literal `*` or `?`.

```excel
=COUNTIFS(C2:C9, "N*")
```

counts customers whose name starts with N: Nora Patel appears three times, so `3`.

### Fill-down and the summary grid

A common layout is a small summary table: regions in `J2:J3`, totals next to them.

```excel
=SUMIFS($H$2:$H$9, $F$2:$F$9, $J2)
```

The ranges are locked with `$` so they stay put as you fill down; `$J2` has a locked column and a free row, so it moves down to `J3` for the next region. The criteria can be a cell reference, which is cleaner than typing `"East"` into every formula.

## COUNTIFS and AVERAGEIFS

```excel
=COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], ...)
=AVERAGEIFS(average_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)
```

COUNTIFS has no value range: it counts rows. AVERAGEIFS starts with the range to average, like SUMIFS.

| Formula | Reads as | Result |
|---|---|---|
| `=COUNTIFS(H2:H9, ">=200")` | orders worth 200 or more | 6 |
| `=COUNTIFS(F2:F9, "West", E2:E9, ">=3")` | West orders of 3+ units | 2 |
| `=AVERAGEIFS(H2:H9, F2:F9, "West")` | average West order | 282.5 |

Check the first: totals of 240, 200, 300, 210, 220, and 600 reach 200; 120 and 90 do not, so `6`. The second: West orders 1002 (qty 5) and 1004 (qty 3) pass, while 1005 (qty 1) and 1007 (qty 2) do not, so `2`. The third: `1130 / 4 = 282.5`.

If no row matches, AVERAGEIFS has nothing to divide, and returns `#DIV/0!`. For example `=AVERAGEIFS(H2:H9, F2:F9, "North")` is `#DIV/0!` because there is no North. That error carries real information: "nothing matched". Resist wrapping it blindly (see phase 2).

## Why they return the wrong number

- **Range sizes must match.** Every range in the formula must have the same number of rows and columns. `SUMIFS(H2:H9, F2:F8, "East")` returns `#VALUE!`.
- **Text criteria need quotes.** `"East"`, not `East`.
- **Invisible differences.** A customer stored as `"Nora Patel "` with a trailing space does not match `"Nora Patel"`. Phase 4 shows how to find and clean these.
- **Numbers stored as text** in the criteria range or sum range are the other classic cause of totals that are too low. See phase 4.
- **TRUE and FALSE in a sum range** count as 1 and 0, which can add surprise values.

## Your turn: predict the result

```exercise
[
  {
    "type": "predict",
    "task": "What does =SUMIFS(H2:H9, F2:F9, \"West\", B2:B9, \">=\"&DATE(2026,2,1)) return? (West orders on or after Feb 1 are 1004, 1005, and 1007; their totals are 210, 120, and 600.)",
    "accept": ["930"],
    "hint": "Add the three totals: 210 + 120 + 600."
  },
  {
    "type": "predict",
    "task": "What does =COUNTIFS(C2:C9, \"Nora Patel\", F2:F9, \"East\") return?",
    "accept": ["3"],
    "hint": "Count the rows that pass BOTH tests. Nora's orders are 1001, 1003, and 1008, all East."
  }
]
```

Check yourself before moving on:

```quiz
[
  {"q": "Which formula correctly totals column H where column F is East?", "choices": ["=SUMIFS(F2:F9, H2:H9, \"East\")", "=SUMIFS(F2:F9, \"East\", H2:H9)", "=SUMIFS(H2:H9, F2:F9, \"East\")", "=SUMIFS(\"East\", F2:F9, H2:H9)"], "answer": 2, "explain": "In SUMIFS the sum range comes first, then each criteria range followed by its criterion. In the older SUMIF the sum range is third.", "why": ["The pair order is range then criterion, and the sum range is first.", "That puts the criteria range first and a criterion in the pair position.", null, "The sum range must be a range and come first."]},
  {"q": "You want everything dated in February 2026. Which criteria pair is the safest pattern?", "choices": ["On or after DATE(2026,2,1) and before DATE(2026,3,1)", "Between 28 and 31", "Text criteria of Feb", "Dates equal to February"], "answer": 0, "explain": "Joining the operator to DATE() with & and using 'before the first of next month' works whatever the month length is."},
  {"q": "AVERAGEIFS returns #DIV/0! for region North. What does that most likely mean?", "choices": ["Excel ran out of memory", "The formula has a typo in its syntax", "No row matched the criteria, so there was nothing to average", "The ranges are different sizes"], "answer": 2, "explain": "Microsoft documents that AVERAGEIFS returns #DIV/0! when no cells meet the criteria. Mismatched range sizes give #VALUE! instead.", "why": ["This error is about division by zero rows.", "A syntax problem would show a different error or refuse the formula.", null, "Different sizes produce #VALUE!."]}
]
```

## Recap

1. The `-IFS` functions take range and criterion pairs; a row counts only if it passes every pair.
2. `SUMIFS(sum_range, ...)` puts the sum range first; `SUMIF(range, criteria, [sum_range])` puts it third.
3. Join operators to values with `&`: `">="&DATE(2026,2,1)`. Use "on or after the 1st, before the 1st of next month" for a month.
4. All ranges must be the same size, and stray spaces or text-numbers make rows silently miss.
5. `AVERAGEIFS` returns `#DIV/0!` when nothing matches.

Next up, [Phase 4: Text](04-text.md): cleaning and reshaping the text those criteria depend on.
