---
title: "Sudoku From Zero"
guide: "sudoku-from-zero"
phase: 0
summary: "Learn Sudoku from the rules to expert patterns: singles, pencil marks, pairs, pointing, X-Wing, Swordfish, and XY-Wing, then write a Python solver. Every step is a deduction you can justify, never a guess."
tags: [sudoku, logic, puzzles, constraint-reasoning, backtracking, strategy-games, beginner-friendly]
category: games
order: 1
difficulty: beginner
synonyms: ["how to solve sudoku for beginners", "sudoku strategies explained", "how to learn sudoku from scratch", "what is a naked single in sudoku", "what is an x-wing in sudoku", "how does a computer solve sudoku", "sudoku solving techniques", "how to get better at sudoku", "sudoku without guessing"]
updated: 2026-10-06
---

# Sudoku From Zero

You have probably stared at a Sudoku grid, filled in the obvious digits, and then hit a wall where nothing seems obvious anymore. Many people respond by guessing, erasing, and guessing again. That is not the puzzle's fault. A well-made Sudoku always has a reason for every digit, and the wall is where the reasons get more interesting.

This guide teaches those reasons in order, from the one-glance moves to the patterns that look like magic until you see why they work. Sudoku involves no arithmetic. It is pure logic: facts about what cannot be, combined until only one thing can be. The same style of thinking sits underneath scheduling software, circuit checkers, and every program that solves problems by ruling things out.

## Prerequisite

None. If you can read digits you can start. If you want the bigger picture of what a valid deduction is, [What Logic Actually Is](/guides/what-logic-actually-is) pairs well with this guide, and the last phase uses ideas from [Recursion Finally Clicks](/guides/recursion-finally-clicks) when a computer takes over.

## How to read this

- **New to Sudoku?** Start at phase 1 and play along on the site. Open [play Sudoku](/games/sudoku) in another tab and use it between phases.
- **Stuck at the wall after the obvious moves?** Jump to [phase 3](03-pencil-marks-pairs-and-locked-candidates.md).
- **Here for the computer side?** Read phase 1 for the vocabulary, then [phase 5](05-how-a-computer-solves-sudoku.md).
- **Want it to finally make sense?** Read in order - each phase builds on the last, and every example position is checked for rule violations.

## The phases

1. **[The Rules, and What One Solution Means](01-the-rules-and-what-one-solution-means.md)** - the grid, a notation for cells, and why a real puzzle has exactly one answer.
2. **[Scanning and Singles](02-scanning-and-singles.md)** - the two forced moves that solve most beginner puzzles: naked and hidden singles.
3. **[Pencil Marks, Pairs, and Locked Candidates](03-pencil-marks-pairs-and-locked-candidates.md)** - writing down what is still possible, then removing possibilities with pairs, triples, pointing, and box-line reduction.
4. **[Fish and Wings: Advanced Patterns](04-fish-and-wings-advanced-patterns.md)** - X-Wing, Swordfish, and XY-Wing, explained from first principles.
5. **[How a Computer Solves Sudoku](05-how-a-computer-solves-sudoku.md)** - backtracking, constraint propagation, and a runnable Python solver.

> This guide stops where the named patterns stop. Longer chains, coloring, and almost-locked sets build on the same ideas but deserve their own space. Sudoku is also the gentlest entry in the Strategy Games category: [Checkers From Zero](/guides/checkers-from-zero) and [Chess From Zero](/guides/chess-from-zero) add an opponent, and [How Computers Play Games](/guides/how-computers-play-games) shows how the search idea in phase 5 grows to handle one.
