---
title: "Undoing a commit with git revert"
guide: practice-git
phase: 8
summary: "Undo a bad commit the safe way - git revert adds a new commit that cancels it out instead of rewriting history."
tags: [git, revert, undo, history]
difficulty: intermediate
synonyms:
  - git revert practice
  - undo a commit safely
  - how does git revert work
  - revert vs reset
updated: 2026-07-10
---

# Undoing a commit with `git revert`

Not every commit turns out to be a good idea. `git revert` is the safe way to
undo one: instead of deleting the commit or rewriting history (which gets
dangerous the moment anyone else has that history too), it makes a **new**
commit that's the exact opposite of the one you're undoing. Whatever that
commit added, the revert removes. History stays intact - anyone reading the
log later can see both "this happened" and "then it got undone," instead of
the mistake quietly vanishing.

`main` has one commit already (`app.txt`). You're about to add a file that
turns out to be a mistake - and undo it the right way.

**Your task:** stage and commit `feature.txt` with the exact message
`Add feature.txt`, then run `git revert HEAD` to undo that commit. When
you're done, `main` should be back to just `app.txt` - with two commits in
the log on top of the starting one: the commit that added `feature.txt`, and
the revert that cancels it out.

**You'll practice:**

- `git revert HEAD` - undoing the most recent commit by adding a new one
- Why "undo by adding a commit" is safer than rewriting history

```lesson
{
  "language": "git",
  "check": "gitState",
  "setup": { "app.txt": "print('v1')\n" },
  "precommit": "Initial commit",
  "workdirEdits": { "feature.txt": "print('buggy feature')\n" },
  "starterCode": "# Type one git command per line.\n# Commit feature.txt, then revert that commit away.\n",
  "solution": "git add feature.txt\ngit commit -m \"Add feature.txt\"\ngit revert HEAD",
  "hints": [
    "First commit feature.txt normally - that's the commit you're about to undo.",
    "git revert HEAD undoes the most recent commit by making a brand-new commit, not by erasing anything.",
    "git add feature.txt, git commit -m \"Add feature.txt\", git revert HEAD."
  ]
}
```
