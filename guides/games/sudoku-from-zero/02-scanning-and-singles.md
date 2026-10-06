---
title: "Scanning and Singles"
guide: "sudoku-from-zero"
phase: 2
summary: "The two forced moves behind most beginner Sudoku puzzles: a naked single (a cell with only one digit left) and a hidden single (a digit with only one cell left in a unit), plus a scanning routine to find them."
tags: [sudoku, naked-single, hidden-single, scanning, cross-hatching, beginner-friendly]
difficulty: beginner
synonyms: ["what is a naked single in sudoku", "what is a hidden single in sudoku", "how to scan a sudoku", "sudoku cross hatching", "sudoku for beginners strategy", "difference between naked and hidden single", "how to find the next number in sudoku"]
updated: 2026-10-06
---

# Scanning and Singles

Every Sudoku deduction does one of two things: it places a digit, or it removes a possibility. The first kind of deduction is the **single**, and it comes in two flavors that look at the same fact from opposite sides. Master these and you can finish most puzzles at the lower difficulty levels with no notes at all. They are also the move you will use hundreds of times inside hard puzzles, because fancier techniques usually end by creating a single.

We work on the puzzle from phase 1. Here it is again:

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | . . 7 | . . . | 3 2 . |
2 | 8 . 2 | . . 7 | 1 . . |
3 | 9 4 . | 1 . 6 | . 7 5 |
  +-------+-------+-------+
4 | . . . | . . 9 | 2 4 7 |
5 | . . . | . . . | . . . |
6 | 1 . . | . . 5 | 6 . . |
  +-------+-------+-------+
7 | . 7 . | 6 . . | . . . |
8 | 5 . . | . 7 4 | . 3 . |
9 | 4 . . | 5 . 1 | 7 6 . |
  +-------+-------+-------+
```

## Naked single: the cell has one digit left

Take R1C1. Which digits can it hold? Remove everything its peers already use.

- Row 1 holds 7, 3, 2.
- Column 1 holds 8, 9, 1, 5, 4.
- Box 1 holds 7, 8, 2, 9, 4.

Together those cover 1, 2, 3, 4, 5, 7, 8, 9. Only 6 is left, so R1C1 must be 6.

A cell with exactly one possible digit is a **naked single**. "Naked" means the digit is plain to see: the cell's own list of possibilities has a single entry. The method is a subtraction: nine digits, minus the digits among the cell's 20 peers.

*What just happened:* you did not search for 6. You ruled out the other eight, and the one that survived had to be right.

The same grid has four more naked singles right now: R1C6 is 8, R2C8 is 9, R3C3 is 3, and R3C7 is 8. Placing those five digits creates six more naked singles, and R2C2, which must be 5, is one of them. Solving is a cascade: each placement feeds the next.

## Hidden single: the digit has one cell left

Now flip the question. Instead of asking "what fits in this cell?", ask "where can this digit go in this unit?"

Look at box 1 and the digit 1. We can mark every cell in the grid with `o` if a 1 could still go there, `.` if not, and keep the placed 1s as `1`. A placed 1 blocks its whole row, its whole column, and its whole box.

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | . o . | . . . | . . . |
2 | . . . | . . . | 1 . . |
3 | . . . | 1 . . | . . . |
  +-------+-------+-------+
4 | . . . | . o . | . . . |
5 | . . . | . o . | . o o |
6 | 1 . . | . . . | . . . |
  +-------+-------+-------+
7 | . . o | . . . | . o o |
8 | . o o | . . . | . . o |
9 | . . . | . . 1 | . . . |
  +-------+-------+-------+
```

In box 1 (rows 1 to 3, columns 1 to 3) exactly one `o` is left: R1C2. Why do the other eight cells fail?

- R1C3, R2C1, R2C3, R3C1, and R3C2 are already filled with other digits.
- R2C2 is blocked because row 2 already has a 1 (R2C7).
- R3C3 is blocked because row 3 already has a 1 (R3C4).
- R1C1 is blocked because column 1 already has a 1 (R6C1).

Box 1 must contain a 1 somewhere, and R1C2 is the only cell that can take it. So R1C2 is 1. That is a **hidden single**: the digit is hidden among the other candidates of its cell. R1C2 can still hold 1, 5, or 6 by the cell-side view, so it is not a naked single at this moment, yet the unit-side view forces it anyway.

> 💡 **Key point**: naked and hidden singles are the same fact seen from two sides. A naked single says "this cell has only one digit left." A hidden single says "this digit has only one cell left in this unit." Each is a proof that a placement is forced.

