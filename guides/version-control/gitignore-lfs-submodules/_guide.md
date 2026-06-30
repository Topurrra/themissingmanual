---
title: "gitignore, LFS, and Submodules"
guide: "gitignore-lfs-submodules"
phase: 0
summary: "Keep junk, secrets, and giant files out of your repo, and tame the submodule: the settings that stop you committing node_modules or a 2GB video."
tags: [git, gitignore, git-lfs, submodules, secrets, large-files]
category: version-control
order: 5
difficulty: intermediate
synonyms: ["how to use gitignore", "stop tracking a file in git", "git ignore not working", "remove file from git but keep it", "git lfs large files", "what are git submodules", "git submodule detached head", "accidentally committed secret to git"]
updated: 2026-06-30
---

# gitignore, LFS, and Submodules

Your repo should hold your work and nothing else. But somehow it keeps filling up with junk: a `node_modules/` folder the size of a small planet, build output, an `.env` file with a live API key in it, a 2GB demo video that makes every clone crawl. And then there's the submodule - that nested repo someone added that now shows up as a confusing single line in your diff and dumps you into "detached HEAD" the moment you `cd` into it.

This guide is about the three tools that draw the line between *your work* and *everything else*: the ignore file (what Git pretends not to see), Git LFS (how to version huge binaries without bloating history), and submodules (a repo inside a repo, with all the pain that implies). By the end you'll know why a file you ignored *still* shows up, how to get a leaked secret out, and when a submodule is the right call versus a trap.

## How to read this

Read the phases in order - each builds on the last. Phase 1 gives you the mental model for all three (what Git is actually tracking, and why "ignore" is narrower than you think). Phase 2 is the everyday core: writing ignore patterns that work, untracking files, and reaching for LFS when a binary is too big. Phase 3 is where it bites: leaked secrets, submodule detached-HEAD pain, and knowing when to walk away from a submodule entirely.

If you're new to how Git tracks files at all, skim [/guides/git-from-zero](/guides/git-from-zero) first - this guide assumes you've committed before.

## The phases

1. [What Git tracks (and what "ignore" really means)](01-what-git-tracks.md)
2. [Ignoring, untracking, and LFS for big files](02-ignoring-untracking-lfs.md)
3. [Leaked secrets and the submodule trap](03-secrets-and-submodules.md)

[Phase 1: What Git tracks (and what "ignore" really means)](01-what-git-tracks.md) →
