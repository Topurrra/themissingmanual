---
title: "The Rules, and What One Solution Means"
guide: "sudoku-from-zero"
phase: 1
summary: "The one rule of Sudoku, a notation (RxCy) for naming any cell, and what it means for a puzzle to have exactly one solution - which is why every digit has a reason."
tags: [sudoku, rules, notation, unique-solution, logic, beginner-friendly]
difficulty: beginner
synonyms: ["sudoku rules explained", "how do you play sudoku", "what does unique solution mean in sudoku", "sudoku notation r1c1", "how many clues does a sudoku need", "is sudoku math", "what are peers in sudoku"]
updated: 2026-10-06
---

# The Rules, and What One Solution Means

Sudoku looks like math, which scares off people who say they are "not a numbers person". There is no arithmetic in it. You never add, never multiply, never compare sizes. The digits 1 to 9 are nine different labels, and the puzzle is about which label goes where. This phase gives you the rule, a way to name cells so we can talk precisely, and the one idea that makes everything later work: a proper puzzle has exactly one answer.

## The rule

The grid has 81 cells in 9 rows and 9 columns, cut into nine 3-by-3 boxes. Some cells start filled in. Those digits are called **givens** (or clues) and never change. Your job is to fill every other cell so that:

> **Every row, every column, and every box contains each digit from 1 to 9 exactly once.**

That is the whole game. Because a unit has nine cells and there are nine digits, "no digit repeats" and "every digit appears" are the same statement, so you only ever need to check for repeats.

A **unit** is any row, column, or box. There are 27 of them, and every cell belongs to exactly three: its row, its column, and its box.

The digits are only labels. Replace 1 to 9 with the letters A to I and you have the same puzzle, with the same solution. Sums, differences, and sizes of the numbers never matter.

## Naming cells: RxCy

To say "the third cell in the second row" without a paragraph, we use **RxCy**: **R** is the row counted from the top, **C** is the column counted from the left, both from 1 to 9. So R4C7 is row 4, column 7. We number the boxes 1 to 9 in reading order, so box 5 is the center box. Here is a puzzle with the labels around the edge. We will come back to it in the next phase.

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

Read a few cells: R1C3 holds 7, R2C1 holds 8, R3C3 is empty, and R3C3 sits in box 1. Every position in this guide uses this same layout, with `.` for an empty cell.

## What a cell can "see"

A cell **sees** every other cell it shares a unit with, and those cells are its **peers**. A cell has exactly 20 peers: 8 in its row, 8 in its column, and 4 more in its box (the box has 8 other cells, but 2 of them are already counted in the row and 2 in the column).

One consequence drives all of Sudoku: **a cell can never hold a digit that one of its peers already holds.** That is how information travels. A digit placed in R1C3 reaches 20 cells and removes itself as a possibility from each. Every technique in this guide is a cleverer way of using that fact.

## What "exactly one solution" means

A proper Sudoku has exactly one completed grid that contains the givens and obeys the rule. Here is what happens when a puzzle lacks that property. This grid is a finished Sudoku with four cells erased:

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | 6 1 7 | 9 5 8 | 3 2 4 |
2 | 8 5 2 | 3 4 7 | 1 9 6 |
3 | 9 4 3 | 1 2 6 | 8 7 5 |
  +-------+-------+-------+
4 | . 6 5 | 8 1 9 | 2 4 . |
5 | . 9 8 | 4 6 2 | 5 1 . |
6 | 1 2 4 | 7 3 5 | 6 8 9 |
  +-------+-------+-------+
7 | 2 7 1 | 6 9 3 | 4 5 8 |
8 | 5 8 6 | 2 7 4 | 9 3 1 |
9 | 4 3 9 | 5 8 1 | 7 6 2 |
  +-------+-------+-------+
