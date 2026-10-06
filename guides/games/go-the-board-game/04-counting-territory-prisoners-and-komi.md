---
title: "Counting: Territory, Prisoners, and Komi"
guide: "go-the-board-game"
phase: 4
summary: "How a Go game ends, how Japanese territory scoring works with prisoners and komi, and how Chinese-style area scoring compares and why it usually names the same winner."
tags: [go, scoring, territory, komi, japanese-rules, area-scoring, superko]
difficulty: beginner
synonyms: ["how does go scoring work", "how do you win a game of go", "what is komi in go", "japanese vs chinese rules go", "territory scoring vs area scoring", "what is dame in go", "how does a go game end", "what are prisoners in go"]
updated: 2026-10-06
---

# Counting: Territory, Prisoners, and Komi

Eventually both players agree there is nothing left to fight over, and the game has to be counted. Counting is where most beginners get stuck, mostly because Go has two common ways to do it and the two look different. This phase teaches the Japanese method on a finished 9x9 board, then shows the Chinese method on the same board so you can see they agree.

## How the game ends

A game ends when both players pass **in a row**. Then comes the part computers do not need but humans do:

1. **Agree which stones are dead.** A dead stone is one that cannot avoid capture (Phase 3). Players remove stones they agree are dead.
2. **If you disagree, play on.** In the Japanese rules, a dispute about life and death is settled by resuming play. The player whose group is really dead will not be able to save it.
3. **Count.**

You do not have to capture dead stones during play. That is why Go games do not end with endless capturing: a dead group is removed at the end, as if it had been captured.

## Japanese scoring: territory plus prisoners

Three terms come up:

- **Territory:** empty points surrounded by one player's living stones.
- **Dame** (Japanese for "useless point"): empty points that touch both colors, so they belong to nobody and count for nothing.
- **Prisoners:** stones you captured during the game, plus the opposing dead stones you remove at the end.

**Score = territory + prisoners.** Stones sitting on the board do not count in Japanese scoring.

Here is a finished game, simplified so the count is clear to follow. The White stone at row 3, column 2 is dead (inside Black's area) and the Black stone at row 5, column 8 is dead (inside White's):

```text
    1 2 3 4 5 6 7 8 9
  1 . . . . X O . . .
  2 . . . . X O . . .
  3 . O . . X O . . .
  4 . . . . X O . . .
  5 . . . . X O . X .
  6 . . . . X O . . .
  7 . . . X . O . . .
  8 . . . X . O . . .
  9 . . . X . O . . .
```

After the dead stones are removed, mark the points: `b` is Black territory, `w` is White territory, and `d` is dame:

```text
    1 2 3 4 5 6 7 8 9
  1 b b b b X O w w w
  2 b b b b X O w w w
  3 b b b b X O w w w
  4 b b b b X O w w w
  5 b b b b X O w w w
  6 b b b b X O w w w
  7 b b b X d O w w w
  8 b b b X d O w w w
  9 b b b X d O w w w
```

Count: Black has 33 points of territory, White has 27, and 3 points are dame. During the game, Black captured 1 White stone and White captured 2 Black stones. The dead White stone becomes one more Black prisoner and the dead Black stone becomes one more White prisoner. The point under a dead stone counts as territory (it is already included in the 33 and 27).

| | Black | White |
|---|---|---|
| Territory | 33 | 27 |
| Prisoners (captured in play + dead stones) | 1 + 1 = 2 | 2 + 1 = 3 |
| Komi | 0 | 6.5 |
| **Total** | **35** | **36.5** |

White wins by 1.5 points.

> ⚠️ **Gotcha.** Under Japanese scoring, playing a stone inside your own territory costs you a point (it covers a territory point and captures nothing). That is why good players stop playing inside their own area rather than "making it safe" for no reason.

## Komi: paying for the first move

Black moves first, and the first move is worth something. To make the game fair, White gets a bonus called **komi** ("compensation") added to White's score. Modern Japanese professional games use **6.5 points** (the Nihon Ki-in, the Japanese Go association, moved from 5.5 to 6.5 in 2002). The half point also guarantees there are no draws, since scores are whole numbers.

