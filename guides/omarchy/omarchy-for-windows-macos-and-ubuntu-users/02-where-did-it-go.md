---
title: "Where Did It Go? Translation Tables"
guide: "omarchy-for-windows-macos-and-ubuntu-users"
phase: 2
summary: "Lookup tables that map what you used to reach for on Windows, macOS, or Ubuntu - launcher, taskbar, task switcher, file manager, task monitor, settings, screenshots, installing apps, updates, locking, and shutting down - to the Omarchy hotkey or menu entry that replaces it."
tags: [omarchy, windows, macos, ubuntu, translation-table, hotkeys, migration]
difficulty: beginner
synonyms: ["omarchy windows equivalent", "omarchy mac equivalent", "omarchy ubuntu equivalent", "omarchy task manager shortcut", "omarchy how to take a screenshot", "omarchy how to shut down", "omarchy where are settings", "omarchy file explorer", "omarchy alt tab"]
updated: 2026-10-04
---

# Where Did It Go? Translation Tables

When something you used every day is missing, the useful question is "what does Omarchy call it, and what do I press?" This phase answers that for the common cases, one table per system, then covers the entries that nearly everyone needs on day one.

Read the table for your old system, skim the other two, and skip the rest. The details live in the guides linked at the end of the phase.

## Coming from Windows

| You reached for | On Omarchy |
|---|---|
| Start menu | `Super + Space`, the Omarchy menu. Type to filter. |
| Taskbar | The top bar. It shows workspaces, clock, network, audio, and power. Launching is done by hotkey or menu. |
| Alt + Tab | `Alt + Tab` and `Alt + Shift + Tab` cycle through the windows on the active workspace |
| Virtual desktops | Workspaces: `Super + 1/2/3/4` jumps to one, `Super + Shift + 1/2/3/4` sends the window there |
| Win + Left/Right snapping | Not needed. Windows tile on their own. |
| Task Manager | Activity, which is `btop`, on `Super + Ctrl + T` |
| File Explorer | Files (Nautilus) on `Super + Shift + F` |
| Settings, Control Panel | _Setup_ in the Omarchy menu, which opens plain config files |
| Win + Shift + S | `Print Screen` |
| Win + V clipboard history | `Super + Ctrl + V`, and it holds images as well as text |
| Win + L | `Super + Ctrl + L` |
| Downloading a `.exe` installer | _Install_ in the menu, or `omarchy pkg add` |
| Windows Update | _Update > Omarchy_ |
| Ctrl + Alt + Delete | Careful: on Omarchy, `Ctrl + Alt + Delete` closes **all windows** |

## Coming from macOS

| You reached for | On Omarchy |
|---|---|
| Spotlight, Raycast | `Super + Space`, the Omarchy menu |
| Dock | None. Apps start from hotkeys or the menu. |
| Menu bar, Notification Center | The top bar. Notification history is on `Super + Shift + Alt + ,` |
| Cmd + Tab | `Alt + Tab`. It cycles through *windows* on the active workspace. |
| Spaces, Mission Control | Workspaces: `Super + 1/2/3/4`, `Super + Shift + 1/2/3/4` |
| Finder | Files (Nautilus) on `Super + Shift + F` |
| Activity Monitor | Activity (`btop`) on `Super + Ctrl + T` |
| System Settings | _Setup_ in the Omarchy menu |
| Cmd + Shift + 4 | `Print Screen`. No such key? `Super + Ctrl + C` opens a capture menu. |
| AirDrop | LocalSend, through the Share menu on `Super + Ctrl + S` |
| Time Machine (for the system) | Automatic system snapshots, taken on every update |
| App Store | _Install_ in the menu, or `omarchy pkg add` |
| Cmd + Q | `Super + W`. Closing the window quits the app. |
| Apple menu > Shut Down | `Super + Escape`, the System menu |

## Coming from Ubuntu

You already know Linux, so the surprises are different. Omarchy is based on Arch Linux, not Debian, and it replaces the usual desktop environment with a tiling window manager.

| You reached for | On Omarchy |
|---|---|
| `apt install` | `omarchy pkg add`, or _Install > Package_. Arch's package manager is `pacman`, and the AUR is reachable through `yay`. |
| `sudo apt update && sudo apt upgrade` | _Update > Omarchy_, or `omarchy update`. A direct `pacman -Syu` is stopped on purpose. |
| Software center | _Install_ in the Omarchy menu |
| Settings app | _Setup_ in the Omarchy menu, which opens the right config file |
| Files | Files (Nautilus) on `Super + Shift + F` |
| Terminal | `Super + Return` |
| System monitor | Activity (`btop`) on `Super + Ctrl + T` |
| Taking screenshots | `Print Screen` |