```

R4C1, R4C9, R5C1, and R5C9 are empty, and the missing digits are 3 and 7. You can fill them as 3, 7 over 7, 3, or as 7, 3 over 3, 7 - both are legal. Row 4 and row 5 each still get one 3 and one 7, columns 1 and 9 each still get one of each, and so do boxes 4 and 6. Nothing in the rules can break the tie, so this is not a real puzzle. It has two solutions, and you could only pick one by coin flip.

Real puzzles never leave a rectangle like this open. Uniqueness is what makes them fair, and it gives you a promise worth building on: because only one grid fits, every wrong digit in every cell breaks a rule somewhere. **For each empty cell, there is a reason the right digit is right.** The rest of this guide is a ladder of techniques for finding those reasons.

Two limits on that promise, stated plainly. First, "a reason exists" does not mean it is a one-glance reason; hard puzzles need the deep techniques of phase 4 or beyond. Second, fewer givens does not automatically mean harder. The smallest number of givens a valid puzzle can have is 17, which was proven by exhaustive computer search in 2012 ([McGuire, Tugemann, and Civario](https://arxiv.org/abs/1201.0749)), but difficulty comes from which deductions you need, not from how many digits are printed.

## Sudoku is logic, not guessing

The rule and the givens are your **premises**. A solving step is a conclusion that must be true if the premises are. Here is the smallest example. In the grid above, R1C3 holds 7. Could R1C1 hold a 7? No: R1C1 and R1C3 are in the same row, and that would put two 7s there. So R1C1 is not 7. You did not guess; you showed that 7 leads to a contradiction. That move is a proof by contradiction, and the same style of argument sits under many Sudoku techniques. If you want to see how it works in general, [What a Proof Is](/guides/what-a-proof-is) walks through it, and [What Logic Actually Is](/guides/what-logic-actually-is) gives the vocabulary.

Computer scientists call a puzzle like this a **constraint satisfaction problem**: 81 variables (the cells), each with possible values (1 to 9), and 27 constraints saying "these nine must all differ". You will see in phase 5 that this framing is exactly what lets a short program solve any Sudoku.

The working rule for a human solver is simple to state and hard to follow when you are frustrated: **never guess; justify every digit**. If you cannot say in one sentence why a digit goes in a cell, you have a hunch, not a deduction. Hunches are fine for choosing where to look next. They are fatal as a reason to write a digit down.

## Your turn: play a few cells

Open [play Sudoku](/games/sudoku) in another tab and pick the first difficulty level. Fill in a few digits, and for each one say out loud why it is forced, using the words "row", "column", and "box". If you get stuck, use the hint button: it points at the next logical deduction, and the explanation is worth reading even if you already see the move.

Check yourself before moving on:

```quiz
[
  {
    "q": "How many peers does each cell have (other cells it shares a row, column, or box with)?",
    "choices": ["8", "20", "24"],
    "answer": 1,
    "explain": "8 in the row, 8 in the column, and 4 more in the box that are not already in the row or column: 8 + 8 + 4 = 20."
  },
  {
    "q": "What does it mean for a Sudoku to have exactly one solution?",
    "choices": [
      "Every cell can be filled by looking at one row only",
      "Exactly one completed grid obeys the rules and contains the givens, so every digit has a reason it must be there",
      "The puzzle can only be solved in one order"
    ],
    "answer": 1,
    "explain": "Uniqueness means a wrong digit always breaks a rule somewhere. It does not mean the reason is obvious, and the order you fill cells in is up to you."
  },
  {
    "q": "In the RxCy notation, what is R4C7?",
    "choices": ["Row 4, column 7", "Row 7, column 4", "Box 4, cell 7"],
    "answer": 0,
    "explain": "R is the row counted from the top and C is the column counted from the left. Boxes are numbered separately."
  }
]
```

## Recap

1. Every row, column, and box holds each digit 1 to 9 exactly once; the digits are labels, not quantities.
2. RxCy names a cell by row (from the top) and column (from the left); a cell has 20 peers and can never hold a digit any of them holds.
3. A valid puzzle has exactly one solution, which means every wrong digit breaks a rule and every right digit has a reason.
4. Each solving step is a deduction (often a proof by contradiction), never a guess.

Next up, [Scanning and Singles](02-scanning-and-singles.md): the two forced moves that solve most beginner puzzles.