When playing an even game on a 9x9 board, use the same 6.5. If you play with a handicap (Black gets stones placed in advance), komi is normally reduced to almost nothing.

## Chinese area scoring: stones plus territory

The other common method is **area scoring**, used under Chinese rules. You count the stones you have on the board, plus the empty points you surround. Prisoners do not matter. **Score = stones on the board + territory.** Komi is 7.5 in area-scoring games (the American Go Association, which uses area-style counting, also uses 7.5).

On the same finished board, with the dead stones removed:

| | Black | White |
|---|---|---|
| Stones on the board | 9 | 9 |
| Territory | 33 | 27 |
| Komi | 0 | 7.5 |
| **Total** | **42** | **43.5** |

White wins by 1.5 points again. Same winner, same margin.

> 💡 **Key point.** The two methods count the same territory, but area scoring adds the stones on the board while territory scoring adds prisoners. A stone played inside your own area costs nothing under area scoring (the point still counts as yours) but costs a point under territory scoring.

### Why they almost always agree

Compare the two scores for Black: area = stones on board + territory, territory = prisoners + territory. The stones on the board equal the stones Black played minus the stones Black lost (captured or dead), and the prisoners are the stones White lost. Work through the subtraction for both players and everything cancels except one term: **the margin of the area score exceeds the margin of the territory score by the difference in stones played.** Black plays first, so Black has usually played one more stone than White (12 against 11 in the example). That is exactly the one point the extra komi pays for: 7.5 instead of 6.5.

So the two methods give the same winner and the same margin whenever Black has played one more stone than White. If the two sides have played equal numbers, the area score can come out one point different, which can flip the winner only in a game decided by half a point. A seki with eyes inside it is a rare special case where the two methods also differ. For ordinary games, learning one method teaches you the other.

### Superko variants

Area-scoring rule sets handle repeated positions differently from the Japanese "no result". They ban any move that recreates an earlier whole-board position. Variants differ in detail:

- **Positional superko:** you may not recreate any earlier board arrangement, regardless of whose turn it was (the Tromp-Taylor rules use this form).
- **Situational superko:** you may not recreate an earlier arrangement with the same player to move (the AGA rules use this form).

## Check yourself

```quiz
[
  {
    "q": "Under Japanese territory scoring, which of these counts toward your score?",
    "choices": ["Your stones on the board plus your territory", "Your territory plus the prisoners you hold", "Only your prisoners"],
    "answer": 1,
    "explain": "Japanese scoring is territory plus prisoners. Stones left on the board do not count."
  },
  {
    "q": "What are dame?",
    "choices": ["Empty points touching both colors that count for nobody", "Stones captured at the end", "The komi points"],
    "answer": 0,
    "explain": "Dame are neutral points. They are not territory for either player."
  },
  {
    "q": "A Japanese-rules game ends with Black on 35 points and White on 30 points before komi. Komi is 6.5. Who wins, and by how much?",
    "choices": ["Black wins by 5", "White wins by 1.5", "White wins by 6.5", "The game is a draw"],
    "answer": 1,
    "explain": "White's total is 30 + 6.5 = 36.5. Black has 35. White wins by 1.5."
  }
]
```

## Recap

1. The game ends when both players pass in a row; then dead stones are agreed (or play resumes if you disagree).
2. Japanese score = territory + prisoners; dame count for nobody; stones on the board do not count.
3. Komi compensates White for Black's first move: 6.5 in modern Japanese games, with the half point ruling out draws.
4. Area scoring counts stones on the board plus territory, with komi 7.5.
5. The methods agree because the difference between them equals the difference in stones played, which one extra komi point absorbs.
6. Area-scoring rule sets use a superko rule that bans repeating any earlier whole-board position.

Next up, [Opening, Shape, and Tesuji](05-opening-shape-and-tesuji.md): where to play first, and how to win fights with tactics.
