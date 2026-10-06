---
title: "Cell References: Relative, Absolute, Mixed"
guide: "excel-from-zero"
phase: 2
summary: "A reference is a relative instruction by default, so copying a formula shifts it; learn how $ locks a row or column and use F4 to switch between relative, absolute, and mixed references."
tags: [excel, cell-references, absolute-reference, relative-reference, mixed-reference, fill-handle]
difficulty: beginner
synonyms: ["relative vs absolute reference in excel", "what does the dollar sign mean in excel", "how to lock a cell in an excel formula", "why does my formula change when i copy it", "what is a mixed reference in excel", "what does F4 do in excel", "how to fill a formula down a column"]
updated: 2026-10-06
---

# Cell References: Relative, Absolute, Mixed

You write one formula, drag it down, and it works for every row. Then you try a formula with a tax rate in one cell, drag it down, and every row after the first shows zero. Both behaviors come from the same rule, and once you see the rule you can predict what any copied formula will do.

## A reference is directions, not a street address

By default a reference like `D2` does not mean "the cell at D2 forever". It means "the cell two columns to my left on this same row", measured from where the formula lives. This is called a **relative reference**.

When you copy the formula, Excel keeps the *directions* and recomputes the *destination*. Copy `=D2*E2` from F2 to F3 and the directions "two left, one left, same row" now land on row 3, so you get `=D3*E3`.

Try it on your sales list. Click `F2`, press `Ctrl + C`, select `F3:F9`, press `Ctrl + V`:

| Cell | Formula after paste | Shows |
|---|---|---|
| F2 | `=D2*E2` | 13.5 |
| F3 | `=D3*E3` | 11 |
| F4 | `=D4*E4` | 12 |
| F5 | `=D5*E5` | 9 |
| F6 | `=D6*E6` | 25 |
| F7 | `=D7*E7` | 18.9 |
| F8 | `=D8*E8` | 22 |
| F9 | `=D9*E9` | 10.5 |

Faster ways to do the same copy:

- **Fill handle.** Select F2. The small square at its bottom-right corner is the fill handle. Drag it down, or double-click it to fill as far down as the neighboring column has data.
- **Ctrl + D** fills the top cell of a selection down through the rest of it. **Ctrl + R** fills right.

Relative references are the default because most spreadsheet work is "do the same thing to every row".

## When relative breaks: the tax rate

Now add sales tax. In `I1` type `Tax rate` and in `J1` type `0.08` (8 percent). Put `Tax` in `G1`. In `G2` type a formula that multiplies the row's total by the rate:

```excel
=F2*J1
```

G2 shows 1.08. Now fill it down to G9. Every row below shows 0. Click G3 and read the bar:

| Cell | Formula | Why |
|---|---|---|
| G2 | `=F2*J1` | correct, 13.5 * 0.08 = 1.08 |
| G3 | `=F3*J2` | J2 is empty, counts as 0 |
| G4 | `=F4*J3` | J3 is empty, 0 again |

You wanted `F` to move down with each row, which it did. But `J1` also moved down, because "three columns to the right and one row up" is a relative direction, and from G3 that points at J2. The tax rate sits in one fixed cell, so that reference must not move.

## Absolute references: the dollar sign pins it

A `$` in front of a column letter or row number locks that part. `$J$1` means "column J, row 1, always", wherever you copy it. Fix G2:

```excel
=F2*$J$1
```

Fill down again:

| Cell | Formula | Shows |
|---|---|---|
| G2 | `=F2*$J$1` | 1.08 |
| G3 | `=F3*$J$1` | 0.88 |
| G4 | `=F4*$J$1` | 0.96 |
| G5 | `=F5*$J$1` | 0.72 |
| G6 | `=F6*$J$1` | 2 |
| G7 | `=F7*$J$1` | 1.512 |
| G8 | `=F8*$J$1` | 1.76 |
| G9 | `=F9*$J$1` | 0.84 |

*What just happened:* `F2` stayed relative and followed the row, `$J$1` stayed pinned, and changing J1 to `0.1` now updates the whole Tax column at once. That is the reason to put a rate in its own cell instead of typing 0.08 into every formula: one place to change, no hunting.

## Four forms of one reference

You can lock the column, the row, both, or neither. The `$` sits right before the part it locks.

