---
title: "What Git tracks (and what \"ignore\" really means)"
guide: "gitignore-lfs-submodules"
phase: 1
summary: "Keep junk, secrets, and giant files out of your repo, and tame the submodule: the settings that stop you committing node_modules or a 2GB video."
tags: [git, gitignore, git-lfs, submodules, secrets, large-files]
difficulty: intermediate
synonyms: ["how to use gitignore", "stop tracking a file in git", "git ignore not working", "remove file from git but keep it", "git lfs large files", "what are git submodules", "git submodule detached head", "accidentally committed secret to git"]
updated: 2026-06-30
---

# What Git tracks (and what "ignore" really means)

Here's the thing that trips almost everyone up at least once: you add a file to `.gitignore`, you commit, and the file *still shows up* in `git status`. You double-check the spelling. It's right. The pattern is right. And Git keeps tracking it anyway. You start to wonder if `.gitignore` is broken.

It isn't. You've hit the single most important fact about ignoring files, and it's the one nobody tells you up front. So let's get the mental model right before we touch a single pattern, because once this clicks, three different mysteries stop being mysteries.

## Git sorts every file into one of three buckets

At any moment, every file in your working directory is in exactly one of these states from Git's point of view:

```text
tracked     → Git knows about it, watches it for changes
untracked   → Git sees it but isn't watching it (shows in `git status`)
ignored     → Git is told to not even mention it
```

*What just happened:* Notice that **ignored** and **untracked** are different states, and — this is the key — `.gitignore` only ever affects **untracked** files. It tells Git "don't bother nagging me about this file you aren't tracking yet." It says *nothing* about files Git is *already tracking*.

That one sentence explains the mystery. If a file was committed before you ignored it, it's **tracked**. `.gitignore` doesn't apply to tracked files at all. Git keeps watching it, keeps showing its changes, keeps committing it — exactly as if the ignore rule weren't there.

> The fix, which we'll do properly in Phase 2, is to *untrack* the file (remove it from the index) so it falls back to being merely ignored. The ignore rule only gets a chance to work once the file is no longer tracked.

## The index: the part of Git people forget exists

To really get this, you need one more piece: the **index** (also called the *staging area*). It sits between your working directory and your commits.

```text
working directory  →  index (staging area)  →  commit history
   (your files)        (what's tracked,         (the snapshots
                        staged for next          you've saved)
                        commit)
```

*What just happened:* "Tracked" really means "present in the index." When you `git add` a file, you put it in the index. From then on Git follows it. `.gitignore` is a filter on what's *allowed into* the index on its own — it can't evict something that's already there. That's why ignoring a tracked file does nothing: the file is already past the gate.

So the rule in one line: **`.gitignore` keeps files OUT of the index; it cannot kick files OUT of it.** Kicking a file out is a separate, deliberate act (Phase 2).

## What belongs out of the repo

Before patterns, the *why*. Three kinds of things should almost never live in version control:

- **Generated output** — `node_modules/`, `dist/`, `build/`, `target/`, compiled binaries, `__pycache__/`. These are reproducible from your source. Committing them bloats the repo and creates pointless merge conflicts. Anyone can regenerate them with one command.
- **Local and personal files** — editor settings, `.env` files, OS cruft like `.DS_Store`. These are about *your machine*, not the project.
- **Secrets** — API keys, passwords, tokens, private certificates. These should never enter history, and as Phase 3 will show, getting them *out* after the fact is genuinely hard.

```bash
# A starter .gitignore for a typical Node project
node_modules/
dist/
.env
.DS_Store
*.log
```

*What just happened:* Each line is a pattern. `node_modules/` ignores that whole folder; `*.log` ignores every file ending in `.log`; `.env` ignores that one file. Drop this in the repo root *before* your first commit and those files never get tracked in the first place — no untracking dance needed later. Prevention is far cheaper than cleanup.

## Big binaries are a different problem

Generated junk you keep out entirely. But sometimes you genuinely need a large file *in* the project — a design source, a sample dataset, a demo video. You can't ignore it; the project needs it. But Git was built for text, and it stores every version of every file forever.

```text
edit a 2GB video 5 times  →  Git stores ~10GB in history
                              (every version, full size, forever)
```

*What just happened:* Git diffs text beautifully but treats binaries as opaque blobs — every change stores a fresh full copy. A handful of edits to one big file can balloon your `.git` folder past the size of the actual project. Every clone then drags all of it down. This is the exact problem **Git LFS** (Large File Storage) exists to solve, and we'll set it up in Phase 2. The short version: LFS stores a tiny text *pointer* in your repo and stashes the real bytes elsewhere.

## For builders

When you scaffold a new project, the very first commit should already include a `.gitignore`. Most frameworks generate a sensible one for you (`create-react-app`, `cargo new`, `django-admin startproject` all do). GitHub also publishes a maintained collection at github.com/github/gitignore covering most languages — copy the one for your stack rather than hand-rolling it. Getting this right on commit one means you never fight a tracked-junk-file later.

```quiz
[
  {
    "q": "You add `config.local.json` to `.gitignore`, but `git status` still lists it as modified. Why?",
    "choices": [
      "The pattern syntax is wrong",
      "The file was already tracked before you ignored it; .gitignore only affects untracked files",
      ".gitignore needs to be committed before it works",
      "Git ignores JSON files by default"
    ],
    "answer": 1,
    "explain": ".gitignore only filters untracked files. A file already in the index stays tracked until you explicitly untrack it."
  },
  {
    "q": "What does it mean for a file to be 'tracked' in Git?",
    "choices": [
      "It appears somewhere in the working directory",
      "It is present in the index (staging area)",
      "It has been pushed to a remote",
      "It is not listed in .gitignore"
    ],
    "answer": 1,
    "explain": "Tracked means present in the index. .gitignore controls what is allowed into the index, not what is already there."
  },
  {
    "q": "Why is committing a frequently-edited 2GB video directly into Git a problem?",
    "choices": [
      "Git refuses to commit files over 1GB",
      "Git stores a full copy of every version, so history balloons and every clone is huge",
      "Binary files corrupt the index",
      "Git automatically deletes large files after 30 days"
    ],
    "answer": 1,
    "explain": "Git keeps every version of every file forever, and stores binaries as full blobs. Large files inflate history and slow every clone, which is what Git LFS addresses."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Ignoring, untracking, and LFS for big files →](02-ignoring-untracking-lfs.md)
