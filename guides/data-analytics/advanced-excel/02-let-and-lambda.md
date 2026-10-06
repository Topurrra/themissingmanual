---
title: "LET and LAMBDA: Readable and Reusable Formulas"
guide: "advanced-excel"
phase: 2
summary: "Name the pieces of a long formula with LET, then package a formula as your own reusable function with LAMBDA and the Name Manager, including MAP and BYROW to apply it across a list."
tags: [excel, let, lambda, name-manager, byrow, map, custom-functions]
difficulty: advanced
synonyms: ["excel let function explained", "how to use let in excel", "excel lambda function tutorial", "create custom function in excel without vba", "excel name manager lambda", "excel byrow function", "excel map function", "why is my lambda returning #calc"]
updated: 2026-10-06
---

# LET and LAMBDA: Readable and Reusable Formulas

Once you stack FILTER inside SORT inside INDEX, a formula stops being readable. Three weeks later you open it and cannot tell which `D2:D9` is which. Worse, the same chunk appears three times, so Excel works it out three times and one fix has to be made in three places. LET gives the pieces names. LAMBDA lets you give the whole formula a name and call it like `SUM`.

Version note, per Microsoft's documentation: LET works in Microsoft 365, Excel 2024, and Excel 2021. LAMBDA, BYROW, and MAP are documented for Microsoft 365 and Excel 2024, not for Excel 2021. If you share a workbook, the other person's version decides whether your LAMBDA works.

## LET: variables inside a formula

`LET(name1, value1, [name2, value2, ...], calculation)` assigns names to values, then evaluates a final calculation that uses them. The names exist only inside that one formula. Think of it as a scratch pad written at the top of the formula.

Rules from Microsoft: the last argument must be the calculation that returns the result, you can define up to 126 name and value pairs, and names must start with a letter and cannot look like a cell reference (so `x1` is out, `east` is fine).

Using the sales data from [Phase 1](01-dynamic-arrays-and-spilling.md) (`A1:D9`, total 1,690), the East share of all sales:

```excel
=LET(
    east,  SUMIFS(D2:D9, A2:A9, "East"),
    total, SUM(D2:D9),
    east / total
)
```

| Step | Value |
|---|---|
| `east` | 400 + 120 + 60 + 175 = 755 |
| `total` | 1,690 |
| result | 755 / 1,690 = 0.4467, shown as 44.7% once formatted as a percentage |

Line breaks and spaces inside a formula are allowed: press Alt+Enter in the formula bar to add a line break. Formatting like this is half the benefit.

The other half is speed and safety. Microsoft notes that a repeated expression is calculated each time it appears, while a LET name is calculated once and reused. Change the threshold in one place and every use updates.

## LET with arrays

A name can hold a whole array. Task: list the reps whose total sales are at least 500, biggest first.

```excel
=LET(
    reps,   UNIQUE(B2:B9),
    totals, SUMIF(B2:B9, reps, D2:D9),
    keep,   totals >= 500,
    SORTBY(FILTER(reps, keep), FILTER(totals, keep), -1)
)
```

Walk through it by hand:

| Name | Value |
|---|---|
| `reps` | Ana, Ben, Cy, Dee |
| `totals` | 635, 530, 120, 405 (Ana: 400 + 60 + 175, Ben: 150 + 380, Cy: 120, Dee: 95 + 310) |
| `keep` | TRUE, TRUE, FALSE, FALSE |

`FILTER(reps, keep)` gives Ana and Ben, `FILTER(totals, keep)` gives 635 and 530, and `SORTBY(..., -1)` orders by those totals descending. Spilled result: **Ana, Ben**.

Without LET you would write `UNIQUE(B2:B9)` and `SUMIF(...)` twice each, nested six deep. With LET, each line reads like a step in a recipe.

## LAMBDA: your own function

`LAMBDA([parameter1, parameter2, ...], calculation)` creates a function with parameters. You can test one directly by appending arguments in parentheses:

```excel
=LAMBDA(number, number + 1)(1)
```

That returns 2. Microsoft documents this call-in-place pattern for testing.

The gotcha everybody hits: put a bare `=LAMBDA(number, number + 1)` in a cell without calling it and Excel returns `#CALC!`. A LAMBDA has to be called, either with parentheses and arguments as above or by a name.

Limits from Microsoft: up to 253 parameters, and a parameter name follows normal name rules with one exception, no period.

## Name it in Name Manager

The real power is saving a LAMBDA under a name, so the whole workbook can call it.

1. On the Formulas tab, select **Name Manager**, then **New**.
2. **Name**: `SharePct`.
3. **Scope**: Workbook.
4. **Comment**: up to 255 characters. Say what it does and what the argument means: `Share of all sales for one region. Argument: region name`. The comment shows as a tooltip when someone calls it.
5. **Refers to**:

```excel
=LAMBDA(region, SUMIFS($D$2:$D$9, $A$2:$A$9, region) / SUM($D$2:$D$9))
```

