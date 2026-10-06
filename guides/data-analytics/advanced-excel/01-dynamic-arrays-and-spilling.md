---
title: "Dynamic Arrays and Spilling"
guide: "advanced-excel"
phase: 1
summary: "Learn how one formula can fill a whole block of cells (the spill range), how to fix #SPILL!, what the # and @ operators mean, and how to use FILTER, SORT, SORTBY, UNIQUE, SEQUENCE, and XMATCH."
tags: [excel, dynamic-arrays, spill, filter, sort, sortby, unique, sequence, xmatch]
difficulty: advanced
synonyms: ["what is a spill range in excel", "excel spill error", "excel # operator spill reference", "what does @ mean in excel formula", "excel filter function examples", "excel unique function", "excel sortby vs sort", "excel xmatch vs match", "excel dynamic array formulas"]
updated: 2026-10-06
---

# Dynamic Arrays and Spilling

For years, one Excel formula meant one answer in one cell. If you wanted a list of every East region order, you reached for a pivot table or a helper column and a filter. Dynamic arrays change the rule: a formula can return many values, and Excel pours them into the cells below and beside it. After this phase you will pull filtered, sorted, de-duplicated tables out of raw data with a single formula that updates itself.

Version note: the functions in this phase work in Excel for Microsoft 365, Excel 2024, and Excel 2021, per Microsoft's documentation.

## The data we will use

Paste this into a sheet at `A1`. It is the cleaned version of the export you will build properly in [Phase 3](03-power-query-repeatable-cleanup.md).

| | A | B | C | D |
|---|---|---|---|---|
| 1 | Region | Rep | Product | Amount |
| 2 | East | Ana | Desk | 400 |
| 3 | West | Ben | Chair | 150 |
| 4 | East | Cy | Chair | 120 |
| 5 | West | Ben | Desk | 380 |
| 6 | East | Ana | Lamp | 60 |
| 7 | North | Dee | Lamp | 95 |
| 8 | East | Ana | Chair | 175 |
| 9 | North | Dee | Desk | 310 |

The amounts add up to 1,690. Keep that number in mind. It is how you will check later results.

## What a spill actually is

A **spill** happens when a formula produces several values and Excel places them in the neighboring cells. The cell where you typed the formula is the anchor. The block of cells the results fill is the **spill range**. Click any cell in it and Excel draws a thin blue border around the whole block.

Type this in `F2` and press Enter (not Ctrl+Shift+Enter):

```excel
=FILTER(A2:D9, A2:A9="East", "none")
```

FILTER keeps the rows of its first argument where the second argument is TRUE. The `A2:A9="East"` test produces eight TRUE or FALSE values, one per row, and FILTER keeps the rows that line up with TRUE. The third argument is what to show if nothing matches.

| F | G | H | I |
|---|---|---|---|
| East | Ana | Desk | 400 |
| East | Cy | Chair | 120 |
| East | Ana | Lamp | 60 |
| East | Ana | Chair | 175 |

*What just happened:* one formula, typed once in `F2`, filled `F2:I5`. Only `F2` contains the formula. The other cells show a ghosted copy in the formula bar, and you can edit only the anchor. Change a value in the source data and the spill redraws itself, growing or shrinking to fit.

> 💡 **Key point**
> Older Ctrl+Shift+Enter array formulas returned a fixed-size block. A dynamic array formula resizes itself every time the data changes.

## When it breaks: #SPILL!

If something sits in the cells the result needs, Excel refuses to overwrite it and shows `#SPILL!`. Excel will not destroy your data to make room.

| Symptom | Calm fix |
|---|---|
| `#SPILL!`, a cell in the spill range has content | Clear or move the obstructing cell. Selecting the error cell shows the intended spill range as a dashed border. |
| `#SPILL!`, merged cells in the range | Unmerge them, or move the formula elsewhere. |
| `#SPILL!`, formula is inside an Excel Table | Spilled formulas are not supported inside Tables. Put the formula on the grid outside the Table. |
| `#SPILL!`, size cannot be determined | The result's size changes between calculation passes, which RAND, RANDARRAY, and RANDBETWEEN cause. Avoid them in sizing arguments. |
| `#SPILL!`, out of memory | Point the formula at a smaller range. |
| `#CALC!` from FILTER | Nothing matched and you gave no third argument. Add one, such as `"none"`. |

Source: Microsoft's article [How to correct a #SPILL! error](https://support.microsoft.com/en-US/Excel/how-to-correct-a-spill-error).

The most common real cause is boring: you typed a formula, then someone typed a note a few rows below it, and the spill hit that note. Selecting the formula cell shows the dashed border, and the error tells you which cell is in the way.

## Referring to a spill: the # operator

