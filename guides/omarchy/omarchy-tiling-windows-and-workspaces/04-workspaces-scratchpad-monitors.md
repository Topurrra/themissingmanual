---
title: "Workspaces, the Scratchpad, and Monitors"
guide: "omarchy-tiling-windows-and-workspaces"
phase: 4
summary: "Workspaces as separate desks you jump between with Super + 1/2/3/4, sending windows between them, the scratchpad overlay on Super + S, and how focus, workspaces, and the mirror toggle behave when you add a second monitor."
tags: [omarchy, hyprland, workspaces, scratchpad, multi-monitor, hotkeys]
difficulty: beginner
synonyms: ["omarchy workspaces hotkeys", "omarchy move window to another workspace", "omarchy scratchpad", "omarchy super s", "omarchy multiple monitors", "omarchy move workspace to other monitor", "omarchy mirror laptop display", "omarchy virtual desktops", "omarchy monitors lua"]
updated: 2026-10-04
---

# Workspaces, the Scratchpad, and Monitors

Tiling shares one screen between windows, but you will not fit everything on one screen. Workspaces give you more desks, and they are cheap enough that the manual says you might not need multiple monitors at all if you were used to them before.

## A workspace is a separate desk

A workspace is a full tiled desktop of its own. It has its own windows, and it can have its own layout (dwindle or scrolling, from [Phase 3](03-window-modes-and-layouts.md)). Switching is instant, with no animation delay, so jumping between workspaces costs the same as pressing a key.

If you know macOS Spaces or Windows virtual desktops, this is the same idea, except you will actually use it because it is a keypress away. A common habit is to give each task a number: browser and notes on 1, code on 2, chat on 3.

| Hotkey | Function |
|---|---|
| `Super + 1/2/3/4` | Jump to a workspace |
| `Super + Tab` | Next workspace |
| `Super + Shift + Tab` | Previous workspace |
| `Super + Ctrl + Tab` | The workspace you were on before |
| `Super + Scroll Wheel` | Scroll through workspaces |

The bindings actually cover workspaces 1 through 10, but the manual documents 1 to 4, and those are enough for most people. The top bar shows your workspaces, and clicking one focuses it.

### Sending a window to another workspace

Jumping moves *you*. Sending moves *the window*:

- `Super + Shift + 1/2/3/4` moves the focused window to that workspace, and you follow it there.
- `Super + Shift + Alt + 1/2/3/4` moves it **without following**, so you stay where you are.

The manual's example: `Super + Shift + 2` sends the current window to workspace 2, and `Super + Shift + 1` brings it back. The silent version suits "put this tab away, keep working": open a reference, send it to workspace 3 without following, carry on.

> 💡 **Key point.** Jump with the plain number, send with Shift added, and send without following with Shift and Alt. It is one pattern, so you only learn it once.

## The scratchpad: an overlay workspace

The scratchpad is a special workspace that overlays whatever workspace you are on. It is for the quick thing: a terminal you want to glance at, or a control panel, without leaving your current layout.

- `Super + Alt + S` moves the focused window to the scratchpad.
- `Super + S` shows or hides the scratchpad overlay.
- To take a window off the scratchpad, send it to a normal workspace, for example `Super + Shift + 1`.

Think of it as a drawer. Park a window in it, open the drawer when you need the window, close it when you do not.

## Monitors

Hyprland handles multiple screens well, and a few keys cover the basics.

| Hotkey | Function |
|---|---|
| `Ctrl + Alt + Tab` | Cycle focus forward through monitors |
| `Ctrl + Alt + Shift + Tab` | Cycle focus backward through monitors |
| `Super + Shift + Alt + Arrow` | Move the current workspace to the monitor in that direction |
| `Super + Ctrl + Alt + Delete` | Toggle laptop display mirroring |
| `Super + Ctrl + Delete` | Toggle the laptop display on or off |
| `Super + /` and `Super + Alt + /` | Step through monitor scaling options, up and down |

When you plug an external screen into a laptop, the display is extended automatically. Closing the lid then turns the internal screen off, and opening it turns it back on. If the screen is a projector and you want the same picture on both, switch to mirroring from _Trigger > Hardware_ in the menu or with `Super + Ctrl + Alt + Delete`.

