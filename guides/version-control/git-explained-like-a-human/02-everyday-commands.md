---
title: "The Everyday Commands - What Each One Really Does"
guide: "git-explained-like-a-human"
phase: 2
summary: "status, add, commit, log, diff, branch, switch, merge, fetch, pull, push, and stash - what each actually does, when to reach for it, and the gotcha."
tags: [git, commands, status, add, commit, log, diff, branch, switch, merge, pull, push, stash]
difficulty: beginner
synonyms: ["what does git add do", "git commit vs push", "difference between fetch and pull", "what is git stash", "git diff staged"]
updated: 2026-07-10
---

# The Everyday Commands - What Each One Really Does

In Phase 1 you learned the five ideas: commits are snapshots, branches are sticky-note labels, HEAD is
"you are here," your work lives in three places, and the remote is another copy. Now we put them to
work - the same commands you already type, but you'll know what each one is *actually doing* to those
five things.

**In a hurry?** The cheat-card is right below. **Want it to stick?** Read the section under each
command - that's where the "what just happened" lives.

## The cheat-card

| Command | What it really does |
|---|---|
| `git status` | What's changed, what's staged, what branch you're on. Your dashboard - run it constantly. |
| `git add` | Move a file's current state into the staging area (the box for your next commit). |
| `git commit` | Save a snapshot of everything staged, with a message. A save point you can return to. |
| `git log` | The history of snapshots - who saved what, when, and why. |
| `git diff` | The exact lines that changed (working vs staged vs last commit). |
| `git branch` | List / create / delete the sticky-note labels that point at commits. |
| `git switch` / `checkout` | Move HEAD ("you are here") to another branch or commit. `switch` is the modern, safer name. |
| `git merge` | Combine another branch's commits into your current branch. |
| `git fetch` | Download the remote's new commits but DON'T touch your files. Only look. |
| `git pull` | `fetch` + `merge`: download remote commits and apply them now. |
| `git push` | Upload your commits to the remote so others get them. |
| `git stash` | Shelve uncommitted changes for a clean tree; `pop` them back later. |

---

## `git status` - your dashboard

Looks at all three places from Phase 1 - working directory, staging box, last commit - and reports how
they differ, plus your current branch. Read-only; changes nothing. Run it constantly: before you add,
before you commit, any time you're unsure what state you're in.

```console
$ git status
On branch main
Changes to be committed:
  modified:   checkout.js
Changes not staged for commit:
  modified:   cart.js
Untracked files:
  notes.txt
```
*What just happened:* All three places at once. `checkout.js` is in the staging box (goes in your next
commit). `cart.js` has edits *not* in the box yet. `notes.txt` is "untracked" - Git has never seen it and
ignores it until you `add` it.

**The gotcha.** There isn't one, and that's the point - `status` never changes anything, so run it as
often as you like. When in doubt, `git status`.

## `git add` - put changes in the box

Copies the current state of a file into the staging box - it saves nothing to history, it's packing the
box, not taping it shut. Reach for it right before committing, to choose exactly what goes in: edit ten
files, commit only three, keep unrelated changes out of the snapshot.

```console
$ git add checkout.js
$ git status
On branch main
Changes to be committed:
  modified:   checkout.js
```
*What just happened:* `checkout.js` moved into the box. Nothing is in history yet - you've only decided
what the next snapshot will include.

**The gotcha.** `add` captures the file *as it is right now*. Edit it again afterward and those new edits
aren't in the box - the file shows as both staged and not staged (you met this in Phase 1); `git add` it
again to fix that. Many people reflexively run `git add .`, which boxes up *everything* - convenient, and
also how stray files and stray debug code sneak into commits. Know what you're adding.

## `git commit` - tape the box shut

Takes everything in the staging box and turns it into a permanent snapshot, whose parent is wherever
HEAD is, then slides your branch's sticky note forward onto it (all five Phase 1 ideas in one command).
Reach for it at every meaningful checkpoint - commits are free, make them often.

```console
$ git commit -m "Fix tax rounding at checkout"
[main a1b2c3d] Fix tax rounding at checkout
 1 file changed, 3 insertions(+), 1 deletion(-)
```
*What just happened:* Git sealed the box into commit `a1b2c3d`, recorded its parent, and slid the `main`
label onto it. The summary line is Git being friendly about what changed versus the parent.

