---
title: "The Four Big Shifts"
guide: "what-omarchy-actually-is"
phase: 2
summary: "Four things work differently from Windows, macOS, and Ubuntu: you drive by keyboard, windows tile themselves, settings are plain text files, and the system is a rolling release updated through one command."
tags: [omarchy, keyboard-first, tiling, dotfiles, rolling-release, hotkeys]
difficulty: beginner
synonyms: ["omarchy vs windows", "omarchy vs macos", "what is a rolling release", "what is a tiling window manager", "why does omarchy use config files", "how do hotkeys work in omarchy", "what is super key in linux", "how do i update omarchy"]
updated: 2026-10-04
---

# The Four Big Shifts

Most of the disorientation on day one comes from four habits you have to unlearn. They all trace back to the design from Phase 1: Omarchy is built from parts and tuned for a keyboard. Name them now and nothing later will blindside you.

## Shift 1: the keyboard drives

The center of everything is the `Super` key. On a PC keyboard that is the Windows key. On a Mac keyboard, Linux treats the Command key as Super, so it sits exactly where Cmd always was, and Omarchy does not remap anything.

There is no dock and no desktop icons. You start things with hotkeys or the menu:

| You want | You press |
|---|---|
| The Omarchy menu (apps, settings, installing software) | `Super + Space` |
| A terminal | `Super + Return` |
| A browser | `Super + Shift + Return` |
| A list of every mapped hotkey | `Super + K` |
| Close the active window | `Super + W` |

The manual says that when the system first starts you cannot do much with the mouse alone, and that `Super + Space` is the door in. The menu is not meant to be the main way to work, though. Frequent apps get their own hotkeys so you skip it.

You do not have to memorize the list. The manual's advice is to skim the hotkeys chapter once and press `Super + K` whenever a binding slips your mind.

## Shift 2: windows tile themselves

On Windows and macOS you drag windows around and stack them. In Omarchy you open a window and it takes the whole screen. Open a second and the two share the screen. Windows do not overlap, so you never dig one out from under another.

The default arrangement is called dwindle. Each new window splits the space, and every window on the workspace stays visible. Try this on a live system: press `Super + Return`, then `Super + Shift + Return`. You get a terminal and a browser side by side. Press `Super + J` to stack them top and bottom instead, and `Super + J` again to put them back.

Workspaces are like macOS Spaces or Windows virtual desktops, but fast: `Super + 1` jumps to workspace 1, and `Super + Shift + 1` sends the active window there. When a window really needs to float, `Super + T` toggles it out of the tiling and back. The manual's advice is to give tiling a fair chance first.

> ⚠️ **Gotcha.** `Super + W` closes the window, and closing a window quits the app. There is no macOS-style limbo where an app keeps running with no windows.

The [tiling guide](/guides/omarchy-tiling-windows-and-workspaces) goes deep on this.

## Shift 3: settings are text files

Instead of a Settings app with hundreds of toggles, Omarchy keeps its configuration in plain text files under `~/.config`. The `~` means your home folder, and a folder starting with a dot is hidden by default. Those files are yours.

| File | Controls |
|---|---|
| `~/.config/hypr/bindings.lua` | Your own hotkeys and overrides of the defaults |
| `~/.config/hypr/monitors.lua` | Monitors, resolution, and scaling |
| `~/.config/hypr/input.lua` | Keyboard layout, mouse, and trackpad |
| `~/.config/hypr/looknfeel.lua` | Gaps, borders, animations |
| `~/.config/omarchy/shell.json` | The top bar, plus idle and lock timings |

You do not need to hunt for these. The menu's _Setup_ entries (Keybindings, Monitors, Input, and more) open the right file in your editor and restart whatever needs it when you close the editor. The default editor is Neovim, so you save and quit with `:wq`. If you have never used a terminal editor, [Editing in the Terminal](/guides/editing-in-the-terminal) covers survival.

Omarchy 4 uses Lua for Hyprland's config. Here is the manual's own example of swapping one app's hotkey, which shows the shape of it:

