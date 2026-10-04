---
title: "Your First Week"
guide: "omarchy-for-windows-macos-and-ubuntu-users"
phase: 4
summary: "The ten hotkeys to learn on day one, four ways to look up everything else, and a two-week plan that takes you from fumbling to comfortable without trying to memorize the whole hotkey list."
tags: [omarchy, hotkeys, day-one, learning-plan, cheat-sheet, getting-started]
difficulty: beginner
synonyms: ["omarchy essential hotkeys", "omarchy hotkeys for beginners", "omarchy cheat sheet", "how long to get used to omarchy", "omarchy first day", "omarchy learn keybindings", "omarchy where to get help", "omarchy beginner guide"]
updated: 2026-10-04
---

# Your First Week

Omarchy has a long hotkey table, and trying to memorize it is the wrong plan. The manual's advice is to give it two weeks, skim the hotkeys once, and use `Super + K` whenever a binding slips. This phase gives you the short list worth learning on day one, the places to look up the rest, and an order to learn things in.

## The ten to learn on day one

These cover launching, closing, moving around, copying, and capturing. Everything else can wait.

| # | Hotkey | What it does |
|---|---|---|
| 1 | `Super + Space` | Omarchy menu: apps, settings, installs, everything |
| 2 | `Super + K` | Show every main keybinding |
| 3 | `Super + Return` | Open a terminal |
| 4 | `Super + Shift + Return` | Open the browser |
| 5 | `Super + W` | Close the window (and quit the app) |
| 6 | `Super + Arrow` | Move focus to the window in that direction |
| 7 | `Super + 1/2/3/4` | Jump to a workspace |
| 8 | `Super + Shift + 1/2/3/4` | Send the focused window to that workspace |
| 9 | `Super + C` and `Super + V` | Copy and paste, everywhere including the terminal |
| 10 | `Print Screen` | Take a screenshot |

With these ten you can open apps, switch between them, close them, move text around, and capture the screen. The next tier is in the same neighborhood: `Super + Shift + Arrow` swaps windows, `Super + F` goes full screen, `Super + Ctrl + V` opens clipboard history, `Super + Ctrl + L` locks the machine. Swapping and full screen are explained in [Tiling Windows and Workspaces](/guides/omarchy-tiling-windows-and-workspaces). Clipboard history is in Phase 3 of this guide, and locking is in Phase 2.

## Four places to look things up

1. **`Super + K`.** The keybindings, on your own machine, at your own version. This is the first stop.
2. **The Omarchy menu.** `Super + Space`, then browse. The _Learn_ entry opens the keybindings, the Omarchy manual, the Hyprland wiki, the Arch wiki, LazyVim keymaps, a bash cheatsheet, and the Tmux keybindings.
3. **The manual.** [omarchy.org/manual](https://omarchy.org/manual/) covers every chapter, including the full [hotkeys table](https://omarchy.org/manual/hotkeys/).
4. **The community.** The manual points to the `#omarchy-help` channel on the Omarchy Discord for questions the manual does not answer.

> ⚠️ **Gotcha.** Omarchy changed substantially in version 4. Older blog posts, videos, and cheat sheets may describe a different launcher, a different bar, and a different config format. Prefer the manual and `Super + K`, and when a tutorial disagrees with them, trust them.

## A two-week plan

You do not need to follow this to the day. The shape is what matters: learn the small set, use it until it is automatic, then add.

**Days 1 to 2: survive.** Use the ten hotkeys and nothing else. Open the menu, look at the entries, and open an app from there each time you are unsure. Press `Super + K` as often as you want.

**Days 3 to 5: let windows tile.** Resist floating windows with `Super + T`. Open three or four windows on one workspace, swap them with `Super + Shift + Arrow`, and move one to another workspace. This is the phase where the tiling idea clicks, and [Tiling Windows and Workspaces](/guides/omarchy-tiling-windows-and-workspaces) is the guide for it.

**Days 6 to 9: learn the panels and the bar.** `Super + Ctrl + A` opens audio, `Super + Ctrl + W` opens network, `Super + Ctrl + B` opens Bluetooth, `Super + Ctrl + D` opens display, and `Super + Ctrl + P` opens power. [Menus, Panels, and the CLI](/guides/omarchy-menus-panels-and-cli) is the guide for those.

**Days 10 to 14: make it yours.** Open _Setup_ from the menu and read what is there. Change one small thing: a theme, a font, a monitor setting. Software and updates are in [Installing and Updating Software on Omarchy](/guides/installing-and-updating-software-on-omarchy), and the config files are in [Making Omarchy Comfortable](/guides/making-omarchy-comfortable).

## The terminal will matter more

You will spend more time in the terminal than you did on Windows or macOS. If it still feels like a wall, [The Terminal and Shell](/guides/the-terminal-and-shell) and [Editing in the Terminal](/guides/editing-in-the-terminal) are where to start. For Omarchy's own terminal setup, [The Omarchy Terminal Workflow](/guides/the-omarchy-terminal-workflow) comes next.

## Your turn: write your own card

A card you wrote is worth more than any list you read.

```exercise
[
  {
    "type": "task",
    "task": "Write your own day-one card. On paper or in a text file, list the ten hotkeys from the table, but write each one next to the thing you used to do. For example: `Super + Space` next to 'Start menu' or 'Spotlight'. Then close the card and recall all ten from memory. Press `Super + K` for any you miss.",
    "reveal": "Each hotkey has a natural pairing with an old habit: Super + Space for the Start menu or Spotlight, Super + W for closing or quitting, Super + 1/2/3/4 for virtual desktops or Spaces, Print Screen for the snipping tool, Super + C and Super + V for copy and paste.",
    "checklist": ["Wrote all ten hotkeys", "Paired each with an old habit", "Recalled at least eight from memory", "Used Super + K for the rest"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "A friend sends you an old cheat sheet for a different Omarchy version and one hotkey does not work. What do you do?",
    "choices": [
      "Assume your install is broken and reinstall",
      "Press Super + K and trust the list on your own machine",
      "Edit the config file until the old hotkey works"
    ],
    "answer": 1,
    "explain": "Super + K shows the bindings your install actually has. Omarchy 4 changed a lot, so older cheat sheets can be out of date."
  },
  {
    "q": "Which of these is NOT in the ten day-one hotkeys?",
    "choices": ["Super + W", "Super + Shift + Return", "Super + Ctrl + L"],
    "answer": 2,
    "explain": "Super + Ctrl + L locks the computer. It is useful but comes after the ten: open apps, close windows, move focus, switch workspaces, copy and paste, and screenshots."
  },
  {
    "q": "According to the manual, which hotkey is the only one you actually have to memorize?",
    "choices": ["Super + Space", "Super + K", "Super + Return"],
    "answer": 1,
    "explain": "Super + K lists every binding, so memorizing it means you can recover any other hotkey."
  }
]
```

## Recap

1. Learn ten hotkeys on day one: the menu, the keybinding list, terminal, browser, close, focus, workspace jump, workspace send, copy and paste, and `Print Screen`.
2. Look things up with `Super + K` first, then the menu's _Learn_ entry, then the manual, then the Discord.
3. Treat anything written before Omarchy 4 as possibly outdated.
4. Spend the first two weeks surviving, tiling, using the panels, and then customizing.

You have the map. Continue with [Tiling Windows and Workspaces](/guides/omarchy-tiling-windows-and-workspaces) to make the windows behave.
