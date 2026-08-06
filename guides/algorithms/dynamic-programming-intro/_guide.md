---
title: "Dynamic Programming: A Gentle Intro"
guide: "dynamic-programming-intro"
phase: 0
summary: "Dynamic programming taught from intuition: overlapping subproblems and memoization on naive Fibonacci, bottom-up tabulation with climbing stairs, then coin change as real DP and how to recognize an optimal-substructure problem when you see one."
tags: [algorithms, dynamic-programming, memoization, tabulation, fibonacci, coin-change, intermediate]
category: algorithms
order: 9
difficulty: intermediate
synonyms: ["what is dynamic programming", "memoization vs tabulation", "dynamic programming for beginners", "how does dynamic programming work", "coin change dynamic programming", "overlapping subproblems explained"]
updated: 2026-08-06
---

# Dynamic Programming: A Gentle Intro

Dynamic programming has a scary name and a simple idea: if solving a problem means solving the same smaller
problems over and over, solve each one once and write the answer down. That is the whole trick. Everything
else is figuring out what the "smaller problems" are.

Most people meet DP as a wall of clever-looking code and bounce off it. We are going to do the opposite:
start from a plain recursive function you already understand, watch it recompute the same thing a million
times, and fix it with one small change. By the end you will recognize the pattern and know when to reach
for it.

Every example runs in Python right in the page - change the numbers and see what happens.

## How to read this

Read in order. Memoization (phase 1) is the "aha," tabulation (phase 2) is the same idea turned inside out,
and coin change (phase 3) is where DP earns its keep on a problem a greedy loop gets wrong.

## The phases

1. **[Overlapping Subproblems and Memoization](01-overlapping-subproblems-and-memoization.md)** 🟢 Basic -
   naive recursive Fibonacci is exponentially slow because it recomputes the same subproblems; one memo makes
   it instant.
2. **[Bottom-Up Tabulation](02-bottom-up-tabulation.md)** 🟡 Intermediate - build the answer from the
   smallest cases upward with a loop and a table, using the climbing-stairs problem.
3. **[Coin Change and Spotting DP](03-coin-change-and-spotting-dp.md)** 🟡 Intermediate - the classic
   min-coins problem where greedy fails, plus the two signals that tell you a problem is dynamic programming.