| Written | Column | Row | Name |
|---|---|---|---|
| `A1` | moves | moves | relative |
| `$A$1` | locked | locked | absolute |
| `A$1` | moves | locked | mixed (row locked) |
| `$A1` | locked | moves | mixed (column locked) |

Instead of typing dollar signs, put the cursor in a reference while editing and press `F4`. Each press cycles `A1`, `$A$1`, `A$1`, `$A1`, then back to `A1`. On a Mac, Microsoft lists `Command + T` or `F4` (some keyboards need `Fn + F4`).

## Mixed references: one formula, a whole grid

Mixed references earn their keep when a formula must fill both down and across. On a spare sheet, build a multiplication grid: put `1`, `2`, `3` in `B1:D1` (across the top) and `10`, `20`, `30` in `A2:A4` (down the side). In `B2` type:

```excel
=$A2*B$1
```

Read it: `$A2` means "column A is locked, the row follows me", so each row picks its own side number. `B$1` means "row 1 is locked, the column follows me", so each column picks its own top number. Fill `B2` across to `D2`, then down to row 4:

| | A | B | C | D |
|---|---|---|---|---|
| 1 | | 1 | 2 | 3 |
| 2 | 10 | 10 | 20 | 30 |
| 3 | 20 | 20 | 40 | 60 |
| 4 | 30 | 30 | 60 | 90 |

`D4` holds `=$A4*D$1`, which is 30 * 3 = 90. A single formula built the whole table, which is impossible with only relative or only absolute references.

## Copy versus move

Copying a formula adjusts its relative references. **Cutting** and pasting (`Ctrl + X`, `Ctrl + V`) does not: a moved formula keeps pointing at exactly the same cells. If you move a cell that other formulas refer to, those formulas follow it to its new home. Use copy when you want the pattern repeated, cut when you want the same thing relocated.

## References to other sheets

To use a cell from another sheet, write the sheet name, an exclamation mark, then the cell: `=Sheet2!B4`. If the sheet name has a space, wrap it in single quotes: `='Price List'!B4`. The same `$` rules apply.

Test yourself:

```exercise
[
  {
    "type": "predict",
    "task": "G2 contains =F2*$J$1. You copy G2 into G5. Type the formula that G5 now contains, starting with the equals sign.",
    "accept": ["=F5*$J$1", "F5*$J$1"],
    "hint": "F is relative and moves down 3 rows. $J$1 never moves."
  },
  {
    "type": "predict",
    "task": "B2 contains =$A2*B$1. You copy B2 into D4. Type the formula D4 now contains, starting with the equals sign.",
    "accept": ["=$A4*D$1", "$A4*D$1"],
    "hint": "Columns shift by 2 and rows shift by 2, but only the parts without a dollar sign move."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "A formula in F2 reads =D2*E2. You copy it to F7. What does F7 contain?",
    "choices": ["=D2*E2", "=D7*E7", "=D7*E2"],
    "answer": 1,
    "explain": "Relative references keep their directions, not their destination, so both references move down five rows."
  },
  {
    "q": "Which reference keeps the column fixed but lets the row change when copied?",
    "choices": ["A$1", "$A1", "$A$1"],
    "answer": 1,
    "explain": "The dollar sign locks the part right after it. $A1 locks column A and leaves the row free. A$1 does the opposite."
  },
  {
    "q": "You copy =B$2 from C5 to D7. What does D7 contain?",
    "choices": ["=C$2", "=C4", "=B$4"],
    "answer": 0,
    "explain": "The column is relative and moves one to the right (B becomes C). The row is locked by the dollar sign and stays 2."
  }
]
```

## Recap

1. A plain reference like `D2` is a relative direction from the formula's own cell, so copying shifts it.
2. `$` locks the part that follows it: `$J$1` locks both, `J$1` locks the row, `$J1` locks the column.
3. Press `F4` while editing a reference to cycle through the four forms.
4. Put constants like a tax rate in their own cell and refer to them with an absolute reference.
5. A mixed reference lets one formula fill correctly both down and across.
6. Copy adjusts relative references; cut and paste does not.

Next up, [Phase 3: Ranges and Everyday Functions](03-ranges-and-everyday-functions.md): summarizing many cells at once.