**The gotcha.** `commit` only saves what's in the box - edited a file but forgot to `add` it? It won't be
in the commit, and Git won't warn you (run `git status` first; see why it's a habit?). Also: `git commit`
with no `-m` drops you into a text editor for the message. If that's Vim and you're trapped, type `:q!`
and press Enter to escape without committing.

## `git log` - the history of snapshots

Walks backward from HEAD, following each commit's parent pointer, and lists the snapshots it finds -
how you read the chain from Phase 1. Reach for it to see what happened and when, or to find a commit's
hash to point another command at.

```console
$ git log --oneline
a1b2c3d (HEAD -> main) Fix tax rounding at checkout
9f2a1c7 Add login button
3e4f5a6 Initial commit
```
*What just happened:* Each line is a commit, newest first. `--oneline` squeezes each to its short hash
and message. `(HEAD -> main)` on the top one marks the "you are here" arrow and the `main` label, both on
the newest commit.

**The gotcha.** Plain `git log` can drop you into a full-screen pager - press `q` to quit. Two
lifesavers: `git log --oneline` for the compact view, and `git log --oneline --graph --all` to *see*
your branches drawn as a tree, the best way to make sense of a tangled history.

## `git diff` - show me the actual lines

Compares two of your three places and shows the exact line-by-line changes between them - by default,
working files against the staging box. Reach for it right before you `add` or `commit`, to review what
you're about to include.

```console
$ git diff
diff --git a/cart.js b/cart.js
@@ -14,7 +14,7 @@
-  const total = price
+  const total = price * quantity
```
*What just happened:* The change in `cart.js` that is *not yet staged*: one line removed, one added -
the diff between your working file and the box.

**The gotcha.** This confuses everyone: once you `git add` a file, plain `git diff` shows *nothing* for
it, because `diff` compares working-vs-box and `add` made them identical. Your change isn't gone, it's in
the box - use `git diff --staged` to see what's there. Remember it as: plain `diff` = "not added yet,"
`diff --staged` = "added, about to commit."

## `git branch` - manage the sticky notes

Lists, creates, or deletes branch labels. Creating one drops a new sticky note on your current commit -
it does not move you onto it. Reach for it to start a new line of work or see what branches exist.

