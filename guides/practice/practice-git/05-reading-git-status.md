---
title: "Reading git status"
guide: practice-git
phase: 5
summary: "git status is your dashboard - learn to read what it's telling you about a changed-but-uncommitted file."
tags: [git, status, working-tree]
difficulty: beginner
synonyms:
  - what does git status mean
  - git status output explained
  - check uncommitted changes in git
updated: 2026-07-10
---

# Reading `git status`

A detective lesson - no staging, no committing, just looking. `notes.txt` was
committed a while ago. Since then, someone (you, in another sitting) edited it
- and never staged or committed that change. It's just sitting there,
modified, in the working directory.

**Your task:** run `git status` and read what it tells you.

**You'll practice:**

- Recognizing "changes not staged for commit" in real git output
- Using `git status` as a free, side-effect-free dashboard - run it anytime

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { "notes.txt": "Draft notes.\n" },
  "precommit": "Add notes.txt",
  "workdirEdits": { "notes.txt": "Draft notes.\nRemember to email Sam.\n" },
  "expectStatusContains": ["Changes not staged for commit", "notes.txt"],
  "starterCode": "# Type one git command: git status\n",
  "solution": "git status",
  "hints": [
    "Just one command this time - no add, no commit.",
    "git status never changes anything, so it's always safe to run.",
    "git status - then read the output panel: which file is listed, and under which heading?"
  ]
}
```
