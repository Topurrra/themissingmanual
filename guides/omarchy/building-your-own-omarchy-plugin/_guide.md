---
title: "Building Your Own Omarchy Plugin"
guide: "building-your-own-omarchy-plugin"
phase: 0
summary: "Build, test, and publish an Omarchy plugin: manifest and layout, the clone-edit-validate loop, wiring into the bar, menu, keybindings and theme, the safety rules, and listing it on the marketplace."
tags: [omarchy, plugins, development, quickshell, manifest, marketplace]
category: omarchy
order: 11
difficulty: advanced
synonyms: ["how to build an omarchy plugin", "omarchy plugin manifest.json", "create omarchy bar widget", "omarchy plugin development guide", "publish omarchy plugin marketplace", "omarchy plugin validate", "omarchy plugin clone", "write a quickshell plugin for omarchy"]
updated: 2026-10-04
---

# Building Your Own Omarchy Plugin

You have a small itch: a widget the bar does not have, a panel that shows the one thing you check forty times a day. On Omarchy 4 you do not fork the desktop to scratch it. You copy a built-in plugin into your own folder, change it, and the desktop reloads it as you save.

This guide walks the full path: what a plugin is made of, the development loop the official docs describe, how it hooks into the menu, keys, and theme, the safety rules, and how to publish. Checked against Omarchy 4.0.4.

## Prerequisite

Read [Omarchy Plugins and the Marketplace](/guides/omarchy-plugins-and-the-marketplace) first. It explains the trust model that the safety rules in Phase 3 build on. You also need a terminal comfortable enough for editing files and running commands ([The Terminal and Shell](/guides/the-terminal-and-shell)) and basic git ([Git From Zero](/guides/git-from-zero)), since a plugin is a git repo.

Plugin UI code is QML, the declarative language of Qt Quick that Quickshell uses. This guide teaches the plugin structure and workflow, not QML itself: you will start from working built-in code and change it.

## How to read this

- **Want a working widget fast?** Phase 2 is the loop, and it starts from a built-in clone.
- **Planning to share it?** Do not skip Phases 3 and 4. Safety and publishing are where plugins get rejected or cause harm.

## The phases

1. **[Anatomy of a Plugin](01-anatomy-of-a-plugin.md)** - the manifest, the six kinds, entry points, and what a plugin repository looks like.
2. **[The Development Loop](02-the-development-loop.md)** - clone a built-in, edit, validate, run, and read the logs when it misbehaves.
3. **[Integrating With the Desktop, Safely](03-integrating-with-the-desktop-safely.md)** - bar placement, summoning, keybindings, menu rows, theme tokens, launching apps, and the safety rules.
4. **[Testing and Publishing](04-testing-and-publishing.md)** - a pre-flight checklist, the permanent id, and listing on plugins.omarchy.org.

Sibling guides: [Making Omarchy Comfortable](/guides/making-omarchy-comfortable) for `bindings.lua`, and [When Omarchy Breaks](/guides/when-omarchy-breaks) if an experiment leaves the desktop in a bad state.
