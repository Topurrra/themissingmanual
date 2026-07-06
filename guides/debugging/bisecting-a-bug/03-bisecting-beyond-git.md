---
title: "Bisecting Beyond Git - The Method Is Everywhere"
guide: "bisecting-a-bug"
phase: 3
summary: "The halving idea isn't about commits - it's about any 'worked before / broken now' problem: which config line, which input row, which dependency, or which block of code is the culprit, all found by clearing half at a time; the one rule is that your yes/no test must be reliable, never flaky."
tags: [debugging, binary-search, bisect, config, dependencies, flaky-tests, isolation]
difficulty: intermediate
synonyms: ["binary search debugging without git", "which config line breaks it", "which input row causes the bug", "which dependency broke the build", "comment out half to find the bug", "isolate a bug by halving"]
updated: 2026-06-19
---

# Bisecting Beyond Git - The Method Is Everywhere

`git bisect` is the famous one, but it's only a special case. The real prize from
[Phase 1](01-binary-search-thinking.md) is the *thinking*: any problem shaped "this worked, now it
doesn't, and the cause is hiding somewhere in here" can be halved instead of walked. Git just built a tool
for the commit-history version - the method works anywhere: a config file that won't load, a data import
crashing on one row, a broken dependency upgrade, a misbehaving function with no obvious culprit. Same
move every time - cut in half, test, keep the broken half, repeat.

## The config file that won't load

Your app booted fine yesterday. You edited a 200-line config, and now it won't start, with a vague parse
error pointing nowhere useful. Reading all 200 lines is the walk - halve instead: comment out the bottom
half and try to start.
```console
$ ./app --check-config
Config OK
```
*What just happened:* With the bottom 100 lines disabled, the config is valid - the bad line is in the
*bottom* half you removed. Restore it, comment out the bottom *quarter*, test again. Each step halves
what's left, so 200 lines give up the bad one in about eight tries, not a line-by-line read - same three
Phase 1 ingredients, applied to lines instead of commits.

## The input row that crashes the import

A nightly job imports a 50,000-row CSV and one row blows it up, but the error doesn't say which. Don't
scroll: feed it the first half and see if it still crashes.
```console
$ head -n 25000 data.csv | ./import
Error: malformed record
```
*What just happened:* The crash reproduced on the first 25,000 rows, so the bad row is in *that* half.
Try the first 12,500 next, keep narrowing - roughly sixteen tests gets 50,000 rows down to the offending
record (2 to the 16th passes 50,000).

## The dependency upgrade that broke the build

You bumped thirty packages at once and the build now fails - "which one?" is a real mystery. Revert
*half* the upgrades and rebuild.
```console
$ npm run build
Build succeeded
```
*What just happened:* With half the packages rolled back, the build is green - the culprit is among the
*half you reverted*. Re-apply a quarter, rebuild, keep halving until one package is left. Known-good "all
old versions," known-bad "all new," yes/no test "does it build?"

💡 **Key point - bisect the change, not the whole world.** Every example works because there's a clean
"before" and "after" with the culprit in between. When stuck, ask: *where did this last work, and what's
the smallest set of changes since then?* That set is your haystack.

## Even inside one function: comment out half

The method scales all the way down. A function returns wrong results and you can't see why? Comment out
half its body (stubbing whatever the other half needed), run your test, see which half the wrongness
lives in. Crude, but it's the same binary search - finds the bad block in a hairy 80-line function faster
than staring.

```text
  The shape never changes, only the haystack:

   git bisect      ── halve a range of COMMITS
   config bisect   ── halve the LINES of a file
   data bisect     ── halve the ROWS of an input
   dependency      ── halve the SET of changed packages
   code bisect     ── halve the LINES of a function

   one move:  test the middle ► keep the broken half ► repeat
```

## The one thing that ruins every bisect

The Phase 1 warning again, and it matters more the wider you apply the method: **bisecting is only as
trustworthy as your yes/no test.** Every halving step bets the entire remaining search on one answer. Get
one wrong and you discard the half that *held the culprit*, hunting confidently through the wrong half -
a *plausible* wrong answer, worse than an obviously wrong one.

⚠️ **Gotcha - a flaky test will send your bisect to the wrong place.** A *flaky* test sometimes passes and
sometimes fails on the **exact same code**, nothing changed - but bisect demands the same verdict every
time at the same point. A race condition, timing dependency, random seed, or leftover state makes "good"
and "bad" meaningless, and `git bisect run` marches to a false culprit without blinking.

📝 **Terminology.** *Flaky* (or "intermittent," "non-deterministic") describes a test not fully determined
by the code under test, so it can flip with nothing changed - the natural enemy of binary search.

**Make the test reliable first.** This is the discipline of
[How to Reproduce a Bug](/guides/how-to-reproduce-a-bug): pin down steps that reproduce the bug *every
time*, removing the randomness, the leftover state, the "works on the third try." That reproduction *is*
the reliable yes/no test bisecting runs on.

**Why this saves you later.** The biggest wins here aren't in Git at all - turning "I have no idea what
broke this" into a short, finite hunt. Avoid the sneaky failure: trusting a bisect built on a flaky test,
fixing the named "culprit," and finding the bug still there.

## Recap

1. The halving method isn't about commits - it fits **any** "worked before / broken now" problem:
   config lines, input rows, dependency sets, blocks of code.
2. The move is always the same: **test the middle, keep the broken half, repeat** - clearing half the
   haystack per test.
3. Find your **known-good**, your **known-bad**, and the **smallest set of changes** between them; that
   set is what you halve.
4. Bisecting is only as good as its **yes/no test** - one wrong answer routes the whole search to a
   plausible-but-wrong culprit.
5. **A flaky test ruins a bisect.** Make the bug reproduce reliably *first*
   ([How to Reproduce a Bug](/guides/how-to-reproduce-a-bug)), then halve.

---

[← Phase 2: git bisect](02-git-bisect.md) · [Guide overview](_guide.md)

**Related guides:** [How to Reproduce a Bug](/guides/how-to-reproduce-a-bug) · [Git Disaster Recovery](/guides/git-disaster-recovery)
