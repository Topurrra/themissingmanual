---
title: "Lookups: XLOOKUP, INDEX/MATCH, and VLOOKUP"
guide: "excel-formulas-that-do-real-work"
phase: 1
summary: "Pull a price, name, or category from another table with XLOOKUP, and understand INDEX/MATCH and VLOOKUP well enough to read and fix old files, including why VLOOKUP's column number and default approximate match cause silent wrong answers."
tags: [excel, xlookup, vlookup, index-match, lookups, absolute-references]
difficulty: intermediate
synonyms: ["how to use xlookup", "xlookup vs vlookup", "why does vlookup return wrong value", "index match instead of vlookup", "xlookup if not found", "vlookup approximate match default", "excel lookup to the left"]
updated: 2026-10-06
---

# Lookups: XLOOKUP, INDEX/MATCH, and VLOOKUP

Your Orders sheet has a SKU like `P200` and a quantity. The price lives on a different sheet. You need Excel to find `P200` in the Products table and bring back its price. That job is a **lookup**, and it is the same idea as a join in SQL: match a key in one table against a key in another and fetch a column.

## The mental model: find the row, then fetch from it

Every lookup does two things. It finds the **position** of the key in a column, then returns the value at that same position in another column. The three functions below differ only in how you spell those two steps.

## XLOOKUP

```excel
=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])
```

Only the first three arguments are required. In Orders, click `G2` and type:

```excel
=XLOOKUP(D2, Products!$A$2:$A$7, Products!$D$2:$D$7)
```

Read it as: "find `D2` (`P200`) in the SKU column, and return the Unit Price from the same row." The result is `120`. In `H2` type `=E2*G2`, which gives `240`. Fill both down.

| D2 (SKU) | Found at | Returned |
|---|---|---|
| P200 | 2nd row of the table | 120 |
| P100 | 1st row | 40 |
| P600 | 6th row | 90 |

The defaults matter, and Microsoft documents them:

- `match_mode` defaults to `0`, an **exact** match. If nothing matches, you get `#N/A`.
- `search_mode` defaults to `1`, searching from the first item down.
- `if_not_found` defaults to `#N/A`; give it a value to show something friendlier.

```excel
=XLOOKUP("P999", Products!$A$2:$A$7, Products!$D$2:$D$7, "Not in catalog")
```

returns the text `Not in catalog`. Leave the fourth argument off and the same formula returns `#N/A`.

### The other modes

`match_mode` has four values: `0` exact, `-1` exact or the next smaller item, `1` exact or the next larger item, and `2` wildcard match using `*`, `?`, and `~`. `search_mode` has four: `1` first to last, `-1` last to first, `2` binary search ascending, and `-2` binary search descending. The binary modes need sorted data; skip them until you have a large sorted table.

A real use of `-1` is a tier table. The Tiers sheet says 0 units earns 0%, 3 units earns 5%, and 5 units earns 10%. For a quantity in `E2`:

```excel
=XLOOKUP(E2, Tiers!$A$2:$A$4, Tiers!$B$2:$B$4, , -1)
```

The empty fourth argument keeps the default. Quantity `4` is not in the table, so `-1` returns the next smaller entry, `3`, giving `5%`.

| Qty | Tier row used | Discount |
|---|---|---|
| 2 | 0 | 0% |
| 3 | 3 (exact) | 5% |
| 4 | 3 (next smaller) | 5% |
| 5 | 5 (exact) | 10% |

Wildcards plus a reverse search find the last match:

```excel
=XLOOKUP("*Desk*", Products!$B$2:$B$7, Products!$A$2:$A$7, , 2, -1)
```

Two products contain "Desk" (Desk Lamp and Standing Desk). Searching last to first returns `P300`; with the default direction it would return `P100`.

XLOOKUP needs Excel 2021 or Microsoft 365. It is not in Excel 2016 or 2019.

## INDEX and MATCH

Older files split the two steps into two functions.

- `MATCH(lookup_value, lookup_array, [match_type])` returns the **position** of the item, not the item. `match_type` defaults to `1` (largest value less than or equal, which requires ascending data). Use `0` for exact.
- `INDEX(array, row_num, [column_num])` returns the value at a position. For a single column, `row_num` alone is enough.

```excel
=INDEX(Products!$D$2:$D$7, MATCH(D2, Products!$A$2:$A$7, 0))
```

For `P200`, `MATCH` returns `2` and `INDEX` returns the 2nd price, `120`. Same answer as XLOOKUP. Write the `0` every time: leave it off and you get the approximate default.

Both functions can look in any direction. To get a SKU from a product name, `=INDEX(Products!$A$2:$A$7, MATCH("Keyboard", Products!$B$2:$B$7, 0))` returns `P500` (the position is `5`).

## VLOOKUP

```excel
=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
```

