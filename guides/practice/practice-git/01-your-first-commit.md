---
title: "Your first commit"
guide: practice-git
phase: 1
summary: "Stage a file and commit it - the two moves at the heart of everything Git does."
tags: [git, add, commit, staging]
difficulty: beginner
synonyms:
  - git add and commit practice
  - how to make a git commit
  - stage and commit a file
updated: 2026-07-10
---

# Your first commit

This isn't a code editor - it's a tiny terminal. Every line you type is one
real `git` command, run against a real (private, in-browser) repository. No
typing file contents, no functions to write - just the commands themselves,
exactly like a real project.

You're dropped into a folder that already has one file in it: `readme.txt`.
Nothing has been committed yet.

**Your task:** stage `readme.txt` and commit it with the exact message
`Add readme.txt`.

**You'll practice:**

- `git add <file>` - moving a file into the staging area
- `git commit -m "<message>"` - sealing a snapshot

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { "readme.txt": "Welcome to the project.\n" },
  "starterCode": "# Type one git command per line.\n# Stage readme.txt, then commit it.\n",
  "solution": "git add readme.txt\ngit commit -m \"Add readme.txt\"",
  "hints": [
    "Two commands: one to stage the file, one to commit it.",
    "git add readme.txt puts it in the staging area - nothing is saved to history yet.",
    "git commit -m \"Add readme.txt\" - the message must be exactly that, in quotes."
  ]
}
```
