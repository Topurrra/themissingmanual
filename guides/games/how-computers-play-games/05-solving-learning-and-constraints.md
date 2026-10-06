---
title: "Solved Games, Learned Games, and Constraints"
guide: "how-computers-play-games"
phase: 5
summary: "How checkers was proven a draw by Chinook, how Monte Carlo tree search, AlphaGo, and AlphaZero replace hand-written evaluation with sampling and learning, and why Sudoku is solved by constraint satisfaction instead of adversarial search."
tags: [chinook, solved-games, monte-carlo-tree-search, alphago, alphazero, constraint-satisfaction, backtracking, sudoku]
difficulty: advanced
synonyms: ["is checkers solved", "what is chinook", "what does weakly solved mean", "what is monte carlo tree search", "how did alphago work", "how does alphazero work", "how do computers solve sudoku", "constraint satisfaction problem explained", "backtracking sudoku solver python"]
updated: 2026-10-06
---

# Solved Games, Learned Games, and Constraints

So far the recipe has been: search the tree as deep as you can, then guess. This phase covers three different directions. One pushes search so far that the game is finished for good. One drops the hand-written guess and uses sampling and learning. The last leaves two-player games altogether, because Sudoku has no opponent and needs a different tool.

## Solving a game: Chinook and checkers

To **solve** a game means to know its result under perfect play. There are levels, and the difference matters:

- **Ultra-weakly solved:** you know the result from the starting position, maybe by an argument, without knowing how to achieve it.
- **Weakly solved:** you know the result and have a strategy that achieves it from the start.
- **Strongly solved:** you know the best result from every legal position.

