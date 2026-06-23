---
title: "macOS Under the Hood"
guide: "macos-under-the-hood"
phase: 0
summary: "macOS is a polished Unix machine — Darwin and the XNU kernel underneath, a real Unix filesystem hiding beneath the Finder, apps that are secretly folders, and a Terminal that feels like Linux because it nearly is."
tags: [macos, unix, darwin, xnu, terminal, filesystem, homebrew, launchd]
category: operating-systems
order: 7
difficulty: intermediate
synonyms: ["is macos unix", "what is darwin macos", "macos filesystem explained", "what is a .app bundle", "macos vs linux", "what is launchd", "what is sip macos", "macos library folder"]
updated: 2026-06-19
---

# macOS Under the Hood

You've used a Mac for years. You know the Dock, Spotlight, Finder, the satisfying *thunk* of the trash.
But the first time you opened the Terminal, something felt strange — it looked exactly like the Linux
boxes at work, the same `ls` and `cd` and `/usr/bin`, as if there were a whole second computer hiding
behind the wallpaper. There is. macOS is a genuine Unix system wearing a beautiful coat, and once you
can see the machine underneath, the Mac stops being a sealed appliance and becomes something you can
actually reason about.

This guide is the tour under the hood — not to make you a kernel hacker, but so the next time you open
Terminal, install a tool, or hit a permission wall, you know *what you're standing on*.

> ⏭️ New to operating systems in general? Read [What an Operating System Is](/guides/what-an-operating-system-is)
> first — this guide assumes you know what a kernel and a process are, and builds on its
> Windows-vs-macOS-vs-Linux comparison.

## How to read this
- **Want the big idea fast?** Phase 1 is the one that reframes everything: macOS *is* Unix. Read it and
  the rest will click.
- **Want it to finally make sense?** Read in order — each phase builds on the last, from the foundation
  up to the surface you already know.

## The phases
1. **[macOS Is Unix](01-macos-is-unix.md)** — the Darwin foundation, the XNU kernel, the BSD heritage,
   and the real Unix filesystem (`/`, `/usr`, `/etc`, `/Users`) hiding under the Finder's friendly view.
2. **[Apps, Bundles & Where Things Live](02-apps-bundles-and-where-things-live.md)** — why a `.app` is
   actually a folder, the several `Library` folders and what lives in each, and installing real CLI tools
   with Homebrew.
3. **[Under the Surface](03-under-the-surface.md)** — the Terminal and zsh, `launchd` as macOS's service
   manager, the security layers a power user meets (Gatekeeper, SIP, permission prompts), and a short
   "where macOS differs from Linux" wrap-up.

> We deliberately stop at the *power-user* depth. Writing kernel extensions, code-signing your own apps,
> and the deep guts of APFS are their own guides — this one gets you a true working mental model of the
> Mac as a Unix machine, and stops there.
