---
title: "Guardrails: Data Validation and Conditional Formatting with Formulas"
guide: "advanced-excel"
phase: 4
summary: "Use custom formulas in Data Validation to reject bad entries and in Conditional Formatting to make problems visible, including the relative and absolute reference rules that decide which cells light up."
tags: [excel, data-validation, conditional-formatting, formulas, countif, absolute-references, data-quality]
difficulty: advanced
synonyms: ["excel data validation custom formula", "excel conditional formatting formula examples", "highlight entire row based on cell value excel", "excel prevent duplicate entries", "excel conditional formatting not working", "excel dollar sign conditional formatting", "excel data validation stop warning information", "excel highlight duplicates"]
updated: 2026-10-06
---

# Guardrails: Data Validation and Conditional Formatting with Formulas

Cleaning a messy export is one fight. Stopping the mess from getting into your own workbook in the first place is a better one. Data Validation refuses bad entries as they are typed. Conditional Formatting colors the cells that look wrong so nobody misses them. Both can be driven by a formula, which turns them from toys into real guardrails.

## One rule for both: write the formula for the first cell

Both tools take a formula that returns TRUE or FALSE, and you write it as if for the **active cell**: the first cell of your selection. Excel then applies the same formula to every other selected cell, shifting the references as it goes, the way copying a formula does. Microsoft's example: if you select B2 through B10, B2 is the active cell, and you write the formula for B2.

So the dollar signs decide everything:

| Reference | Meaning when applied across the selection |
|---|---|
| `D2` | Shifts in both directions: each cell tests a different cell |
| `$D2` | Column stays D, row follows each cell: each row tests its own D |
| `$D$2` | Always tests D2: all or nothing |
| `$D$2:$D$9` | A fixed range, used as the thing counted or searched |

Keep this table in mind. Nearly every "my conditional formatting is wrong" question is a missing or extra dollar sign. (Mixed references are taught in [Excel From Zero](/guides/excel-from-zero).)

## Data Validation with a custom formula

Select the cells to protect, then on the Data tab choose **Data Validation**. The dialog has three tabs: Settings, Input Message, and Error Alert. On Settings, the Allow list includes Whole Number, Decimal, List, Date, Time, Text Length, and **Custom**. Choose Custom and type a formula that must return TRUE for an entry to be accepted.

**Example 1: amounts must be positive numbers.** Select `D2:D100` (active cell `D2`) and enter:

```excel
=AND(ISNUMBER(D2), D2>0)
```

| Entry | `ISNUMBER(D2)` | `D2>0` | Result |
|---|---|---|---|
| 400 | TRUE | TRUE | Accepted |
| -5 | TRUE | FALSE | Rejected |
| abc | FALSE | TRUE (text compares greater than any number) | Rejected, because `AND` needs both |

**Example 2: no duplicate order IDs.** Say the IDs are in `A2:A100`, with 1001, 1002, and 1003 already there. Select `A2:A100` (active cell `A2`) and enter:

```excel
=COUNTIF($A$2:$A$100, A2)=1
```

You type 1002 into a new row. `COUNTIF` now counts two 1002s (the old one plus the one you are entering), so the test is `2=1`, which is FALSE, and the entry is rejected. A fresh ID such as 1004 counts once and passes.

**Example 3: a dropdown.** Choose Allow, **List**, and in Source type `East,West,North`, or point at a range by starting with an equals sign, such as `=$J$2:$J$5`. Without the `=`, Excel treats the text as a literal item. The cell now offers those choices.

### Choose the strength of the alert

On the Error Alert tab, pick a **Style**:

| Style | Behavior |
|---|---|
| Stop | Blocks the entry. The user can Retry or Cancel. |
| Warning | Warns, but the user may accept the invalid entry. |
| Information | Informs, and the user may accept or reject. |

Write a message that says how to fix it, such as "Order IDs must be unique. Check column A for this number." Use Stop for rules that must never break, and Warning where an exception can be legitimate.

> ⚠️ **Gotcha**
> Validation checks what people type. Pasting a value into a validated cell is not checked, and pasting cells copied from elsewhere can replace the validation rule itself. Rows loaded by a Power Query refresh never pass through it either. Test your own sheet: paste a bad value in and see. Treat validation as a typing guardrail, and use **Data Validation, Circle Invalid Data** on the Data tab to circle entries that already break the rules.

