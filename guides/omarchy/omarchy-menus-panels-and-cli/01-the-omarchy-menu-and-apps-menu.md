---
title: "The Omarchy Menu and the Apps Menu"
guide: "omarchy-menus-panels-and-cli"
phase: 1
summary: "The Omarchy menu on Super + Space is a filterable, nested command palette that launches apps and changes settings; this phase maps its ten top-level entries and shows how to jump straight to any of them."
tags: [omarchy, omarchy-menu, launcher, hotkeys, command-palette, beginner-friendly]
difficulty: beginner
synonyms: ["omarchy super space menu", "how to open apps in omarchy", "omarchy app launcher", "omarchy menu setup install update", "how to find omarchy hotkeys", "omarchy apps menu super alt space", "add my own entry to the omarchy menu"]
updated: 2026-10-04
---

# The Omarchy Menu and the Apps Menu

There is no Start button, no Dock, and no desktop full of icons. When Omarchy first boots, the manual itself says you cannot do a thing with the mouse alone. What you can do is press `Super + Space`, and almost everything opens from there.

This phase gives you the layout of that menu, so "where is the setting for X" has a short list of possible answers instead of a hundred.

## What the menu actually is

The Omarchy menu is a native command palette drawn by the Omarchy shell. Think of Spotlight on macOS or the Windows Start search, but merged with the Settings app, the app store, and the power menu. You type, the list filters, and you press `Return`.

Two details matter:

- **It launches apps and runs settings from the same box.** Version 4 merged the old split between a launcher and a menu. If an older guide describes a separate launcher, it is describing an earlier release.
- **Typing searches inside submenus too.** You do not have to walk the tree. Typing part of a name finds it even when it is nested a level or two down.

`Super` is the Windows key on a PC keyboard. On a Mac keyboard it sits where Command was.

## The ten top-level entries

Open the menu and you see the same ten rows, in this order.

| Entry | What it is for | What is inside (v4.0.4) |
|---|---|---|
| **Apps** | Starting installed applications | Your installed apps |
| **Learn** | Reading the docs without leaving the desktop | Keybindings, the Omarchy manual, the Hyprland wiki, the Arch wiki, LazyVim keymaps, a Bash cheatsheet, Tmux and Herdr keybindings, the community Discord |
| **Trigger** | Doing something right now | Emoji, Reminder, Capture, Transcode, Share, Toggle, Hardware, Speed Test |
| **Style** | How things look | Theme, Background, Font, Menu Bar, Hyprland, Screensaver |
| **Setup** | How things behave | Monitors, Keybindings, Input, Network, Defaults, Plugins, Security, Config, Direct Boot, Reset Computer |
| **Install** | Adding software | Package, AUR, Web App, TUI, Service, Development, Editor, Terminal, Browser, AI, Gaming, and more |
| **Remove** | Taking software away | Package, Web App, TUI, Theme, Development, Browser, and more |
| **Update** | Keeping the system current | Omarchy, Channel, Config, Process, Hardware, Firmware, Password, Timezone, Time |
| **About** | System information | Opens the system info screen |
| **System** | Leaving the session | Screensaver, Lock, Suspend, Hibernate, Logout, Reboot, Shutdown |

A way to remember the middle of the list: **Trigger** is a verb you do now, **Style** changes appearance, **Setup** changes behavior, and **Install**, **Remove**, **Update** are the life of your software. That grouping is a memory aid, not something the manual says, but it matches how the entries are filled.

Some rows only show up when they apply. Suspend hides itself if you have turned suspend off, and Hibernate hides itself when your machine cannot hibernate.

## The Apps menu is the same menu, narrowed

`Super + Alt + Space` opens the **apps-only** menu. It is the same palette, started on the Apps entry, so a stray letter cannot land you on a setting. When you only want to launch something, this is the faster door.

Everything else in the list above is reachable the same way. Several submenus have their own direct hotkey:

| Hotkey | Opens |
|---|---|
| `Super + Space` | The Omarchy menu, from the top |
| `Super + Alt + Space` | The apps-only menu |
| `Super + Escape` | The System menu (lock, reboot, shutdown) |
| `Super + Ctrl + O` | The Toggle menu (under Trigger) |
| `Super + Ctrl + C` | The Capture menu (screenshots and recording) |
| `Super + Ctrl + H` | The Hardware menu (under Trigger) |
| `Super + Ctrl + S` | The Share menu (LocalSend) |
| `Super + Ctrl + Shift + Space` | The theme picker |
| `Super + Ctrl + Space` | The background picker |

You do not need to memorize that table. It shows a pattern: a hotkey exists for the thing you reach for daily, and the menu covers the long tail.

## When the menu opens a file

Several Setup entries do not show a form. They open a plain text file in your editor. _Setup > Monitors_ opens `monitors.lua`, _Setup > Keybindings_ opens `bindings.lua`, and _Setup > Input_ opens `input.lua`.

The default editor is Neovim. To save and leave, type `:wq` and press `Return`. When you close the editor, Omarchy restarts whatever needs restarting so the change takes effect. That is how Omarchy replaces the Settings window: the settings are files, and the menu is a shortcut to the right file. [Making Omarchy Comfortable](/guides/making-omarchy-comfortable) goes into what to put in them, and [Editing in the Terminal](/guides/editing-in-the-terminal) helps if Neovim is new.

