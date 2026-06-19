---
title: "The Filesystem, Explained"
guide: "the-filesystem-explained"
phase: 0
summary: "A filesystem is the tree of files and folders the OS lays over raw numbered storage; a path is an address into that tree, permissions decide who may touch each file, and a few simple rules explain almost every 'file not found' or 'permission denied' you'll ever hit."
tags: [filesystem, files, folders, paths, permissions, ownership, beginner-friendly]
category: operating-systems
order: 2
difficulty: beginner
synonyms: ["what is a filesystem", "what is a file path", "absolute vs relative path", "what does permission denied mean", "what is the home folder", "windows path vs linux path", "what are hidden files", "how to find a file"]
updated: 2026-06-19
---

# The Filesystem, Explained

You've saved a file and then couldn't find it. You've typed a path and gotten "no such file or directory." You've tried to edit something and been told "permission denied," with no idea what you did wrong. None of that is you being bad at computers — it's that nobody ever showed you what a filesystem actually *is*. This guide fixes that: by the end you'll picture the whole tree in your head, read any path like a street address, and know exactly why those errors happen and how to clear them.

## How to read this
- **Stuck on an error right now?** Jump to [Phase 3: Where Things Live & Finding Them](03-where-things-live.md) and use the gotcha cheat at the top — "file not found," "permission denied," and `\` vs `/` are all there.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: first the tree, then who's allowed to touch it, then how the OS actually finds your stuff.

## The phases
1. **[What a Filesystem Is](01-what-a-filesystem-is.md)** — the disk is dumb numbered storage; the OS lays a tree of folders and files on top, and a path is an address into that tree.
2. **[Permissions & Ownership](02-permissions-and-ownership.md)** — every file has an owner and rules for who can read, write, or run it. This is why "permission denied" happens, and what it's protecting.
3. **[Where Things Live & Finding Them](03-where-things-live.md)** — how a path becomes real bytes, what hidden files and extensions really are, where standard things live, and how to find anything — plus a cheat for the three classic errors.

> This guide is about *navigating and understanding* the filesystem. The deeper machinery — how the disk is partitioned, what ext4 / NTFS / APFS actually do on the metal, symbolic links, and mounting drives — is deferred to a follow-up guide so this one stays a clear first map, not a manual.
