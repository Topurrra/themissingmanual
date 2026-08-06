---
title: "Coin Change and Spotting DP"
guide: "dynamic-programming-intro"
phase: 3
summary: "The min-coins coin-change problem, where a greedy loop gives the wrong answer and dynamic programming gives the right one. Then the two signals - optimal substructure and overlapping subproblems - that tell you a problem is DP in the first place."
tags: [algorithms, dynamic-programming, coin-change, greedy, optimal-substructure, problem-recognition]
difficulty: intermediate
synonyms: ["coin change dynamic programming", "minimum coins problem", "why greedy fails coin change", "optimal substructure", "how to recognize a dynamic programming problem"]
updated: 2026-08-06
---

# Coin Change and Spotting DP

Fibonacci and climbing stairs are gentle: there is one number to compute and the recurrence is handed to you.
Real DP problems are about finding the *best* option among many, and this is where the technique earns its
reputation. Coin change is the classic first real one.

## The problem, and why greedy is not enough

Given coin denominations and a target amount, what is the **fewest** coins that add up to the amount? With
US-style coins `[1, 5, 10, 25]`, a natural instinct is to be greedy: keep taking the biggest coin that
fits. For everyday coins that happens to work - but it is not a general rule, and it is easy to break.

Take coins `[1, 3, 4]` and amount `6`. Greedy grabs the `4`, leaving `2`, then two `1`s: that is `4 + 1 + 1`,
three coins. But `3 + 3` is two coins. Greedy walked confidently to the wrong answer because a locally biggest
choice can force worse choices later.

DP fixes this by considering every first coin and trusting the smaller answers.

```python runnable
def coin_change(coins, amount):
    INF = amount + 1                     # a stand-in for "impossible", larger than any real answer
    dp = [0] + [INF] * amount            # dp[a] = fewest coins to make amount a
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != INF else -1

print(coin_change([1, 3, 4], 6))         # greedy would say 3; the truth is 2
print(coin_change([1, 5, 10, 25], 63))
print(coin_change([2], 3))               # odd amount, only even coins -> impossible
```
```console
2
6
-1
```
*What just happened:* `dp[a]` holds the fewest coins to make amount `a`. To fill it, we try every coin `c`
that fits and ask: "what if this coin is the last one I add?" That leaves `a - c` to make, whose best answer
is already sitting in `dp[a - c]`, so the candidate is `dp[a - c] + 1`. Take the smallest candidate over all
coins. Amounts that can never be formed keep the `INF` sentinel and report `-1`. This runs in
`O(amount * number_of_coins)`.

💡 **Key point.** The greedy version commits to one coin and never looks back. DP tries *every* possible last
coin and lets the already-solved subproblems decide which one leads to the best total. That willingness to
consider all first moves, backed by cached answers, is what makes it correct where greedy is not.

## How to recognize a DP problem

You will not always be told "this is dynamic programming." Two properties, present together, are the tell:

- **Optimal substructure.** The best answer to the whole problem can be built from the best answers to its
  subproblems. In coin change, the best way to make `6` is "one more coin than the best way to make `6 - c`"
  for the right choice of `c`. If the pieces of an optimal solution are themselves optimal, you have it.
- **Overlapping subproblems.** The same subproblems come up repeatedly, so caching pays off. If every
  subproblem were unique, you would just have plain recursion (like merge sort) and DP would add nothing.

📝 **Terminology.** A problem with optimal substructure but *no* overlap is usually a divide-and-conquer
problem, not DP. A problem with overlap but no optimal substructure (where a locally best choice can be
undone later in a way caching cannot capture) may not be solvable by DP at all. You need both.

⚠️ **Gotcha.** Greedy and DP can agree on some inputs and disagree on others, as the two coin sets above
showed. "It worked on my examples" is not proof a greedy shortcut is correct. When the problem asks for an
optimum and choices interact, reach for DP unless you can prove greedy is safe for your specific coin system.

## The recipe

Once you suspect DP, the steps are always the same:

1. Define the subproblem precisely - what does `dp[i]` (or `dp[i][j]`) *mean*?
2. Write the recurrence - how is `dp[i]` built from smaller entries?
3. Set the base cases - the smallest inputs whose answers you know outright.
4. Choose a direction - top-down memoization or bottom-up tabulation.
5. Read the answer out of the table.

Nail step 1 and the rest tends to follow. A vague subproblem definition is the single most common reason a DP
attempt stalls.

## Check yourself

```quiz
[
  {
    "q": "Why does greedy 'always take the biggest coin' fail for coins [1, 3, 4] and amount 6?",
    "choices": ["Greedy is never correct for any problem", "Greedy takes 4 + 1 + 1 (three coins), but 3 + 3 (two coins) is better", "6 cannot be made from those coins at all", "Greedy and DP give the same answer here"],
    "answer": 1,
    "explain": "Grabbing the biggest coin (4) forces two 1s afterward for three coins total, while 3 + 3 needs only two - a locally biggest choice led to a worse overall result."
  },
  {
    "q": "In the coin-change table, what does dp[a] represent?",
    "choices": ["The number of coins whose value equals a", "The fewest coins needed to make amount a", "Whether amount a is even", "The largest coin not exceeding a"],
    "answer": 1,
    "explain": "dp[a] is the minimum number of coins that sum to a; the algorithm fills it by trying each coin as the last one added."
  },
  {
    "q": "Which two properties together signal that a problem is a good fit for dynamic programming?",
    "choices": ["Recursion and loops", "Sorting and searching", "Optimal substructure and overlapping subproblems", "Large inputs and small outputs"],
    "answer": 2,
    "explain": "Optimal substructure means the best whole answer is built from best sub-answers; overlapping subproblems means those sub-answers repeat, so caching them pays off. DP needs both."
  }
]
```