Hidden singles work in rows and columns too. The question is always the same: in this unit, does the digit have exactly one place left?

## A scanning routine

Random staring wastes time. Here is a routine that finds singles in order:

1. **Pick a digit, most frequent first.** A digit that already appears many times has blocked a lot of cells, so its map is nearly closed. In this puzzle 7 appears seven times and 8 appears once, so 7 is the best place to start.
2. **Check each box for that digit.** Trace the placed digit's row and column through the grid mentally, then count the open cells per box. One open cell is a hidden single.
3. **Repeat for rows and columns** of that digit, then move to the next digit.
4. **Look for naked singles** at the end of the pass, especially in rows or columns that are nearly full.
5. **After every placement, scan again.** Each new digit blocks 20 cells, so new singles appear.

Experienced solvers call the digit-by-digit pass **cross-hatching**, because the blocked rows and columns make a hatch pattern across the grid.

When a unit has eight cells filled, the ninth is a naked single: the one missing digit. Late in a puzzle this happens constantly.

## Your turn: find the forced digit

Try the first with the cell-side view, the second with the digit-side view. The map below shows where a 7 can still go.

```exercise
[
  {
    "type": "predict",
    "task": "In the puzzle above, what digit must go in R1C6? (Check row 1, column 6, and box 2 for what is already used.)",
    "accept": ["8"],
    "hint": "Row 1 holds 7, 3, 2. Column 6 holds 7, 6, 9, 5, 4, 1. Box 2 holds 7, 1, 6. Which digit from 1 to 9 is missing from all of that?"
  }
]
```

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | . . 7 | . . . | . . . |
2 | . . . | . . 7 | . . . |
3 | . . . | . . . | . 7 . |
  +-------+-------+-------+
4 | . . . | . . . | . . 7 |
5 | o . . | o . . | . . . |
6 | . . . | o . . | . . . |
  +-------+-------+-------+
7 | . 7 . | . . . | . . . |
8 | . . . | . 7 . | . . . |
9 | . . . | . . . | 7 . . |
  +-------+-------+-------+
```

```exercise
[
  {
    "type": "predict",
    "task": "In the map of 7s above, box 4 (rows 4 to 6, columns 1 to 3) has exactly one open cell for 7. Which cell is it? Answer in RxCy form, like R2C5.",
    "accept": ["R5C1"],
    "hint": "Find the single o inside the left-middle block of the map."
  }
]
```

That is a hidden single, and it is placed with no pencil marks at all. When you have a spare minute, [play Sudoku](/games/sudoku) and pay attention to which of the two views you reach for first. Many beginners default to the naked-single view, so the hidden-single view is worth practicing on purpose.

## What singles cannot do

Eventually you reach a position where no cell has one digit left and no digit has one place left in any unit. This is the wall. Nothing is wrong with the puzzle: a valid puzzle always has a reason for the next digit, but the reason is no longer a single. To find it you need to write down what is still possible in each cell, which is the subject of the next phase.

Check yourself before moving on:

```quiz
[
  {
    "q": "Which of these describes a naked single?",
    "choices": [
      "A digit that can go in only one cell of a row, column, or box",
      "A cell that has only one digit it can hold after its peers are considered",
      "A cell with no neighbors"
    ],
    "answer": 1,
    "explain": "The first choice describes a hidden single. A naked single is about the cell's own short list of digits."
  },
  {
    "q": "In a box, the digit 4 is blocked in eight cells by 4s elsewhere or by filled cells. The ninth cell is empty and could hold 2, 4, or 9. What do you do?",
    "choices": [
      "Nothing: the cell has three candidates, so you must guess",
      "Place a 4: the box needs a 4 and this is the only cell left for it",
      "Place a 9: it is the largest candidate"
    ],
    "answer": 1,
    "explain": "This is a hidden single. Box membership forces a 4 somewhere in the box, and only this cell remains. Sizes of digits never matter."
  }
]
```

## Recap

1. A deduction either places a digit or removes a possibility; a single places one.
2. Naked single: a cell with only one digit left after removing its peers' digits.
3. Hidden single: a digit with only one cell left in a row, column, or box, even if that cell has other candidates.
4. Scan digit by digit, most frequent first, and rescan after every placement.
5. When no single exists, you need to track possibilities explicitly.

Next up, [Pencil Marks, Pairs, and Locked Candidates](03-pencil-marks-pairs-and-locked-candidates.md): writing the possibilities down and removing them with patterns.