> ⚠️ **Gotcha.** Do not carry over the habit of running a system upgrade by hand. Omarchy intercepts a direct `pacman -Syu` and points you to `omarchy update`, because a direct upgrade would skip the snapshot, the migrations, and the configuration updates that the Omarchy update performs. Software installation is covered in [Installing and Updating Software on Omarchy](/guides/installing-and-updating-software-on-omarchy).

Ubuntu users also keep their terminal fluency. Everything in [Linux From Zero](/guides/linux-from-zero) and [The Terminal and Shell](/guides/the-terminal-and-shell) still applies. What changes is the package manager and the desktop.

## The entries everyone needs on day one

### Locking and shutting down

There is no power button in a corner of the screen. Instead:

- `Super + Ctrl + L` locks the computer.
- `Super + Escape` opens the System menu, which lists Screensaver, Lock, Suspend, Hibernate, Logout, Reboot, and Shutdown.

### Screenshots

`Print Screen` freezes the screen so nothing shifts while you aim. You can drag a box for a freeform region, or click once and the shot snaps to whatever window or monitor you clicked. The picture is saved as a PNG in `~/Pictures` and copied to the clipboard at the same time, so you can paste it straight into a chat with `Super + V`.

Related keys: `Alt + Print Screen` records the screen, and `Super + Print Screen` is a color picker. Every capture option is also under _Trigger > Capture_ in the menu.

### Settings are files

The biggest conceptual swap is the settings app. A lot of Omarchy settings live in text files you edit, not panels you click through. The _Setup_ menu drops you into the right file and restarts whatever needs restarting when you close the editor. Every tweak can be seen, copied to your next machine, and kept in version control, which is why [Git From Zero](/guides/git-from-zero) turns out to be relevant here.

Some panels do exist, for the things you adjust constantly: `Super + Ctrl + A` for audio, `Super + Ctrl + W` for network and Wi-Fi, `Super + Ctrl + B` for Bluetooth, `Super + Ctrl + D` for display, and `Super + Ctrl + P` for power.

### Installing and updating

Software comes from a package manager, never a downloaded installer. _Install_ in the menu lets you search packages, and one command, _Update > Omarchy_, updates Omarchy and every package on the system after taking a snapshot. There are no per-app updaters.

Check yourself before moving on:

```quiz
[
  {
    "q": "You are coming from Windows and press Ctrl + Alt + Delete out of habit. What happens on Omarchy?",
    "choices": [
      "A security screen with a Task Manager link appears",
      "It closes all of your windows",
      "It locks the computer"
    ],
    "answer": 1,
    "explain": "On Omarchy, Ctrl + Alt + Delete closes all windows. Lock is Super + Ctrl + L, and Activity (btop) is on Super + Ctrl + T.",
    "why": ["There is no Windows-style security screen. The combination is bound to closing windows.", null, "Locking is Super + Ctrl + L."]
  },
  {
    "q": "Which pairing is correct?",
    "choices": [
      "Task Manager or Activity Monitor is Activity (btop) on Super + Ctrl + T",
      "Start menu is Super + K",
      "Screenshots are on Super + Ctrl + S"
    ],
    "answer": 0,
    "explain": "Super + K lists keybindings and Super + Ctrl + S is the Share menu. Screenshots are Print Screen, or Super + Ctrl + C for a capture menu."
  },
  {
    "q": "On Ubuntu you ran sudo apt upgrade. What is the Omarchy habit that replaces a hand-run system upgrade?",
    "choices": [
      "sudo pacman -Syu, which works the same way",
      "Update > Omarchy or omarchy update, because it snapshots first and runs migrations",
      "Reinstalling Omarchy from the ISO"
    ],
    "answer": 1,
    "explain": "Omarchy stops a direct pacman -Syu and points you to omarchy update, which takes a snapshot, runs migrations, and updates the packages."
  }
]
```

## Recap

1. `Super + Space` replaces the Start menu, Spotlight, and the software center. The top bar replaces the taskbar and the menu bar.
2. `Alt + Tab` still cycles windows, but only on the active workspace. Workspaces replace virtual desktops and Spaces.
3. Activity (`Super + Ctrl + T`), Files (`Super + Shift + F`), and `Print Screen` replace Task Manager, File Explorer or Finder, and the snipping tool.
4. `Ctrl + Alt + Delete` closes all windows on Omarchy. Lock with `Super + Ctrl + L` and open the System menu with `Super + Escape`.
5. Settings are text files reached through _Setup_. Software and updates go through _Install_ and _Update > Omarchy_.

Next up, [Habits That Will Fight You](03-habits-that-fight-you.md): the reflexes that need retraining, with drills.
