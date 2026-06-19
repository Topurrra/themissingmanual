---
title: "Bisecting Beyond Git — The Method Is Everywhere"
guide: "bisecting-a-bug"
phase: 3
summary: "The halving idea isn't about commits — it's about any 'worked before / broken now' problem: which config line, which input row, which dependency, or which block of code is the culprit, all found by clearing half at a time; the one rule is that your yes/no test must be reliable, never flaky."
tags: [debugging, binary-search, bisect, config, dependencies, flaky-tests, isolation]
difficulty: intermediate
synonyms: ["binary search debugging without git", "which config line breaks it", "which input row causes the bug", "which dependency broke the build", "comment out half to find the bug", "isolate a bug by halving"]
updated: 2026-06-19
---

# Bisecting Beyond Git — The Method Is Everywhere

`git bisect` is the famous one, but it's only a special case. The real prize from [Phase 1](01-binary-search-thinking.md)
is the *thinking*: the moment any problem has the shape "this worked, now it doesn't, and the cause is
hiding somewhere in here," you can halve the haystack instead of walking it. Git happens to have built a
tool for the commit-history version. The method itself is yours to use anywhere.

Once you start seeing it, you'll spot the shape constantly — in a config file that won't load, a data
import that crashes on one row, a dependency upgrade that broke the build, a function that misbehaves with
no obvious culprit. Same move every time: cut it in half, test, keep the broken half, repeat.

## The config file that won't load

Your app booted fine yesterday. You edited a 200-line config, and now it refuses to start with a vague
parse error pointing nowhere useful. Reading all 200 lines for the typo is the walk. Halve instead:
comment out the bottom half and try to start.
```console
$ ./app --check-config
Config OK
```
*What just happened:* With the bottom 100 lines disabled, the config is valid — so the bad line is in the
*bottom* half you removed (the top half is now proven good). You've cleared 100 lines in one test. Restore
the bottom half, comment out the bottom *quarter* instead, and test again. Each step halves what's left,
so a 200-line file gives up its bad line in about eight tries instead of a line-by-line read.

The known-good here is "the file before today's edits"; the known-bad is "the file now"; the yes/no test
is `--check-config`. Same three ingredients as Phase 1 — just applied to lines, not commits.

## The input row that crashes the import

A nightly job imports a 50,000-row CSV and one row makes it blow up — but the error doesn't say which.
Don't scroll. Feed it the first half and see if it still crashes.
```console
$ head -n 25000 data.csv | ./import
Error: malformed record
```
*What just happened:* The crash reproduced on the first 25,000 rows, so the bad row is in *that* half —
the second half is cleared. Now run the import on the first 12,500 and narrow again. Roughly sixteen tests
walks 50,000 rows down to the single offending record (halving 50,000 to one takes about sixteen steps,
since 2 to the 16th passes 50,000). Beats reading a spreadsheet with fifty thousand rows.

## The dependency upgrade that broke the build

You ran a bulk upgrade and now the build fails — but you bumped thirty packages at once, so "which one?"
is a real mystery. Revert *half* the upgrades, rebuild, and read the answer.
```console
$ npm run build
Build succeeded
```
*What just happened:* With half the packages rolled back to their old versions, the build is green — so
the culprit is among the *half you reverted*. Re-apply a quarter of them, build again, and keep halving
the set of upgraded packages until one is left. The known-good is "all old versions," the known-bad is
"all new versions," and "does it build?" is your yes/no test.

💡 **Key point — bisect the change, not the whole world.** Every example here works because there's a
clean "before" (known-good) and "after" (known-bad) with the culprit in between. When you're stuck, the
first useful question is almost always: *where did this last work, and what's the smallest set of changes
since then?* That set is your haystack, and halving shrinks it fast.

## Even inside one function: comment out half

The method scales all the way down. A function returns wrong results and you can't see why? Comment out
half its body (stubbing whatever the second half needed), run your test, and see which half the wrongness
lives in. It's crude, but it's the same binary search — and on a hairy 80-line function it finds the bad
block far faster than staring.

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

Here's the warning from Phase 1, now that you've seen the method in full — because it matters more the
wider you apply it. **Bisecting is only as trustworthy as your yes/no test.** Every halving step bets the
entire remaining search on one answer. Get one answer wrong and you discard the half that *held the
culprit*, then hunt confidently through a half that never had it. You won't get a wrong answer at the
end — you'll get a *plausible* wrong answer, which is worse.

⚠️ **Gotcha — a flaky test will send your bisect to the wrong place.** A *flaky* test is one that
sometimes passes and sometimes fails on the **exact same code**, with nothing changed. Bisect *demands*
the opposite: the same point must give the same verdict every single time. If your test is flaky — a race
condition, a timing dependency, a random seed, leftover state from a previous run — then "good" and "bad"
stop meaning anything, and `git bisect run` will march to a confidently false culprit without blinking.

📝 **Terminology.** *Flaky* (also "intermittent" or "non-deterministic") describes a test whose result
isn't fully determined by the code under test — it depends on something uncontrolled, so it can flip
without any change. Flakiness is the natural enemy of binary search.

**Before you bisect anything, make the test reliable first.** This is exactly the discipline of
[How to Reproduce a Bug](/guides/how-to-reproduce-a-bug): pin down a set of steps (or a command) that
produce the bug *every time*, removing the randomness, the leftover state, the "works on the third try."
A solid, repeatable reproduction *is* the reliable yes/no test that bisecting runs on. Get that first;
then halving will take you straight to the cause.

**Why this saves you later.** The biggest wins from this method aren't in Git at all — they're the
moments you turn "I have no idea what broke this" into a short, finite hunt over the right haystack. And
the failure you'll now avoid is the sneaky one: trusting a bisect that was built on a flaky test, fixing
the "culprit" it named, and finding the bug still there. Reliable test first, then halve with confidence.

## Recap

1. The halving method isn't about commits — it fits **any** "worked before / broken now" problem:
   config lines, input rows, dependency sets, blocks of code.
2. The move is always the same: **test the middle, keep the broken half, repeat** — clearing half the
   haystack per test.
3. Find your **known-good**, your **known-bad**, and the **smallest set of changes** between them; that
   set is what you halve.
4. Bisecting is only as good as its **yes/no test** — one wrong answer routes the whole search to a
   plausible-but-wrong culprit.
5. **A flaky test ruins a bisect.** Make the bug reproduce reliably *first*
   ([How to Reproduce a Bug](/guides/how-to-reproduce-a-bug)), then halve.

---

[← Phase 2: git bisect](02-git-bisect.md) · [Guide overview](_guide.md)

**Related guides:** [How to Reproduce a Bug](/guides/how-to-reproduce-a-bug) · [Git Disaster Recovery](/guides/git-disaster-recovery)
