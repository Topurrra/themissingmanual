---
title: "Omarchy Plugins and the Marketplace"
guide: "omarchy-plugins-and-the-marketplace"
phase: 0
summary: "What an Omarchy plugin really is, why it runs with all your access, how to judge one before you install it, the real omarchy plugin commands, and a worked install of The Missing Manual plugin."
tags: [omarchy, plugins, marketplace, quickshell, security, omarchy-shell]
category: omarchy
order: 9
difficulty: intermediate
synonyms: ["what are omarchy plugins", "how to install an omarchy plugin", "omarchy plugin marketplace", "are omarchy plugins safe", "omarchy plugin add command", "how to remove an omarchy plugin", "omarchy shell plugins", "plugins.omarchy.org"]
updated: 2026-10-04
---

# Omarchy Plugins and the Marketplace

A phone app or a browser extension runs in a sandbox, with permission prompts in front of it. On Omarchy, the bar at the top of your screen, the menu you open with `Super + Space`, and the lock screen are all plugins, and the plugins you add from the internet get no such sandbox. They run as you.

That sounds alarming and is manageable once you know the model. This guide explains what a plugin is, how to decide whether to trust one, the commands that manage them, and walks through installing a real one end to end. Checked against Omarchy 4.0.4.

## Prerequisite

You should be comfortable opening a terminal and running commands. If not, start with [The Terminal and Shell](/guides/the-terminal-and-shell). It also helps to know what the Omarchy menu and the `omarchy` command are: see [Omarchy Menus, Panels and the CLI](/guides/omarchy-menus-panels-and-cli).

## How to read this

- **Want to install something right now?** Read [Phase 2](02-finding-judging-and-managing-plugins.md) first for the review habit and the commands, then [Phase 3](03-worked-example-the-missing-manual-plugin.md).
- **Want it to make sense?** Read in order. The trust model in Phase 1 is the reason every later step looks the way it does.

## The phases

1. **[What a Plugin Is, and What It Can Reach](01-what-a-plugin-is-and-what-it-can-reach.md)** - one shell process, plugin kinds, and the plain truth about trust.
2. **[Finding, Judging, and Managing Plugins](02-finding-judging-and-managing-plugins.md)** - the marketplace, a review checklist, and every `omarchy plugin` command.
3. **[Worked Example: The Missing Manual Plugin](03-worked-example-the-missing-manual-plugin.md)** - review, enable, and remove a real plugin, and see what removal leaves behind. Daily use of it has its own guide, [The Missing Manual on Omarchy](/guides/the-missing-manual-on-omarchy).

Writing your own plugin is a separate skill, covered in [Building Your Own Omarchy Plugin](/guides/building-your-own-omarchy-plugin). If a plugin misbehaves, [When Omarchy Breaks](/guides/when-omarchy-breaks) is the recovery guide.
