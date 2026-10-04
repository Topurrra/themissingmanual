---
title: "Super Is the Center of Everything"
guide: "omarchy-for-windows-macos-and-ubuntu-users"
phase: 1
summary: "Why Omarchy starts with nothing to click, how the Super key anchors almost every hotkey, how Super + Space opens the Omarchy menu, and why Super + K is the only binding you have to memorize."
tags: [omarchy, super-key, hotkeys, omarchy-menu, keyboard-first]
difficulty: beginner
synonyms: ["what is the super key", "omarchy super key", "where is the start menu in omarchy", "omarchy menu hotkey", "omarchy no taskbar no dock", "how to open apps in omarchy", "omarchy show all keybindings"]
updated: 2026-10-04
---

# Super Is the Center of Everything

Omarchy is built so you rarely reach for the mouse. The manual says that when the system first starts, you cannot do a thing with the mouse alone. That sounds hostile until you learn that one key unlocks everything, and that key is the same one you already have under your left hand.

## What Super is

**Super** is the Windows key on a PC keyboard. On a Mac keyboard, Linux treats the Command key as Super, so it sits exactly where Cmd always was, and Omarchy does not remap anything. If you came from Ubuntu, Super is the same key you may have met there, but on Omarchy it is the anchor for nearly every hotkey, not an occasional shortcut.

In this guide, and in the manual, hotkeys are written like `Super + Space`: hold the first keys, press the last one.

> 📝 **Terminology.** A *hotkey* (also called a keybinding) is a key combination that triggers an action. Omarchy's desktop is Hyprland, and its hotkeys live in a plain text file you can edit. That file comes up in [Making Omarchy Comfortable](/guides/making-omarchy-comfortable), not here.

## The Omarchy menu: your new Start menu

Press `Super + Space`. A menu opens. Start typing and it filters. This one menu launches apps, changes settings, installs software, and captures the screen. Your Spotlight, Raycast, or Start menu reflex now ends here.

Three details save you confusion:

- It is nested. Entries open sub-menus, and typing searches through them.
- `Super + Alt + Space` opens a smaller apps-only version of it, when all you want is to launch something.
- `Super + Escape` opens the System menu: lock, suspend, reboot, shut down. More on that in the next phase.

The top-level entries in 4.0.4 are Apps, Learn, Trigger, Style, Setup, Install, Remove, Update, About, and System. You do not need to memorize them. Open the menu, read the list, and you will have a feel for where things live within a day.

## There is no dock, no desktop, and nothing to minimize into

Three absences that surprise people:

- **No dock or taskbar for launching.** Apps start from hotkeys or the menu. `Super + Return` opens a terminal. `Super + Shift + Return` opens the browser.
- **No desktop icons.** There is nothing to arrange.
- **No stack of overlapping windows.** Windows tile the screen instead of stacking, so you never hunt for one hiding behind another. That idea gets its own guide: [Tiling Windows and Workspaces](/guides/omarchy-tiling-windows-and-workspaces).

What you do have is **the top bar**, the one persistent piece of interface. It covers what the menu bar, system tray, and Notification Center used to do: workspaces, the clock, network, Bluetooth, audio, and power. Nearly every widget on it does something different on left, right, and middle click. [Menus, Panels, and the CLI](/guides/omarchy-menus-panels-and-cli) covers it properly.

## Try it: your first two minutes

Do these now, with Omarchy open:

1. Press `Super + Return`. A terminal opens and fills the screen.
2. Press `Super + Shift + Return`. A browser opens, and the two windows share the screen side by side.
3. Press `Super + Space`, type the name of any installed app, and press `Return` to open it.
4. Press `Super + W` once for each open window to close them all.

*What just happened:* the first window took the whole screen, the next ones split it, and `Super + W` closed windows. That is tiling in miniature, and you did not drag anything.

## The one hotkey to memorize

Press `Super + K`. A list of every main keybinding appears.

The manual's advice is to skim the hotkeys chapter once, and whenever you blank on a binding, press `Super + K`. It calls this the only hotkey you actually have to memorize. Related lookups:

| Press | Shows |
|---|---|
| `Super + K` | The main keybindings |
| `Super + Alt + K` | The Tmux keybindings |
| `Super + Ctrl + K` | The Herdr keybindings (Herdr is a terminal workspace manager with persistent sessions) |

Many things a hotkey does are also reachable through `Super + Space`, with more keystrokes. The hotkeys exist so that the things you do all day take one chord.

Check yourself before moving on:

```quiz
[
  {
    "q": "On a Mac keyboard running Omarchy, which key plays the role of Super?",
    "choices": [
      "Control",
      "Command, because Linux treats it as Super and Omarchy does not remap anything",
      "Option, because Omarchy swaps it with Command by default"
    ],
    "answer": 1,
    "explain": "Linux treats Command as Super, and Omarchy leaves the mapping alone, so Super sits where Cmd always was.",
    "why": ["Control is a different key, used in combos like Ctrl + Alt + Tab.", null, "Omarchy does not swap anything by default. Swapping Alt and Super is an opt-in setting."]
  },
  {
    "q": "You forgot which key combination closes a window. What is the fastest reliable way to find it?",
    "choices": [
      "Search the web for the Omarchy hotkey list",
      "Press Super + K to show every main keybinding",
      "Open the browser and read the manual before doing anything else"
    ],
    "answer": 1,
    "explain": "Super + K shows the main keybindings on the machine you are sitting at, so it always matches your version and your own edits."
  },
  {
    "q": "Which hotkey opens the Omarchy menu, your replacement for Spotlight or the Start menu?",
    "choices": ["Super + K", "Super + Space", "Super + Escape"],
    "answer": 1,
    "explain": "Super + Space opens the Omarchy menu. Super + K lists keybindings and Super + Escape opens the System menu."
  }
]
```

## Recap

1. Super is the Windows key, or Command on a Mac keyboard, and it anchors nearly every Omarchy hotkey.
2. `Super + Space` opens the Omarchy menu, which launches apps, changes settings, installs software, and captures the screen. `Super + Alt + Space` is the apps-only version.
3. There is no dock and no desktop icons, and windows do not overlap. The top bar is the one persistent piece of interface.
4. `Super + K` shows every main keybinding. It is the one hotkey worth memorizing.

Next up, [Where Did It Go? Translation Tables](02-where-did-it-go.md): the specific thing you used to reach for, and its Omarchy replacement.