6. Select **OK**.

Now it behaves like a built-in function:

| Formula | Result |
|---|---|
| `=SharePct("East")` | 755 / 1,690 = 44.7% |
| `=SharePct("West")` | 530 / 1,690 = 31.4% |
| `=SharePct("North")` | 405 / 1,690 = 24.0% |

(West is 150 + 380, North is 95 + 310.)

If the share definition ever changes, you edit one name in Name Manager and every cell that calls `SharePct` updates. That is the case for LAMBDA: one definition, many callers, no copy-paste drift.

You can also keep a LAMBDA private to one formula by defining it inside LET and calling it by that local name, for example `=LET(double, LAMBDA(x, x * 2), double(5))`, which returns 10.

> ⚠️ **Gotcha**
> A named LAMBDA is only as portable as the Excel version of whoever opens the file. Nothing you write with LAMBDA can be used in versions that do not include it. For anything you send to many people, check their versions first, or keep the logic in plain formulas.

## MAP and BYROW: apply a LAMBDA across a list

On their own, LAMBDAs work on one thing at a time. Two helpers apply them across arrays.

`MAP(array1, lambda)` calls the LAMBDA once per element and returns an array of the same shape. With more than one array, the LAMBDA needs one parameter per array, and the LAMBDA must be the last argument.

```excel
=MAP(UNIQUE(A2:A9), LAMBDA(r, SUMIFS(D2:D9, A2:A9, r)))
```

`UNIQUE(A2:A9)` is East, West, North (order of first appearance), so the spill is the region totals: **755, 530, 405**.

`BYROW(array, lambda(row))` passes each row of an array to the LAMBDA as a single parameter, which must return one value, and returns one result per row. Say `G2:I5` holds the monthly amounts per rep (rows Ana, Ben, Cy, Dee; columns Jan, Feb, Mar), the same layout as the export you clean in the next phase:

| | Jan | Feb | Mar |
|---|---|---|---|
| Ana | 400 | 380 | 0 |
| Ben | 150 | 0 | 210 |
| Cy | 120 | 90 | 60 |
| Dee | 95 | 310 | 175 |

```excel
=BYROW(G2:I5, LAMBDA(r, SUM(r)))
```

Result: **780, 360, 270, 580**, one total per rep. They add to 1,990, the grand total of the grid. If the LAMBDA returns more than one value, BYROW returns `#CALC!`.

When a single built-in function already does the job, use it. MAP and BYROW earn their place when the per-item logic is custom.

## Your turn: name the pain

You find `=SUMIFS(D2:D9,A2:A9,"East")/SUM(D2:D9)` pasted into forty cells, and the boss wants the denominator to exclude Dee's orders. Which tool fits: LET inside each cell, or a named LAMBDA? A named LAMBDA, because there is one definition to fix instead of forty copies. LET alone would still leave forty formulas to edit.

Check yourself before moving on:

```quiz
[
  {"q": "You type =LAMBDA(x, x+x) into a cell and press Enter. What do you get, and why?", "choices": ["20, because x defaults to 10", "#CALC!, because the LAMBDA was created but never called", "#NAME?, because LAMBDA must be saved first", "0, because no argument was supplied"], "answer": 1, "explain": "Microsoft documents #CALC! for a LAMBDA created in a cell without being called. Call it as =LAMBDA(x, x+x)(5), or save it as a name and call that."},
  {"q": "What is one real benefit of LET besides readability?", "choices": ["It lets formulas run in Excel versions older than 2021", "A named value is calculated once and reused instead of being recomputed each time it appears", "It converts formulas to values permanently", "It removes the 8,192-character formula limit"], "answer": 1, "explain": "LET calculates a named expression once and reuses it. It also makes the formula shorter and easier to read, but it does not change version support or the formula length limit."},
  {"q": "In Name Manager, which field holds the LAMBDA definition itself?", "choices": ["Name", "Scope", "Comment", "Refers to"], "answer": 3, "explain": "Name is the function name, Scope is workbook or sheet, Comment is the tooltip description (up to 255 characters), and Refers to holds the =LAMBDA(...) definition."}
]
```

## Recap

1. LET names values and arrays inside one formula, calculates each once, and ends with the calculation that returns the result.
2. LAMBDA turns a calculation with parameters into a function. Test it by calling it in place with parentheses, because an uncalled LAMBDA returns `#CALC!`.
3. Save a LAMBDA under a name through Formulas, Name Manager, New, with the definition in Refers to, and edit it in one place to change every caller.
4. MAP applies a LAMBDA to each element of an array, and BYROW applies one to each row, returning one value per row.
5. LAMBDA, MAP, and BYROW need Microsoft 365 or Excel 2024, so check who will open the file.

Next up, [Power Query: Repeatable Cleanup](03-power-query-repeatable-cleanup.md): formulas analyse data, but a messy export needs reshaping first.
