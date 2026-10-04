---
title: "Habits That Will Fight You"
guide: "omarchy-for-windows-macos-and-ubuntu-users"
phase: 3
summary: "The reflexes you brought from Windows, macOS, and Ubuntu that misfire on Omarchy - copy and paste, dragging windows, closing apps, Ctrl + Alt + Delete, Caps Lock - why each one behaves differently, and short drills that retrain them."
tags: [omarchy, habits, muscle-memory, clipboard, hotkeys, caps-lock, drills]
difficulty: beginner
synonyms: ["omarchy copy paste not working", "omarchy ctrl c ctrl v terminal", "why is caps lock not working omarchy", "omarchy super c super v", "omarchy how to close a window", "omarchy use alt as super", "omarchy muscle memory", "omarchy clipboard history"]
updated: 2026-10-04
---

# Habits That Will Fight You

Your hands know hundreds of reflexes and none of them asks permission. On Omarchy a few of those reflexes do the wrong thing, a few do nothing, and one closes every window you have open. This phase names each one, explains why Omarchy does it differently, and gives you a drill to replace it.

## Copy and paste: Super, not Ctrl

On Windows and most of Linux, `Ctrl + C` and `Ctrl + V` copy and paste, except in the terminal, where `Ctrl + C` stops a running program. On Linux terminals the copy and paste combos are usually `Ctrl + Shift + C` and `Ctrl + Shift + V`. On macOS it was Cmd everywhere. Three conventions, one for each of you.

Omarchy adds a fourth that is deliberately the same everywhere:

| Hotkey | Does |
|---|---|
| `Super + C` | Copy |
| `Super + X` | Cut (not in the terminal) |
| `Super + V` | Paste |
| `Super + Ctrl + V` | Open clipboard history |

They work in the browser, in editors, and in the terminal, so there is no separate reflex for the shell. If you are on a Mac keyboard, this is the same finger movement you already have, since Super sits where Cmd was.

Clipboard history is the Win + V equivalent. Press `Super + Ctrl + V`, start typing to search, pick an entry with `Return`, and it lands on the clipboard ready for `Super + V`. It holds images as well as text.

> ⚠️ **Gotcha.** Two exceptions to know about. The manual lists `Super + X` as not working in the terminal. And the manual notes that most AI agent harnesses use `Ctrl + V` for pasting images but `Super + V` for pasting text, so if an image paste does nothing, try `Ctrl + V` there.

Sharing something with another device is a different feature. The Share menu on `Super + Ctrl + S` offers Clipboard, File, Folder, and Receive, and the manual describes it as LocalSend.

## Windows do not need to be arranged

The habit: drag a window by its title bar, snap it to half the screen, or resize it from a corner. The Omarchy reality: windows place themselves. The first takes the whole screen, the second splits it, and windows do not overlap.

You can still use the mouse. Hold `Super` and drag with the left mouse button to move a window, or with the right mouse button to resize it. But the keyboard versions are faster once you know them, and they are the subject of [Tiling Windows and Workspaces](/guides/omarchy-tiling-windows-and-workspaces).

If you truly need a window floating, `Super + T` toggles the active one out of the tiling and back. The manual's advice is to give tiling a real chance first, because it is the heart of the whole thing.

## Closing a window quits the app

On macOS, closing the last window of an app can leave it running with no windows. On Omarchy there is no limbo: `Super + W` closes the window and the app is gone.

The related combination is the one that bites Windows users hardest. `Ctrl + Alt + Delete` on Omarchy closes **all windows**. Do not expect a security screen. Treat it as the panic button for a messy workspace and nothing more.

## Caps Lock is not Caps Lock

On Omarchy, Caps Lock has been designated as the *compose key*. That is what powers quick emoji and text completions. The side effect is that pressing it does not give you capital letters.

Two ways to deal with that:

- Press both Shift keys together, which toggles Caps Lock.
- Remap the compose key to another key so Caps Lock behaves normally. The manual's example uses the right Alt key. Edit `~/.config/hypr/input.lua`:

```lua
hl.config({
  input = {
    kb_options = "compose:ralt",
  },
})
```

