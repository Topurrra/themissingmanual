---
title: "The Reflog - Your Safety Net"
guide: "git-disaster-recovery"
phase: 1
summary: "The reflog is Git's private diary of everywhere HEAD has been; with it you can recover commits a bad reset --hard threw away, find work from a detached HEAD, and restore a deleted branch."
tags: [git, reflog, recovery, reset, lost-commits, deleted-branch]
difficulty: advanced
synonyms: ["git reflog explained", "recover after git reset hard", "recover deleted branch", "i lost commits in git", "find lost git commits", "undo reset hard"]
updated: 2026-06-18
---

# The Reflog - Your Safety Net

If you only ever learn one recovery tool in Git, make it this one. The **reflog** is the difference between
"I lost a day of work" and "I lost ninety seconds." It's also the thing that proves the promise from the
overview - that your commits are almost never truly gone - so we lead with it, because once you've used it,
every other rescue in this guide feels safe to try.

## The recovery cheat-card

> **Lost something? Find it here, breathe, then read the section. The reflog has your back.**

| "Oh no…" | The calm fix |
|---|---|
| `git reset --hard` threw away commits I wanted | `git reflog`, find the commit, `git reset --hard <hash>` (§3) |
| I made commits on a detached HEAD and they "vanished" | `git reflog`, find them, `git branch <name> <hash>` (§4) |
| I deleted a branch that wasn't merged | Use the hash from the delete message: `git switch -c <name> <hash>` (§5) |
| I have no idea what I just did, but it's bad | `git reflog` first - it shows your last moves so you can step back (§2) |

---

## What the reflog actually is

**What it actually is.** Every time `HEAD` moves - every commit, checkout, switch, reset, merge, rebase -
Git scribbles a line in a private diary called the **reflog** ("reference log"): *where HEAD was, and what
moved it.* It's local to your machine, it's not shared, and it records moves that aren't part of any
branch's visible history.

**Why this is the whole game.** When you "lose" a commit, what really happened is that a label (a branch,
or HEAD) stopped pointing at it, so it fell out of `git log`. But the commit object is still in the
repository - and the reflog still remembers the hash it used to be at. The reflog is the map back to
commits that `git log` can no longer see.

```mermaid
flowchart LR
  C1 --> C2 --> C3
  main(main) -.->|reset moved it back| C2
  reflog(reflog) -.->|still has its hash| C3
  C3 -.- note["'lost': no label, so git log hides it - not gone, just unlabeled"]
```

📝 **Terminology.** *Reachable* means "you can get to this commit by following labels and parent pointers."
`git log` shows reachable commits. The reflog can reach commits that nothing else can - which is exactly
why it rescues you.

## 2. Reading the reflog

Run it any time you're disoriented - it's read-only and changes nothing:
```console
$ git reflog
9a1b2c3 (HEAD -> main) HEAD@{0}: reset: moving to HEAD~2
e5f6a7b HEAD@{1}: commit: Add checkout validation
4d3c2b1 HEAD@{2}: commit: Wire up promo codes
9a1b2c3 HEAD@{3}: checkout: moving from feature/x to main
```
*What just happened:* Each line is one move of HEAD, newest at the top. `HEAD@{0}` is where you are now;
`HEAD@{1}` is where you were one move ago, and so on. Read the right-hand text - `reset: moving to...`,
`commit: ...`, `checkout: ...` - and you can literally see your own recent history of actions, each tied to
the commit hash HEAD sat on at the time. Those hashes are your handholds back.

💡 **Key point.** `HEAD@{1}` means "wherever HEAD was 1 move ago." So `git reset --hard HEAD@{1}` often
means "put me back to right before my last action" - the universal undo for "I just did something bad."

## 3. Recover from a `git reset --hard` that went too far

