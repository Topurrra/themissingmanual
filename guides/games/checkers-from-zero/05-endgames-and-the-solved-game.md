---
title: "Endgames and the Solved Game"
guide: "checkers-from-zero"
phase: 5
summary: "How kings fight when few pieces are left, why three kings beat one, and what it means that a computer proved checkers is a draw with perfect play."
tags: [checkers, endgame, kings, chinook, solved-games, draughts]
difficulty: advanced
synonyms: ["checkers endgame", "three kings versus one king checkers", "is checkers solved", "what is chinook checkers", "checkers is a draw", "how did a computer solve checkers", "weakly solved game meaning", "how to trap a king in checkers"]
updated: 2026-10-06
---

# Endgames and the Solved Game

When the board empties, checkers changes character. Tactics shrink, kings dominate, and the question stops being "who wins material?" and becomes "can anyone force a win at all?" This phase covers the king endgame you will actually meet, and then steps back to the biggest fact about the game: a team of researchers proved that, played perfectly, checkers is a draw.

A note on method. The claims below about small endgames come from an exhaustive computer search written for this guide under the exact rules of the site's game: it explores every position reachable from the starting arrangement and labels each one win, loss, or draw. We cross-checked its move generator against the site's own game code on tens of thousands of positions. Treat these as checked facts, not rules of thumb.

## Kings are hard to catch

A king moves in four directions, so it can slip away from almost anything. Catching one takes several kings working together, and the first thing to learn is what "caught" looks like. A king is trapped when it has **no legal move**: every neighbor square is blocked, and every jump it could make is blocked too.

```text
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     .     .
    .     .     .     .
 .     .     B     .
    .     .     B     B
 .     .     .     W

Black kings: 23, 27, 28; White kings: 32
```

White to move, and White has no legal move, so White loses. The lone White king on 32 sits in a double corner. Its neighbors are 27 and 28. Black's king on 28 blocks one and cannot be jumped, because beyond it is the edge of the board. Black's king on 27 blocks the other, and White cannot jump it, because the square behind it, 23, is occupied by a third Black king.

Three kings, one trap. The same idea works in the other double corner, 1 and 5.

## Three kings against one: a forced win

Here is the useful fact. **Three kings beat one king from every starting arrangement, as long as the three-king side is to move, and the win never takes more than 15 moves.** That is well inside the rule that lets a player claim a draw after 40 moves each without a capture or a man move, so the win is real, not only theoretical.

The technique is to herd the lone king toward a double corner or the edge and then close the net, with each of your kings guarding a square your other kings need. You do not need to memorize the maneuvers. You need to know that the win exists, so you do not give up a position with three kings against one, and so you do not trade into this ending when you are the one with the lone king.

## Two kings against one: it depends

Two kings are not enough to win from every arrangement. Our search found that the two-king side wins from the large majority of arrangements, and that the lone king survives with a draw from a minority of them. For example, Black kings on 1 and 2 against a White king on 15, with Black to move, is a forced win for Black, but it takes 17 moves of careful play.

What decides these positions is the idea from Phase 4: who is forced to move into a worse square. A lone king that cannot be herded into a corner draws, and one that can be herded loses. If you have two kings against one in a game, play for the trap, but do not assume it works from every start.

## What "solved" means

A game is **solved** when the correct result with perfect play is known. Researchers use three levels:

- **Ultra-weakly solved:** the result of the starting position is known, perhaps by a clever argument, but nobody knows how to achieve it.
- **Weakly solved:** the result is known, and there is a strategy that achieves it from the starting position against any opponent.
- **Strongly solved:** the correct result is known for every legal position, not only the starting one.

Checkers is **weakly solved**.

## The Chinook proof

Jonathan Schaeffer and his colleagues at the University of Alberta wrote the checkers program **Chinook** starting in 1989. On July 19, 2007, the journal *Science* published their paper online (it appeared in the print issue of September 14, 2007) "Checkers Is Solved." The result: **with perfect play by both sides, the game is a draw.**

It was an enormous computation. Checkers has about 5 x 10^20 possible positions (500 billion billion). The team combined a proof search through the opening and middlegame with databases of endgame positions, every position with 10 or fewer pieces on the board (about 39 trillion of them).

Two things the result does **not** mean:

- It does not mean every position is known. Weak solution is about the starting position. Chinook has not labeled all 5 x 10^20 positions.
- It does not mean checkers is boring or that human games end in draws. Humans do not play perfectly, and the games you lose are lost to mistakes, most of them tactical. Everything in Phases 2 and 3 still applies.

The proof method is the same family of ideas as every game-playing program: search the tree of moves, evaluate the leaves, and use stored endgame knowledge to cut the search short. [How Computers Play Games](/guides/how-computers-play-games) teaches those ideas from the ground up, and its [fifth phase](/guides/how-computers-play-games/5) covers how games get solved.

## Where to go from here

Play. The site's [play checkers](/games/checkers) page gives you an engine to practice against, with a coach mode if you want help finding your legal moves. A good first goal: win a game by a shot, with the sacrifice, the forced reply, and the multiple jump all happening on the board in front of you. A good second goal: reach a three-kings-against-one ending and trap the king in a double corner.

Sources for this phase: the paper J. Schaeffer et al., "Checkers Is Solved," *Science* 317 (2007), pp. 1518-1522, [doi:10.1126/science.1144079](https://doi.org/10.1126/science.1144079); the University of Alberta's [Chinook page](https://webdocs.cs.ualberta.ca/~chinook/); and the [American Checker Federation rules](https://www.usacheckers.com/rulesofcheckers.php).

Check yourself before moving on:

```quiz
[
  {"q": "In the trap diagram, why can't White's king on 32 jump Black's king on 27?", "choices": ["Kings cannot jump kings", "The square behind 27 on that diagonal, 23, is occupied", "White's king is not allowed to move backward", "27 is a light square"], "answer": 1, "explain": "A jump needs an empty square directly beyond the piece. Square 23 holds another Black king, so there is nowhere to land."},
  {"q": "Which statement about three kings against one king is true under these rules?", "choices": ["It is always a draw", "The three-king side wins from every arrangement when it is to move", "It is a win only if the lone king is in the center", "The lone king always escapes to the main road"], "answer": 1, "explain": "An exhaustive search shows the three-king side wins from every arrangement when it is on the move, in at most 15 moves."},
  {"q": "What does it mean that checkers is 'weakly solved'?", "choices": ["Every possible position has been labeled win, loss, or draw", "The result with perfect play from the starting position is known, along with a strategy that achieves it", "A computer can beat every human", "Only the endgame has been studied"], "answer": 1, "explain": "Weak solution covers the starting position: perfect play leads to a draw, and there is a proof. Labeling every position would be a strong solution, which has not been done for checkers."}
]
```

## Recap

1. A king is trapped when it has no legal move, including no legal jump; a double corner makes this possible with three kings.
2. Three kings beat one king from every arrangement when the three-king side is to move, within 15 moves.
3. Two kings against one is not automatic: it wins from many arrangements and draws from some.
4. A game is weakly solved when the result of the starting position, with a strategy to achieve it, is known.
5. Chinook (Schaeffer et al., Science, 2007) showed that checkers is a draw with perfect play, and that does not mean the games you play are drawn.

You have reached the end of the checkers ladder. If you want to see how a program decides on a move, read [How Computers Play Games](/guides/how-computers-play-games).
