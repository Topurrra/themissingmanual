---
title: "Reading Legacy Code"
guide: "reading-legacy-code"
phase: 0
summary: "How to make sense of an unfamiliar, undocumented codebase without reading it top to bottom — and how to tell when it actually needs a rewrite."
tags: [legacy-code, codebase, onboarding, git, refactoring, beginner-friendly]
category: working-as-a-developer
order: 2
difficulty: beginner
synonyms: ["how to read unfamiliar code", "understanding a legacy codebase", "how to learn a new codebase", "should I rewrite this code", "git blame for understanding code"]
updated: 2026-07-06
---

# Reading Legacy Code

You're dropped into a codebase with no comments, no docs, and the person who wrote it left two years ago. This is normal work, not a crisis — and there's a method to it.

Most of a developer's career is spent reading code someone else wrote, not writing new code on a blank page. "Legacy" doesn't mean bad. It means: written by someone who isn't you, for reasons that aren't written down, that you now have to change without breaking.

This guide covers three things:

1. **Where to start** when the whole codebase feels like an undifferentiated wall of files — pick one thread and pull it.
2. **Techniques for building understanding** — using git history as archaeology, writing a safety-net test before you touch anything, and using small refactors to learn by doing.
3. **When a rewrite is actually justified** versus when it's the sunk-cost fallacy wearing an engineering hat, using Chesterton's Fence as the test.

None of this requires the original author, a design doc, or weeks of read-only ramp-up. It requires picking a starting point and being disciplined about how you poke at the unknown.

- [Phase 1: Where to Start When You Don't Understand Any of It](01-where-to-start.md)
- [Phase 2: Techniques for Making the Unknown Known](02-techniques-for-understanding.md)
- [Phase 3: When (and When Not) to Rewrite](03-when-to-rewrite.md)