The scaling keys step through 1x, 1.25x, 1.6x, 2x, 3x, and 4x. Omarchy assumes a high-resolution display by default, so on a 1080p or 1440p screen you will likely want 1x. With the default configuration these changes persist across reboots. The scale and the layout of multiple screens live in `~/.config/hypr/monitors.lua`, which you can open from _Setup > Monitors_.

The manual points to the [Hyprland monitor documentation](https://wiki.hypr.land/Configuring/Basics/Monitors/) for laying out several screens and to its [workspace rules](https://wiki.hypr.land/Configuring/Basics/Workspace-Rules/) for binding specific workspaces to specific monitors. In Omarchy, monitor settings go in `monitors.lua` as `hl.monitor` entries, and the file ships with commented examples for pinning a monitor to a resolution, position, and rotation.

For the broader screen settings, [Making Omarchy Comfortable](/guides/making-omarchy-comfortable) goes through monitors, scaling, and text size.

## Your turn: the workspace drill

```exercise
[
  {
    "type": "predict",
    "task": "You are on workspace 1 with a reference page open. You want to send it to workspace 3 but stay where you are. Which hotkey sends it silently? Write it with the key 3.",
    "accept": ["Super + Shift + Alt + 3", "Super+Shift+Alt+3", "/^super\\s*\\+\\s*shift\\s*\\+\\s*alt\\s*\\+\\s*3$/i"],
    "hint": "Sending is Shift plus the number. Not following adds Alt."
  },
  {
    "type": "task",
    "task": "Run the drill: open a terminal on workspace 1. Jump to workspace 2 with `Super + 2` and open a browser. Send the browser back to workspace 1 with `Super + Shift + 1`. Then focus the terminal with `Super + Left` or `Super + Right`, put it in the scratchpad with `Super + Alt + S` and show it with `Super + S`. Finally send it out of the scratchpad with `Super + Shift + 1`.",
    "reveal": "If the terminal does not appear after Super + S, the scratchpad toggles: press Super + S once more to show it. Windows leave the scratchpad when you send them to a normal workspace.",
    "checklist": ["Jumped between workspaces with Super + 1/2", "Sent a window to another workspace with Super + Shift + number", "Put a window in the scratchpad and showed it with Super + S", "Moved it out with Super + Shift + number"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "What is the difference between Super + Shift + 2 and Super + Shift + Alt + 2?",
    "choices": [
      "The first sends the window to workspace 2 and follows it, the second sends it without following",
      "The first closes the window, the second sends it",
      "There is no difference"
    ],
    "answer": 0,
    "explain": "Both send the focused window to workspace 2. The Alt version leaves you on your current workspace."
  },
  {
    "q": "How do you take a window out of the scratchpad?",
    "choices": [
      "Press Super + Alt + S again",
      "Send it to a normal workspace, for example with Super + Shift + 1",
      "Close the scratchpad with Super + S"
    ],
    "answer": 1,
    "explain": "The manual's way is to move the window directly to another workspace. Super + S only shows or hides the overlay.",
    "why": ["Super + Alt + S is the key that moves a window into the scratchpad.", null, "Super + S hides the overlay but the window is still in it."]
  },
  {
    "q": "Where do you configure monitor scaling and the arrangement of several screens?",
    "choices": ["~/.config/hypr/monitors.lua, via Setup > Monitors", "~/.config/hypr/bindings.lua", "The top bar's clock widget"],
    "answer": 0,
    "explain": "monitors.lua holds the monitor settings, and Setup > Monitors opens it. bindings.lua is where hotkeys are defined."
  }
]
```

## Recap

1. A workspace is a separate tiled desk. `Super + 1/2/3/4` jumps, `Super + Shift + 1/2/3/4` sends a window and follows, and adding `Alt` sends without following.
2. `Super + Tab`, `Super + Shift + Tab`, and `Super + Ctrl + Tab` step through workspaces. The scroll wheel with `Super` does too.
3. The scratchpad is an overlay workspace: `Super + Alt + S` stores a window, `Super + S` shows it, and sending it to a normal workspace removes it.
4. `Ctrl + Alt + Tab` cycles focus between monitors, and `Super + Shift + Alt + Arrow` sends a workspace to a neighboring monitor.
5. Monitor settings live in `~/.config/hypr/monitors.lua`.

You now have the full window toolkit. The next guide in the category covers the menu, panels, and CLI: [Menus, Panels, and the CLI](/guides/omarchy-menus-panels-and-cli).
