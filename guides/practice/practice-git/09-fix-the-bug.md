---
title: "Fix the bug: forgot to switch branches"
guide: practice-git
phase: 9
summary: "The script below creates a branch but never switches onto it - the commit lands on main instead. Find it and fix it."
tags: [git, debugging, branch, checkout]
difficulty: intermediate
synonyms:
  - git branch checkout bug
  - forgot to checkout new branch
  - commit landed on main instead of feature branch
  - fix git branch mistake
updated: 2026-07-16
---

# Fix the bug: forgot to switch branches

Every lesson so far asked you to type a script from scratch. Real work is
more often the opposite: someone else's script is already there, and it's
broken. This one doesn't throw an error or print anything scary - it runs
clean, top to bottom, and *looks* like it worked. That's what makes it worth
knowing: a wrong branch doesn't crash, it just quietly commits your work in
the wrong place.

The script below is supposed to create a branch called `feature` and commit
`feature.txt` there, keeping `main` untouched. Run it, then check where the
commit actually landed - `git branch --show-current` or `git log --oneline`
will tell you the truth. `git branch feature` only *creates* the branch. It
doesn't move you onto it - you're still standing on whatever branch you were
already on when the next commands run.

**Your task:** fix the script so the commit for `feature.txt` lands on
`feature`, not `main`. When you're done, `main` should still have only its
original commit.

**You'll practice:**

- Noticing that `git branch <name>` creates a branch without switching to it
- Reaching for `git checkout -b <name>` when you want both in one step

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { "app.txt": "print('v1')\n" },
  "precommit": "Initial commit",
  "workdirEdits": { "feature.txt": "print('new feature')\n" },
  "starterCode": "# This script is broken - it's supposed to commit feature.txt on a new branch called feature, but the commit lands on main instead. Fix it.\ngit branch feature\ngit add feature.txt\ngit commit -m \"Add feature.txt\"",
  "solution": "git checkout -b feature\ngit add feature.txt\ngit commit -m \"Add feature.txt\"",
  "hints": [
    "Run it, then run git branch --show-current - which branch are you actually standing on when the commit happens?",
    "git branch feature creates the branch but leaves you exactly where you were. You need a command that also switches onto it.",
    "Replace git branch feature with git checkout -b feature - it creates the branch AND switches onto it in one step."
  ]
}
```