## Conditional Formatting with a formula

Select the range, then Home, **Conditional Formatting**, **New Rule**, **Use a formula to determine which cells to format**. Enter a formula that returns TRUE for the cells to format, choose **Format**, and select a fill or font.

**Example 1: highlight the whole row when the amount is over 300.** On the Phase 1 data, select `A2:D9` (active cell `A2`) and enter:

```excel
=$D2>300
```

The `$D` pins the test to column D. The row number is free, so each row tests its own amount. Rows 2 (400), 5 (380), and 9 (310) light up across all four columns: Ana's Desk, Ben's Desk, and Dee's Desk. Rows 3, 4, 6, 7, and 8 stay plain.

What goes wrong without the `$`: with `=D2>300` applied across `A2:D9`, each column tests a different cell, so the formatting scatters. With `=$D$2>300` every cell tests only D2, so everything lights up or nothing does.

**Example 2: flag repeated reps.** Select `B2:B9` (active cell `B2`) and enter:

```excel
=COUNTIF($B$2:$B$9, $B2)>1
```

The fixed range is what is searched. `$B2` is each cell's own name. Ana appears 3 times, Ben 2, Dee 2, Cy 1, so every cell except Cy's is highlighted. That pattern is how you spot duplicates in a column of IDs.

**Example 3: dates.** `=$E2<TODAY()` applied across a row flags anything whose due date in column E has passed, and `=$E2>TODAY()` flags dates in the future.

**Example 4: banding.** `=MOD(ROW(),2)=0` shades every second row, whatever filters or sorting you apply.

Manage rules from Home, Conditional Formatting, **Manage Rules**, where the order of rules matters and you can see which range each applies to.

## Your turn: fix the highlighter

A colleague selected `A9:D2` from the bottom up, so the active cell is `A9`, and wrote `=$D2>300`. The wrong rows are highlighting. Why, and how do you fix it?

The formula is relative to the active cell, which is `A9`, but it was written for row 2. Excel shifts the row reference accordingly, so each cell tests the amount seven rows above its own instead of its own. Delete the rule, select from `A2` down to `D9` so the active cell is `A2`, and recreate it.

Check yourself before moving on:

```quiz
[
  {"q": "You select A2:D9 with A2 active and want each row highlighted when its own Amount (column D) is over 300. Which formula is right?", "choices": ["=D2>300", "=$D$2>300", "=$D2>300", "=D$2>300"], "answer": 2, "explain": "The $ before D pins the column to D, while the row stays relative so each row tests its own amount. =D2>300 shifts across columns, and =$D$2>300 tests only D2 for every cell."},
  {"q": "A validation rule uses Custom with =COUNTIF($A$2:$A$100, A2)=1. The sheet already holds order ID 1002 and you type 1002 again. What happens?", "choices": ["It is accepted, because COUNTIF counts only existing cells", "It is rejected, because COUNTIF now finds two 1002s so the test is 2=1, which is FALSE", "It is accepted with a warning only", "It is rejected, because COUNTIF cannot count text"], "answer": 1, "explain": "The cell being entered counts too. Two matches make the test 2=1, which is FALSE, so a Stop alert rejects the entry."},
  {"q": "Which error alert style lets the user override the validation and keep the entry?", "choices": ["Stop", "Warning", "None of them; validation always blocks", "Only a macro can override"], "answer": 1, "explain": "Stop blocks. Warning and Information both allow the user to accept the entry. Warning asks whether to continue anyway."}
]
```

## Recap

1. Write the formula for the active cell, the first cell of the selection. Excel shifts references for the rest.
2. Dollar signs decide what each cell tests: `$D2` follows the row, `$D$2` is fixed, and `D2` shifts both ways.
3. Data Validation, Custom, accepts an entry only when the formula returns TRUE. Stop, Warning, and Information set how strict the alert is.
4. Conditional Formatting, Use a formula, colors cells where the formula returns TRUE. `=$D2>300` highlights whole rows.
5. Validation guards typing, not pasting or refreshing, so pair it with Circle Invalid Data and with formatting that makes problems visible.

Next up, [Knowing When to Leave Excel](05-when-to-leave-excel.md): the limits of the grid and the tools beyond it.
