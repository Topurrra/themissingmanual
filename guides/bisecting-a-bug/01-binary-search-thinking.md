---
title: "Binary-Search Thinking — Halving the Haystack"
guide: "bisecting-a-bug"
phase: 1
summary: "When something worked before and is broken now, you don't test suspects one by one — you test the midpoint, throw away the half you just cleared, and repeat; doubling the haystack adds only one more check, so a thousand commits take about ten."
tags: [binary-search, debugging, regression, mental-model, bisect]
difficulty: intermediate
synonyms: ["what is binary search debugging", "why is bisecting fast", "how to narrow down a bug", "halving to find a bug", "known good known bad test"]
updated: 2026-06-19
---

# Binary-Search Thinking — Halving the Haystack

Picture the moment. A feature that shipped fine is now broken, and you've got a range of changes to blame
— maybe a hundred commits since the last release, maybe a thousand. The instinct is to start at one end
and walk: check this change, nope; check the next, nope; the next… It feels like progress because you're
*doing something*. But if the culprit is in the middle of a thousand commits, that walk is five hundred
checks of pure tedium.

Here's the secret this whole guide rests on: **you don't have to walk the range — you can halve it.** And
once you see why halving wins, you'll never go back to walking.

## The idea: test the middle, throw away half

**What it actually is.** Binary search is a way of finding one item in an ordered range by always testing
the *midpoint* and using the answer to discard half of what's left. It's the same move you make flipping
to the middle of a dictionary: the word's not on this page, but now you know it's in the *first* half or
the *second* half, and you've eliminated the other half in a single look.

**Why the slow way feels right but isn't.** Walking the range one step at a time (a *linear* search) treats
every suspect as equally likely and checks them in order. It's simple, and that's its only virtue. The
cost grows in lockstep with the haystack: twice as many commits means twice as many checks. Halving
breaks that link entirely.

**What it does in real life.** Each test you run cleanly splits the remaining suspects into "before this
point, where it still worked" and "after this point, where it's broken." You keep only the half the bug
must be hiding in, find *its* midpoint, and test again. The range collapses fast:

```text
  1000 commits, all suspect. "good" is the oldest, "bad" is the newest.
  Test the midpoint each time; keep only the half that still contains the break.

  step 1:  [################ 1000 ################]   test middle ──► good? bad?
  step 2:  [###### 500 ######]                        keep the half with the break
  step 3:        [### 250 ###]
  step 4:           [# 125 #]
  step 5..10:          63 ► 32 ► 16 ► 8 ► 4 ► 2 ► 1   ◄── the first bad commit
```

*What just happened:* Every test cut the suspects roughly in half, so after about ten tests a thousand
candidates collapsed to one. That "about ten" is no accident — halving a thousand ten times gets you to
one (because 2 to the 10th power is 1024). The shape of the win is the important part: **when the haystack
doubles, you pay just one more test.** Two thousand commits? About eleven. A million? About twenty. Linear
search would charge you a million.

💡 **Key point.** Linear cost grows *with* the haystack; halving cost grows with how many times you can
*double* to reach it. That gap is small for tiny ranges and enormous for big ones — which is exactly why
this feels like magic the first time a 900-commit regression falls in nine tries.

## The three things you need

Halving only works when the problem has a particular shape. Before you reach for any tool, make sure you
have all three of these — if one is missing, fix that first.

**1. A known-good point.** Somewhere the thing demonstrably *worked* — a commit, a release tag, a config
you trust, a date. You're not guessing this; you've seen it work or can check that it does. This is one
end of your range.

**2. A known-bad point.** Somewhere it's demonstrably *broken* — usually "right now." This is the other
end. The bug was introduced *somewhere between good and bad*, and that span is your haystack.

**3. A reliable yes/no test.** At any point in between, you must be able to answer one question with
confidence: **"Is the bug present here — yes or no?"** That's the whole engine. Each answer is what lets
you throw away a half. It can be running the app and clicking the broken button, running one failing
test, or eyeballing an output — but it has to give the *same* answer every time you ask it at the same
point.

```text
  good ●────────────────────────────────────────────● bad
   (it worked here)                          (it's broken here)
                         ▲
                   somewhere in this span, one change flipped good → bad.
                   a yes/no test at any point tells you which side it's on.
```

⚠️ **Gotcha — the test has to be trustworthy.** Every halving step *bets the whole rest of the search* on
one yes/no answer. If that answer is wrong even once — because the bug only shows up sometimes, or your
test is checking the wrong thing — you'll discard the half that actually contained the culprit and hunt
forever in the wrong place. A shaky test doesn't just slow a bisect down; it sends it confidently to the
wrong answer. We come back to this hard in [Phase 3](03-bisecting-beyond-git.md), because it's the single
most common way bisecting goes bad.

**Why this saves you later.** Once you can spot the "worked before / broken now" shape, you stop dreading
regressions. A scary "something in the last 300 commits broke checkout" turns into a calm, finite
procedure: nine or so tests and you have the exact change to read. The next phase hands that procedure to
a tool that picks the midpoints, checks out the code, and does the bookkeeping for you.

## Recap

1. **Don't walk the range — halve it.** Test the midpoint and throw away the half the bug can't be in.
2. **Doubling the haystack adds one test**, not double the tests — that's why a thousand commits take
   about ten checks, not a thousand.
3. You need exactly three things: a **known-good point**, a **known-bad point**, and a **reliable yes/no
   test** for "is the bug here?"
4. The yes/no test is the engine — and it has to give the **same answer every time**, or the whole search
   goes wrong.

---

[← Guide overview](_guide.md) · [Phase 2: git bisect →](02-git-bisect.md)
