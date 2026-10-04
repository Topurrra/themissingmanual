---
title: "Your First Boot Checklist"
guide: "installing-omarchy"
phase: 4
summary: "Your first ten minutes on Omarchy: learn the two hotkeys that unlock everything, get online, run the first update, fix oversized apps, and know where to learn next."
tags: [omarchy, first-boot, setup, updates, display-scaling, hotkeys]
difficulty: beginner
synonyms: ["what to do after installing omarchy", "omarchy first boot", "omarchy apps too big", "omarchy connect to wifi", "how to update omarchy first time", "omarchy caps lock not working", "omarchy post install checklist", "omarchy where to start"]
updated: 2026-10-04
---

# Your First Boot Checklist

The desktop is up, there is no dock, and your mouse does almost nothing. That is normal. The next ten minutes decide whether Omarchy feels welcoming or hostile, so here is the short list, in the order that helps most.

| Do this | How |
|---|---|
| Learn the two doors in | `Super + Space` (menu) and `Super + K` (every hotkey) |
| Get online | `Super + Ctrl + W`, or plug in Ethernet |
| Update | _Update > Omarchy_ |
| Fix oversized apps | Edit `monitors.lua` via _Setup > Monitors_ |
| Know the safety net | Snapshots happen on every update |

## 1. Learn the two doors

The first time you log in, a notification offers to open the keybindings menu. Click it, or press `Super + K` any time. That is the list of every mapped hotkey, and the manual calls it the only one you really have to memorize.

The other door is `Super + Space`, the Omarchy menu. It launches apps, changes settings, and installs software. Start typing and it filters. If you forget everything else, these two keys get you back.

Try the basics now: `Super + Return` opens a terminal, `Super + Shift + Return` opens a browser, and `Super + W` closes the active window. The [tiling guide](/guides/omarchy-tiling-windows-and-workspaces) explains what you will see.

## 2. Get online

Networking is handled by NetworkManager. Ethernet needs nothing: plug it in. For Wi-Fi, press `Super + Ctrl + W` to open the network panel, which scans networks, shows signal strength, and connects. Panels are keyboard friendly: arrows move, `Return` activates, `Tab` steps to the neighbouring panel, and `Escape` closes.

You can also click the network icon in the top bar. For everything else about panels, see [Omarchy Menus, Panels, and the CLI](/guides/omarchy-menus-panels-and-cli).

## 3. Run the first update

Run _Update > Omarchy_ from the menu, or `omarchy update` in a terminal. A small circle-arrow icon appears next to the clock when an update is waiting, and clicking it starts the same update.

```bash
omarchy update
```

Before changing anything, the update checks free space, takes a **snapshot** (a restorable copy of your system), then updates Omarchy and your packages and runs any migrations. The update stops if the root filesystem has under 10 GiB free, so free some space if it complains. The transcript is saved to `/tmp/omarchy-update.log`.

> ⚠️ **Gotcha.** Do not run `pacman -Syu` yourself. Omarchy stops direct system upgrades on purpose and points you back to `omarchy update`, because the direct way skips the snapshot and the configuration updates.

If the update asks you to restart, restart. The snapshot is also your first safety net. [When Omarchy Breaks](/guides/when-omarchy-breaks) shows how to use it.

## 4. Fix oversized apps

Omarchy assumes a high-resolution (2x) screen. If you are on 1080p or 1440p, some apps look huge. The fix is in `~/.config/hypr/monitors.lua`, which you open from _Setup > Monitors_. The shipped defaults include these two variables:

```lua
local omarchy_gdk_scale = 2
local omarchy_monitor_scale = "auto"
```

The manual's guidance:

| Display | `omarchy_gdk_scale` | `omarchy_monitor_scale` |
|---|---|---|
| 27 or 32 inch 4K | `2` | `1.6` |
| 1080p or 1440p | `1` | `1` |

Edit the numbers, save and quit (`:wq` in Neovim, the default editor), and restart any oversized app. `GDK_SCALE` only affects apps started afterwards, so close old windows first. `Ctrl + Alt + Delete` closes all windows at once.

For quick adjustments without a file, press `Super + Ctrl + D` to open the Display panel (brightness, text size, scaling presets) or press `Super + /` to step through scales. If only the text is too small or large, `omarchy display text size 14` sets it (the range is 9 to 20).

*What just happened:* the scale variables told Omarchy how large to draw your screen's pixels. Telling it your real display density corrects everything at once.