It searches the **first column** of `table_array` and returns a value from column number `col_index_num`, counting from 1.

```excel
=VLOOKUP(D2, Products!$A$2:$D$7, 4, FALSE)
```

returns `120`. VLOOKUP breaks in three ways, and you will see all of them in old files.

**1. The default is approximate.** If you omit the fourth argument, `range_lookup` is `TRUE`, which assumes the first column is sorted and returns the closest value that is not larger. Your table is sorted, so look at what a missing SKU does:

```excel
=VLOOKUP("P250", Products!$A$2:$D$7, 4)
```

There is no `P250`, yet you get `120` (the `P200` price) with no error. A wrong answer that looks right. Microsoft's own note: with `TRUE`, an unsorted first column gives unexpected results. Always write `FALSE` (or `0`) for an exact match.

**2. The column number is a hard-coded count.** The `4` means "fourth column of the range". Change which columns the range covers, or insert a column inside the table, and the `4` can silently point somewhere else. Ask for a column beyond the range (say `5` here) and you get `#REF!`. XLOOKUP and INDEX/MATCH name the return column directly, so they do not have this problem.

**3. It only looks to the right.** The key must be in the first column of the range. To look left you need INDEX/MATCH or XLOOKUP.

## The fill-down trap: absolute references

Why do the formulas above write `Products!$A$2:$A$7`? The `$` signs lock the range. Suppose you typed `Products!A2:A7` and filled down. In `G3` Excel shifts the range one row, to `Products!A3:A8`. `D3` holds `P100`, which lives in `A2`, now outside the range, so the result is `#N/A`. The window keeps sliding down as you fill, so the first row looks fine and any later row whose SKU sits above the window fails.

Rule: the **lookup value** moves with each row (relative: `D2`); the **table** stays put (absolute: `$A$2:$A$7`). Press `F4` while the cursor is in a reference to cycle through the `$` forms.

## Your turn: predict the result

```exercise
[
  {
    "type": "predict",
    "task": "Using the Products table, what does =XLOOKUP(\"P250\", Products!$A$2:$A$7, Products!$D$2:$D$7, , -1) return? Give the number.",
    "accept": ["120"],
    "hint": "Match mode -1 returns the exact match or the next SMALLER item when there is no exact match. Which SKU sits immediately below P250?"
  },
  {
    "type": "predict",
    "task": "Same lookup, but the match mode is 1 instead of -1 (exact or next LARGER item). What price does it return?",
    "accept": ["300"],
    "hint": "The next larger SKU after P250 is P300."
  }
]
```

Check yourself before moving on:

```quiz
[
  {"q": "A colleague's old workbook uses VLOOKUP with no fourth argument and returns a price for a SKU that is not in the table. What is the most likely cause?", "choices": ["The omitted range_lookup defaults to TRUE, an approximate match", "VLOOKUP always ignores the first column", "The column number is too large", "The table has a hidden row"], "answer": 0, "explain": "When range_lookup is omitted it is TRUE, so VLOOKUP returns the closest value that is not larger instead of reporting #N/A. Write FALSE for an exact match.", "why": [null, "VLOOKUP searches the first column; that is how it works.", "A column number beyond the range gives #REF!, not a plausible price.", "Hidden rows do not change what a lookup finds."]},
  {"q": "You fill XLOOKUP down a column and the first row works but many later rows return #N/A. What is the likely fix?", "choices": ["Change match_mode to 2", "Use VLOOKUP instead", "Lock the lookup_array and return_array with dollar signs", "Sort the Orders sheet"], "answer": 2, "explain": "Relative ranges shift down with each row and slide off the table. Absolute references like $A$2:$A$7 keep the table fixed.", "why": ["Wildcard matching does not fix a shifted range.", "VLOOKUP would have the same relative-range problem.", null, "Sorting the orders does not move the lookup table."]},
  {"q": "Which XLOOKUP default is true according to Microsoft's documentation?", "choices": ["if_not_found defaults to 0", "match_mode defaults to 0, an exact match", "search_mode defaults to binary search", "match_mode defaults to approximate match"], "answer": 1, "explain": "XLOOKUP is exact by default (match_mode 0), searches first to last (search_mode 1), and returns #N/A when nothing is found unless you set if_not_found."}
]
```

## Recap

1. A lookup finds a key's position in one column and returns the value at that position from another.
2. `XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])` is exact by default and needs Excel 2021 or Microsoft 365.
3. `INDEX(range, MATCH(key, range, 0))` does the same in two steps and works in every version; always write the `0`.
4. VLOOKUP defaults to approximate match and uses a hard-coded column number; write `FALSE` and treat the number with suspicion.
5. Lock the table with `$` when you fill a lookup down.

Next up, [Phase 2: Logic](02-logic-and-iferror.md): making a cell decide, and when hiding errors hides bugs.
