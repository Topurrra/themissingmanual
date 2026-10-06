---
title: "How a Computer Solves Sudoku"
guide: "sudoku-from-zero"
phase: 5
summary: "How a program solves any Sudoku: Sudoku as constraint satisfaction, plain backtracking, constraint propagation, and the fewest-options heuristic, with a runnable Python solver that counts its own search effort."
tags: [sudoku, backtracking, constraint-propagation, constraint-satisfaction, python, recursion, search, algorithms]
difficulty: intermediate
synonyms: ["how does a computer solve sudoku", "sudoku solver python", "sudoku backtracking algorithm", "what is constraint propagation", "how to write a sudoku solver", "minimum remaining values heuristic", "how do computers check a sudoku has one solution", "sudoku as a graph coloring problem"]
updated: 2026-10-06
---

# How a Computer Solves Sudoku

A person solves Sudoku by recognizing patterns, which took four phases to teach. A computer recognizes nothing. It also needs no patterns, because it has two things people lack: it never tires of trying options, and it can undo a wrong choice without embarrassment. This phase builds a complete solver in about 100 lines, in the order the ideas appear: first brute force, then the technique from phase 2 turned into code, then the one heuristic that makes the search fast.

## Sudoku as a constraint problem

To a program, Sudoku is a **constraint satisfaction problem**: 81 variables (the cells), each choosing a value from 1 to 9, under 27 constraints, each saying "the nine cells in this unit are all different". Another view: draw a dot for each cell and a line between every pair of peers. Each cell has 20 lines. A solution gives each dot a digit so that no two connected dots share one. That is a graph coloring with nine colors; [Graph Theory: What's Connected to What](/guides/graph-theory-whats-connected-to-what) introduces the vocabulary.

In code, number the cells 0 to 80, build a list of the 27 units, and give every cell a set of its 20 peers. From that, a cell's options are the naked-single subtraction from phase 2: all digits, minus the digits of its peers.

## Backtracking: try, check, undo

**Backtracking** is a search that builds an answer one choice at a time and abandons any partial answer that already breaks a rule. For Sudoku:

1. Find an empty cell.
2. For each digit that fits (does not clash with a peer), place it and solve the rest recursively.
3. If the rest cannot be solved, remove the digit and try the next one.
4. If no digit fits, return failure so the previous cell tries something else.

The "undo" is the key. Each recursive call is a guess, and a failed call retracts it. This is the recursion pattern from [Recursion Finally Clicks](/guides/recursion-finally-clicks), with the base case "no empty cells left". It always finds a solution if one exists, since it eventually tries every possibility that does not break a rule.

The weakness is blindness. Plain backtracking fills cells in reading order and has no sense that cell 40 is nearly forced while cell 1 has seven options. It wastes effort deep in a branch that was doomed several levels up. That is where the human techniques come back.

## Constraint propagation: the singles, automated

**Constraint propagation** means using the rules to shrink possibilities *before* guessing. Our solver applies two rules repeatedly until nothing changes:

- If a cell has only one option, place it (a naked single).
- If a digit fits in only one cell of a unit, place it there (a hidden single).

Each placement can create the next one, exactly the cascade you saw in phase 2. A cell with *zero* options, or a digit with nowhere to go, is a contradiction, and the solver reports failure at once instead of wandering further. Peter Norvig's well-known essay [Solving Every Sudoku Puzzle](https://norvig.com/sudoku.html) uses these same two rules plus search.

## Smart guessing: fewest options first

When propagation stalls, the solver must guess. The best place to guess is the empty cell with the **fewest options**, a heuristic called minimum remaining values. A cell with two options means one guess in two is right, and a wrong guess tends to contradict quickly. A cell with seven options is a poor bet. Choosing the most constrained cell makes failures appear early, which prunes whole branches. It is the program's version of "pick the best lead".

## The solver

Run it. It solves two puzzles with two strategies each and counts the **search calls** (each call is one guess or one starting attempt), so you can see the difference. The second puzzle is a famously hard one for people. Then it prints the solved first puzzle.

```python runnable
PUZZLE = "..7...32.8.2..71..94.1.6.75.....9247.........1....56...7.6.....5...74.3.4..5.176."
HARD = "8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4.."

# Cells are numbered 0..80, row by row. A unit is a row, column, or box.
UNITS = []
for r in range(9):
    UNITS.append([r * 9 + c for c in range(9)])
for c in range(9):
    UNITS.append([r * 9 + c for r in range(9)])
for br in (0, 3, 6):
    for bc in (0, 3, 6):
        UNITS.append([(br + i) * 9 + bc + j for i in range(3) for j in range(3)])

PEERS = [set() for _ in range(81)]
for unit in UNITS:
    for cell in unit:
        PEERS[cell] |= set(unit) - {cell}

def options(grid, cell):
    """Digits that do not clash with anything the cell can see."""
    return set(range(1, 10)) - {grid[p] for p in PEERS[cell]}

def parse(text):
    return [0 if ch == "." else int(ch) for ch in text]

def show(grid):
    for r in range(9):
        if r in (3, 6):
            print("------+-------+------")
        row = grid[r * 9:(r + 1) * 9]
        print(" ".join(str(v) if v else "." for v in row[:3]), "|",
              " ".join(str(v) if v else "." for v in row[3:6]), "|",
              " ".join(str(v) if v else "." for v in row[6:]))

# 1. Plain backtracking: take the first empty cell, try every digit that fits.
def solve_plain(grid, stats):
    stats["tries"] += 1
    if 0 not in grid:
        return True
    cell = grid.index(0)
    for d in sorted(options(grid, cell)):
        grid[cell] = d
        if solve_plain(grid, stats):
            return True
    grid[cell] = 0
    return False

# 2. Constraint propagation: keep filling forced cells (naked and hidden singles).
def propagate(grid):
    changed = True
    while changed:
        changed = False
        for cell in range(81):
            if grid[cell] == 0:
                opts = options(grid, cell)
                if not opts:
                    return False          # contradiction: a cell with no digit left
                if len(opts) == 1:
                    grid[cell] = opts.pop()
                    changed = True
        for unit in UNITS:
            for d in range(1, 10):
                if any(grid[c] == d for c in unit):
                    continue
                spots = [c for c in unit if grid[c] == 0 and d in options(grid, c)]
                if not spots:
                    return False          # contradiction: a digit with no home
                if len(spots) == 1:
                    grid[spots[0]] = d
                    changed = True
    return True

# 3. Propagate, then guess in the cell with the fewest options, and recurse.
def solve_smart(grid, stats):
    stats["tries"] += 1
    if not propagate(grid):
        return False
    if 0 not in grid:
        return True
    cell = min((c for c in range(81) if grid[c] == 0),
               key=lambda c: len(options(grid, c)))
    for d in sorted(options(grid, cell)):
        trial = grid[:]
        trial[cell] = d
        if solve_smart(trial, stats):
            grid[:] = trial
            return True
    return False

for label, text in (("PUZZLE", PUZZLE), ("HARD", HARD)):
    for name, solver in (("plain backtracking", solve_plain),
                         ("propagation + smart guess", solve_smart)):
        grid = parse(text)
        stats = {"tries": 0}
        solver(grid, stats)
        print(f"{label:6} {name:26} search calls: {stats['tries']}")

solution = parse(PUZZLE)
solve_smart(solution, {"tries": 0})
print()
show(solution)
```

Here is the output this produces (the counts are deterministic):

```text
PUZZLE plain backtracking         search calls: 282
PUZZLE propagation + smart guess  search calls: 1
HARD   plain backtracking         search calls: 49559
HARD   propagation + smart guess  search calls: 173

6 1 7 | 9 5 8 | 3 2 4
8 5 2 | 3 4 7 | 1 9 6
9 4 3 | 1 2 6 | 8 7 5
------+-------+------
3 6 5 | 8 1 9 | 2 4 7
7 9 8 | 4 6 2 | 5 1 3
1 2 4 | 7 3 5 | 6 8 9
------+-------+------
2 7 1 | 6 9 3 | 4 5 8
5 8 6 | 2 7 4 | 9 3 1
4 3 9 | 5 8 1 | 7 6 2
```

Read the numbers. On the first puzzle, which is a singles puzzle from phase 2, propagation alone solves it: one call, zero guesses. Plain backtracking needs 282 calls. On the hard puzzle, where people need real technique, plain backtracking makes nearly fifty thousand calls, and propagation plus smart guessing needs 173. The counts show how much structure the rules carry.

## Proving there is exactly one solution

A solver can also answer the question from phase 1. Do not stop at the first solution. Keep searching, and if the search finds a second complete grid, the puzzle has two solutions and is not valid. If the search ends with exactly one, the puzzle is unique. One common way for a puzzle generator to stay valid is to remove digits from a finished grid one at a time: erase a cell, count solutions, and put the digit back if the count goes above one.

## Where this leads

Backtracking is one idea at two scales. Here the search tree branches on "which digit goes in this cell", and constraints prune it. In chess and checkers the tree branches on "which move do I make", an opponent replies, and pruning needs more care. [How Computers Play Games](/guides/how-computers-play-games) picks up the same thread. The jump from "try, check, undo" to "think about the opponent's best reply" is where game AI begins.

## Your turn: count the solutions

```exercise
[
  {
    "type": "task",
    "task": "Change the solver so it counts the solutions of a puzzle instead of stopping at the first. Test it on a puzzle with a deliberate flaw: remove the digits from R4C1, R4C9, R5C1, and R5C9 of the solved grid above (rows 4 and 5, columns 1 and 9). It should report 2.",
    "reveal": "Make the recursive function return a count instead of True or False. Where it currently returns True on a full grid, return 1. In the loop over digits, add the result of each recursive call to a running total, and undo the placement (set the cell back to 0) after each digit instead of returning early. Return the total. A cap at 2 saves time, since you only need to know whether the count exceeds 1.",
    "checklist": ["It still undoes each placement after trying it", "It does not return early on the first full grid", "The deliberate flaw reports 2 solutions", "The original puzzle reports 1"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "A backtracking solver places a digit, recurses, and the recursion fails. What does it do next?",
    "choices": ["Stops and reports that the puzzle has no solution", "Removes that digit and tries the next option for the same cell", "Restarts from the first cell"],
    "answer": 1,
    "explain": "A failed recursion means that guess was wrong, so the solver retracts it and tries the next digit. Only when every digit fails does the failure travel up to the previous cell."
  },
  {
    "q": "Why does the solver guess in the empty cell with the fewest options?",
    "choices": ["Because that cell is always correct", "Because a wrong guess there contradicts quickly, which prunes branches early", "Because it is the first cell in reading order"],
    "answer": 1,
    "explain": "Fewer options means fewer branches and a higher chance of a right guess, and a wrong guess fails fast. Nothing guarantees the first guess is right, but search recovers if it is not."
  },
  {
    "q": "How can a program verify that a puzzle has exactly one solution?",
    "choices": ["Keep searching after the first solution; if no second grid is found, it is unique", "Check that the puzzle has at least 17 givens", "Solve it with only naked and hidden singles"],
    "answer": 0,
    "explain": "Uniqueness means no second grid exists, so you have to search past the first. Having 17 givens does not guarantee uniqueness, and a puzzle may be unique but need techniques beyond singles."
  }
]
```

## Recap

1. Sudoku is a constraint satisfaction problem: 81 cells, values 1 to 9, 27 all-different constraints; it is also coloring a 20-neighbor graph with nine colors.
2. Backtracking tries a digit, recurses, and undoes it on failure; it always finds a solution but can waste huge effort.
3. Constraint propagation applies naked and hidden singles automatically and detects contradictions early.
4. Guessing in the cell with the fewest options keeps the search small.
5. Searching past the first solution is how a program checks that a puzzle is unique.

Next up, to put a clock and an opponent into the search idea, read [How Computers Play Games](/guides/how-computers-play-games), or return to [play Sudoku](/games/sudoku) and try each phase's technique on a fresh puzzle.
