---
title: "Formatting, Sorting, and Filtering"
guide: "excel-from-zero"
phase: 4
summary: "Number formats change how a value looks, never what it is; learn the difference between display and value, then sort and filter a list without scrambling rows or trusting the wrong total."
tags: [excel, number-format, sorting, filtering, subtotal, data-cleaning]
difficulty: beginner
synonyms: ["why does excel show a different number than the cell contains", "how to sort data in excel without messing up rows", "how to filter in excel", "does formatting change the value in excel", "how to convert text to number in excel", "sum of filtered cells in excel", "excel ctrl shift L filter"]
updated: 2026-10-06
---

# Formatting, Sorting, and Filtering

Two things trip up almost everyone in their first month: a number that looks like one thing and behaves like another, and a sort that shuffles one column away from the rest of its row. Both come from the same idea from Phase 1. What you see in a cell and what the cell holds are different things, and Excel gives you tools that change one without touching the other.

## Formatting changes the look, not the value

A **number format** is a rule for how to display a stored value. The stored value stays exactly as it was, and you can always see it in the formula bar.

Select a cell, press `Ctrl + 1` to open the Format Cells dialog (or use the Number group on the Home tab), and pick a format.

| Stored value | Format | Displayed | Still stored |
|---|---|---|---|
| 0.5 | General | 0.5 | 0.5 |
| 0.5 | Percentage, 0 decimals | 50% | 0.5 |
| 4.5 | Currency, 2 decimals | $4.50 | 4.5 |
| 46296 | Date | 10/1/2026 | 46296 |
| 46296 | General | 46296 | 46296 |

A formatted 0.5 is still 0.5. Type `=A1*10` next to a cell showing 50% and you get 5, not 500. The percent sign is decoration.

Useful shortcuts: `Ctrl + Shift + ~` applies General, `Ctrl + Shift + %` applies Percentage, and `Ctrl + 1` opens the full dialog. The Home tab also has Increase Decimal and Decrease Decimal buttons.

One input shortcut works the other way: typing `15%` into a cell stores 0.15 and formats it as a percentage in one move.

### The display trap

Put `2.4` in `A1` and `2.4` in `A2`. Set both to Number with 0 decimals. They display as 2 and 2. Now type `=A1+A2` in `A3` and give it the same format:

| Cell | Stored | Displayed |
|---|---|---|
| A1 | 2.4 | 2 |
| A2 | 2.4 | 2 |
| A3 | 4.8 | 5 |

On screen, 2 + 2 = 5. Nothing is broken. Excel added the stored values, 2.4 and 2.4, and then displayed 4.8 with no decimals. When a total looks wrong by a hair, widen the decimals before you doubt the formula.

If you want the value itself changed, use a function, not a format. Put `2.456` in a cell. Formatting it to 2 decimals shows 2.46, but `=A1*100` still gives 245.6. `=ROUND(A1, 2)*100` gives 246, because ROUND changed the stored number. Format for presentation, ROUND when the rounded number is the number you want to calculate with.

### When a number is really text

If numbers sit on the left and SUM ignores them, they are stored as text. Often Excel marks such a cell with a small green triangle in the corner. Select the cell, click the warning icon that appears, and choose **Convert to Number**. You can do it for a whole selection at once.

Changing the format to Number alone does not convert text that is already in the cell. The conversion happens when the cell is re-entered or converted.

## Sorting

A sort reorders rows. Click any single cell in the column you want to sort by, then on the **Data** tab click **Sort A to Z** or **Sort Z to A**. For numbers that means smallest to largest or largest to smallest, and for dates oldest to newest or newest to oldest.

Excel looks at the cells around your selection, finds the connected block (stopping at the first fully empty row and column), detects the header row, and moves **whole rows** together. This is why Phase 2 left column H empty: A1:G9 is one block, and the tax rate in I1:J1 stays out of the sort.

Sort Total from largest to smallest and the list becomes:

| Item | Category | Qty | Price | Total |
|---|---|---|---|---|
| Marker Set | Writing | 4 | 6.25 | 25 |
| Pen Pack (Oct 4) | Writing | 10 | 2.20 | 22 |
| Desk Lamp | Office | 1 | 18.90 | 18.9 |
| Notebook (Oct 1) | Paper | 3 | 4.50 | 13.5 |
| Stapler | Office | 1 | 12.00 | 12 |
| Pen Pack (Oct 1) | Writing | 5 | 2.20 | 11 |
| Sticky Notes | Paper | 6 | 1.75 | 10.5 |
| Notebook (Oct 2) | Paper | 2 | 4.50 | 9 |

The date column travels with each row, and so do the formulas in F and G, because each formula refers to cells in its own row.

For two criteria, use **Data > Sort**. Set Sort by Category (A to Z), click **Add Level**, set Then by Total (Largest to Smallest), and make sure **My data has headers** is ticked:

