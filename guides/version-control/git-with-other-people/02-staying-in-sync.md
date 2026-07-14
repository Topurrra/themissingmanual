---
title: "Staying in Sync - Keeping Up With a Moving main"
guide: "git-with-other-people"
phase: 2
summary: "main keeps moving while you work; learn what tracking branches tell you, how to fold the latest main into your branch regularly, and how to handle team conflicts and rejected pushes calmly."
tags: [git, sync, pull, push, tracking-branch, merge, conflict, teamwork]
difficulty: intermediate
synonyms: ["keep my branch up to date with main", "git your branch is behind", "git merge main into feature branch", "git updates were rejected fetch first", "resolve merge conflict on a team", "what is a tracking branch"]
updated: 2026-07-10
---

# Staying in Sync - Keeping Up With a Moving main

Here's the thing solo Git never prepares you for: while you're heads-down on your feature branch, the rest
of the team keeps merging into `main`. Every hour you work, your branch drifts a little further from the
"real" `main`. Wait too long and merging back becomes a painful tangle of conflicts.

The fix isn't to work faster - it's to **sync often**, in small doses. This phase shows you how to read how
far you've drifted, fold the latest `main` into your branch regularly, and stay calm when two people touch
the same lines.

## The team-sync cheat-card

> **Stuck right now? Find your situation, then read the section below.**

| Situation | The calm move |
|---|---|
| "Is my branch behind `main`?" | `git fetch`, then `git status` / `git log --oneline main..origin/main` (§2) |
| "Pull in the latest `main`" | `git switch main && git pull`, then `git switch <branch> && git merge main` (§3) |
| "Conflict while merging `main` in" | Resolve the files, `git add`, `git commit` - or `git merge --abort` to back out (§4) |
| "`push` rejected - fetch first" | `git pull`, resolve if needed, then `git push` (§5) |
| "What does `-u` / tracking even mean?" | It links your branch to its remote twin so bare `push`/`pull` work (§1) |

---

## 1. Tracking branches - the link that makes `push`/`pull` "just work"

**What it actually is.** When you ran `git push -u origin feature/cart-totals` in Phase 1, the `-u`
("set upstream") created a *link* between your local branch and its copy on GitHub, `origin/feature/cart-totals`.
Git calls that copy a **remote-tracking branch** - your local bookmark of where the remote's version is.

**What it does in real life.** Because of that link, `git push` and `git pull` know where to go with no
arguments, and `git status` can tell you how you compare to the remote:
```console
$ git status
On branch feature/cart-totals
Your branch is ahead of 'origin/feature/cart-totals' by 2 commits.
  (use "git push" to publish your local commits)
```
*What just happened:* Git compared your branch to its remote twin and reported the gap - 2 commits it
hasn't seen. "Ahead" means local work to push; "behind" means remote work to pull; "diverged" means both,
and you'll need to reconcile.

## 2. See how far you've drifted from `main`