A spill range changes size, so you cannot point at it with a fixed range like `F2:I5`. Instead, put `#` after the anchor cell. It means "the whole spill range of the formula in that cell."

| Formula | Result | Why |
|---|---|---|
| `=ROWS(F2#)` | 4 | The East filter spilled four rows. |
| `=SUM(INDEX(F2#,,4))` | 755 | `INDEX` with an empty row argument returns column 4 of the spill: 400 + 120 + 60 + 175. |

If a new East order appears in the data, both formulas change with no editing.

## The @ operator and old files

Before dynamic arrays, Excel silently squashed a range down to one value when a formula expected a single value. This was called **implicit intersection**: for a formula in row 3, `=A1:A10` quietly returned the value from `A3`, the cell in the same row.

Dynamic-array Excel no longer does that silently, because the formula might now be meant to spill. When you open a workbook created in an older version, Excel adds `@` to formulas that could return more than one value, such as `=@INDEX(...)`, so they keep behaving exactly as before. Microsoft's wording is that nothing changes about how your formula behaves; you can now see the previously invisible intersection.

Two practical rules:

- If an old formula shows an `@` you did not type and you want it to spill, delete the `@`.
- If you want a single value from a range or array, type `@` yourself.

Source: Microsoft's article [Implicit intersection operator: @](https://support.microsoft.com/en-us/office/implicit-intersection-operator-ce3be07b-0101-4450-a24e-c1c999be2b34).

## SORT and SORTBY

`SORT` has the signature `SORT(array, [sort_index], [sort_order], [by_col])`. The `sort_index` is a column number inside the array, defaulting to 1. The `sort_order` is `1` for ascending (the default) or `-1` for descending.

Filter East orders, then sort them by amount (column 4), largest first:

```excel
=SORT(FILTER(A2:D9, A2:A9="East", "none"), 4, -1)
```

| Region | Rep | Product | Amount |
|---|---|---|---|
| East | Ana | Desk | 400 |
| East | Ana | Chair | 175 |
| East | Cy | Chair | 120 |
| East | Ana | Lamp | 60 |

`SORTBY(array, by_array1, [sort_order1], [by_array2, sort_order2], ...)` sorts by a separate range instead of a column number. Microsoft recommends it for grids because it keeps working if you insert a column, while `SORT` breaks when index numbers shift.

```excel
=SORTBY(A2:D9, D2:D9, -1)
```

| Region | Rep | Product | Amount |
|---|---|---|---|
| East | Ana | Desk | 400 |
| West | Ben | Desk | 380 |
| North | Dee | Desk | 310 |
| East | Ana | Chair | 175 |
| West | Ben | Chair | 150 |
| East | Cy | Chair | 120 |
| North | Dee | Lamp | 95 |
| East | Ana | Lamp | 60 |

You can add tie-breakers: `=SORTBY(A2:D9, A2:A9, 1, D2:D9, -1)` sorts by region A to Z, and within each region by amount high to low. All the arrays must have the same number of rows as the data.

## Combining conditions in FILTER

FILTER's second argument is a TRUE/FALSE array, so you build conditions with arithmetic. Multiply for AND. Add for OR.

```excel
=FILTER(A2:D9, (A2:A9="East")*(D2:D9>100), "none")
```

East AND amount over 100 keeps three orders: Ana Desk 400, Cy Chair 120, and Ana Chair 175. (Ana Lamp 60 is East but too small.)

```excel
=SORT(FILTER(A2:D9, (A2:A9="West")+(A2:A9="North"), "none"), 4, -1)
```

West OR North, sorted by amount descending:

| Region | Rep | Product | Amount |
|---|---|---|---|
| West | Ben | Desk | 380 |
| North | Dee | Desk | 310 |
| West | Ben | Chair | 150 |
| North | Dee | Lamp | 95 |

## UNIQUE

`UNIQUE(array, [by_col], [exactly_once])` returns the distinct rows of a range. `by_col` compares columns instead of rows. `exactly_once` set to TRUE returns only items that occur a single time.

| Formula | Spilled result | Why |
|---|---|---|
| `=UNIQUE(B2:B9)` | Ana, Ben, Cy, Dee | Four distinct reps, in order of first appearance. |
| `=UNIQUE(B2:B9,,TRUE)` | Cy | Ana appears 3 times, Ben 2, Dee 2, Cy once. |
| `=SORT(UNIQUE(C2:C9))` | Chair, Desk, Lamp | Distinct products, A to Z. |

The double comma in the second row skips `by_col` and leaves it at its default of FALSE.

## SEQUENCE

`SEQUENCE(rows, [columns], [start], [step])` generates numbers. Omitted optional arguments default to 1.

