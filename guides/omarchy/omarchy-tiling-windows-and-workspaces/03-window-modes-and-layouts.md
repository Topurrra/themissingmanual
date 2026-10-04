---
title: "Floating, Fullscreen, Grouping, and the Scrolling Layout"
guide: "omarchy-tiling-windows-and-workspaces"
phase: 3
summary: "The ways to step out of the default tiled flow: floating with Super + T, three kinds of fullscreen, popping a window into a sticky float with Super + O, the pseudo toggle, grouping windows, and switching a workspace to the scrolling layout with Super + L."
tags: [omarchy, hyprland, floating, fullscreen, grouping, scrolling-layout, pop-window]
difficulty: intermediate
synonyms: ["omarchy floating window", "omarchy fullscreen hotkey", "omarchy super o pop window", "omarchy scrolling layout super l", "omarchy group windows tabs", "omarchy make scrolling layout default", "omarchy full width window", "omarchy pseudo window"]
updated: 2026-10-04
---

# Floating, Fullscreen, Grouping, and the Scrolling Layout

Tiling is the default, not a prison. Omarchy gives you a handful of ways to take a window out of the flow for a while: let it float, fill the screen, follow you around, or share a slot with others. Each one is a single key, and each is a toggle, so pressing it again puts things back.

## Floating: Super + T

`Super + T` toggles the focused window between tiled and floating. A floating window keeps its own size and position and sits on top, like a classic desktop window. Activity (`Super + Ctrl + T`) starts out floating, which makes it a handy first thing to practice on.

The manual's advice is to give tiling a real chance before reaching for this. Floating suits a calculator, a small utility, or a window you want to compare briefly, not your main work.

## Three kinds of fullscreen

| Hotkey | What you get |
|---|---|
| `Super + F` | Full screen: the window covers everything |
| `Super + Alt + F` | Full width: the window fills the width but the top bar stays visible |
| `Super + Ctrl + F` | Full screen inside the window: the manual suggests it for YouTube |

Press the same key again to go back. Use `Super + Alt + F` when you want focus but still need the clock and workspaces visible.

## Popping a window: Super + O

`Super + O` pops a window out into a floating window that is pinned. The manual calls it "sticky'n'floating": it follows you to whatever workspace you go to. That makes it a good fit for a video player or a reference page you want visible while you work elsewhere.

Press `Super + O` again to put the window back.

## Pseudo: Super + P

`Super + P` toggles the pseudo window style, which the manual describes as natural versus stretch. It is a small, situational option. Try it on a window and press again to undo it.

## Grouping: several windows, one slot

A group puts several windows into one slot, and you move between them like tabs.

- `Super + G` toggles grouping. While it is on, every window you open joins the group.
- `Super + Ctrl + Left` and `Super + Ctrl + Right` move between the windows inside a group.
- `Super + Alt + Tab` cycles forward through the group, and `Super + Alt + Shift + Tab` cycles backward.
- `Super + Alt + 1/2/3/4/5` jumps to a specific window in the group.
- `Super + Alt + G` moves the focused window out of the group.
- `Super + Alt + Arrow` moves a window from outside into the group in that direction.
- `Super + G` again disassembles the whole group.

Groups help when one task owns many windows, such as several terminals, and you want one slot on screen instead of a crowded layout.

## The scrolling layout: Super + L

Dwindle fits every window on the screen, shrinking them as needed. The **scrolling layout** works the other way: windows line up side by side, extend past the edge of the display, and you scroll along them.

`Super + L` turns the current workspace into the scrolling layout, and pressing it again returns to dwindle. The same switch lives under _Trigger > Toggle > Workspace Layout_ in the Omarchy menu.

The choice is per workspace and it persists across restarts. The manual's example: keep workspace 1 on dwindle for browsing and workspace 2 on scrolling for code, and they come back that way after a restart.

To make scrolling the default for every workspace, edit `~/.config/hypr/looknfeel.lua`:

```lua
hl.config({
  general = {
    layout = "scrolling",
  },
})
```

Hyprland's configuration is Lua on Omarchy 4, and `looknfeel.lua` is where appearance and layout settings live. [Making Omarchy Comfortable](/guides/making-omarchy-comfortable) shows how the config files fit together, and the file can also be reached from _Style > Hyprland_ in the menu.

## Your turn: try each mode

```exercise
[
  {
    "type": "predict",
    "task": "You want a video to stay visible while you switch between workspaces. Which hotkey pops the window out into a sticky floating window?",
    "accept": ["Super + O", "Super+O", "/^super\\s*\\+\\s*o$/i"],
    "hint": "O as in pop out. The result follows you to every workspace."
  },
  {
    "type": "task",
    "task": "Open three windows on one workspace. Switch the workspace to the scrolling layout with `Super + L`, move focus between the windows with `Super + Arrow`, then switch back to dwindle. Then try `Super + F`, `Super + Alt + F`, and `Super + Ctrl + F` on one window, pressing each again to undo it.",
    "reveal": "In the scrolling layout, windows line up beyond the screen edge and focus moves along them. The three fullscreen keys differ: full screen covers everything, full width keeps the bar, and the third makes the content fullscreen inside the window.",
    "checklist": ["Switched a workspace to scrolling with Super + L", "Moved focus along the windows", "Returned to dwindle with Super + L", "Tried all three fullscreen variants and undid each"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You want a window to fill the screen width but keep the top bar visible. Which hotkey?",
    "choices": ["Super + F", "Super + Alt + F", "Super + Ctrl + F"],
    "answer": 1,
    "explain": "Super + Alt + F is full width, which keeps the bar. Super + F is full screen and Super + Ctrl + F is full screen inside the window.",
    "why": ["Super + F covers the whole screen, bar included.", null, "Super + Ctrl + F makes content fullscreen inside the window, which suits video."]
  },
  {
    "q": "Is the scrolling layout setting global or per workspace when you use Super + L?",
    "choices": ["Global, it changes every workspace", "Per workspace, and it persists across restarts", "Per window"],
    "answer": 1,
    "explain": "Super + L changes the current workspace only. The choice sticks across restarts. Setting layout = \"scrolling\" in looknfeel.lua changes the default for all of them."
  },
  {
    "q": "What makes a window popped with Super + O different from one floated with Super + T?",
    "choices": [
      "Nothing, they are the same",
      "The popped window is pinned and follows you across workspaces",
      "The popped window is fullscreen"
    ],
    "answer": 1,
    "explain": "Super + O floats and pins the window so it follows you across workspaces. Super + T floats it on its current workspace only."
  }
]
```

## Recap

1. `Super + T` toggles floating. Use tiling first and floating for small utilities.
2. `Super + F`, `Super + Alt + F`, and `Super + Ctrl + F` give full screen, full width with the bar, and full screen inside the window.
3. `Super + O` pops a window into a sticky floating window that follows you across workspaces.
4. `Super + G` groups windows into one slot, with `Super + Ctrl + Left/Right` to move between them.
5. `Super + L` switches a workspace between dwindle and the scrolling layout. The choice is per workspace and sticks.

Next up, [Workspaces, the Scratchpad, and Monitors](04-workspaces-scratchpad-monitors.md): separate desks, a quick overlay, and more than one screen.
