---
title: "Pencil Marks, Pairs, and Locked Candidates"
guide: "sudoku-from-zero"
phase: 3
summary: "How to write down every digit a cell could still hold (pencil marks), then remove candidates with naked pairs and triples, hidden pairs, pointing, and box-line reduction (claiming) - each explained with a real position."
tags: [sudoku, pencil-marks, candidates, naked-pair, hidden-pair, naked-triple, pointing, box-line-reduction, locked-candidates]
difficulty: intermediate
synonyms: ["what are pencil marks in sudoku", "how to use candidates in sudoku", "what is a naked pair in sudoku", "what is a hidden pair in sudoku", "what is pointing pairs in sudoku", "what is box line reduction", "sudoku locked candidates explained", "naked triple sudoku", "what to do when sudoku has no obvious moves"]
updated: 2026-10-06
---

# Pencil Marks, Pairs, and Locked Candidates

You scanned for singles and found none. The puzzle is not stuck; you are, because singles only look at what is certain. The next level uses what is *possible*. You write the remaining digits a cell could hold in small print, and then use patterns to cross digits out. When enough digits disappear, a single appears. This phase has five patterns (naked pairs and triples, hidden pairs, pointing, and box-line reduction), and every one is a short argument you can check yourself.

## Candidates and pencil marks

A **candidate** is a digit that could still go in an empty cell without breaking the rule today. The small digits people write in a cell's corner are **pencil marks**, and a puzzle's full set of pencil marks is its candidate grid. Computing a cell's candidates is the naked-single subtraction from phase 2 without stopping at one: nine digits, minus the digits of its 20 peers.

Two ideas run through the rest of this guide:

- **Candidates only ever shrink.** A digit gets removed when a deduction proves the cell cannot hold it, and once removed it stays removed. When a cell reaches one candidate, it is a naked single. When a digit has one cell left in a unit, it is a hidden single.
- **Every technique is a rule for deleting candidates.** A technique says: "if the board looks like this, then these specific candidates are impossible." Each one comes with a proof, and the proof is the reason it is safe.

Two habits keep the marks useful. Update them: when you place a digit, erase it from the marks of all 20 peers. And never delete a mark without a reason. A mark erased by a hunch is the quickest way to wreck a solve, because the wrong deletion can force a wrong digit twenty moves later. On the site, [play Sudoku](/games/sudoku) has a notes mode, so you can practice the marking style there.

Below we read candidates off one row or one box at a time. You never need to write the whole grid to use these patterns; you only need the unit in question.

## Naked pair

Here is a puzzle with a row that has only four empty cells.

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | 8 . 1 | . 9 4 | 6 . . |
2 | . . . | . . . | . . 2 |
3 | . . . | . . . | 5 . . |
  +-------+-------+-------+
4 | . 9 . | . 5 . | . . 8 |
5 | 1 . 7 | . . . | . . . |
6 | . . 2 | 1 6 . | 7 . 9 |
  +-------+-------+-------+
7 | . . . | 7 1 . | 8 . . |
8 | . . 8 | . . . | 4 . . |
9 | 2 . . | 5 . . | . 6 . |
  +-------+-------+-------+
```

Row 1 holds 8, 1, 9, 4, 6, so the missing digits are 2, 3, 5, 7. The candidates of the four empty cells, worked out from the whole grid:

```text
R1C2: 2 3 5 7
R1C4: 2 3
R1C8: 3 7
R1C9: 3 7
```

Look at R1C8 and R1C9. Each can only be 3 or 7. Two cells, two digits. One of them is 3 and the other is 7, though we do not know which way around. Either way, those two cells use up both the 3 and the 7 for row 1. So no other cell in row 1 can be 3 or 7. That is a **naked pair**, and it deletes candidates:

```text
R1C2: 2 3 5 7   becomes   2 5
R1C4: 2 3       becomes   2
```

R1C4 now has one candidate. It is a naked single: **R1C4 is 2**. Then R1C2 loses its 2 as well, so R1C2 must be 5. One pattern made the whole row fall.

*What just happened:* nothing was guessed. The pair is a pigeonhole argument: two cells that can only hold the same two digits must hold exactly those two digits.

## Naked triple

The same argument works for three cells and three digits, with one twist: the three cells do not each need to contain all three digits. Only their combined candidates matter.

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | . . . | 6 3 5 | 9 . . |
2 | . 5 9 | . . . | . 6 7 |
3 | . . . | . . . | 3 4 . |
  +-------+-------+-------+
4 | . 4 . | 2 . . | . . . |
5 | 5 . . | . . . | . . . |
6 | . . 6 | . . 8 | 2 7 . |
  +-------+-------+-------+
7 | 8 . . | 7 . . | . . 4 |
8 | . . 3 | 1 2 . | . . . |
9 | . 6 . | . 8 . | . . . |
  +-------+-------+-------+
```

