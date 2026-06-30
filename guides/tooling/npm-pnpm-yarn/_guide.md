---
title: "npm, pnpm, and Yarn"
guide: "npm-pnpm-yarn"
phase: 0
summary: "Node package managers explained: package.json, the lockfile that pins your real dependency tree, semver ranges, and why pnpm's content-addressed store is so fast."
tags: [npm, pnpm, yarn, nodejs, package-manager, lockfile, semver, node_modules, workspaces]
category: tooling
group: "Build & Package Managers"
order: 9
difficulty: intermediate
synonyms: ["npm vs yarn vs pnpm", "what is package-lock.json", "what does the caret mean in package.json", "why is node_modules so big", "npm install vs npm ci", "what is a lockfile", "pnpm symlink store explained", "semver caret tilde meaning", "monorepo workspaces nodejs"]
updated: 2026-06-30
---

# npm, pnpm, and Yarn

You ran `npm install`, watched a thousand packages scroll by, and ended up with a `node_modules` folder the size of a small planet and a `package-lock.json` you've never opened. Then a teammate's machine builds something subtly different from yours, a "patch" upgrade breaks the app overnight, and someone suggests switching to pnpm "because it's faster" — without anyone explaining *why*.

This guide untangles all of it. By the end you'll know exactly what `package.json` declares versus what the lockfile *pins*, why a caret can hand you a surprise upgrade, what makes pnpm's store fast and strict at the same time, and how to pick the right tool without cargo-culting. Same mental model underneath all three managers — once you see it, the differences stop being mysterious and become a short list of trade-offs.

## How to read this

- **Want the whole thing to click?** Read in order. The first phase installs the one distinction — *declaration* versus *lockfile* — that the other two lean on.
- **Already burned by a surprise upgrade or a bloated `node_modules`?** Phase 3 is the gotchas-and-production phase: semver traps, `install` vs `ci`, and why pnpm's layout catches bugs npm silently allows.

## The phases

1. **[The Manifest and the Lockfile](01-manifest-and-lockfile.md)** — `package.json` is your *wish list*; the lockfile is the *receipt* that pins the exact tree you actually got. Why both exist, and why the lockfile is the truth.
2. **[Installing, Updating, and Workspaces](02-installing-and-workspaces.md)** — the everyday commands across all three managers, how semver ranges decide what an update does, and how one repo can hold many packages with workspaces.
3. **[node_modules, the pnpm Store, and the Gotchas](03-store-and-gotchas.md)** — why `node_modules` got so big, how pnpm's content-addressed store makes installs fast and disk-cheap, the strictness that catches phantom dependencies, and the traps that bite everyone.

[Phase 1: The Manifest and the Lockfile](01-manifest-and-lockfile.md) →
