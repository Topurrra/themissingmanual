---
title: "Focus, Move, Swap, and Resize"
guide: "omarchy-tiling-windows-and-workspaces"
phase: 2
summary: "Steering tiled windows from the keyboard: Super + Arrow to focus, Super + Shift + Arrow to swap, the Minus and Equal keys to resize in small, normal, and large steps, saving a window width, Alt + Tab, and the mouse as a backup."
tags: [omarchy, hyprland, tiling, focus, swap, resize, hotkeys]
difficulty: beginner
synonyms: ["omarchy change window focus", "omarchy swap windows", "omarchy resize window with keyboard", "omarchy super arrow", "omarchy alt tab", "omarchy move window left", "hyprland resize window hotkey", "omarchy save window width"]
updated: 2026-10-04
---

# Focus, Move, Swap, and Resize

With windows tiled, four verbs cover nearly everything you do: focus a window, swap two windows, resize one, and move one to another place. This phase gives each verb its key, one family at a time, so the whole set reduces to a pattern: arrows pick the direction, modifiers pick the verb.

## Focus: Super + Arrow

The *focused* window is the one that receives your typing. Move focus to the neighboring window in a direction with `Super + Left`, `Super + Right`, `Super + Up`, or `Super + Down`. The cursor jumps to the center of the new window, so the mouse never lags behind your focus.

Spatial thinking is all you need: look at the screen, decide which neighbor you want, press that arrow.

`Alt + Tab` and `Alt + Shift + Tab` also cycle forward and backward through the windows on the active workspace. That is the familiar task-switcher behavior, scoped to one workspace.

## Swap: Super + Shift + Arrow

To change which window sits where, swap it with its neighbor. `Super + Shift + Arrow` swaps the focused window with the one in the arrow's direction.

Try it on the terminal and browser pair: focus the browser and press `Super + Shift + Left`. The browser takes the terminal's spot, and the terminal takes the browser's.

This is the tiling answer to dragging. You do not pick up a window and drop it. You exchange positions with a neighbor, and the layout stays tidy.

## Resize: Minus and Equal

Tiled windows share a fixed amount of space, so resizing one means moving the boundary it shares with a neighbor. The manual binds this to the `Minus` and `Equal` keys, with these labels:

| Hotkey | Function |
|---|---|
| `Super + Minus` | Expand window left |
| `Super + Equal` | Shrink window left |
| `Super + Shift + Minus` | Shrink window up |
| `Super + Shift + Equal` | Expand window down |

The step is 100 pixels by default. Add `Alt` for smaller steps (25 pixels), or `Ctrl` for bigger steps (300 pixels):

| Hotkey | Step |
|---|---|
| `Super + Alt + Minus` or `Super + Alt + Equal` | Small, the same resizing in smaller steps |
| `Super + Minus` or `Super + Equal` | Normal |
| `Super + Ctrl + Minus` or `Super + Ctrl + Equal` | Large |

The labels above are the manual's wording. Which edge actually moves depends on where the window sits next to its neighbors, so do not trust the label alone. Press one key, watch the boundary move, and press the opposite key to go back. Two or three tries teaches your hand the pattern.

### Save and restore a width

You resized a window to exactly the width you like. Later, something changed it. Two keys handle that:

- `Super + Alt + Home` saves the focused window's width.
- `Super + Home` restores the saved width.

This is handy for a terminal you always want at a particular size.

## The mouse as backup

Hold `Super` and drag with the left mouse button to move a window around. Hold `Super` and drag with the right mouse button to resize it.

## Closing

`Super + W` closes the focused window. `Ctrl + Alt + Delete` closes every window, as covered in [Omarchy for Windows, macOS, and Ubuntu Users](/guides/omarchy-for-windows-macos-and-ubuntu-users). When a window closes, its neighbors expand to take the space.

## Your turn: steer three windows

```exercise
[
  {
    "type": "predict",
    "task": "The browser is on the right and the terminal on the left, and you want them to trade places. With the browser focused, which hotkey swaps it left? Write it as `Super + Shift + Left`-style.",
    "accept": ["Super + Shift + Left", "Super+Shift+Left", "/^super\\s*\\+\\s*shift\\s*\\+\\s*left$/i"],
    "hint": "Swap is Shift plus the arrow you use for focus."
  },
  {
    "type": "task",
    "task": "Open a terminal, a browser, and the file manager (`Super + Shift + F`). Do each of these without the mouse: focus the terminal, then the browser, then the files window; swap two of them; make one wider with the resize keys; close the three windows.",
    "reveal": "One sequence: Super + Left to the terminal, Super + Right to the others, Super + Shift + Left to swap, Super + Equal or Super + Minus to resize, then Super + W three times.",
    "checklist": ["Moved focus with Super + Arrow", "Swapped two windows with Super + Shift + Arrow", "Resized with Super + Minus or Super + Equal", "Closed all three with Super + W"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "Which hotkey swaps the focused window with its neighbor on the right?",
    "choices": ["Super + Right", "Super + Shift + Right", "Super + Alt + Right"],
    "answer": 1,
    "explain": "Super + Shift + Arrow swaps. Plain Super + Arrow only moves focus.",
    "why": ["Super + Right moves focus to the window on the right but does not move anything.", null, "Super + Alt + Arrow moves a window into a group, covered in Phase 3."]
  },
  {
    "q": "You want a smaller resize step than the default. What do you add to Super + Minus?",
    "choices": ["Shift", "Alt", "Ctrl"],
    "answer": 1,
    "explain": "Alt gives the smaller steps and Ctrl gives the bigger ones. Shift switches to the up and down keys.",
    "why": ["Shift switches to the up and down resize keys, not the step size.", null, "Ctrl gives the larger steps."]
  },
  {
    "q": "How do you bring back a window's width after saving it?",
    "choices": ["Super + Home", "Super + Alt + Home", "Super + Alt + Tab"],
    "answer": 0,
    "explain": "Super + Alt + Home saves the width and Super + Home restores it."
  }
]
```

## Recap

1. `Super + Arrow` moves focus. `Alt + Tab` cycles windows on the current workspace.
2. `Super + Shift + Arrow` swaps the focused window with a neighbor.
3. `Super + Minus` and `Super + Equal` resize in the default 100 pixel step. Add `Alt` for smaller steps and `Ctrl` for larger steps.
4. `Super + Alt + Home` saves a window's width and `Super + Home` restores it.
5. Holding `Super` with the mouse moves (left button) or resizes (right button) a window.

Next up, [Floating, Fullscreen, Grouping, and the Scrolling Layout](03-window-modes-and-layouts.md): the ways to step out of the default flow.