Row 2 has five empty cells. Their candidates:

```text
R2C1: 1 2 3 4
R2C4: 4 8
R2C5: 1 4
R2C6: 1 2 4
R2C7: 1 8
```

Take R2C4, R2C5, and R2C7. Together their candidates are 1, 4, 8. Three cells, three digits in total, so those three cells hold 1, 4, and 8 in some order. Then 1, 4, and 8 cannot appear anywhere else in row 2. R2C1 loses 1 and 4, and R2C6 loses 1 and 4:

```text
R2C1: 1 2 3 4   becomes   2 3
R2C6: 1 2 4     becomes   2
```

R2C6 is a naked single: it is 2. The rule behind every naked subset is the same: **n cells whose candidates together use only n digits own those digits.** (A naked quad is the same with four. Pairs and triples are the ones you will use.)

## Hidden pair

A naked subset looks at cells with short lists. A **hidden subset** looks at digits with short lists. Here is a row of a different puzzle:

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | . 7 . | . . 3 | 1 . . |
2 | 3 4 . | 8 . . | . 5 9 |
3 | . 9 . | . . . | 2 . . |
  +-------+-------+-------+
4 | . . . | . . 5 | . . 7 |
5 | . . 3 | . 4 2 | . . . |
6 | . . . | 3 . . | 6 . . |
  +-------+-------+-------+
7 | 5 . . | . . . | . 6 4 |
8 | . . . | . 5 4 | . . 1 |
9 | 9 6 . | . . . | . . . |
  +-------+-------+-------+
```

Row 5 has six empty cells, with these candidates:

```text
R5C1: 1 6 7 8
R5C2: 1 5 8
R5C4: 1 6 7 9
R5C7: 5 8 9
R5C8: 1 8 9
R5C9: 5 8
```

Where can 6 go in this row? Only R5C1 and R5C4. Where can 7 go? Also only R5C1 and R5C4. Two digits and exactly two cells. Both cells must hold those digits, one each, so every other candidate in those two cells is impossible:

```text
R5C1: 1 6 7 8   becomes   6 7
R5C4: 1 6 7 9   becomes   6 7
```

That is a **hidden pair**: the pair of digits is hidden among extra candidates, and the deduction is deleting the extras. The cells are left as a naked pair, which is handy for what comes next.

There is a symmetry here worth seeing. In a unit with six empty cells, a hidden pair is the same fact as a naked quad in the other four cells: in row 5, R5C2, R5C7, R5C8, and R5C9 together use only 1, 5, 8, 9. Four cells, four digits. Same deletions, seen from the other side. Pick whichever view is quicker to spot.

> ⚠️ **Gotcha**: each of the two digits must have at least two possible cells in the unit, and both digits must be confined to the same two cells. If one digit has only a single possible cell, you have a hidden single instead, which settles that cell outright.

## Pointing

Now we use boxes and lines together. Look at the center box of this position and only the digit 8. The map shows `o` where an 8 could still go:

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | o o o | o o . | . . . |
2 | . . . | . . . | . . 8 |
3 | . o o | o o . | . . . |
  +-------+-------+-------+
4 | o . o | . o . | . . . |
5 | . . . | . . . | . 8 . |
6 | o o o | . o . | . . . |
  +-------+-------+-------+
7 | o . o | . . . | o . . |
8 | o o . | . . . | . . . |
9 | . . . | . . 8 | . . . |
  +-------+-------+-------+
```

Inside box 5 (rows 4 to 6, columns 4 to 6) there are two open cells for an 8: R4C5 and R6C5. Both are in column 5. The box must contain exactly one 8, so the box's 8 will be in column 5, in one of those two cells. That means column 5 gets its 8 inside box 5, and no other cell of column 5 can be 8. The `o` marks at R1C5 and R3C5 are impossible and can be removed.