```console
$ git branch
* main
  feature-login
$ git branch feature-cart
```
*What just happened:* The first command listed your branches (`*` marks the one you're on); the second
created `feature-cart` on your current commit. You're *still on `main`* - creating a branch doesn't move
you.

**The gotcha.** `git branch feature-cart` creates the branch but does *not* switch to it - people expect
to "be on" the new branch and start committing, then find their commits landed on `main`. To create *and*
switch in one step, use `git switch -c feature-cart` (next command).

## `git switch` (and `git checkout`) - move "you are here"

Moves HEAD onto a different branch and updates your working files to match that branch's commit.
`switch` is the modern, purpose-built command; `checkout` is the older one that also does several
unrelated jobs. Reach for it every time you change what you're working on.

```console
$ git switch -c feature-cart
Switched to a new branch 'feature-cart'
```
*What just happened:* `-c` created the `feature-cart` label and moved HEAD onto it in one step. Your next
commit slides *its* sticky note forward, leaving `main` where it was.

**The gotcha.** `checkout` is overloaded - the same command switches branches, restores files, and
detaches HEAD depending on how you call it. That's why `git checkout .` has erased people's work (it can
mean "throw away my changes"). Modern Git split those jobs: `git switch` for branches, `git restore` for
files - prefer them. Also: if uncommitted changes would be overwritten by a switch, Git blocks you -
`commit` or `stash` first (see `stash` below).

## `git merge` - combine two branches

Joins another branch's commits into your current one. If your branch hasn't moved since the other split
off, Git slides your label forward ("fast-forward"); otherwise it creates a *merge commit* with two
parents, stitching the histories together. Reach for it to bring a finished feature branch into `main`.

```console
$ git switch main
$ git merge feature-cart
Updating a1b2c3d..f6g7h8i
Fast-forward
 cart.js | 24 ++++++++++++++++++
```
*What just happened:* Because `main` hadn't moved, this was a fast-forward - Git slid `main`'s label up
to `feature-cart`'s commit. No merge commit needed; the histories were already in a straight line.

**The gotcha.** When both branches changed the *same lines*, Git can't decide which to keep and stops
with a **merge conflict**. That's not you doing something wrong - it's Git refusing to guess. Phase 3
walks through resolving one calmly.

## `git fetch` - download, but look before you leap

Downloads new commits from the remote into your local bookmark of *its* branches (like `origin/main`)
without touching your own branches or files - "show me what's out there, don't change anything." Reach
for it when you want to see what teammates pushed *before* deciding to integrate it.

```console
$ git fetch
remote: Enumerating objects: 5, done.
From github.com:acme/shop
   a1b2c3d..b2c3d4e  main -> origin/main
$ git log --oneline main..origin/main
b2c3d4e Add promo banner
```
*What just happened:* Git downloaded the new commit and updated `origin/main` - your bookmark of the
remote's `main`. Your own `main` hasn't moved. The second command lists what origin has that you don't.

**The gotcha.** `fetch` is safe because it doesn't touch your files - but that's also why people forget
they've fetched and wonder why nothing looks different. Fetching updates your *knowledge* of the remote;
merging (or pulling) is what brings those commits into your branch.

## `git pull` - fetch and merge in one step

Two things back-to-back: `git fetch`, then `git merge` - a convenience combo. Reach for it when you want
your branch caught up and expect the merge to be clean.

```console
$ git pull
Updating a1b2c3d..b2c3d4e
Fast-forward
 banner.js | 18 ++++++++++++++
```
*What just happened:* Git fetched the "Add promo banner" commit and immediately fast-forwarded your
`main` onto it. One command, fully synced.

**The gotcha.** Because `pull` *merges automatically*, it can drop you straight into a merge conflict (or
a surprise merge commit) when you and the remote have both moved. Many people prefer `git fetch`, look,
then merge deliberately - staying in control of *when* the merge happens. If a `pull` leaves you
mid-conflict, Phase 3 has you.

## `git push` - send your commits up

Uploads commits you have but the remote doesn't, and moves the remote's branch label forward to match
yours - the mirror image of `fetch`. Reach for it to share your work: back it up, open a pull request,
let teammates see it.

```console
$ git push
Enumerating objects: 5, done.
To github.com:acme/shop.git
   b2c3d4e..c3d4e5f  main -> main
$ git push -u origin feature-cart
```
*What just happened:* The first push sent your commits and advanced origin's `main`. The second is what
you run the *first* time you push a new branch: `-u origin feature-cart` creates the branch on the remote
and links your local branch to it, so future `push`/`pull` need no arguments.

**The gotcha.** If the remote has commits you don't, Git rejects the push (`fetch first`) rather than
bury history you haven't seen - `pull`, then push again. And a warning for later: `git push --force`
overrides that safety and can *erase your teammates' commits*. Never force-push a shared branch. (The
safe way to rewrite history is its own topic - guide #2.)

## `git stash` - shelve it for a minute

Takes your uncommitted changes (staged and unstaged), saves them on a stack, and reverts your working
directory to a clean state matching the last commit. Later, you pop them back. Reach for it when you're
mid-change and need a clean tree *right now* - an urgent fix, or a pull without committing half-finished
work.

```console
$ git stash
Saved working directory and index state WIP on feature-cart: a1b2c3d
$ git switch main          # clean tree, so the switch is allowed
$ # ...do the urgent thing, then come back...
$ git switch feature-cart
$ git stash pop
```
*What just happened:* `stash` swept your in-progress edits onto a shelf, handing you a clean working
directory so Git allowed the switch. `stash pop` later put those edits right back.

**The gotcha.** The stash is a *stack*, and it's easy to forget what's on it - stash twice, change
context for a week, and you've got mystery shelves. Use `git stash list` to see them, and prefer `git
stash pop` (applies *and* removes) so they don't pile up. For anything you want to keep more than a few
hours, a real commit on a branch is safer than a stash.

---

## You now speak Git

Every command above was moving the same five things from Phase 1: taking snapshots (`commit`), sliding
labels (`branch`, `merge`, `push`), moving "you are here" (`switch`), shuffling work between the three
places (`add`, `diff`, `stash`), or syncing copies (`fetch`, `pull`, `push`). None of it was magic - tools
acting on a model you now understand.

Which means you're ready for the part that used to be terrifying: **[Phase 3 - When It Breaks](03-when-it-breaks.md)**,
where things go wrong and you fix them without breaking a sweat.

Watch it animated: [merging two branches](/explainers/Merging.dc.html)

---

[← Phase 1: The Mental Model](01-the-mental-model.md) · [Guide overview](_guide.md) · [Phase 3: When It Breaks →](03-when-it-breaks.md)

## Try it yourself

Run commands and watch the history graph build - try `commit -m "first"`, `branch dev`, `checkout dev`, `commit -m "work"`, `checkout main`, then `merge dev`:

```playground-git
```