## 5. Set the small things

- **Timezone:** _Update > Timezone_. If the zone is right but the clock drifted, _Update > Time_ restarts time sync.
- **Clock format:** right-click the clock in the top bar to cycle formats, including 12-hour.
- **Sound and Bluetooth:** `Super + Ctrl + A` opens Audio, where you can pick the output device, and `Super + Ctrl + B` opens Bluetooth. Unplugged speakers silent? Pick them as the output in the Audio panel.
- **Google sign-in in Chromium:** the plain Chromium build lacks Google's credentials. Run _Install > Service > Chromium Account_ and restart the browser.
- **Passwords:** change the drive and login passwords in _Update > Password_.

> 💡 **Key point.** If Caps Lock does nothing, that is by design. Omarchy uses it as the compose key for quick emoji and text completions. To get Caps Lock back, set `kb_options = "compose:ralt"` inside the `input` section of `~/.config/hypr/input.lua`. The [comfort guide](/guides/making-omarchy-comfortable) shows the full structure.

## 6. Know where to learn next

The _Learn_ menu entry opens the keybindings, the Omarchy manual, the Hyprland and Arch wikis, and more. Stuck? Ask in the `#omarchy-help` channel on the [community Discord](https://omarchy.org/discord).

In this series, the natural next steps are:

1. [Omarchy for Windows, macOS, and Ubuntu Users](/guides/omarchy-for-windows-macos-and-ubuntu-users) - translate your old habits.
2. [Omarchy Tiling, Windows, and Workspaces](/guides/omarchy-tiling-windows-and-workspaces) - get comfortable with the layout.
3. [Installing and Updating Software on Omarchy](/guides/installing-and-updating-software-on-omarchy) - apps and packages.
4. [Making Omarchy Comfortable](/guides/making-omarchy-comfortable) - keyboard, monitors, themes.

## Your turn: recall the network panel

```exercise
[
  {
    "type": "predict",
    "task": "Which hotkey opens the network panel for Wi-Fi? Write it like `Super + Space`.",
    "accept": ["Super + Ctrl + W", "/^super\\s*\\+\\s*ctrl\\s*\\+\\s*w$/i"],
    "hint": "Panels use Super + Ctrl plus a letter. W stands for Wi-Fi."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "Your terminal and browser look huge on a 1080p screen. Where do you fix it?",
    "choices": ["In ~/.config/hypr/monitors.lua, setting the scale variables to 1", "In /usr/share/omarchy, editing the default files", "Nowhere, it cannot be changed"],
    "answer": 0,
    "explain": "Omarchy assumes a 2x display. On a 1x display set omarchy_gdk_scale (and the monitor scale) to 1 in monitors.lua, then restart the oversized apps.",
    "why": [null, "Files in /usr/share/omarchy belong to Omarchy and are overwritten by updates. Override in ~/.config instead.", "It is a documented one-line change."]
  },
  {
    "q": "Why should you run omarchy update instead of pacman -Syu?",
    "choices": ["pacman cannot update anything on Omarchy", "omarchy update takes a snapshot first and runs migrations and config updates", "omarchy update is faster"],
    "answer": 1,
    "explain": "A direct upgrade skips the snapshot and the migrations, so Omarchy blocks it and points you to omarchy update."
  },
  {
    "q": "Caps Lock does nothing. What is going on?",
    "choices": ["The keyboard is broken", "Omarchy repurposes Caps Lock as the compose key, and you can change that in input.lua", "Caps Lock needs a driver"],
    "answer": 1,
    "explain": "Caps Lock is the compose key, used for quick emoji and completions. Setting kb_options = \"compose:ralt\" in input.lua moves compose elsewhere."
  }
]
```

## Recap

1. `Super + Space` opens the menu and `Super + K` lists every hotkey.
2. `Super + Ctrl + W` opens the Wi-Fi panel. Ethernet works when plugged in.
3. Run _Update > Omarchy_ (never a bare `pacman -Syu`); it snapshots first.
4. On 1080p or 1440p screens, set the scale variables in `monitors.lua` to `1` and restart oversized apps.
5. Caps Lock is the compose key by design. The _Learn_ menu and `#omarchy-help` are where help lives.

You have finished the install guide. Continue with [Omarchy for Windows, macOS, and Ubuntu Users](/guides/omarchy-for-windows-macos-and-ubuntu-users).