## Forgot a hotkey? Ask the system

Press `Super + K`. It shows every main keybinding in a searchable list. The same list is under _Learn > Keybindings_. The manual's advice is to skim the hotkeys once, then use `Super + K` whenever a binding slips, and calls it the only hotkey you have to memorize.

Two sibling lists exist for terminal tools: `Super + Alt + K` shows Tmux bindings, and `Super + Ctrl + K` shows Herdr bindings.

From a terminal, the same information prints with a command:

```bash
omarchy menu keybindings --print
```

Your own overrides live in `~/.config/hypr/bindings.lua`, and that list reflects them.

## Driving the menu from a terminal

The menu has a command, which is handy for your own keybindings and scripts. These forms come from the manual:

```bash
omarchy menu                      # open the menu at the root
omarchy menu summon style.theme   # jump straight to the theme picker
omarchy menu toggle system        # open the System menu, or close it if already open
omarchy menu close                # put the menu away
```

The words after `summon` are the entry's dotted id. `style.theme` means "the Theme row under Style", which is the same shape as the _Style > Theme_ path you click through.

## Adding your own row

You can extend the menu without touching Omarchy's files. Create `~/.config/omarchy/extensions/omarchy-menu.jsonc`. It is JSONC, which is JSON that allows comments. Each entry is keyed by a dotted id, and the id decides where it lands in the tree. Reusing an existing id overrides that row.

The manual's example adds a top-level "Personal" entry with a Notes row under it:

```json
{
  "personal": { "label": "Personal" },
  "personal.notes": { "label": "Notes", "action": "omarchy-launch-editor ~/notes" }
}
```

The manual's own example also gives each row an icon glyph, and the file Omarchy ships documents every field in comments, so read that before adding more.

⚠️ **Gotcha.** Do not edit the menu definition under `/usr/share/omarchy`. Omarchy owns that folder, and a package update overwrites it. Your files under `~/.config` are yours, and updates leave them alone.

## Your turn: find three things

Use the menu, not a search engine. This takes about two minutes and builds the map in your head.

```exercise
[
  {
    "type": "predict",
    "task": "Which hotkey opens the apps-only menu? Write it the way this guide does, for example `Super + Space`.",
    "accept": ["/^super\\s*\\+\\s*alt\\s*\\+\\s*space$/i"],
    "hint": "It is the Omarchy menu hotkey with one extra modifier held down."
  },
  {
    "type": "task",
    "task": "Without leaving the menu, find: (1) the entry that lists every keybinding, (2) the entry that opens your monitors file, (3) the entry that installs a package.",
    "reveal": "(1) Learn > Keybindings, (2) Setup > Monitors, (3) Install > Package.",
    "checklist": ["Found Learn > Keybindings", "Found Setup > Monitors", "Found Install > Package"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You want to start an application and do not want to risk landing on a setting. Which door is best?",
    "choices": [
      "Super + Alt + Space, the apps-only menu",
      "Super + Escape, the System menu",
      "Super + Ctrl + O, the Toggle menu"
    ],
    "answer": 0,
    "explain": "The apps-only menu is the same palette started on the Apps entry. The other two open the System and Toggle menus.",
    "why": [null, "That menu holds lock, suspend, reboot, and shutdown, not applications.", "That menu holds mode switches such as night light, not applications."]
  },
  {
    "q": "You choose Setup > Keybindings. What happens?",
    "choices": [
      "A settings window with a list of shortcuts opens",
      "Your bindings.lua file opens in your editor, and Omarchy restarts what needs it when you close the editor",
      "Omarchy resets every shortcut to its default"
    ],
    "answer": 1,
    "explain": "Setup entries for monitors, keybindings, and input open the real config file. The settings are files, and the menu is a shortcut to them."
  },
  {
    "q": "Where should your own extra menu rows live?",
    "choices": [
      "In /usr/share/omarchy, next to the default menu",
      "In ~/.config/omarchy/extensions/omarchy-menu.jsonc",
      "Inside the Omarchy shell's source code"
    ],
    "answer": 1,
    "explain": "Files under /usr/share/omarchy belong to Omarchy and are overwritten by updates. Extensions under ~/.config are yours."
  }
]
```

## Recap

1. `Super + Space` opens one menu that both launches apps and changes settings, and typing filters it, nested rows included.
2. The ten entries are Apps, Learn, Trigger, Style, Setup, Install, Remove, Update, About, and System.
3. `Super + Alt + Space` is the apps-only menu, and `Super + Escape`, `Super + Ctrl + O`, `Super + Ctrl + C`, and `Super + Ctrl + H` open specific submenus.
4. Several Setup entries open the real config file in your editor, and Omarchy restarts what needs it afterward.
5. `Super + K` lists every main keybinding, and `omarchy menu keybindings --print` prints it in a terminal.
6. Your own menu rows go in `~/.config/omarchy/extensions/omarchy-menu.jsonc`, never under `/usr/share/omarchy`.

Next up, [The Top Bar, Panels, and Toggles](02-the-top-bar-panels-and-toggles.md): the strip across your screen and the popups behind it.
