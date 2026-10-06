---
title: "Learning From an Engine"
guide: "chess-from-zero"
phase: 7
summary: "Use a chess engine like Stockfish as a coach: read its evaluation correctly, review your own games the right way, and avoid the habit of letting it think for you."
tags: [chess, stockfish, engine, analysis, improvement, game-review]
difficulty: intermediate
synonyms: ["how to use stockfish to improve at chess", "how to analyze a chess game", "what does a chess engine evaluation mean", "how to get better at chess with an engine", "should I use a chess engine to learn", "what is centipawn in chess", "how to review your chess games"]
updated: 2026-10-06
---

# Learning From an Engine

A chess engine will beat every human who has ever lived, and it will tell you exactly which move is best in any position. That sounds like the perfect teacher, and it is a trap. If the engine always supplies the answer, you never practice finding it, and you get better at asking, not at chess. This phase is about getting the lessons from an engine without losing the part that makes you improve.

## What an engine actually does

Stockfish, the engine behind the opponent on this site, looks at a position, tries moves, tries the replies, and so on as deep as it can, then scores the positions at the end of each line and picks the best. It does not "understand" a plan the way you do, and it does not know why a move is good. It knows that after that move, the lines it searched come out better for you. The deeper story of how this works is in [How Computers Play Games](/guides/how-computers-play-games).

The score it gives is an **evaluation**. It is usually written like `+0.8` or `-2.3`, in units of roughly one pawn, from White's point of view: positive favors White, negative favors Black. A few rules of thumb:

- Near `0.0` means roughly equal.
- Around `+1` is a clear but not decisive edge, such as one pawn's worth.
- Large numbers mean a winning position, and a mate is shown separately, as "mate in N".

The scale is not literal, so `+1.0` does not mean you are exactly a pawn ahead, and the same number can feel very different for a human and a computer. Use the number as a direction, not a verdict.

## What goes wrong when you lean on it

Three habits stop beginners improving, and each one comes from handing the thinking to the engine.

1. **Playing with the hint open.** If you look at the suggested move before thinking, you have trained yourself to click. You also never see the position's real problem, because you never form your own plan.
2. **Reading only the best move.** Knowing that `Nf5` was best teaches you nothing unless you understand why. What did it attack? What did the alternative allow?
3. **Memorizing the engine's moves.** Engine lines often rely on precise sequences that a human cannot find over the board. Understand ideas, not strings of moves.

## A better routine

This is a judgment-based routine, not the only way, but it keeps the thinking on your side.

1. **Play, with the assist off.** On the site, use **Focus** mode (the board by itself) when you want to play without help. **Coach** mode adds a panel with facts about the position (whether you are in check, how many captures are available, and how many pieces are threatened) and the recent moves. Those facts line up with the checks-captures-threats scan from [phase 4](04-tactics.md), so use Coach as a check on your scan, not a replacement for it.
2. **Review your own game first.** Find the moment you think it turned. Write down what you were thinking.
3. **Then ask the engine.** Find the move where the evaluation changed a lot. Look at what you missed: a hanging piece, a fork, a better square for a rook?
4. **Ask "why" before "what".** Before you look at the engine's move, guess it, then compare. If you were wrong, find the reason in the position: a tactic from phase 4, a weak square from [phase 5](05-openings-and-middlegame-plans.md).
5. **Find the pattern.** One missed fork is a mistake. Missing forks in three games is a habit, and you now know what to practice.

## Pick your opponent's strength on purpose

The game at [play chess](/games/chess) has a difficulty selector with three levels that changes how strong Stockfish plays. Playing only against the strongest setting teaches you little, because you lose in ways you cannot learn from. Pick a setting where you win some and lose some, and every loss will have a cause you can find. As you improve, raise it. The Hint button, available in both modes, asks the engine for a suggested move. Use it after you think, not before.

## Checking that it works

Set one small target at a time. For a few games, play only the scan from phase 4 before every move. Then check if you hang fewer pieces. Then target the opening principles. Then endgames. Improving at chess is less about knowing more and more about having fewer lapses.

Check yourself before moving on:

```quiz
[
  {"q": "An engine shows an evaluation of +0.1 for the current position. What does that most likely mean?", "choices": ["White is losing", "The position is about equal", "Black is winning by a pawn", "White has a forced mate"], "answer": 1, "explain": "Values near zero mean a roughly balanced position. Positive favors White, but 0.1 is far too small to matter."},
  {"q": "Which is the best way to use an engine's suggested move?", "choices": ["Play it without thinking, because it is always right", "Open the hint before every move", "Guess the move first, then compare and find out why it works", "Memorize it for the next game"], "answer": 2, "explain": "The learning is in the gap between your guess and the engine's move. If you never guess, there is no gap and nothing to learn."},
  {"q": "In Coach mode on the site, which of these does the panel show you?", "choices": ["A full evaluation bar for every move", "Whether you are in check, the captures available, and the pieces under threat", "The opponent's next move", "A guaranteed winning line"], "answer": 1, "explain": "The coach panel shows facts about the position (check status, capture count, threatened pieces) and the recent moves. It does not show an evaluation bar, the opponent's next move, or a forced win."}
]
```

## Recap

1. An engine searches ahead and scores positions; it picks the best move without knowing why you would play it.
2. An evaluation near 0 is equal, about +1 is a clear edge, and larger numbers mean winning. The scale is a direction, not a verdict.
3. Do not play with hints open, do not memorize engine lines, and do not read only the best move.
4. Review your game first, then check the engine, then guess before you look.
5. Choose an opponent strength where you win some and lose some.

You now have the full ladder: rules, notation, mates, tactics, openings, plans, and endings. The best next step is to play, then review. Open [play chess](/games/chess) and start a game.