| Category | Item | Total |
|---|---|---|
| Office | Desk Lamp | 18.9 |
| Office | Stapler | 12 |
| Paper | Notebook (Oct 1) | 13.5 |
| Paper | Sticky Notes | 10.5 |
| Paper | Notebook (Oct 2) | 9 |
| Writing | Marker Set | 25 |
| Writing | Pen Pack (Oct 4) | 22 |
| Writing | Pen Pack (Oct 1) | 11 |

⚠️ **Gotcha: never sort one column alone.** If you select a whole single column and sort it, Excel warns that it found data next to your selection. Choose **Expand the selection**. If you choose to continue with only the selected column, that column reorders and the rest stays put, so every price now belongs to the wrong item. There is no clue in the sheet that anything went wrong.

⚠️ **Gotcha: formulas that look at other rows.** Formulas that refer to cells in other rows can return different results after a sort, because the rows they pointed at have moved. Row-by-row formulas like `=D2*E2` are safe.

Sorting cannot be undone once the file is closed, and after sorting the original order is gone. If the original order matters, add a numbering column (1, 2, 3, ...) first, so you can sort back by it.

## Filtering

A **filter** hides the rows that do not match, without deleting them. Click any cell in the list and press `Ctrl + Shift + L` (or Data > Filter). Drop-down arrows appear on every header.

Open the Category arrow, untick Select All, tick **Writing**, and press OK. The row numbers turn blue, the other rows are hidden, and the status bar at the bottom left shows "3 of 8 records found" (if it is missing, right-click the status bar and tick Count). The three visible rows are the Marker Set and the two Pen Pack sales. To bring everything back, use **Data > Clear**; to remove the arrows, press `Ctrl + Shift + L` again.

The arrow menus also offer **Text Filters**, **Number Filters**, and **Date Filters**. Number Filters > Greater Than with 15 on Total shows Marker Set, Pen Pack (Oct 4), and Desk Lamp. Filters on several columns combine: each one narrows what the previous left visible.

Filter lists show every distinct entry, so inconsistent spelling shows up as separate entries: `Writing` and `Writing ` (with a trailing space) are two items. If a filter lists what looks like a duplicate, you have found dirty data.

### Totals and filters

Filter Category to Writing, then look at `=SUM(F2:F9)`. It still says 121.9. SUM adds every cell in the range, including rows hidden by the filter. To total only what you can see, use SUBTOTAL:

```excel
=SUBTOTAL(109, F2:F9)
```

The first argument picks the operation; 109 means SUM. SUBTOTAL ignores any row hidden by a filter, and with the 100-series codes it also ignores rows you hid by hand. Here it returns 58, which is 11 + 25 + 22. Plain SUM would still say 121.9.

Try these before the quiz:

```exercise
[
  {
    "type": "predict",
    "task": "A1 holds 2.4 and A2 holds 2.4. Both cells use Number format with 0 decimals. A3 contains =A1+A2 with the same format. What number appears in A3?",
    "accept": ["5"],
    "hint": "Excel adds the stored values (4.8) and then displays the result with no decimals."
  },
  {
    "type": "predict",
    "task": "A cell holds the number 0.5 and is displayed as 50%. What does =A1*10 return?",
    "accept": ["5"],
    "hint": "The stored value is 0.5. The percent sign is only the display."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "A cell displays $4.50 after you applied Currency format. What does the formula bar show?",
    "choices": ["$4.50 as text", "4.5, the stored number", "4.50 rounded and locked"],
    "answer": 1,
    "explain": "Formatting changes the display only. The stored value is the number 4.5."
  },
  {
    "q": "You filter a list down to 3 of 8 rows. What does =SUM over the whole column return?",
    "choices": ["The total of the 3 visible rows", "The total of all 8 rows, hidden ones included", "An error"],
    "answer": 1,
    "explain": "SUM adds every cell in the range. Use SUBTOTAL(109, range) to add only the visible rows."
  },
  {
    "q": "Why is sorting only one column of a table dangerous?",
    "choices": ["It deletes the other columns", "It reorders that column alone, so each row's values no longer belong together", "It converts numbers to text"],
    "answer": 1,
    "explain": "The column moves and its neighbors stay put, silently breaking the match between each value and its row."
  }
]
```

## Recap

1. A number format changes how a value is displayed; the stored value is in the formula bar and never changes.
2. A formatted 0.5 is still 0.5. Use ROUND when you want the stored value itself rounded.
3. Displayed totals can look off by a hair because Excel adds stored values, not rounded ones.
4. Numbers stored as text sit on the left; use the green triangle's Convert to Number.
5. Sort moves whole rows as a block; use Data > Sort for several levels and never sort a single column alone.
6. Filter hides rows without deleting them; `Ctrl + Shift + L` toggles it.
7. SUM ignores filters; `SUBTOTAL(109, range)` totals only the visible rows.

Next up, [Phase 5: Tables and Error Values](05-tables-and-errors.md): a list that grows, sorts, and filters itself, plus what each error code means.