Hyprland's configuration is written in Lua on Omarchy 4, which is why this looks like code rather than a settings dialog. You do not need to understand Lua to paste this block. [Making Omarchy Comfortable](/guides/making-omarchy-comfortable) goes through the config files properly.

## If the Super key is uncomfortable

Some keyboards make the Windows or Cmd key awkward to reach. The manual offers a swap that makes Alt act as Super, in the same `input.lua`:

```lua
hl.config({
  input = {
    kb_options = "compose:caps,shift:both_capslock_cancel,altwin:swap_alt_win",
  },
})
```

Treat this as a last resort. Every hotkey in every guide, including this one, assumes the standard Super key.

## Your turn: retrain the reflexes

Try these with Omarchy open. They take about two minutes each.

```exercise
[
  {
    "type": "predict",
    "task": "You have a terminal and a browser open and want to close the focused window. Which hotkey does it? Write it the way this guide does, for example `Super + Space`.",
    "accept": ["Super + W", "Super+W", "/^super\\s*\\+\\s*w$/i"],
    "hint": "W for window."
  },
  {
    "type": "predict",
    "task": "You copied three different things and want to pick the second one again. Which hotkey opens the clipboard history?",
    "accept": ["Super + Ctrl + V", "Super+Ctrl+V", "/^super\\s*\\+\\s*ctrl\\s*\\+\\s*v$/i"],
    "hint": "It is the paste key with Ctrl added."
  },
  {
    "type": "task",
    "task": "Run the paste drill. Open a terminal with `Super + Return` and a browser with `Super + Shift + Return`. Select a sentence on any web page and copy it with `Super + C`. Focus the terminal with `Super + Left` or `Super + Right`, then paste into it with `Super + V`. Repeat three times, never touching `Ctrl + C` or `Ctrl + V`.",
    "reveal": "If paste does nothing in the terminal, check you copied with `Super + C` and not `Ctrl + C`. Mixing the two is the most common slip while the habit is changing.",
    "checklist": ["Copied with Super + C", "Pasted into the terminal with Super + V", "Opened clipboard history with Super + Ctrl + V and picked an older entry", "Closed both windows with Super + W"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You are in the terminal and want to paste. Which hotkey works there and everywhere else on Omarchy?",
    "choices": ["Super + V", "Ctrl + V", "Ctrl + Shift + V only"],
    "answer": 0,
    "explain": "Super + V is the unified paste. It works in the terminal and in graphical apps, so you do not need a separate reflex for the shell.",
    "why": [null, "Ctrl + V works in graphical apps, but in a terminal Ctrl + C is the interrupt key, which is why Linux terminals use Ctrl + Shift + C and Ctrl + Shift + V instead.", "Ctrl + Shift + V is the traditional Linux terminal paste, but the unified Super + V covers the terminal too, and it works everywhere else as well."]
  },
  {
    "q": "You press Caps Lock expecting capital letters and nothing changes. Why?",
    "choices": [
      "The keyboard is broken",
      "Omarchy designates Caps Lock as the compose key for emoji and completions",
      "Caps Lock only works inside the terminal"
    ],
    "answer": 1,
    "explain": "Caps Lock is the compose key on Omarchy. Press both Shift keys to toggle Caps Lock, or move the compose key with kb_options in input.lua."
  },
  {
    "q": "What does Ctrl + Alt + Delete do on Omarchy?",
    "choices": ["Opens a security menu", "Locks the screen", "Closes all windows"],
    "answer": 2,
    "explain": "It closes all windows. Lock is Super + Ctrl + L."
  }
]
```

## Recap

1. Use `Super + C`, `Super + X`, and `Super + V` for clipboard actions everywhere, and `Super + Ctrl + V` for clipboard history. `Super + X` does not cut in the terminal.
2. Stop arranging windows. Let them tile, and hold `Super` with the mouse only when you need to drag or resize.
3. `Super + W` closes the window and quits the app. `Ctrl + Alt + Delete` closes every window.
4. Caps Lock is the compose key. Both Shifts together act as Caps Lock, or remap the compose key in `~/.config/hypr/input.lua`.
5. Retraining takes drills, not reading. Repeat the paste and close drills until your hands stop reaching for the old keys.

Next up, [Your First Week](04-your-first-week.md): the ten hotkeys to learn first and a two-week plan.
