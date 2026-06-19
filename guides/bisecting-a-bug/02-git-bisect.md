---
title: "git bisect — Letting Git Drive the Search"
guide: "bisecting-a-bug"
phase: 2
summary: "Tell Git one known-good commit and one known-bad commit; it checks out the midpoint, you test and mark it good or bad, and after about ten rounds it names the exact first bad commit — then git bisect reset puts you back, and git bisect run automates the whole loop."
tags: [git, bisect, debugging, regression, git-bisect-run, automation]
difficulty: intermediate
synonyms: ["how to use git bisect", "git bisect example", "git bisect good bad", "git bisect first bad commit", "git bisect run script", "git bisect reset"]
updated: 2026-06-19
---

# git bisect — Letting Git Drive the Search

You've got the mental model from [Phase 1](01-binary-search-thinking.md): halve the range, test the
midpoint, keep the half with the break. Doing that by hand across commits would mean checking out a
commit, testing, doing the arithmetic to find the next midpoint, checking *that* out, and never losing
track of which halves you've cleared. That's a lot of fiddly bookkeeping, and it's exactly the part Git
will do for you.

`git bisect` is the binary search of Phase 1, built into Git. You supply the two ends and answer "good or
bad?" at each step; Git picks the midpoints, checks out the code, and tells you when it's found the
culprit.

## What git bisect actually is

**What it actually is.** A guided session where Git walks you through a binary search over your commit
history. You start it, hand it a known-bad commit and a known-good commit, and from then on Git keeps
checking out the midpoint of the *remaining* suspect range and asking you to judge it. Each judgment lets
it discard half the commits, until one commit is left — the first one where things went bad.

**What it does in real life.** While a bisect is running, Git physically *moves your working tree* to each
commit it wants tested, so the code on disk is that commit's code. You run your test against it, type
`git bisect good` or `git bisect bad`, and Git jumps you to the next one to try. It's keeping the
bookkeeping (which commits are still in play) so you only ever have to answer one question at a time.

📝 **Terminology.** *First bad commit* is what bisect hunts for: the earliest commit where the bug is
present. Every commit before it is good; it and everything after are bad. That single commit is the change
that introduced the bug — the thing you actually want to read.

## A full bisect session, start to finish

Let's say checkout is broken on `main` today, but you know it worked at the `v2.3.0` release tag. That's
your known-good; `HEAD` (right now) is your known-bad. Here's the whole session.

**Start the bisect and mark the two ends.**
```console
$ git bisect start
$ git bisect bad                 # current commit (HEAD) is broken
$ git bisect good v2.3.0         # this tag is known to work
Bisecting: 214 revisions left to test after this (roughly 8 steps)
[a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0] Refactor cart pricing
```
*What just happened:* You told Git the broken end (`bad`) and the working end (`good`), and it immediately
did the Phase 1 math: there are 214 commits between them, so it'll take roughly 8 tests. Then it checked
out the *midpoint* commit (`a1b2c3d…`, "Refactor cart pricing") and dropped your working tree onto it.
Your files are now that commit's version of the code, waiting for you to test.

**Test the checked-out commit, then tell Git the verdict.** Run whatever your reliable yes/no test is —
here, try a checkout in the app:
```console
$ npm test -- checkout
... 1 passing
$ git bisect good
Bisecting: 106 revisions left to test after this (roughly 7 steps)
[f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0] Add promo-code validation
```
*What just happened:* The test passed, so the bug isn't here yet — you marked it `good`. Git threw away
this commit and everything older than it (all still-working), halving the range from 214 to 106, and
checked out the new midpoint for you. Notice you did nothing but answer the question; Git moved the code.

**Keep answering until Git narrows it down.** Each round, test what's checked out and mark it:
```console
$ npm test -- checkout
... 1 failing
$ git bisect bad
Bisecting: 52 revisions left to test after this (roughly 6 steps)
[c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3] Tidy currency formatting
```
*What just happened:* This time the test *failed*, so the bug is present here — you marked it `bad`. Git
discarded this commit and everything *newer* (all broken) and kept the older half, where the good→bad flip
must be. The range halved again, 106 to 52. You're a few rounds from the answer.

**Git names the first bad commit.** After the last round, Git announces the culprit:
```console
$ npm test -- checkout
... 1 failing
$ git bisect bad
3f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a is the first bad commit
commit 3f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a
Author: Dana Lee <dana@acme.dev>
Date:   Tue Jun 3 14:22:10 2026 -0400

    Switch cart total to integer cents

 src/cart/total.js | 18 ++++++++---------
 1 file changed, 9 insertions(+), 9 deletions(-)
```
*What just happened:* The range collapsed to one commit, and Git declared it the **first bad commit** —
the earliest point where your test fails. It printed the full commit: author, date, message, and the files
it touched. You now know *exactly* which change to read, who wrote it, and what it modified. The mystery
"something broke checkout" is now "this 18-line change to `total.js` broke checkout."

