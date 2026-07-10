---
title: "A second commit, and git log"
guide: practice-git
phase: 2
summary: "Add a second file to a repo that already has history, then read that history back with git log."
tags: [git, commit, log, history]
difficulty: beginner
synonyms:
  - git log practice
  - view git commit history
  - make a second git commit
updated: 2026-07-10
---

# A second commit, and `git log`

This repo isn't empty this time - `readme.txt` was already committed before
you got here (that's the `edit → add → commit` loop in action; you just
didn't have to type it). Sitting in the working directory, untracked, is a new
file: `notes.txt`.

**Your task:** stage and commit `notes.txt` with the exact message
`Add notes.txt`, then run `git log --oneline` to see both commits in your
history.

**You'll practice:**

- Committing a second time in a repo that already has history
- `git log --oneline` - a compact view of your commit history, newest first

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { "readme.txt": "Welcome to the project.\n" },
  "precommit": "Add readme.txt",
  "workdirEdits": { "notes.txt": "Meeting notes.\n" },
  "starterCode": "# Type one git command per line.\n# Stage + commit notes.txt, then look at the log.\n",
  "solution": "git add notes.txt\ngit commit -m \"Add notes.txt\"\ngit log --oneline",
  "hints": [
    "Same two-step loop as last time: add, then commit.",
    "git add notes.txt, then git commit -m \"Add notes.txt\" - exact message.",
    "Finish with git log --oneline to see both commits, newest first."
  ]
}
```
