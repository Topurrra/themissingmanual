---
title: "Bottom-Up Tabulation"
guide: "dynamic-programming-intro"
phase: 2
summary: "The same dynamic programming idea, flipped: instead of recursing down and caching, build the answer from the smallest cases upward with a loop and a table. Climbing stairs shows the pattern, then the rolling two-variable version trims the memory."
tags: [algorithms, dynamic-programming, tabulation, bottom-up, climbing-stairs, space-optimization]
difficulty: intermediate
synonyms: ["what is tabulation", "bottom up dynamic programming", "climbing stairs dynamic programming", "tabulation vs memoization", "iterative dynamic programming python"]
updated: 2026-08-06
---

# Bottom-Up Tabulation

Memoization works top-down: you ask for the big answer and let recursion fill the cache as it goes.
**Tabulation** turns that around. You start from the smallest subproblems, solve them first, and build upward
until you reach the one you actually wanted. Same subproblems, same answers - opposite direction.

## A new problem: climbing stairs

You are climbing a staircase with `n` steps. Each move takes you up either 1 step or 2 steps. How many
distinct ways are there to reach the top?

Think about your *last* move. To land on step `n`, you either came from step `n-1` (a 1-step move) or from
step `n-2` (a 2-step move). Those two groups never overlap, so the total is their sum:

```
ways(n) = ways(n-1) + ways(n-2)
ways(0) = 1   (one way to "stand at the bottom": do nothing)
ways(1) = 1   (a single 1-step move)
```

That is the same recurrence as Fibonacci. The lesson underneath: a huge share of DP is spotting that "the
answer for `n` is built from the answers for smaller inputs," then writing that relationship down.

## Filling the table

Instead of recursing, make an array `dp` where `dp[i]` holds the number of ways to reach step `i`. Seed the
smallest cases, then let a loop fill each cell from the two below it.

```python runnable
def climb_stairs(n):
    if n <= 1:
        return 1
    dp = [0] * (n + 1)
    dp[0], dp[1] = 1, 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]

for n in range(1, 8):
    print(n, "steps ->", climb_stairs(n), "ways")
```
```console
1 steps -> 1 ways
2 steps -> 2 ways
3 steps -> 3 ways
4 steps -> 5 ways
5 steps -> 8 ways
6 steps -> 13 ways
7 steps -> 21 ways
```
*What just happened:* the loop never recurses and never re-computes. By the time it reaches `dp[i]`, the two
cells it needs (`dp[i-1]` and `dp[i-2]`) are already filled, so each cell is a single addition. That is the
essence of tabulation: order the subproblems so that every answer is ready before you need it. The running
time is `O(n)` with `O(n)` space for the table.

💡 **Key point.** Memoization and tabulation compute exactly the same subproblems. Memoization discovers the
order lazily through recursion; tabulation commits to the order up front with a loop. Pick whichever reads
more clearly for the problem - tabulation avoids recursion-depth limits, memoization can skip subproblems it
never needs.

## Trimming the memory: the rolling version

Look at the loop again: to fill `dp[i]` you only ever look at the previous two cells. The rest of the table
is dead weight. So keep just two variables and slide them forward.

```python runnable
def climb_stairs(n):
    if n <= 1:
        return 1
    prev, curr = 1, 1          # ways to reach step 0 and step 1
    for _ in range(2, n + 1):
        prev, curr = curr, prev + curr
    return curr

print(climb_stairs(7))
print(climb_stairs(40))
```
```console
21
165580141
```
*What just happened:* `prev` and `curr` always hold the last two results, and each step rolls them forward by
one. Same `O(n)` time, but now `O(1)` space - constant memory no matter how big `n` gets. This "keep only
what the next step needs" trick is one of the most common DP optimizations.

⚠️ **Gotcha.** The two-variable update relies on doing both assignments at once. In Python,
`prev, curr = curr, prev + curr` evaluates the whole right side first, so `prev + curr` still uses the old
`prev`. Writing it as two separate lines (`prev = curr` then `curr = prev + curr`) overwrites `prev` too
early and silently computes the wrong sequence.

## Check yourself

```quiz
[
  {
    "q": "What is the core difference between tabulation and memoization?",
    "choices": ["Tabulation builds answers bottom-up in a table with a loop; memoization is top-down recursion that caches results", "They are two different names for the same code", "Tabulation always uses recursion; memoization always uses loops", "Tabulation only works for Fibonacci-shaped problems"],
    "answer": 0,
    "explain": "Both solve the same subproblems. Tabulation orders them smallest-first and fills a table iteratively; memoization recurses top-down and caches each result on first computation."
  },
  {
    "q": "For climbing stairs with 1- or 2-step moves, why is ways(n) = ways(n-1) + ways(n-2)?",
    "choices": ["Because the answers happen to be Fibonacci numbers", "Because your last move came from either step n-1 or step n-2, and those two sets of paths never overlap", "Because you can only ever take 2-step moves", "It is a coincidence that only holds for small n"],
    "answer": 1,
    "explain": "Every path to step n ends with a final move from n-1 or from n-2. Counting each group and adding them (they are disjoint) gives the recurrence."
  },
  {
    "q": "What does the rolling two-variable version save compared to the full table?",
    "choices": ["Time - it changes the big-O", "Nothing, it is only a style preference", "Memory - it keeps O(1) space instead of an O(n) table", "Accuracy on large inputs"],
    "answer": 2,
    "explain": "Each step needs only the previous two results, so two variables suffice. Time stays O(n); space drops from O(n) to O(1)."
  }
]
```