The classic disaster. You meant to undo one commit and fat-fingered three - `--hard`, so the changes are
gone from your files and `git log` no longer shows them:
```console
$ git reset --hard HEAD~3
HEAD is now at 9a1b2c3 Older work
$ git log --oneline -1
9a1b2c3 Older work          # the three newer commits are nowhere in sight
```
Don't touch anything else. Open the reflog and find the commit you were on *before* the reset:
```console
$ git reflog
9a1b2c3 (HEAD -> main) HEAD@{0}: reset: moving to HEAD~3
1a2b3c4 HEAD@{1}: commit: The work I just nuked
...
$ git reset --hard 1a2b3c4
HEAD is now at 1a2b3c4 The work I just nuked
```
*What just happened:* The reflog showed that one move ago (`HEAD@{1}`), `main` pointed at `1a2b3c4` - the
tip of the work you thought you destroyed. `git reset --hard 1a2b3c4` slid `main` back onto it, and your
files came right back with it. The commits were never deleted; the label had just moved off them, and you
moved it back.

⚠️ **Gotcha.** Do the recovery *promptly* and avoid piling on new actions first. Unreachable commits aren't
kept forever - Git's garbage collection eventually prunes them (the default grace period is generous, about
90 days for reachable-from-reflog commits, but don't gamble on it). The reflog itself is also per-machine
and per-clone: it can't rescue something that only ever happened on a teammate's computer.

## 4. Recover commits made on a detached HEAD

Sometimes you check out a specific commit to look around (a "detached HEAD" - HEAD pointing straight at a
commit instead of a branch), make a couple of commits, then switch away. Because no branch label was
following you, those commits become unreachable the moment you leave:
```console
$ git switch main
Warning: you are leaving 2 commits behind, not connected to any of your branches:
  7f8e9d0 Experimental fix
  6e7d8c9 Try another approach
```
Git even warns you and prints the hashes - but if you missed it, the reflog still has them:
```console
$ git reflog
... HEAD@{1}: commit: Experimental fix     (7f8e9d0)
$ git branch rescued-work 7f8e9d0
```
*What just happened:* `git branch rescued-work 7f8e9d0` dropped a brand-new label on that orphaned commit,
making it reachable again - it now shows up in `git log` and is safe. (Creating the label is the fix:
unreachable commits become safe the instant something points at them.)

## 5. Restore a branch you deleted

You deleted a branch that turned out to still have unmerged work on it:
```console
$ git branch -D feature/checkout-redo
Deleted branch feature/checkout-redo (was 3c4d5e6).
```
**Look at that output:** Git printed the tip commit's hash - `(was 3c4d5e6)`. That's all you need to bring
the branch back:
```console
$ git switch -c feature/checkout-redo 3c4d5e6
Switched to a new branch 'feature/checkout-redo'
```
*What just happened:* You recreated the branch label on its old tip commit, restoring the branch exactly as
it was - every commit on it is reachable again. (Scrolled past the delete message? `git reflog` still lists
where that branch's HEAD was; find the tip hash there instead.)

## Why this changes everything

Notice the shape of every fix in this phase: *find the hash in the reflog, then point a label at it.* The
commits were never the problem - they were sitting safe in the repository the whole time. The only thing
you ever lost was a label's aim, and labels are cheap to re-point.

That's why the reflog is the safety net under the rest of this guide. The next two phases use genuinely
sharp tools - `rebase` and rewriting pushed history - and the reason you can wield them calmly is that if
either goes wrong, you already know the way back.

## Recap

1. The **reflog** is Git's local diary of everywhere `HEAD` has been - it can reach commits `git log`
   can't.
2. **`git reflog`** is read-only; run it the instant you're disoriented and read your recent moves.
3. Recover a bad `reset --hard` with **`git reset --hard <hash>`** from the reflog.
4. Rescue detached-HEAD or orphaned commits by **putting a label on them** (`git branch <name> <hash>`).
5. Restore a deleted branch from the **`(was <hash>)`** message (or the reflog): `git switch -c <name> <hash>`.

---

[← Guide overview](_guide.md) · [Phase 2: Rebase Without Fear →](02-rebase-without-fear.md)
