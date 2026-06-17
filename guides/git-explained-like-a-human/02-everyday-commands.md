---
title: "The Everyday Commands — What Each One Really Does"
guide: "git-explained-like-a-human"
phase: 2
summary: "status, add, commit, log, diff, branch, switch, merge, fetch, pull, push, and stash — what each actually does, when to reach for it, and the gotcha."
tags: [git, commands, status, add, commit, log, diff, branch, switch, merge, pull, push, stash]
difficulty: beginner
synonyms: ["what does git add do", "git commit vs push", "difference between fetch and pull", "what is git stash", "git diff staged"]
updated: 2026-06-17
---

# The Everyday Commands — What Each One Really Does

In Phase 1 you learned the five ideas: commits are snapshots, branches are sticky-note labels, HEAD is
"you are here," your work lives in three places, and the remote is another copy. Now we put them to
work.

Here's the promise of this phase: you already type most of these commands. By the end you'll know what
each one is *actually doing* to those five things — which is the whole difference between running
commands on faith and running them with your eyes open.

**In a hurry?** The cheat-card is right below. **Want it to stick?** Read the section under each
command — that's where the "what just happened" lives.

## The cheat-card

| Command | What it really does |
|---|---|
| `git status` | What's changed, what's staged, what branch you're on. Your dashboard — run it constantly. |
| `git add` | Move a file's current state into the staging area (the box for your next commit). |
| `git commit` | Save a snapshot of everything staged, with a message. A save point you can return to. |
| `git log` | The history of snapshots — who saved what, when, and why. |
| `git diff` | The exact lines that changed (working vs staged vs last commit). |
| `git branch` | List / create / delete the sticky-note labels that point at commits. |
| `git switch` / `checkout` | Move HEAD ("you are here") to another branch or commit. `switch` is the modern, safer name. |
| `git merge` | Combine another branch's commits into your current branch. |
| `git fetch` | Download the remote's new commits but DON'T touch your files. Just look. |
| `git pull` | `fetch` + `merge`: download remote commits and apply them now. |
| `git push` | Upload your commits to the remote so others get them. |
| `git stash` | Shelve uncommitted changes for a clean tree; `pop` them back later. |

---

## `git status` — your dashboard

**What it actually does.** It looks at all three places from Phase 1 — your working directory, the
staging box, and the last commit — and reports how they differ, plus which branch you're on. It's a
read-only report. It changes nothing.

**When you reach for it.** Constantly. Before you add, before you commit, any time you're not sure what
state you're in. It answers "wait, where am I, and what's about to happen?"

**A real example.**
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
*What just happened:* Git is showing all three places at once. `checkout.js` is in the staging box (it
goes in your next commit). `cart.js` has edits that are *not* in the box yet. `notes.txt` is
"untracked" — Git has never seen it and ignores it until you `add` it. One glance, full picture.

**The gotcha.** There isn't one, and that's the point. `status` never changes anything, so run it as
often as you like. When in doubt, `git status`. It's the safest habit in Git.

## `git add` — put changes in the box

**What it actually does.** It copies the current state of a file into the staging box — the "what goes
in my next commit" box from Phase 1. It saves nothing to history; it's packing the box, not taping it
shut.

**When you reach for it.** Right before committing, to choose exactly what goes in. This is Git's
superpower: edit ten files, commit only three, and keep unrelated changes out of the snapshot.

**A real example.**
```console
$ git add checkout.js
$ git status
On branch main
Changes to be committed:
  modified:   checkout.js
```
*What just happened:* `checkout.js` moved into the box ("changes to be committed"). Nothing is in
history yet — you've only decided what the next snapshot will include.

**The gotcha.** `add` captures the file *as it is right now*. Edit it again afterward and those new
edits aren't in the box — you'll see the file listed as both staged and not staged (you met this in
Phase 1). Fix: `git add` it again. Many people reflexively run `git add .`, which boxes up
*everything* — convenient, and also how stray files and stray debug code sneak into commits. Know what
you're adding.

## `git commit` — tape the box shut

**What it actually does.** It takes everything in the staging box and turns it into a permanent
snapshot — a new commit — whose parent is wherever HEAD is. Then it slides your branch's sticky note
forward onto the new commit. (All five Phase 1 ideas in one command.)

**When you reach for it.** At every meaningful checkpoint — a working feature, a fixed bug, a sensible
stopping point. Commits are free and they're your save points. Make them often.

**A real example.**
```console
$ git commit -m "Fix tax rounding at checkout"
[main a1b2c3d] Fix tax rounding at checkout
 1 file changed, 3 insertions(+), 1 deletion(-)
```
*What just happened:* Git sealed the box into commit `a1b2c3d`, recorded its parent, and slid the
`main` label onto it. That snapshot is now history. The summary line is Git being friendly about what
changed versus the parent.