**Clean up — this part is mandatory.** Your working tree is still parked on some commit Git checked out
mid-search. Put yourself back where you started:
```console
$ git bisect reset
Previous HEAD position was 3f0a1b2 Switch cart total to integer cents
Switched to branch 'main'
```
*What just happened:* `git bisect reset` ended the session and returned your working tree to the branch
and commit you were on before you ran `git bisect start`. Without this, you'd be left in a detached state
on an old commit, which is a confusing place to start editing.

⚠️ **Gotcha — don't forget `git bisect reset`.** A bisect leaves you on a checked-out historical commit
with a "detached HEAD." If you forget to reset and start fixing the bug right there, your fix lands
detached from any branch and is easy to lose. Always `reset` first, *then* fix on a real branch. (If you
already made commits in a detached state and panicked, [Git Disaster Recovery](/guides/git-disaster-recovery)
walks you back.)

💡 **Key point.** If you mark a commit wrong by mistake, you don't have to start over — `git bisect log`
shows every verdict so far, and `git bisect replay` plus editing can redo it. Simpler: if you realize the
*last* answer was wrong, `git bisect reset` and start fresh — eight tests is cheap.

## Skip a commit you can't test

Sometimes the midpoint Git lands on can't even be tested — it doesn't build, or it's broken for an
unrelated reason, so your yes/no test can't give an honest answer. Don't guess. Tell Git to set it aside:
```console
$ git bisect skip
Bisecting: 52 revisions left to test after this (roughly 6 steps)
[b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1] Bump build tooling
```
*What just happened:* `git bisect skip` told Git "I can't judge this one," so it picked a *nearby*
commit to test instead and kept going. Skip when a commit is genuinely untestable — never use it to dodge
a verdict you're just unsure about, because a guess corrupts the search (Phase 1's warning).

## Let Git run the whole thing: `git bisect run`

If your yes/no test is a command — a test suite, a script, anything that exits `0` for good and non-zero
for bad — you don't have to sit there answering each round. Hand the command to `git bisect run` and Git
drives the entire search itself:
```console
$ git bisect start
$ git bisect bad
$ git bisect good v2.3.0
$ git bisect run npm test -- checkout
running 'npm test' '--' 'checkout'
... (Git checks out a commit, runs the command, reads the exit code, repeats) ...
3f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a is the first bad commit
bisect run success
```
*What just happened:* For each midpoint, Git checked out the commit, ran `npm test -- checkout`, and read
the exit code as your verdict — exit `0` meant `good`, non-zero meant `bad`. It looped through all ~8
rounds with no input from you and printed the first bad commit at the end. This is bisect at its best:
write the test once, get the culprit hands-free.

📝 **Terminology.** *Exit code* (or *exit status*) is the number a command returns when it finishes; by
convention `0` means success and anything else means failure. `git bisect run` reads that number as the
good/bad answer, which is why your test command must exit `0` only when the bug is *absent*. (One special
case: exit code `125` tells `run` the commit is untestable, same as a manual `skip`.)

**Why this saves you later.** A `git bisect run` one-liner turns "spend an afternoon hunting the
regression" into "write one test, walk away, come back to the exact commit." Even the manual version pays
for itself the first time it cracks a 200-commit mystery in eight clicks. And the cleanup discipline —
always `git bisect reset` before you fix — keeps the rescue from creating a new mess.

## Recap

1. **`git bisect start`**, then **`git bisect bad`** (broken end) and **`git bisect good <commit>`**
   (working end) — Git checks out the midpoint for you.
2. **Test what's checked out**, then mark it **`git bisect good`** or **`git bisect bad`**; Git halves the
   range and hands you the next midpoint.
3. Git announces the **first bad commit** with its full message and changed files — the change to read.
4. **`git bisect reset`** when done, *always* — it returns you from the detached commit to your branch.
5. **`git bisect skip`** an untestable commit; never guess a verdict.
6. **`git bisect run <command>`** automates the whole loop using the command's exit code (`0` = good).

---

[← Phase 1: Binary-Search Thinking](01-binary-search-thinking.md) · [Guide overview](_guide.md) · [Phase 3: Bisecting Beyond Git →](03-bisecting-beyond-git.md)