```lua
hl.unbind("SUPER + SHIFT + O")
o.bind("SUPER + SHIFT + O", "Joplin", "joplin-desktop")
```

The first line removes the default binding for `Super + Shift + O` (which opens Obsidian), and the second binds the same keys to a different app. Older tutorials show config files with a `.conf` ending and a different syntax. Those belong to Omarchy 3 and earlier, so skip them.

Why files instead of panels? Every tweak is visible, copyable to your next machine, and simple to put in version control. If you make a mess, _Update > Config_ in the menu restores individual config files to their shipped defaults.

The files in `/usr/share/omarchy` belong to Omarchy itself. Do not edit them: an update overwrites them. Override values in `~/.config` instead.

## Shift 4: a rolling release with one update button

Windows and macOS have versions: you live on one, then upgrade to the next. Ubuntu has releases too. Arch is a **rolling release**: there is no "next version" to upgrade to. Packages flow in continuously, so you stay current by updating regularly.

Omarchy wraps that in one command. _Update > Omarchy_ in the menu (or `omarchy update` in a terminal) updates Omarchy and every package on the system, and it takes a snapshot first. A small circle-arrow icon appears next to the clock in the top bar when an update is waiting. Omarchy even stops you from running a bare `pacman -Syu`, because you would skip the snapshot and the configuration updates.

The snapshot is your safety net. If an update goes wrong, you can pick the earlier snapshot from the boot menu and restore it (the [recovery guide](/guides/when-omarchy-breaks) covers it). New installs follow the `stable` channel, which tracks official releases and an Arch mirror that runs about a month behind.

The trade-off is real. You get fresh software and security fixes quickly, but things change under you, and Omarchy 4 changed a lot. That is why this series states the version it was checked against.

## Your turn: predict the hotkey

You have met two hotkeys that open things. Try recalling the one that shows all the rest.

```exercise
[
  {
    "type": "predict",
    "task": "Which hotkey shows every mapped hotkey? Write it the way this guide does, for example `Super + Space`.",
    "accept": ["Super + K", "/^super\\s*\\+\\s*k$/i"],
    "hint": "It is the only hotkey the manual says you actually have to memorize."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "Where do Omarchy's settings mostly live?",
    "choices": ["In a single graphical Settings app", "In plain text files under ~/.config that the Setup menu opens for you", "Inside /usr/share/omarchy, which you are expected to edit"],
    "answer": 1,
    "explain": "Your files live under ~/.config. The /usr/share/omarchy files belong to Omarchy and are overwritten on update.",
    "why": ["Omarchy deliberately has no single settings app. The Setup menu opens the right file instead.", null, "Files in /usr/share/omarchy are replaced by updates, so changes there are lost. Override in ~/.config instead."]
  },
  {
    "q": "You open a terminal, then a browser. What do you see?",
    "choices": ["Two overlapping windows you must arrange", "The two windows tiled next to each other, sharing the screen", "Only the browser, with the terminal hidden"],
    "answer": 1,
    "explain": "A tiling window manager places windows for you so they share the screen without overlapping."
  },
  {
    "q": "What does \"rolling release\" mean for how you update?",
    "choices": ["You wait for a new numbered version and then upgrade", "Updates arrive continuously, so you stay current by updating regularly", "The system never updates"],
    "answer": 1,
    "explain": "Arch has no big version jumps. Omarchy gives you one command, with a snapshot taken first, to keep everything current."
  }
]
```

## Recap

1. `Super` is the center of the keyboard-driven desktop: `Super + Space` for the menu, `Super + K` for the hotkey list.
2. Windows tile themselves, workspaces replace window-dragging, and `Super + T` floats a window when you must.
3. Configuration is text under `~/.config`, opened for you by the _Setup_ menu. Never edit `/usr/share/omarchy`.
4. Arch is a rolling release. Omarchy updates everything with one command and takes a snapshot first.

Next up, [Is It for You, and How to Try It](03-is-it-for-you-and-how-to-try-it.md): a plain look at who this suits and how to test it safely.