| Formula | Spilled result |
|---|---|
| `=SEQUENCE(3)` | 1, 2, 3 down a column |
| `=SEQUENCE(3,1,100,50)` | 100, 150, 200 down a column |
| `=SEQUENCE(2,3)` | Row 1: 1, 2, 3. Row 2: 4, 5, 6. |

Use it for row numbers, invoice-number series, or as the engine inside bigger formulas. For example, `=DATE(2026, SEQUENCE(1,12), 1)` returns the first day of each month of 2026 across twelve columns (format the cells as dates).

## XMATCH

`XMATCH(lookup_value, lookup_array, [match_mode], [search_mode])` returns the position of an item in a range. It improves on `MATCH` with explicit modes:

| match_mode | Meaning |
|---|---|
| 0 (default) | Exact match |
| -1 | Exact match, or the next smaller item |
| 1 | Exact match, or the next larger item |
| 2 | Wildcard match (`*`, `?`, `~` are special) |

| search_mode | Meaning |
|---|---|
| 1 (default) | Search first to last |
| -1 | Search last to first |
| 2 / -2 | Binary search, ascending / descending (the data must already be sorted) |

On the reps in `B2:B9` (Ana, Ben, Cy, Ben, Ana, Dee, Ana, Dee):

| Formula | Result | Why |
|---|---|---|
| `=XMATCH("Ana", B2:B9)` | 1 | The first Ana is the first item. |
| `=XMATCH("Ana", B2:B9, 0, -1)` | 7 | Searching from the bottom finds the last Ana. |
| `=XMATCH("D*", B2:B9, 2)` | 6 | Wildcard match finds the first name starting with D. |
| `=INDEX(D2:D9, XMATCH("Dee", B2:B9, 0, -1))` | 310 | Position 8 is Dee's last order; `INDEX` fetches its amount. |

A classic use of match mode `-1` is bands. Put the thresholds 0, 100, 250, 500 in `F2:F5` (sorted ascending).

| Formula | Result | Why |
|---|---|---|
| `=XMATCH(175, F2:F5, -1)` | 2 | 175 is not listed, so the next smaller item, 100, is used: position 2. |
| `=XMATCH(60, F2:F5, -1)` | 1 | The next smaller item is 0. |
| `=XMATCH(400, F2:F5, -1)` | 3 | The next smaller item is 250. |

Feed that position into `INDEX` over a list of labels to turn amounts into "Small", "Medium", "Large".

## Your turn: spot the spill problem

You type `=UNIQUE(B2:B9)` in `K2`. It returns `#SPILL!`. You select `K2` and see a dashed border running from `K2` to `K5`. Cell `K4` holds the text "check later". What do you do, and what should the spill show once fixed?

Clear or move the contents of `K4`. The formula then returns Ana, Ben, Cy, and Dee in `K2:K5`.

Check yourself before moving on:

```quiz
[
  {"q": "A FILTER formula returns #CALC! when nothing matches. What is the standard fix?", "choices": ["Wrap the whole data range in an Excel Table", "Supply the third argument, if_empty, such as \"none\"", "Press Ctrl+Shift+Enter to enter it as an array formula", "Add the @ operator before the range"], "answer": 1, "explain": "FILTER returns #CALC! when it finds no rows and no if_empty value was given. The third argument gives it a fallback to display."},
  {"q": "A FILTER formula in F2 currently spills into F2:I5. Which formula always refers to the whole spilled result, even if it later grows to 10 rows?", "choices": ["F2:I5", "F2#", "@F2", "F2:F2"], "answer": 1, "explain": "The # spill-reference operator after the anchor cell means the entire current spill range. A fixed range like F2:I5 would not grow."},
  {"q": "Using the sample data, what does =UNIQUE(B2:B9,,TRUE) return?", "choices": ["Ana, Ben, Cy, Dee", "Cy", "Ana", "Ben, Dee"], "answer": 1, "explain": "The third argument exactly_once returns only values appearing a single time. Ana appears 3 times, Ben 2, Dee 2, and Cy once."}
]
```

## Recap

1. A dynamic array formula returns many values and spills them into a spill range anchored at the cell you typed.
2. `#SPILL!` means something is in the way: non-empty or merged cells, a Table, an unsizable result, or too much data. Excel never overwrites your data.
3. `F2#` refers to the whole spill range, and an `@` in an old formula marks implicit intersection that Excel used to apply silently.
4. FILTER takes conditions you combine with `*` (AND) and `+` (OR), and needs `if_empty` to avoid `#CALC!`.
5. SORT sorts by a column number, SORTBY by a separate range. UNIQUE de-duplicates, SEQUENCE generates numbers, XMATCH finds positions with explicit match and search modes.

Next up, [LET and LAMBDA](02-let-and-lambda.md): once formulas get this long, you need to name the pieces.
