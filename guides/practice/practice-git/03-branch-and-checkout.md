---
title: "Branch, then checkout"
guide: practice-git
phase: 3
summary: "Create a branch, switch onto it, and commit there without touching main."
tags: [git, branch, checkout, feature-branch]
difficulty: intermediate
synonyms:
  - git branch and checkout practice
  - create and switch git branch
  - git checkout -b practice
updated: 2026-07-10
---

# Branch, then checkout

`main` has one commit already (`app.txt`, committed before you arrived).
Sitting in the working directory, untracked, is `feature.txt` - the start of
some new work that should NOT land on `main` directly.

**Your task:** create a branch called `feature` and switch onto it, then
stage and commit `feature.txt` there with the exact message `Add feature.txt`.
When you're done, `main` should still have only its original commit -
`feature` should have one more.

**You'll practice:**

- `git checkout -b <name>` - create a branch and switch onto it in one step
- Keeping new work isolated on its own branch instead of committing to `main`

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { "app.txt": "print('v1')\n" },
  "precommit": "Initial commit",
  "workdirEdits": { "feature.txt": "print('new feature')\n" },
  "starterCode": "# Type one git command per line.\n# Create + switch to a branch called feature, then commit feature.txt there.\n",
  "solution": "git checkout -b feature\ngit add feature.txt\ngit commit -m \"Add feature.txt\"",
  "hints": [
    "One command creates AND switches to a new branch - you don't need two separate commands for that part.",
    "git checkout -b feature does both at once.",
    "After switching, it's the same add + commit loop as before: git add feature.txt, git commit -m \"Add feature.txt\"."
  ]
}
```