This is **pointing** (also called a pointing pair, or a pointing triple when three cells line up): all candidates for a digit in a box lie in one row or column, so that digit is removed from the rest of that line outside the box. Think of the candidates in the box as pointing outward along their line. Another name is locked candidates, type 1.

## Box-line reduction (claiming)

Pointing runs from box to line. **Box-line reduction** runs the other way, from line to box. Here is the digit 5 in a puzzle where column 4 has only a few places left for it:

```text
    1 2 3   4 5 6   7 8 9
  +-------+-------+-------+
1 | . . 5 | . . . | . . . |
2 | . . . | . . o | . . . |
3 | . . . | . . . | 5 . . |
  +-------+-------+-------+
4 | o . . | . . . | . o o |
5 | . . . | . 5 . | . . . |
6 | . o . | . . . | . o o |
  +-------+-------+-------+
7 | o . . | o . o | . . . |
8 | o o . | o . o | . o o |
9 | . o . | o . o | . o o |
  +-------+-------+-------+
```

In column 4, an open cell for 5 appears only at R7C4, R8C4, and R9C4. All three are in box 8 (rows 7 to 9, columns 4 to 6). Column 4 must have a 5, so the 5 for column 4 is in box 8, and therefore box 8's own 5 is in column 4 as well. No other cell of box 8 can be 5: R7C6, R8C6, and R9C6 lose their 5.

This is **box-line reduction**, also called **claiming** (the line claims the digit for the box), or locked candidates type 2. The two are mirror images:

| Name | The digit's candidates in one unit lie within... | So remove the digit from... |
|---|---|---|
| Pointing | one line, inside a box | the rest of that line, outside the box |
| Box-line reduction | one box, inside a line | the rest of that box, outside the line |

Both patterns exist because a row (or column) and a box overlap in three cells, and a digit placed in the overlap serves both units at once.

## Your turn: finish the row

Back in the first puzzle, you already found one forced digit from the naked pair. Use the results.

```exercise
[
  {
    "type": "predict",
    "task": "In the naked-pair row (row 1 of the first puzzle in this phase), after the pair removes 3 and 7 from the other cells, which digit goes in R1C4?",
    "accept": ["2"],
    "hint": "R1C4 started with candidates 2 and 3. What is left after 3 is removed?"
  },
  {
    "type": "predict",
    "task": "Once R1C4 is 2, which digit goes in R1C2? (Its candidates after the pair were 2 and 5.)",
    "accept": ["5"],
    "hint": "R1C4 and R1C2 are in the same row, so they cannot both be 2."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "Two cells in a row both have only the candidates 2 and 5. A third cell in that row has candidates 2, 5, and 8. What can you conclude?",
    "choices": ["The third cell is 8, because 2 and 5 are used up by the pair", "The third cell could be 2, 5, or 8; nothing can be removed", "The third cell is 2"],
    "answer": 0,
    "explain": "This is a naked pair: the two cells use up 2 and 5 in the row, so the third cell loses both and is left with 8."
  },
  {
    "q": "In a box, every remaining candidate for the digit 6 lies in the same column. What can you remove?",
    "choices": ["6 from every other cell of that box", "6 from the cells of that column that are outside the box", "6 from the whole grid"],
    "answer": 1,
    "explain": "This is pointing. The box's 6 must be in that column, so that column's 6 is inside the box and cannot appear outside it."
  },
  {
    "q": "Two cells in a unit are the only places for 3 and for 6 in that unit, and they also have other candidates. What do you do?",
    "choices": ["Remove 3 and 6 from the two cells", "Remove every candidate except 3 and 6 from the two cells", "Nothing, because the cells have extra candidates"],
    "answer": 1,
    "explain": "This is a hidden pair. Two digits and exactly two cells for them means the cells hold those digits, so all their other candidates go."
  }
]
```

## Recap

1. Candidates are the digits a cell could still hold; pencil marks write them down, and they only shrink.
2. Naked pair or triple: n cells whose candidates together use only n digits own those digits, so remove them from the rest of the unit.
3. Hidden pair: two digits confined to the same two cells in a unit force those cells to hold them, so remove every other candidate there.
4. Pointing: a box's candidates for a digit all lie on one line, so remove the digit from that line outside the box.
5. Box-line reduction: a line's candidates for a digit all lie in one box, so remove the digit from the rest of that box.

Next up, [Fish and Wings: Advanced Patterns](04-fish-and-wings-advanced-patterns.md): patterns that span several units at once.
