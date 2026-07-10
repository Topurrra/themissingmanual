---
title: "Merging a branch back in"
guide: practice-git
phase: 4
summary: "Do the work on a branch, then bring it back into main with git merge."
tags: [git, merge, branch, fast-forward]
difficulty: intermediate
synonyms:
  - git merge practice
  - how to merge a branch into main
  - fast-forward merge example
updated: 2026-07-10
---

# Merging a branch back in

Same starting point as last time: `main` has one commit (`app.txt`), and
`feature.txt` is sitting untracked in the working directory, waiting to become
work done on a branch.

This time, don't stop at committing on the branch - bring that work back into
`main` where it belongs.

**Your task:** branch off `main` into `feature`, commit `feature.txt` there
with the exact message `Add feature.txt`, switch back to `main`, then merge
`feature` into it. When you're done, `main` should contain `feature.txt` too.

**You'll practice:**

- The full branch → commit → switch back → merge loop
- `git merge <branch>` - folding another branch's commits into the one you're on

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { "app.txt": "print('v1')\n" },
  "precommit": "Initial commit",
  "workdirEdits": { "feature.txt": "print('new feature')\n" },
  "starterCode": "# Type one git command per line.\n# Branch, commit on it, switch back to main, then merge.\n",
  "solution": "git checkout -b feature\ngit add feature.txt\ngit commit -m \"Add feature.txt\"\ngit checkout main\ngit merge feature",
  "hints": [
    "The first three commands are exactly the branch-and-commit steps from the last lesson.",
    "Don't forget to switch back to main before merging - git merge folds another branch INTO the one you're currently on.",
    "git checkout main, then git merge feature."
  ]
}
```
