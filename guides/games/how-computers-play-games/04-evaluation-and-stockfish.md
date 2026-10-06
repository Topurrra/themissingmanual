---
title: "Evaluation Functions and Stockfish"
guide: "how-computers-play-games"
phase: 4
summary: "When a search must stop before the game ends, an evaluation function guesses who is winning; this phase builds a toy one, explains depth limits and quiescence, and shows how Stockfish pairs alpha-beta search with an NNUE neural-network evaluation."
tags: [evaluation-function, heuristics, stockfish, nnue, quiescence, chess-engine, depth-limited-search]
difficulty: advanced
synonyms: ["what is an evaluation function", "how does stockfish work", "what is nnue", "what is quiescence search", "chess engine material evaluation", "depth limited minimax", "how do chess engines evaluate positions", "stockfish alpha beta nnue"]
updated: 2026-10-06
---

# Evaluation Functions and Stockfish

Phases 2 and 3 searched until the game ended, because tic-tac-toe is small enough. Chess is not. A chess engine has to stop after some number of plies and say, without seeing the end, "this position looks good for White." The function that says it is the **evaluation function**, and it is where most of an engine's chess knowledge lives.

## The two halves of an engine

A real engine is two parts working together:

1. **Search** looks ahead as far as it can, using minimax with alpha-beta pruning from the last phase.
2. **Evaluation** scores the positions at the edge of that lookahead, where search stops.

Search without evaluation sees every tactic but cannot tell a good quiet position from a bad one. Evaluation without search judges only what is on the board right now. Together, the search turns a mediocre guess into a good decision by checking many futures.

The change to the minimax code is small: add a **depth limit**, and when depth reaches zero, return the evaluation instead of recursing. The scores are no longer the truth about the game. They are estimates, so a deeper search usually (not always) gives a better one.

## A toy evaluation you can run

For tic-tac-toe, a reasonable guess is to count the lines that are still open to each player. A line with no O marks is a possibility for X, worth more as X fills it. Score each side that way and subtract.

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

def evaluate(b):
    """Guess, from X's view, how good a non-final board looks.
    A line still open for one side is worth 1, 10 or 100 points
    depending on how many of that side's marks are already in it."""
    score = 0
    for line in LINES:
        cells = [b[i] for i in line]
        if "O" not in cells:
            score += (0, 1, 10, 100)[cells.count("X")]
        if "X" not in cells:
            score -= (0, 1, 10, 100)[cells.count("O")]
    return score

nodes = 0

def search(b, player, depth):
    """Minimax that stops after `depth` plies and trusts evaluate()."""
    global nodes
    nodes += 1
    w = winner(b)
    if w:
        return 10000 if w == "X" else -10000
    if not moves(b):
        return 0
    if depth == 0:
        return evaluate(b)
    other = "O" if player == "X" else "X"
    scores = [search(play(b, m, player), other, depth - 1) for m in moves(b)]
    return max(scores) if player == "X" else min(scores)

empty = " " * 9
for depth in (1, 2, 3):
    nodes = 0
    scores = {m: search(play(empty, m, "X"), "O", depth - 1) for m in moves(empty)}
    best = max(scores, key=scores.get)
    print("depth", depth, "-> opening move", best, "nodes", nodes)
```

The output when run for this guide:

```console
depth 1 -> opening move 4 nodes 9
depth 2 -> opening move 4 nodes 81
depth 3 -> opening move 4 nodes 585
```

*What just happened:* even a one-ply look plus a crude guess picks square 4, the center, which is on the most lines (four of the eight) and is a strong opening in tic-tac-toe. The evaluation encoded that knowledge without a rule saying "take the center." The node counts show the cost: each extra ply multiplies the work, which is the explosion from phase 1.

## Evaluation in chess: material first

The oldest and most important chess heuristic is **material**: count the pieces. The conventional point values are pawn 1, knight 3, bishop 3, rook 5, queen 9. These are teaching conventions, not laws, and engines refine them.

```python runnable
VALUE = {"p": 1, "n": 3, "b": 3, "r": 5, "q": 9, "k": 0}

def material(fen):
    """Positive means White is ahead. Only reads the piece-placement field."""
    total = 0
    for ch in fen.split()[0]:
        if ch.lower() in VALUE:
            total += VALUE[ch.lower()] if ch.isupper() else -VALUE[ch.lower()]
    return total

