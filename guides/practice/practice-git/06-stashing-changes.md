---
title: "Stashing changes with git stash"
guide: practice-git
phase: 6
summary: "Tuck away uncommitted work without committing it, get a clean tree, then bring it back with git stash pop."
tags: [git, stash, working-tree]
difficulty: intermediate
synonyms:
  - git stash practice
  - how to stash uncommitted changes
  - save changes without committing
  - git stash pop example
updated: 2026-07-10
---

# Stashing changes with `git stash`

Sometimes you're mid-edit - not ready to commit, but you need a clean working
tree anyway (switch branches, pull someone else's work, whatever). Committing
half-finished work just to switch away and back is annoying. `git stash` is
the better move: it takes your uncommitted changes, tucks them away on a
shelf, and puts your working directory back to exactly what your last commit
looked like. `git stash pop` brings the shelved changes back later, right
where you left them.

Same starting point as the merge lesson: `main` has one commit (`app.txt`),
and this time it's been edited since - a real, uncommitted change sitting in
the working directory.

**Your task:** stash that edit, confirm the tree is clean, then pop it back
and commit it with the exact message `Update app.txt`.

**You'll practice:**

- `git stash` - shelving uncommitted changes and getting a clean tree back
- `git stash pop` - restoring what you shelved
- Recognizing that stash is for a few minutes, not long-term storage

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { "app.txt": "print('v1')\n" },
  "precommit": "Initial commit",
  "workdirEdits": { "app.txt": "print('v1')\nprint('v2')\n" },
  "starterCode": "# Type one git command per line.\n# Stash the edit, confirm the tree is clean, then bring it back and commit it.\n",
  "solution": "git stash\ngit status\ngit stash pop\ngit add app.txt\ngit commit -m \"Update app.txt\"",
  "hints": [
    "git stash with no arguments shelves your current changes and resyncs the working tree to your last commit.",
    "git status in between should show a clean tree - that's the whole point of stashing. Then git stash pop brings the edit back.",
    "git stash, git status, git stash pop, git add app.txt, git commit -m \"Update app.txt\"."
  ]
}
```