Your `status` line compares you to *your own branch's* remote - not to `main`. To check whether `main`
itself has moved on without you, first download the latest, then compare:
```console
$ git fetch
remote: Enumerating objects: 12, done.
From github.com:acme/shop
   e4f5g6h..a7b8c9d  main -> origin/main
$ git log --oneline main..origin/main
a7b8c9d Add promo-code field
3f1e2d0 Fix currency rounding
```
*What just happened:* `git fetch` quietly downloaded everyone's new commits and updated your bookmark of
`origin/main` - it touched none of your files (that's what makes it safe to run anytime). The `log` command
then asked "what's in `origin/main` that my `main` doesn't have?" - two commits.

> ⏭️ Fuzzy on `fetch` vs `pull` or what `origin/main` is? They're covered in depth in
> [Git, Explained Like You're a Human](/guides/git-explained-like-a-human) - this guide builds on that.

## 3. Fold the latest `main` into your branch

When `main` has moved, bring its new commits *into your feature branch* so you're building on current code
and you discover any clashes now, while they're small:
```console
$ git switch main
$ git pull                       # get main fully up to date locally
Updating e4f5g6h..a7b8c9d
Fast-forward
$ git switch feature/cart-totals
$ git merge main                 # fold those new commits into your branch
Merge made by the 'ort' strategy.
 promo.js | 22 ++++++++++++++++++
 1 file changed, 22 insertions(+)
```
*What just happened:* You updated local `main` from the remote, switched back to your feature branch, and
merged `main` into it - your branch now has the team's recent work *plus* your own, so there's little left
to reconcile when it's time to merge back. (`'ort'` is just Git's default merge strategy name; nothing to
configure.)

💡 **Key point.** Do this regularly - every morning, or whenever you notice `main` moved. Frequent small
merges beat one giant end-of-week merge every time; divergence is what makes conflicts hurt, and syncing
often keeps divergence tiny.

## 4. When folding in `main` causes a conflict

Sometimes a teammate changed the same lines you did, and the merge in step 3 stops:
```console
$ git merge main
Auto-merging pricing.js
CONFLICT (content): Merge conflict in pricing.js
Automatic merge failed; fix conflicts and then commit the result.
```
**What's actually happening.** Nothing is broken. Two commits changed the same lines and Git won't guess
which wins - it paused and is asking you to decide. This is the *good* outcome of syncing often: you're
resolving one small conflict now instead of twenty later.

**The calm fix.** Open the conflicted file, keep the version you want, delete the `<<<<<<<` / `=======` /
`>>>>>>>` marker lines, then stage and commit:
```console
$ git add pricing.js
$ git commit            # completes the merge; Git pre-fills the message
```
*What just happened:* You told Git the final text, removed the markers, and committed - finishing the merge
it had paused. Your branch is now both up to date with `main` *and* conflict-free.

**The escape hatch.** Not ready to deal with it? `git merge --abort` returns everything to exactly how it
was before you started the merge. Safe anytime you're mid-conflict and want out.

> ⏭️ The mechanics of reading conflict markers are walked through step-by-step in
> [Git, Explained Like You're a Human → When It Breaks](/guides/git-explained-like-a-human). The *team*
> difference is only this: conflicts come from other people's commits, so the cure is syncing often.

## 5. "Updates were rejected - fetch first"

**The situation.** You go to push and Git refuses:
```console
$ git push
 ! [rejected]        feature/cart-totals -> feature/cart-totals (fetch first)
error: failed to push some refs to 'github.com:acme/shop.git'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally.
```
**What's actually happening.** Someone (or you, from another machine) pushed commits to this branch that you
don't have yet. Git refuses to overwrite work it can see you haven't seen. **This is a safety feature, not
a failure** - and it's the wall that protects teammates from being silently clobbered.

**The calm fix.** Bring their commits down, then push:
```console
$ git pull            # fetch + merge their commits into yours
$ git push
```
*What just happened:* `git pull` merged the remote's commits into your branch (resolve a conflict here just
like §4 if one appears), so both sides agree again - and the push goes through.

⚠️ **Gotcha - never reach for `--force` to make a rejection go away.** `git push --force` *does* silence
the error, by overwriting whatever was on the remote - including a teammate's commits, permanently. On a
shared branch that's how you ruin someone's afternoon. The straight fix for a rejection is always `pull`,
then `push`. (There's a genuinely safer cousin, `--force-with-lease`, used when deliberately rewriting your
*own* branch - that belongs with the rewriting-history material in the advanced guide.)

## A note on `rebase`

You'll hear teammates say "just rebase onto `main`" as an alternative to the merge in §3. Rebase *rewrites*
your commits - tidier history, but a sharp tool: used wrong on a shared branch it rewrites history other
people have, exactly the kind of mess that ruins days. We cover it properly, with its safety rules, in the
advanced guide (#4: Git Disaster Recovery); until then, the merge-based sync here is completely correct and
won't bite anyone.

## Recap

1. **Tracking branches** link your local branch to its remote twin, so bare `push`/`pull` work and
   `status` can tell you ahead/behind/diverged.
2. **`git fetch` + `git log main..origin/main`** shows how far `main` has moved without you.
3. **Fold `main` into your branch often** (`merge main`) - small frequent syncs keep conflicts tiny.
4. **Conflicts are an unfinished merge waiting on you** - resolve and commit, or `merge --abort`.
5. **A rejected push means pull first** - never `--force` a shared branch.

You can now keep your branch healthy and current while the team moves around you. The last step is getting
your finished work *into* `main` - through a pull request.

---

[← Phase 1: The Feature-Branch Workflow](01-the-feature-branch-workflow.md) · [Guide overview](_guide.md) · [Phase 3: Pull Requests & Review →](03-pull-requests-and-review.md)
