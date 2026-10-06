---
title: "Reading Ahead, and How AlphaGo Changed Go"
guide: "go-the-board-game"
phase: 6
summary: "How to read a Go position several moves deep, why the game is too big for brute force, and how AlphaGo combined neural networks with tree search to beat Lee Sedol 4-1 in 2016."
tags: [go, reading, alphago, deepmind, monte-carlo-tree-search, neural-networks, history]
difficulty: intermediate
synonyms: ["how to read ahead in go", "what is reading in go", "how did alphago beat lee sedol", "why is go hard for computers", "alphago explained", "alphago vs lee sedol score", "how does alphago work", "go life and death problem"]
updated: 2026-10-06
---

# Reading Ahead, and How AlphaGo Changed Go

Every tactic in the last phase came from the same habit: look at a position and play it out in your head before you touch a stone. That habit is called **reading** (in Go and in most strategy games), and it is the skill that separates players more than any other. This phase shows how to read, why the whole game is too large to read completely, and how a program learned to choose what to read, which is the story of AlphaGo.

## Reading: one branch at a time

To read is to ask "if I play here, what does my opponent do, what do I do then" and keep going until the position is settled enough to judge. Three habits make it work:

1. **List the candidate moves.** Start with the forcing ones: ataris, captures, and moves that threaten something.
2. **For each, find the opponent's best reply,** not the reply you hope for. Assume they see what you see.
3. **Stop when the position is quiet** (no group in atari, nothing about to be captured), then judge it: who has more liberties, eyes, and space?

Try it on a small problem. White's group in the corner is surrounded. Black to play and kill it. Three candidate moves are marked:

```text
  +-----------
  | a b O X
  | c O O X
  | O O X X
  | X X X X
```

White's group has an eye space of three points in a bent line: `a` is the corner, `b` and `c` are the two ends. Read each:

- **Black plays `b` (or `c`).** The Black stone has only one liberty, `a`, so White captures it by playing there. That capture leaves White with two single-point eyes on either side of White's new stone, so White lives.
- **Black plays `a`,** the point in the middle of the bent shape. Now White cannot make two separate eyes, and the group dies.

*What just happened:* the answer is the vital point, the same idea as the middle of three in a row in Phase 3. A bent line of three behaves like a straight one: the point where the shape bends is the key. We confirmed `a` kills and `b` and `c` do not by playing out every White reply.

## Why you cannot read everything

Reading a ladder is cheap because every move is forced. Reading an open position is not. In an average Go position there are roughly 250 legal moves, and a game lasts about 150 moves. Chess has roughly 35 legal moves in a typical position and games of about 80 moves (the figures are approximate and come from the AlphaGo research paper). Searching every sequence is out of the question in both games, and Go is far worse. For a long time, programs that tried to play Go by searching with human-written rules were far weaker than top professionals.

Two problems stood in the way, and they are worth naming because they are the same two problems in every game-playing program:

1. **Breadth:** too many moves to consider at each turn.
2. **Evaluation:** deciding who is ahead in a position without playing it to the end. In chess you can count material. In Go, who is ahead depends on territory that does not exist yet.

## AlphaGo, 2016

AlphaGo, built by the company DeepMind, attacked both problems with neural networks (programs that learn patterns from examples) and combined them with a tree search. The system had three parts:

- A **policy network** looks at a position and proposes the most promising moves, which cuts the breadth. It was first trained on about 30 million moves from games between strong human players.
- A **value network** looks at a position and estimates who is winning, which solves the evaluation problem.
- **Monte Carlo tree search** uses both to read ahead selectively, spending its effort on the most promising lines.

After learning from human games, AlphaGo improved by playing large numbers of games against copies of itself. Its first public result came in October 2015, when it beat Fan Hui, the reigning three-time European champion and a professional, 5-0 on a full-size board with no handicap, the first time a program had done that against a professional. DeepMind's paper in *Nature* (Silver et al., "Mastering the game of Go with deep neural networks and tree search," January 2016) described it.

In March 2016 in Seoul, South Korea, AlphaGo played a five-game match against Lee Sedol, one of the strongest professionals in the world. **AlphaGo won 4-1.** Lee won the fourth game with an unexpected move (the 78th) that the professional Gu Li called a "divine move." In the second game, AlphaGo's 37th move was an unconventional play that commentators called creative and unlike how humans play. All five games ended by resignation.

A later version, AlphaGo Zero (2017), learned with no human games at all, only by playing itself, and beat the version that defeated Lee Sedol 100 games to 0.

> 💡 **Key point.** AlphaGo did not read more moves than a human could in total. It chose which few moves to read and judged the result better than any earlier program, which is exactly what you practice when you narrow candidates and then evaluate a quiet position.

You now know the whole stack in miniature: the rules, the tactics, the way a position is judged, and the search that ties them together. How machines in general play games (chess programs, minimax, Monte Carlo search) is the subject of [How Computers Play Games](/guides/how-computers-play-games).

## Where to go from here

Play 9x9 games, and after each one find the one move where you misjudged a group's life or death. Replay it and read both sides. A 9x9 game takes about ten minutes, so a few dozen of them will teach you more than any book. Then move to 13x13 and 19x19, where the same ideas apply at larger scale.

## Check yourself

```quiz
[
  {
    "q": "In the corner problem, why does Black playing the middle point a kill, while playing an end point does not?",
    "choices": ["At the middle point White can no longer make two separate eyes, while an end-point stone is captured and leaves two eyes", "Because corners always die", "Because Black gets a ko"],
    "answer": 0,
    "explain": "The middle (vital) point stops two separate eyes from forming. A stone at an end is captured, which leaves White with two single eyes."
  },
  {
    "q": "What was the result of AlphaGo's 2016 match against Lee Sedol?",
    "choices": ["5-0 for Lee Sedol", "4-1 for AlphaGo", "3-2 for AlphaGo", "A draw"],
    "answer": 1,
    "explain": "AlphaGo won four games to one. Lee Sedol won the fourth game."
  },
  {
    "q": "Which two problems did AlphaGo's networks address?",
    "choices": ["Choosing a promising few moves out of hundreds, and evaluating who is winning without playing to the end", "Making the board smaller and shortening the game", "Rewriting the rules and the scoring"],
    "answer": 0,
    "explain": "The policy network narrows the choice of moves and the value network judges positions."
  }
]
```

## Recap

1. Reading means playing a line out in your head: list candidates, find the opponent's best reply, and judge a quiet position.
2. The vital point of an eye shape (the middle of a bent or straight three) decides life and death.
3. Go has roughly 250 legal moves per position over about 150 moves, far too many to search completely.
4. AlphaGo combined a policy network, a value network, and Monte Carlo tree search, trained on human games and then by self-play.
5. It beat Lee Sedol 4-1 in Seoul in March 2016.
6. AlphaGo Zero later learned from self-play alone.

Next up: [How Computers Play Games](/guides/how-computers-play-games) covers the search ideas behind programs that play chess, checkers, and Go.
