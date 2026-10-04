---
title: "Making Omarchy Comfortable"
guide: "making-omarchy-comfortable"
phase: 0
summary: "Learn where Omarchy keeps your settings and how updates treat them, then change keybindings in Lua, tune keyboard, trackpad and monitor scaling, and restyle themes, fonts, and the bar without breaking anything."
tags: [omarchy, hyprland, configuration, dotfiles, keybindings, lua, themes, monitors, customization]
category: omarchy
order: 7
difficulty: intermediate
synonyms: ["how to customize omarchy", "omarchy config files", "how to change keybindings in omarchy", "omarchy bindings.lua", "omarchy natural scrolling", "omarchy monitor scaling", "omarchy change theme and font", "will omarchy updates overwrite my config", "omarchy dotfiles explained", "how to reset omarchy config"]
updated: 2026-10-04
---

# Making Omarchy Comfortable

Checked against Omarchy 4.0.4. You have a working desktop, and a dozen small things feel wrong: a key you reach for does nothing, the scroll direction is backwards, the text is tiny on your 4K screen, the bar shows things you never use. On Windows or macOS you would open a settings app. On Omarchy you edit plain-text files, and the fear is real: what if I break it, and what if the next update wipes my work?

This guide removes both fears. First you learn which files are yours and exactly how updates treat them, including the safety nets that undo a bad edit. Then you change things in order of how often people need them: keybindings, keyboard and trackpad, monitors, and finally the look.

## Prerequisite

You should be able to open a terminal and a file in it. If not, read [The Terminal and Shell](/guides/the-terminal-and-shell) and [Editing in the Terminal](/guides/editing-in-the-terminal) first (Omarchy opens config files in Neovim by default, and `:wq` is how you save and quit). The menu and hotkey basics are in [Omarchy Menus, Panels, and the CLI](/guides/omarchy-menus-panels-and-cli).

## How to read this

- **One specific itch?** Keybinding: jump to [Phase 2](02-changing-and-adding-keybindings.md). Scroll direction, layout, or key repeat: [Phase 3](03-keyboard-mouse-and-screens.md). Colors, fonts, or the bar: [Phase 4](04-themes-fonts-and-the-bar.md).
- **Want to edit without fear?** Read [Phase 1](01-whose-files-are-whose.md) first. That phase saves you from the one real mistake: editing a file Omarchy owns.

## The phases

1. **[Whose Files Are Whose](01-whose-files-are-whose.md)** - what Omarchy owns, what you own, how updates treat each, and how to undo a bad edit.
2. **[Changing and Adding Keybindings](02-changing-and-adding-keybindings.md)** - `bindings.lua` in Lua: add, change, and disable bindings.
3. **[Keyboard, Mouse, and Screens](03-keyboard-mouse-and-screens.md)** - `input.lua` and `monitors.lua`: layouts, repeat rate, natural scrolling, scaling, and text size.
4. **[Themes, Fonts, and the Bar](04-themes-fonts-and-the-bar.md)** - themes, backgrounds, fonts, the prompt, the bar, and `looknfeel.lua` tweaks.

Where Omarchy's sibling guides go deeper: the terminal itself is in [The Omarchy Terminal Workflow](/guides/the-omarchy-terminal-workflow), installing software is in [Installing and Updating Software on Omarchy](/guides/installing-and-updating-software-on-omarchy), recovery after a bad update is in [When Omarchy Breaks](/guides/when-omarchy-breaks), and writing code that extends the bar is in [Building Your Own Omarchy Plugin](/guides/building-your-own-omarchy-plugin).