In 2007, Jonathan Schaeffer and colleagues published [Checkers Is Solved](https://doi.org/10.1126/science.1144079) in *Science*. They showed that checkers (English draughts) is a **draw** with perfect play, which makes it **weakly solved**. The game has roughly 5 x 10^20 positions, far too many to examine one by one, and the team had been working on the problem since 1989 with their program **Chinook**. They combined a forward search from the opening with endgame databases (precomputed exact results for positions with few pieces left) and a proof-search procedure to avoid examining positions that did not matter. The result is a proof, not a strong opinion: if you never make a mistake as either side, the game is drawn.

This is the same alpha-beta thinking from earlier, scaled up with databases and many years of computer time. It worked because checkers' tree, although huge, is small enough to be tamed. Chess and Go are not solved. The checkers opponent on this site is an engine named Marcher, and you can [play checkers](/games/checkers) against it. [Checkers From Zero](/guides/checkers-from-zero) teaches the game itself.

> ⚠️ **Gotcha.** "Solved" does not mean the program plays like a human would, or that every game is a draw in practice. It means a flawless player cannot do better than a draw. Humans make mistakes, and so does any engine that is not carrying the full proof.

## Monte Carlo tree search: sample instead of enumerate

Go was out of reach for the alpha-beta recipe for two reasons from phase 1: too many moves per turn, and no good hand-written evaluation (a Go position does not reduce to a material count). A different approach, **Monte Carlo tree search** (MCTS), changes the question from "what is the exact value?" to "how often do I win from here?"

The simplest form: from the position, try a move, then play the rest of the game out with random moves, many times. A move that wins more of its random games is probably better. Run it on the blocking position from phase 2:

```python runnable
import random

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

def random_playout(b, player):
    """Finish the game with random moves. Return the winner or None."""
    while not winner(b) and moves(b):
        b = play(b, random.choice(moves(b)), player)
        player = "O" if player == "X" else "X"
    return winner(b)

def monte_carlo_move(b, player, playouts=300):
    other = "O" if player == "X" else "X"
    rates = {}
    for m in moves(b):
        wins = 0
        for _ in range(playouts):
            w = random_playout(play(b, m, player), other)
            wins += 1 if w == player else 0.5 if w is None else 0
        rates[m] = wins / playouts
    return max(rates, key=rates.get), rates

random.seed(7)
b = "OO  X  X "   # X must block square 2
move, rates = monte_carlo_move(b, "X")
print("move chosen:", move)
for m, r in rates.items():
    print("  square", m, "score", round(r, 2))
```

With the seed fixed at 7, it printed:

```console
move chosen: 2
  square 2 score 0.79
  square 3 score 0.46
  square 5 score 0.37
  square 6 score 0.56
  square 8 score 0.37
```

*What just happened:* the program knows no tactics. Random games win more often after the block, so it found the right move through statistics. Other seeds give slightly different percentages, which is the point: results are estimates that sharpen with more playouts.

Real MCTS adds the "tree" part. It grows a search tree gradually, repeating four steps: **select** a promising path through the tree built so far, **expand** it by one new position, **simulate** a playout to the end, and **back up** the result along the path. Promising branches get more attention, and weak ones less, so effort concentrates where it matters.

## AlphaGo: networks to guide the search

In 2016, the DeepMind team published [Mastering the game of Go with deep neural networks and tree search](https://doi.org/10.1038/nature16961) in *Nature*. AlphaGo combined MCTS with two deep neural networks, as described in the [Google Research summary](https://research.google/blog/alphago-mastering-the-ancient-game-of-go-with-machine-learning/):

- A **policy network** predicts which moves a strong player would likely play, so the search examines only those. This cuts the branching factor.
- A **value network** estimates who is winning in a position, so the search can stop early instead of playing every game to the end. This cuts the depth.

The policy network was first trained on 30 million moves from games between human experts, until it predicted the expert's move 57% of the time, then improved by self-play and reinforcement learning. In the match that followed, AlphaGo beat Fan Hui, the three-time European champion, 5 games to 0, the first time a program had beaten a professional Go player on a full-size board with no handicap. In March 2016 a later version beat Lee Sedol, one of the world's top players, 4 games to 1.

Notice the two roles map onto this guide. The value network replaces a hand-written evaluation function from phase 4, and the policy network plays the part that move ordering plays in alpha-beta: spend effort on promising moves first.

## AlphaZero: learning from the rules alone

AlphaGo still began with human game records. In 2017 the DeepMind team posted [a general reinforcement learning algorithm](https://arxiv.org/abs/1712.01815), later published in [Science in 2018](https://doi.org/10.1126/science.aar6404), called **AlphaZero**. It starts knowing only the rules and plays against itself. A single neural network, trained from those self-play games, supplies both move preferences and position values to an MCTS. The authors report that, with no domain knowledge beyond the rules, it reached superhuman strength in chess, shogi, and Go within 24 hours of training, and defeated a world-champion program in each: Stockfish in chess and Elmo in shogi.

Two caveats help keep the picture clear. Stockfish has changed since that comparison, notably by adopting NNUE (phase 4), and the result depended on the match conditions and hardware, which the paper documents. Also, AlphaZero is a family of ideas: a learned network guiding a search. Engines today often combine learned evaluation with classical search, as Stockfish does.

The learning side is the same ideas as [How a Model Learns](/guides/how-a-model-learns) applied to games: the network's weights are adjusted so its predictions match what search and game outcomes show. Self-play creates its own training data.

## A different paradigm: constraint solving

Chess and checkers have an opponent. **Sudoku does not.** There is nobody to anticipate, only a set of rules every answer must satisfy. That makes it a **constraint satisfaction problem**: variables (the 81 cells), domains (digits 1 to 9), and constraints (no repeated digit in a row, column, or box). You are not choosing a move to survive a reply. You are searching for any assignment that breaks no constraint.

The standard method is **backtracking**: fill a cell, continue, and if you reach a dead end, undo the last choice and try another. It is recursion again, as in [Recursion Finally Clicks](/guides/recursion-finally-clicks). What decides whether it takes microseconds or forever is *which cell you fill next*. Compare two strategies on a well-known example puzzle:

```python runnable
PUZZLE = ("530070000600195000098000060800060003400803001700020006060000280000419005000080079")

def candidates(grid, r, c):
    used = set(grid[r]) | {grid[i][c] for i in range(9)}
    br, bc = 3 * (r // 3), 3 * (c // 3)
    used |= {grid[i][j] for i in range(br, br + 3) for j in range(bc, bc + 3)}
    return [d for d in range(1, 10) if d not in used]

def solve(grid, smart):
    """Backtracking search. Returns (solved?, number of digit placements tried)."""
    tries = 0
    def go():
        nonlocal tries
        empties = [(r, c) for r in range(9) for c in range(9) if grid[r][c] == 0]
        if not empties:
            return True
        if smart:   # pick the blank with the fewest legal digits
            r, c = min(empties, key=lambda rc: len(candidates(grid, *rc)))
        else:       # pick the first blank in reading order
            r, c = empties[0]
        for d in candidates(grid, r, c):
            tries += 1
            grid[r][c] = d
            if go():
                return True
            grid[r][c] = 0
        return False
    ok = go()
    return ok, tries

def parse(s):
    return [[int(s[9 * r + c]) for c in range(9)] for r in range(9)]

for name, smart in (("first blank first", False), ("fewest options first", True)):
    g = parse(PUZZLE)
    ok, tries = solve(g, smart)
    print(name, "-> solved:", ok, "placements tried:", tries)
print("first row of the answer:", g[0])
```

```console
first blank first -> solved: True placements tried: 4208
fewest options first -> solved: True placements tried: 51
first row of the answer: [5, 3, 4, 6, 7, 8, 9, 1, 2]
```

*What just happened:* both solvers are exact and find the same grid. The puzzle has 51 blank cells, so 51 placements means the second strategy never backtracked: at each step it chose the most constrained cell, which was always forced or nearly so. This rule, "fewest remaining options first," is a standard heuristic called minimum remaining values. The first solver wasted about eighty times as many placements on guesses it later undid.

Compare the two paradigms. In game search you ask what the opponent can do to you, and you handle uncertainty by assuming their best play. In constraint solving you prune by eliminating possibilities that violate a rule, and there is no adversary. Both fight the same enemy, exponential growth, with the same weapon: refusing to explore what cannot lead anywhere. You can try this on a real puzzle with [play Sudoku](/games/sudoku), and [Sudoku From Zero](/guides/sudoku-from-zero) shows the human version of the same elimination logic.

> 💡 **Key point.** Choosing the problem's structure matters more than choosing a fast language. Two-player games ask for minimax and its relatives, puzzles with rules ask for constraints, and when no hand-written evaluation exists, learning and sampling fill the gap.

Check yourself before moving on:

```quiz
[
  {"q": "What did Schaeffer and colleagues show about checkers in 2007?", "choices": ["It is a draw with perfect play, so it is weakly solved", "It is a win for the first player", "It is strongly solved from every position", "It cannot be solved by computers"], "answer": 0, "explain": "Checkers Is Solved (Science, 2007) proved the result of the starting position is a draw. Weakly solved means the start is known, not every position."},
  {"q": "In AlphaGo, what are the policy network and the value network used for?", "choices": ["Policy stores opening books, value counts stones", "Policy suggests promising moves to search, value estimates who is winning so the search can stop early", "Both only choose the final move without any search", "Policy trains against Stockfish, value runs minimax"], "answer": 1, "explain": "The policy network narrows the branching, and the value network shortens the depth, both inside Monte Carlo tree search."},
  {"q": "Why can Sudoku be handled by backtracking with constraints rather than minimax?", "choices": ["It has fewer than nine cells", "Minimax cannot use recursion", "There is no opponent, only rules that a complete answer must satisfy", "Sudoku positions have no legal moves"], "answer": 2, "explain": "Sudoku is a constraint satisfaction problem. You search for any assignment that breaks no rule, rather than anticipating an opponent's replies."}
]
```

## Recap

1. Solving a game means knowing its result under perfect play; checkers was weakly solved in 2007 and is a draw.
2. Monte Carlo search estimates a move's value from many random playouts and grows a tree around the promising ones.
3. AlphaGo used a policy network to narrow moves and a value network to cut depth, inside MCTS.
4. AlphaZero learned from self-play with only the rules, reaching top strength in chess, shogi, and Go according to its authors.
5. Sudoku is a constraint problem: backtracking plus a good choice of which cell to fill next, with no opponent involved.

That is the whole ladder, from a nine-square board to systems that learn a game on their own. To keep going, try changing the tic-tac-toe code to play a different game, or return to [Big-O Without the Math Panic](/guides/big-o-without-the-math-panic) and measure where each of these methods hits its limits.
