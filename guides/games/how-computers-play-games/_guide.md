---
title: "How Computers Play Games"
guide: "how-computers-play-games"
phase: 0
summary: "How a program plays chess, checkers, Go, and Sudoku: game trees, minimax, alpha-beta pruning, evaluation functions and Stockfish, solved games, Monte Carlo search, AlphaGo and AlphaZero, and constraint solving, with runnable Python at every step."
tags: [game-ai, minimax, alpha-beta, game-tree, stockfish, alphago, monte-carlo-tree-search, constraint-satisfaction, algorithms]
category: games
order: 5
difficulty: advanced
synonyms: ["how do computers play chess", "how does a chess engine work", "what is minimax", "what is alpha beta pruning", "how does stockfish work", "how did alphago work", "how do computers solve sudoku", "game tree search explained", "is checkers solved", "what is monte carlo tree search", "how does alphazero learn"]
updated: 2026-10-06
---

# How Computers Play Games

You have played the games on this site. Maybe you even lost to the chess opponent and wondered what is going on inside it. The answer is not magic, and it is not "it calculates everything". It is a small set of ideas that fit together, and several of them fit in a dozen lines of Python.

This guide is the bridge between playing a game and the computer science underneath it. You will build a tic-tac-toe player that never loses, make it roughly thirty times cheaper by skipping work that cannot matter, and then see why that is still not enough for chess, how Stockfish gets around it, how checkers was proven to be a draw, and how AlphaGo and AlphaZero changed the recipe. The last phase shows a completely different way to think: Sudoku as a puzzle of constraints.

## Prerequisite

You should read Python and know what a function and a list are. [Recursion Finally Clicks](/guides/recursion-finally-clicks) matters most, because every search here is a recursive function. [Big-O Without the Math Panic](/guides/big-o-without-the-math-panic) helps with the word "explodes".

If you want to feel the games first, play them: [play chess](/games/chess), [play checkers](/games/checkers), [play Sudoku](/games/sudoku). The matching learning guides are [Chess From Zero](/guides/chess-from-zero), [Checkers From Zero](/guides/checkers-from-zero), and [Sudoku From Zero](/guides/sudoku-from-zero).

## How to read this

- **Want the code?** Phases 2 and 3 are the heart: minimax, then alpha-beta, both runnable.
- **Want the modern story?** Jump to [phase 4](04-evaluation-and-stockfish.md) and [phase 5](05-solving-learning-and-constraints.md).
- **Want it to finally make sense?** Read in order. Each phase uses the previous one.

Every program runs in your browser using only Python's standard library. Numbers quoted from the real world come from papers and official project pages, linked where they appear.

## The phases

1. **[Game Trees: Every Game as a Branching Map](01-game-trees.md)** - states, moves, branching factor, and why chess and Go cannot be searched to the end.
2. **[Minimax: Playing Perfectly on Tic-Tac-Toe](02-minimax.md)** - assume the opponent plays their best, and get a program that never loses.
3. **[Alpha-Beta Pruning: Skipping Work That Cannot Matter](03-alpha-beta-pruning.md)** - the same answer with a small fraction of the search.
4. **[Evaluation Functions and Stockfish](04-evaluation-and-stockfish.md)** - guessing the value of a position, and how a modern engine does it.
5. **[Solved Games, Learned Games, and Constraints](05-solving-learning-and-constraints.md)** - Chinook and checkers, Monte Carlo search, AlphaGo and AlphaZero, and Sudoku as constraint solving.
