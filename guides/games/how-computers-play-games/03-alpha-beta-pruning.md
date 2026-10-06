---
title: "Alpha-Beta Pruning: Skipping Work That Cannot Matter"
guide: "how-computers-play-games"
phase: 3
summary: "Alpha-beta pruning returns exactly the same answer as minimax while skipping branches that cannot change it; here you measure the saving by counting nodes with and without pruning."
tags: [alpha-beta, pruning, minimax, game-tree, move-ordering, optimization]
difficulty: advanced
synonyms: ["what is alpha beta pruning", "alpha beta pruning explained", "alpha beta pruning python", "how to speed up minimax", "minimax vs alpha beta", "move ordering in chess engines", "what do alpha and beta mean in minimax"]
updated: 2026-10-06
---

# Alpha-Beta Pruning: Skipping Work That Cannot Matter

Minimax is correct and wasteful. It examines moves that a sensible opponent would never allow, and it examines them in full. Alpha-beta pruning is the observation that you can stop looking at a branch the moment you know it cannot affect the final decision. The answer is identical to minimax. Only the work shrinks.

## The idea in one example

You are X and you are choosing between two moves, A and B. You have already searched A fully and found it guarantees you a draw (score 0). Now you start searching B. B's first reply from O is a move that wins for O (score -1). You can stop right there. O will pick that reply, so B is worth at most -1, which is already worse than A's 0. It does not matter whether B's other replies are terrible or wonderful for you, because O would choose the refutation.

That is a **cutoff**. You skipped the rest of B's subtree without any risk of missing something.

To do this in general, each call carries two numbers, as a running record of what is already guaranteed:

- **alpha**: the best score the maximizer can already guarantee elsewhere in the tree.
- **beta**: the best (lowest) score the minimizer can already guarantee elsewhere.

If at some position alpha reaches or passes beta, the player above would never let the game reach this position, so the remaining moves here are skipped.

## The program, with a node counter

This runs both searches from the empty board and counts every position each one visits.

```python runnable
LINES = [(0,1,2),(3,4,5),(6,7,8),(0,3,6),(1,4,7),(2,5,8),(0,4,8),(2,4,6)]

def winner(b):
    for i, j, k in LINES:
        if b[i] != " " and b[i] == b[j] == b[k]:
            return b[i]
    return None

def moves(b):
    return [i for i in range(9) if b[i] == " "]

def play(b, i, p):
    return b[:i] + p + b[i+1:]

nodes = 0

def minimax(b, player):
    global nodes
    nodes += 1
    w = winner(b)
    if w:
        return 1 if w == "X" else -1
    if not moves(b):
        return 0
    other = "O" if player == "X" else "X"
    scores = [minimax(play(b, m, player), other) for m in moves(b)]
    return max(scores) if player == "X" else min(scores)

def alphabeta(b, player, alpha, beta):
    global nodes
    nodes += 1
    w = winner(b)
    if w:
        return 1 if w == "X" else -1
    if not moves(b):
        return 0
    other = "O" if player == "X" else "X"
    if player == "X":
        best = -2
        for m in moves(b):
            best = max(best, alphabeta(play(b, m, player), other, alpha, beta))
            alpha = max(alpha, best)
            if alpha >= beta:
                break  # O would never allow this line
        return best
    best = 2
    for m in moves(b):
        best = min(best, alphabeta(play(b, m, player), other, alpha, beta))
        beta = min(beta, best)
        if alpha >= beta:
            break  # X would never allow this line
    return best

empty = " " * 9
nodes = 0
v1 = minimax(empty, "X")
plain = nodes
nodes = 0
v2 = alphabeta(empty, "X", -2, 2)
pruned = nodes
print("minimax    value", v1, "nodes", plain)
print("alpha-beta value", v2, "nodes", pruned)
print("alpha-beta searched %.1f%% as many nodes" % (100 * pruned / plain))
```

When run for this guide, the output was:

```console
minimax    value 0 nodes 549946
alpha-beta value 0 nodes 18297
alpha-beta searched 3.3% as many nodes
```

*What just happened:*

- **Same value.** Both searches say the empty board is a draw. Pruning never changes the answer.
- **About thirty times less work.** 549,946 positions became 18,297. The initial window is `(-2, 2)` because real scores only range from -1 to +1, so no cutoff happens until a real bound is found.
- **The saving depends on the tree.** This is one board and one move order. A different order of trying moves gives a different count.

## Move ordering decides how much you save

Cutoffs happen sooner when the best moves are tried first. If A is searched before B and A is excellent, B is cut off almost immediately. If the worst move comes first, you learn little and prune little. In the worst case alpha-beta searches as many nodes as minimax; in the best case it searches roughly the square root of the nodes, which lets it look about twice as deep in the same time. This square-root result is a classical analysis of alpha-beta ([Knuth and Moore, 1975](https://doi.org/10.1016/0004-3702%2875%2990019-3)), and it is why real engines work hard at ordering: they try captures, then moves that were good in earlier, shallower searches, and so on.

> 💡 **Key point.** Alpha-beta does not make the search approximate. It is an exact shortcut. It is a different thing from the guessing in the next phase.

> ⚠️ **Gotcha.** The `break` lines are the whole trick, and the `alpha >= beta` test is a common place to get the direction wrong. A reliable check is to compare your pruned result against plain minimax on many positions. They must always match.

## Where this leaves us

Alpha-beta makes chess search tractable to a much deeper depth, but not to the end of the game. The tree is still far too large, as phase 1 showed. Engines therefore stop at a fixed depth and need a way to judge an unfinished position. That is [phase 4](04-evaluation-and-stockfish.md).

For a different search that also avoids exploring everything, see [Dijkstra's Shortest Path](/guides/dijkstra-shortest-path): it settles the closest nodes first, so it never revisits paths that cannot be shorter. The problems differ, but the habit is the same, which is to use what you already know to avoid pointless work.

Check yourself before moving on:

```quiz
[
  {"q": "Compared with plain minimax, what does alpha-beta pruning change about the result?", "choices": ["It gives an approximate value", "It only works for draws", "Nothing, the value and best move are the same", "It picks a random best move"], "answer": 2, "explain": "Alpha-beta only skips branches that cannot affect the decision, so its answer is exact."},
  {"q": "In the program, alpha-beta visited 18,297 nodes where minimax visited 549,946. What most strongly controls how large that saving is?", "choices": ["The color of the player", "The Python version", "The size of the integer scores", "The order in which moves are tried"], "answer": 3, "explain": "Trying strong moves first produces cutoffs sooner. A bad order prunes little."},
  {"q": "You have found that move A guarantees you 0, and while searching move B you find the opponent has a reply worth -1 to you. What should the search do?", "choices": ["Stop searching B, because it is worse than A", "Keep searching all of B to be sure", "Choose B because the search is deeper", "Restart the search"], "answer": 0, "explain": "The opponent will choose the refutation, so B is worth at most -1 no matter what its other replies are."}
]
```

## Recap

1. Alpha-beta carries two bounds: what the maximizer can already guarantee (alpha) and what the minimizer can (beta).
2. When alpha is greater than or equal to beta, the remaining moves at that position are skipped.
3. The result is exactly minimax's result. On the empty tic-tac-toe board it searched 18,297 nodes instead of 549,946.
4. Good move ordering is what makes pruning powerful; in the best case the search can go about twice as deep for the same work.
5. Even with pruning, chess cannot be searched to the end, so engines need evaluation.

Next up, [Evaluation Functions and Stockfish](04-evaluation-and-stockfish.md): what to do when you must stop searching before the game ends.
