---
title: "Git With Other People - Branches, Pull Requests, and Not Stepping on Toes"
guide: "git-with-other-people"
phase: 0
summary: "How real teams use Git: feature branches, keeping your work in sync with a moving main, and getting changes in through pull requests - without overwriting anyone."
tags: [git, version-control, collaboration, branches, pull-requests, teamwork, intermediate]
category: version-control
order: 3
difficulty: intermediate
synonyms: ["how do teams use git", "git feature branch workflow", "what is a pull request", "how to keep my branch up to date", "git collaboration workflow", "git branching strategy"]
updated: 2026-06-18
---

# Git With Other People - Branches, Pull Requests, and Not Stepping on Toes

Working on Git alone is one thing. Then you join a team, and suddenly there are five other people committing
to the same project, a branch called `main` that everyone treats as sacred, and a thing called a "pull
request" that you're expected to "open" - and nobody explains any of it. The commands you know still work;
it's the *workflow* around them that's new and unspoken.

This guide is that missing explanation. By the end you'll know how to start a piece of work without
endangering anyone else's, keep your branch current as `main` moves under you, and get your changes
reviewed and merged the way professional teams actually do it. No new scary commands - just the patterns
that turn solo Git into team Git.

> ⏭️ **New to Git?** This guide assumes you can already `commit`, `push`, `branch`, and `merge`, and that
> you've met merge conflicts. If any of that is shaky, read
> [Git From Zero](/guides/git-from-zero) and then
> [Git, Explained Like You're a Human](/guides/git-explained-like-a-human) first - they build the
> foundation this one stands on.

## How to read this
- **Just joined a team and want the workflow?** Read in order - it follows the real life-cycle of one
  change, from branch to merged.
- **Stuck mid-sync right now?** Jump to the [team-sync cheat-card in Phase 2](02-staying-in-sync.md).

## The phases
1. **[The Feature-Branch Workflow](01-the-feature-branch-workflow.md)** - why nobody commits to `main`
   directly, and the branch → push → merge loop every change travels through.
2. **[Staying in Sync](02-staying-in-sync.md)** - keeping your branch current while `main` keeps moving,
   and handling the conflicts that come from a team, calmly.
3. **[Pull Requests & Review](03-pull-requests-and-review.md)** - what a PR actually is, how review
   works, merging cleanly, and tagging a release.

> Rewriting history - `rebase`, recovering lost commits with the reflog, and undoing work you've already
> pushed - is deliberately held back for the advanced guide (#4: Git Disaster Recovery). Here we stay on
> the safe, merge-based path that won't bite a teammate.
