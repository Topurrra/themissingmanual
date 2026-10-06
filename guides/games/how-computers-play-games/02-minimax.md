---
title: "Minimax: Playing Perfectly on Tic-Tac-Toe"
guide: "how-computers-play-games"
phase: 2
summary: "Minimax scores every position by assuming both players choose their best move, which gives a tic-tac-toe program that never loses, built from one recursive function."
tags: [minimax, game-tree, recursion, tic-tac-toe, game-ai]
difficulty: intermediate
synonyms: ["what is minimax", "minimax algorithm explained", "minimax tic tac toe python", "how to make an unbeatable tic tac toe ai", "adversarial search", "zero-sum game search"]
updated: 2026-10-06
---

# Minimax: Playing Perfectly on Tic-Tac-Toe

You are about to play a move, and you want to know whether it is good. The only reliable answer is: it is good if the opponent cannot punish it. That sentence is the entire minimax algorithm. The rest is bookkeeping, and it fits in one recursive function.

## The mental model

Give every finished game a number from the first player's point of view: +1 if X wins, 0 for a draw, -1 if O wins. X wants the number high, so call X the **maximizer**. O wants it low, so O is the **minimizer**. This works for **zero-sum** games, where one player's gain is exactly the other's loss.

Now work backwards from the leaves. At a position where O is to move, O will pick the child with the lowest score, so the position's value is the minimum of its children. Where X is to move, the value is the maximum. Repeat up to the root.

```text
        X to move: value = max(0, -1, +1) = +1
       /           |           \
   O to move    O to move     leaf
   min(0,+1)    min(-1,+1)    X wins
     = 0          = -1         = +1
```

The value of the root is the result of the game if both sides play perfectly. The best move is the one leading to the child with that value. This is the classic algorithm from the earliest days of game programming, and it is why recursion matters here: "the value of a position is a function of the values of its children" is recursion exactly as in [Recursion Finally Clicks](/guides/recursion-finally-clicks).

## The program

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

def minimax(b, player):
    """Score from X's view: +1 X wins, 0 draw, -1 O wins."""
    w = winner(b)
    if w:
        return 1 if w == "X" else -1
    if not moves(b):
        return 0
    other = "O" if player == "X" else "X"
    scores = [minimax(play(b, m, player), other) for m in moves(b)]
    return max(scores) if player == "X" else min(scores)

def best_move(b, player):
    other = "O" if player == "X" else "X"
    pick = max if player == "X" else min
    return pick(moves(b), key=lambda m: minimax(play(b, m, player), other))

print("Value of the empty board:", minimax(" " * 9, "X"))

# Perfect X plays perfect O
board, player = " " * 9, "X"
while not winner(board) and moves(board):
    m = best_move(board, player)
    board = play(board, m, player)
    player = "O" if player == "X" else "X"
for r in range(3):
    print(" ".join(c if c != " " else "." for c in board[3*r:3*r+3]))
print("Winner:", winner(board) or "nobody (draw)")

# A position where X must block: O threatens the top row (squares 0, 1 -> 2)
b = "OO  X  X "
print("X to move. Score of each move:")
for m in moves(b):
    print("  square", m, "->", minimax(play(b, m, "X"), "O"))
print("best move:", best_move(b, "X"))
```

Running it for this guide printed:

```console
Value of the empty board: 0
X X O
O O X
X O X
Winner: nobody (draw)
X to move. Score of each move:
  square 2 -> 0
  square 3 -> -1
  square 5 -> -1
  square 6 -> -1
  square 8 -> -1
best move: 2
```

*What just happened:*

- **The empty board is worth 0.** Tic-tac-toe is a draw with perfect play, and the program proved it by searching everything.
- **Perfect plays perfect and draws.** The exact board shown depends on how ties between equal moves are broken (here, the first best move wins the tie), but a draw is guaranteed.
- **The block is found by arithmetic, not by a rule.** O holds squares 0 and 1, threatening 2. Every X move except square 2 scores -1, because minimax finds O's winning reply. Nobody wrote "block the opponent". It falls out of looking ahead.

## Reading the code

The pieces map straight onto the theory:

- A **base case** handles finished games: a winner, or a full board (a draw).
- The **recursive case** asks for the value of every child position, then takes `max` or `min` depending on whose turn it is.
- `best_move` is the same search, run one level up, returning the move instead of the value.

The 0, +1, -1 numbers have no special meaning, only the order does. Chess programs use scores in "pawns" or "centipawns" and the same max/min logic applies.

> ⚠️ **Gotcha.** This version searches roughly half a million positions from the empty board, and it recomputes the same positions many times. That is fine for 9 squares. You will see the exact count in the next phase, and why chess needs smarter tricks.

> 💡 **Key point.** Minimax assumes the opponent is perfect. Against a weaker opponent it may pass up a trap that would have won faster, but it never gets a result worse than the value it computed. That safety guarantee is the reason it is the foundation.

Check yourself before moving on:

```quiz
[
  {"q": "At a position where it is O's turn (O is the minimizer), how is the position's value computed?", "choices": ["The maximum of the values of its child positions", "The minimum of the values of its child positions", "The average of the child values", "The value of the first child"], "answer": 1, "explain": "O picks the move that is best for O, which is the lowest score from X's point of view."},
  {"q": "Minimax scored the empty tic-tac-toe board 0. What does that tell you?", "choices": ["X always wins if it moves first", "The search found no legal moves", "With perfect play by both sides the game is a draw", "The board is symmetric so scoring failed"], "answer": 2, "explain": "The value of the root is the game-theoretic result when both players play their best."},
  {"q": "Why did the program choose square 2 in the blocking position?", "choices": ["A rule says to block the opponent", "Square 2 is the first empty square", "It picks randomly among equal moves", "Every other move led to a score of -1 and square 2 led to 0"], "answer": 3, "explain": "No blocking rule exists. Looking ahead shows that any other move lets O complete the row."}
]
```

## Recap

1. Score finished games from one player's view and let the two players push the number in opposite directions.
2. A position's value is the max of its children on the maximizer's turn and the min on the minimizer's turn.
3. The whole algorithm is one recursive function with a base case for finished games.
4. The root value is the result under perfect play, and the best move leads to a child with that value.
5. Behaviors like blocking emerge from lookahead; they are not programmed in.

Next up, [Alpha-Beta Pruning: Skipping Work That Cannot Matter](03-alpha-beta-pruning.md): the same answer with far fewer positions searched.
