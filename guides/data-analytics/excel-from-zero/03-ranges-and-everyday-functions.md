---
title: "Ranges and Everyday Functions"
guide: "excel-from-zero"
phase: 3
summary: "A range names a block of cells, and functions like SUM, AVERAGE, COUNT, COUNTA, MIN, MAX, and ROUND summarize it; learn what each one counts and what it silently ignores."
tags: [excel, ranges, functions, sum, average, count, counta, min, max, round]
difficulty: beginner
synonyms: ["how to use sum in excel", "difference between count and counta", "what is a range in excel", "how does average treat blank cells", "how to round in excel", "why is sum not adding my numbers", "excel autosum shortcut"]
updated: 2026-10-06
---

# Ranges and Everyday Functions

Adding eight numbers by typing `=F2+F3+F4+F5+F6+F7+F8+F9` works until the list has eight hundred. Functions and ranges let one short formula summarize any number of cells, and knowing precisely what each function counts and ignores is what keeps a total from being quietly wrong.

## What a range is

A **range** is a rectangular block of cells, written as its top-left cell and bottom-right cell with a colon between them. Read the colon as "through".

| Written | Means |
|---|---|
| `F2:F9` | F2 through F9, a column of 8 cells |
| `A1:C1` | A1 through C1, a row of 3 cells |
| `A1:C3` | a 3 by 3 block, 9 cells |
| `F:F` | all of column F |

Click and drag over cells while typing a formula, or hold `Shift` and use the arrow keys, and Excel writes the range for you.

## What a function is

A **function** is a named, ready-made recipe. You give it inputs inside parentheses, called **arguments**, and it hands back a result. The shape is always:

```excel
=NAME(argument1, argument2, ...)
```

Arguments are separated by commas in US-style settings. Some regional settings use semicolons instead, so if a formula from a tutorial refuses to enter, try that. As you type a function name, Excel suggests matches; press `Tab` to accept one.

## The core seven

All examples use the Total column from your sales list: `F2:F9` holds 13.5, 11, 12, 9, 25, 18.9, 22, 10.5.

| Function | What it does | Formula | Result |
|---|---|---|---|
| SUM | adds the numbers | `=SUM(F2:F9)` | 121.9 |
| AVERAGE | adds, then divides by how many numbers | `=AVERAGE(F2:F9)` | 15.2375 |
| COUNT | counts cells holding numbers | `=COUNT(F2:F9)` | 8 |
| COUNTA | counts cells that are not empty | `=COUNTA(B2:B9)` | 8 |
| MIN | the smallest number | `=MIN(F2:F9)` | 9 |
| MAX | the largest number | `=MAX(F2:F9)` | 25 |
| ROUND | rounds to a number of decimals | `=ROUND(F7*1.08, 2)` | 20.41 |

Check one by hand: 13.5 + 11 + 12 + 9 + 25 + 18.9 + 22 + 10.5 = 121.9, and 121.9 divided by 8 numbers is 15.2375.

The fastest way to total a column is `Alt + =`, the AutoSum shortcut. Excel guesses the range above or beside the cell, so read the highlighted range before pressing Enter.

You can also select cells and glance at the status bar at the bottom of the window: it shows Sum, Average, and Count for the selection without writing any formula.

## ROUND: choosing the decimals

`ROUND(number, num_digits)` rounds `number` to `num_digits` decimal places. A positive number keeps decimals, `0` rounds to a whole number, and a negative number rounds to the left of the decimal point.

| Formula | Result |
|---|---|
| `=ROUND(2.15, 1)` | 2.2 |
| `=ROUND(15.2375, 2)` | 15.24 |
| `=ROUND(15.2375, 0)` | 15 |
| `=ROUND(21.5, -1)` | 20 |

Using it on a formula result nests one function inside another: `=ROUND(AVERAGE(F2:F9), 2)` gives 15.24. ROUND changes the stored value, which matters in the next phase.

## What each function ignores

This is where wrong totals come from. Suppose column A holds this, with `A6` typed as `'40` (a leading apostrophe forces text) and `A4` left empty:

| Cell | Holds |
|---|---|
| A1 | 10 |
| A2 | 20 |
| A3 | n/a (text) |
| A4 | (empty) |
| A5 | 30 |
| A6 | 40 stored as text |

