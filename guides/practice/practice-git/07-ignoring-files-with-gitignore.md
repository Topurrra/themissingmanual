---
title: "Ignoring files with .gitignore"
guide: practice-git
phase: 7
summary: "A detective lesson - read git status and confirm a gitignored file never shows up as something to commit."
tags: [git, gitignore, untracked-files]
difficulty: beginner
synonyms:
  - gitignore practice
  - how gitignore works
  - ignore files in git
  - keep secrets out of git
updated: 2026-07-10
---

# Ignoring files with `.gitignore`

Another detective lesson - no staging, no committing, just looking, same as
reading `git status`. This repo has a `.gitignore` file listing `secrets.txt`
by name. Sitting in the working directory is `secrets.txt` itself - a file
Git can see on disk but has been told to pretend not to.

That's the whole idea behind `.gitignore`: it doesn't delete anything or hide
a file from your filesystem, it just tells Git "don't ever offer to track
this." A file listed there never shows up as untracked, never gets swept in
by `git add .`, and never clutters `git status` - which is exactly what you
want for things like API keys, `node_modules/`, or build output that has no
business being committed.

**Your task:** run `git status` and confirm `secrets.txt` is nowhere in the
output - the working tree should read as completely clean.

**You'll practice:**

- Trusting `.gitignore` to keep a file out of everything git-related
- Reading a clean `git status` and recognizing what "clean" really means

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { ".gitignore": "secrets.txt\n", "app.txt": "print('v1')\n" },
  "precommit": "Initial commit",
  "workdirEdits": { "secrets.txt": "API_KEY=super-secret\n" },
  "expectStatusContains": ["On branch main", "nothing to commit, working tree clean"],
  "starterCode": "# Type one git command: git status\n",
  "solution": "git status",
  "hints": [
    "Just one command - no add, no commit, same as the last detective lesson.",
    "secrets.txt is sitting in the working directory, but it's listed in .gitignore.",
    "git status - if .gitignore is doing its job, secrets.txt won't appear anywhere in the output at all."
  ]
}
```
