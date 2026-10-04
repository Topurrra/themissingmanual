---
title: "The Omarchy Terminal Workflow"
guide: "the-omarchy-terminal-workflow"
phase: 0
summary: "Learn the terminal setup Omarchy ships - Foot, the shell tools, tmux, Neovim, the TUIs, and the dev tools - so you can work from the keyboard with sessions that survive closing the window."
tags: [omarchy, terminal, tmux, neovim, shell, tui, development, docker, mise]
category: omarchy
order: 8
difficulty: intermediate
synonyms: ["omarchy terminal setup", "how to use tmux in omarchy", "omarchy neovim lazyvim basics", "omarchy shell tools", "omarchy tdl layout", "omarchy lazygit lazydocker btop", "omarchy docker without sudo", "omarchy mise install node python", "omarchy foot terminal tabs", "omarchy dev environment"]
updated: 2026-10-04
---

# The Omarchy Terminal Workflow

Checked against Omarchy 4.0.4. Omarchy is built around the terminal, and it shows. A fresh install has a fast terminal with no tabs, a session manager with a key you have never pressed, an editor that starts in a mode where typing does nothing, and a pile of command names (`ff`, `tdl`, `rg`, `lsa`) you did not choose. Nobody hands you a map.

This guide is the map. You learn what each piece is for, the handful of keys that matter, and how they fit together into a workflow where closing a window never loses your work.

## Prerequisite

Comfort with the basics of a shell. If a command prompt still feels foreign, start with [The Terminal and Shell](/guides/the-terminal-and-shell), then [Linux From Zero](/guides/linux-from-zero). For the editor, [Editing in the Terminal](/guides/editing-in-the-terminal) teaches vim modes properly, and this guide leans on it instead of repeating it. The hotkeys and menu are in [Omarchy Menus, Panels, and the CLI](/guides/omarchy-menus-panels-and-cli).

## How to read this

- **In a hurry?** Jump to [Phase 2](02-tmux-sessions-windows-and-panes.md) for tmux, the single biggest upgrade, or [Phase 4](04-tuis-and-development-tools.md) for Docker and language setup.
- **Want it to make sense?** Read in order. Each phase uses the one before it.

## The phases

1. **[Your Terminal and Shell Toolkit](01-your-terminal-and-shell-toolkit.md)** - Foot, copy and paste, and the shell tools and functions Omarchy ships.
2. **[Tmux: Sessions, Windows, and Panes](02-tmux-sessions-windows-and-panes.md)** - persistent sessions, the keys that matter, and the dev layouts.
3. **[Neovim the Omarchy Way](03-neovim-the-omarchy-way.md)** - the LazyVim setup, the keys worth learning first, and the alternatives.
4. **[TUIs and Development Tools](04-tuis-and-development-tools.md)** - lazygit, lazydocker, btop, mise, Docker, databases, and AI agents.

To change how any of this looks, see [Making Omarchy Comfortable](/guides/making-omarchy-comfortable). To install more software, see [Installing and Updating Software on Omarchy](/guides/installing-and-updating-software-on-omarchy).