| Formula | Result | Why |
|---|---|---|
| `=SUM(A1:A6)` | 60 | text and empty cells are skipped |
| `=COUNT(A1:A6)` | 3 | counts only real numbers: A1, A2, A5 |
| `=COUNTA(A1:A6)` | 5 | counts everything non-empty, including the text |
| `=AVERAGE(A1:A6)` | 20 | 60 divided by the 3 numbers |

Notice the text "40" in A6 never reached the total. SUM, AVERAGE, COUNT, MIN, and MAX read only true numbers from a range. That is why a column of numbers that "will not add up" is almost always a column where some cells are text. Fix that in Phase 4.

COUNT and COUNTA answer different questions. COUNT is "how many numbers", COUNTA is "how many filled cells". COUNTA also counts error values and cells holding an empty string `""` returned by a formula.

**Empty is not zero.** Take `10`, an empty cell, and `0`. `AVERAGE` of those three cells is 5, because it skips the empty cell and averages 10 and 0. If the empty cell held a 0 it would be 3.33. The empty cell is ignored, a zero is counted.

Averaging nothing is an error: `=AVERAGE(A1:A3)` over three empty cells returns `#DIV/0!`, because there is no number to divide by. Phase 5 covers errors.

## The loose-range trap

`=SUM(F2:F9)` is a loose range: Excel remembers rows 2 to 9 and nothing else. Add a new sale in row 10 and the sum does not change. Inserting a row *inside* the range works, because the range stretches. Adding below the last row does not. This is the main reason Phase 5 turns the list into a Table.

Try these, using the A1:A6 values above:

```exercise
[
  {
    "type": "predict",
    "task": "Column A holds 10, 20, the text n/a, an empty cell, 30, and the text 40 (typed with a leading apostrophe). What does =COUNTA(A1:A6) return?",
    "accept": ["5"],
    "hint": "COUNTA counts every cell that is not empty, whatever it contains."
  },
  {
    "type": "predict",
    "task": "Cells B1, B2, B3 hold 10, an empty cell, and 0. What does =AVERAGE(B1:B3) return?",
    "accept": ["5"],
    "hint": "AVERAGE skips the empty cell but counts the zero."
  },
  {
    "type": "predict",
    "task": "What does =ROUND(21.5, -1) return?",
    "accept": ["20"],
    "hint": "A negative number of digits rounds to the left of the decimal point, here to the nearest 10."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "A column has four numbers and one cell containing the text word pending. What does COUNT return, and what does COUNTA return?",
    "choices": ["COUNT 4, COUNTA 5", "COUNT 5, COUNTA 5", "COUNT 4, COUNTA 4"],
    "answer": 0,
    "explain": "COUNT counts only numbers. COUNTA counts every non-empty cell, including text."
  },
  {
    "q": "Your SUM over a column is lower than the total you expect, and a few values sit on the left edge of their cells. The most likely cause?",
    "choices": ["SUM only adds the first 255 cells", "Those values are stored as text and SUM skips them", "The range includes the header row"],
    "answer": 1,
    "explain": "Numbers stored as text are not numbers to SUM. Left alignment is the usual tell."
  },
  {
    "q": "In =SUM(F2:F9), what does the colon mean?",
    "choices": ["Divide F2 by F9", "A range: F2 through F9, every cell between them", "Only the two cells F2 and F9"],
    "answer": 1,
    "explain": "A colon builds a range from the first cell through the last. Two separate cells would be written with a comma."
  }
]
```

## Recap

1. A range like `F2:F9` is a rectangular block of cells; the colon means "through".
2. A function is a named recipe, `=NAME(arguments)`, and arguments can be ranges.
3. SUM, AVERAGE, MIN, and MAX use only real numbers in a range; text and empty cells are skipped.
4. COUNT counts numbers, COUNTA counts anything non-empty.
5. An empty cell is ignored by AVERAGE, but a 0 is counted.
6. `ROUND(number, digits)` rounds a value, and `Alt + =` inserts a SUM for you.
7. A typed range like `F2:F9` does not grow when you add rows below it.

Next up, [Phase 4: Formatting, Sorting, and Filtering](04-formatting-sorting-filtering.md): why a formatted 0.5 is still 0.5, and how to reorder data safely.