**The gotcha.** `commit` only saves what's in the box. Edited a file but forgot to `add` it? It won't
be in the commit, and Git won't warn you — it commits the staged stuff and leaves your unstaged edits
behind. (Run `git status` first. See why it's a habit?) Also: `git commit` with no `-m` drops you into
a text editor for the message. If that turns out to be Vim and you're trapped, type `:q!` and press
Enter to escape without committing. We've all been there.

## `git log` — the history of snapshots

**What it actually does.** It walks backward from HEAD, following each commit's parent pointer, and
lists the snapshots it finds. It's how you read the chain from Phase 1.

**When you reach for it.** To see what happened, who did it, and when — or to find a specific commit's
hash so you can point another command at it.

**A real example.**
```console
$ git log --oneline
a1b2c3d (HEAD -> main) Fix tax rounding at checkout
9f2a1c7 Add login button
3e4f5a6 Initial commit
```
*What just happened:* Each line is a commit, newest first, walking back down the parents. `--oneline`
squeezes each to its short hash and message. See `(HEAD -> main)` on the top one — the "you are here"
arrow and the `main` label, both on the newest commit.

**The gotcha.** Plain `git log` can drop you into a full-screen pager. Two lifesavers: `git log
--oneline` for the compact view, and `git log --oneline --graph --all` to *see* your branches drawn as
a tree — the best way to make sense of a tangled history. (Stuck in the pager? Press `q` to quit.)

## `git diff` — show me the actual lines

**What it actually does.** It compares two of your three places and shows the exact line-by-line
changes between them. By default it compares your working files against the staging box.

**When you reach for it.** Right before you `add` or `commit`, to review what you're about to include.
"What exactly am I committing?" is a question worth asking often.

**A real example.**
```console
$ git diff
diff --git a/cart.js b/cart.js
@@ -14,7 +14,7 @@
-  const total = price
+  const total = price * quantity
```
*What just happened:* Git is showing the change in `cart.js` that is *not yet staged*: one line removed
(`-`), one added (`+`). This is the diff between your working file and the box.

**The gotcha.** This one confuses everyone: once you `git add` a file, plain `git diff` shows *nothing*
for it — because `diff` compares working-vs-box, and `add` just made them identical. Your change isn't
gone; it's in the box. To see what's *in the box* (staged, about to be committed), use `git diff
--staged`. Remember it as: plain `diff` = "not added yet," `diff --staged` = "added, about to commit."

## `git branch` — manage the sticky notes

**What it actually does.** It lists, creates, or deletes branch labels. Creating one drops a new sticky
note on your current commit (Phase 1) — it does not move you onto it.

**When you reach for it.** To start a new line of work, to see what branches exist, or to clean up
labels you're done with.

**A real example.**
```console
$ git branch
* main
  feature-login
$ git branch feature-cart
```
*What just happened:* The first command listed your branches; the `*` marks the one you're on (`main`).
The second created a new label, `feature-cart`, on your current commit. Notice you're *still on
`main`* — creating a branch doesn't move you.

**The gotcha.** `git branch feature-cart` creates the branch but does *not* switch to it — a classic
surprise. People expect to "be on" the new branch and start committing, then find their commits landed
on `main`. To create *and* switch in one step, use `git switch -c feature-cart` (next command).

## `git switch` (and `git checkout`) — move "you are here"

**What it actually does.** It moves HEAD — the "you are here" arrow — onto a different branch and
updates your working files to match that branch's commit. `switch` is the modern, purpose-built
command; `checkout` is the older one that does this *plus* several unrelated jobs.

**When you reach for it.** Every time you change what you're working on — hopping to a feature branch,
back to `main`, and so on.

**A real example.**
```console
$ git switch -c feature-cart
Switched to a new branch 'feature-cart'
```
*What just happened:* `-c` created the `feature-cart` label and moved HEAD onto it in one step. Now
you're "on" `feature-cart`; your next commit slides *its* sticky note forward, leaving `main` where it
was.

**The gotcha.** `checkout` is overloaded — the same command switches branches, restores files, and
detaches HEAD depending on how you call it. That overloading is why `git checkout .` has erased
people's work (it can mean "throw away my changes"). Modern Git split those jobs into two clearer
commands: `git switch` for branches, `git restore` for files. Prefer them. Also: if you have
uncommitted changes that a switch would overwrite, Git blocks you — `commit` or `stash` first (see
`stash` below).

## `git merge` — combine two branches

**What it actually does.** It joins another branch's commits into your current one. If your branch
hasn't moved since the other split off, Git slides your label forward ("fast-forward"). Otherwise it
creates a new *merge commit* with two parents, stitching the two histories together.

**When you reach for it.** To bring a finished feature branch into `main`, or to pull a teammate's
branch into yours.

**A real example.**
```console
$ git switch main
$ git merge feature-cart
Updating a1b2c3d..f6g7h8i
Fast-forward
 cart.js | 24 ++++++++++++++++++
```
*What just happened:* You moved to `main`, then merged `feature-cart` into it. Because `main` hadn't
moved, this was a "fast-forward" — Git slid `main`'s label up to `feature-cart`'s commit. No merge
commit needed; the histories were already in a straight line.

**The gotcha.** When both branches changed the *same lines*, Git can't decide which to keep and stops
with a **merge conflict**. That's not you doing something wrong — it's Git refusing to guess. Conflicts
feel scary the first time; Phase 3 walks through resolving one calmly.

## `git fetch` — download, but look before you leap

**What it actually does.** It downloads new commits from the remote (another copy, Phase 1) into your
local bookmark of *its* branches — like `origin/main` — without touching your own branches or your
files. It's the "show me what's out there, but don't change anything" command.

**When you reach for it.** When you want to see what teammates have pushed *before* you decide to
integrate it. The cautious, no-surprises way to sync.

**A real example.**
```console
$ git fetch
remote: Enumerating objects: 5, done.
From github.com:acme/shop
   a1b2c3d..b2c3d4e  main -> origin/main
$ git log --oneline main..origin/main
b2c3d4e Add promo banner
```
*What just happened:* Git downloaded the new commit and updated `origin/main` — your local bookmark of
where the remote's `main` is. Your own `main` hasn't moved. The second command lists what origin has
that you don't: one commit, "Add promo banner." Now *you* decide what to do with it.

**The gotcha.** `fetch` is safe because it doesn't touch your working files — but that's also why people
forget they've fetched and wonder why nothing looks different. Fetching updates your *knowledge* of the
remote; merging (or pulling) is what actually brings those commits into your branch.

## `git pull` — fetch and merge in one step

**What it actually does.** Two things back-to-back: `git fetch` (download the remote's new commits),
then `git merge` (join them into your current branch). It's a convenience combo.

**When you reach for it.** When you want your branch up to date with the remote and expect the merge to
be clean — usually when you haven't diverged much from your teammates.

**A real example.**
```console
$ git pull
Updating a1b2c3d..b2c3d4e
Fast-forward
 banner.js | 18 ++++++++++++++
```
*What just happened:* Git fetched the "Add promo banner" commit and immediately fast-forwarded your
`main` onto it. One command, fully synced.

**The gotcha.** Because `pull` *merges automatically*, it can drop you straight into a merge conflict
(or make a surprise merge commit) when you and the remote have both moved. That's why many people prefer
`git fetch`, look, then merge deliberately — you stay in control of *when* the merge happens. If a
`pull` ever leaves you mid-conflict, don't panic: Phase 3 has you.

## `git push` — send your commits up

**What it actually does.** It uploads commits you have but the remote doesn't, and moves the remote's
branch label forward to match yours. It's the mirror image of `fetch`.

**When you reach for it.** When you want to share your work — back it up, open a pull request, let
teammates see it.

**A real example.**
```console
$ git push
Enumerating objects: 5, done.
To github.com:acme/shop.git
   b2c3d4e..c3d4e5f  main -> main
$ git push -u origin feature-cart
```
*What just happened:* The first push sent your new commits to origin and advanced its `main`. The
second is what you run the *first* time you push a new branch: `-u origin feature-cart` creates the
branch on the remote and links your local branch to it, so future `push`/`pull` need no arguments.

**The gotcha.** If the remote has commits you don't, Git rejects the push (`! [rejected] ... fetch
first`) — it won't bury history you haven't seen. Fix: `pull` (or fetch + merge), then push. And a
warning for later: `git push --force` overrides that safety and can *erase your teammates' commits*.
Never force-push a shared branch. (The safe way to rewrite history is its own topic — guide #2.)

## `git stash` — shelve it for a minute

**What it actually does.** It takes your uncommitted changes (staged and unstaged both), saves them on
a stack for later, and reverts your working directory to a clean state matching the last commit. Later,
you pop them back.

**When you reach for it.** When you're mid-change and need a clean tree *right now* — to switch branches
for an urgent fix, or to pull without committing half-finished work.

**A real example.**
```console
$ git stash
Saved working directory and index state WIP on feature-cart: a1b2c3d
$ git switch main          # clean tree, so the switch is allowed
$ # ...do the urgent thing, then come back...
$ git switch feature-cart
$ git stash pop
```
*What just happened:* `stash` swept your in-progress edits onto a shelf and handed you a clean working
directory, so Git allowed the switch. `stash pop` later put those edits right back where you left them.

**The gotcha.** The stash is a *stack*, and it's easy to forget what's on it — stash twice, change
context for a week, and you've got mystery shelves. Use `git stash list` to see them, and prefer `git
stash pop` (applies *and* removes) so they don't pile up. For anything you want to keep more than a few
hours, a real commit on a branch is safer than a stash.

---

## You now speak Git

Look back at what each command did. Every one was moving the same five things from Phase 1: taking
snapshots (`commit`), sliding labels (`branch`, `merge`, `push`), moving "you are here" (`switch`),
shuffling work between the three places (`add`, `diff`, `stash`), or syncing copies (`fetch`, `pull`,
`push`). None of it was magic. It was tools acting on a model you now understand.

Which means you're ready for the part that used to be terrifying: **[Phase 3 — When It Breaks](03-when-it-breaks.md)**,
where things go wrong and you fix them without breaking a sweat.