start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
no_queen = "rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
print("start position:", material(start))
print("Black has lost its queen:", material(no_queen))
```

```console
start position: 0
Black has lost its queen: 9
```

The string is **FEN**, the standard text notation for a chess position (capital letters are White). Material alone is a weak judge, though. Real evaluations add **mobility** (how many moves a side has), king safety, pawn structure, and control of the center. [Chess From Zero](/guides/chess-from-zero) explains why those matter to a human, and the engine cares for the same reasons.

## The horizon problem and quiescence

A depth limit creates a trap called the **horizon effect**. Suppose the search stops exactly after your queen captures a pawn. The evaluation sees "up a pawn" and loves it, missing that the queen is captured on the very next ply. The bad news lies past the horizon.

The classic fix is **quiescence search**. At the depth limit, instead of evaluating immediately, the engine keeps searching only the "noisy" moves, such as captures, until the position is quiet enough for a material count to mean something. Shannon discussed the need to evaluate only quiet positions in his 1950 paper, and it remains standard practice.

## How Stockfish works today

Stockfish is the open-source engine behind the [chess opponent on this site](/games/chess). Its [official project page](https://stockfishchess.org/about/) describes it as one of the strongest engines in the world. Per the Stockfish team's [announcement of NNUE evaluation](https://stockfishchess.org/blog/2020/introducing-nnue-evaluation/), it has two components exactly as above:

- **Search:** alpha-beta search (specifically a variant called principal variation search, PVS) finds the best move.
- **Evaluation:** a value for each position at the edge of the search. Historically this was a function "handcrafted by experts" from chess concepts. Since Stockfish 12, released in September 2020, it is an **NNUE**, an efficiently updatable neural network.

NNUE was first used in the game of shogi and then ported to Stockfish. It computes its score from basic inputs about where the pieces stand, and was trained on millions of positions. The "efficiently updatable" part is the key engineering idea: after one move only a few pieces change, so most of the network's first layer does not need to be recalculated. That lets a neural network run millions of times per second on an ordinary CPU, deep inside the search. Stockfish's own tests at the time of the announcement showed a gain of over 80 Elo points from this change.

> 💡 **Key point.** Stockfish did not stop being a search engine when it adopted a neural network. The network replaced the evaluation guess, not the alpha-beta search. This hybrid differs from AlphaZero, which you will meet in the next phase.

For background on how a network like this is built, read [How a Neural Network Is Structured](/guides/how-a-neural-network-is-structured), and for how its weights are found, [How a Model Learns](/guides/how-a-model-learns).

Check yourself before moving on:

```quiz
[
  {"q": "Why does a chess engine need an evaluation function at all?", "choices": ["Alpha-beta pruning cannot run without one", "Chess has no winning positions", "To make the search deterministic", "The game tree is too big to search to the end, so it must score unfinished positions"], "answer": 3, "explain": "Search must stop at a depth limit, and the evaluation scores the positions where it stops."},
  {"q": "What problem does quiescence search address?", "choices": ["Evaluating a position in the middle of a capture sequence, whose score is misleading", "Slow disk access", "Choosing the opening book", "Reducing the branching factor to 1"], "answer": 0, "explain": "Stopping mid-exchange makes the evaluation look better or worse than it is. Quiescence search continues the noisy moves until the position is calm."},
  {"q": "What is true of Stockfish since version 12?", "choices": ["It replaced search with a neural network that plays directly", "It uses alpha-beta search together with an NNUE neural-network evaluation", "It uses only handcrafted evaluation", "It uses Monte Carlo tree search"], "answer": 1, "explain": "The Stockfish project describes NNUE evaluation feeding values into alpha-beta (PVS) search."}
]
```

## Recap

1. Engines combine a search that looks ahead with an evaluation that scores the positions where it stops.
2. A depth limit turns exact minimax into an estimate, and deeper usually means better.
3. Material is the classic heuristic, joined by mobility, king safety, and structure.
4. The horizon effect is fixed by quiescence search, which keeps resolving captures before scoring.
5. Stockfish pairs alpha-beta search with an NNUE neural-network evaluation that is cheap to update after each move.

Next up, [Solved Games, Learned Games, and Constraints](05-solving-learning-and-constraints.md): proving a game is a draw, learning to play without hand-written knowledge, and a different style of problem.
